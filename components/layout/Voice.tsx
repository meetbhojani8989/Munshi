import { Mic, X } from "lucide-react";
import { Card } from "@/components/layout/ui";

export function VoiceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-5 bottom-20 md:bottom-6 z-20 w-14 h-14 rounded-full bg-[#154635] text-white shadow-lg flex items-center justify-center"
      aria-label="Voice assistant"
    >
      <Mic />
    </button>
  );
}

export function VoiceModal({
  text,
  setText,
  onClose,
  onSubmit,
}: {
  text: string;
  setText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-between">
          <h2>Talk to Munshi</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <p className="text-sm muted my-3">
          Try “Raise the chicken wrap by a dollar.”
        </p>
        <textarea
          className="w-full"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          <button
            className="btn2"
            onClick={() => {
              const SR =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;
              if (SR) {
                const rec = new SR();
                rec.onresult = (e: any) => setText(e.results[0][0].transcript);
                rec.start();
              } else
                alert(
                  "Speech recognition unavailable. Type your command instead.",
                );
            }}
          >
            <Mic size={15} />
          </button>
          <button className="btn" onClick={onSubmit}>
            Review action
          </button>
        </div>
      </Card>
    </div>
  );
}
