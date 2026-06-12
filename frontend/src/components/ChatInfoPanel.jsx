import React, { useEffect, useState } from "react";
import { UserPlus, LogOut as LeaveIcon, Crown, X, Image as ImageIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useChat } from "@/store/useChat";
import { useAuth } from "@/store/useAuth";
import { convDisplayName, convAvatar, otherUser, lastSeenText } from "@/lib/format";

export default function ChatInfoPanel({ open, onOpenChange, conv }) {
  const { user } = useAuth();
  const { messagesByConv, presence, upsertConversation, setActive } = useChat();
  const [addingMembers, setAddingMembers] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!addingMembers) return;
    (async () => {
      try {
        const { data } = await api.get("/users/search", { params: { q } });
        const filtered = data.filter((u) => !conv?.participantIds?.includes(u.id) && !conv?.participants?.find((p) => p.id === u.id));
        setResults(filtered);
      } catch (err) { console.warn("[ChatInfoPanel] user search failed:", err); }
    })();
  }, [q, addingMembers, conv]);

  if (!conv) return null;

  const media = (messagesByConv[conv.id] || [])
    .filter((m) => !m.isDeleted && (m.messageType === "image" || m.messageType === "video"))
    .slice(-12)
    .reverse();

  const isGroup = conv.type === "group";
  const amAdmin = isGroup && conv.admins?.includes(user?.id);
  const o = otherUser(conv, user?.id);
  const oPresence = o ? presence[o.id] : null;

  const addMember = async (u) => {
    try {
      const { data } = await api.post(`/conversations/${conv.id}/members/${u.id}`);
      upsertConversation(data);
      toast.success(`${u.name} added`);
    } catch { toast.error("Failed"); }
  };
  const removeMember = async (uid) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await api.delete(`/conversations/${conv.id}/members/${uid}`);
      const { data } = await api.get(`/conversations/${conv.id}`);
      upsertConversation(data);
    } catch { toast.error("Failed"); }
  };
  const leaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await api.delete(`/conversations/${conv.id}/members/${user.id}`);
      useChat.setState({
        conversations: useChat.getState().conversations.filter((c) => c.id !== conv.id),
        activeId: null,
      });
      onOpenChange(false);
      toast.success("Left the group");
    } catch { toast.error("Failed"); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md" data-testid="chat-info-panel">
        <SheetHeader>
          <SheetTitle className="font-display tracking-tight">
            {isGroup ? "Group info" : "Contact info"}
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <Avatar src={convAvatar(conv, user?.id)} name={convDisplayName(conv, user?.id)} size={88} />
            <div className="mt-3 font-display font-bold text-xl">{convDisplayName(conv, user?.id)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isGroup
                ? `${conv.participants?.length || 0} members`
                : (o?.email || "")}
            </div>
            {!isGroup && (
              <div className="text-xs text-muted-foreground mt-1">
                {lastSeenText({ isOnline: oPresence?.isOnline ?? o?.isOnline, lastSeen: oPresence?.lastSeen || o?.lastSeen })}
              </div>
            )}
            {!isGroup && o?.bio && (
              <p className="mt-3 text-sm text-muted-foreground italic">&quot;{o.bio}&quot;</p>
            )}
          </div>

          {media.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Media</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {media.map((m) => (
                  m.messageType === "image"
                    ? <img key={m.id} src={m.attachmentUrl} alt="" className="aspect-square object-cover rounded-lg" />
                    : <video key={m.id} src={m.attachmentUrl} className="aspect-square object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {isGroup && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</h3>
                {amAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => setAddingMembers(!addingMembers)} className="h-7 rounded-lg text-xs" data-testid="add-member-btn">
                    <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                )}
              </div>

              {addingMembers && (
                <div className="mb-3 p-3 rounded-xl bg-muted/40">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find people…" className="h-9 rounded-lg mb-2" data-testid="add-member-search" />
                  <div className="max-h-40 overflow-y-auto thin-scroll space-y-1">
                    {results.map((u) => (
                      <button key={u.id} onClick={() => addMember(u)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card text-left text-sm" data-testid={`add-candidate-${u.id}`}>
                        <Avatar src={u.avatar} name={u.name} size={28} />
                        <span className="truncate">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {conv.participants?.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted">
                    <Avatar src={p.avatar} name={p.name} size={36} online={presence[p.id]?.isOnline ?? p.isOnline} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        {p.name}
                        {conv.admins?.includes(p.id) && <Crown className="w-3 h-3 text-amber-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                    </div>
                    {amAdmin && p.id !== user?.id && (
                      <button onClick={() => removeMember(p.id)} className="p-1 rounded hover:bg-card text-muted-foreground" data-testid={`remove-member-${p.id}`}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGroup && (
            <Button variant="destructive" onClick={leaveGroup} className="w-full h-11 rounded-xl font-bold" data-testid="leave-group-btn">
              <LeaveIcon className="w-4 h-4 mr-2" /> Leave group
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
