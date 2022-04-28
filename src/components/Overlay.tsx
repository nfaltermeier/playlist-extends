import React from 'react';
import styles from './Overlay.module.scss';

type OverlayProps = {
  isOpen: boolean,
  closeOverlay: () => void,
  children: React.ReactNode,
  containerClassname?: string,
  showCloseButton?: boolean,
  zIndex?: number,
} & typeof defaultProps;

const defaultProps = {
  containerClassname: styles.defaultContainer,
  showCloseButton: true,
  zIndex: 9,
};

function Overlay(props: OverlayProps) {
  const {
    isOpen, closeOverlay, children, containerClassname, showCloseButton, zIndex,
  } = props;
  if (!isOpen) { return null; }

  return (
    <div role="none" className={styles.background} onClick={closeOverlay} style={{ zIndex }}>
      <div role="none" className={containerClassname} onClick={(event) => { event.stopPropagation(); }}>
        <div role="dialog">
          {showCloseButton && (
            <div className={styles.closeButtonContainer}>
              <button onClick={closeOverlay} type="button">Close</button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

Overlay.defaultProps = defaultProps;

export default Overlay;
export const { defaultContainer: defaultContainerClassname } = styles;
