import { useCallback, useState } from 'react';
import { useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import Overlay from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';
import { usePlaylists } from '../redux/playlists';
import styles from './Homepage.module.scss';
import { fetchPlaylists, syncMultiplePlaylists } from '../lib/api';
import { makeSyncOrder } from '../lib/playlistsHelper';
import LoadingButton from '../components/LoadingButton';

function Homepage() {
  const playlists = usePlaylists();
  const store = useStore();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsCreatingPlaylist(false); }, [setIsCreatingPlaylist]);

  return (
    <div>
      <h2>Playlists</h2>
      <div>
        <button onClick={() => { setIsCreatingPlaylist(true); }} type="button">New Playlist</button>
        <LoadingButton onClick={fetchPlaylists}>Refresh playlists</LoadingButton>
        {playlists.some((p) => p.needsSync) && (
          <LoadingButton
            onClick={() => syncMultiplePlaylists(
              makeSyncOrder(store.getState(), playlists.filter((p) => p.needsSync).map((p) => p.id))
            )}
          >
            Sync all playlists
          </LoadingButton>
        )}
      </div>
      <Overlay isOpen={isCreatingPlaylist} closeOverlay={closeOverlay}>
        <NewPlaylist closeOverlay={closeOverlay} />
      </Overlay>
      <table className={styles.playlistContent}>
        <thead>
          <tr>
            <td>Name</td>
            <td>Type</td>
            <td>Status</td>
            <td>Edit</td>
          </tr>
        </thead>
        <tbody>
          {playlists.map((playlist) => {
            let status;
            if (playlist.deletedOnSpotify) {
              status = 'Deleted';
            } else if (playlist.needsSync) {
              status = 'Needs Sync';
            } else {
              status = '';
            }
            let type;
            if (playlist.componentPlaylistIds.length > 0) {
              type = 'Extended';
            } else if (!playlist.isUserPlaylist) {
              type = 'External';
            } else {
              type = '';
            }
            return (
              <tr key={playlist.id}>
                <td>{playlist.name}</td>
                <td>{type}</td>
                <td>{status}</td>
                <td>
                  <Link to={`/playlist/${playlist.id}`}>
                    {playlist.componentPlaylistIds.length > 0 ? 'Edit' : 'View'}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Homepage;
