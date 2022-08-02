import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useDispatch, useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import Overlay from '../components/Overlay';
import NewPlaylist from '../components/NewPlaylist';
import { usePlaylists, changeSortOrder, selectPlaylistById } from '../redux/playlists';
import styles from './Homepage.module.scss';
import { fetchPlaylists, syncMultiplePlaylists } from '../lib/api';
import { makeSyncOrder } from '../lib/playlistsHelper';
import LoadingButton from '../components/LoadingButton';

function Homepage() {
  const playlists = usePlaylists();
  const store = useStore();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const closeOverlay = useCallback(() => { setIsCreatingPlaylist(false); }, [setIsCreatingPlaylist]);

  const dragGhost = useRef<HTMLElement | null>(null);
  const dispatch = useDispatch();
  const changeSort = useCallback((data: DataTransfer, target: HTMLElement, targetId: string) => {
    const toMoveId = data.getData('plx/playlistId');
    const toMove = document.getElementById(toMoveId);
    const toMoveTo = selectPlaylistById(store.getState(), targetId);
    if (toMove && toMoveTo) {
      target.insertAdjacentElement('beforebegin', toMove);
      dispatch(changeSortOrder({ playlistToMoveId: toMoveId, newIndex: toMoveTo.playlistSortNumber }));
    }
    dragGhost.current!.remove();
  }, [store, dispatch]);
  useEffect(() => {
    const ghost = document.createElement('tr');
    ghost.setAttribute('class', styles.dragGhost);
    ghost.innerHTML = '<td>Playlist Here</td><td colspan=3 />';
    ghost.addEventListener('drop', (e) => {
      e.preventDefault();
      changeSort(e.dataTransfer!, ghost, ghost.dataset.destinationId!);
    });
    ghost.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
    });
    dragGhost.current = ghost;
    return () => { ghost.remove(); };
  }, [changeSort]);
  const dragStartHandler = useCallback<React.DragEventHandler<HTMLTableRowElement>>((e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('plx/playlistId', e.currentTarget.id);
  }, []);
  const dragOverHandler = useCallback<React.DragEventHandler<HTMLTableRowElement>>((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragGhost.current!.dataset.destinationId = e.currentTarget.id;
    e.currentTarget.insertAdjacentElement('beforebegin', dragGhost.current!);
  }, []);
  // Not sure if this will ever get called because the drag ghost should be what gets dropped on
  const dropHandler = useCallback<React.DragEventHandler<HTMLTableRowElement>>((e) => {
    e.preventDefault();
    changeSort(e.dataTransfer, e.currentTarget, e.currentTarget.id);
  }, [changeSort]);
  const dragEndHandler = useCallback<React.DragEventHandler<HTMLTableRowElement>>((e) => {
    e.preventDefault();
    dragGhost.current!.remove();
  }, []);

  return (
    <div>
      <h2>Playlists</h2>
      <div>
        <button onClick={() => { setIsCreatingPlaylist(true); }} type="button">New Playlist</button>
        <LoadingButton onClick={fetchPlaylists}>Refresh playlists</LoadingButton>
        {playlists.some((p) => p.needsSync) && (
          <LoadingButton
            onClick={() => syncMultiplePlaylists(
              makeSyncOrder(store.getState(), playlists.filter((p) => p.needsSync).map((p) => p.id))
            )}
          >
            Sync all playlists
          </LoadingButton>
        )}
      </div>
      <Overlay isOpen={isCreatingPlaylist} closeOverlay={closeOverlay}>
        <NewPlaylist closeOverlay={closeOverlay} />
      </Overlay>
      <div className={styles.playlistContent}>
        <table>
          <thead>
            <tr>
              <td>Name</td>
              <td>Type</td>
              <td>Status</td>
              <td>Edit</td>
            </tr>
          </thead>
          <tbody>
            {playlists.map((playlist) => {
              let status;
              if (playlist.deletedOnSpotify) {
                status = 'Deleted';
              } else if (playlist.needsSync) {
                status = 'Needs Sync';
              } else {
                status = '';
              }
              let type;
              if (playlist.componentPlaylistIds.length > 0) {
                type = 'Extended';
              } else if (!playlist.isUserPlaylist) {
                type = 'External';
              } else {
                type = '';
              }
              return (
                <tr
                  key={playlist.id}
                  id={playlist.id}
                  draggable
                  onDragStart={dragStartHandler}
                  onDragOver={dragOverHandler}
                  onDrop={dropHandler}
                  onDragEnd={dragEndHandler}
                >
                  <td>{playlist.name}</td>
                  <td>{type}</td>
                  <td>{status}</td>
                  <td>
                    <Link to={`/playlist/${playlist.id}`}>
                      {playlist.componentPlaylistIds.length > 0 ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.hideMobile}>
        Tip: Drag playlists to reorder them.
      </div>
    </div>
  );
}

export default Homepage;
