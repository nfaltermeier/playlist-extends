import { Outlet } from 'react-router';
import { NavLink } from 'react-router-dom';
import styles from './App.module.scss';
import DataManagement from './components/DataManagement';
import SpotifyLogo from './assets/Spotify_Logo_RGB_Green.png';

function App() {
  return (
    <div className={styles.App}>
      <header>
        <h1>Playlist Extends</h1>
        <div className={styles.topNavContainer}>
          <div className={styles.topNav}>
            <NavLink to="/home">Home</NavLink>
          </div>
          <DataManagement buttonClassname={styles.navMargin} />
          <img src={SpotifyLogo} className={styles.spotifyLogo} alt="Spotify logo" />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <nav className={styles.bottomNav}>
        <NavLink to="/">Introduction</NavLink>
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/privacy">Privacy Policy</NavLink>
        <a target="_blank" rel="noreferrer" href="https://github.com/nfaltermeier/playlist-extends">Source Code</a>
      </nav>
    </div>
  );
}

export default App;
