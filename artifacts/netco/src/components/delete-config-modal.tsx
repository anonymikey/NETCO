'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';

interface DeleteConfigModalProps {
  isOpen: boolean;
  planName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfigModal({
  isOpen,
  planName,
  onConfirm,
  onCancel,
}: DeleteConfigModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-400/20 bg-gradient-to-br from-red-400/5 via-background to-rose-500/5 backdrop-blur-xl shadow-2xl shadow-red-400/20">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-transparent to-rose-500/0 pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 p-8 space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 40 }}
                  className="w-16 h-16 mx-auto rounded-full bg-red-400/20 border border-red-400/30 flex items-center justify-center"
                >
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </motion.div>

                {/* Heading */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-center space-y-2"
                >
                  <h2 className="text-2xl font-bold text-white">Delete Configuration?</h2>
                  <p className="text-sm text-muted-foreground">
                    {planName}
                  </p>
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-red-400/10 rounded-lg border border-red-400/20 p-4 space-y-2"
                >
                  <p className="text-sm text-white font-medium">This will permanently remove this configuration from your account.</p>
                  <p className="text-xs text-red-400 font-semibold">This action cannot be undone.</p>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 rounded-lg border border-red-500/30 p-3"
                  >
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex gap-3 pt-4"
                >
                  <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-lg border border-border/50 text-foreground font-medium transition-all duration-300 hover:bg-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-red-400 to-rose-400 text-background font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-red-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Configuration
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* NETCO Branding Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center pt-4 border-t border-border/20"
                >
                  <p className="text-xs text-muted-foreground">NETCO VPN</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
