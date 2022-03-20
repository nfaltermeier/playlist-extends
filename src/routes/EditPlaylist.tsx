import { ReactNode, useCallback, useState } from 'react';
import { batch, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import Overlay from '../components/Overlay';
import PlaylistsPicker from '../components/PlaylistsPicker';
import SongTree from '../components/SongTree';
import { getTrackUris } from '../lib/Api';
import spotifyApi from '../lib/spotifyApiKeeper';
import {
  setComponentPlaylists, setCompositePlaylistsNeedSync, setSnapshotId, usePlaylistById, deletePlaylist,
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

    const trackUris = await getTrackUris(checkedPlaylistIds);

    let tracksAdded = 100;
    let snapshotId = (await spotifyApi.replaceTracksInPlaylist(
      playlistId,
      trackUris.slice(0, Math.min(trackUris.length, 100))
    )).body.snapshot_id;
    while (tracksAdded < trackUris.length) {
      snapshotId = (await spotifyApi.addTracksToPlaylist(
        playlistId,
        trackUris.slice(tracksAdded, Math.min(trackUris.length, tracksAdded + 100))
      )).body.snapshot_id;
      // tracksAdded will be inaccurate after the while loop, but that should be okay
      tracksAdded += 100;
    }
    batch(() => {
      dispatch(setSnapshotId({ playlistId, snapshotId }));
      dispatch(setComponentPlaylists({ playlistId, componentPlaylistIds: checkedPlaylistIds }));
      dispatch(setCompositePlaylistsNeedSync(playlistId));
    });

    closeOverlay();
  }, [playlistId, dispatch, closeOverlay]);

  if (!playlistId || !playlist) {
    return <p>Could not find the specified playlist</p>;
  }

  if (playlist.deletedOnSpotify && playlist.componentPlaylistIds.length === 0) {
    return (
      <div>
        <h2>{playlist.name}</h2>
        <p>This playlist was deleted on Spotify and has was not a composite playlist.</p>
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
        <Overlay isOpen={isEditingPlaylist} closeOverlay={closeOverlay}>
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
