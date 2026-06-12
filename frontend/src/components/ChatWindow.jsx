import React, { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Smile, X, Search, ArrowLeft, Phone, Video as VideoIcon, Info, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/Avatar";
import MessageBubble from "@/components/MessageBubble";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { useChat } from "@/store/useChat";
import { sendWS } from "@/lib/ws";
import { toast } from "sonner";
import { convDisplayName, convAvatar, otherUser, lastSeenText, fmtDay } from "@/lib/format";

const EMOJIS = ["😀","😂","😍","🤣","😎","😭","🙏","👍","🔥","🎉","❤️","💯","✨","🤔","😅","🙌","🚀","👀","😬","🥺","😴","🤩","🤝","💪","☕","🍕","🍔","🎂","⚽","🎮","📚","🌈","🌙","☀️","💜"];

export default function ChatWindow({ onOpenInfo, onBack }) {
  const { user } = useAuth();
  const {
    activeId, conversations, messagesByConv, typingByConv, presence,
    setMessages, prependMessages, appendMessage, updateMessage, markAllRead,
  } = useChat();
  const conv = conversations.find((c) => c.id === activeId);
  const messages = messagesByConv[activeId] || [];
  const typingMap = typingByConv[activeId] || {};
  const typingUsers = Object.keys(typingMap)
    .filter((id) => id !== user?.id)
    .map((id) => conv?.participants?.find((p) => p.id === id)?.name?.split(" ")[0])
    .filter(Boolean);

  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileRef = useRef(null);

  const other = conv ? otherUser(conv, user?.id) : null;
  const otherPresence = other ? presence[other.id] : null;
  const isOnline = other ? (otherPresence?.isOnline ?? other.isOnline) : false;

  // load messages on conv change
  useEffect(() => {
    if (!activeId) return;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get(`/messages/${activeId}`);
        setMessages(activeId, data);
        // mark read
        await api.post(`/messages/${activeId}/read`);
        markAllRead(activeId);
      } catch (e) {
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    })();
  }, [activeId]); // eslint-disable-line

  // autoscroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, typingUsers.length]);

  // search messages
  useEffect(() => {
    if (!searchOpen || !searchQ.trim() || !activeId) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/messages/${activeId}/search`, { params: { q: searchQ } });
        setSearchResults(data);
      } catch (_) { /* ignore */ }
    }, 200);
    return () => clearTimeout(t);
  }, [searchQ, searchOpen, activeId]);

  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background dot-grid" data-testid="empty-chat-state">
        <div className="text-center max-w-sm px-6">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary/40 flex items-center justify-center">
            <Send className="w-10 h-10" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-2">Pick a conversation</h2>
          <p className="text-sm text-muted-foreground">
            Select a chat from the sidebar — or start a new one — to begin messaging.
          </p>
        </div>
      </div>
    );
  }

  const handleTyping = () => {
    if (!conv) return;
    sendWS({ type: "typing", conversationId: conv.id, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendWS({ type: "typing", conversationId: conv.id, isTyping: false });
    }, 2500);
  };

  const sendNow = async () => {
    if (!text.trim() && !editing) return;
    if (editing) {
      try {
        await api.patch(`/messages/${editing.id}`, { content: text });
        toast.success("Message updated");
      } catch { toast.error("Edit failed"); }
      setEditing(null); setText("");
      return;
    }
    const body = {
      conversationId: conv.id,
      content: text.trim(),
      messageType: "text",
      replyToMessageId: reply?.id || null,
    };
    setText(""); setReply(null);
    try { await api.post("/messages", body); }
    catch { toast.error("Send failed"); }
    sendWS({ type: "typing", conversationId: conv.id, isTyping: false });
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", f);
    try {
      toast.loading("Uploading…", { id: "upl" });
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.dismiss("upl");
      await api.post("/messages", {
        conversationId: conv.id,
        content: text.trim(),
        messageType: isImage ? "image" : isVideo ? "video" : "file",
        attachmentUrl: data.url,
        attachmentName: data.name,
      });
      setText("");
    } catch {
      toast.dismiss("upl");
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  const onReact = async (mid, emoji) => {
    try { await api.post(`/messages/${mid}/react`, { emoji }); }
    catch { toast.error("Reaction failed"); }
  };
  const onDelete = async (m) => {
    if (!window.confirm("Delete this message?")) return;
    try { await api.delete(`/messages/${m.id}`); }
    catch { toast.error("Delete failed"); }
  };

  // group messages by date
  const grouped = [];
  let lastDate = "";
  messages.forEach((m) => {
    const day = fmtDay(m.createdAt);
    if (day !== lastDate) {
      grouped.push({ type: "date", value: day, id: `d-${m.id}` });
      lastDate = day;
    }
    grouped.push({ type: "msg", value: m });
  });

  return (
    <main className="flex-1 flex flex-col h-full bg-background" data-testid="chat-window">
      {/* Header */}
      <header className="glass px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onBack} className="md:hidden p-2 rounded-lg hover:bg-muted" data-testid="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={onOpenInfo} className="flex items-center gap-3 flex-1 min-w-0 text-left" data-testid="open-chat-info-btn">
          <Avatar src={convAvatar(conv, user?.id)} name={convDisplayName(conv, user?.id)} size={40} online={isOnline} />
          <div className="min-w-0">
            <div className="font-bold truncate">{convDisplayName(conv, user?.id)}</div>
            <div className="text-xs text-muted-foreground truncate">
              {conv.type === "group"
                ? `${conv.participants?.length || 0} members`
                : (Object.values(typingMap).length > 0
                  ? <span className="text-primary font-semibold">typing…</span>
                  : lastSeenText({ isOnline, lastSeen: otherPresence?.lastSeen || other?.lastSeen }))}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)} data-testid="toggle-search-btn">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenInfo} data-testid="open-info-btn">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {searchOpen && (
        <div className="px-4 py-2 bg-card border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search messages in this chat…"
              className="pl-9 h-10 rounded-xl"
              data-testid="search-messages-input"
            />
          </div>
          {searchQ && (
            <div className="mt-2 max-h-40 overflow-y-auto thin-scroll text-sm">
              {searchResults.length === 0 ? (
                <div className="text-muted-foreground p-2">No matches</div>
              ) : searchResults.map((m) => (
                <div key={m.id} className="p-2 rounded hover:bg-muted">
                  <div className="text-xs text-muted-foreground">{fmtDay(m.createdAt)}</div>
                  <div className="truncate">{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll px-4 py-4 space-y-2" data-testid="messages-container">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className={`h-10 rounded-2xl bg-muted animate-pulse ${i%2 ? "max-w-[60%]" : "max-w-[55%] ml-auto"}`} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-20">
            <Send className="w-10 h-10 opacity-30 mb-3" />
            <p className="text-sm">No messages yet. Be the first to say hello 👋</p>
          </div>
        ) : grouped.map((g) => g.type === "date" ? (
          <div key={g.id} className="flex justify-center my-3">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-card border border-border px-3 py-1 rounded-full text-muted-foreground">
              {g.value}
            </span>
          </div>
        ) : (
          <MessageBubble
            key={g.value.id}
            msg={g.value}
            conv={conv}
            myId={user?.id}
            showAvatarName
            allMessages={messages}
            onReply={setReply}
            onEdit={(m) => { setEditing(m); setText(m.content || ""); setReply(null); }}
            onDelete={onDelete}
            onReact={onReact}
            onForward={() => toast.info("Forward coming soon")}
          />
        ))}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
            <span className="inline-flex gap-1 text-primary">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </span>
            {typingUsers.slice(0, 2).join(", ")} typing
          </div>
        )}
      </div>

      {/* Reply / edit preview */}
      {(reply || editing) && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between" data-testid="compose-preview">
          <div className="text-xs">
            <div className="font-bold text-primary">
              {editing ? "Editing message" : `Replying to ${(conv.participants?.find(p => p.id === reply.senderId)?.name) || "..."}`}
            </div>
            <div className="truncate max-w-md text-muted-foreground">{(editing?.content || reply?.content) || "(media)"}</div>
          </div>
          <button onClick={() => { setReply(null); setEditing(null); setText(""); }} className="p-1 rounded hover:bg-card" data-testid="cancel-preview-btn">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="p-3 border-t border-border bg-card/60 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" hidden onChange={handleFile} accept="image/*,video/*,application/pdf,.doc,.docx,.txt" data-testid="file-input" />
          <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} data-testid="attach-file-btn">
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setShowEmoji(!showEmoji)} data-testid="open-emoji-btn">
              <Smile className="w-4 h-4" />
            </Button>
            {showEmoji && (
              <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-xl p-2 w-64 z-30">
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto thin-scroll">
                  {EMOJIS.map((e) => (
                    <button key={e} className="text-xl hover:scale-125 transition-transform" onClick={() => { setText(text + e); setShowEmoji(false); }} data-testid={`emoji-${e}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendNow(); }
            }}
            placeholder={editing ? "Edit your message…" : "Type a message…"}
            rows={1}
            className="flex-1 min-h-[44px] max-h-[140px] resize-none rounded-2xl border-border bg-muted/60 focus-visible:ring-primary"
            data-testid="message-input"
          />

          <Button onClick={sendNow} disabled={!text.trim() && !editing} className="rounded-2xl h-11 w-11 p-0 shrink-0" data-testid="send-message-btn">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
