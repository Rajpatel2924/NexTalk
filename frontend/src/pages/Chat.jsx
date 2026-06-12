import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { useChat } from "@/store/useChat";
import { api } from "@/lib/api";
import { connectWS, disconnectWS, onWSMessage } from "@/lib/ws";
import ChatSidebar from "@/components/ChatSidebar";
import ChatWindow from "@/components/ChatWindow";
import NewChatModal from "@/components/NewChatModal";
import ProfilePanel from "@/components/ProfilePanel";
import ChatInfoPanel from "@/components/ChatInfoPanel";
import { toast } from "sonner";

export default function Chat() {
  const { token, user } = useAuth();
  const {
    activeId, conversations, setConversations, upsertConversation,
    appendMessage, updateMessage, setTyping, setPresence, bumpConversationLast, markAllRead,
  } = useChat();
  const [openNew, setOpenNew] = useState(null); // 'private' | 'group' | null
  const [openProfile, setOpenProfile] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  // Initial load
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.get("/conversations");
        setConversations(data);
      } catch { toast.error("Failed to load chats"); }
    })();
    connectWS(token);
    return () => disconnectWS();
  }, [token]); // run once per token change

  // WS event handler
  useEffect(() => {
    const off = onWSMessage((evt) => {
      if (evt.type === "message_new") {
        const m = evt.message;
        appendMessage(m.conversationId, m);
        bumpConversationLast(m.conversationId, m);
        // increment unread if not active
        if (m.conversationId !== activeId && m.senderId !== user?.id) {
          useChat.setState({
            conversations: useChat.getState().conversations.map((c) =>
              c.id === m.conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: m } : c
            ),
          });
        } else if (m.conversationId === activeId && m.senderId !== user?.id) {
          // auto-mark read since user is viewing this conversation
          api.post(`/messages/${activeId}/read`).catch(() => {});
        }
      } else if (evt.type === "message_updated") {
        updateMessage(evt.message);
      } else if (evt.type === "typing") {
        setTyping(evt.conversationId, evt.userId, evt.isTyping);
      } else if (evt.type === "presence") {
        setPresence(evt.userId, evt.isOnline, evt.lastSeen);
      } else if (evt.type === "conversation_created") {
        upsertConversation(evt.conversation);
      } else if (evt.type === "conversation_updated") {
        if (evt.conversation) upsertConversation(evt.conversation);
      } else if (evt.type === "messages_read") {
        // mark all my sent messages in that conv as read by evt.userId
        const list = useChat.getState().messagesByConv[evt.conversationId] || [];
        const updated = list.map((m) =>
          m.senderId === user?.id && !(m.readBy || []).includes(evt.userId)
            ? { ...m, readBy: [...(m.readBy || []), evt.userId], deliveredTo: Array.from(new Set([...(m.deliveredTo || []), evt.userId])) }
            : m
        );
        useChat.setState({ messagesByConv: { ...useChat.getState().messagesByConv, [evt.conversationId]: updated } });
      }
    });
    return off;
  }, [activeId, user?.id]); // store setters are stable

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      <div className={`${activeId ? "hidden md:flex" : "flex"} md:flex h-full`}>
        <ChatSidebar
          onNew={(mode) => setOpenNew(mode)}
          onOpenProfile={() => setOpenProfile(true)}
          onToggleTheme={() => setIsDark((d) => !d)}
          isDark={isDark}
        />
      </div>
      <div className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col h-full`}>
        <ChatWindow
          onOpenInfo={() => setOpenInfo(true)}
          onBack={() => useChat.setState({ activeId: null })}
        />
      </div>

      <NewChatModal open={!!openNew} onOpenChange={(v) => !v && setOpenNew(null)} mode={openNew || "private"} />
      <ProfilePanel open={openProfile} onOpenChange={setOpenProfile} />
      <ChatInfoPanel open={openInfo} onOpenChange={setOpenInfo} conv={conversations.find((c) => c.id === activeId)} />
    </div>
  );
}
