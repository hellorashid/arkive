import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { useRef } from 'react';
import { X } from 'lucide-react';
import { JSONContent } from '@tiptap/react';
import TiptapEditor from './TiptapEditor';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
}

export default function MobileDrawer({ isOpen, onClose, title, content, onChange }: MobileDrawerProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down more than 100px or with enough velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-tarot-dark border-t border-tarot-gold/30 rounded-t-2xl h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div 
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-tarot-gold/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-tarot-gold/20">
              <h2 className="text-tarot-gold-light font-semibold text-lg font-tarot tracking-wide">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-tarot-gold/60 hover:text-tarot-gold-light transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              <TiptapEditor
                content={content}
                onChange={onChange}
                placeholder="how was your day?"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
