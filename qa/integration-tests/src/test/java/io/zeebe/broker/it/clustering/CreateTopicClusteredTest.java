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
package io.zeebe.broker.it.clustering;

import static io.zeebe.test.util.TestUtil.doRepeatedly;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import io.zeebe.broker.it.ClientRule;
import io.zeebe.client.ZeebeClient;
import io.zeebe.client.clustering.impl.TopicLeader;
import io.zeebe.client.event.Event;
import io.zeebe.client.event.TaskEvent;
import io.zeebe.client.topic.Topic;
import io.zeebe.client.topic.Topics;
import io.zeebe.test.util.AutoCloseableRule;
import io.zeebe.transport.SocketAddress;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.RuleChain;
import org.junit.rules.Timeout;

public class CreateTopicClusteredTest
{
    private static final int PARTITION_COUNT = 5;

    public AutoCloseableRule closeables = new AutoCloseableRule();
    public Timeout testTimeout = Timeout.seconds(30);
    public ClientRule clientRule = new ClientRule(false);
    public ClusteringRule clusteringRule = new ClusteringRule(closeables, clientRule);

    @Rule
    public RuleChain ruleChain =
        RuleChain.outerRule(closeables)
                 .around(testTimeout)
                 .around(clientRule)
                 .around(clusteringRule);

    private ZeebeClient client;

    @Before
    public void setUp()
    {
        client = clientRule.getClient();
    }

    @Test
    public void shouldCreateTopic()
    {
        // given

        // when
        final Event topicEvent = client.topics()
                                .create("foo", PARTITION_COUNT)
                                .execute();

        final List<SocketAddress> topicLeaders =
            clusteringRule.waitForGreaterOrEqualLeaderCount(PARTITION_COUNT)
                          .stream()
                          .filter((topicLeader -> topicLeader.getTopicName().equals("foo")))
                          .map((topicLeader -> topicLeader.getSocketAddress()))
                          .collect(Collectors.toList());


        // then
        assertThat(topicEvent.getState()).isEqualTo("CREATED");
        assertThat(topicLeaders.size()).isEqualTo(PARTITION_COUNT);
        clusteringRule.assertThatBrokersListContains(topicLeaders);
    }

    @Test
    public void shouldRequestTopicsAfterTopicCreation()
    {
        // given
        client.topics()
              .create("foo", PARTITION_COUNT)
              .execute();

        clusteringRule.waitForGreaterOrEqualLeaderCount(PARTITION_COUNT);

        // when
        final Topics topicsResponse = doRepeatedly(() -> client.topics()
                                                      .getTopics()
                                                      .execute()).until((topics -> topics.getTopics()
                                                                                         .size() == 1));
        final List<Topic> topics = topicsResponse.getTopics();

        // then
        assertThat(topics.size()).isEqualTo(1);
        assertThat(topics.get(0).getName()).isEqualTo("foo");
        final List<Integer> partitions = topics.get(0)
                                                 .getPartitions()
                                                 .stream()
                                                 .map((partition -> partition.getId()))
                                                 .collect(Collectors.toList());

        assertThat(partitions.size()).isEqualTo(5);
        assertThat(partitions).containsExactlyInAnyOrder(1, 2, 3, 4, 5);
    }

    @Test
    public void shouldCreateTaskAfterTopicCreation()
    {
        // given

        // when
        client.topics().create("foo", PARTITION_COUNT).execute();
        clusteringRule.waitForGreaterOrEqualLeaderCount(PARTITION_COUNT);

        // then
        final TaskEvent taskEvent = client.tasks().create("foo", "bar").execute();

        assertThat(taskEvent).isNotNull();
        assertThat(taskEvent.getState()).isEqualTo("CREATED");
    }

    @Test
    public void shouldChooseNewLeaderForCreatedTopicAfterLeaderDies()
    {
        // given
        final int partitionsCount = 1;
        client.topics().create("foo", partitionsCount).execute();
        final TaskEvent taskEvent = client.tasks().create("foo", "bar").execute();
        final int partitionId = taskEvent.getMetadata().getPartitionId();

        final List<TopicLeader> topicLeaders = clusteringRule.waitForGreaterOrEqualLeaderCount(partitionsCount + 1);
        final TopicLeader topicLeader = clusteringRule.filterLeadersByPartition(topicLeaders, partitionId);

        final SocketAddress currentLeaderAddress = topicLeader.getSocketAddress();

        final Set<SocketAddress> expectedFollowers = new HashSet<>(clusteringRule.getBrokerAddresses());
        expectedFollowers.remove(currentLeaderAddress);

        // when
        clusteringRule.stopBroker(currentLeaderAddress);

        // then
        final List<TopicLeader> newTopicLeaders = clusteringRule.waitForGreaterOrEqualLeaderCount(partitionsCount + 1);
        final TopicLeader newLeader = clusteringRule.filterLeadersByPartition(newTopicLeaders, partitionId);

        final SocketAddress newLeaderAddress = newLeader.getSocketAddress();
        assertThat(expectedFollowers).contains(newLeaderAddress);
    }
}
