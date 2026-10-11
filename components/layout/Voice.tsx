import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, X, ArrowRight } from "lucide-react";
import { ease } from "@/components/layout/ui";

export function VoiceButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="no-print fixed right-4 md:right-6 bottom-24 md:bottom-6 z-30 w-14 h-14 rounded-full bg-[var(--brand)] text-[var(--on-brand)] shadow-[var(--shadow-lg)] flex items-center justify-center"
      aria-label="Voice assistant"
    >
      <Mic size={20} />
      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />
    </motion.button>
  );
}

// Equaliser bars shown while listening.
function Bars({ on }: { on: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-current origin-bottom h-full"
          animate={on ? { scaleY: [0.3, 1, 0.5, 0.9, 0.3] } : { scaleY: 0.3 }}
          transition={
            on
              ? { duration: 0.9, repeat: Infinity, delay: i * 0.12 }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}

export function VoiceModal({
  open,
  text,
  setText,
  onClose,
  onSubmit,
}: {
  open: boolean;
  text: string;
  setText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [listening, setListening] = useState(false);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Talk to Munshi"
            className="card relative w-full max-w-lg shadow-[var(--shadow-lg)]"
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="eyebrow">Voice</div>
                <h2 className="text-2xl mt-2">
                  Talk to <span className="serif">Munshi</span>
                </h2>
              </div>
              <button
                className="btn2 !px-0 w-10"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm muted my-4">
              Try “Raise the chicken wrap by a dollar.”
            </p>
            <textarea
              className="w-full !rounded-2xl"
              rows={3}
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              aria-label="Command"
            />
            <div className="flex gap-2 mt-4 justify-between">
              <button
                className={listening ? "btn" : "btn2"}
                aria-label="Dictate"
                onClick={() => {
                  const SR =
                    (window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition;
                  if (SR) {
                    const rec = new SR();
                    rec.onresult = (e: any) =>
                      setText(e.results[0][0].transcript);
                    rec.onend = () => setListening(false);
                    setListening(true);
                    rec.start();
                  } else
                    alert(
                      "Speech recognition unavailable. Type your command instead.",
                    );
                }}
              >
                {listening ? <Bars on /> : <Mic size={15} />}
                {listening ? "Listening" : "Dictate"}
              </button>
              <button className="btn" onClick={onSubmit}>
                Review action <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
