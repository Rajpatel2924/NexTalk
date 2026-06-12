import React from "react";
import { Phone, PhoneOff, Video as VideoIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "@/store/useCall";
import { acceptIncoming, rejectIncoming } from "@/lib/callManager";
import { Avatar } from "@/components/Avatar";
import { toast } from "sonner";

const RING_INITIAL = { opacity: 0, scale: 0.9 };
const RING_ANIMATE = { opacity: 1, scale: 1 };
const RING_EXIT = { opacity: 0, scale: 0.9 };

export default function IncomingCallModal() {
  const status = useCall((s) => s.status);
  const remoteUser = useCall((s) => s.remoteUser);
  const callType = useCall((s) => s.callType);

  const visible = status === "incoming";

  const onAccept = async () => {
    try { await acceptIncoming(); }
    catch (err) {
      const message = err?.message || "Couldn't start call";
      let inIframe = false;
      try { inIframe = window.self !== window.top; } catch (_) { inIframe = true; }
      if (inIframe) {
        toast.error(message, {
          duration: 8000,
          action: {
            label: "Open in new tab",
            onClick: () => window.open(window.location.href, "_blank", "noopener,noreferrer"),
          },
        });
      } else {
        toast.error(message, { duration: 6000 });
      }
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={RING_INITIAL}
          animate={RING_ANIMATE}
          exit={RING_EXIT}
          className="fixed top-6 right-6 z-[100] w-80 shadow-coral-lg rounded-2xl bg-card border border-border p-5 grain"
          data-testid="incoming-call-modal"
        >
          <div className="flex items-center gap-3 relative">
            <div className="relative shrink-0">
              <Avatar src={remoteUser?.avatar} name={remoteUser?.name} size={56} />
              <span className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-70" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="eyebrow text-primary">
                Incoming {callType} call
              </div>
              <div className="font-display font-extrabold text-base truncate tracking-tight">{remoteUser?.name || "Unknown"}</div>
              <div className="text-xs text-muted-foreground font-medium">Ringing…</div>
            </div>
          </div>

          <div className="flex items-center justify-around mt-5">
            <button
              onClick={rejectIncoming}
              className="w-14 h-14 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
              data-testid="reject-call-btn"
              title="Decline"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
              data-testid="accept-call-btn"
              title="Accept"
            >
              {callType === "video" ? <VideoIcon className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
