import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { paginateAndRefreshAuth } from '../lib/Api';
import spotifyApi from '../lib/spotifyApiKeeper';
import { usePlaylistById } from '../redux/playlists';

interface SongInfo {
  uri: string,
  name: string
}

interface SongsState {
  isLoading: boolean,
  isErrored: boolean,
  songs: SongInfo[] | undefined
}

function EditPlaylist() {
  const { playlistId } = useParams();
  const playlist = usePlaylistById(playlistId || '');
  const [songsState, setSongsState] = useState<SongsState>({ isLoading: true, isErrored: false, songs: undefined });
  useEffect(() => {
    if (!playlistId || !playlist || playlist.deletedOnSpotify) { return; }
    const getSongs = async () => {
      try {
        const songs = await paginateAndRefreshAuth((offset) => (
          spotifyApi.getPlaylistTracks(playlistId, { fields: 'items(track(uri,name)),total', limit: 50, offset })
        ));
        setSongsState({ isLoading: false, isErrored: false, songs: songs.map((song) => ({ name: song.track.name, uri: song.track.uri })) });
      } catch (e) {
        setSongsState({ isLoading: false, isErrored: true, songs: undefined });
      }
    };

    getSongs();
  }, [playlistId, playlist]);

  if (!playlist) {
    return <p>Could not find the specified playlist</p>;
  }

  let content: ReactNode;
  if (playlist.deletedOnSpotify) {
    content = 'Playlist is deleted on Spotify, cannot load songs';
  } else if (songsState.isLoading) {
    content = 'Loading songs';
  } else if (songsState.isErrored || !songsState.songs) {
    content = 'Failed to load songs';
  } else {
    content = (
      <ol>
        {songsState.songs.map((song) => <li key={song.uri}>{song.name}</li>)}
      </ol>
    );
  }

  return (
    <>
      <h2>{playlist.name}</h2>
      {content}
    </>
  );
}

export default EditPlaylist;
