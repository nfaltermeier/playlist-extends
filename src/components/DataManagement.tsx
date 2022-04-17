import { useCallback, useRef, useState } from 'react';
import Overlay from './Overlay';
import { persistor, RootState, getLocalStorageKey } from '../redux/store';
import { useLoggedIn } from '../redux/loggedIn';
import styles from './DataManagement.module.scss';

function DataManagement() {
  const [isDataOverlayOpen, setIsDataOverlayOpen] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const downloadClicked = useCallback(async () => {
    setMessage('');
    let dataURL: string | null = null;
    try {
      await persistor.flush();
      const data = localStorage.getItem(`persist:${getLocalStorageKey()}`);
      if (!data) {
        setMessage('Could not find the saved data');
        return;
      }
      dataURL = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
      const downloadElement = document.createElement('a');
      downloadElement.href = dataURL;
      downloadElement.download = 'playlist-extends-backup.bak';
      downloadElement.click();
    } catch (e) {
      console.error(e);
      setMessage('An error occured while generating the backup');
    } finally {
      setTimeout(() => {
        if (dataURL !== null) {
          URL.revokeObjectURL(dataURL);
        }
      }, 60000);
    }
  }, []);

  const restoreBackup = useCallback((f: File) => {
    const fr = new FileReader();
    fr.addEventListener('load', () => {
      const result = fr.result as string;
      const parsedResult = JSON.parse(result) as RootState;
      // eslint-disable-next-line no-underscore-dangle
      if (parsedResult.playlists && parsedResult._persist) {
        localStorage.setItem(`persist:${getLocalStorageKey()}`, result);
        window.location.reload();
      } else {
        setMessage('The loaded file does not appear to be a valid Playlist Extends backup');
      }
    });
    fr.addEventListener('error', () => {
      console.error(fr.error);
      setMessage('Something went wrong loading the file');
    });
    fr.readAsText(f);
  }, []);

  const loggedIn = useLoggedIn();
  if (!loggedIn) {
    return null;
  }

  return (
    <>
      <button type="button" onClick={() => { setIsDataOverlayOpen((state) => !state); }}>Backup Management</button>
      <Overlay
        isOpen={isDataOverlayOpen}
        closeOverlay={() => { setIsDataOverlayOpen(false); }}
        containerClassname={styles.overlaySize}
      >
        <div
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); restoreBackup(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {message}
          <h2>Backup Management</h2>
          <div className={styles.bottomMargin}>
            <button type="button" onClick={downloadClicked}>Download backup</button>
          </div>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (fileInput.current) {
                  restoreBackup((fileInput.current.files as FileList)[0]);
                }
              }}
            >
              <label htmlFor="backup-file">
                {'Select backup file '}
                <input type="file" id="backup-file" accept=".bak" ref={fileInput} required />
              </label>
              <input type="submit" value="Restore backup" />
            </form>
            Or, drop the file into this overlay
          </div>
        </div>
      </Overlay>
    </>
  );
}

export default DataManagement;
