/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Form, Field} from 'react-final-form';
import {FORM_ERROR} from 'final-form';
import {PAGE_TITLE} from 'modules/constants';
import {Disclaimer} from './Disclaimer';
import {LOGIN_ERROR, GENERIC_ERROR} from './constants';
import {
  Container,
  CopyrightNotice,
  LogoContainer,
  Error,
  FieldContainer,
  CamundaLogo,
  Title,
  Button,
} from './styled';
import {authenticationStore} from 'modules/stores/authentication';
import {NetworkError} from 'modules/networkError';
import {
  Column,
  Grid,
  InlineNotification,
  PasswordInput,
  Stack,
  TextInput,
} from '@carbon/react';
import {CarbonPaths} from 'modules/carbonRoutes';
import {LoadingSpinner} from './LoadingSpinner';
import 'index-carbon.scss';

function stateHasReferrer(state: unknown): state is {referrer: Location} {
  if (typeof state === 'object' && state?.hasOwnProperty('referrer')) {
    return true;
  }

  return false;
}

type FormValues = {
  username: string;
  password: string;
};

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = PAGE_TITLE.LOGIN;
  }, []);

  return (
    <Grid as={Container} condensed>
      <Form<FormValues>
        onSubmit={async (values) => {
          try {
            const response = await authenticationStore.handleLogin(values);

            if (response === undefined) {
              return navigate(
                stateHasReferrer(location.state)
                  ? location.state.referrer
                  : {
                      ...location,
                      pathname: CarbonPaths.dashboard(),
                    },
                {replace: true},
              );
            }

            if (response instanceof NetworkError && response.status === 401) {
              return {
                [FORM_ERROR]: LOGIN_ERROR,
              };
            }

            return {
              [FORM_ERROR]: GENERIC_ERROR,
            };
          } catch {
            return {
              [FORM_ERROR]: GENERIC_ERROR,
            };
          }
        }}
        validate={({username, password}) => {
          const errors: {username?: string; password?: string} = {};

          if (!username) {
            errors.username = 'Username is required';
          }

          if (!password) {
            errors.password = 'Password is required';
          }

          return errors;
        }}
      >
        {({handleSubmit, submitError, submitting, form, dirtyFields}) => {
          return (
            <Column
              as="form"
              sm={4}
              md={{
                span: 4,
                offset: 2,
              }}
              lg={{
                span: 6,
                offset: 5,
              }}
              xlg={{
                span: 4,
                offset: 6,
              }}
              onSubmit={handleSubmit}
            >
              <Stack>
                <LogoContainer>
                  <CamundaLogo aria-label="Camunda logo" />
                </LogoContainer>
                <Title>Operate</Title>
              </Stack>
              <Stack gap={3}>
                <Error>
                  {submitError && (
                    <InlineNotification
                      title={submitError}
                      hideCloseButton
                      kind="error"
                      role="alert"
                    />
                  )}
                </Error>
                <FieldContainer>
                  <Field<FormValues['username']> name="username" type="text">
                    {({input, meta}) => (
                      <TextInput
                        {...input}
                        name={input.name}
                        id={input.name}
                        onChange={input.onChange}
                        labelText="Username"
                        invalid={meta.error && meta.touched}
                        invalidText={meta.error}
                        placeholder="Username"
                      />
                    )}
                  </Field>
                </FieldContainer>
                <FieldContainer>
                  <Field<FormValues['password']>
                    name="password"
                    type="password"
                  >
                    {({input, meta}) => (
                      <PasswordInput
                        {...input}
                        name={input.name}
                        id={input.name}
                        onChange={input.onChange}
                        hidePasswordLabel="Hide password"
                        showPasswordLabel="Show password"
                        labelText="Password"
                        invalid={meta.error && meta.touched}
                        invalidText={meta.error}
                        placeholder="Password"
                      />
                    )}
                  </Field>
                </FieldContainer>
                <Button
                  type="submit"
                  disabled={
                    !form
                      .getRegisteredFields()
                      .every((field) => dirtyFields[field]) || submitting
                  }
                  renderIcon={submitting ? LoadingSpinner : undefined}
                >
                  {submitting ? 'Logging in' : 'Login'}
                </Button>
                <Disclaimer />
              </Stack>
            </Column>
          );
        }}
      </Form>
      <Column sm={4} md={8} lg={16} as={CopyrightNotice}>
        {`© Camunda Services GmbH ${new Date().getFullYear()}. All rights reserved. | ${
          process.env.REACT_APP_VERSION
        }`}
      </Column>
    </Grid>
  );
};

export {Login};
