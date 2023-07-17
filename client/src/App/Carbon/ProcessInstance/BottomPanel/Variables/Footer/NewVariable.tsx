/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {useState} from 'react';
import {Field, useForm, useFormState} from 'react-final-form';
import {Layer} from './styled';
import {
  validateNameCharacters,
  validateNameComplete,
  validateNameNotDuplicate,
  validateValueValid,
  validateValueComplete,
} from '../validators';
import {mergeValidators} from 'modules/utils/validators/mergeValidators';
import {JSONEditorModal} from 'modules/components/Carbon/JSONEditorModal';
import {tracking} from 'modules/tracking';
import {TextInputField} from 'modules/components/Carbon/TextInputField';
import {IconTextInputField} from 'modules/components/Carbon/IconTextInputField';
import {Popup} from '@carbon/react/icons';
import {Operations} from '../Operations';
import {EditButtons} from '../EditButtons';

const NewVariable: React.FC = () => {
  const formState = useFormState();
  const form = useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Layer>
        <Field
          name="name"
          validate={mergeValidators(
            validateNameCharacters,
            validateNameComplete,
            validateNameNotDuplicate,
          )}
          allowNull={false}
          parse={(value) => value}
        >
          {({input}) => (
            <TextInputField
              {...input}
              id="name"
              size="sm"
              hideLabel
              labelText=""
              type="text"
              placeholder="Name"
              autoFocus={true}
            />
          )}
        </Field>
        <Field
          name="value"
          validate={mergeValidators(validateValueComplete, validateValueValid)}
          parse={(value) => value}
        >
          {({input}) => (
            <IconTextInputField
              {...input}
              size="sm"
              type="text"
              id="value"
              hideLabel
              labelText=""
              placeholder="Value"
              buttonLabel="Open JSON editor modal"
              tooltipPosition="left"
              onIconClick={() => {
                setIsModalVisible(true);
                tracking.track({
                  eventName: 'json-editor-opened',
                  variant: 'add-variable',
                });
              }}
              Icon={Popup}
            />
          )}
        </Field>
        <Operations>
          <EditButtons />
        </Operations>
      </Layer>
      {isModalVisible && (
        <JSONEditorModal
          isVisible={isModalVisible}
          title={
            formState.values?.name
              ? `Edit Variable "${formState.values?.name}"`
              : 'Edit a new Variable'
          }
          value={formState.values?.value}
          onClose={() => {
            setIsModalVisible(false);
            tracking.track({
              eventName: 'json-editor-closed',
              variant: 'add-variable',
            });
          }}
          onApply={(value) => {
            form.change('value', value);
            setIsModalVisible(false);
            tracking.track({
              eventName: 'json-editor-saved',
              variant: 'add-variable',
            });
          }}
        />
      )}
    </>
  );
};

export {NewVariable};
