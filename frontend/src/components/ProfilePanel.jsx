import React, { useRef, useState, useEffect } from "react";
import { Camera, LogOut, Save } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/store/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MAX_AVATAR_BYTES } from "@/lib/constants";

export default function ProfilePanel({ open, onOpenChange }) {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", avatar: user?.avatar || "" });
  const [pw, setPw] = useState({ oldPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const userName = user?.name;
  const userBio = user?.bio;
  const userAvatar = user?.avatar;
  useEffect(() => {
    if (open) setForm({ name: userName || "", bio: userBio || "", avatar: userAvatar || "" });
  }, [open, userName, userBio, userAvatar]);

  const pickAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_AVATAR_BYTES) { toast.error("Max 2MB"); return; }
    const formData = new FormData(); formData.append("file", f);
    try {
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((s) => ({ ...s, avatar: data.url }));
    } catch (err) { console.warn("[ProfilePanel] avatar upload failed:", err); toast.error("Upload failed"); }
    e.target.value = "";
  };

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      setUser(data);
      toast.success("Profile updated");
    } catch { toast.error("Update failed"); }
    finally { setBusy(false); }
  };

  const changePw = async () => {
    if (pw.newPassword.length < 6) { toast.error("New password too short"); return; }
    setBusy(true);
    try {
      await api.post("/auth/change-password", pw);
      setPw({ oldPassword: "", newPassword: "" });
      toast.success("Password changed");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md" data-testid="profile-panel">
        <SheetHeader>
          <SheetTitle className="font-display tracking-tight">My profile</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar src={form.avatar} name={form.name} size={96} />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
                data-testid="change-avatar-btn"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={pickAvatar} />
            </div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-11" data-testid="profile-name-input" />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="rounded-xl" rows={3} placeholder="Tell people about you…" data-testid="profile-bio-input" />
          </div>

          <Button onClick={save} disabled={busy} className="w-full h-11 rounded-xl font-bold" data-testid="save-profile-btn">
            <Save className="w-4 h-4 mr-2" /> Save changes
          </Button>

          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="font-bold text-sm">Change password</h3>
            <Input type="password" placeholder="Current password" value={pw.oldPassword}
              onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })} className="rounded-xl h-11" data-testid="old-pw-input" />
            <Input type="password" placeholder="New password" value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="rounded-xl h-11" data-testid="new-pw-input" />
            <Button variant="outline" onClick={changePw} disabled={busy} className="w-full h-10 rounded-xl" data-testid="change-pw-btn">
              Update password
            </Button>
          </div>

          <Button variant="destructive" onClick={logout} className="w-full h-11 rounded-xl font-bold" data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
