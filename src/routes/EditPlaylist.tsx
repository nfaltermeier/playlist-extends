import { ReactNode, useCallback, useState } from 'react';
import { batch, useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import Overlay from '../components/Overlay';
import PlaylistsPicker from '../components/PlaylistsPicker';
import SongTree from '../components/SongTree';
import { getTrackUris } from '../lib/Api';
import spotifyApi from '../lib/spotifyApiKeeper';
import { setComponentPlaylists, setSnapshotId, usePlaylistById } from '../redux/playlists';

function EditPlaylist() {
  const dispatch = useDispatch();
  const { playlistId } = useParams();
  const playlist = usePlaylistById(playlistId || '');

  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsEditingPlaylist(false); }, [setIsEditingPlaylist]);
  const onSubmitCallback = useCallback(async (checkedPlaylistIds: string[]) => {
    if (checkedPlaylistIds.length === 0 || !playlistId) { return; }

    const trackUris = await getTrackUris(checkedPlaylistIds);

    let tracksAdded = 0;
    let snapshotId: string;
    do {
      snapshotId = (((await spotifyApi.replaceTracksInPlaylist(
        playlistId,
        trackUris.slice(tracksAdded, Math.min(trackUris.length, tracksAdded + 100))
        // TODO: remove type cast when TS type update is merged
      )).body as { snapshot_id: string })).snapshot_id;
      // tracksAdded will be inaccurate after the while loop, but that should be okay
      tracksAdded += 100;
    } while (tracksAdded < trackUris.length);
    batch(() => {
      dispatch(setSnapshotId({ playlistId, snapshotId }));
      dispatch(setComponentPlaylists({ playlistId, componentPlaylistIds: checkedPlaylistIds }));
    });

    closeOverlay();
  }, [playlistId, dispatch, closeOverlay]);

  if (!playlistId || !playlist) {
    return <p>Could not find the specified playlist</p>;
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
