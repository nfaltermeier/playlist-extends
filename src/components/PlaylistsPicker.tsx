import {
  ReactNode, useCallback, useRef, useState,
} from 'react';
import { usePlaylists } from '../redux/playlists';
import PlaylistSearch from './PlaylistSearch';
import styles from './PlaylistsPicker.module.scss';

type PlaylistsPickerProps = {
  title: string,
  onSubmitCallback: (checkedPlaylistIds: string[]) => void,
  bottomMenu: ReactNode,
  bottomMenuContainerClassName?: string,
  submitButtonClassName?: string,
  initiallyCheckedPlaylistIds?: string[],
} & typeof defaultProps;

const defaultProps = {
  bottomMenuContainerClassName: '',
  submitButtonClassName: '',
  initiallyCheckedPlaylistIds: new Array<string>(),
};

const useForceRerender = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [value, setValue] = useState(0);
  return useCallback(() => setValue((value2) => value2 + 1), []);
};

function PlaylistsPicker(props: PlaylistsPickerProps) {
  const {
    title, onSubmitCallback, bottomMenu, bottomMenuContainerClassName, submitButtonClassName, initiallyCheckedPlaylistIds,
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

  const onSubmit: React.FormEventHandler<HTMLFormElement> = useCallback((event) => {
    event.preventDefault();
    onSubmitCallback(Array.from(checkedPlaylists.current));
  }, [onSubmitCallback]);

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
    <form onSubmit={onSubmit}>
      <h2>{title}</h2>
      <PlaylistSearch />
      <div className={styles.optionsList}>{content}</div>
      <div className={bottomMenuContainerClassName}>
        {bottomMenu}
        <div>
          <input id="submit" type="submit" value="Save" className={submitButtonClassName} />
        </div>
      </div>
    </form>
  );
}

PlaylistsPicker.defaultProps = defaultProps;

export default PlaylistsPicker;
