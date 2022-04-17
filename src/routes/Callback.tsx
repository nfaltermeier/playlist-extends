import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import {
  verifyState, clearStoredState, requestAccessToken, loadLastLocation,
} from '../lib/auth';
import spotifyApi from '../lib/spotifyApiKeeper';
import { setLoggedIn } from '../redux/loggedIn';
import { switchToUserStore } from '../redux/store';

// from https://v5.reactrouter.com/web/example/query-parameters
const useQuery = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
};

function Callback() {
  const dispatch = useDispatch();
  const query = useQuery();
  const navigate = useNavigate();
  const [state, setState] = useState({ isLoading: true, isErrored: false });

  const loginCallback = useCallback(async (accessToken: string, refreshToken: string) => {
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    dispatch(setLoggedIn());
    const me = (await spotifyApi.getMe()).body;
    await switchToUserStore(me.id);
  }, [dispatch]);

  useEffect(() => {
    const authState = query.get('state');
    if (!authState || !verifyState(authState)) {
      clearStoredState();
      navigate('/state-error');
      return;
    }
    clearStoredState();

    const code = query.get('code');
    if (!code) {
      console.warn('Code not found in query parameters');
      setState({ isLoading: false, isErrored: true });
      return;
    }

    requestAccessToken(code).then((result) => (
      loginCallback(result.access_token, result.refresh_token)
    )).then(() => {
      setState({ isLoading: false, isErrored: false });
      const redirect = loadLastLocation() || '/';
      window.sessionStorage.clear();
      navigate(redirect, { replace: true });
    }).catch((err) => {
      setState({ isLoading: false, isErrored: true });
      console.error(err);
    });
  }, [navigate, query, setState, loginCallback]);

  if (state.isLoading) return <p>Processing login...</p>;
  if (state.isErrored) return <p>Errored, login failed</p>;
  return <p>Logged in</p>;
}

export default Callback;
