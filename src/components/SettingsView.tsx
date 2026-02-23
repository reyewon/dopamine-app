'use client';
import React, { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Camera, Sun, Moon, Monitor, Save, User } from 'lucide-react';

interface UserProfile {
  name: string;
  title: string;
  avatarUrl: string;
}

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

function ThemeOption({
  value, label, icon: Icon, active, onClick,
}: {
  value: string; label: string; icon: React.ComponentType<{ size?: number }>; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border transition-all duration-150 ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

export default function SettingsView({ user, onUpdateUser }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateUser({ name, title, avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges =
    name !== user.name || title !== user.title || avatarUrl !== user.avatarUrl;

  return (
    <div className="flex-1 overflow-y-auto scroll-slim px-6 lg:px-10 pb-20">
      <div className="max-w-2xl mx-auto pt-2 space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile and app preferences.</p>
        </div>

        <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Profile</h2>

          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User size={32} />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:brightness-110 transition-all"
                title="Change photo"
              >
                <Camera size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{name || 'Your name'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{title || 'Your title'}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary/70 hover:text-primary mt-2 transition-colors"
              >
                Upload photo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Title / Role
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Commercial Photographer"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Appearance</h2>
          <p className="text-xs text-muted-foreground">
            Choose how Dopamine looks. System will follow your device setting.
          </p>
          <div className="flex gap-3">
            <ThemeOption value="system" label="System" icon={Monitor} active={theme === 'system'} onClick={() => setTheme('system')} />
            <ThemeOption value="light" label="Light" icon={Sun} active={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeOption value="dark" label="Dark" icon={Moon} active={theme === 'dark'} onClick={() => setTheme('dark')} />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges && !saved}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : hasChanges
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
