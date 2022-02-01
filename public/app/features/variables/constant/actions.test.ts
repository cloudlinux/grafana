import { variableAdapters } from '../adapters';
import { createConstantVariableAdapter } from './adapter';
import { reduxTester } from '../../../../test/core/redux/reduxTester';
import { updateConstantVariableOptions } from './actions';
import { getRootReducer, RootReducerType } from '../state/helpers';
import { ConstantVariableModel, initialVariableModelState, VariableOption } from '../types';
import { createConstantOptionsFromQuery } from './reducer';
import { addVariable, setCurrentVariableValue } from '../state/sharedReducer';
import { toKeyedAction } from '../state/dashboardVariablesReducer';
import { toDashboardVariableIdentifier, toVariablePayload } from '../utils';

describe('constant actions', () => {
  variableAdapters.setInit(() => [createConstantVariableAdapter()]);

  describe('when updateConstantVariableOptions is dispatched', () => {
    it('then correct actions are dispatched', async () => {
      const option: VariableOption = {
        value: 'A',
        text: 'A',
        selected: false,
      };

      const variable: ConstantVariableModel = {
        ...initialVariableModelState,
        id: '0',
        dashboardUid: 'uid',
        index: 0,
        type: 'constant',
        name: 'Constant',
        current: {
          value: '',
          text: '',
          selected: false,
        },
        options: [],
        query: 'A',
      };

      const tester = await reduxTester<RootReducerType>()
        .givenRootReducer(getRootReducer())
        .whenActionIsDispatched(
          toKeyedAction('uid', addVariable(toVariablePayload(variable, { global: false, index: 0, model: variable })))
        )
        .whenAsyncActionIsDispatched(updateConstantVariableOptions(toDashboardVariableIdentifier(variable)), true);

      tester.thenDispatchedActionsShouldEqual(
        toKeyedAction('uid', createConstantOptionsFromQuery(toVariablePayload(variable))),
        toKeyedAction('uid', setCurrentVariableValue(toVariablePayload(variable, { option })))
      );
    });
  });
});
