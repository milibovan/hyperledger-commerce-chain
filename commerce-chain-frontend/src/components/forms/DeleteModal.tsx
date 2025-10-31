import { createPortal } from "react-dom";
import { useImperativeHandle, useRef, forwardRef } from "react";

interface ModalProps {
    children: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmClassName?: string;
    cancelClassName?: string;
    dialogClassName?: string;
    showActions?: boolean;
}

export interface ModalHandle {
    open: () => void;
    close: () => void;
}

const Modal = forwardRef<ModalHandle, ModalProps>(
  (
    {
      children,
      onConfirm,
      onCancel,
      confirmLabel = "Yes",
      cancelLabel = "No",
      confirmClassName = "px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 text-white font-semibold",
      cancelClassName = "px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-purple-300 font-semibold",
      dialogClassName = "backdrop:bg-black/80 bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50 max-w-2xl w-full",
      showActions = true,
    },
    ref
  ) => {
    const dialog = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => {
      return {
        open() {
          dialog.current?.showModal();
        },
        close() {
          dialog.current?.close();
        },
      };
    });

    const handleConfirm = () => {
      onConfirm?.();
      dialog.current?.close();
    };

    const handleCancel = () => {
      onCancel?.();
      dialog.current?.close();
    };

    return createPortal(
      <dialog ref={dialog} className={dialogClassName}>
        <div className="text-gray-300">
          {children}
        </div>
        {showActions && (
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className={cancelClassName}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={confirmClassName}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </dialog>,
      document.getElementById("modal-root")!
    );
  }
);

Modal.displayName = "Modal";

export default Modal;