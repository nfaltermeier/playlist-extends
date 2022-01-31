import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoginCallbackType } from '../RoutesContainer';
import { verifyState, requestAccessToken } from "../lib/auth";

// from https://v5.reactrouter.com/web/example/query-parameters
const useQuery = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Callback = ({ loginCallback }: { loginCallback: LoginCallbackType }) => {
  const query = useQuery();
  const navigate = useNavigate();
  const [state, setState] = useState({ isLoading: true, isErrored: false });
  useEffect(() => {
    const state = query.get('state');
    if (!state || !verifyState(state)) {
      navigate('/state-error');
      return;
    }

    const code = query.get('code');
    if (!code) {
      console.warn('Code not found in query parameters');
      setState({ isLoading: false, isErrored: true });
      return;
    }

    requestAccessToken(code).then((result) => {
      loginCallback(result.access_token, result.refresh_token);
      setState({ isLoading: false, isErrored: false });
      window.sessionStorage.clear();
      navigate('/', { replace: true });
    }).catch((err) => {
      setState({ isLoading: false, isErrored: true });
      console.warn(err);
    });
  }, [navigate, query, setState, loginCallback]);
  
  if (state.isLoading)
    return <p>Processing...</p>;
  else if (state.isErrored)
    return <p>Errored</p>;
  else
    return <p>Logged in</p>;
};

export default Callback;