import React, { useEffect, useState } from "react";
import { Search, X, Check, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useChat } from "@/store/useChat";

export default function NewChatModal({ open, onOpenChange, mode = "private" }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);
  const { upsertConversation, setActive } = useChat();
  const isGroup = mode === "group";

  useEffect(() => {
    if (!open) { setQ(""); setSelected([]); setGroupName(""); return; }
    (async () => {
      try {
        const { data } = await api.get("/users/search", { params: { q } });
        setUsers(data);
      } catch (_) { /* ignore */ }
    })();
  }, [q, open]);

  const toggle = (u) => {
    if (isGroup) {
      setSelected((s) => (s.find((x) => x.id === u.id) ? s.filter((x) => x.id !== u.id) : [...s, u]));
    } else {
      startPrivate(u);
    }
  };

  const startPrivate = async (u) => {
    setBusy(true);
    try {
      const { data } = await api.post("/conversations", {
        type: "private", participantIds: [u.id],
      });
      upsertConversation(data);
      setActive(data.id);
      onOpenChange(false);
    } catch { toast.error("Failed to start chat"); }
    finally { setBusy(false); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length < 1) {
      toast.error("Add a name and at least 1 member"); return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/conversations", {
        type: "group",
        name: groupName.trim(),
        participantIds: selected.map((u) => u.id),
      });
      upsertConversation(data);
      setActive(data.id);
      toast.success("Group created");
      onOpenChange(false);
    } catch { toast.error("Failed to create group"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="new-chat-modal">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">
            {isGroup ? "Create a group" : "Start a new chat"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isGroup ? "Pick teammates to bring into the conversation." : "Find people by name or email to start chatting."}
          </DialogDescription>
        </DialogHeader>

        {isGroup && (
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="rounded-xl h-11"
            data-testid="group-name-input"
          />
        )}

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={q} onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-11 rounded-xl"
            data-testid="user-search-input"
          />
        </div>

        {isGroup && selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((u) => (
              <div key={u.id} className="bg-primary/40 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {u.name}
                <button onClick={() => toggle(u)} data-testid={`unselect-${u.id}`}><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="max-h-72 overflow-y-auto thin-scroll -mx-2">
          {users.length === 0 ? (
            <div className="text-center text-muted-foreground p-6 text-sm">No users found</div>
          ) : users.map((u) => {
            const sel = selected.find((s) => s.id === u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                disabled={busy}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${sel ? "bg-primary/30" : "hover:bg-muted"}`}
                data-testid={`user-result-${u.id}`}
              >
                <Avatar src={u.avatar} name={u.name} size={40} online={u.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                {isGroup && sel && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>

        {isGroup && (
          <Button onClick={createGroup} disabled={busy} className="w-full h-11 rounded-xl font-bold" data-testid="create-group-btn">
            <Users className="w-4 h-4 mr-2" /> Create group ({selected.length})
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
