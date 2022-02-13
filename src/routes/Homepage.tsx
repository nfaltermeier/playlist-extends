import React, { Fragment, ReactElement, useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-node';
import { getAuthorizationURL } from '../lib/auth';
import { paginateRequest } from '../lib/Api';
import Overlay from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';

type LoginUrlState = {
  isLoading: boolean,
  isErrored: boolean,
  loginUrl: string | null
};

type PlaylistsState = {
  isLoading: boolean,
  isErrored: boolean,
  playlists: SpotifyApi.PlaylistObjectSimplified[] | null
};

function Homepage({ spotifyApi, loggedIn }: { spotifyApi: SpotifyWebApi, loggedIn: boolean }) {
  const [loginUrlState, setloginUrlState] = useState<LoginUrlState>({ isLoading: true, isErrored: false, loginUrl: null });
  useEffect(() => {
    getAuthorizationURL().then(v => {
      setloginUrlState({ isLoading: false, isErrored: false, loginUrl: v });
    })
    .catch(e => {
      console.error(e);
      setloginUrlState({ isLoading: false, isErrored: true, loginUrl: null });
    });
  }, []);

  const [playlistsState, setPlaylistsState] = useState<PlaylistsState>({ isLoading: true, isErrored: false, playlists: null });
  useEffect(() => {
    if (!loggedIn)
      return;

    const fetchPlaylists = async () => {
      try {
        const result = await paginateRequest((offset) => spotifyApi.getUserPlaylists({ limit: 50, offset }));
        setPlaylistsState({ isLoading: false, isErrored: false, playlists: result })
      } catch (e) {
        setPlaylistsState({ isLoading: false, isErrored: true, playlists: null })
      }
    };
    fetchPlaylists();
  }, [spotifyApi, loggedIn, setPlaylistsState]);
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

    if (playlistsState.isLoading) {
      playlistContent = <p>Loading</p>;
    } else if (playlistsState.isErrored || !playlistsState.playlists) {
      playlistContent = <p>Errored</p>;
    } else {
      playlistContent = playlistsState.playlists.map((playlist) => <p key={playlist.id}>{playlist.name}</p>);
    }

    content = (
      <div>
        <h2>Playlists</h2>
        <button onClick={() => { setIsCreatingPlaylist(true); }}>New Playlist</button>
        <Overlay isOpen={isCreatingPlaylist} closeOverlay={() => { setIsCreatingPlaylist(false); }}>
          <NewPlaylist spotifyApi={spotifyApi} playlists={playlistsState.playlists} />
        </Overlay>
        {playlistContent}
      </div>
    );
  }

  return <Fragment>{content}</Fragment>
}

export default Homepage;
