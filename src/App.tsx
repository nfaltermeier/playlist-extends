import { Outlet } from 'react-router';
import { NavLink } from 'react-router-dom';
import styles from './App.module.scss';

function App() {
  return (
    <div className={styles.App}>
      <header>
        <h1>Spotify Playlist Extends</h1>
        <nav>
          <NavLink to="/">Home</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
