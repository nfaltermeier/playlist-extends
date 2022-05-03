import { Link } from 'react-router-dom';
import LoginGate from './LoginGate';

function Introduction() {
  return (
    <div>
      <p>Playlist Extends allows you to create and manage Spotify playlists that contain othe playlists.</p>
      <p>All user data is stored in your browser, please use the data backup and restore features to move your data between computers.</p>
      <LoginGate
        altLoginRequired="Please log in through Spotify to access the rest of the website. "
        altLoggedIn={(
          <>
            {'You are now logged in. '}
            <Link to="/home">Visit your user homepage</Link>
          </>
        )}
      />
    </div>
  );
}

export default Introduction;
