import { useCallback, useRef } from 'react';
import SpotifyWebApi from 'spotify-web-api-node';
import { paginateRequest } from '../lib/Api';
import styles from './NewPlaylist.module.scss';

interface NewPlaylistProps {
  spotifyApi: SpotifyWebApi,
  playlists: SpotifyApi.PlaylistObjectSimplified[] | null
}

function NewPlaylist(props: NewPlaylistProps) {
  const { spotifyApi, playlists } = props;

  const newPlaylistName = useRef<HTMLInputElement>(null);
  const checkedPlaylists = useRef(new Set<string>());
  const togglePlaylist = useCallback((id: string) => {
    if (!checkedPlaylists.current.delete(id)) {
      checkedPlaylists.current.add(id);
    }
  }, [checkedPlaylists]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(async (event) => {
    event.preventDefault();
    if (!newPlaylistName.current) { return; }

    const jaggedSongs = await Promise.all(Array.from(checkedPlaylists.current).map((playlist) => paginateRequest((offset) => spotifyApi.getPlaylistTracks(playlist, { fields: 'items(track(uri)),total', limit: 50, offset }))));
    const trackUris = jaggedSongs.flat().map((trackObject) => trackObject.track.uri);

    // temporarily make everything private for testing
    const playlistId = (await spotifyApi.createPlaylist(newPlaylistName.current.value, { public: false })).body.id;

    let tracksAdded = 0;
    do {
      await spotifyApi.addTracksToPlaylist(playlistId, trackUris.slice(tracksAdded, Math.min(trackUris.length, tracksAdded + 100)), { position: tracksAdded });
      // tracksAdded will be inaccurate after the while loop, but that should be okay
      tracksAdded += 100;
    } while (tracksAdded < trackUris.length);
  }, [checkedPlaylists, spotifyApi]);

  let content;
  if (playlists) {
    content = playlists.map((playlist) => {
      const id = `NewPlaylist-${playlist.id}`;
      return (
        <div key={playlist.id}>
          <label htmlFor={id}>
            {playlist.name}
            <input type="checkbox" id={id} value={checkedPlaylists.current.has(playlist.id).toString()} onChange={() => { togglePlaylist(playlist.id); }} />
          </label>
        </div>
      );
    });
  } else {
    content = 'Missing playlists';
  }

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.optionsList}>{content}</div>
      <div className={styles.bottomMenu}>
        <div>
          <label className={styles.bottomMenuContent} htmlFor="NewPlaylistName">
            Playlist Name:
            <input id="NewPlaylistName" type="text" ref={newPlaylistName} required defaultValue="New Playlist" className={`${styles.bottomMenuContent} ${styles.playlistNameInput}`} />
          </label>
        </div>
        <div>
          <input id="submit" type="submit" value="Save" className={styles.bottomMenuContent} />
        </div>
      </div>
    </form>
  );
}

export default NewPlaylist;
