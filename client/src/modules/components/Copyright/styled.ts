/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import styled, {css} from 'styled-components';

const Container = styled.div`
  ${({theme}) => {
    const opacity = theme.opacity.modules.copyright;

    return css`
      color: ${theme.colors.text02};
      opacity: ${opacity};
      font-size: 12px;
      width: 100%;
    `;
  }}
`;

export {Container};
