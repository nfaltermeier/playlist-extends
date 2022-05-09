import {
  ReactNode, useCallback, useEffect, useRef, useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { refreshAuthWrapper } from '../lib/api';
import store from '../redux/store';
import { selectPlaylistById, addPlaylist, defaultSortSpec } from '../redux/playlists';
import spotifyApi from '../lib/spotifyApiKeeper';
import Dropdown from './Dropdown';
import styles from './PlaylistSearch.module.scss';

interface Playlist {
  name: string,
  owner?: string,
  id: string,
  snapshotId: string,
}

interface SearchState {
  isLoading: boolean,
  isErrored: boolean,
  results: Playlist[],
  lastSearchText: string
}

const notOnlyWhitespace = /\S/;

function PlaylistSearch({ onPlaylistSelected }: { onPlaylistSelected: (id: string) => void }) {
  const dispatch = useDispatch();
  const timeoutId = useRef<number | undefined>(undefined);
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false, isErrored: false, results: [], lastSearchText: '',
  });
  const lastSearchTextRef = useRef('');
  useEffect(() => {
    lastSearchTextRef.current = searchState.lastSearchText;
  }, [searchState]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const requestedPages = useRef(0);
  const searchInput = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownToggle = useCallback(() => {
    setShowDropdown((state) => !state);
  }, []);

  const doSearch = useCallback(async () => {
    try {
      const searchText = searchInput.current?.value;
      if (!searchText || !notOnlyWhitespace.test(searchText)) {
        setSearchState((state) => ({ ...state, isLoading: false }));
        return;
      }
      setTotalPages(0);
      setCurrentPage(1);
      setSearchState((state) => ({ ...state, results: [] }));
      requestedPages.current = 2;
      const results = (await refreshAuthWrapper(() => spotifyApi.searchPlaylists(searchText, { limit: 10 }))).body.playlists;
      if (!results) {
        // ???
        setSearchState((state) => ({ ...state, isErrored: true }));
        return;
      }
      setTotalPages(Math.ceil(results.total / 5));
      setCurrentPage(1);
      setSearchState({
        isLoading: false,
        isErrored: false,
        lastSearchText: searchText,
        results: results.items.map((playlist) => ({
          id: playlist.id, name: playlist.name, owner: playlist.owner.display_name, snapshotId: playlist.snapshot_id,
        })),
      });
    } catch (e) {
      console.error(e);
      requestedPages.current = 0;
      setTotalPages(0);
      setCurrentPage(1);
      setSearchState({
        isLoading: false, isErrored: true, results: [], lastSearchText: '',
      });
    }
  }, []);

  const onChange = useCallback(() => {
    const searchText = searchInput.current?.value;
    if (!searchText || !notOnlyWhitespace.test(searchText)) {
      return;
    }

    clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(doSearch, 2000);
    setSearchState((state) => ({ ...state, isLoading: true }));
  }, [doSearch]);

  const nextPage = useCallback(async () => {
    setCurrentPage(currentPage + 1);
    if (currentPage + 2 > requestedPages.current) {
      try {
        const searchText = searchState.lastSearchText;
        const offset = requestedPages.current * 5;
        requestedPages.current += 1;
        const results = (await refreshAuthWrapper(() => spotifyApi.searchPlaylists(searchText, { limit: 5, offset }))).body.playlists;
        if (searchText !== lastSearchTextRef.current) {
          return;
        }
        if (!results) {
          // ???
          setSearchState((state) => ({ ...state, isErrored: true }));
          return;
        }
        setTotalPages(Math.ceil(results.total / 5));
        const newResults = results.items.map((playlist) => ({
          id: playlist.id, name: playlist.name, owner: playlist.owner.display_name, snapshotId: playlist.snapshot_id,
        }));
        setSearchState((state) => ({
          isLoading: false,
          isErrored: false,
          lastSearchText: searchText,
          results: [...state.results.slice(0, offset), ...newResults, ...state.results.slice(offset + 5)],
        }));
      } catch (e) {
        console.error(e);
        requestedPages.current = 0;
        setTotalPages(0);
        setCurrentPage(1);
        setSearchState({
          isLoading: false, isErrored: true, results: [], lastSearchText: '',
        });
      }
    }
  }, [currentPage, searchState.lastSearchText]);

  const playlistClicked = useCallback((playlist: Playlist) => {
    const existingPlaylist = selectPlaylistById(store.getState(), playlist.id);
    if (!existingPlaylist) {
      dispatch(addPlaylist({
        id: playlist.id,
        name: playlist.name,
        snapshotId: playlist.snapshotId,
        componentPlaylistIds: [],
        needsSync: false,
        deletedOnSpotify: false,
        isUserPlaylist: false,
        lastSyncTracks: [],
        sortSpec: defaultSortSpec,
        playlistSortNumber: 0,
      }));
    }
    onPlaylistSelected(playlist.id);
    setShowDropdown(false);
  }, [dispatch, onPlaylistSelected]);

  let page: ReactNode;
  if (searchState.isErrored) {
    page = 'Search failed';
  } else {
    const pagePlaylists = searchState.results.slice((currentPage - 1) * 5, currentPage * 5);
    if (pagePlaylists.length === 0) {
      if (!searchState.isLoading && totalPages === 0) {
        page = 'No results';
      } else {
        page = 'Loading';
      }
    } else {
      page = pagePlaylists.map((playlist) => (
        <div>
          <button key={playlist.id} onClick={() => { playlistClicked(playlist); }} className={styles.playlistButton} type="button">{`${playlist.name} by ${playlist.owner}`}</button>
        </div>
      ));
    }
  }

  return (
    <Dropdown
      showDropdown={showDropdown}
      buttonCallback={dropdownToggle}
      buttonText="Search for Playlists"
      dropdownContent={(
        <div className={styles.dropdownContent}>
          <input type="text" onChange={onChange} placeholder="Search Playlists" ref={searchInput} defaultValue={searchState.lastSearchText} />
          <div>
            {page}
          </div>
          <div className={styles.navigationMenu}>
            <button type="button" onClick={() => { setCurrentPage(1); }}>First</button>
            <button type="button" disabled={currentPage <= 1} onClick={() => { setCurrentPage((pageNum) => pageNum - 1); }}>Previous</button>
            <span>{`${currentPage} / ${totalPages}`}</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={nextPage}>Next</button>
          </div>
        </div>
      )}
    />
  );
}

export default PlaylistSearch;
