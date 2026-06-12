import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Reply, MoreVertical, Copy, Pencil, Trash, Smile, Forward } from "lucide-react";
import { fmtTime } from "@/lib/format";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const QUICK_EMOJI = ["❤️", "😂", "👍", "🔥", "😮", "🙏"];

function ReadTicks({ msg, conv, myId }) {
  if (msg.senderId !== myId) return null;
  const others = (conv?.participants || []).filter((p) => p.id !== myId).map((p) => p.id);
  const allRead = others.length > 0 && others.every((id) => (msg.readBy || []).includes(id));
  const allDelivered = others.length > 0 && others.every((id) => (msg.deliveredTo || []).includes(id));
  if (allRead) return <CheckCheck className="w-3.5 h-3.5 text-sky-500" />;
  if (allDelivered) return <CheckCheck className="w-3.5 h-3.5 opacity-70" />;
  return <Check className="w-3.5 h-3.5 opacity-70" />;
}

export default function MessageBubble({
  msg, conv, myId, showAvatarName, onReply, onEdit, onDelete, onReact, onForward, allMessages,
}) {
  const mine = msg.senderId === myId;
  const sender = conv?.participants?.find((p) => p.id === msg.senderId);
  const [showActions, setShowActions] = useState(false);

  const replyTo = msg.replyToMessageId
    ? allMessages.find((m) => m.id === msg.replyToMessageId)
    : null;
  const replyToSender = replyTo
    ? conv?.participants?.find((p) => p.id === replyTo.senderId)
    : null;

  const reactionEntries = Object.entries(msg.reactions || {}).filter(([, users]) => users?.length);

  if (msg.isDeleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} my-1`}>
        <div className="text-xs italic text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          {mine ? "You deleted this message" : "This message was deleted"}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex ${mine ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`message-${msg.id}`}
    >
      <div className={`flex items-end gap-2 max-w-[78%] ${mine ? "flex-row-reverse" : ""}`}>
        {/* sender name in groups */}
        <div className="flex flex-col">
          {showAvatarName && !mine && conv?.type === "group" && (
            <span className="text-[11px] font-bold text-primary ml-3 mb-0.5">{sender?.name || "Unknown"}</span>
          )}

          <div className="flex items-end gap-1.5">
            {!mine && showActions && (
              <MessageActions mine={mine} msg={msg} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onReact={onReact} onForward={onForward} />
            )}

            <div className={`relative ${mine ? "bubble-sent" : "bubble-received"} px-3.5 py-2 break-words`}>
              {replyTo && (
                <div className="mb-1.5 pl-2 border-l-2 border-current/40 opacity-80 text-xs">
                  <div className="font-bold">{replyToSender?.name || "User"}</div>
                  <div className="truncate max-w-[200px]">{replyTo.isDeleted ? "Deleted message" : replyTo.content}</div>
                </div>
              )}

              {msg.messageType === "image" && msg.attachmentUrl && (
                <img src={msg.attachmentUrl} alt="" className="rounded-lg max-w-[280px] max-h-[300px] object-cover mb-1" />
              )}
              {msg.messageType === "video" && msg.attachmentUrl && (
                <video src={msg.attachmentUrl} controls className="rounded-lg max-w-[280px] max-h-[300px] mb-1" />
              )}
              {msg.messageType === "file" && msg.attachmentUrl && (
                <a href={msg.attachmentUrl} download={msg.attachmentName} className="flex items-center gap-2 underline mb-1">
                  📎 {msg.attachmentName || "file"}
                </a>
              )}

              {msg.content && <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>}

              <div className="flex items-center justify-end gap-1 mt-1 -mb-1 text-[10px] opacity-70">
                {msg.isEdited && <span className="italic">edited</span>}
                <span>{fmtTime(msg.createdAt)}</span>
                <ReadTicks msg={msg} conv={conv} myId={myId} />
              </div>

              {reactionEntries.length > 0 && (
                <div className={`absolute -bottom-3 ${mine ? "left-2" : "right-2"} flex gap-1`}>
                  {reactionEntries.map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => onReact(msg.id, emoji)}
                      className="bg-card border border-border rounded-full px-1.5 py-0.5 text-xs shadow-sm hover:scale-110 transition-transform"
                      data-testid={`reaction-${msg.id}-${emoji}`}
                    >
                      {emoji} {users.length}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {mine && showActions && (
              <MessageActions mine={mine} msg={msg} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onReact={onReact} onForward={onForward} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MessageActions({ mine, msg, onReply, onEdit, onDelete, onReact, onForward }) {
  const [openEmoji, setOpenEmoji] = useState(false);
  return (
    <div className="flex items-center gap-0.5 mb-1">
      <div className="relative">
        <button
          onClick={() => setOpenEmoji(!openEmoji)}
          className="p-1 rounded-full hover:bg-muted text-muted-foreground"
          data-testid={`react-btn-${msg.id}`}
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        {openEmoji && (
          <div className="absolute bottom-full mb-1 bg-card border border-border rounded-full shadow-lg px-2 py-1 flex gap-1 z-30">
            {QUICK_EMOJI.map((e) => (
              <button
                key={e}
                onClick={() => { onReact(msg.id, e); setOpenEmoji(false); }}
                className="hover:scale-125 transition-transform text-base"
                data-testid={`pick-react-${msg.id}-${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onReply(msg)} className="p-1 rounded-full hover:bg-muted text-muted-foreground" data-testid={`reply-btn-${msg.id}`}>
        <Reply className="w-3.5 h-3.5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-full hover:bg-muted text-muted-foreground" data-testid={`msg-more-${msg.id}`}>
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={mine ? "end" : "start"}>
          <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(msg.content || ""); toast.success("Copied"); }}>
            <Copy className="w-4 h-4 mr-2" /> Copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onForward(msg)}>
            <Forward className="w-4 h-4 mr-2" /> Forward
          </DropdownMenuItem>
          {mine && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(msg)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(msg)} className="text-destructive">
                <Trash className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
