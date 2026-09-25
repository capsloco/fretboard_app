import React, { useEffect, useRef } from 'react';

/**
 * daisyUI modal on a native <dialog>: Esc and backdrop clicks close it,
 * focus stays inside while it is open.
 */
export default function Modal({ open, onClose, labelledBy, className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={onClose} aria-labelledby={labelledBy}>
      <div className={`modal-box ${className}`}>{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
