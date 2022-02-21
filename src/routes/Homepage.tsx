import { ReactElement, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import spotifyApi from '../lib/spotifyApiKeeper';
import { getAuthorizationURL } from '../lib/auth';
import { paginateRequest, refreshAuthWrapper } from '../lib/Api';
import Overlay from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';
import { useLoggedIn } from '../redux/loggedIn';
import { addPlaylists, ExtendedablePlaylist, usePlaylists } from '../redux/playlists';

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
  useEffect(() => {
    if (!loggedIn) return;

    const fetchPlaylists = async () => {
      try {
        const result = await paginateRequest((offset) => refreshAuthWrapper(() => spotifyApi.getUserPlaylists({ limit: 50, offset }), spotifyApi));
        const mappedResult: ExtendedablePlaylist[] = result.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          snapshot: playlist.snapshot_id,
          extendedPlaylists: [],
        }));
        dispatch(addPlaylists(mappedResult));
        setPlaylistsRequestState({ isLoading: false, isErrored: false });
      } catch (e) {
        setPlaylistsRequestState({ isLoading: false, isErrored: true });
      }
    };
    fetchPlaylists();
  }, [loggedIn, setPlaylistsRequestState, dispatch]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

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
        <Overlay isOpen={isCreatingPlaylist} closeOverlay={() => { setIsCreatingPlaylist(false); }}>
          <NewPlaylist />
        </Overlay>
        {playlistContent}
      </div>
    );
  }

  return content;
}

export default Homepage;
