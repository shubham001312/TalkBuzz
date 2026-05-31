/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export const SUPERADMIN_EMAIL = (import.meta as any).env?.VITE_SUPERADMIN_EMAIL || 'shubham.mallick1440@gmail.com';

export const isSuperAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  return email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
};

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  lastSeen: string;
  publicKey: string;
  avatarUrl: string;
  bio: string;
  phone?: string;
  isTwoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  decryptedText?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaMetadata?: {
    filename: string;
    size: number;
    type: string;
    localPath?: string;
  };
  replyToId?: string;
  replyToText?: string;
  isDeleted: boolean;
  createdAt: string;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  isStarred?: boolean;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  iconUrl?: string;
  participantId?: string; // For 1-on-1 chat
  memberIds?: string[]; // For group chat
  adminIds?: string[]; // For group chat
  inviteLink?: string;
  lastMessageAt: string;
  pinned: boolean;
  archived: boolean;
  muted: boolean;
  unreadCount: number;
}

export interface PushSubscriptionMetadata {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'user' | 'group' | 'system';
  targetId: string;
  details: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserStatusStory {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  mediaUrl: string;
  caption: string;
  createdAt: string;
}
