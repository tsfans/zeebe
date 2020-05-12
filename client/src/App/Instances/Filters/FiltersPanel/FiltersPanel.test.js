/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a commercial license.
 * You may not use this file except in compliance with the commercial license.
 */

import React from 'react';
import {render, screen} from '@testing-library/react';

import {FiltersPanel} from '.';

import {instances} from 'modules/stores/instances';

const props = {
  isFiltersCollapsed: false,
  toggleFilters: () => {},
  toggle: () => {},
  isCollapsed: true,
};

describe('<FiltersPanel />', () => {
  it('should show filteredInstancesCount', async () => {
    instances.setInstances({
      filteredInstancesCount: 909,
      workflowInstances: [],
    });

    render(<FiltersPanel {...props} />);

    const filterBadges = screen.getAllByTestId('filter-panel-header-badge');

    expect(filterBadges).toHaveLength(2);
    expect(filterBadges[0]).toHaveTextContent('909');
    expect(filterBadges[1]).toHaveTextContent('909');
  });
});
