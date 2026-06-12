import React, { useState } from "react";
import { Search, Plus, Users, Pin, Archive, MoreVertical, LogOut, MessageSquare, Settings, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from "@/store/useChat";
import { useAuth } from "@/store/useAuth";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { convDisplayName, convAvatar, otherUser, fmtTime } from "@/lib/format";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function previewText(last) {
  if (!last) return "Say hello 👋";
  if (last.isDeleted) return "Message deleted";
  if (last.messageType && last.messageType !== "text") {
    return `📎 ${last.attachmentName || last.messageType}`;
  }
  return last.content || "Say hello 👋";
}

function ConversationRow({ conv, active, onClick, myId, presence, onPin, onArchive, onDelete }) {
  const name = convDisplayName(conv, myId);
  const avatar = convAvatar(conv, myId);
  const other = otherUser(conv, myId);
  const online = other ? (presence[other.id]?.isOnline ?? other.isOnline) : false;
  const last = conv.lastMessage;
  const lastText = previewText(last);

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
        active ? "row-active" : "hover:bg-muted/50"
      }`}
      data-testid={`chat-row-${conv.id}`}
    >
      <Avatar src={avatar} name={name} size={48} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold truncate text-[15px] font-display tracking-tight">{name}</span>
          <span className="text-[10px] text-muted-foreground font-bold shrink-0">
            {last ? fmtTime(last.createdAt) : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate font-medium">
            {conv.type === "group" && last?.senderId !== myId && last && (
              <span className="font-bold text-foreground">
                {conv.participants?.find((p) => p.id === last.senderId)?.name?.split(" ")[0]}:{" "}
              </span>
            )}
            {lastText}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {conv.isPinned && <Pin className="w-3 h-3 text-primary fill-primary" />}
            {conv.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full text-[10px] font-black px-2 py-0.5 min-w-[20px] text-center shadow-coral">
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-1 rounded-md hover:bg-background" data-testid={`chat-row-menu-${conv.id}`}>
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onPin(conv)}>
              <Pin className="w-4 h-4 mr-2" /> {conv.isPinned ? "Unpin" : "Pin"} chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(conv)}>
              <Archive className="w-4 h-4 mr-2" /> {conv.isArchived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(conv)}>
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ChatSidebar({ onNew, onOpenProfile }) {
  const { conversations, activeId, setActive, presence } = useChat();
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = conversations.filter((c) => {
    const name = convDisplayName(c, user?.id).toLowerCase();
    const matchesQ = !q || name.includes(q.toLowerCase());
    const matchesArchive = showArchived ? c.isArchived : !c.isArchived;
    return matchesQ && matchesArchive;
  });

  const onPin = async (c) => {
    try {
      if (c.isPinned) await api.delete(`/conversations/${c.id}/pin`);
      else await api.post(`/conversations/${c.id}/pin`);
      useChat.setState({
        conversations: conversations.map((x) => (x.id === c.id ? { ...x, isPinned: !c.isPinned } : x)),
      });
    } catch { toast.error("Failed"); }
  };
  const onArchive = async (c) => {
    try {
      if (c.isArchived) await api.delete(`/conversations/${c.id}/archive`);
      else await api.post(`/conversations/${c.id}/archive`);
      useChat.setState({
        conversations: conversations.map((x) => (x.id === c.id ? { ...x, isArchived: !c.isArchived } : x)),
      });
    } catch { toast.error("Failed"); }
  };
  const onDelete = async (c) => {
    if (!window.confirm("Delete this chat?")) return;
    try {
      await api.delete(`/conversations/${c.id}`);
      useChat.setState({
        conversations: conversations.filter((x) => x.id !== c.id),
        activeId: activeId === c.id ? null : activeId,
      });
      toast.success("Chat deleted");
    } catch { toast.error("Failed"); }
  };

  return (
    <aside className="w-full md:w-[340px] shrink-0 h-full flex flex-col border-r border-border bg-card" data-testid="chat-sidebar">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <button onClick={onOpenProfile} className="flex items-center gap-2.5 group" data-testid="open-profile-btn">
          <Avatar src={user?.avatar} name={user?.name} size={40} />
          <div className="text-left">
            <div className="font-display font-extrabold text-sm leading-tight tracking-tight">{user?.name}</div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">View profile</div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl" data-testid="sidebar-menu-btn">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenProfile}>
                <Settings className="w-4 h-4 mr-2" /> Profile settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                <Archive className="w-4 h-4 mr-2" /> {showArchived ? "Show active" : "Show archived"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats…"
            className="pl-10 h-10 rounded-xl bg-muted/60 border-transparent focus-visible:ring-primary"
            data-testid="sidebar-search-input"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background" title="Clear">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNew("private")} className="flex-1 h-9 rounded-xl text-xs font-bold shadow-coral btn-bump" data-testid="new-chat-btn">
            <Plus className="w-3.5 h-3.5 mr-1" /> New chat
          </Button>
          <Button onClick={() => onNew("group")} variant="outline" className="flex-1 h-9 rounded-xl text-xs font-bold btn-bump" data-testid="new-group-btn">
            <Users className="w-3.5 h-3.5 mr-1" /> New group
          </Button>
        </div>
        {showArchived && (
          <div className="text-[10px] eyebrow text-primary text-center pt-1">Viewing archived</div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1" data-testid="chat-list">
        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 text-sm">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {showArchived ? "No archived chats" : "No conversations yet. Start a new chat!"}
          </div>
        ) : (
          filtered.map((c) => (
            <ConversationRow
              key={c.id} conv={c} active={activeId === c.id}
              onClick={() => setActive(c.id)} myId={user?.id} presence={presence}
              onPin={onPin} onArchive={onArchive} onDelete={onDelete}
            />
          ))
        )}
      </div>
    </aside>
  );
}
