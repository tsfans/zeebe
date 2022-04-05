/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {waitFor} from '@testing-library/react';
import {mockServer} from 'modules/mock-server/node';
import {groupedDecisions} from 'modules/mocks/groupedDecisions';
import {rest} from 'msw';
import {groupedDecisionsStore} from './groupedDecisions';

describe('groupedDecisionsStore', () => {
  afterEach(() => {
    groupedDecisionsStore.reset();
  });

  describe('fetch success', () => {
    beforeEach(async () => {
      mockServer.use(
        rest.get('/api/decisions/grouped', (_, res, ctx) =>
          res.once(ctx.json(groupedDecisions))
        )
      );

      expect(groupedDecisionsStore.state.status).toBe('initial');

      groupedDecisionsStore.fetchDecisions();

      await waitFor(() => {
        expect(groupedDecisionsStore.state.status).toBe('fetched');
      });
    });

    it('should fetch grouped decisions', () => {
      expect(groupedDecisionsStore.state.decisions).toEqual(groupedDecisions);
      expect(groupedDecisionsStore.areDecisionsEmpty).toBe(false);
    });

    it('should get decision definition id', () => {
      expect(
        groupedDecisionsStore.getDecisionDefinitionId({
          decisionId: 'invoice-assign-approver',
          version: 1,
        })
      ).toEqual('0');
    });

    it('should get decision name', () => {
      const [firstDecision, secondDecision, thirdDecision] = groupedDecisions;
      const {getDecisionName} = groupedDecisionsStore;

      expect(getDecisionName(firstDecision.decisionId)).toBe(
        firstDecision.name
      );
      expect(getDecisionName(secondDecision.decisionId)).toBe(
        secondDecision.decisionId
      );
      expect(getDecisionName(thirdDecision.decisionId)).toBe(
        thirdDecision.name
      );
      expect(getDecisionName('invalidId')).toBeUndefined();
      expect(getDecisionName(null)).toBeUndefined();
    });

    it('should return null for invalid decision ids', () => {
      expect(
        groupedDecisionsStore.getDecisionDefinitionId({
          decisionId: 'invalidDecisionId',
          version: 1,
        })
      ).toEqual(null);
    });

    it('should get sorted decision options', () => {
      const [firstDecision, secondDecision, thirdDecision] = groupedDecisions;

      expect(groupedDecisionsStore.decisions).toEqual([
        {
          label: firstDecision.name,
          value: firstDecision.decisionId,
        },
        {
          label: thirdDecision.name,
          value: thirdDecision.decisionId,
        },
        {
          label: secondDecision.decisionId,
          value: secondDecision.decisionId,
        },
      ]);
    });

    it('should get decision versions by id', () => {
      const [firstDecision, secondDecision, thirdDecision] = groupedDecisions;
      const [version2, version1] = firstDecision.decisions;

      expect(
        groupedDecisionsStore.decisionVersionsById['invoice-assign-approver']
      ).toEqual([version1, version2]);
      expect(
        groupedDecisionsStore.decisionVersionsById['invoiceClassification']
      ).toEqual(secondDecision.decisions);
      expect(
        groupedDecisionsStore.decisionVersionsById['calc-key-figures']
      ).toEqual(thirdDecision.decisions);
    });

    it('should get versions', () => {
      expect(
        groupedDecisionsStore.getVersions('invoiceClassification')
      ).toEqual([1]);
      expect(
        groupedDecisionsStore.getVersions('invoice-assign-approver')
      ).toEqual([1, 2]);
      expect(groupedDecisionsStore.getVersions('invalidDecisionId')).toEqual(
        []
      );
    });

    it('should get default version', () => {
      expect(
        groupedDecisionsStore.getDefaultVersion('invoiceClassification')
      ).toBe(1);
      expect(
        groupedDecisionsStore.getDefaultVersion('invoice-assign-approver')
      ).toBe(2);
      expect(
        groupedDecisionsStore.getDefaultVersion('invalidDecisionId')
      ).toBeUndefined();
    });
  });

  describe('fetch error', () => {
    beforeEach(async () => {
      mockServer.use(
        rest.get('/api/decisions/grouped', (_, res, ctx) =>
          res.once(ctx.status(500))
        )
      );

      groupedDecisionsStore.fetchDecisions();

      await waitFor(() => {
        expect(groupedDecisionsStore.state.status === 'error').toBe(true);
      });
    });

    it('should keep decisions empty', () => {
      expect(groupedDecisionsStore.state.decisions).toEqual([]);
      expect(groupedDecisionsStore.areDecisionsEmpty).toBe(true);
    });

    it('should return null', () => {
      expect(
        groupedDecisionsStore.getDecisionDefinitionId({
          decisionId: 'invoice-assign-approver',
          version: 1,
        })
      ).toBe(null);
    });
  });
});
