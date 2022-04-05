/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */
package io.camunda.operate.zeebeimport.v1_3.record.value;

import io.camunda.operate.zeebeimport.v1_3.record.RecordValueImpl;
import io.camunda.zeebe.protocol.record.value.VariableDocumentRecordValue;
import io.camunda.zeebe.protocol.record.value.VariableDocumentUpdateSemantic;
import java.util.Map;

public class VariableDocumentRecordImpl extends RecordValueImpl implements VariableDocumentRecordValue {

  private VariableDocumentUpdateSemantic updateSemantics;
  private long scopeKey;
  private Map<String, Object> variables;

  @Override
  public long getScopeKey() {
    return scopeKey;
  }

  @Override
  public VariableDocumentUpdateSemantic getUpdateSemantics() {
    return updateSemantics;
  }

  @Override
  public Map<String, Object> getVariables() {
    return variables;
  }

  public void setUpdateSemantics(VariableDocumentUpdateSemantic updateSemantics) {
    this.updateSemantics = updateSemantics;
  }

  public void setScopeKey(long scopeKey) {
    this.scopeKey = scopeKey;
  }

  public void setVariables(Map<String, Object> variables) {
    this.variables = variables;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;

    VariableDocumentRecordImpl that = (VariableDocumentRecordImpl) o;

    if (scopeKey != that.scopeKey)
      return false;
    if (updateSemantics != that.updateSemantics)
      return false;
    return variables != null ? variables.equals(that.variables) : that.variables == null;

  }

  @Override
  public int hashCode() {
    int result = updateSemantics != null ? updateSemantics.hashCode() : 0;
    result = 31 * result + (int) (scopeKey ^ (scopeKey >>> 32));
    result = 31 * result + (variables != null ? variables.hashCode() : 0);
    return result;
  }
}
