import React, { Fragment, ReactElement, useEffect, useState } from 'react';
import { getAuthorizationURL } from '../auth';

type stateType = {
  isLoading: boolean,
  isErrored: boolean,
  loginURL: string | null
};

function Homepage() {
  const [state, setState] = useState<stateType>({ isLoading: true, isErrored: false, loginURL: null });
  useEffect(() => {
    getAuthorizationURL().then(v => {
      setState({ isLoading: false, isErrored: false, loginURL: v });
    })
    .catch(e => {
      console.error(e);
      setState({ isLoading: false, isErrored: true, loginURL: null });
    });
  }, []);

  let content: ReactElement;
  if (state.isLoading) {
    content = <p>Loading</p>;
  } else if (state.isErrored) {
    content = <p>Errored</p>;
  } else {
    content = <a href={state.loginURL as string}>Login</a>;
  }

  return <Fragment>{content}</Fragment>
}

export default Homepage;
