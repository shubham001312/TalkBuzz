/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, Conversation, Message, UserSession, UserStatusStory, AuditLogEntry } from './types';

// Predefined profiles
// Predefined profiles
export const INITIAL_USERS: User[] = [
  {
    id: 'user_founder_shubham',
    email: 'shubham.mallick1440@gmail.com',
    username: 'shubham',
    displayName: 'Shubham Mallick',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    lastSeen: new Date().toISOString(),
    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0b3tW2S',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%2310B981"/><circle cx="50" cy="40" r="18" fill="white" opacity="0.9"/><path d="M22 80c0-15 12-24 28-24s28 9 28 24" fill="white" opacity="0.9"/></svg>',
    bio: 'Founder & CEO of TalkBuzz. Building the future of lightweight, offline-first encrypted networks.',
    phone: '+1 (555) 012-3456'
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_group_buzz',
    isGroup: true,
    name: 'TalkBuzz HQ Lounge',
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%238B5CF6"/><circle cx="50" cy="40" r="18" fill="white" opacity="0.9"/><path d="M22 80c0-15 12-24 28-24s28 9 28 24" fill="white" opacity="0.9"/></svg>',
    memberIds: ['user_founder_shubham'],
    adminIds: ['user_founder_shubham'],
    inviteLink: 'https://talkbuzz.chat/join/talkbuzz-hq-main',
    lastMessageAt: new Date().toISOString(),
    pinned: true,
    archived: false,
    muted: false,
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_group_buzz',
    senderId: 'user_founder_shubham',
    ciphertext: 'EncryptedMessagePayload_ShubhamSecureInit',
    decryptedText: 'Welcome to TalkBuzz HQ! The system is fully operational. All communication paths are end-to-end encrypted locally in your sandbox.',
    messageType: 'text',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    reactions: {}
  }
];

export const INITIAL_SESSIONS: UserSession[] = [
  {
    id: 'sess_1',
    browser: 'Chrome 124.0 (Desktop)',
    os: 'Linux Ubuntu 24.04',
    ip: '192.168.1.42',
    location: 'San Jose, USA',
    lastActive: 'Active Now',
    isCurrent: true
  },
  {
    id: 'sess_2',
    browser: 'Safari Mobile 17.4 (PWA App Mode)',
    os: 'Android 14 / APK Shell',
    ip: '172.56.21.99',
    location: 'Austin, USA',
    lastActive: '1 day ago',
    isCurrent: false
  }
];

export const INITIAL_STORIES: UserStatusStory[] = [
  {
    id: 'story_founder_shubham',
    userId: 'user_founder_shubham',
    displayName: 'Shubham Mallick',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%2310B981"/><circle cx="50" cy="40" r="18" fill="white" opacity="0.9"/><path d="M22 80c0-15 12-24 28-24s28 9 28 24" fill="white" opacity="0.9"/></svg>',
    mediaUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="none"><rect width="400" height="600" fill="%230F172A"/><path d="M50 250 L350 250 L200 450 Z" fill="%2310B981" opacity="0.2"/><text x="50" y="300" fill="%2310B981" font-family="monospace" font-size="20">TALKBUZZ SECURITY ACTIVE</text></svg>',
    caption: 'Buzzing through the master launch of TalkBuzz! 🚀🐝',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_1',
    adminId: 'user_founder_shubham',
    adminName: 'Shubham Mallick',
    action: 'SYSTEM_STARTUP',
    targetType: 'system',
    targetId: 'system_core',
    details: 'System bootstrapped successfully. Cryptographic key mappings successfully registered.',
    createdAt: new Date().toISOString()
  }
];

export interface AdminSettingsConfig {
  maintenanceMode: boolean;
  groupCreationEnabled: boolean;
  maxDownloadBytes: number;
  encryptionProtocol: 'Curve25519-AES-GCM' | 'RSA-OAEP-AES-GCM';
}

export const INITIAL_ADMIN_CONFIG: AdminSettingsConfig = {
  maintenanceMode: false,
  groupCreationEnabled: true,
  maxDownloadBytes: 52428800, // 50MB
  encryptionProtocol: 'Curve25519-AES-GCM'
};

// State Loaders and Savers with localStorage fail-safes
export const loadState = <T>(key: string, defaults: T): T => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaults;
    }
    const raw = localStorage.getItem(`talkbuzz_${key}`);
    if (!raw || raw === 'undefined' || raw === 'null') {
      return defaults;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaults;
  }
};

export const saveState = <T>(key: string, data: T): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    if (data === undefined) {
      localStorage.removeItem(`talkbuzz_${key}`);
    } else {
      localStorage.setItem(`talkbuzz_${key}`, JSON.stringify(data));
    }
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
};
