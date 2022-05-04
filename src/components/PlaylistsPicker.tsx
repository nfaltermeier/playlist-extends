import {
  ReactNode, useCallback, useRef, useState,
} from 'react';
import { usePlaylists } from '../redux/playlists';
import { useLoadingStatusHelper } from './LoadingButton';
import PlaylistSearch from './PlaylistSearch';
import styles from './PlaylistsPicker.module.scss';
import Sorting from './SortingOverlay';

type PlaylistsPickerProps = {
  title: string,
  onSubmitCallback: (checkedPlaylistIds: string[], sortSpec: string) => Promise<void>,
  bottomMenu: ReactNode,
  bottomMenuContainerClassName?: string,
  submitButtonClassName?: string,
  initiallyCheckedPlaylistIds?: string[],
  intialSortSpec?: string,
} & typeof defaultProps;

const defaultProps = {
  bottomMenuContainerClassName: '',
  submitButtonClassName: '',
  initiallyCheckedPlaylistIds: new Array<string>(),
  intialSortSpec: 'custom;a',
};

const useForceRerender = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [value, setValue] = useState(0);
  return useCallback(() => setValue((value2) => value2 + 1), []);
};

function PlaylistsPicker(props: PlaylistsPickerProps) {
  const {
    title, onSubmitCallback, bottomMenu, bottomMenuContainerClassName,
    submitButtonClassName, initiallyCheckedPlaylistIds, intialSortSpec,
  } = props;
  const playlists = usePlaylists();
  const checkedPlaylists = useRef(new Set<string>(initiallyCheckedPlaylistIds));
  const forceRerender = useForceRerender();
  const togglePlaylist = useCallback((id: string) => {
    if (!checkedPlaylists.current.delete(id)) {
      checkedPlaylists.current.add(id);
    }
    forceRerender();
  }, [checkedPlaylists, forceRerender]);

  const [sortSpec, setSortSpec] = useState(intialSortSpec);

  const unwrappedOnSubmit = useCallback(async () => {
    await onSubmitCallback(Array.from(checkedPlaylists.current), sortSpec);
  }, [onSubmitCallback, sortSpec]);
  const [wrappedOnSubmit, loadingIndicator] = useLoadingStatusHelper(unwrappedOnSubmit);
  const [message, setMessage] = useState('');
  const doubleWrappedOnSubmit: React.FormEventHandler<HTMLFormElement> = useCallback((event) => {
    event.preventDefault();
    if (checkedPlaylists.current.size > 0) {
      setMessage('');
      wrappedOnSubmit();
    } else {
      setMessage('Please select at least one playlist');
    }
  }, [wrappedOnSubmit]);

  let content;
  const filteredPlaylists = playlists.filter((playlist) => !playlist.deletedOnSpotify);
  if (filteredPlaylists.length > 0) {
    content = filteredPlaylists.map((playlist) => {
      const id = `PlaylistPicker-${playlist.id}`;
      return (
        <div key={playlist.id}>
          <label htmlFor={id}>
            {playlist.name}
            <input type="checkbox" id={id} checked={checkedPlaylists.current.has(playlist.id)} onChange={() => { togglePlaylist(playlist.id); }} />
          </label>
        </div>
      );
    });
  } else {
    content = 'Missing playlists';
  }

  return (
    <form onSubmit={doubleWrappedOnSubmit}>
      <h2>{title}</h2>
      <PlaylistSearch onPlaylistSelected={togglePlaylist} />
      <Sorting initialSpec={intialSortSpec} saveCallback={setSortSpec} />
      <div className={styles.optionsList}>{content}</div>
      <span className={styles.message}>{message}</span>
      <div className={`${bottomMenuContainerClassName} ${styles.bottomContainer}`}>
        {bottomMenu}
        <div>
          <input id="submit" type="submit" value="Save" className={submitButtonClassName} />
          {loadingIndicator}
        </div>
      </div>
    </form>
  );
}

PlaylistsPicker.defaultProps = defaultProps;

export default PlaylistsPicker;
