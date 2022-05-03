import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div>
      <p>No page could be found at the given URL.</p>
      <Link to="/home">Go Home</Link>
    </div>
  );
}

export default NotFound;
