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
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);

  // --- Simulated Web-Push Overlay state ---
  const [activeToast, setActiveToast] = useState<{ title: string; body: string } | null>(null);

  // --- Network State Simulator ---
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isThrottled, setIsThrottled] = useState<boolean>(false);

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
    // Audit log login
    handleNewAuditLog(
      'USER_SIGN_IN',
      'user',
      user.id,
      `User ${user.displayName} authenticated successfully matching standard security handshake.`
    );
    setCurrentUser(user);
    
    // Auto-open Admin dashboard panel if the user is Super Admin or Admin
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
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map((u) => u.id === userId ? { ...u, ...updates } : u));
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
        // Kick active user sessions if suspended
        if (!nextState && currentUser?.id === userId) {
          handleLogout();
        }
        return { ...u, isActive: nextState };
      }
      return u;
    }));
  };

  const handleModifyUserRole = (userId: string, targetRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && (targetUser.role === UserRole.SUPER_ADMIN || isSuperAdminEmail(targetUser.email))) {
      return; // Safeguard: Super Admin role cannot be demoted
    }
    setUsers(prev => prev.map((u) => u.id === userId ? { ...u, role: targetRole } : u));
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
    // Purge corresponding private conversation channels as well
    setConversations(prev => prev.filter(c => c.isGroup || c.participantId !== userId));
  };

  const handleAddNewConversation = (newConv: Conversation) => {
    setConversations(prev => [newConv, ...prev]);
  };

  const handleUpdateConversation = (convId: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map((c) => c.id === convId ? { ...c, ...updates } : c));
  };

  const handleDeleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    setMessages(prev => prev.filter(m => m.conversationId !== convId));
  };

  const handleAddNewMessage = (newMsg: Message) => {
    setMessages(prev => [...prev, newMsg]);
  };

  const handleUpdateMessage = (msgId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map((m) => m.id === msgId ? { ...m, ...updates } : m));
  };

  const handleDeleteMessage = (msgId: string) => {
    // Simulated delete message payload (for me or everyone)
    setMessages(prev => prev.map((m) => m.id === msgId ? { ...m, decryptedText: 'This payload was shredded for everyone.', isDeleted: true } : m));
  };

  const handleRevokeSession = (sessId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessId));
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
  };

  // --- Simulated Web Push alerting controller (Phase 11 VAPID triggering) ---
  const handleTriggerBroadcastPush = (title: string, body: string, targetRole: string) => {
    // Display dynamic UI toast even if user is focused inside app
    setActiveToast({ title, body });
    setTimeout(() => setActiveToast(null), 7000);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#CBD5E1] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Dynamic Push Toast banner overlay */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -45 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#0D1117] border-2 border-emerald-500/30 p-4.5 rounded-2xl shadow-2xl z-50 flex items-start gap-3 w-80 font-sans shadow-emerald-500/5"
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

      {/* Primary navbar header */}
      <header className="h-16 border-b border-slate-800 bg-[#0D1117] flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-black font-display text-base shadow-[0_0_12px_rgba(16,185,129,0.3)]">B</div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight font-sans flex items-center gap-1.5">
              TalkBuzz
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono uppercase font-bold tracking-widest border border-emerald-500/20 scale-90">PWA</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">App: TalkBuzz | Agent: Buzz v2.4.1</p>
          </div>

          {/* Quick simulator stats status tabs labels */}
          <div className="hidden md:flex items-center gap-2 pl-3">
            <div className="flex items-center gap-1.5 bg-[#0A0C10] px-2.5 py-0.5 rounded border border-slate-800">
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                  <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-wider">Active</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[9px] font-mono text-red-500 uppercase tracking-wider">Disconnected</span>
                </>
              )}
            </div>

            {isThrottled && (
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-mono uppercase tracking-tight rounded">⚡ Throttled Limit: 50 KB/s</span>
            )}
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Display profile name */}
            <div className="flex items-center gap-2 bg-[#0A0C10] px-3 py-1 rounded-full border border-slate-800">
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full border border-slate-800 object-cover"
              />
              <span className="text-xs font-semibold text-slate-300">@{currentUser.username}</span>
            </div>

            {/* Admin toggle router logic (Founder privileges check) */}
            {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN) && (
              <button
                onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer flex items-center gap-1.5 transition-all ${
                  isAdminPanelOpen
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-slate-100'
                }`}
                title="Super Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5" /> {isAdminPanelOpen ? 'EXIT SYSTEM DASH' : 'OPEN SUPER ADMIN'}
              </button>
            )}

            {/* Network simulator toolbar key */}
            <button
              onClick={() => {
                const nextState = !isOnline;
                setIsOnline(nextState);
                if (!nextState) {
                  alert('Network connection disrupted. TalkBuzz will fall back to Instant offline cache!');
                }
              }}
              className="p-1.5 bg-[#0D1117] hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
              title="Toggle Network state"
            >
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />}
            </button>

            <button
              onClick={() => setIsThrottled(!isThrottled)}
              className={`p-1.5 border rounded-lg transition-colors ${isThrottled ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : 'bg-[#0D1117] hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-100'}`}
              title="Simulate 50 KB/s throttled bandwidth"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Actions triggers */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-[#0D1117] hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer transition-colors"
              title="User Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 bg-[#0D1117] hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
              title="Sign Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 uppercase">
            <div className="flex items-center gap-1.5 bg-[#0A0C10] px-2.5 py-0.5 rounded border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-wider">Agent Ready</span>
            </div>
          </div>
        )}
      </header>

      {/* Main app body */}
      <main className="flex-1 p-6 overflow-hidden">
        
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
            onUpdateAdminConfig={setAdminConfig}
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
            conversations={conversations}
            onAddConversation={handleAddNewConversation}
            onUpdateConversation={handleUpdateConversation}
            messages={messages}
            onAddMessage={handleAddNewMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            adminConfig={adminConfig}
            stories={stories}
            onOpenStories={setActiveStoryUserId}
          />
        )}
      </main>

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
