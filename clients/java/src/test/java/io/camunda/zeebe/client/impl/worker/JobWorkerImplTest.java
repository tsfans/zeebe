/*
 * Copyright © 2017 camunda services GmbH (info@camunda.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.camunda.zeebe.client.impl.worker;

import static io.camunda.zeebe.client.impl.ZeebeClientBuilderImpl.ZEEBE_CLIENT_WORKER_STREAM_ENABLED;
import static org.assertj.core.api.Assertions.assertThat;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.worker.JobHandler;
import io.camunda.zeebe.client.api.worker.JobWorker;
import io.camunda.zeebe.client.api.worker.JobWorkerBuilderStep1.JobWorkerBuilderStep3;
import io.camunda.zeebe.client.impl.ZeebeClientBuilderImpl;
import io.camunda.zeebe.client.impl.ZeebeClientImpl;
import io.camunda.zeebe.client.impl.util.Environment;
import io.camunda.zeebe.gateway.protocol.GatewayGrpc;
import io.camunda.zeebe.gateway.protocol.GatewayGrpc.GatewayImplBase;
import io.camunda.zeebe.gateway.protocol.GatewayOuterClass.ActivateJobsRequest;
import io.camunda.zeebe.gateway.protocol.GatewayOuterClass.ActivateJobsResponse;
import io.camunda.zeebe.gateway.protocol.GatewayOuterClass.ActivatedJob;
import io.camunda.zeebe.gateway.protocol.GatewayOuterClass.StreamActivatedJobsRequest;
import io.grpc.ManagedChannel;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import io.grpc.testing.GrpcCleanupRule;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.awaitility.Awaitility;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@SuppressWarnings("resource")
@RunWith(JUnit4.class)
public final class JobWorkerImplTest {

  private static final JobHandler NOOP_JOB_HANDLER = (client, job) -> {};
  private static final long SLOW_POLL_DELAY_IN_MS = 1_000L;
  private static final Duration SLOW_POLL_THRESHOLD = Duration.ofMillis(SLOW_POLL_DELAY_IN_MS / 2);

  @Rule public final GrpcCleanupRule grpcCleanup = new GrpcCleanupRule();

  private MockedGateway gateway;
  private ZeebeClient client;
  private ManagedChannel channel;

  @Before
  public void setup() throws IOException {
    gateway = new MockedGateway();

    // ensure all gRPC resources are registered for cleanup. Since clients identify the in-process
    // server by its name, these names should be unique. gRPC advocates this in its test examples:
    // see https://github.com/grpc/grpc-java/tree/v1.35.0/examples/src/test/java/io/grpc/examples
    final String serverName = InProcessServerBuilder.generateName();
    grpcCleanup.register(
        InProcessServerBuilder.forName(serverName)
            .directExecutor()
            .addService(gateway)
            .build()
            .start());
    channel =
        grpcCleanup.register(InProcessChannelBuilder.forName(serverName).directExecutor().build());

    client =
        new ZeebeClientImpl(new ZeebeClientBuilderImpl(), channel, GatewayGrpc.newStub(channel));
  }

  @Test
  public void shouldBackoffWhenGatewayRespondsWithResourceExhausted() {
    // given a gateway that responds with some jobs
    gateway.respondWith(TestData.jobs(10));

    // and a client with retry delay supplier that is slowing down polling
    client
        .newWorker()
        .jobType("test")
        .handler(NOOP_JOB_HANDLER)
        .backoffSupplier(prev -> SLOW_POLL_DELAY_IN_MS)
        .open();

    // and assuming that the gateway responded multiple times successfully with jobs
    gateway.startMeasuring();
    Awaitility.await()
        .pollInterval(Duration.ofMillis(10))
        .atMost(Duration.ofSeconds(1))
        .until(() -> gateway.getCountedPolls() > 3);
    gateway.stopMeasuring();

    // then polling is fast
    assertThat(gateway.getTimeBetweenLatestPolls()).isLessThan(SLOW_POLL_THRESHOLD);

    // when the gateway responds with errors
    gateway.respondWith(new StatusRuntimeException(Status.RESOURCE_EXHAUSTED));

    // then polling is slowed down
    gateway.startMeasuring();
    Awaitility.await()
        .pollInterval(Duration.ofMillis(100))
        .atMost(Duration.ofSeconds(5))
        .untilAsserted(
            () ->
                assertThat(gateway.getTimeBetweenLatestPolls()).isGreaterThan(SLOW_POLL_THRESHOLD));
  }

  @Test
  public void shouldBackoffWhenStreamEnabledOnPollSuccessAndResponseIsEmpty() {
    // given a gateway that responds with some jobs
    gateway.respondWith(TestData.jobs(0));

    // and a client with stream enabled and retry delay supplier that is slowing down polling
    client
        .newWorker()
        .jobType("test")
        .handler(NOOP_JOB_HANDLER)
        .backoffSupplier(prev -> SLOW_POLL_DELAY_IN_MS)
        .streamEnabled(true)
        .open();

    // and assuming that the gateway responded multiple times successfully
    gateway.startMeasuring();
    Awaitility.await()
        .pollInterval(Duration.ofMillis(10))
        .atMost(Duration.ofSeconds(5))
        .until(() -> gateway.getCountedPolls() > 3);
    gateway.stopMeasuring();

    // since stream is enabled then we expect the poll to backoff
    assertThat(gateway.getTimeBetweenLatestPolls()).isGreaterThan(SLOW_POLL_THRESHOLD);

    client.close();
  }

  @Test
  public void shouldOpenStreamIfOptedIn() {
    // given
    final JobWorkerBuilderStep3 builder =
        client.newWorker().jobType("test").handler(NOOP_JOB_HANDLER).streamEnabled(true);

    // when
    try (final JobWorker ignored = builder.open()) {
      // then
      Awaitility.await("until a stream is open")
          .pollInterval(Duration.ofMillis(100))
          .atMost(Duration.ofSeconds(5))
          .untilAsserted(() -> assertThat(gateway.openStreams).hasSize(1));
    }
  }

  @Test
  public void workerBuilderShouldOverrideEnvVariables() {
    // given
    Environment.system().put(ZEEBE_CLIENT_WORKER_STREAM_ENABLED, "false");

    final ZeebeClientBuilderImpl builder = new ZeebeClientBuilderImpl();
    builder.applyEnvironmentVariableOverrides(true).build();
    final ZeebeClient zeebeClient =
        new ZeebeClientImpl(builder, channel, GatewayGrpc.newStub(channel));

    final JobWorkerBuilderStep3 jobWorkerBuilderStep3 =
        zeebeClient.newWorker().jobType("test").handler(NOOP_JOB_HANDLER).streamEnabled(true);

    // when
    try (final JobWorker ignored = jobWorkerBuilderStep3.open()) {
      // then
      Awaitility.await("until a stream is open")
          .pollInterval(Duration.ofMillis(100))
          .atMost(Duration.ofSeconds(5))
          .untilAsserted(() -> assertThat(gateway.openStreams).hasSize(1));
    }
  }

  /**
   * This mocked gateway is able to record metrics on polling for new jobs and easily switch how it
   * responds to polling.
   *
   * <ul>
   *   Due to the concurrent nature of the test setup and the job worker, 2 lock objects are used:
   *   <li>responsesLock to lock access to the mocking of responses objects for test setup;
   *   <li>metricsLock to lock access to the polling metrics objects.
   * </ul>
   */
  private static final class MockedGateway extends GatewayImplBase {

    private final Map<StreamActivatedJobsRequest, StreamObserver<ActivatedJob>> openStreams =
        new HashMap<>();
    private final Object responsesLock = new Object();
    private boolean isInErrorMode = false;
    private ActivateJobsResponse pollSuccessResponse = ActivateJobsResponse.newBuilder().build();
    private StatusRuntimeException pollErrorResponse = new StatusRuntimeException(Status.UNKNOWN);

    private final Object metricsLock = new Object();
    private boolean isMeasuring = false;
    private long countedPolls = 0;
    private Instant lastPoll = null;
    private Duration timeBetweenLatestPolls = null;

    @Override
    public void activateJobs(
        final ActivateJobsRequest request,
        final StreamObserver<ActivateJobsResponse> responseObserver) {
      synchronized (metricsLock) {
        if (isMeasuring) {
          final Instant now = Instant.now();
          countedPolls++;
          if (lastPoll != null) {
            timeBetweenLatestPolls = Duration.between(lastPoll, now);
          }
          lastPoll = now;
        }
      }
      synchronized (responsesLock) {
        if (isInErrorMode) {
          responseObserver.onError(pollErrorResponse);
        } else {
          responseObserver.onNext(pollSuccessResponse);
          responseObserver.onCompleted();
        }
      }
    }

    @Override
    public void streamActivatedJobs(
        final StreamActivatedJobsRequest request,
        final StreamObserver<ActivatedJob> responseObserver) {
      final ServerCallStreamObserver<ActivatedJob> observer =
          (ServerCallStreamObserver<ActivatedJob>) responseObserver;
      openStreams.put(request, responseObserver);
      observer.setOnCancelHandler(() -> openStreams.remove(request));
      observer.setOnCloseHandler(() -> openStreams.remove(request));
    }

    public void respondWith(final List<ActivatedJob> jobs) {
      synchronized (responsesLock) {
        System.out.println("Now responding with jobs");
        isInErrorMode = false;
        pollSuccessResponse = ActivateJobsResponse.newBuilder().addAllJobs(jobs).build();
      }
    }

    public void respondWith(final StatusRuntimeException throwable) {
      synchronized (responsesLock) {
        System.out.println("Now responding exceptionally");
        isInErrorMode = true;
        pollErrorResponse = throwable;
      }
    }

    public void startMeasuring() {
      synchronized (metricsLock) {
        countedPolls = 0;
        lastPoll = null;
        timeBetweenLatestPolls = null;
        isMeasuring = true;
      }
    }

    public void stopMeasuring() {
      synchronized (metricsLock) {
        isMeasuring = false;
      }
    }

    public Duration getTimeBetweenLatestPolls() {
      synchronized (metricsLock) {
        return timeBetweenLatestPolls;
      }
    }

    public long getCountedPolls() {
      synchronized (metricsLock) {
        return countedPolls;
      }
    }
  }
}
