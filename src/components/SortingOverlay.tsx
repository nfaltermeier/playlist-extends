import React, { useCallback, useState } from 'react';
import { sortParts } from '../lib/sorting';
import Overlay from './Overlay';

function Sorting({ initialSpec, saveCallback } : { initialSpec: string, saveCallback: (spec: string) => void }) {
  const [spec, setSpec] = useState(() => {
    const parts = initialSpec.split(';');
    const state = [];
    for (let i = 0; i < parts.length; i += 2) {
      state.push({ key: parts[i], order: parts[i + 1] });
    }
    if (state[state.length - 1].key !== 'custom') {
      state.push({ key: '', order: '' });
    }
    return state;
  });

  const methodOnChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>((e) => {
    const select = e.target;
    const index = Number(select.dataset.index);
    const option = select.selectedOptions[0];

    setSpec((oldSpec) => {
      const newSpec = oldSpec.slice(0, index);
      if (select.value !== '') {
        newSpec.push({ key: select.value, order: option.dataset.defaultSort || 'a' });
        // Don't add a blank entry after custom because it cannot have ties so no further sorting is needed
        if (select.value !== 'custom') {
          newSpec.push({ key: '', order: '' });
        }
      } else {
        newSpec.push({ key: '', order: '' });
      }
      return newSpec;
    });
  }, []);

  const orderOnChange = useCallback<React.ChangeEventHandler<HTMLSelectElement>>((e) => {
    const select = e.target;
    const index = Number(select.dataset.index);

    setSpec((oldSpec) => {
      const oldValue = oldSpec[index];
      const newSpec = oldSpec.slice(0, index);
      newSpec.push({ key: oldValue.key, order: select.value });
      return newSpec.concat(oldSpec.slice(index + 1));
    });
  }, []);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
  }, []);

  const options = new Array(...sortParts);
  return (
    <>
      <button type="button" onClick={() => { setOverlayOpen(true); }}>Open sorting</button>
      <Overlay isOpen={overlayOpen} closeOverlay={closeOverlay} showCloseButton={false} zIndex={15}>
        <h2>Sorting</h2>
        <ol>
          {spec.map((v, i) => {
            const currentOptions = options.map((o) => (
              <option key={o.key} value={o.key} data-default-sort={o.defaultOrder}>{o.name}</option>
            ));
            const current = options.findIndex((o) => o.key === v.key);
            if (current !== -1) {
              options.splice(current, 1);
            }
            const methodId = `method${i}`;
            const orderId = `order${i}`;
            return (
              <li key={v.key}>
                <label htmlFor={methodId}>
                  {'method: '}
                  <select value={v.key} id={methodId} onChange={methodOnChange} data-index={i}>
                    <option value=""> </option>
                    {currentOptions}
                  </select>
                </label>
                <label htmlFor={orderId}>
                  {'order: '}
                  <select value={v.order} id={orderId} onChange={orderOnChange} data-index={i}>
                    <option value=""> </option>
                    <option value="a">Ascending</option>
                    <option value="d">Descending</option>
                  </select>
                </label>
              </li>
            );
          })}
        </ol>
        <div>
          <button
            type="button"
            onClick={() => {
              const specParts = spec.filter((s) => s.key !== '').map((s) => `${s.key};${s.order || 'a'}`);
              saveCallback(specParts.reduce((p, c) => (p === '' ? c : `${p};${c}`)));
              closeOverlay();
            }}
          >
            Save
          </button>
          <button type="button" onClick={closeOverlay}>Cancel</button>
        </div>
      </Overlay>
    </>
  );
}

export default Sorting;
