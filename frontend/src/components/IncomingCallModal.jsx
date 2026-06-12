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
    catch (err) { toast.error(err.message || "Couldn't start call"); }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={RING_INITIAL}
          animate={RING_ANIMATE}
          exit={RING_EXIT}
          className="fixed top-6 right-6 z-[100] bento p-5 w-80 shadow-2xl bg-card"
          data-testid="incoming-call-modal"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={remoteUser?.avatar} name={remoteUser?.name} size={56} />
              <span className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Incoming {callType} call
              </div>
              <div className="font-display font-bold truncate">{remoteUser?.name || "Unknown"}</div>
              <div className="text-xs text-muted-foreground">Ringing…</div>
            </div>
          </div>

          <div className="flex items-center justify-around mt-5">
            <button
              onClick={rejectIncoming}
              className="w-12 h-12 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              data-testid="reject-call-btn"
              title="Decline"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
            <button
              onClick={onAccept}
              className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
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
