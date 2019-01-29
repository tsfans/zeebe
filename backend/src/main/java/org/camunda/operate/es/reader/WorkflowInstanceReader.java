package org.camunda.operate.es.reader;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.camunda.operate.entities.WorkflowInstanceEntity;
import org.camunda.operate.es.schema.templates.WorkflowInstanceTemplate;
import org.camunda.operate.property.OperateProperties;
import org.camunda.operate.rest.exception.NotFoundException;
import org.camunda.operate.util.ElasticsearchUtil;
import org.elasticsearch.action.search.SearchRequestBuilder;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.transport.TransportClient;
import org.elasticsearch.common.unit.TimeValue;
import org.elasticsearch.index.query.IdsQueryBuilder;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.search.SearchHits;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.camunda.operate.entities.OperationState.LOCKED;
import static org.camunda.operate.entities.OperationState.SCHEDULED;
import static org.camunda.operate.es.schema.templates.WorkflowInstanceTemplate.LOCK_EXPIRATION_TIME;
import static org.camunda.operate.es.schema.templates.WorkflowInstanceTemplate.OPERATIONS;
import static org.camunda.operate.es.schema.templates.WorkflowInstanceTemplate.STATE;
import static org.camunda.operate.util.ElasticsearchUtil.joinWithAnd;
import static org.elasticsearch.index.query.QueryBuilders.boolQuery;
import static org.elasticsearch.index.query.QueryBuilders.constantScoreQuery;
import static org.elasticsearch.index.query.QueryBuilders.existsQuery;
import static org.elasticsearch.index.query.QueryBuilders.idsQuery;
import static org.elasticsearch.index.query.QueryBuilders.termQuery;

@Component
public class WorkflowInstanceReader {

  private static final Logger logger = LoggerFactory.getLogger(WorkflowInstanceReader.class);

  private static final String OPERATION_STATE_TERM = String.format("%s.%s", OPERATIONS, STATE);
  private static final String SCHEDULED_OPERATION = SCHEDULED.toString();
  private static final String LOCKED_OPERATION = LOCKED.toString();
  private static final String LOCK_EXPIRATION_TIME_TERM = String.format("%s.%s", OPERATIONS, LOCK_EXPIRATION_TIME);

  @Autowired
  private TransportClient esClient;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private WorkflowInstanceTemplate workflowInstanceTemplate;

  @Autowired
  private OperateProperties operateProperties;

  @Autowired
  private DateTimeFormatter dateTimeFormatter;

  /**
   *
   * @param workflowId
   * @return
   */
  public List<String> queryWorkflowInstancesWithEmptyWorkflowVersion(long workflowId) {

    final QueryBuilder queryBuilder =
      joinWithAnd(
        termQuery(WorkflowInstanceTemplate.WORKFLOW_ID, workflowId),
        boolQuery()
          .mustNot(existsQuery(WorkflowInstanceTemplate.WORKFLOW_VERSION)));
    //workflow name can be null, as some workflows does not have name


    final SearchRequestBuilder searchRequestBuilder =
      esClient.prepareSearch(workflowInstanceTemplate.getAlias())
        .setQuery(constantScoreQuery(queryBuilder))
        .setFetchSource(false);

    return scrollIds(searchRequestBuilder);
  }

  private List<String> scrollIds(SearchRequestBuilder builder) {
    List<String> result = new ArrayList<>();
    TimeValue keepAlive = new TimeValue(5000);
    SearchResponse response = builder
      .setScroll(keepAlive)
      .get();
    do {
      SearchHits hits = response.getHits();
      String scrollId = response.getScrollId();

      result.addAll(Arrays.stream(hits.getHits()).collect(ArrayList::new, (list, hit) -> list.add(hit.getId()), (list1, list2) -> list1.addAll(list2)));

      response = esClient
          .prepareSearchScroll(scrollId)
          .setScroll(keepAlive)
          .get();

    } while (response.getHits().getHits().length != 0);
    return result;
  }

  /**
   * Searches for workflow instance by id.
   * @param workflowInstanceId
   * @return
   */
  public WorkflowInstanceEntity getWorkflowInstanceById(String workflowInstanceId) {
    final IdsQueryBuilder q = idsQuery().addIds(workflowInstanceId);

    final SearchResponse response = esClient.prepareSearch(workflowInstanceTemplate.getAlias())
      .setQuery(q)
      .get();

    if (response.getHits().totalHits == 1) {
      return ElasticsearchUtil.fromSearchHit(response.getHits().getHits()[0].getSourceAsString(), objectMapper, WorkflowInstanceEntity.class);
    } else if (response.getHits().totalHits > 1) {
      throw new NotFoundException(String.format("Could not find unique workflow instance with id '%s'.", workflowInstanceId));
    } else {
      throw new NotFoundException(String.format("Could not find workflow instance with id '%s'.", workflowInstanceId));
    }
  }

}
