import { useParams } from 'react-router';
import SongTree from '../components/SongTree';
import { usePlaylistById } from '../redux/playlists';

function EditPlaylist() {
  const { playlistId } = useParams();
  const playlist = usePlaylistById(playlistId || '');

  if (!playlistId || !playlist) {
    return <p>Could not find the specified playlist</p>;
  }

  return (
    <div>
      <h2>{playlist.name}</h2>
      <SongTree topPlaylist={playlist} />
    </div>
  );
}

export default EditPlaylist;
