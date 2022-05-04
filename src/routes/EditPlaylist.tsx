import {
  ReactNode, useCallback, useRef, useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import Overlay from '../components/Overlay';
import PlaylistsPicker from '../components/PlaylistsPicker';
import SongTree from '../components/SongTree';
import store from '../redux/store';
import { replaceDeletedPlaylist, updateExistingPlaylist } from '../lib/api';
import { hasDeletedComponent } from '../lib/playlistsHelper';
import {
  usePlaylistById, deletePlaylist,
} from '../redux/playlists';
import { useDefaultPublicPlaylists } from '../redux/preferences';
import LoadingButton from '../components/LoadingButton';

function EditPlaylist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const playlist = usePlaylistById(playlistId || '');

  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsEditingPlaylist(false); }, [setIsEditingPlaylist]);
  const onEditOverlaySubmit = useCallback(async (checkedPlaylistIds: string[], sortSpec: string) => {
    if (checkedPlaylistIds.length === 0 || !playlistId) { return; }

    await updateExistingPlaylist(playlistId, checkedPlaylistIds, sortSpec);

    closeOverlay();
  }, [playlistId, closeOverlay]);

  const publicPlaylistInput = useRef<HTMLInputElement>(null);
  const defaultPublic = useDefaultPublicPlaylists();
  const [publicPlaylist, setPublicPlaylist] = useState(defaultPublic);
  const togglePublicPlaylist = useCallback(() => setPublicPlaylist((p) => !p), []);

  if (!playlistId || !playlist) {
    return <p>Could not find the specified playlist</p>;
  }

  if (playlist.deletedOnSpotify) {
    let content: ReactNode = null;

    if (playlist.componentPlaylistIds.length > 0 && !hasDeletedComponent(store.getState(), playlist.id)) {
      content = (
        <>
          <p>This playlist was deleted on Spotify, but can be recreated.</p>
          <div>
            <label htmlFor="PublicPlaylist">
              {'Recreate playlist as public: '}
              <input
                id="PublicPlaylist"
                type="checkbox"
                ref={publicPlaylistInput}
                checked={publicPlaylist}
                onChange={togglePublicPlaylist}
              />
            </label>
          </div>
          <LoadingButton
            onClick={async () => {
              const newPlaylistId = await replaceDeletedPlaylist(playlist.id, publicPlaylist);
              navigate(`/playlist/${newPlaylistId}`);
            }}
          >
            Recreate Playlist on Spotify
          </LoadingButton>
        </>
      );
    } else if (playlist.componentPlaylistIds.length === 0) {
      content = <p>This playlist was deleted on Spotify and was not a composite playlist. It cannot be recreated.</p>;
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
            navigate('/home');
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
            onSubmitCallback={onEditOverlaySubmit}
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
