import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HiringHandbookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const HiringHandbookDrawer: React.FC<HiringHandbookDrawerProps> = ({ isOpen, onClose, children }) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed and blurred overlay - covers entire screen including sidebar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Drawer content sliding from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 top-0 md:top-12 z-[70] bg-white rounded-t-3xl md:rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Close button with proper spacing */}
            <div className="absolute top-6 right-6 z-50">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Scrollable content area with top padding */}
            <div className="flex-1 overflow-y-auto pt-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HiringHandbookDrawer;
