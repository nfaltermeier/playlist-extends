import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import Overlay, { defaultContainerClassname } from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';
import { usePlaylists } from '../redux/playlists';
import styles from './Homepage.module.scss';
import { fetchPlaylists } from '../lib/api';

function Homepage() {
  const navigate = useNavigate();
  const playlists = usePlaylists();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsCreatingPlaylist(false); }, [setIsCreatingPlaylist]);
  const [refreshPlaylistsMessage, setRefreshPlaylistsMessage] = useState<null | string>(null);
  const fetchPlaylistsCallback = useCallback(() => {
    fetchPlaylists(() => { setRefreshPlaylistsMessage(null); }, () => { setRefreshPlaylistsMessage('Failed to refresh playlists!'); });
  }, [setRefreshPlaylistsMessage]);

  return (
    <div>
      <h2>Playlists</h2>
      <div>
        <button onClick={() => { setIsCreatingPlaylist(true); }} type="button">New Playlist</button>
        <button onClick={fetchPlaylistsCallback} type="button">Refresh playlists</button>
      </div>
      {refreshPlaylistsMessage}
      <Overlay isOpen={isCreatingPlaylist} closeOverlay={closeOverlay} containerClassname={defaultContainerClassname}>
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
                  <button type="button" onClick={() => { navigate(`playlist/${playlist.id}`); }}>
                    {playlist.componentPlaylistIds.length > 0 ? 'Edit' : 'View'}
                  </button>
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
