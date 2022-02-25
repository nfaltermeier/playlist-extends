import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import Overlay from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';
import { usePlaylists } from '../redux/playlists';
import styles from './Homepage.module.scss';
import { fetchPlaylists } from '../lib/Api';

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
              status = 'Sync';
            } else {
              status = '';
            }
            return (
              <tr key={playlist.id}>
                <td>{playlist.name}</td>
                <td>{playlist.componentPlaylistIds.length > 0 ? 'Extended' : ''}</td>
                <td>{status}</td>
                <td><button type="button" onClick={() => { navigate(`playlist/${playlist.id}`); }}>Edit</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Homepage;
