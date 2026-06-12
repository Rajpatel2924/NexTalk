import { create } from "zustand";

// Call lifecycle:
// idle -> outgoing -> connecting -> connected -> ended
// idle -> incoming -> connecting -> connected -> ended
export const useCall = create((set, get) => ({
  status: "idle",          // 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected' | 'ended'
  callId: null,
  callType: "audio",       // 'audio' | 'video'
  remoteUser: null,        // public user object
  conversationId: null,
  isMuted: false,
  isVideoOff: false,
  isCameraAvailable: true,
  startedAt: null,

  // Set by CallManager; UI uses these to attach to <video> elements
  localStream: null,
  remoteStream: null,

  setStatus: (status) => set({ status }),
  setIncoming: ({ callId, callType, remoteUser, conversationId }) =>
    set({ status: "incoming", callId, callType, remoteUser, conversationId, isMuted: false, isVideoOff: false }),
  setOutgoing: ({ callId, callType, remoteUser, conversationId }) =>
    set({ status: "outgoing", callId, callType, remoteUser, conversationId, isMuted: false, isVideoOff: false }),
  setConnecting: () => set({ status: "connecting" }),
  setConnected: () => set({ status: "connected", startedAt: Date.now() }),

  setLocalStream: (s) => set({ localStream: s }),
  setRemoteStream: (s) => set({ remoteStream: s }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    set({ isMuted: !isMuted });
  },
  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
    set({ isVideoOff: !isVideoOff });
  },

  reset: () => set({
    status: "idle",
    callId: null,
    callType: "audio",
    remoteUser: null,
    conversationId: null,
    isMuted: false,
    isVideoOff: false,
    startedAt: null,
    localStream: null,
    remoteStream: null,
    _pendingOffer: null,
  }),
}));
