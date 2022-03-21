import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import PlaylistsPicker from './PlaylistsPicker';
import { getTrackUris } from '../lib/api';
import { prependPlaylist } from '../redux/playlists';
import spotifyApi from '../lib/spotifyApiKeeper';
import styles from './NewPlaylist.module.scss';

function NewPlaylist({ closeOverlay }: { closeOverlay: () => void }) {
  const dispatch = useDispatch();
  const newPlaylistName = useRef<HTMLInputElement>(null);

  const onSubmitCallback = useCallback(async (checkedPlaylistIds: string[]) => {
    if (!newPlaylistName.current || checkedPlaylistIds.length === 0) { return; }

    const trackUris = await getTrackUris(checkedPlaylistIds);

    const playlistName = newPlaylistName.current.value;

    // temporarily make everything private for testing
    const playlistId = (await spotifyApi.createPlaylist(playlistName, { public: false })).body.id;

    let tracksAdded = 0;
    let snapshotId;
    do {
      snapshotId = (await spotifyApi.addTracksToPlaylist(
        playlistId,
        trackUris.slice(tracksAdded, Math.min(trackUris.length, tracksAdded + 100)),
        { position: tracksAdded }
      )).body.snapshot_id;
      // tracksAdded will be inaccurate after the while loop, but that should be okay
      tracksAdded += 100;
    } while (tracksAdded < trackUris.length);
    dispatch(prependPlaylist({
      id: playlistId,
      name: playlistName,
      snapshotId,
      componentPlaylistIds: checkedPlaylistIds,
      needsSync: false,
      deletedOnSpotify: false,
      isUserPlaylist: true,
      lastSyncTrackUris: trackUris,
    }));
    closeOverlay();
  }, [dispatch, closeOverlay]);

  const bottomMenu = (
    <div>
      <label className={styles.bottomMenuContent} htmlFor="NewPlaylistName">
        {'Playlist Name: '}
        <input id="NewPlaylistName" type="text" ref={newPlaylistName} required defaultValue="New Playlist" className={`${styles.bottomMenuContent} ${styles.playlistNameInput}`} />
      </label>
    </div>
  );

  return (
    <PlaylistsPicker
      title="New Playlist"
      bottomMenu={bottomMenu}
      onSubmitCallback={onSubmitCallback}
      submitButtonClassName={styles.bottomMenuContent}
      bottomMenuContainerClassName={styles.bottomMenu}
    />
  );
}

export default NewPlaylist;
