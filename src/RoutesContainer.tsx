import { useCallback, useRef, useState } from 'react';
import { Route, Routes, HashRouter } from 'react-router-dom';
import SpotifyWebApi from 'spotify-web-api-node';
import './index.css';
import App from './App';

import Homepage from './routes/Homepage';
import Callback from './routes/Callback';
import StateError from './routes/StateError';

export type LoginCallbackType = (accessToken: string, refreshToken: string) => void;

function RoutesContainer() {
  const spotifyApi = useRef(new SpotifyWebApi());
  const [loggedIn, setLoggedIn] = useState(false);
  const loginCallback = useCallback<LoginCallbackType>((accessToken, refreshToken) => {
    spotifyApi.current.setAccessToken(accessToken);
    spotifyApi.current.setRefreshToken(refreshToken);
    setLoggedIn(true);
  }, [setLoggedIn]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<Homepage spotifyApi={spotifyApi.current} loggedIn={loggedIn} />} />
          <Route path="callback" element={<Callback loginCallback={loginCallback} />} />
          <Route path="state-error" element={<StateError />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default RoutesContainer;
