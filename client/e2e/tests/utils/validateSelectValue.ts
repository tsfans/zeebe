/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {within} from '@testing-library/testcafe';
import {t} from 'testcafe';

const validateSelectValue = async (
  field: Selector | SelectorPromise,
  text: string
) => {
  await t.expect(within(field.shadowRoot()).queryByText(text).exists).ok();
};

export {validateSelectValue};
