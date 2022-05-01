import { ReactNode, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import Overlay from '../components/Overlay';
import PlaylistsPicker from '../components/PlaylistsPicker';
import SongTree from '../components/SongTree';
import store from '../redux/store';
import { replaceDeletedPlaylist, updateExistingPlaylist } from '../lib/api';
import { getSortedPlaylist } from '../lib/sorting';
import {
  usePlaylistById, deletePlaylist, setSortSpec, hasDeletedComponent,
} from '../redux/playlists';

function EditPlaylist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const playlist = usePlaylistById(playlistId || '');

  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsEditingPlaylist(false); }, [setIsEditingPlaylist]);
  const onSubmitCallback = useCallback(async (checkedPlaylistIds: string[], sortSpec: string) => {
    if (checkedPlaylistIds.length === 0 || !playlistId) { return; }

    dispatch(setSortSpec({ playlistId, spec: sortSpec }));
    const namedTracks = await getSortedPlaylist(checkedPlaylistIds, sortSpec);
    await updateExistingPlaylist(playlistId, namedTracks, checkedPlaylistIds);

    closeOverlay();
  }, [playlistId, closeOverlay, dispatch]);

  if (!playlistId || !playlist) {
    return <p>Could not find the specified playlist</p>;
  }

  if (playlist.deletedOnSpotify) {
    let content: ReactNode = null;

    if (playlist.componentPlaylistIds.length > 0 && !hasDeletedComponent(store.getState(), playlist.id)) {
      content = (
        <>
          <p>This playlist was deleted on Spotify, but can be recreated.</p>
          <button
            type="button"
            onClick={async () => {
              const namedTracks = await getSortedPlaylist(playlist.componentPlaylistIds, playlist.sortSpec);

              const newPlaylistId = await replaceDeletedPlaylist(playlist.id, namedTracks);
              navigate(`/playlist/${newPlaylistId}`);
            }}
          >
            Recreate Playlist on Spotify
          </button>
        </>
      );
    } else if (playlist.componentPlaylistIds.length === 0) {
      content = <p>This playlist was deleted on Spotify and was not a composite playlist.</p>;
    } else {
      content = (
        <p>
          {'This playlist was deleted on Spotify and a necessary component playlist was also deleted,'
            + ' so the playlist cannot be recreated.'}
        </p>
      );
    }

    return (
      <div>
        <h2>{playlist.name}</h2>
        {content}
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
            intialSortSpec={playlist.sortSpec}
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
