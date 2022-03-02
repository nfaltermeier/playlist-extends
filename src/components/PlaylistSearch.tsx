import { useCallback, useRef, useState } from 'react';
import { refreshAuthWrapper } from '../lib/Api';
import spotifyApi from '../lib/spotifyApiKeeper';
import Dropdown from './Dropdown';

interface Playlist {
  name: string,
  owner?: string,
  id: string
}

interface SearchState {
  isLoading: boolean,
  isErrored: boolean,
  results: Playlist[],
  lastSearchText: string
}

const notOnlyWhitespace = /\S/g;

function PlaylistSearch() {
  const timeoutId = useRef<number | undefined>(undefined);
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false, isErrored: false, results: [], lastSearchText: '',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const searchInput = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async () => {
    try {
      const searchText = searchInput.current?.value;
      if (!searchText || !notOnlyWhitespace.test(searchText)) {
        setSearchState((state) => ({ ...state, isLoading: false }));
        return;
      }
      const results = (await refreshAuthWrapper(() => spotifyApi.searchPlaylists(searchText, { limit: 10 }))).body.playlists;
      if (!results) {
        setSearchState((state) => ({ ...state, isLoading: false }));
        return;
      }
      setTotalPages(Math.ceil(results.total / 5));
      setCurrentPage(0);
      setSearchState({
        isLoading: false,
        isErrored: false,
        lastSearchText: searchText,
        results: results.items.map((playlist) => ({ id: playlist.id, name: playlist.name, owner: playlist.owner.display_name })),
      });
    } catch (e) {
      console.error(e);
      setSearchState({
        isLoading: false, isErrored: true, results: [], lastSearchText: '',
      });
    }
  }, []);

  const onInput = useCallback(() => {
    const searchText = searchInput.current?.value;
    if (!searchText || !notOnlyWhitespace.test(searchText)) {
      return;
    }

    clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(doSearch, 2000);
    setSearchState((state) => ({ ...state, isLoading: true }));
  }, [doSearch]);

  return (
    <Dropdown
      dropdownPrompt={<input type="text" onInput={onInput} placeholder="Search Playlists" ref={searchInput} />}
      dropdownContent={(
        <div>
          <div>
            {searchState.results.slice(currentPage * 5, (currentPage + 1) * 5).map((playlist) => (
              <p key={playlist.id}>{`${playlist.name} by ${playlist.owner}`}</p>
            ))}
          </div>
          <div>
            <button type="button" onClick={() => { setCurrentPage(0); }}>First</button>
            <button type="button" disabled={currentPage === 0} onClick={() => { setCurrentPage((page) => page - 1); }}>Previous</button>
            <span>{`${currentPage} / ${totalPages}`}</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => { setCurrentPage((page) => page + 1); }}>Next</button>
          </div>
        </div>
      )}
    />
  );
}

export default PlaylistSearch;
