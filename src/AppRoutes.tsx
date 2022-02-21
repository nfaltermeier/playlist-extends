import { Route, Routes, HashRouter } from 'react-router-dom';
import './index.css';

import App from './App';
import Homepage from './routes/Homepage';
import Callback from './routes/Callback';
import StateError from './routes/StateError';

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<Homepage />} />
          <Route path="callback" element={<Callback />} />
          <Route path="state-error" element={<StateError />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default AppRoutes;
