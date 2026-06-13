// WebRTC peer connection manager for 1:1 calls.
// Uses Google's public STUN server (no key required). For corporate / strict-NAT
// networks, a TURN server would need to be added to ICE_SERVERS later.

import { sendWS } from "@/lib/ws";
import { useCall } from "@/store/useCall";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];
let pc = null;
let pendingCandidates = []; // ICE candidates that arrived before remote description was set

function newCallId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function getLocalMedia(callType) {
  // Surface a clear error when getUserMedia isn't available at all
  // (e.g. running on http://, inside a restricted iframe, or very old browser).
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
    const err = new Error("MEDIA_UNAVAILABLE");
    err.name = "NotSupportedError";
    throw err;
  }
  const constraints = {
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  };
  return await navigator.mediaDevices.getUserMedia(constraints);
}

function isInIframe() {
  try { return window.self !== window.top; } catch (_) { return true; }
}

function explainMediaError(err, callType) {
  const name = err?.name || "";
  const inIframe = isInIframe();
  // Iframe Permissions-Policy blocks getUserMedia by default unless the parent
  // explicitly grants `camera` / `microphone`. This is the #1 reason calls
  // fail in the Emergent preview pane.
  if (inIframe && (name === "NotAllowedError" || name === "SecurityError" || name === "NotSupportedError")) {
    return "Preview can’t access camera/mic. Open the app in a new tab to make calls.";
  }
  switch (name) {
    case "NotAllowedError":
      return "Permission denied. Click the camera/mic icon in your browser's address bar to allow access.";
    case "NotFoundError":
      return callType === "video"
        ? "No camera or microphone found on this device."
        : "No microphone found on this device.";
    case "NotReadableError":
      return "Camera or microphone is already in use by another app.";
    case "OverconstrainedError":
      return "Your device doesn't support the requested call quality.";
    case "SecurityError":
      return "Calls require a secure (HTTPS) connection.";
    case "NotSupportedError":
      return "Your browser doesn't support voice/video calls.";
    default:
      return callType === "video"
        ? "Couldn't access camera/microphone."
        : "Couldn't access microphone.";
  }
}

function attachPCHandlers({ remoteUserId, callId }) {
  pc.onicecandidate = (e) => {
    console.log("[WebRTC] ICE candidate:", e.candidate);

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
  console.log(
    "[WebRTC] Track received:",
    e.track.kind
  );

  const [stream] = e.streams;

  console.log(
    "[WebRTC] Stream tracks:",
    stream.getTracks()
  );

  useCall.getState().setRemoteStream(stream);
};

  pc.oniceconnectionstatechange = () => {
    console.log(
      "[WebRTC] ICE state:",
      pc?.iceConnectionState
    );
  };

  pc.onconnectionstatechange = () => {
    console.log(
      "[WebRTC] Connection state:",
      pc?.connectionState
    );

    const s = pc.connectionState;

    if (s === "connected") {
      useCall.getState().setConnected();
    } else if (
      s === "failed" ||
      s === "disconnected" ||
      s === "closed"
    ) {
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
    console.warn("[call] getUserMedia failed:", err?.name, err?.message);
    cleanup();
    const msg = explainMediaError(err, callType);
    const e = new Error(msg);
    e.cause = err;
    throw e;
  }
  useCall.getState().setLocalStream(localStream);

  try {
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
  } catch (err) {
    console.warn("[call] peer connection setup failed (caller):", err);
    cleanup();
    throw new Error("Couldn't establish call connection");
  }
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
    console.warn("[call] getUserMedia failed:", err?.name, err?.message);
    const msg = explainMediaError(err, callType);
    rejectIncoming();
    const e = new Error(msg);
    e.cause = err;
    throw e;
  }
  useCall.getState().setLocalStream(localStream);

  try {
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
    console.log(
  "[WebRTC] Sending answer to:",
  remoteUser.id );
    sendWS({
      type: "call_answer",
      to: remoteUser.id,
      callId,
      sdp: pc.localDescription,
    });
  } catch (err) {
    console.warn("[call] peer connection setup failed (callee):", err);
    rejectIncoming();
    throw new Error("Couldn't establish call connection");
  }
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
  console.log("[WebRTC] Received answer", evt);

  if (!pc || evt.callId !== state.callId) {
    console.warn("[WebRTC] Ignoring answer");
    return;
  }

  pc.setRemoteDescription(evt.sdp)
    .then(() => {
      console.log("[WebRTC] Remote description set");
    })
    .catch((e) => {
      console.warn(
        "[call] setRemoteDescription failed:",
        e
      );
    });

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
