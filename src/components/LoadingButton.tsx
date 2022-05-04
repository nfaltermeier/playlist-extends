import {
  ReactNode, useCallback, useEffect, useState,
} from 'react';
import styles from './LoadingButton.module.scss';

function useLoadingStatusHelper<T>(callback: () => Promise<T>): [() => Promise<T>, ReactNode] {
  const [state, setState] = useState({ loading: false, succeeded: false, errored: false });
  let isUnmounted = false;
  // eslint warns this assignment will get lost on rerender, which is true, but is fine for this use case.
  // This flag prevents setState being called after the component is unmounted due to the callback, which
  // would make react log a warning. I think this is the best way to avoid the warning, since I do not believe
  // what it is warning about is a problem here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => (() => { isUnmounted = true; }), []);
  const wrappedCallback = useCallback(async () => {
    try {
      setState({ loading: true, succeeded: false, errored: false });
      const minTime = new Promise((resolve) => { setTimeout(() => { resolve(null); }, 125); });
      const result = await callback();
      await minTime;
      if (!isUnmounted) {
        setState({ loading: false, succeeded: true, errored: false });
      }
      return result;
    } catch (e) {
      setState({ loading: false, succeeded: false, errored: true });
      throw e;
    }
  }, [callback, isUnmounted]);

  let indicator: ReactNode = null;
  if (state.loading) {
    indicator = <div className={styles.loading}>•</div>;
  } else if (state.succeeded) {
    indicator = <span className={styles.succeded}>✔</span>;
  } else if (state.errored) {
    indicator = <span className={styles.errored}>X</span>;
  }
  if (indicator !== null) {
    indicator = (
      <>
        {'  '}
        {indicator}
      </>
    );
  }

  return [wrappedCallback, indicator];
}

function LoadingButton({ children, onClick }: { children: ReactNode, onClick: () => Promise<void> }) {
  const [wrappedCallback, indicator] = useLoadingStatusHelper(onClick);

  return (
    <div className={styles.wrapper}>
      <button type="button" onClick={wrappedCallback}>
        {children}
      </button>
      {indicator}
    </div>
  );
}

export default LoadingButton;
export { useLoadingStatusHelper };
