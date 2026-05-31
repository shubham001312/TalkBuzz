/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Pin,
  Archive,
  MoreVertical,
  Send,
  Video,
  Phone,
  Paperclip,
  Check,
  CheckCheck,
  Flag,
  CornerUpLeft,
  Star,
  Smile,
  X,
  Volume2,
  Trash2,
  Lock,
  Download,
  Terminal,
  Clock,
  Mic,
  AlertCircle,
  HelpCircle,
  Plus,
  Users,
  ShieldAlert,
  UserCheck,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { User, Conversation, Message, UserRole, UserStatusStory } from '../types';
import { AdminSettingsConfig } from '../data';

interface ChatLayoutProps {
  currentUser: User;
  users: User[];
  conversations: Conversation[];
  onAddConversation: (conv: Conversation) => void;
  onUpdateConversation: (convId: string, updates: Partial<Conversation>) => void;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
  onUpdateMessage: (msgId: string, updates: Partial<Message>) => void;
  onDeleteMessage: (msgId: string) => void;
  adminConfig: AdminSettingsConfig;
  stories: UserStatusStory[];
  onOpenStories: (storyOwnerId: string) => void;
}

export default function ChatLayout({
  currentUser,
  users,
  conversations,
  onAddConversation,
  onUpdateConversation,
  messages,
  onAddMessage,
  onUpdateMessage,
  onDeleteMessage,
  adminConfig,
  stories,
  onOpenStories
}: ChatLayoutProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'archived' | 'stories'>('chats');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(conversations[0]?.id || null);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [chatMessageSearch, setChatMessageSearch] = useState<string>('');
  const [isSearchingInChat, setIsSearchingInChat] = useState<boolean>(false);
  
  // Media upload & Send States
  const [inputText, setInputText] = useState<string>('');
  const [quotedMsgId, setQuotedMsgId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [disappearingHours, setDisappearingHours] = useState<number>(0); // 0 corresponds to off

  // Tokenization visualizer queue
  const [tokenizerQueue, setTokenizerQueue] = useState<{ id: string; step: string; payload: string }[]>([]);
  const [isTokenizing, setIsTokenizing] = useState<boolean>(false);

  // New Chat Creation Drawer
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [newChatSearch, setNewChatSearch] = useState<string>('');
  const [isNewGroupMode, setIsNewGroupMode] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);

  // Hover states / Reactions popup target
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [msgMenuOpenId, setMsgMenuOpenId] = useState<string | null>(null);

  // Info details / Group Admin Info Sheet
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Media save file progress
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [hasSelectedSaveDir, setHasSelectedSaveDir] = useState<boolean>(true);

  // Voice recording duration
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordIntervalId, setRecordIntervalId] = useState<any>(null);

  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConvId]);

  // Handle auto-response simulations for life-like interaction
  const triggerAutoBotResponse = (convId: string, authorId: string) => {
    const author = users.find(u => u.id === authorId);
    if (!author) return;

    setTimeout(() => {
      onUpdateConversation(convId, { unreadCount: 1 });
      const automatedReplies = [
        `Received! Your Curves key generated cleanly. Checking tokenizer output in milliseconds.`,
        `Buzz compiler reports zero memory leak in libsodium bindings! Great work.`,
        `Tested file download speed. Sandbox stream behaves perfect on limited bandwidth checks alignment.`,
        `The secure connection heartbeats look green of TalkBuzz PWA container bounds. 👋🤖`,
        `Let’s schedule our core launch reviews with Shubham for the weekend!`
      ];

      const choiceText = automatedReplies[Math.floor(Math.random() * automatedReplies.length)];

      const automatedMessage: Message = {
        id: `msg_auto_${Date.now()}`,
        conversationId: convId,
        senderId: authorId,
        ciphertext: `EncryptedPayload_AutoReply_${Date.now()}`,
        decryptedText: choiceText,
        messageType: 'text',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        reactions: {}
      };

      onAddMessage(automatedMessage);
      onUpdateConversation(convId, {
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1
      });
    }, 4000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const currentConv = conversations.find(c => c.id === selectedConvId);
    if (!currentConv) return;

    const textToSend = inputText;
    setInputText('');

    // Start tokenizer visualization pipeline
    const msgId = `msg_user_${Date.now()}`;
    const formattedDate = new Date().toISOString();

    const quotedMsg = quotedMsgId ? messages.find(m => m.id === quotedMsgId) : null;
    setQuotedMsgId(null);

    // Simulate tokenization steps for visual feedback (Phase 3 C tokenize.c logic)
    setIsTokenizing(true);
    const steps = [
      { id: '1', step: 'C Array Parse', payload: `tokenize.c input string parsed into master size count: ${textToSend.length} bytes.` },
      { id: '2', step: 'Split Blocks', payload: `Payload split into ${(Math.ceil(textToSend.length / 32))} discrete 32-byte transmission chunks.` },
      { id: '3', step: 'Curve25519 Salt', payload: `NACL public key signature validated. Ciphertext payload generated.` }
    ];

    setTokenizerQueue(steps);

    setTimeout(() => {
      setIsTokenizing(false);
      setTokenizerQueue([]);

      const userMsg: Message = {
        id: msgId,
        conversationId: selectedConvId,
        senderId: currentUser.id,
        ciphertext: `EncryptedPayload_${Date.now().toString(16)}`,
        decryptedText: textToSend,
        messageType: 'text',
        replyToId: quotedMsg ? quotedMsg.id : undefined,
        replyToText: quotedMsg ? quotedMsg.decryptedText : undefined,
        isDeleted: false,
        createdAt: formattedDate,
        reactions: {}
      };

      onAddMessage(userMsg);
      onUpdateConversation(selectedConvId, {
        lastMessageAt: formattedDate,
        unreadCount: 0
      });

      // Automation bot replies disabled under user's communication directive.
    }, 1500);
  };

  // Trigger media document share with save simulated system
  const handleUploadFileSimulation = (fileType: 'image' | 'video' | 'document') => {
    if (!selectedConvId) return;

    let filename = 'untitled.png';
    let mimeType = 'image/png';
    let size = 124000;

    if (fileType === 'video') {
      filename = 'demo_recording.mp4';
      mimeType = 'video/mp4';
      size = 5400000;
    } else if (fileType === 'document') {
      filename = 'libsodium_bindings.so';
      mimeType = 'application/octet-stream';
      size = 389000;
    }

    const pathSimulated = `D:\\TalkBuzz\\Downloads\\${filename}`;

    const mediaMessage: Message = {
      id: `msg_media_${Date.now()}`,
      conversationId: selectedConvId,
      senderId: currentUser.id,
      ciphertext: `EncryptedLocalFilePayload_${Date.now().toString(18)}`,
      decryptedText: `Shared local media payload: ${filename}`,
      messageType: fileType,
      mediaMetadata: {
        filename,
        size,
        type: mimeType,
        localPath: pathSimulated
      },
      isDeleted: false,
      createdAt: new Date().toISOString(),
      reactions: {}
    };

    onAddMessage(mediaMessage);
    onUpdateConversation(selectedConvId, {
      lastMessageAt: new Date().toISOString()
    });
  };

  // Simulate local device storage save progress bar (Phase 4)
  const handleDownloadFileSimulation = (msg: Message) => {
    if (!msg.mediaMetadata) return;
    setDownloadingFileId(msg.id);
    setDownloadProgress(0);

    const intv = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intv);
          setTimeout(() => setDownloadingFileId(null), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Simulate Voice records logic
  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      clearInterval(recordIntervalId);
      setIsRecording(false);
      setRecordSeconds(0);

      // Save voice
      const voiceMsg: Message = {
        id: `msg_v_${Date.now()}`,
        conversationId: selectedConvId || '',
        senderId: currentUser.id,
        ciphertext: `VoiceRecordBlob_${Date.now()}`,
        decryptedText: 'Voice Message recording synced cleanly.',
        messageType: 'audio',
        mediaMetadata: {
          filename: `voice_note_${Date.now().toString().slice(-4)}.ogg`,
          size: 78000,
          type: 'audio/ogg'
        },
        isDeleted: false,
        createdAt: new Date().toISOString(),
        reactions: {}
      };
      if (selectedConvId) {
        onAddMessage(voiceMsg);
        onUpdateConversation(selectedConvId, { lastMessageAt: new Date().toISOString() });
      }
    } else {
      setIsRecording(true);
      setRecordSeconds(0);
      const intv = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
      setRecordIntervalId(intv);
    }
  };

  const handleReactionClick = (msgId: string, emoji: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const currentReactions = { ...msg.reactions };
    if (!currentReactions[emoji]) {
      currentReactions[emoji] = [currentUser.id];
    } else if (currentReactions[emoji].includes(currentUser.id)) {
      currentReactions[emoji] = currentReactions[emoji].filter(id => id !== currentUser.id);
      if (currentReactions[emoji].length === 0) {
        delete currentReactions[emoji];
      }
    } else {
      currentReactions[emoji].push(currentUser.id);
    }

    onUpdateMessage(msgId, { reactions: currentReactions });
    setMsgMenuOpenId(null);
  };

  const handleStartDirectChat = (recipient: User) => {
    setIsNewChatOpen(false);
    // Determine if conversation already exists with recipient
    const existing = conversations.find(c => !c.isGroup && c.participantId === recipient.id);
    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      const newConvId = `conv_new_${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        isGroup: false,
        participantId: recipient.id,
        lastMessageAt: new Date().toISOString(),
        pinned: false,
        archived: false,
        muted: false,
        unreadCount: 0
      };
      onAddConversation(newConv);
      setSelectedConvId(newConvId);
    }
  };

  const handleCreateGroupSubmit = () => {
    if (!newGroupName.trim() || newGroupMembers.length === 0) return;

    const newGroupConv: Conversation = {
      id: `conv_grp_${Date.now()}`,
      isGroup: true,
      name: newGroupName,
      iconUrl: `https://images.unsplash.com/photo-${1582213782179 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&q=80&w=256`,
      memberIds: [currentUser.id, ...newGroupMembers],
      adminIds: [currentUser.id],
      inviteLink: `https://talkbuzz.chat/join/${newGroupName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random()*100)}`,
      lastMessageAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      muted: false,
      unreadCount: 0
    };

    onAddConversation(newGroupConv);
    setSelectedConvId(newGroupConv.id);
    
    // Create initial notification message
    const autoMsg: Message = {
      id: `msg_grp_init_${Date.now()}`,
      conversationId: newGroupConv.id,
      senderId: currentUser.id,
      ciphertext: 'RoomInitPublicKeySeed',
      decryptedText: `Group room "${newGroupName}" established successfully. All team sockets connected.`,
      messageType: 'text',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      reactions: {}
    };
    onAddMessage(autoMsg);

    // Reset fields
    setIsNewChatOpen(false);
    setIsNewGroupMode(false);
    setNewGroupName('');
    setNewGroupMembers([]);
  };

  // Get active conversation parameters
  const currentConversation = conversations.find((c) => c.id === selectedConvId);
  const companionUser = currentConversation?.isGroup
    ? null
    : users.find((u) => u.id === currentConversation?.participantId);

  // Filter conversations for left column
  const filteredConversations = conversations.filter((c) => {
    // Tab filtering
    if (activeTab === 'archived' && !c.archived) return false;
    if (activeTab === 'chats' && c.archived) return false;
    
    if (globalSearch.trim() === '') return true;

    if (c.isGroup) {
      return c.name?.toLowerCase().includes(globalSearch.toLowerCase());
    } else {
      const details = users.find((u) => u.id === c.participantId);
      return (
        details?.displayName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        details?.username.toLowerCase().includes(globalSearch.toLowerCase())
      );
    }
  });

  // Filter messages for active feed searchable query
  const conversationMessages = messages.filter((m) => m.conversationId === selectedConvId);
  const filteredFeedMessages = conversationMessages.filter((m) => {
    if (!chatMessageSearch.trim()) return true;
    return m.decryptedText?.toLowerCase().includes(chatMessageSearch.toLowerCase());
  });

  return (
    <div id="talkbuzz-applet-messenger" className="flex h-[85vh] bg-[#0A0C10] border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] text-slate-300">
      {/* LEFT COLUMN: Chat Selection list list */}
      <div className={`w-full md:w-80 border-r border-[#1e293b] flex flex-col bg-[#0D1117] ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Navigation tabs */}
        <div className="flex bg-[#0D1117] border-b border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-3.5 min-h-[44px] flex items-center justify-center border-b-2 cursor-pointer transition-all ${
              activeTab === 'chats'
                ? 'border-emerald-500 text-slate-100 font-bold bg-[#0A0C10]/40'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-3.5 min-h-[44px] flex items-center justify-center border-b-2 cursor-pointer transition-all ${
              activeTab === 'archived'
                ? 'border-emerald-500 text-slate-100 font-bold bg-[#0A0C10]/40'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Archived
          </button>
          <button
            onClick={() => {
              setActiveTab('stories');
            }}
            className={`flex-1 py-3.5 min-h-[44px] flex items-center justify-center border-b-2 cursor-pointer transition-all ${
              activeTab === 'stories'
                ? 'border-emerald-500 text-slate-100 font-bold bg-[#0A0C10]/40'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Status
          </button>
        </div>

        {activeTab !== 'stories' ? (
          <>
            {/* Search inputs */}
            <div className="p-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-650" />
                </span>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search chats, contacts..."
                  className="w-full bg-[#0A0C10] border border-slate-800 pl-9 pr-3 py-1.5 rounded-lg text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500/40 text-slate-200"
                />
              </div>
            </div>

            {/* List items block */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredConversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                const recDetails = c.isGroup
                  ? { displayName: c.name, avatarUrl: c.iconUrl, isOnline: true }
                  : (() => {
                      const details = users.find((u) => u.id === c.participantId);
                      return {
                        displayName: details?.displayName || 'Unknown User',
                        avatarUrl: details?.avatarUrl || '',
                        isOnline: details?.isActive || false
                      };
                    })();

                const listMsg = messages.filter((m) => m.conversationId === c.id).slice(-1)[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-3.5 min-h-[48px] flex gap-3 cursor-pointer items-start transition-colors border-l-2 select-none ${
                      isSelected ? 'bg-slate-800/30 border-emerald-500' : 'border-transparent hover:bg-slate-800/10'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={recDetails.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-slate-800/60"
                      />
                      {recDetails.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0D1117] rounded-full shadow-[0_0_6px_#10b981]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{recDetails.displayName}</h4>
                        <span className="text-[9px] font-mono text-slate-500">
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate leading-normal">
                        {listMsg ? listMsg.decryptedText : 'No conversation payloads.'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0 font-sans">
                      {c.pinned && <Pin className="w-3 h-3 text-emerald-500/80" />}
                      {c.unreadCount > 0 && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/35 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-slate-600">
                  No secure channels found.
                </div>
              )}
            </div>

            {/* Quick launcher footer actions */}
            <div className="p-3 bg-[#0D1117] border-t border-slate-800 flex justify-between">
              <button
                onClick={() => {
                  setIsNewGroupMode(false);
                  setIsNewChatOpen(true);
                }}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-500/5 font-sans uppercase tracking-wider min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Start Conversation Hub
              </button>
            </div>
          </>
        ) : (
          /* ================= STATUS STORY LEFT TAB ================= */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF]">WhatsApp Status Updates</h4>
              <p className="text-[10px] text-[#4A5568] leading-tight">Disappearing ephemeral multimedia feeds (purged in 24 hours)</p>
            </div>

            <div className="space-y-2 pt-2">
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => onOpenStories(story.userId)}
                  className="p-3 bg-[#161925] hover:bg-[#202537] border border-[#2D3748] rounded-xl flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="p-[2px] rounded-full border-2 border-[#E5E7EB] flex-shrink-0">
                    <img
                      src={story.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-[#F3F4F6] truncate">{story.displayName}</h5>
                    <span className="text-[9px] font-mono text-[#9CA3AF]">
                      Today, {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4A5568]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Active conversation Feed dashboard */}
      {currentConversation ? (
        <div className={`flex-1 flex flex-col bg-[#0A0C10] relative ${selectedConvId ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Active Chat Header */}
          <div className="px-4 md:px-6 py-3.5 border-b border-slate-800 bg-[#0D1117] flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setSelectedConvId(null)}
                className="md:hidden w-11 h-11 -ml-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-center focus:outline-none flex-shrink-0"
                title="Back to lists"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 md:gap-3" onClick={() => setIsDetailsOpen(true)}>
                <img
                  src={companionUser ? companionUser.avatarUrl : currentConversation.iconUrl}
                  alt=""
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-slate-800"
                />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                    {companionUser ? companionUser.displayName : currentConversation.name}
                    {!companionUser && <Users className="w-3.5 h-3.5 text-slate-400" />}
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]"></span>
                    {companionUser ? (companionUser.isActive ? 'ONLINE' : 'SECURED OFFLINE') : `${currentConversation.memberIds?.length || 0} peers`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <button
                onClick={() => setIsSearchingInChat(!isSearchingInChat)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer transition-colors focus:outline-none flex-shrink-0 ${isSearchingInChat ? 'text-slate-100' : ''}`}
                title="Search conversation messages"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer focus:outline-none flex-shrink-0"
                title="Details & Settings"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Message UI Overlay inside current Chat Header */}
          {isSearchingInChat && (
            <div className="p-3 bg-[#0D1117] border-b border-slate-800 flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Filter:</span>
              <input
                type="text"
                value={chatMessageSearch}
                onChange={(e) => setChatMessageSearch(e.target.value)}
                placeholder="Type query to filter encrypted log keys..."
                className="flex-1 bg-[#0A0C10] border border-slate-800 text-xs px-3 py-1 text-slate-100 rounded-lg focus:outline-none"
              />
              <button onClick={() => { setChatMessageSearch(''); setIsSearchingInChat(false); }} className="p-1">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {/* Conversation messages scroll area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0D1117]/80 via-[#0A0C10] to-[#0A0C10]">
            
            {/* Encryption notice standard (Phase 3.4) */}
            <div className="max-w-md mx-auto p-3 md:p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl md:rounded-2xl flex items-start gap-2.5 md:gap-3 justify-center mb-2 md:mb-4">
              <Lock className="w-4.5 h-4.5 md:w-5 md:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="text-[10px] md:text-[11px] text-slate-400 leading-normal font-sans">
                🔐 Messages inside this channel utilize unique **libsodium Curve25519 E2E keypair hashes**. Handshakes occur natively, private key digests remain entirely in local device IndexedDB. The host server holds zero parsing capabilities.
              </div>
            </div>

            {filteredFeedMessages.map((msg, idx) => {
              const isMine = msg.senderId === currentUser.id;
              const sender = users.find(u => u.id === msg.senderId);

              return (
                <div
                  key={msg.id}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => { setHoveredMsgId(null); setMsgMenuOpenId(null); }}
                  onClick={() => setHoveredMsgId(hoveredMsgId === msg.id ? null : msg.id)}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} relative group cursor-pointer`}
                >
                  {/* Sender Name in Group Room details */}
                  {currentConversation.isGroup && !isMine && sender && (
                    <span className="text-[9px] font-bold text-slate-400 mb-1 ml-2 block">{sender.displayName}</span>
                  )}

                  {/* Quoted message box */}
                  {msg.replyToId && (
                    <div className="max-w-[85%] bg-slate-800/30 border-l border-emerald-500/80 px-3 py-1 text-[10px] text-slate-400 italic rounded-lg mb-0.5 max-h-16 overflow-hidden select-none">
                      Reply: "{msg.replyToText}"
                    </div>
                  )}

                  <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-3.5 rounded-xl md:rounded-2xl relative ${
                    isMine
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-[0_0_12px_rgba(16,185,129,0.15)] border border-emerald-400/20'
                      : 'bg-[#0D1117] text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}>
                    {/* Message payloads formats */}
                    {msg.messageType === 'text' && (
                      <p className="text-xs font-sans whitespace-pre-wrap leading-relaxed select-text">{msg.decryptedText}</p>
                    )}

                    {msg.messageType === 'audio' && (
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5 text-slate-450" />
                        <div>
                          <div className="text-[11px] font-bold">Voice Message Payload</div>
                          <div className="text-[10px] text-slate-450 font-mono">0:12 • Sync completed</div>
                        </div>
                        <Volume2 className="w-4 h-4 text-slate-650" />
                      </div>
                    )}

                    {msg.messageType === 'document' && msg.mediaMetadata && (
                      <div className="flex items-center gap-4 bg-[#0A0C10] p-2.5 rounded-xl border border-slate-800">
                        <Paperclip className="w-5 h-5 text-slate-400" />
                        <div className="min-w-0">
                          <h5 className="text-[11px] font-bold text-slate-200 truncate max-w-[120px]">{msg.mediaMetadata.filename}</h5>
                          <span className="text-[9px] font-mono text-slate-500">{(msg.mediaMetadata.size/1024).toFixed(1)} KB • Split Binary</span>
                        </div>

                        {downloadingFileId === msg.id ? (
                          <div className="w-8 flex flex-col items-center">
                            <span className="text-[8px] font-mono">{downloadProgress}%</span>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div className="bg-emerald-500 h-full" style={{ width: `${downloadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadFileSimulation(msg)}
                            className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors border border-emerald-500/20 min-h-[44px]"
                          >
                            <Download className="w-4 h-4" /> Save Device
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reactions display overlay */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="absolute -bottom-2 right-2 flex gap-0.5 bg-[#0D1117] px-1.5 py-0.5 rounded-md border border-slate-800 scale-90 text-[10px] text-slate-300">
                        {Object.entries(msg.reactions).map(([reaction, actors]) => (
                          <span key={reaction} title={`${actors.length} reactions`} className="text-[10px]">
                            {reaction} <span className="text-[8px] opacity-70">{actors.length}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sockets timestamps and ticks status */}
                    <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMine ? 'text-slate-800' : 'text-slate-500'}`}>
                      <span className="text-[8px] font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        <CheckCheck className="w-3 h-3 text-slate-900" />
                      )}
                    </div>
                  </div>

                  {/* Actions Popup triggering hover menus */}
                  {hoveredMsgId === msg.id && (
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#0D1117] p-1 border border-slate-800 rounded-lg shadow-xl z-20 ${isMine ? '-left-28' : '-right-28'}`}>
                      {/* Standard Reactions quick selector keys */}
                      {['👍', '❤️', '😂', '⚡'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionClick(msg.id, emoji)}
                          className="hover:scale-125 px-1 py-0.5 cursor-pointer text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                      <div className="border-l border-slate-800 h-4 mx-0.5" />
                      <button
                        onClick={() => setQuotedMsgId(msg.id)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <CornerUpLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('E2E shred message payload for everyone?')) onDeleteMessage(msg.id);
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                        title="Shred Payload"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFeedMessages.length === 0 && (
              <div className="p-12 text-center text-xs font-mono text-[#4A5568]">
                Empty secure feed history.
              </div>
            )}

            <div ref={feedEndRef} />
          </div>

          {/* Live Splitting Output Terminal (Phase 3.3 Visualizer) */}
          <AnimatePresence>
            {isTokenizing && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-6 my-2 p-3.5 bg-[#0A0C10] border border-slate-800 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1 z-30 shadow-lg relative overflow-hidden"
              >
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Terminal className="w-4 h-4 text-slate-100" />
                    <span>C-Tokenizer Assembly Stream (tokenize.c)</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-emerald-500 animate-pulse">Token Processing...</span>
                </div>
                {tokenizerQueue.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <span className="text-slate-500 font-bold">[{item.step}]:</span>
                    <span className="text-slate-300">{item.payload}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reply Quote preview bar */}
          {quotedMsgId && (
            <div className="px-6 py-2 bg-[#0A0C10] border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CornerUpLeft className="w-4 h-4 text-emerald-500" />
                <span>Replying to: "{messages.find(m => m.id === quotedMsgId)?.decryptedText}"</span>
              </div>
              <button onClick={() => setQuotedMsgId(null)} className="p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Interactive footer keyboard entry field */}
          <div className="px-6 py-4 bg-[#0D1117] border-t border-slate-800">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              {/* Media selection attachments menu keys */}
              <div className="relative group">
                <button
                  type="button"
                  className="w-11 h-11 flex items-center justify-center bg-[#0A0C10] hover:bg-[#11131C] text-slate-400 border border-slate-800 rounded-xl flex-shrink-0 cursor-pointer transition-all focus:outline-none"
                  title="Share Local Files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="hidden group-hover:flex flex-col gap-1.5 absolute bottom-12 left-0 bg-[#0D1117] border border-slate-800 p-2 rounded-xl shadow-2xl z-40 w-52 font-sans text-xs">
                  <button type="button" onClick={() => handleUploadFileSimulation('image')} className="text-left px-3 py-2.5 min-h-[44px] hover:bg-slate-800 rounded text-slate-300 cursor-pointer">
                    📸 Share Image Payload
                  </button>
                  <button type="button" onClick={() => handleUploadFileSimulation('video')} className="text-left px-3 py-2.5 min-h-[44px] hover:bg-slate-800 rounded text-slate-300 cursor-pointer">
                    🎥 Share Video Stream
                  </button>
                  <button type="button" onClick={() => handleUploadFileSimulation('document')} className="text-left px-3 py-2.5 min-h-[44px] hover:bg-slate-800 rounded text-slate-300 cursor-pointer">
                    📁 Share libsodium Shared Object
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isRecording ? 'Recording active...' : 'Type secure message end-to-end encrypted...'}
                disabled={isRecording}
                className="flex-1 px-4 h-11 bg-[#0A0C10] border border-slate-800 focus:border-emerald-500/40 text-xs text-slate-200 placeholder-slate-600 focus:outline-none rounded-xl transition-colors"
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />

              {/* Voice micro sound simulation (Phase 12.1) */}
              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                className={`w-11 h-11 flex items-center justify-center rounded-xl border flex-shrink-0 cursor-pointer transition-all focus:outline-none ${
                  isRecording
                    ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                    : 'bg-[#0A0C10] hover:bg-[#11131C] text-slate-400 border border-slate-800'
                }`}
                title="Hold to write Audio message"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl flex-shrink-0 cursor-pointer transition-all focus:outline-none disabled:opacity-40 shadow-lg shadow-emerald-500/5 disabled:bg-emerald-500/50 disabled:text-black/60"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty viewport screen placeholder */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0A0C10] hidden md:flex">
          <div className="p-4 bg-[#0D1117] border border-slate-800 rounded-full mb-4 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <Terminal className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-extrabold tracking-widest uppercase text-slate-200 font-display flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block shadow-[0_0_6px_#10b981]" />
            TalkBuzz Secure Workspace
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-normal mt-1.5 font-sans">
            Please select a conversation from your left workspace or start a new encrypted channel with team peers.
          </p>
        </div>
      )}

      {/* RIGHT SIDE DETAILS SHEET (Group Admin settings / Privacy last seen info) */}
      <AnimatePresence>
        {isDetailsOpen && currentConversation && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute md:relative right-0 inset-y-0 md:inset-y-auto h-full md:h-auto z-40 md:z-auto w-full max-w-[320px] sm:max-w-[340px] md:w-[340px] border-l border-slate-800 bg-[#0D1117] overflow-y-auto flex flex-col shadow-2xl md:shadow-none"
          >
            <div className="p-4.5 border-b border-slate-800 flex items-center justify-between bg-[#0D1117]">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Handshake Info</h4>
              <button onClick={() => setIsDetailsOpen(false)} className="p-1 hover:bg-slate-800 rounded cursor-pointer text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <img
                src={companionUser ? companionUser.avatarUrl : currentConversation.iconUrl}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-800"
              />

              <div>
                <h5 className="text-sm font-bold text-slate-200">{companionUser ? companionUser.displayName : currentConversation.name}</h5>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {companionUser ? `@${companionUser.username}` : 'Group ChatRoom Channel'}
                </span>
              </div>

              {companionUser && (
                <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-slate-800 w-full text-left font-sans text-xs">
                  <h6 className="font-bold mb-1 uppercase text-emerald-500 text-[9px] font-mono tracking-widest">About / Status</h6>
                  <p className="text-slate-300 italic">"{companionUser.bio}"</p>
                  <p className="text-slate-500 font-mono text-[9px] mt-2">Active state: Online</p>
                </div>
              )}

              {/* Group management configurations (Phase 5 Admin actions) */}
              {currentConversation.isGroup && (
                <div className="w-full text-left space-y-4">
                  <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-slate-800">
                    <h6 className="font-bold mb-1 uppercase text-emerald-500 text-[9px] font-mono tracking-widest bg-emerald-500/5 py-0.5 px-2 rounded w-fit border border-emerald-500/10">Group Actions & Info</h6>
                    <p className="text-[10px] text-slate-400 mt-2 mb-2">Permanent secure link to join room:</p>
                    <div className="bg-[#0D1117] p-2 rounded text-[10px] font-mono break-all text-emerald-400 select-all leading-relaxed border border-slate-800/80 font-bold">
                       {currentConversation.inviteLink}
                    </div>
                  </div>

                  <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <h6 className="font-bold mb-1.5 uppercase text-slate-400 text-[9px] font-mono tracking-widest">Active Members List</h6>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {currentConversation.memberIds?.map((id) => {
                        const mInfo = users.find(u => u.id === id);
                        const isAdmin = currentConversation.adminIds?.includes(id);
                        if (!mInfo) return null;
                        
                        return (
                          <div key={id} className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-semibold">{mInfo.displayName}</span>
                            {isAdmin ? (
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">Admin</span>
                            ) : (
                              <span className="text-[9px] text-slate-500 uppercase font-mono">Peer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full space-y-2 pt-3 border-t border-slate-800/60">
                {/* Toggles */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Mute alerts</span>
                  <input
                    type="checkbox"
                    checked={currentConversation.muted}
                    onChange={() => onUpdateConversation(currentConversation.id, { muted: !currentConversation.muted })}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/40">
                  <span>Pin to workspace top</span>
                  <input
                    type="checkbox"
                    checked={currentConversation.pinned}
                    onChange={() => onUpdateConversation(currentConversation.id, { pinned: !currentConversation.pinned })}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* START DIRECT CHAT / CREATE GROUP ROUTING DIALOG DRAWER */}
      <AnimatePresence>
        {isNewChatOpen && (
          <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D1117] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 mt-2">Start Communication Hub</h3>

              {/* Toggle new group chat tab */}
              <div className="flex gap-2 mb-4 bg-[#0A0C10] p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewGroupMode(false)}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg cursor-pointer transition-colors min-h-[44px] ${!isNewGroupMode ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  1-on-1 Chat
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewGroupMode(true)}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg cursor-pointer transition-colors min-h-[44px] ${isNewGroupMode ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Group Network Room
                </button>
              </div>

              {!isNewGroupMode ? (
                /* 1 on 1 discovery */
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    placeholder="Search people by username or handle..."
                    className="w-full bg-[#0A0C10] border border-slate-800 focus:border-emerald-500/40 rounded-xl text-xs px-3.5 py-2.5 text-slate-200 focus:outline-none placeholder-slate-600 transition-colors h-11"
                  />

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {users.filter(u => u.id !== currentUser.id && u.displayName.toLowerCase().includes(newChatSearch.toLowerCase())).map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleStartDirectChat(u)}
                        className="p-3.5 bg-[#0A0C10] border border-slate-800 hover:bg-slate-800/40 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:border-slate-700 min-h-[48px]"
                      >
                        <div className="flex items-center gap-3">
                          <img src={u.avatarUrl} alt="" className="w-8.5 h-8.5 rounded-full object-cover border border-slate-800" />
                          <div>
                            <div className="text-xs font-bold text-slate-200">{u.displayName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                          </div>
                        </div>
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Group setup network */
                <div className="space-y-4">
                  {/* Warning on limits toggle config Phase 8.6 */}
                  {!adminConfig.groupCreationEnabled && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/40 text-red-400 text-xs rounded-xl flex gap-1.5 items-start">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>Company Admins have restricted Group network formations under active global systems control panels.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Group Channel Name</label>
                      <input
                        type="text"
                        value={newGroupName}
                        disabled={!adminConfig.groupCreationEnabled}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Buzz Engineers, Marketing Hub..."
                        className="w-full bg-[#0A0C10] border border-slate-800 focus:border-emerald-500/40 rounded-xl text-xs px-3.5 py-2.5 text-slate-200 focus:outline-none placeholder-slate-600 transition-colors h-11"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Select Members to enroll</label>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 pt-1 opacity-100 select-none">
                        {users.filter(u => u.id !== currentUser.id).map((u) => {
                          const isSelected = newGroupMembers.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => {
                                if (!adminConfig.groupCreationEnabled) return;
                                if (isSelected) {
                                  setNewGroupMembers(prev => prev.filter(id => id !== u.id));
                                } else {
                                  setNewGroupMembers(prev => [...prev, u.id]);
                                }
                              }}
                              className={`p-3.5 rounded-lg border transition-all flex justify-between items-center cursor-pointer min-h-[44px] ${
                                isSelected
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                                  : 'bg-[#0A0C10] text-slate-400 border-slate-800/80 hover:bg-[#11131C]'
                              }`}
                            >
                              <span className="text-xs font-semibold">{u.displayName}</span>
                              <span className="font-mono text-[9px] tracking-tight text-slate-500">@{u.username}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!adminConfig.groupCreationEnabled || !newGroupName.trim() || newGroupMembers.length === 0}
                    onClick={handleCreateGroupSubmit}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs cursor-pointer flex justify-center items-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/5 hover:scale-[1.01] min-h-[44px]"
                  >
                    Build Sockets Channel Room
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
