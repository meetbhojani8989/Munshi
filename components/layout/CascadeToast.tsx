import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CascadeToast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed right-5 bottom-40 md:bottom-24 z-30 card shadow-xl max-w-xs"
        >
          <b className="positive flex gap-2">
            <Check /> The cascade is complete
          </b>
          <p className="text-sm mt-2">{message}</p>
          <div className="text-xs muted mt-2">
            Inventory → payables → journal → margins
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
