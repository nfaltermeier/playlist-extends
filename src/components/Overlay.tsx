import React from 'react';
import styles from './Overlay.module.scss';

interface OverlayProps {
  isOpen: boolean,
  closeOverlay: () => void,
  children: React.ReactNode
}

function Overlay(props: OverlayProps) {
  const { isOpen, closeOverlay, children } = props;
  if (!isOpen) { return null; }

  return (
    <div role="none" className={styles.background} onClick={closeOverlay}>
      <div role="none" onClick={(event) => { event.stopPropagation(); }}>
        <div role="dialog">
          <div className={styles.closeButtonContainer}>
            <button onClick={closeOverlay} type="button">Close</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Overlay;
