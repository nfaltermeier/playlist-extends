import React from "react";
import styles from './Overlay.module.scss';

interface OverlayProps {
  isOpen: boolean,
  closeOverlay: () => void,
  children: React.ReactNode
};

const Overlay = (props: OverlayProps) => {
  const { isOpen, closeOverlay, children } = props;
  if (!isOpen)
    return null;

  return (
    <div className={styles.background} onClick={closeOverlay}>
      <div onClick={(event) => { event.stopPropagation(); }}>
        <div className={styles.closeButtonContainer}>
          <button onClick={closeOverlay}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Overlay;
