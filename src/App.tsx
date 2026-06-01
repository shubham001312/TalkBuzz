/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Settings,
  LogOut,
  BellRing,
  Wifi,
  WifiOff,
  Sliders,
  Terminal,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

import {
  User,
  UserRole,
  Conversation,
  Message,
  UserSession,
  UserStatusStory,
  AuditLogEntry,
  isSuperAdminEmail,
  SUPERADMIN_EMAIL
} from './types';

import {
  INITIAL_USERS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_SESSIONS,
  INITIAL_STORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ADMIN_CONFIG,
  AdminSettingsConfig,
  loadState,
  saveState
} from './data';

import SignupLogin from './components/SignupLogin';
import ChatLayout from './components/ChatLayout';
import AdminPanel from './components/AdminPanel';
import SettingsModal from './components/SettingsModal';
import StoriesModal from './components/StoriesModal';

export default function App() {
  // --- Persistent Storage State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadState<User | null>('current_user', null));
  const [users, setUsers] = useState<User[]>(() => loadState<User[]>('users', INITIAL_USERS));
  const [conversations, setConversations] = useState<Conversation[]>(() => loadState<Conversation[]>('conversations', INITIAL_CONVERSATIONS));
  const [messages, setMessages] = useState<Message[]>(() => loadState<Message[]>('messages', INITIAL_MESSAGES));
  const [sessions, setSessions] = useState<UserSession[]>(() => loadState<UserSession[]>('sessions', INITIAL_SESSIONS));
  const [stories, setStories] = useState<UserStatusStory[]>(() => loadState<UserStatusStory[]>('stories', INITIAL_STORIES));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadState<AuditLogEntry[]>('audit_logs', INITIAL_AUDIT_LOGS));
  const [adminConfig, setAdminConfig] = useState<AdminSettingsConfig>(() => loadState<AdminSettingsConfig>('admin_config', INITIAL_ADMIN_CONFIG));

  // --- UI Routing Controls ---
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState<boolean>(false);
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);

  // --- Simulated Web-Push Overlay state ---
  const [activeToast, setActiveToast] = useState<{ title: string; body: string } | null>(null);

  // --- Network State Simulator ---
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isThrottled, setIsThrottled] = useState<boolean>(false);

  // API Client Request helper
  const apiRequest = async (path: string, method: 'GET' | 'POST' | 'DELETE', body?: any) => {
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Sync failed for path ${path}:`, err);
      return null;
    }
  };

  // --- Real-time PostgreSQL database sync (or fallback to local cache) ---
  useEffect(() => {
    const fetchState = async () => {
      if (!isOnline) return;
      try {
        const queryParams = currentUser 
          ? `?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}`
          : '';
        const res = await fetch(`/api/state${queryParams}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.users) setUsers(data.users);
        if (data.conversations) setConversations(data.conversations);
        if (data.messages) setMessages(data.messages);
        if (data.sessions) setSessions(data.sessions);
        if (data.stories) setStories(data.stories);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.adminConfig) setAdminConfig(data.adminConfig);
        
        if (data.passwords) {
          localStorage.setItem('talkbuzz_user_passwords', JSON.stringify(data.passwords));
        }
      } catch (err) {
        console.warn('Backend server database connections unavailable. Running locally.', err);
      }
    };
    
    fetchState();
    const interval = setInterval(fetchState, 4000);
    return () => clearInterval(interval);
  }, [isOnline, currentUser?.id, currentUser?.role]);

  // --- Write updates back to local storage after any updates ---
  useEffect(() => { saveState('current_user', currentUser); }, [currentUser]);
  useEffect(() => { saveState('users', users); }, [users]);
  useEffect(() => { saveState('conversations', conversations); }, [conversations]);
  useEffect(() => { saveState('messages', messages); }, [messages]);
  useEffect(() => { saveState('sessions', sessions); }, [sessions]);
  useEffect(() => { saveState('stories', stories); }, [stories]);
  useEffect(() => { saveState('audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { saveState('admin_config', adminConfig); }, [adminConfig]);

  // Handle Maintenance Bypass (Phase 8.6 Maintenance state)
  const isExcludedFromMaintenance = currentUser && (
    currentUser.role === UserRole.SUPER_ADMIN || 
    currentUser.role === UserRole.ADMIN
  );

  const shouldBlockOnMaintenance = adminConfig.maintenanceMode && !isExcludedFromMaintenance;

  // --- Action Handlers mapping all phases ---
  const handleLoginSuccess = (user: User) => {
    handleNewAuditLog(
      'USER_SIGN_IN',
      'user',
      user.id,
      `User ${user.displayName} authenticated successfully matching standard security handshake.`
    );
    setCurrentUser(user);
    
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      setIsAdminPanelOpen(true);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      handleNewAuditLog(
        'USER_SIGN_OUT',
        'user',
        currentUser.id,
        `User ${currentUser.displayName} signed out cleanly.`
      );
    }
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
  };

  const handleAddNewUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    // Save to PostgreSQL
    apiRequest('/api/users', 'POST', newUser);
    try {
      const stored = localStorage.getItem('talkbuzz_user_passwords');
      if (stored) {
        const parsed = JSON.parse(stored);
        const pass = parsed[newUser.email.toLowerCase()];
        if (pass) {
          apiRequest('/api/passwords', 'POST', { email: newUser.email, password: pass });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => {
      const updated = prev.map((u) => u.id === userId ? { ...u, ...updates } : u);
      const target = updated.find(u => u.id === userId);
      if (target) {
        apiRequest('/api/users', 'POST', target);
      }
      return updated;
    });
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleToggleUserActive = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && (targetUser.role === UserRole.SUPER_ADMIN || isSuperAdminEmail(targetUser.email))) {
      return; // Safeguard: Super Admin cannot be suspended
    }
    setUsers(prev => prev.map((u) => {
      if (u.id === userId) {
        const nextState = !u.isActive;
        if (!nextState && currentUser?.id === userId) {
          handleLogout();
        }
        const updatedUser = { ...u, isActive: nextState };
        apiRequest('/api/users', 'POST', updatedUser);
        return updatedUser;
      }
      return u;
    }));
  };

  const handleModifyUserRole = (userId: string, targetRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && (targetUser.role === UserRole.SUPER_ADMIN || isSuperAdminEmail(targetUser.email))) {
      return; // Safeguard: Super Admin role cannot be demoted
    }
    setUsers(prev => prev.map((u) => {
      if (u.id === userId) {
        const updatedUser = { ...u, role: targetRole };
        apiRequest('/api/users', 'POST', updatedUser);
        return updatedUser;
      }
      return u;
    }));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role: targetRole } : null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && (targetUser.role === UserRole.SUPER_ADMIN || isSuperAdminEmail(targetUser.email))) {
      return; // Safeguard: Super Admin cannot be deleted
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    setConversations(prev => prev.filter(c => c.isGroup || c.participantId !== userId));
    apiRequest(`/api/users/${userId}`, 'DELETE');
  };

  const handleAddNewConversation = (newConv: Conversation) => {
    setConversations(prev => [newConv, ...prev]);
    apiRequest('/api/conversations', 'POST', newConv);
  };

  const handleUpdateConversation = (convId: string, updates: Partial<Conversation>) => {
    setConversations(prev => {
      const updated = prev.map((c) => c.id === convId ? { ...c, ...updates } : c);
      const target = updated.find(c => c.id === convId);
      if (target) {
        apiRequest('/api/conversations', 'POST', target);
      }
      return updated;
    });
  };

  const handleDeleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    setMessages(prev => prev.filter(m => m.conversationId !== convId));
    apiRequest(`/api/conversations/${convId}`, 'DELETE');
  };

  const handleAddNewMessage = (newMsg: Message) => {
    setMessages(prev => [...prev, newMsg]);
    apiRequest('/api/messages', 'POST', newMsg);
  };

  const handleUpdateMessage = (msgId: string, updates: Partial<Message>) => {
    setMessages(prev => {
      const updated = prev.map((m) => m.id === msgId ? { ...m, ...updates } : m);
      const target = updated.find(m => m.id === msgId);
      if (target) {
        apiRequest('/api/messages', 'POST', target);
      }
      return updated;
    });
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => {
      const updated = prev.map((m) => m.id === msgId ? { ...m, decryptedText: 'This payload was shredded for everyone.', isDeleted: true } : m);
      const target = updated.find(m => m.id === msgId);
      if (target) {
        apiRequest('/api/messages', 'POST', target);
      }
      return updated;
    });
  };

  const handleRevokeSession = (sessId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessId));
    apiRequest(`/api/sessions/${sessId}`, 'DELETE');
  };

  const handleNewAuditLog = (
    action: string,
    targetType: 'user' | 'group' | 'system',
    targetId: string,
    details: string
  ) => {
    const newLog: AuditLogEntry = {
      id: `audit_log_${Date.now()}`,
      adminId: currentUser?.id || 'anonymous_system',
      adminName: currentUser?.displayName || 'System Kernel',
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    apiRequest('/api/audit-logs', 'POST', newLog);
  };

  const handleUpdateAdminConfig = (newConfig: AdminSettingsConfig) => {
    setAdminConfig(newConfig);
    apiRequest('/api/admin-config', 'POST', newConfig);
  };

  // --- Simulated Web Push alerting controller (Phase 11 VAPID triggering) ---
  const handleTriggerBroadcastPush = (title: string, body: string, targetRole: string) => {
    // Display dynamic UI toast even if user is focused inside app
    setActiveToast({ title, body });
    setTimeout(() => setActiveToast(null), 7000);
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-[#CBD5E1] flex items-center justify-center font-sans p-0 md:p-4 selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Dynamic Push Toast banner overlay */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -45 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#0D1117] border-2 border-emerald-500/30 p-4.5 rounded-2xl shadow-2xl z-50 flex items-start gap-3 w-80 font-sans shadow-emerald-500/5 animate-pulse"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] mt-1.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-100 mb-0.5 flex items-center gap-1.5 font-display">
                {activeToast.title}
                <span className="text-[8px] font-mono uppercase bg-emerald-500/10 px-1.5 text-emerald-400 border border-emerald-500/30 rounded scale-90">Web Push</span>
              </h4>
              <p className="text-[11px] text-[#9CA3AF] leading-normal font-sans italic">"{activeToast.body}"</p>
            </div>
            <button onClick={() => setActiveToast(null)} className="p-1 hover:bg-slate-800 rounded self-start shrink-0 cursor-pointer text-slate-400 hover:text-slate-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium responsive desktop & mobile dashboard layout container */}
      <div className="w-full h-screen md:h-[880px] md:max-h-[88vh] md:max-w-6xl bg-[#0A0C10] md:rounded-3xl md:border md:border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative animate-fade-in">

        {/* Primary App header bar */}
        <header className="h-16 border-b border-slate-800 bg-[#0D1117] flex items-center justify-between px-4 md:px-6 shrink-0 z-40 relative select-none">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-black font-display text-base shadow-[0_0_10px_rgba(16,185,129,0.3)]">B</div>
            <div>
              <h1 className="text-sm font-extrabold text-[#CBD5E1] leading-none font-sans flex items-center gap-1.5">
                TalkBuzz
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase font-bold border border-emerald-500/20 scale-90">PWA</span>
              </h1>
              {currentUser && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} inline-block`} />
                  <span className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
                    {isOnline ? 'kernel sync active' : 'offline backup'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Direct desktop simulator indicators in header */}
              <div className="hidden md:flex items-center gap-2">
                {/* Network sync trigger */}
                <button
                  onClick={() => {
                    const nextState = !isOnline;
                    setIsOnline(nextState);
                    if (!nextState) {
                      alert('Network connection disrupted. TalkBuzz will fall back to Instant offline cache!');
                    }
                  }}
                  className={`px-2.5 py-1 text-[10px] uppercase font-mono font-bold rounded-full border cursor-pointer flex items-center gap-1.5 transition-all ${
                    isOnline 
                      ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/25'
                      : 'bg-[#E11D48]/10 text-[#FDA4AF] border-[#E11D48]/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-[#E11D48] animate-pulse'}`} />
                  {isOnline ? 'online' : 'offline'}
                </button>

                {/* Speed toggle throttle */}
                <button
                  onClick={() => setIsThrottled(!isThrottled)}
                  className={`px-2.5 py-1 text-[10px] uppercase font-mono font-bold rounded-full border cursor-pointer transition-all ${
                    isThrottled
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-650'
                  }`}
                >
                  ⚡ {isThrottled ? '50 KB/s Throttle' : 'Full Speed'}
                </button>
              </div>

              {/* Sleek expandable mobile profiling dropdown badge */}
              <button
                onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                className={`flex items-center gap-2 bg-[#0A0C10] pl-1.5 pr-2.5 py-1.5 rounded-full border cursor-pointer select-none transition-all ${
                  isQuickMenuOpen ? 'border-emerald-500 bg-[#0D1117]' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={currentUser.avatarUrl || undefined}
                  alt=""
                  className="w-5 h-5 rounded-full border border-slate-800/80 object-cover"
                />
                <span className="text-[11px] font-bold text-slate-300 truncate max-w-[65px]">@{currentUser.username}</span>
                <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isQuickMenuOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>

              {/* Quick Settings & Network Simulator Submenu overlay drop */}
              <AnimatePresence>
                {isQuickMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-45" onClick={() => setIsQuickMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-4 top-12 w-60 bg-[#0D1117] border border-slate-800 rounded-2xl shadow-2xl z-50 p-3.5 flex flex-col gap-2.5 text-xs text-slate-300"
                    >
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">Device Handshake</span>
                        <span className="text-[9px] font-mono text-[#10B981] bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.2 rounded font-black">SECURE</span>
                      </div>

                      {/* Network simulator controls */}
                      <div className="space-y-2">
                        <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Simulator Controls:</span>
                        
                        <button
                          onClick={() => {
                            const nextState = !isOnline;
                            setIsOnline(nextState);
                            if (!nextState) {
                              alert('Network connection disrupted. TalkBuzz will fall back to Instant offline cache!');
                            }
                          }}
                          className={`w-full py-2 px-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isOnline 
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                              : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15 font-bold'
                          }`}
                        >
                          <span className="font-medium">Web Connection</span>
                          <span className="text-[10px] font-mono">{isOnline ? 'ONLINE 🌐' : 'OFFLINE 📶'}</span>
                        </button>

                        <button
                          onClick={() => setIsThrottled(!isThrottled)}
                          className={`w-full py-2 px-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isThrottled 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold hover:bg-amber-500/15'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                          }`}
                        >
                          <span className="font-medium">Throttling Speed</span>
                          <span className="text-[10px] font-mono">{isThrottled ? '50 KB/s ⚡' : 'FULL SPEED'}</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-800/80 my-0.5" />

                      {/* Main Application actions */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {/* Admin toggle gateway */}
                        {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN) && (
                          <button
                            onClick={() => {
                              setIsAdminPanelOpen(!isAdminPanelOpen);
                              setIsQuickMenuOpen(false);
                            }}
                            className={`w-full py-2 px-3 text-xs font-mono font-bold rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                              isAdminPanelOpen
                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                : 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-300'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" /> 
                            {isAdminPanelOpen ? 'EXIT SYSTEM DASH' : 'OPEN SUPER ADMIN'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsSettingsOpen(true);
                            setIsQuickMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          User Settings Hub
                        </button>

                        <button
                          onClick={() => {
                            handleLogout();
                            setIsQuickMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 bg-[#E11D48]/10 hover:bg-[#E11D48]/15 border border-[#E11D48]/20 text-[#FDA4AF] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out Session
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#0A0C10] px-2.5 py-1 rounded-full border border-slate-800 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              <span className="text-[8.5px] font-mono text-emerald-500 uppercase font-black tracking-wider">Agent Ready</span>
            </div>
          )}
        </header>

        {/* Main app viewport viewport body (Strict p-0 to allow edge-to-edge chat design layout) */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-[#0A0C10]">
        
        {/* Maintenance blocker screen */}
        {shouldBlockOnMaintenance ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[60vh] text-center max-w-md mx-auto relative overflow-hidden bg-[#1B1F2A] border border-[#991B1B]/55 rounded-2xl shadow-xl">
            <Shield className="w-12 h-12 text-[#9CA3AF] mb-4 animate-pulse" />
            <h2 className="text-lg font-bold font-mono uppercase tracking-widest text-indigo-400">System Hold Control Active</h2>
            <p className="text-xs text-[#9CA3AF] leading-relaxed mt-2 font-sans">
              Super-Admin **Shubham Mallick** has enabled targeted system diagnosis parameters. Sockets connections has placed in active diagnostic freeze sleep. Standard users must wait for core clearance locks to lift.
            </p>
            <div className="mt-4 pt-3 border-t border-[#2D3748] w-full flex justify-between text-[11px] font-mono text-[#4A5568]">
              <span>Role: Standard Peer</span>
              <span>Ref: Banned</span>
            </div>
            <button
              onClick={handleLogout}
              className="mt-6 py-2 px-5 bg-[#E5E7EB] hover:bg-[#F3F4F6] text-[#111827] text-xs font-mono font-bold rounded-xl cursor-pointer transition-colors"
            >
              Return to Authentication Portal
            </button>
          </div>
        ) : !currentUser ? (
          /* Authentication Screen panel */
          <SignupLogin
            onLoginSuccess={handleLoginSuccess}
            users={users}
            onAddUser={handleAddNewUser}
          />
        ) : isAdminPanelOpen ? (
          /* Admin dashboard rendering screen */
          <AdminPanel
            currentUser={currentUser}
            users={users}
            onToggleUserActive={handleToggleUserActive}
            onModifyUserRole={handleModifyUserRole}
            onDeleteUser={handleDeleteUser}
            conversations={conversations}
            onDeleteConversation={handleDeleteConversation}
            adminConfig={adminConfig}
            onUpdateAdminConfig={handleUpdateAdminConfig}
            auditLogs={auditLogs}
            onAddAuditLog={handleNewAuditLog}
            onTriggerGlobalPush={handleTriggerBroadcastPush}
            onClose={() => setIsAdminPanelOpen(false)}
          />
        ) : (
          /* Active chat dashboard */
          <ChatLayout
            currentUser={currentUser}
            users={users}
            onAddUser={handleAddNewUser}
            conversations={conversations}
            onAddConversation={handleAddNewConversation}
            onUpdateConversation={handleUpdateConversation}
            messages={messages}
            onAddMessage={handleAddNewMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            onDeleteConversation={handleDeleteConversation}
            adminConfig={adminConfig}
            stories={stories}
            onOpenStories={setActiveStoryUserId}
          />
        )}
      </main>
     </div>

      {/* MODALS RENDERING LAYERS */}
      <AnimatePresence>
        {isSettingsOpen && currentUser && (
          <SettingsModal
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            sessions={sessions}
            onRevokeSession={handleRevokeSession}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {activeStoryUserId && (
          <StoriesModal
            stories={stories}
            initialUserId={activeStoryUserId}
            onClose={() => setActiveStoryUserId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
