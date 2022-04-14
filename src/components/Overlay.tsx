import React from 'react';
import styles from './Overlay.module.scss';

interface OverlayProps {
  isOpen: boolean,
  closeOverlay: () => void,
  children: React.ReactNode,
  containerClassname: string
}

function Overlay(props: OverlayProps) {
  const {
    isOpen, closeOverlay, children, containerClassname,
  } = props;
  if (!isOpen) { return null; }

  return (
    <div role="none" className={styles.background} onClick={closeOverlay}>
      <div role="none" className={containerClassname} onClick={(event) => { event.stopPropagation(); }}>
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
export const { defaultContainer: defaultContainerClassname } = styles;
