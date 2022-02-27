import { ReactNode, useEffect, useState } from 'react';
import { paginateAndRefreshAuth } from '../lib/Api';
import spotifyApi from '../lib/spotifyApiKeeper';
import { ExtendablePlaylist, selectPlaylistById } from '../redux/playlists';
import store from '../redux/store';
import styles from './SongTree.module.scss';

type SubPlaylist = {
  id: string,
  name: string,
  subPlaylists: SubPlaylist[],
  songs: {
    name: string,
    id: string,
  }[]
};

interface ExtraPlaylistsState {
  isLoading: boolean,
  isErrored: boolean,
  data: SubPlaylist | undefined
}

function SongTree({ topPlaylist }: { topPlaylist: ExtendablePlaylist }) {
  const [extraPlaylistsState, setExtraPlaylistsState] = useState<ExtraPlaylistsState>({ isLoading: true, isErrored: false, data: undefined });
  useEffect(() => {
    const getPlaylist = async (playlist: ExtendablePlaylist): Promise<SubPlaylist> => {
      // assuming for now that composite playlists don't have any songs of their own
      if (playlist.componentPlaylistIds.length === 0) {
        return {
          id: playlist.id,
          name: playlist.name,
          subPlaylists: [],
          songs: (await paginateAndRefreshAuth((offset) => (
            spotifyApi.getPlaylistTracks(playlist.id, { fields: 'items(track(id,name)),total', limit: 50, offset })
          ))).map((song) => ({ name: song.track.name, id: song.track.id })),
        };
      }
      return {
        id: playlist.id,
        name: playlist.name,
        songs: [],
        subPlaylists: await Promise.all(playlist.componentPlaylistIds.map((componentId) => {
          const componentPlaylist = selectPlaylistById(store.getState(), componentId);
          if (!componentPlaylist) {
            throw new Error(`Component playlist not found for ${componentId}`);
          }
          return getPlaylist(componentPlaylist);
        })),
      };
    };

    getPlaylist(topPlaylist).then((playlistData) => {
      setExtraPlaylistsState({ isLoading: false, isErrored: false, data: playlistData });
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
    const renderTree = (subPlaylist: SubPlaylist) => (
      <li key={subPlaylist.id}>
        {subPlaylist.name}
        {subPlaylist.subPlaylists && <ul>{subPlaylist.subPlaylists.map((subSub) => renderTree(subSub))}</ul>}
        {subPlaylist.songs && <ul>{subPlaylist.songs.map((song) => <li key={song.id}>{song.name}</li>)}</ul>}
      </li>
    );
    content = (
      <div className={styles.treeRoot}>
        <ul>{renderTree(data)}</ul>
      </div>
    );
  }

  return <div>{content}</div>;
}

export default SongTree;
