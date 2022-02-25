import { ReactNode, useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { fetchPlaylists } from '../lib/Api';
import { getAuthorizationURL } from '../lib/auth';
import { useLoggedIn } from '../redux/loggedIn';

interface LoginUrlState {
  isLoading: boolean,
  isErrored: boolean,
  loginUrl: string | undefined
}

interface PlaylistsRequestState {
  isLoading: boolean,
  isErrored: boolean,
}

/*
This isn't a react state or ref so the value is preserved even if the LoginGate is not rendered,
such as routes that don't use LoginGate
*/
let playlistsRetrieved = false;

/**
 * Only renders sub-routes when the user has logged in to spotify and playlists have been retrieved
 */
function LoginGate() {
  const loggedIn = useLoggedIn();
  const [loginUrlState, setloginUrlState] = useState<LoginUrlState>({ isLoading: !loggedIn, isErrored: false, loginUrl: undefined });
  useEffect(() => {
    if (loggedIn) { return; }

    getAuthorizationURL().then((v) => {
      setloginUrlState({ isLoading: false, isErrored: false, loginUrl: v });
    })
      .catch((e) => {
        console.error(e);
        setloginUrlState({ isLoading: false, isErrored: true, loginUrl: undefined });
      });
  }, [loggedIn]);

  const [playlistsRequestState, setPlaylistsRequestState] = useState<PlaylistsRequestState>({ isLoading: !playlistsRetrieved, isErrored: false });
  useEffect(() => {
    if (!loggedIn || playlistsRetrieved) return;

    fetchPlaylists(
      () => {
        playlistsRetrieved = true;
        setPlaylistsRequestState({ isLoading: false, isErrored: false });
      },
      () => { setPlaylistsRequestState({ isLoading: false, isErrored: true }); }
    );
  }, [loggedIn]);

  let content: ReactNode;
  if (loginUrlState.isLoading) {
    content = <p>Generating Spotify login URL</p>;
  } else if (loginUrlState.isErrored) {
    content = <p>Failed to generate Spotify login URL</p>;
  } else if (!loggedIn) {
    content = <a href={loginUrlState.loginUrl as string}>Login</a>;
  } else if (playlistsRequestState.isLoading) {
    content = <p>Fetching playlists from Spotify</p>;
  } else if (playlistsRequestState.isErrored) {
    content = <p>Failed to load playlists from Spotify</p>;
  } else {
    content = null;
  }

  return (
    <div>
      {content}
      {loggedIn && playlistsRetrieved && <Outlet />}
    </div>
  );
}

export default LoginGate;
