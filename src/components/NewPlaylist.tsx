import { useCallback, useRef, useState } from 'react';
import PlaylistsPicker from './PlaylistsPicker';
import styles from './NewPlaylist.module.scss';
import { getSortedPlaylist } from '../lib/sorting';
import { createNewPlaylist } from '../lib/api';
import { useDefaultPublicPlaylists } from '../redux/preferences';

function NewPlaylist({ closeOverlay }: { closeOverlay: () => void }) {
  const newPlaylistName = useRef<HTMLInputElement>(null);
  const publicPlaylistInput = useRef<HTMLInputElement>(null);
  const defaultPublic = useDefaultPublicPlaylists();
  const [publicPlaylist, setPublicPlaylist] = useState(defaultPublic);
  const togglePublicPlaylist = useCallback(() => setPublicPlaylist((p) => !p), []);

  const onSubmitCallback = useCallback(async (checkedPlaylistIds: string[], sortSpec: string) => {
    if (!newPlaylistName.current || checkedPlaylistIds.length === 0) { return; }
    const namedTracks = await getSortedPlaylist(checkedPlaylistIds, sortSpec);

    await createNewPlaylist(newPlaylistName.current.value, namedTracks, checkedPlaylistIds, sortSpec, publicPlaylist);

    closeOverlay();
  }, [closeOverlay, publicPlaylist]);

  const bottomMenu = (
    <div>
      <div>
        <label className={styles.bottomMenuContent} htmlFor="NewPlaylistName">
          {'Public Playlist: '}
          <input
            id="NewPlaylistName"
            type="checkbox"
            ref={publicPlaylistInput}
            className={`${styles.bottomMenuContent}`}
            checked={publicPlaylist}
            onChange={togglePublicPlaylist}
          />
        </label>
      </div>
      <div>
        <label className={styles.bottomMenuContent} htmlFor="NewPlaylistName">
          {'Playlist Name: '}
          <input id="NewPlaylistName" type="text" ref={newPlaylistName} required defaultValue="New Playlist" className={`${styles.bottomMenuContent} ${styles.playlistNameInput}`} />
        </label>
      </div>
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
