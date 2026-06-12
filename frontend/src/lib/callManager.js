// WebRTC peer connection manager for 1:1 calls.
// Uses Google's public STUN server (no key required). For corporate / strict-NAT
// networks, a TURN server would need to be added to ICE_SERVERS later.

import { sendWS } from "@/lib/ws";
import { useCall } from "@/store/useCall";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

let pc = null;
let pendingCandidates = []; // ICE candidates that arrived before remote description was set

function newCallId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function getLocalMedia(callType) {
  const constraints = {
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  };
  return await navigator.mediaDevices.getUserMedia(constraints);
}

function attachPCHandlers({ remoteUserId, callId }) {
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      sendWS({
        type: "call_ice",
        to: remoteUserId,
        callId,
        candidate: e.candidate,
      });
    }
  };
  pc.ontrack = (e) => {
    const [stream] = e.streams;
    useCall.getState().setRemoteStream(stream);
  };
  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    if (s === "connected") {
      useCall.getState().setConnected();
    } else if (s === "failed" || s === "disconnected" || s === "closed") {
      // Auto-end on disconnect
      endCall({ notify: false });
    }
  };
}

function cleanup() {
  try {
    pc?.getSenders().forEach((s) => s.track?.stop());
  } catch (_) { /* ignore */ }
  try { pc?.close(); } catch (_) { /* ignore */ }
  pc = null;
  pendingCandidates = [];

  const { localStream } = useCall.getState();
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
  }
  useCall.getState().reset();
}

// ---- Caller side ----
export async function startCall({ remoteUser, conversationId, callType }) {
  if (pc) cleanup();
  const callId = newCallId();
  useCall.getState().setOutgoing({ callId, callType, remoteUser, conversationId });

  let localStream;
  try {
    localStream = await getLocalMedia(callType);
  } catch (err) {
    console.warn("[call] getUserMedia failed:", err);
    cleanup();
    throw new Error(callType === "video" ? "Camera/mic permission denied" : "Microphone permission denied");
  }
  useCall.getState().setLocalStream(localStream);

  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  attachPCHandlers({ remoteUserId: remoteUser.id, callId });
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
  await pc.setLocalDescription(offer);

  sendWS({
    type: "call_offer",
    to: remoteUser.id,
    callId,
    conversationId,
    callType,
    sdp: pc.localDescription,
  });
}

// ---- Callee side ----
export async function acceptIncoming() {
  const { callId, callType, remoteUser, _pendingOffer } = useCall.getState();
  if (!callId || !remoteUser || !_pendingOffer) return;

  useCall.getState().setStatus("connecting");

  let localStream;
  try {
    localStream = await getLocalMedia(callType);
  } catch (err) {
    console.warn("[call] getUserMedia failed:", err);
    rejectIncoming();
    throw new Error(callType === "video" ? "Camera/mic permission denied" : "Microphone permission denied");
  }
  useCall.getState().setLocalStream(localStream);

  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  attachPCHandlers({ remoteUserId: remoteUser.id, callId });
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  await pc.setRemoteDescription(_pendingOffer);
  // flush ICE candidates that arrived before remote description was set
  while (pendingCandidates.length) {
    try { await pc.addIceCandidate(pendingCandidates.shift()); }
    catch (e) { console.warn("[call] addIceCandidate (queued) failed:", e); }
  }

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  sendWS({
    type: "call_answer",
    to: remoteUser.id,
    callId,
    sdp: pc.localDescription,
  });
}

export function rejectIncoming() {
  const { callId, remoteUser } = useCall.getState();
  if (callId && remoteUser) {
    sendWS({ type: "call_reject", to: remoteUser.id, callId });
  }
  cleanup();
}

export function endCall({ notify = true } = {}) {
  const { callId, remoteUser } = useCall.getState();
  if (notify && callId && remoteUser) {
    sendWS({ type: "call_end", to: remoteUser.id, callId });
  }
  cleanup();
}

// ---- WS event router (called by Chat.jsx) ----
export function handleCallEvent(evt) {
  const state = useCall.getState();

  if (evt.type === "call_offer") {
    // Reject if already in a call
    if (state.status !== "idle") {
      sendWS({ type: "call_reject", to: evt.from, callId: evt.callId });
      return;
    }
    useCall.setState({
      _pendingOffer: evt.sdp,
    });
    state.setIncoming({
      callId: evt.callId,
      callType: evt.callType || "audio",
      remoteUser: evt.fromUser || { id: evt.from, name: "Unknown" },
      conversationId: evt.conversationId,
    });
  } else if (evt.type === "call_answer") {
    if (!pc || evt.callId !== state.callId) return;
    pc.setRemoteDescription(evt.sdp).catch((e) => console.warn("[call] setRemoteDescription failed:", e));
    state.setStatus("connecting");
  } else if (evt.type === "call_ice") {
    if (!pc) return;
    const cand = evt.candidate;
    if (!pc.remoteDescription) {
      pendingCandidates.push(cand);
    } else {
      pc.addIceCandidate(cand).catch((e) => console.warn("[call] addIceCandidate failed:", e));
    }
  } else if (evt.type === "call_reject" || evt.type === "call_end") {
    cleanup();
  }
}

export function isInCall() {
  const s = useCall.getState().status;
  return s !== "idle" && s !== "ended";
}
