import { create } from "zustand";

export const useChat = create((set, get) => ({
  conversations: [],
  activeId: null,
  messagesByConv: {}, // conversationId -> [messages]
  typingByConv: {},   // conversationId -> { userId: bool }
  presence: {},       // userId -> { isOnline, lastSeen }

  setConversations: (list) => set({ conversations: list }),
  upsertConversation: (conv) =>
    set((s) => {
      const exists = s.conversations.some((c) => c.id === conv.id);
      const list = exists
        ? s.conversations.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
        : [conv, ...s.conversations];
      return { conversations: list };
    }),
  setActive: (id) => set({ activeId: id }),

  setMessages: (cid, msgs) =>
    set((s) => ({ messagesByConv: { ...s.messagesByConv, [cid]: msgs } })),
  prependMessages: (cid, msgs) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [cid]: [...msgs, ...(s.messagesByConv[cid] || [])],
      },
    })),
  appendMessage: (cid, msg) =>
    set((s) => {
      const existing = s.messagesByConv[cid] || [];
      // de-duplicate by id
      if (existing.some((m) => m.id === msg.id)) return {};
      return { messagesByConv: { ...s.messagesByConv, [cid]: [...existing, msg] } };
    }),
  updateMessage: (msg) =>
    set((s) => {
      const list = s.messagesByConv[msg.conversationId] || [];
      return {
        messagesByConv: {
          ...s.messagesByConv,
          [msg.conversationId]: list.map((m) => (m.id === msg.id ? msg : m)),
        },
      };
    }),
  bumpConversationLast: (cid, lastMessage) =>
    set((s) => {
      const list = s.conversations.map((c) =>
        c.id === cid ? { ...c, lastMessage, updatedAt: lastMessage.createdAt } : c
      );
      // resort: pinned first, then by lastMessage.createdAt desc
      list.sort((a, b) => {
        if (!!b.isPinned !== !!a.isPinned) return b.isPinned ? 1 : -1;
        const at = (a.lastMessage?.createdAt) || a.updatedAt || "";
        const bt = (b.lastMessage?.createdAt) || b.updatedAt || "";
        return bt.localeCompare(at);
      });
      return { conversations: list };
    }),

  setTyping: (cid, userId, isTyping) =>
    set((s) => {
      const t = { ...(s.typingByConv[cid] || {}) };
      if (isTyping) t[userId] = true;
      else delete t[userId];
      return { typingByConv: { ...s.typingByConv, [cid]: t } };
    }),

  setPresence: (userId, isOnline, lastSeen) =>
    set((s) => ({ presence: { ...s.presence, [userId]: { isOnline, lastSeen } } })),

  markAllRead: (cid) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === cid ? { ...c, unreadCount: 0 } : c
      ),
    })),
}));
