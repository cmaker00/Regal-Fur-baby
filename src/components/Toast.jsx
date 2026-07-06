import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const TOAST_DURATION = 3200;

const TYPE_STYLES = {
  error: {
    bg: 'bg-blush',
    text: 'text-rosy',
    Icon: AlertCircle,
    emoji: '😿',
  },
  info: {
    bg: 'bg-sky',
    text: 'text-cocoa',
    Icon: Info,
    emoji: '💬',
  },
  success: {
    bg: 'bg-mint',
    text: 'text-cocoa',
    Icon: CheckCircle2,
    emoji: '✨',
  },
};

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => {
      try {
        onClose?.();
      } catch {
        /* onClose 실패는 무시 — 토스트는 알아서 사라짐 */
      }
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const style = (toast && TYPE_STYLES[toast.type]) || TYPE_STYLES.info;
  const { bg, text, Icon, emoji } = style;

  const handleClose = () => {
    try {
      onClose?.();
    } catch {
      /* 무시 */
    }
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          className="fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-4"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="알림 닫기"
            role="alert"
            className={`pointer-events-auto flex w-full max-w-[480px] items-center gap-2.5 rounded-full ${bg} ${text} px-5 py-4 text-left shadow-soft active:scale-[0.98] transition-transform`}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {emoji}
            </span>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-base font-round leading-snug break-keep">
              {toast.message}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
