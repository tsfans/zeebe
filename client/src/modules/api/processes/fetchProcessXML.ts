/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {requestAndParse} from 'modules/request';

const fetchProcessXML = async (
  processId: ProcessInstanceEntity['processId'],
) => {
  return requestAndParse<string>({url: `/api/processes/${processId}/xml`});
};

export {fetchProcessXML};
