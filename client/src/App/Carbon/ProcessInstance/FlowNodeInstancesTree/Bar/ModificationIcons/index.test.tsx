/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {act, render, screen} from 'modules/testing-library';
import {ThemeProvider} from 'modules/theme/ThemeProvider';
import {ModificationIcons} from './index';
import {modificationsStore} from 'modules/stores/modifications';
import {mockFetchProcessXML} from 'modules/mocks/api/processes/fetchProcessXML';
import {processInstanceDetailsDiagramStore} from 'modules/stores/processInstanceDetailsDiagram';
import {mockFetchProcessInstanceDetailStatistics} from 'modules/mocks/api/processInstances/fetchProcessInstanceDetailStatistics';
import {useEffect} from 'react';
import {open} from 'modules/mocks/diagrams';

type Props = {
  children?: React.ReactNode;
};

const Wrapper = ({children}: Props) => {
  useEffect(() => {
    return modificationsStore.reset;
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
};

describe('<ModificationIcons />', () => {
  beforeEach(() => {
    mockFetchProcessInstanceDetailStatistics().withSuccess([
      {
        activityId: 'parent_sub_process',
        active: 3,
        incidents: 0,
        completed: 0,
        canceled: 0,
      },
      {
        activityId: 'inner_sub_process',
        active: 3,
        incidents: 0,
        completed: 0,
        canceled: 0,
      },
      {
        activityId: 'user_task',
        active: 3,
        incidents: 0,
        completed: 0,
        canceled: 0,
      },
    ]);

    mockFetchProcessXML().withSuccess(open('diagramForModifications.bpmn'));
  });

  it('should show correct icons for modifications planning to be added', () => {
    render(
      <ModificationIcons
        flowNodeInstance={{
          flowNodeId: 'some-flow-node-id',
          isPlaceholder: true,
          endDate: null,
          treePath:
            'some-other-parent-flow-node-id/some-parent-flow-node-id/some-flow-node-id',
        }}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(
      screen.getByTitle(
        'Ensure to add/edit variables if required, input/output mappings are not executed during modification',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByTitle('This flow node instance is planned to be added'),
    ).toBeInTheDocument();
  });

  it('should show modification planned to be canceled icon if all the running tokens on the flow node is canceled', async () => {
    await processInstanceDetailsDiagramStore.fetchProcessXml(
      'processInstanceId',
    );

    render(
      <ModificationIcons
        flowNodeInstance={{
          flowNodeId: 'user_task',
          isPlaceholder: false,
          endDate: null,
          treePath:
            'some-other-parent-flow-node-id/some-parent-flow-node-id/some-flow-node-id',
        }}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(
      screen.queryByTitle('This flow node instance is planned to be canceled'),
    ).not.toBeInTheDocument();

    act(() => modificationsStore.cancelAllTokens('user_task'));

    expect(
      screen.getByTitle('This flow node instance is planned to be canceled'),
    ).toBeInTheDocument();
  });

  it('should show modification planned to be canceled icon if one of the running tokens on the flow node is canceled', async () => {
    await processInstanceDetailsDiagramStore.fetchProcessXml(
      'processInstanceId',
    );

    render(
      <ModificationIcons
        flowNodeInstance={{
          flowNodeId: 'user_task',
          isPlaceholder: false,
          endDate: null,
          treePath:
            'some-other-parent-flow-node-id/some-parent-flow-node-id/some-flow-node-id',
        }}
      />,
      {
        wrapper: Wrapper,
      },
    );

    act(() => modificationsStore.cancelToken('user_task', 'some-flow-node-id'));

    expect(
      screen.getByTitle('This flow node instance is planned to be canceled'),
    ).toBeInTheDocument();
  });

  it('should not show modification planned to be canceled icon if one of the other running tokens on the flow node is canceled', async () => {
    await processInstanceDetailsDiagramStore.fetchProcessXml(
      'processInstanceId',
    );

    render(
      <ModificationIcons
        flowNodeInstance={{
          flowNodeId: 'user_task',
          isPlaceholder: false,
          endDate: null,
          treePath:
            'some-other-parent-flow-node-id/some-parent-flow-node-id/some-flow-node-id',
        }}
      />,
      {
        wrapper: Wrapper,
      },
    );

    act(() =>
      modificationsStore.cancelToken('user_task', 'some-other-flow-node-id'),
    );

    expect(
      screen.queryByTitle('This flow node instance is planned to be canceled'),
    ).not.toBeInTheDocument();
  });

  it('should show modification planned to be canceled icon if one of the parent running tokens on the flow node is canceled', async () => {
    await processInstanceDetailsDiagramStore.fetchProcessXml(
      'processInstanceId',
    );

    render(
      <ModificationIcons
        flowNodeInstance={{
          flowNodeId: 'user_task',
          isPlaceholder: false,
          endDate: null,
          treePath:
            'some-other-parent-flow-node-id/some-parent-flow-node-id/some-flow-node-id',
        }}
      />,
      {
        wrapper: Wrapper,
      },
    );

    act(() =>
      modificationsStore.cancelToken('user_task', 'some-parent-flow-node-id'),
    );

    expect(
      screen.getByTitle('This flow node instance is planned to be canceled'),
    ).toBeInTheDocument();
  });

  it('should show modification planned to be canceled icon if one of the other parent running tokens on the flow node is canceled', async () => {
    await processInstanceDetailsDiagramStore.fetchProcessXml(
      'processInstanceId',
    );

    render(
      <ModificationIcons
        flowNodeInstance={{
          flowNodeId: 'user_task',
          isPlaceholder: false,
          endDate: null,
          treePath:
            'some-other-parent-flow-node-id/some-parent-flow-node-id/some-flow-node-id',
        }}
      />,
      {
        wrapper: Wrapper,
      },
    );

    act(() =>
      modificationsStore.cancelToken(
        'user_task',
        'some-second-parent-flow-node-id',
      ),
    );

    expect(
      screen.queryByTitle('This flow node instance is planned to be canceled'),
    ).not.toBeInTheDocument();
  });
});
