import { Route, Routes, HashRouter } from 'react-router-dom';
import './index.css';

import App from './App';
import Homepage from './routes/Homepage';
import EditPlaylist from './routes/EditPlaylist';
import Callback from './routes/Callback';
import StateError from './routes/StateError';
import NotFound from './routes/NotFound';
import LoginGate from './routes/LoginGate';
import Privacy from './routes/Privacy';
import Introduction from './routes/Introduction';

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<Introduction />} />
          <Route element={<LoginGate />}>
            <Route path="/home" element={<Homepage />} />
            <Route path="playlist/:playlistId" element={<EditPlaylist />} />
          </Route>
          <Route path="callback" element={<Callback />} />
          <Route path="state-error" element={<StateError />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default AppRoutes;
