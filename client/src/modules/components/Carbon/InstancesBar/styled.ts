/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import styled, {css} from 'styled-components';
import {styles} from '@carbon/elements';

type WrapperProps = {
  $size: 'small' | 'medium' | 'large';
};

const getFontStyle = ({$size}: WrapperProps) => {
  return css`
    ${$size === 'small' &&
    css`
      ${styles.bodyCompact01};
      color: var(--cds-text-secondary);
    `}
    ${$size === 'medium' &&
    css`
      ${styles.heading01};
      color: var(--cds-text-primary);
    `}
    ${$size === 'large' &&
    css`
      ${styles.heading02};
      color: var(--cds-text-primary);
    `}
  `;
};

const Wrapper = styled.div<WrapperProps>`
  ${({$size}) => {
    return css`
      display: flex;
      ${getFontStyle({$size})};
    `;
  }}
`;

type IncidentsCountProps = {
  hasIncidents?: boolean;
};

const IncidentsCount = styled.div<IncidentsCountProps>`
  ${({hasIncidents}) => {
    return css`
      min-width: var(--cds-spacing-09);
      ${hasIncidents
        ? css`
            color: var(--cds-text-error);
          `
        : css`
            color: var(--cds-text-secondary);
          `}
    `;
  }}
`;

type ActiveCountProps = {
  $hasActiveInstances?: boolean;
};

const ActiveCount = styled.div<ActiveCountProps>`
  ${({$hasActiveInstances}) => {
    return css`
      margin-left: auto;
      width: 139px;
      text-align: right;
      color: ${$hasActiveInstances
        ? 'var(--cds-support-success)'
        : 'var(--cds-text-primary)'};
    `;
  }}
`;

type LabelProps = {
  $isRed?: boolean;
  $size?: 'small' | 'medium';
};

const Label = styled.div<LabelProps>`
  ${({$size, $isRed}) => {
    return css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      ${styles.bodyCompact01}
      color: var(--cds-text-secondary);
      ${$size === 'medium' &&
      css`
        ${styles.headingCompact01}
        color: var(--cds-text-primary);
      `}
      ${$isRed &&
      css`
        color: var(--cds-text-error);
      `}
    `;
  }}
`;

const BarContainer = styled.div`
  position: relative;
  margin: var(--cds-spacing-03) 0;
`;

type ActiveBarProps = {
  $isPassive?: boolean;
};

const barStyles = css`
  height: var(--cds-spacing-02);
`;

const ActiveInstancesBar = styled.div<ActiveBarProps>`
  ${({$isPassive}) => {
    return css`
      ${barStyles}
      background: ${$isPassive
        ? 'var(--cds-border-subtle-01)'
        : 'var(--cds-support-success)'};
    `;
  }}
`;

const IncidentsBar = styled.div`
  ${barStyles}
  position: absolute;
  top: 0;
  background: var(--cds-support-error);
`;

export {
  Wrapper,
  IncidentsCount,
  ActiveCount,
  Label,
  BarContainer,
  ActiveInstancesBar,
  IncidentsBar,
};
