/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {BpmnElement} from 'bpmn-js/lib/NavigatedViewer';
import {isFlowNode} from 'modules/utils/flowNodes';

function isNonSelectableFlowNode(
  bpmnElement: BpmnElement,
  selectableFlowNodes?: string[],
) {
  return (
    selectableFlowNodes !== undefined &&
    !selectableFlowNodes.includes(bpmnElement.id) &&
    bpmnElement.type !== 'label' &&
    isFlowNode(bpmnElement.businessObject)
  );
}

export {isNonSelectableFlowNode};
