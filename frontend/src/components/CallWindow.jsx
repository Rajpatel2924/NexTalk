import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "@/store/useCall";
import { endCall } from "@/lib/callManager";
import { Avatar } from "@/components/Avatar";

function useElapsed(startedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return "";
  const s = Math.floor((now - startedAt) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const PANEL_INITIAL = { opacity: 0, y: 16, scale: 0.96 };
const PANEL_ANIMATE = { opacity: 1, y: 0, scale: 1 };
const PANEL_EXIT = { opacity: 0, y: 16, scale: 0.96 };

export default function CallWindow() {
  const status = useCall((s) => s.status);
  const remoteUser = useCall((s) => s.remoteUser);
  const callType = useCall((s) => s.callType);
  const isMuted = useCall((s) => s.isMuted);
  const isVideoOff = useCall((s) => s.isVideoOff);
  const localStream = useCall((s) => s.localStream);
  const remoteStream = useCall((s) => s.remoteStream);
  const startedAt = useCall((s) => s.startedAt);
  const toggleMute = useCall((s) => s.toggleMute);
  const toggleVideo = useCall((s) => s.toggleVideo);
  const elapsed = useElapsed(startedAt);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
  if (!remoteStream) return;

  console.log(
    "[CallWindow] Remote stream received",
    remoteStream.getTracks()
  );

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = remoteStream;

    remoteVideoRef.current
      .play()
      .catch((e) =>
        console.warn("[CallWindow] Video play failed:", e)
      );
  }

  if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject = remoteStream;

    remoteAudioRef.current
      .play()
      .catch((e) =>
        console.warn("[CallWindow] Audio play failed:", e)
      );
  }
}, [remoteStream]);

  const visible = status === "outgoing" || status === "connecting" || status === "connected";
  if (!visible) return null;

  const isVideo = callType === "video";
  const statusText =
    status === "outgoing" ? "Ringing…" :
    status === "connecting" ? "Connecting…" :
    elapsed || "Connected";

  return (
    <AnimatePresence>
      <motion.div
        initial={PANEL_INITIAL}
        animate={PANEL_ANIMATE}
        exit={PANEL_EXIT}
        className="fixed inset-0 z-[90] bg-foreground/95 flex flex-col items-center justify-between p-6 backdrop-blur-2xl grain"
        data-testid="call-window"
      >
        {/* Header */}
        <div className="text-center text-background pt-4">
          <div className="eyebrow opacity-70">
            {isVideo ? "Video call" : "Voice call"}
          </div>
          <div className="font-display font-black text-3xl mt-2 tracking-tighter" data-testid="call-peer-name">
            {remoteUser?.name || "Unknown"}
          </div>
          <div className="text-sm opacity-70 mt-1 font-medium" data-testid="call-status">{statusText}</div>
        </div>

        {/* Body */}
        <div className="flex-1 w-full max-w-5xl flex items-center justify-center my-6 relative">
          {isVideo && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full max-h-[70vh] rounded-3xl object-cover bg-black"
              data-testid="remote-video"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <Avatar src={remoteUser?.avatar} name={remoteUser?.name} size={160} />
                {status !== "connected" && (
                  <span className="absolute -inset-3 rounded-full border-2 border-primary animate-ping opacity-50" />
                )}
              </div>
            </div>
          )}

          {isVideo && localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-40 sm:w-56 aspect-video rounded-xl object-cover border-2 border-primary shadow-lg bg-black"
              data-testid="local-video"
            />
          )}
        </div>
        <audio
  ref={remoteAudioRef}
  autoPlay
  playsInline
/>
        {/* Controls (glass capsule) */}
        <div className="flex items-center gap-3 p-2 rounded-full bg-background/15 backdrop-blur-xl border border-background/15 shadow-2xl">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${isMuted ? "bg-destructive text-white" : "bg-background text-foreground"}`}
            data-testid="mute-toggle-btn"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${isVideoOff ? "bg-destructive text-white" : "bg-background text-foreground"}`}
              data-testid="video-toggle-btn"
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => endCall()}
            className="w-20 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-coral-lg font-bold"
            data-testid="end-call-btn"
            title="End call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
