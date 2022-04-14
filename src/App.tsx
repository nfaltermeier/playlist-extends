import { Outlet } from 'react-router';
import { NavLink } from 'react-router-dom';
import styles from './App.module.scss';
import DataManagement from './components/DataManagement';

function App() {
  return (
    <div className={styles.App}>
      <header>
        <h1>Playlist Extends</h1>
        <nav>
          <NavLink to="/">Home</NavLink>
        </nav>
        <DataManagement />
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
