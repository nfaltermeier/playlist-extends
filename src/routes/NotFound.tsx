import { useNavigate } from 'react-router';

function NotFound() {
  const navigate = useNavigate();
  return (
    <div>
      <p>No page could be found at the given URL.</p>
      <button type="button" onClick={() => { navigate('/'); }}>Go Home</button>
    </div>
  );
}

export default NotFound;
