import { ReactNode, useEffect, useState } from 'react';
import { paginateAndRefreshAuth, updateExistingPlaylist } from '../lib/api';
import checkSync, { SyncCheckResult } from '../lib/checkSync';
import spotifyApi from '../lib/spotifyApiKeeper';
import { ExtendablePlaylist, selectPlaylistById, NamedTrack } from '../redux/playlists';
import store from '../redux/store';
import styles from './SongTree.module.scss';

type SubPlaylist = {
  id: string,
  name: string,
  subPlaylists: SubPlaylist[],
  songs: {
    name: string,
    uri: string,
  }[]
};

interface ExtraPlaylistsState {
  isLoading: boolean,
  isErrored: boolean,
  data: {
    tree: SubPlaylist,
    sync: SyncCheckResult[]
  } | undefined
}

function SongTree({ topPlaylist }: { topPlaylist: ExtendablePlaylist }) {
  const [extraPlaylistsState, setExtraPlaylistsState] = useState<ExtraPlaylistsState>({ isLoading: true, isErrored: false, data: undefined });
  useEffect(() => {
    let tracks = new Array<NamedTrack>();
    const getPlaylist = async (playlist: ExtendablePlaylist): Promise<SubPlaylist> => {
      // assuming for now that composite playlists don't have any songs of their own
      if (playlist.componentPlaylistIds.length === 0) {
        return {
          id: playlist.id,
          name: playlist.name,
          subPlaylists: [],
          songs: (await paginateAndRefreshAuth((offset) => (
            spotifyApi.getPlaylistTracks(playlist.id, { fields: 'items(track(uri,name)),total', limit: 50, offset })
          ))).map((song) => ({ name: song.track.name, uri: song.track.uri })),
        };
      }
      const subPlaylists = await Promise.all(playlist.componentPlaylistIds.map((componentId) => {
        const componentPlaylist = selectPlaylistById(store.getState(), componentId);
        if (!componentPlaylist) {
          throw new Error(`Component playlist not found for ${componentId}`);
        }
        return getPlaylist(componentPlaylist);
      }));
      tracks = subPlaylists.flatMap((sp) => sp.songs).concat(tracks);
      return {
        id: playlist.id,
        name: playlist.name,
        songs: [],
        subPlaylists,
      };
    };

    getPlaylist(topPlaylist).then((playlistData) => {
      const sync = checkSync(topPlaylist.lastSyncTracks, tracks);
      setExtraPlaylistsState({ isLoading: false, isErrored: false, data: { tree: playlistData, sync } });
    }).catch((err) => {
      console.error(err);
      setExtraPlaylistsState({ isLoading: false, isErrored: true, data: undefined });
    });
  }, [topPlaylist]);

  let content: ReactNode;
  const { isLoading, isErrored, data } = extraPlaylistsState;
  if (isLoading) {
    content = <p>Loading playlist songs</p>;
  } else if (isErrored || !data) {
    content = <p>Failed to load playlist songs</p>;
  } else {
    const renderSong = (song: NamedTrack) => {
      let extra: React.ReactNode = null;
      const sync = data.sync.find((e) => e.uri === song.uri);
      if (sync) {
        if (sync.added) {
          extra = <span className={styles.added}>Added</span>;
        } else if (sync.removed) {
          extra = <span className={styles.removed}>Removed</span>;
        } else if (sync.reordered) {
          extra = <span className={styles.reordered}>Reordered</span>;
        }
      }

      return (
        <li key={song.uri}>
          {song.name}
          {' '}
          {extra}
        </li>
      );
    };

    const renderTree = (subPlaylist: SubPlaylist) => (
      <li key={subPlaylist.id}>
        {subPlaylist.name}
        {subPlaylist.subPlaylists && <ul>{subPlaylist.subPlaylists.map((subSub) => renderTree(subSub))}</ul>}
        {subPlaylist.songs && (<ul>{subPlaylist.songs.map((song) => renderSong(song))}</ul>)}
      </li>
    );

    const deleted = new Array<SyncCheckResult>();
    data.sync.some((v) => {
      if (v.removed) {
        deleted.push(v);
        return false;
      }
      return true;
    });

    const syncOnClick = () => {
      // Filter out removed songs and ensure other properties aren't saved in the redux store
      const finalSongs = data.sync.filter((s) => !s.removed).map((s) => ({ name: s.name, uri: s.uri }));
      updateExistingPlaylist(topPlaylist.id, finalSongs, topPlaylist.componentPlaylistIds);
    };

    content = (
      <>
        {topPlaylist.needsSync && (
          <div>
            <button
              type="button"
              onClick={syncOnClick}
            >
              Sync to Spotify
            </button>
          </div>
        )}
        <div className={styles.treeRoot}>
          <ul>
            {deleted.map((v) => renderSong(v))}
            {renderTree(data.tree)}
          </ul>
        </div>
      </>
    );
  }

  return <div>{content}</div>;
}

export default SongTree;
