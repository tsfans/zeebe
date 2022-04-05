/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import styled from 'styled-components';

const DecisionInstanceContainer = styled.div`
  height: 100%;
  position: relative;
  display: grid;
  grid-template-rows: 56px 1fr;
`;

const Container = styled.div`
  height: 100%;
`;

const PanelContainer = styled.div`
  overflow: hidden;
`;

export {Container, DecisionInstanceContainer, PanelContainer};
