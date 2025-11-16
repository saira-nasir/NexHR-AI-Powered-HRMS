import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#2A2438] text-white w-full max-w-md rounded-2xl shadow-xl p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-400"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
