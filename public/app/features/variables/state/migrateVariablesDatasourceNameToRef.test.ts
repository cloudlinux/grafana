import { migrateVariablesDatasourceNameToRef } from './actions';
import { adHocBuilder, queryBuilder } from '../shared/testing/builders';
import { DataSourceRef } from '@grafana/data/src';
import { changeVariableProp } from './sharedReducer';
import { toKeyedAction } from './dashboardVariablesReducer';
import { getPreloadedState } from './helpers';
import { toVariablePayload } from '../utils';

function getTestContext(ds: DataSourceRef, dsInstance?: { uid: string; type: string }) {
  jest.clearAllMocks();
  const uid = 'uid';
  const query = queryBuilder().withId('query').withDashboardUid(uid).withName('query').withDatasource(ds).build();
  const adhoc = adHocBuilder().withId('adhoc').withDashboardUid(uid).withName('adhoc').withDatasource(ds).build();
  const templatingState = { variables: { query, adhoc } };
  const state = getPreloadedState(uid, templatingState);
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state);
  const getInstanceSettingsMock = jest.fn().mockReturnValue(dsInstance);
  const getDatasourceSrvFunc = jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({}),
    getList: jest.fn().mockReturnValue([]),
    getInstanceSettings: getInstanceSettingsMock,
  });

  return { uid, query, adhoc, dispatch, getState, getDatasourceSrvFunc };
}

describe('migrateVariablesDatasourceNameToRef', () => {
  describe('when called and variables have legacy data source props', () => {
    describe('and data source exists', () => {
      it('then correct actions are dispatched', async () => {
        const legacyDs = ('${ds}' as unknown) as DataSourceRef;
        const { query, adhoc, dispatch, getState, getDatasourceSrvFunc, uid } = getTestContext(legacyDs, {
          uid: 'a random uid',
          type: 'prometheus',
        });

        migrateVariablesDatasourceNameToRef(uid, getDatasourceSrvFunc)(dispatch, getState, undefined);

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch.mock.calls[0][0]).toEqual(
          toKeyedAction(
            uid,
            changeVariableProp(
              toVariablePayload(query, {
                propName: 'datasource',
                propValue: { uid: 'a random uid', type: 'prometheus' },
              })
            )
          )
        );
        expect(dispatch.mock.calls[1][0]).toEqual(
          toKeyedAction(
            uid,
            changeVariableProp(
              toVariablePayload(adhoc, {
                propName: 'datasource',
                propValue: { uid: 'a random uid', type: 'prometheus' },
              })
            )
          )
        );
      });
    });

    describe('and data source does not exist', () => {
      it('then correct actions are dispatched', async () => {
        const legacyDs = ('${ds}' as unknown) as DataSourceRef;
        const { query, adhoc, dispatch, getState, getDatasourceSrvFunc, uid } = getTestContext(legacyDs, undefined);

        migrateVariablesDatasourceNameToRef(uid, getDatasourceSrvFunc)(dispatch, getState, undefined);

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch.mock.calls[0][0]).toEqual(
          toKeyedAction(
            uid,
            changeVariableProp(toVariablePayload(query, { propName: 'datasource', propValue: { uid: '${ds}' } }))
          )
        );
        expect(dispatch.mock.calls[1][0]).toEqual(
          toKeyedAction(
            uid,
            changeVariableProp(toVariablePayload(adhoc, { propName: 'datasource', propValue: { uid: '${ds}' } }))
          )
        );
      });
    });
  });

  describe('when called and variables have dataSourceRef', () => {
    it('then no actions are dispatched', async () => {
      const legacyDs = { uid: '${ds}', type: 'prometheus' };
      const { dispatch, getState, getDatasourceSrvFunc, uid } = getTestContext(legacyDs, undefined);

      migrateVariablesDatasourceNameToRef(uid, getDatasourceSrvFunc)(dispatch, getState, undefined);

      expect(dispatch).toHaveBeenCalledTimes(0);
    });
  });
});
