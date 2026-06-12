export function fmtTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export function fmtDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function lastSeenText(p) {
  if (!p) return "";
  if (p.isOnline) return "Active now";
  if (!p.lastSeen) return "Offline";
  const d = new Date(p.lastSeen);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
  return `Last seen ${d.toLocaleDateString()}`;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function otherUser(conv, myId) {
  if (!conv) return null;
  if (conv.type === "private") return conv.participants?.find((p) => p.id !== myId) || null;
  return null;
}

export function convDisplayName(conv, myId) {
  if (!conv) return "";
  if (conv.type === "group") return conv.name || "Group";
  const o = otherUser(conv, myId);
  return o?.name || "Unknown";
}

export function convAvatar(conv, myId) {
  if (!conv) return null;
  if (conv.type === "group") return conv.avatar;
  return otherUser(conv, myId)?.avatar;
}
