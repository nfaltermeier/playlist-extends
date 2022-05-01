import { useCallback, useRef } from 'react';
import PlaylistsPicker from './PlaylistsPicker';
import styles from './NewPlaylist.module.scss';
import { getSortedPlaylist } from '../lib/sorting';
import { createNewPlaylist } from '../lib/api';

function NewPlaylist({ closeOverlay }: { closeOverlay: () => void }) {
  const newPlaylistName = useRef<HTMLInputElement>(null);

  const onSubmitCallback = useCallback(async (checkedPlaylistIds: string[], sortSpec: string) => {
    if (!newPlaylistName.current || checkedPlaylistIds.length === 0) { return; }
    const namedTracks = await getSortedPlaylist(checkedPlaylistIds, sortSpec);

    await createNewPlaylist(newPlaylistName.current.value, namedTracks, checkedPlaylistIds, sortSpec);

    closeOverlay();
  }, [closeOverlay]);

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
