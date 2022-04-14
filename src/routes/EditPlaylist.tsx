import { ReactNode, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import Overlay, { defaultContainerClassname } from '../components/Overlay';
import PlaylistsPicker from '../components/PlaylistsPicker';
import SongTree from '../components/SongTree';
import { getNamedTracks, updateExistingPlaylist } from '../lib/api';
import {
  usePlaylistById, deletePlaylist,
} from '../redux/playlists';

function EditPlaylist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const playlist = usePlaylistById(playlistId || '');

  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsEditingPlaylist(false); }, [setIsEditingPlaylist]);
  const onSubmitCallback = useCallback(async (checkedPlaylistIds: string[]) => {
    if (checkedPlaylistIds.length === 0 || !playlistId) { return; }

    const namedTracks = await getNamedTracks(checkedPlaylistIds);
    await updateExistingPlaylist(playlistId, namedTracks, checkedPlaylistIds);

    closeOverlay();
  }, [playlistId, closeOverlay]);

  if (!playlistId || !playlist) {
    return <p>Could not find the specified playlist</p>;
  }

  if (playlist.deletedOnSpotify && playlist.componentPlaylistIds.length === 0) {
    return (
      <div>
        <h2>{playlist.name}</h2>
        <p>This playlist was deleted on Spotify and was not a composite playlist.</p>
        <button
          type="button"
          onClick={() => {
            dispatch(deletePlaylist(playlistId));
            navigate('/');
          }}
        >
          Remove playlist from Playlist Extends
        </button>
      </div>
    );
  }

  let edit: ReactNode = null;
  if (playlist.componentPlaylistIds.length > 0) {
    edit = (
      <>
        <button type="button" onClick={() => { setIsEditingPlaylist(true); }}>Edit</button>
        <Overlay isOpen={isEditingPlaylist} closeOverlay={closeOverlay} containerClassname={defaultContainerClassname}>
          <PlaylistsPicker
            title={`Edit ${playlist.name}`}
            bottomMenu={null}
            onSubmitCallback={onSubmitCallback}
            initiallyCheckedPlaylistIds={playlist.componentPlaylistIds}
          />
        </Overlay>
      </>
    );
  }

  return (
    <div>
      <h2>{playlist.name}</h2>
      {edit}
      <SongTree topPlaylist={playlist} />
    </div>
  );
}

export default EditPlaylist;
