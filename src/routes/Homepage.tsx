import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';
import { useDispatch } from 'react-redux';
import spotifyApi from '../lib/spotifyApiKeeper';
import { getAuthorizationURL } from '../lib/auth';
import { paginateRequest, refreshAuthWrapper } from '../lib/Api';
import Overlay from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';
import { useLoggedIn } from '../redux/loggedIn';
import { mergeSpotifyState, testResetNeedsSync, usePlaylists } from '../redux/playlists';

type LoginUrlState = {
  isLoading: boolean,
  isErrored: boolean,
  loginUrl: string | null
};

type PlaylistsRequestState = {
  isLoading: boolean,
  isErrored: boolean,
};

function Homepage() {
  const dispatch = useDispatch();
  const loggedIn = useLoggedIn();
  const playlists = usePlaylists();
  const [loginUrlState, setloginUrlState] = useState<LoginUrlState>({ isLoading: true, isErrored: false, loginUrl: null });
  useEffect(() => {
    getAuthorizationURL().then((v) => {
      setloginUrlState({ isLoading: false, isErrored: false, loginUrl: v });
    })
      .catch((e) => {
        console.error(e);
        setloginUrlState({ isLoading: false, isErrored: true, loginUrl: null });
      });
  }, []);

  const [playlistsRequestState, setPlaylistsRequestState] = useState<PlaylistsRequestState>({ isLoading: true, isErrored: false });
  const fetchPlaylists = useCallback(async () => {
    try {
      const result = await paginateRequest((offset) => refreshAuthWrapper(() => spotifyApi.getUserPlaylists({ limit: 50, offset }), spotifyApi));
      dispatch(testResetNeedsSync());
      dispatch(mergeSpotifyState(result));
      setPlaylistsRequestState({ isLoading: false, isErrored: false });
    } catch (e) {
      setPlaylistsRequestState({ isLoading: false, isErrored: true });
      console.error(e);
    }
  }, [dispatch, setPlaylistsRequestState]);
  useEffect(() => {
    if (!loggedIn) return;

    fetchPlaylists();
  }, [loggedIn, fetchPlaylists]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const closeOverlay = useCallback(() => { setIsCreatingPlaylist(false); }, [setIsCreatingPlaylist]);
  let content: ReactElement;
  if (loginUrlState.isLoading) {
    content = <p>Loading</p>;
  } else if (loginUrlState.isErrored) {
    content = <p>Errored</p>;
  } else if (!loggedIn) {
    content = <a href={loginUrlState.loginUrl as string}>Login</a>;
  } else {
    let playlistContent;

    if (playlistsRequestState.isLoading) {
      playlistContent = <p>Loading</p>;
    } else if (playlistsRequestState.isErrored) {
      playlistContent = <p>Errored</p>;
    } else {
      playlistContent = playlists.map((playlist) => <p key={playlist.id}>{playlist.name}</p>);
    }

    content = (
      <div>
        <h2>Playlists</h2>
        <button onClick={() => { setIsCreatingPlaylist(true); }} type="button">New Playlist</button>
        <button onClick={fetchPlaylists} type="button">Refresh playlists</button>
        <Overlay isOpen={isCreatingPlaylist} closeOverlay={closeOverlay}>
          <NewPlaylist closeOverlay={closeOverlay} />
        </Overlay>
        {playlistContent}
      </div>
    );
  }

  return content;
}

export default Homepage;
