import {
  ReactNode, useCallback, useEffect, useState,
} from 'react';
import { useStore } from 'react-redux';
import { syncMultiplePlaylists, updateExistingPlaylist } from '../lib/api';
import { makeSyncOrder } from '../lib/playlistsHelper';
import { ExtendablePlaylist, selectPlaylistById } from '../redux/playlists';
import LoadingButton from './LoadingButton';
import Overlay from './Overlay';

function SyncButton({ playlist }: { playlist: ExtendablePlaylist }) {
  const [playlistsToSync, setPlaylistsToSync] = useState<null | Array<string>>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const reduxState = useStore().getState();
  useEffect(() => {
    setPlaylistsToSync(null);
    setShowConfirmationDialog(false);
  }, [reduxState]);

  const closeOverlay = useCallback(() => {
    setShowConfirmationDialog(false);
  }, []);
  const onSyncClick = async () => {
    let playlists;
    if (playlistsToSync === null) {
      playlists = makeSyncOrder(reduxState, [playlist.id]);
    } else {
      playlists = playlistsToSync;
    }
    if (playlists.length === 1) {
      await updateExistingPlaylist(playlist.id, playlist.componentPlaylistIds, playlist.sortSpec);
    } else {
      setPlaylistsToSync(playlists);
      setShowConfirmationDialog(true);
    }
  };
  const syncMultipleAndClose = async () => {
    if (!playlistsToSync) {
      throw new Error('Trying to sync multiple playlists but data is not set');
    }
    await syncMultiplePlaylists(playlistsToSync);
    closeOverlay();
  };

  let button: ReactNode = null;
  if (playlistsToSync === null || playlistsToSync.length <= 1) {
    button = <LoadingButton onClick={onSyncClick}>Sync to Spotify</LoadingButton>;
  } else {
    button = <button type="button" onClick={onSyncClick}>Sync to Spotify</button>;
  }

  return (
    <div>
      {button}
      <Overlay isOpen={showConfirmationDialog} closeOverlay={closeOverlay} showCloseButton={false} zIndex={25}>
        <p>In order to sync this playlist, the following playlist(s) must also synced:</p>
        <ul>
          {
          playlistsToSync !== null && playlistsToSync.filter((pId) => pId !== playlist.id).map((pId) => (
            <li key={pId}>
              {selectPlaylistById(reduxState, pId)?.name}
            </li>
          ))
        }
        </ul>
        <p>Would you like to continue?</p>
        <LoadingButton onClick={syncMultipleAndClose}>Continue</LoadingButton>
        <button type="button" onClick={closeOverlay}>Cancel</button>
      </Overlay>
    </div>
  );
}

export default SyncButton;
