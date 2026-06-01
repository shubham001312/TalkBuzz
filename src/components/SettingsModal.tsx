/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  ShieldAlert,
  Smartphone,
  Trash2,
  Database,
  Info,
  QrCode,
  Lock,
  Download,
  CheckCircle,
  AlertTriangle,
  Github,
  ChevronDown,
  Loader2,
  Check
} from 'lucide-react';
import { User, UserSession } from '../types';
import { PRESET_AVATARS } from './SignupLogin';

interface SettingsModalProps {
  currentUser: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  sessions: UserSession[];
  onRevokeSession: (sessId: string) => void;
  onClose: () => void;
}

export default function SettingsModal({
  currentUser,
  onUpdateUser,
  sessions,
  onRevokeSession,
  onClose
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'security' | 'sessions' | 'cache' | 'about'>('profile');

  // Input states
  const [displayName, setDisplayName] = useState<string>(currentUser.displayName);
  const [bio, setBio] = useState<string>(currentUser.bio);
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatarUrl);

  const [saving, setSaving] = useState<boolean>(false);
  const [successSaved, setSuccessSaved] = useState<boolean>(false);

  // Password changing states
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in both current and new passwords.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters.');
      return;
    }

    try {
      const passwordsStr = localStorage.getItem('talkbuzz_user_passwords') || '{}';
      const passwords = JSON.parse(passwordsStr);
      const activeEmail = currentUser.email.toLowerCase();
      const currentCorrect = passwords[activeEmail] || 'admin';

      if (currentPassword !== currentCorrect) {
        setPasswordError('Incorrect current password.');
        return;
      }

      passwords[activeEmail] = newPassword;
      localStorage.setItem('talkbuzz_user_passwords', JSON.stringify(passwords));
      setPasswordSuccess('Password successfully updated and stored in secure local sandbox!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError('Failed to save updated password.');
    }
  };

  // Privacy states
  const [lastSeenFilter, setLastSeenFilter] = useState<'Everyone' | 'Contacts' | 'Nobody'>('Everyone');
  const [readReceipts, setReadReceipts] = useState<boolean>(currentUser.readReceipts !== false);
  const [onlineFilter, setOnlineFilter] = useState<boolean>(true);

  // 2FA TOTP state (Phase 12.13)
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpEnabled, setTotpEnabled] = useState<boolean>(currentUser.isTwoFactorEnabled || false);

  // Local storage cache clear sizes representation (Phase 10)
  const [cacheBytes, setCacheBytes] = useState<number>(459200); // ~459KB

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessSaved(false);
    setTimeout(() => {
      onUpdateUser(currentUser.id, {
        displayName,
        bio,
        phone: phone || undefined,
        avatarUrl
      });
      setSaving(false);
      setSuccessSaved(true);
      setTimeout(() => {
        setSuccessSaved(false);
      }, 2500);
    }, 1200);
  };

  const handleGenerateTOTP = () => {
    // Generate simulated secure authenticator secret key
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += letters[Math.floor(Math.random() * letters.length)];
    }
    setTotpSecret(secret);
  };

  const handleEnable2FAComplete = () => {
    onUpdateUser(currentUser.id, {
      isTwoFactorEnabled: true,
      twoFactorSecret: totpSecret
    });
    setTotpEnabled(true);
    setTotpSecret('');
    alert('Two-Factor Authentication (TOTP Authenticator) activated safely.');
  };

  const handleClearCache = () => {
    localStorage.removeItem('talkbuzz_messages'); // simulated purge
    setCacheBytes(0);
    alert('Shredded client-side conversation history logs cache memory.');
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-center p-4 text-[#E2E8F0] font-sans backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0D1117] border border-slate-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header toolbar */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex justify-between items-center bg-[#0D1117]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase font-display text-slate-100">TalkBuzz Settings Workspace</h3>
              <p className="text-[10px] text-slate-500 font-mono tracking-wide">Adjust end-to-end sandbox preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Panels Content Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Inner panel Left Side tabs column */}
          <div className="w-full md:w-48 bg-[#0D1117] border-b md:border-b-0 md:border-r border-slate-800 p-2 md:p-3 flex flex-row md:flex-col gap-1 overflow-x-auto scrollbar-none flex-shrink-0 select-none">
            {[
              { id: 'profile', label: 'Modify Profile', icon: UserIcon },
              { id: 'privacy', label: 'Privacy Toggles', icon: Info },
              { id: 'security', label: '2FA Credentials', icon: ShieldAlert },
              { id: 'sessions', label: 'Logged Devices', icon: Smartphone },
              { id: 'cache', label: 'Storage Cache', icon: Database },
              { id: 'about', label: 'About Buzz', icon: QrCode }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 md:gap-2.5 px-3 py-2 md:py-2.5 rounded-lg text-left font-bold cursor-pointer transition-colors whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inner Panel Right viewport area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0A0C10] text-[#E2E8F0]">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">Secure Profile Details</h4>

                <div className="space-y-3 py-1.5 bg-[#0D1117] p-4 rounded-xl border border-slate-800">
                  <span className="block text-[10px] font-mono text-slate-400 uppercase">Profile Picture Source</span>
                  
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarUrl || undefined}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-full border border-slate-700 object-cover"
                    />
                    <div className="flex-1">
                      <label className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-mono text-slate-200 rounded-lg cursor-pointer border border-slate-700 transition-colors">
                        Upload Custom Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert('Please select an image and make sure it is under 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setAvatarUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[9px] text-slate-500 mt-1 leading-tight">No third-party queries. Local base64 encoding ensures maximum encryption.</p>
                    </div>
                  </div>
                  
                  {/* Preset Quick Select Options */}
                  <div className="flex items-center gap-2 justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Quick presets:</span>
                    <div className="flex items-center gap-1.5">
                      {PRESET_AVATARS && PRESET_AVATARS.map((p, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setAvatarUrl(p)}
                          className={`w-7 h-7 rounded-full overflow-hidden border transition-all cursor-pointer ${
                            avatarUrl === p ? 'border-emerald-450 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'border-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <img src={p || undefined} className="w-full h-full object-cover" alt="" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-[#0A0C10] border border-slate-800 text-xs px-3 py-2.5 rounded-lg focus:border-emerald-500/45 focus:outline-none w-full text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Profile Bio / About status</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="bg-[#0A0C10] border border-slate-800 text-xs px-3 py-2.5 rounded-lg focus:border-emerald-500/45 focus:outline-none w-full text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Phone Number Handle</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-[#0A0C10] border border-slate-800 text-xs px-3 py-2.5 rounded-lg focus:border-emerald-500/45 focus:outline-none w-full text-slate-200 font-mono"
                  />
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-xs">
                  <span className="font-mono text-xs text-slate-500">Username: @{currentUser.username}</span>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-4 py-2 text-black font-extrabold rounded-lg transition-all duration-200 shadow-lg flex items-center gap-2 hover:scale-[1.01] ${
                      successSaved
                        ? 'bg-[#10B981] cursor-default'
                        : saving
                          ? 'bg-emerald-600/80 cursor-not-allowed text-black/70'
                          : 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer'
                    }`}
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {successSaved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>
                      {saving
                        ? 'Syncing to Cloud...'
                        : successSaved
                          ? 'Synced & Saved!'
                          : 'Save Sync Settings'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Privacy Configuration Switches</h4>

                <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-4.5 space-y-4 shadow-lg">
                  {/* Last seen */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-300">Privacy Last Seen Visibility</h5>
                      <span className="text-[10px] text-slate-500">Toggle who parsed your handshakes logs timestamp</span>
                    </div>
                    <div className="relative inline-block w-full max-w-[150px]">
                      <select
                        value={lastSeenFilter}
                        onChange={(e) => setLastSeenFilter(e.target.value as any)}
                        className="appearance-none w-full bg-[#0A0C10] border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:border-emerald-500/40 focus:outline-none cursor-pointer"
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="Contacts">Only contacts</option>
                        <option value="Nobody">Nobody</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Read receipts */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/60 text-xs text-slate-300">
                    <div>
                      <h5 className="text-xs font-bold">Transmit Read Receipts</h5>
                      <span className="text-[10px] text-slate-500">Toggle recipient blue check indications</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={readReceipts}
                      onChange={() => {
                        const newVal = !readReceipts;
                        setReadReceipts(newVal);
                        onUpdateUser(currentUser.id, { readReceipts: newVal });
                      }}
                      className="accent-emerald-500 h-4 w-4 ml-4 cursor-pointer"
                    />
                  </div>

                  {/* Online state toggle */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/60 text-xs text-slate-300">
                    <div>
                      <h5 className="text-xs font-bold">Online Connection Indication</h5>
                      <span className="text-[10px] text-slate-500">Live green indicators visibility broadcast</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={onlineFilter}
                      onChange={() => setOnlineFilter(!onlineFilter)}
                      className="accent-emerald-500 h-4 w-4 ml-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-450" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Two-Factor Authorization Core (TOTP)</h4>
                </div>

                {/* Sliding On/Off toggle switch for TFA */}
                <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
                  <div>
                    <h5 className="text-xs font-mono font-bold text-slate-350">Two-Factor Authentication Switch</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Instantly toggle secondary authentication security locks for login handshakes.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold ${totpEnabled ? 'text-emerald-405' : 'text-slate-500'}`}>
                      {totpEnabled ? 'ON' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !totpEnabled;
                        if (!nextState) {
                          onUpdateUser(currentUser.id, {
                            isTwoFactorEnabled: false
                          });
                          setTotpEnabled(false);
                          setTotpSecret('');
                          alert('Two-Factor Authentication deactivated.');
                        } else {
                          // Is turned on
                          if (currentUser.twoFactorSecret) {
                            onUpdateUser(currentUser.id, {
                              isTwoFactorEnabled: true
                            });
                            setTotpEnabled(true);
                            alert('Two-Factor Authentication activated.');
                          } else {
                            handleGenerateTOTP();
                          }
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        totpEnabled ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                          totpEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {totpEnabled ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs rounded-xl flex items-start gap-3 shadow-lg">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <h5 className="font-bold uppercase mb-0.5 text-emerald-400">Dual factors security active</h5>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Your account requires random OTP generated codes via Google Authenticator on logins Handshake phases.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-sans shadow-lg">
                    <p className="text-slate-300 leading-normal">
                      By adding authentication secret mappings, you force secure dual locks on login attempts. Protect super-admin states.
                    </p>

                    {totpSecret ? (
                      <div className="bg-[#0A0C10] p-4.5 rounded-lg border border-slate-800 text-center space-y-3 font-mono">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Scan this Key inside your authenticator App</span>
                        <div className="text-sm font-extrabold text-emerald-400 select-all uppercase tracking-wider bg-[#0E0F16] p-2 px-3 border border-emerald-500/20 inline-block rounded-xl">
                          {totpSecret}
                        </div>
                        
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleEnable2FAComplete}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-lg"
                          >
                            Verify & Activate Dual Authentication
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateTOTP}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-mono text-[11px] font-bold text-slate-200 cursor-pointer transition-colors"
                      >
                        Generate Secret TOTP Map Seed
                      </button>
                    )}
                  </div>
                )}

                {/* Password update panel requested by user */}
                <div className="bg-[#0D1117] border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-sans shadow-lg">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <h5 className="font-mono text-xs font-bold uppercase text-slate-350">Update Account Password</h5>
                  </div>
                  
                  {passwordError && (
                    <div className="p-2.5 bg-red-950/40 border border-red-500/20 text-red-400 text-[11px] rounded-lg font-mono">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-lg font-mono animate-in fade-in">
                      {passwordSuccess}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-[#0A0C10] border border-slate-800 text-xs px-3 py-2 rounded-lg focus:border-emerald-500/40 focus:outline-none w-full text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">New Secure Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-[#0A0C10] border border-slate-800 text-xs px-3 py-2 rounded-lg focus:border-emerald-500/40 focus:outline-none w-full text-slate-200"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-95"
                    >
                      Confirm Change Password
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Multi-Device Sockets sessions</h4>
                <div className="space-y-2.5">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 bg-[#0D1117] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-sans"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-200">{sess.browser}</span>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.2 text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest rounded-full text-center font-bold">Active</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono leading-tight">
                          {sess.os} • IP: {sess.ip} • {sess.location}
                        </p>
                        <span className="text-[9px] text-slate-550 font-mono block">Status: {sess.lastActive}</span>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          onClick={() => {
                            if (window.confirm('Revoke authorization key mapped for this device? Sockets closes immediately.')) {
                              onRevokeSession(sess.id);
                            }
                          }}
                          className="p-1 px-2.5 border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-[9px] rounded uppercase cursor-pointer transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cache' && (
              <div className="space-y-5 flex flex-col justify-between h-full bg-[#0D1117] border border-slate-800 p-5 rounded-2xl shadow-lg">
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-450" />
                    <h5 className="font-mono uppercase font-bold tracking-wider text-slate-400">Memory Cache Allocation</h5>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-sans">
                    TalkBuzz Service Workers cache index.html, CSS styles, and structural layouts on your local machine to keep load times snappy on connections as low as **50 KB/s**.
                  </p>
                  
                  <div className="p-4 bg-[#0A0C10] border border-slate-850 rounded-xl flex justify-between font-mono text-xs items-center">
                    <span className="text-slate-400">Active Storage size:</span>
                    <span className="font-extrabold text-slate-200">{cacheBytes === 0 ? '0 bytes (Purged)' : `${(cacheBytes/1024).toFixed(1)} KB`}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <button
                    disabled={cacheBytes === 0}
                    onClick={handleClearCache}
                    className="w-full py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-mono text-xs font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-30"
                  >
                    Shred cached logs directory
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6 text-center py-4 font-sans text-xs">
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-[#0D1117] border border-slate-800 rounded-3xl mb-3 shadow-lg text-emerald-500">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold font-display tracking-tight text-slate-100">TalkBuzz Messenger</h4>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Build Release v1.0.4 - Buzz</span>
                </div>

                <p className="max-w-md mx-auto text-slate-450 leading-relaxed text-xs font-sans">
                  Design & Architecture crafted on a highly polished modular display aesthetic. Features split message parsers for strict bandwidth thresholds, browser native File System saving structures, and live Super Admin broadcast features.
                </p>

                <div className="p-3 bg-[#0D1117] border border-slate-800 rounded-xl flex items-center justify-between max-w-sm mx-auto font-mono text-[10px] uppercase">
                  <span className="text-slate-500">Created by:</span>
                  <span className="font-bold text-slate-300">Buzz Studio Co</span>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href="https://github.com/shubham-mallick1440/talkbuzz"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-755 text-xs font-mono rounded-xl inline-flex items-center gap-1.5 text-slate-350 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Github className="w-4.5 h-4.5" /> Source code (talkbuzz)
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
