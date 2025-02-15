import React, { FormEvent, PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { InlineFieldRow, VerticalGroup } from '@grafana/ui';

import { DataSourceVariableModel, VariableWithMultiSupport } from '../types';
import { OnPropChangeArguments, VariableEditorProps } from '../editor/types';
import { SelectionOptionsEditor } from '../editor/SelectionOptionsEditor';
import { initDataSourceVariableEditor } from './actions';
import { StoreState } from '../../../types';
import { changeVariableMultiValue } from '../state/actions';
import { VariableSectionHeader } from '../editor/VariableSectionHeader';
import { VariableSelectField } from '../editor/VariableSelectField';
import { SelectableValue } from '@grafana/data';
import { VariableTextField } from '../editor/VariableTextField';
import { selectors } from '@grafana/e2e-selectors';
import { getDatasourceVariableEditorState } from '../editor/selectors';

const mapStateToProps = (state: StoreState) => ({
  extended: getDatasourceVariableEditorState(state.templating.editor),
});

const mapDispatchToProps = {
  initDataSourceVariableEditor,
  changeVariableMultiValue,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export interface OwnProps extends VariableEditorProps<DataSourceVariableModel> {}

type Props = OwnProps & ConnectedProps<typeof connector>;

export class DataSourceVariableEditorUnConnected extends PureComponent<Props> {
  componentDidMount() {
    this.props.initDataSourceVariableEditor();
  }

  onRegExChange = (event: FormEvent<HTMLInputElement>) => {
    this.props.onPropChange({
      propName: 'regex',
      propValue: event.currentTarget.value,
    });
  };

  onRegExBlur = (event: FormEvent<HTMLInputElement>) => {
    this.props.onPropChange({
      propName: 'regex',
      propValue: event.currentTarget.value,
      updateOptions: true,
    });
  };

  onSelectionOptionsChange = async ({ propValue, propName }: OnPropChangeArguments<VariableWithMultiSupport>) => {
    this.props.onPropChange({ propName, propValue, updateOptions: true });
  };

  getSelectedDataSourceTypeValue = (): string => {
    const { extended } = this.props;

    if (!extended?.dataSourceTypes.length) {
      return '';
    }

    const foundItem = extended.dataSourceTypes.find((ds) => ds.value === this.props.variable.query);
    const value = foundItem ? foundItem.value : extended.dataSourceTypes[0].value;
    return value ?? '';
  };

  onDataSourceTypeChanged = (option: SelectableValue<string>) => {
    this.props.onPropChange({ propName: 'query', propValue: option.value, updateOptions: true });
  };

  render() {
    const { variable, extended, changeVariableMultiValue } = this.props;

    const typeOptions = extended?.dataSourceTypes?.length
      ? extended.dataSourceTypes?.map((ds) => ({ value: ds.value ?? '', label: ds.text }))
      : [];

    const typeValue = typeOptions.find((o) => o.value === variable.query) ?? typeOptions[0];

    return (
      <VerticalGroup spacing="xs">
        <VariableSectionHeader name="Data source options" />
        <VerticalGroup spacing="md">
          <VerticalGroup spacing="xs">
            <InlineFieldRow>
              <VariableSelectField
                name="Type"
                value={typeValue}
                options={typeOptions}
                onChange={this.onDataSourceTypeChanged}
                labelWidth={10}
                testId={selectors.pages.Dashboard.Settings.Variables.Edit.DatasourceVariable.datasourceSelect}
              />
            </InlineFieldRow>
            <InlineFieldRow>
              <VariableTextField
                value={this.props.variable.regex}
                name="Instance name filter"
                placeholder="/.*-(.*)-.*/"
                onChange={this.onRegExChange}
                onBlur={this.onRegExBlur}
                labelWidth={20}
                tooltip={
                  <div>
                    Regex filter for which data source instances to choose from in the variable value list. Leave empty
                    for all.
                    <br />
                    <br />
                    Example: <code>/^prod/</code>
                  </div>
                }
              />
            </InlineFieldRow>
          </VerticalGroup>

          <SelectionOptionsEditor
            variable={variable}
            onPropChange={this.onSelectionOptionsChange}
            onMultiChanged={changeVariableMultiValue}
          />
        </VerticalGroup>
      </VerticalGroup>
    );
  }
}

export const DataSourceVariableEditor = connector(DataSourceVariableEditorUnConnected);
