"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button, Card, Input, PageHeader, PasswordInput } from "@/components/ui";

export default function SettingsPage() {
  const user = useAppStore((s) => s.currentUser);
  const updateUser = useAppStore((s) => s.updateUser);
  const resetDemo = useAppStore((s) => s.resetDemo);

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const [resetMsg, setResetMsg] = useState("");

  const saveProfile = async () => {
    if (!user) return;
    if (!profile.name.trim()) {
      setProfileMsg("Name is required.");
      return;
    }
    await updateUser(user.id, { name: profile.name.trim(), email: profile.email.trim() });
    setProfileMsg("Profile updated.");
    setTimeout(() => setProfileMsg(""), 3000);
  };

  const savePassword = async () => {
    if (!user) return;
    if (!pwForm.next) { setPwMsg("Enter a new password."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg("Passwords do not match."); return; }
    if (pwForm.next.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    await updateUser(user.id, { password: pwForm.next });
    setPwForm({ current: "", next: "", confirm: "" });
    setPwMsg("Password changed.");
    setTimeout(() => setPwMsg(""), 3000);
  };

  const onReset = async () => {
    if (!confirm("Reset all MongoDB data to demo defaults?")) return;
    try {
      await resetDemo();
      setResetMsg("Demo data reset.");
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : "Reset failed");
    }
    setTimeout(() => setResetMsg(""), 4000);
  };

  return (
    <div>
      <PageHeader title="Settings" breadcrumb="Home / Settings" />

      <div className="grid gap-4 lg:grid-cols-2">

        {/* Profile Info */}
        <Card title="My Profile">
          <div className="space-y-3">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
                {user?.name?.charAt(0) ?? "A"}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">
                  {user?.role === "super_admin" ? "Super Admin" : "Staff"}
                </p>
              </div>
            </div>
            <Input
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <Button onClick={saveProfile}>Save Profile</Button>
              {profileMsg && (
                <p className="text-sm font-medium text-emerald-700">{profileMsg}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card title="Change Password">
          <div className="space-y-3">
            <PasswordInput
              label="Current Password"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              autoComplete="current-password"
            />
            <PasswordInput
              label="New Password"
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm New Password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              autoComplete="new-password"
            />
            <div className="flex items-center gap-3">
              <Button onClick={savePassword}>Change Password</Button>
              {pwMsg && (
                <p
                  className={`text-sm font-medium ${pwMsg.includes("changed") ? "text-emerald-700" : "text-rose-600"}`}
                >
                  {pwMsg}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Database */}
        {/* <Card title="Database">
          <p className="mb-2 text-xs font-medium text-emerald-700">
            MongoDB Atlas connected
          </p>
          <p className="mb-4 text-sm text-slate-600">
            Wipe and reseed the Atlas database with sample data (users, bookings, etc.).
          </p>
          <Button variant="danger" onClick={onReset}>
            Reseed Demo Data
          </Button>
          {resetMsg && (
            <p className="mt-3 text-sm font-medium text-emerald-700">{resetMsg}</p>
          )}
        </Card> */}

      </div>
    </div>
  );
}
