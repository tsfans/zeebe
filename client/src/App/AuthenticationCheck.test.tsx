/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. Licensed under a proprietary license.
 * See the License.txt file for more information. You may not use this file
 * except in compliance with the proprietary license.
 */

import {render, screen, waitFor} from 'modules/testing-library';
import {authenticationStore} from 'modules/stores/authentication';
import {LocationLog} from 'modules/utils/LocationLog';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {AuthenticationCheck} from './AuthenticationCheck';
import {mockGetUser} from 'modules/mocks/api/getUser';
import {createUser} from 'modules/testUtils';

const PROTECTED_CONTENT = 'protected content';
const PUBLIC_AREA_URL = '/public-area';
const PROTECTED_AREA_URL = '/protected-area';

function createWrapper(initialRoute: string = '/') {
  const Wrapper: React.FC<{children?: React.ReactNode}> = ({children}) => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path={PUBLIC_AREA_URL} element={<>Login page</>} />
        <Route path={PROTECTED_AREA_URL} element={children} />
      </Routes>
      <LocationLog />
    </MemoryRouter>
  );

  return Wrapper;
}

describe('<AuthenticationCheck />', () => {
  beforeEach(() => {
    authenticationStore.reset();
  });

  it('should handle no session', async () => {
    mockGetUser().withServerError(401);

    render(
      <AuthenticationCheck redirectPath={PUBLIC_AREA_URL}>
        {PROTECTED_CONTENT}
      </AuthenticationCheck>,
      {
        wrapper: createWrapper(PROTECTED_AREA_URL),
      },
    );

    await waitFor(() =>
      expect(screen.getByTestId('pathname')).toHaveTextContent(PUBLIC_AREA_URL),
    );
    expect(screen.queryByText(PROTECTED_CONTENT)).not.toBeInTheDocument();
  });

  it('should handle valid session', async () => {
    mockGetUser().withSuccess(createUser());

    render(
      <AuthenticationCheck redirectPath={PUBLIC_AREA_URL}>
        {PROTECTED_CONTENT}
      </AuthenticationCheck>,
      {
        wrapper: createWrapper(PROTECTED_AREA_URL),
      },
    );

    expect(screen.getByTestId('pathname')).toHaveTextContent(
      PROTECTED_AREA_URL,
    );
    await waitFor(() =>
      expect(authenticationStore.state.status).toBe('user-information-fetched'),
    );
  });
});
