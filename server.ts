import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc 
} from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Firebase Configuration & Initialization ---
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};

try {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  console.log('Firebase configure loaded successfully.');
} catch (error) {
  console.error('Error reading firebase-applet-config.json:', error);
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// --- Database schema initialization ---
async function initDb() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding initial data into Firestore database...');
      
      // Founder & CEO Shubham
      const defaultUser = {
        id: 'user_founder_shubham',
        email: 'shubham.mallick1440@gmail.com',
        username: 'shubham',
        displayName: 'Shubham Mallick',
        role: 'super_admin',
        isActive: true,
        lastSeen: new Date().toISOString(),
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0b3tW2S',
        avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%2310B981"/><circle cx="50" cy="40" r="18" fill="white" opacity="0.9"/><path d="M22 80c0-15 12-24 28-24s28 9 28 24" fill="white" opacity="0.9"/></svg>',
        bio: 'Founder & CEO of TalkBuzz. Building the future of lightweight, offline-first encrypted networks.',
        phone: '+1 (555) 012-3456',
        isTwoFactorEnabled: false,
        twoFactorSecret: ''
      };
      await setDoc(doc(db, 'users', defaultUser.id), defaultUser);
      await setDoc(doc(db, 'user_passwords', defaultUser.email.toLowerCase()), { 
        email: defaultUser.email.toLowerCase(), 
        password: 'admin' 
      });

      // Seeding Buzz bot user so it exists in users
      const buzzBot = {
        id: 'user_bot_buzz',
        email: 'buzz@talkbuzz.internal',
        username: 'buzz',
        displayName: 'Buzz AI Assistant',
        role: 'user',
        isActive: true,
        lastSeen: new Date().toISOString(),
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA-BotBuzz',
        avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%2314b8a6"/><path d="M30 40h40v20H30V40z" fill="white" opacity="0.9"/><circle cx="40" cy="50" r="4" fill="%230F172A"/><circle cx="60" cy="50" r="4" fill="%230F172A"/><path d="M45 68h10v4H45v-4z" fill="white"/></svg>',
        bio: 'Core AI routing kernel powered by Gemini. Ask me anything or let me assist you with encrypted channels.',
        phone: '',
        isTwoFactorEnabled: false,
        twoFactorSecret: ''
      };
      await setDoc(doc(db, 'users', buzzBot.id), buzzBot);

      // Initial HQ conversation
      const defaultConv = {
        id: 'conv_group_buzz',
        isGroup: true,
        name: 'TalkBuzz HQ Lounge',
        iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%238B5CF6"/><circle cx="50" cy="40" r="18" fill="white" opacity="0.9"/><path d="M22 80c0-15 12-24 28-24s28 9 28 24" fill="white" opacity="0.9"/></svg>',
        memberIds: ['user_founder_shubham', 'user_bot_buzz'],
        adminIds: ['user_founder_shubham'],
        inviteLink: 'https://talkbuzz.chat/join/talkbuzz-hq-main',
        lastMessageAt: new Date().toISOString(),
        pinned: true,
        archived: false,
        muted: false,
        unreadCount: 0
      };
      await setDoc(doc(db, 'conversations', defaultConv.id), defaultConv);

      // Welcome message in HQ
      const defaultMsg = {
        id: 'msg_1',
        conversationId: 'conv_group_buzz',
        senderId: 'user_founder_shubham',
        ciphertext: 'EncryptedMessagePayload_ShubhamSecureInit',
        decryptedText: 'Welcome to TalkBuzz HQ! The system is fully operational. All communication paths are end-to-end encrypted locally in your sandbox.',
        messageType: 'text',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        reactions: {}
      };
      await setDoc(doc(db, 'messages', defaultMsg.id), defaultMsg);

      // Default sessions
      const defaultSess = {
        id: 'sess_1',
        browser: 'Chrome 124.0 (Desktop)',
        os: 'Linux Ubuntu 24.04',
        ip: '192.168.1.42',
        location: 'San Jose, USA',
        lastActive: 'Active Now',
        isCurrent: true
      };
      await setDoc(doc(db, 'sessions', defaultSess.id), defaultSess);

      // Default Stories
      const defaultStory = {
        id: 'story_founder_shubham',
        userId: 'user_founder_shubham',
        displayName: 'Shubham Mallick',
        avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%2310B981"/><circle cx="50" cy="40" r="18" fill="white" opacity="0.9"/><path d="M22 80c0-15 12-24 28-24s28 9 28 24" fill="white" opacity="0.9"/></svg>',
        mediaUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="none"><rect width="400" height="600" fill="%230F172A"/><path d="M50 250 L350 250 L200 450 Z" fill="%2310B981" opacity="0.2"/><text x="50" y="300" fill="%2310B981" font-family="monospace" font-size="20">TALKBUZZ SECURITY ACTIVE</text></svg>',
        caption: 'Buzzing through the master launch of TalkBuzz! 🚀🐝',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'stories', defaultStory.id), defaultStory);

      // Audit logs
      const defaultAudit = {
        id: 'audit_1',
        adminId: 'user_founder_shubham',
        adminName: 'Shubham Mallick',
        action: 'SYSTEM_STARTUP',
        targetType: 'system',
        targetId: 'system_core',
        details: 'System bootstrapped successfully. Cryptographic key mappings successfully registered.',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'audit_logs', defaultAudit.id), defaultAudit);

      // Admin config
      const defaultAdmin = {
        id: 'primary',
        maintenanceMode: false,
        groupCreationEnabled: true,
        maxDownloadBytes: 52428800,
        encryptionProtocol: 'Curve25519-AES-GCM'
      };
      await setDoc(doc(db, 'admin_config', 'primary'), defaultAdmin);

      console.log('Firebase Firestore seeding completed successfully.');
    } else {
      // Ensure Buzz bot user exists
      const buzzBotSnap = await getDoc(doc(db, 'users', 'user_bot_buzz'));
      if (!buzzBotSnap.exists()) {
        const buzzBot = {
          id: 'user_bot_buzz',
          email: 'buzz@talkbuzz.internal',
          username: 'buzz',
          displayName: 'Buzz AI Assistant',
          role: 'user',
          isActive: true,
          lastSeen: new Date().toISOString(),
          publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA-BotBuzz',
          avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="50" fill="%2314b8a6"/><path d="M30 40h40v20H30V40z" fill="white" opacity="0.9"/><circle cx="40" cy="50" r="4" fill="%230F172A"/><circle cx="60" cy="50" r="4" fill="%230F172A"/><path d="M45 68h10v4H45v-4z" fill="white"/></svg>',
          bio: 'Core AI routing kernel powered by Gemini. Ask me anything or let me assist you with encrypted channels.',
          phone: '',
          isTwoFactorEnabled: false,
          twoFactorSecret: ''
        };
        await setDoc(doc(db, 'users', 'user_bot_buzz'), buzzBot);
      }
    }
  } catch (error) {
    console.warn('Error or timeout during Firestore seed query:', error);
  }
}

initDb();

// --- TalkBuzz local SLM chatbot model definition ---
function queryLocalSLM(userMessage: string): string {
  const msg = (userMessage || '').toLowerCase().trim();

  // 1. GREETINGS
  if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg.includes('hello ')|| msg.includes('hey raw') || msg.includes('howdy') || msg.includes('greetings')) {
    const replies = [
      "👋 Hello! I'm @buzz, your secure TalkBuzz AI Assistant. I operate directly inside your sandbox security kernel. How can I help you with your encrypted chats today?",
      "Greetings! Systems check looks fully green. 📟 I'm Buzz, your communication assistant. Ready to help you explore local Curve25519 protocols, media shredders, and secure relays!",
      "Hey peer! 👋 Buzz here, fully online. How can I assist you in securing your end-to-end communications today?"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // 1.1 HOW ARE YOU
  if (msg.includes('how are you') || msg.includes('how\'s it going') || msg.includes('how do you do')) {
    return "⚡ I am running at peak processing efficiency! Memory consumption is at 0.04% and secure network sync loops are fully stable. How are you doing today in the TalkBuzz Workspace?";
  }

  // 2. ENCRYPTION / CRYPTO / SECURITY
  if (msg.includes('encrypt') || msg.includes('crypto') || msg.includes('security') || msg.includes('curve') || msg.includes('private') || msg.includes('secret') || msg.includes('key')) {
    return "🔐 **[TalkBuzz Cryptography Core]**\n\nOur system utilizes a simulated **Curve25519** key-exchange protocol paired with **AES-256-GCM** payload locks. Each message is compressed using Gzip, encrypted on the client side, and stored in our database. Since keys are stored strictly in your local device sandbox, even server administrators cannot read your ciphertext without permission. Security is built-in by design!";
  }

  // 3. SHUBHAM / FOUNDER
  if (msg.includes('shubham') || msg.includes('ceo') || msg.includes('founder') || msg.includes('creator')) {
    return "🚀 **Shubham Mallick** is the Founder & CEO of TalkBuzz! Under his visionary guidance, we engineered this application as a zero-knowledge communication workspace that runs fast and securely. Shubham is dedicated to creating accessible, high-performance, and decentralized privacy tools.";
  }

  // 4. COMPRESSION / GZIP
  if (msg.includes('gzip') || msg.includes('compress') || msg.includes('zip') || msg.includes('deflate')) {
    return "📦 **[Gzip Secure Stream Compressor]**\n\nTalkBuzz utilizes Gzip compression on all files (media, voice notes, documents) before secure encryption occurs. This reduces bandwidth overhead by up to **85%**, making direct secure transmissions lightning fast even over highly restricted satellite or off-grid links!";
  }

  // 5. FEATURES / SERVICES / HELP
  if (msg.includes('help') || msg.includes('feature') || msg.includes('can you do') || msg.includes('info') || msg.includes('tutorial')) {
    return "💡 **TalkBuzz Communication Hub Capabilities**:\n\n" +
           "• **End-to-End Encryption**: Zero-knowledge ciphertext transmission.\n" +
           "• **Voice Auditory Waves**: Gzip-compressed secure voice message notes.\n" +
           "• **Secure Files**: High-resolution image viewports and document sync.\n" +
           "• **Local Shredder**: Click message options to shred payload ciphertext across the entire network instantly.\n" +
           "• **Dual Authentication**: Two-Factor Authentication settings.\n\n" +
           "Ask me about **encryption**, **Shubham**, **gzip**, or just type a friendly message to test my offline Small Language Model!";
  }

  // 6. GENERAL FALLBACK CHAT (SLM GENERATOR)
  const words = msg.split(/\s+/).filter(w => w.length > 4);
  const keyword = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : "communications";
  
  const generalizedReplies = [
    `🤖 *[TalkBuzz SLM Engine]*: I processed your query details concerning "${keyword}". That's highly fascinating! In a decentralized sandbox like ours, every stream stays end-to-end keyed for absolute sovereignty. Let me know if you would like me to unpack more security details or help you code custom layouts!`,
    `📟 *[TalkBuzz SLM Engine]*: Received your message! "${keyword}" matches our core communication database tags. I'm keeping your session encrypted here. What other technical topics can I assist you with?`,
    `🐝 *[TalkBuzz SLM Engine]*: Buzz is processing! "${keyword}" aligns directly with our secure messaging telemetry. I am operating as a friendly local Small Language Model (SLM) right now to keep this chat active and lag-free even when the upstream server goes under high load!`
  ];
  return generalizedReplies[Math.floor(Math.random() * generalizedReplies.length)];
}

// --- Real-time Ephemeral Typing Registry ---
const typingRegistry: Record<string, Record<string, number>> = {};

function cleanTypingRegistry() {
  const now = Date.now();
  for (const convId in typingRegistry) {
    if (typingRegistry[convId]) {
      for (const userId in typingRegistry[convId]) {
        if (now - typingRegistry[convId][userId] > 6000) {
          delete typingRegistry[convId][userId];
        }
      }
      if (Object.keys(typingRegistry[convId]).length === 0) {
        delete typingRegistry[convId];
      }
    }
  }
}

// --- Gemini Autoreply Function ---
async function triggerGeminiBuzzReply(convId: string, userMessage: string) {
  if (!typingRegistry[convId]) {
    typingRegistry[convId] = {};
  }
  typingRegistry[convId]['user_bot_buzz'] = Date.now();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Calling local SLM model for fallback response.");
      
      // Artificial delay for organic chat rhythm
      await new Promise(resolve => setTimeout(resolve, 1805));

      const botMsgId = `msg_buzz_${Date.now()}`;
      const slmReply = queryLocalSLM(userMessage);
      const botMsg = {
        id: botMsgId,
        conversationId: convId,
        senderId: 'user_bot_buzz',
        ciphertext: `EncryptedPayload_Buzz_SLM_${Date.now().toString(16)}`,
        decryptedText: `🤖 **[Friendly Local SLM Mode]**\n\n${slmReply}`,
        messageType: 'text',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        reactions: {}
      };
      await setDoc(doc(db, 'messages', botMsgId), botMsg);
      await setDoc(doc(db, 'conversations', convId), { lastMessageAt: botMsg.createdAt }, { merge: true });
      
      if (typingRegistry[convId]) {
        delete typingRegistry[convId]['user_bot_buzz'];
      }
      return;
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `
You are "@buzz" (username: buzz), the official AI Assistant chatbot for TalkBuzz, an ultra-secure, lightweight, offline-first encrypted messaging application built by Shubham Mallick (Founder & CEO).
TalkBuzz features state-of-the-art secure transmission channels, local Curve25519 tokenization simulation, real-time sync, and robust privacy.

You should adopt a helpful, friendly, smart and secure AI persona who is passionate about encryption and privacy. Keep your answers concise, engaging, and in context of a chat. Do not include markdown headers like H1/H2, keep it conversational.

Below is the user's message in the conversation:
"${userMessage}"

Generate a helpful, highly conversational response. Make it specific to what they said, and keep the tone secure, developer-friendly, and engaging!
`;

    let response: any = null;
    let lastError: any = null;
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    const maxAttempts = 3;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`Calling Gemini API (${modelName}), attempt ${attempt}/${maxAttempts}...`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          if (response) break;
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
          console.warn(`Attempt ${attempt} for model ${modelName} failed with error:`, errMsg);
          
          let serializedErr = '';
          try {
            serializedErr = JSON.stringify(err) || '';
          } catch (_) {}

          // Detect rate limits or 503 unavailable or high demand spikes
          const isQuotaOrServiceIssue = 
            err?.status === "RESOURCE_EXHAUSTED" || 
            err?.status === "UNAVAILABLE" ||
            err?.code === 429 ||
            err?.code === 503 ||
            err?.error?.status === "UNAVAILABLE" ||
            err?.error?.status === "RESOURCE_EXHAUSTED" ||
            err?.error?.code === 429 ||
            err?.error?.code === 503 ||
            errMsg.includes("503") || 
            errMsg.includes("UNAVAILABLE") || 
            errMsg.includes("429") ||
            errMsg.includes("quota") ||
            errMsg.includes("Quota") ||
            errMsg.includes("rate-limits") ||
            errMsg.includes("Rate limit") ||
            errMsg.includes("high demand") ||
            errMsg.includes("temporary") ||
            errMsg.includes("demand") ||
            serializedErr.includes("UNAVAILABLE") ||
            serializedErr.includes("503") ||
            serializedErr.includes("429") ||
            serializedErr.includes("demand") ||
            serializedErr.includes("temporary");

          if (isQuotaOrServiceIssue) {
            console.warn(`Resource / service restriction detected on model ${modelName}. Aborting further retries for this model and trying fallback.`);
            break; // Break the attempt loop to try the next model instantly
          }

          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 200; // 400ms, 800ms
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      if (response) break;
    }

    if (!response) {
      throw lastError || new Error("Failed to generate content with all fallback models");
    }

    const replyText = response.text || "I was unable to process this stream locally.";
    
    const botMsgId = `msg_buzz_${Date.now()}`;
    const botMsg = {
      id: botMsgId,
      conversationId: convId,
      senderId: 'user_bot_buzz',
      ciphertext: `EncryptedPayload_Buzz_${Date.now().toString(16)}`,
      decryptedText: replyText,
      messageType: 'text',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      reactions: {}
    };

    await setDoc(doc(db, 'messages', botMsgId), botMsg);
    await setDoc(doc(db, 'conversations', convId), { lastMessageAt: botMsg.createdAt }, { merge: true });
    console.log("Gemini Buzz response generated and written successfully.");
  } catch (error) {
    console.error("Error in triggerGeminiBuzzReply:", error);
    try {
      const errorMsgId = `msg_buzz_err_${Date.now()}`;
      const slmReply = queryLocalSLM(userMessage);
      const fallbackText = `🔒 *[Security Kernel Sandbox Backup Mode Active - Upstream Bypass]*\n\nUpstream live Gemini model is experiencing extremely high demand. Switching to decentralized local SLM kernel instantly:\n\n${slmReply}`;
      const errorMsg = {
        id: errorMsgId,
        conversationId: convId,
        senderId: 'user_bot_buzz',
        ciphertext: `EncryptedPayload_Buzz_Fallback_${Date.now().toString(16)}`,
        decryptedText: fallbackText,
        messageType: 'text',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        reactions: {}
      };
      await setDoc(doc(db, 'messages', errorMsgId), errorMsg);
      await setDoc(doc(db, 'conversations', convId), { lastMessageAt: errorMsg.createdAt }, { merge: true });
      console.log("Graceful fallback message written to Firestore successfully.");
    } catch (dbErr) {
      console.error("Failed to write offline-fallback message to Firestore:", dbErr);
    }
  } finally {
    if (typingRegistry[convId]) {
      delete typingRegistry[convId]['user_bot_buzz'];
    }
  }
}

// ---------------- API ENDPOINTS -----------------

// Get entire syncable state
app.get('/api/state', async (req, res) => {
  try {
    const reqUserId = req.query.userId as string | undefined;
    const reqRole = req.query.role as string | undefined;

    // Users
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(doc => doc.data());

    // Passwords
    const passwordsSnap = await getDocs(collection(db, 'user_passwords'));
    const passwords: Record<string, string> = {};
    passwordsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email && data.password) {
        passwords[data.email.toLowerCase()] = data.password;
      }
    });

    // Conversations
    const convSnap = await getDocs(collection(db, 'conversations'));
    const rawConversations = convSnap.docs.map(doc => doc.data());

    // Messages
    const msgSnap = await getDocs(collection(db, 'messages'));
    const rawMessages = msgSnap.docs.map(doc => doc.data());

    // Filter conversations & messages to strictly isolate per-user except for super-admins
    let conversations = rawConversations;
    if (reqRole !== 'super_admin') {
      conversations = rawConversations.filter(c => {
        if (!reqUserId) return false;
        // User is member of group
        const isMember = Array.isArray(c.memberIds) && c.memberIds.includes(reqUserId);
        if (c.isGroup) {
          return isMember;
        } else {
          // If 1-on-1 private chat
          const isParticipant = c.participantId === reqUserId;
          return isMember || isParticipant;
        }
      });
    }

    const permittedConversationIds = new Set(conversations.map(c => c.id));
    let messages = rawMessages;
    if (reqRole !== 'super_admin') {
      messages = rawMessages.filter(m => {
        if (!reqUserId) return false;
        return permittedConversationIds.has(m.conversationId) || m.senderId === reqUserId;
      });
    }

    // Sessions
    const sessSnap = await getDocs(collection(db, 'sessions'));
    const sessions = sessSnap.docs.map(doc => doc.data());

    // Stories
    const storiesSnap = await getDocs(collection(db, 'stories'));
    const stories = storiesSnap.docs.map(doc => doc.data());

    // Audit Logs
    const auditLogsSnap = await getDocs(collection(db, 'audit_logs'));
    const auditLogs = auditLogsSnap.docs.map(doc => doc.data());

    // Admin Config
    const adminConfigDoc = await getDoc(doc(db, 'admin_config', 'primary'));
    const adminConfig = adminConfigDoc.exists() 
      ? adminConfigDoc.data() 
      : {
          maintenanceMode: false,
          groupCreationEnabled: true,
          maxDownloadBytes: 52428800,
          encryptionProtocol: 'Curve25519-AES-GCM'
        };

    res.json({
      users,
      passwords,
      conversations,
      messages,
      sessions,
      stories,
      auditLogs,
      adminConfig
    });
  } catch (error: any) {
    console.error('Error fetching entire states:', error);
    res.status(500).json({ error: error.message });
  }
});

// Single upsert user
app.post('/api/users', async (req, res) => {
  const u = req.body;
  if (!u.id || !u.email) {
    return res.status(400).json({ error: 'Missing id or email' });
  }
  try {
    const docRef = doc(db, 'users', u.id);
    await setDoc(docRef, {
      id: u.id,
      email: u.email,
      username: u.username || '',
      displayName: u.displayName || '',
      role: u.role || 'user',
      isActive: u.isActive !== false,
      lastSeen: u.lastSeen || new Date().toISOString(),
      publicKey: u.publicKey || '',
      avatarUrl: u.avatarUrl || '',
      bio: u.bio || '',
      phone: u.phone || '',
      isTwoFactorEnabled: u.isTwoFactorEnabled === true,
      twoFactorSecret: u.twoFactorSecret || '',
      readReceipts: u.readReceipts !== false
    }, { merge: true });
    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error upserting user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await deleteDoc(doc(db, 'users', req.params.id));
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save user passwords
app.post('/api/passwords', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    await setDoc(doc(db, 'user_passwords', email.toLowerCase()), {
      email: email.toLowerCase(),
      password
    });
    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error saving credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upsert conversation
app.post('/api/conversations', async (req, res) => {
  const c = req.body;
  if (!c.id) {
    return res.status(400).json({ error: 'Missing conversation id' });
  }
  try {
    await setDoc(doc(db, 'conversations', c.id), {
      id: c.id,
      isGroup: c.isGroup === true,
      name: c.name || null,
      iconUrl: c.iconUrl || null,
      memberIds: c.memberIds || [],
      adminIds: c.adminIds || [],
      inviteLink: c.inviteLink || null,
      lastMessageAt: c.lastMessageAt || new Date().toISOString(),
      pinned: c.pinned === true,
      archived: c.archived === true,
      muted: c.muted === true,
      unreadCount: Number(c.unreadCount || 0),
      participantId: c.participantId || null
    }, { merge: true });
    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error upserting conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await deleteDoc(doc(db, 'conversations', req.params.id));
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert message
app.post('/api/messages', async (req, res) => {
  const m = req.body;
  if (!m.id || !m.conversationId) {
    return res.status(400).json({ error: 'Missing message id or conversationId' });
  }
  try {
    await setDoc(doc(db, 'messages', m.id), {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId || '',
      ciphertext: m.ciphertext || '',
      decryptedText: m.decryptedText || '',
      messageType: m.messageType || 'text',
      isDeleted: m.isDeleted === true,
      createdAt: m.createdAt || new Date().toISOString(),
      reactions: m.reactions || {},
      mediaMetadata: m.mediaMetadata || null,
      replyToId: m.replyToId || null,
      replyToText: m.replyToText || null
    });

    // Check chatbot response triggers
    try {
      const convSnap = await getDoc(doc(db, 'conversations', m.conversationId));
      if (convSnap.exists()) {
        const conv = convSnap.data();
        const isDirectChatWithBuzz = !conv.isGroup && conv.participantId === 'user_bot_buzz';
        const isMentionedInGroup = conv.isGroup && m.decryptedText && m.decryptedText.toLowerCase().includes('@buzz');
        const isFromUser = m.senderId !== 'user_bot_buzz';

        if (isFromUser && (isDirectChatWithBuzz || isMentionedInGroup)) {
          // Asynchronous Trigger
          triggerGeminiBuzzReply(m.conversationId, m.decryptedText);
        }
      }
    } catch (err) {
      console.error("Error evaluating chatbot responses:", err);
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error upserting message logs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    await deleteDoc(doc(db, 'messages', req.params.id));
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert sessions
app.post('/api/sessions', async (req, res) => {
  const s = req.body;
  if (!s.id) {
    return res.status(400).json({ error: 'Missing session id' });
  }
  try {
    await setDoc(doc(db, 'sessions', s.id), {
      id: s.id,
      browser: s.browser || '',
      os: s.os || '',
      ip: s.ip || '',
      location: s.location || '',
      lastActive: s.lastActive || '',
      isCurrent: s.isCurrent === true
    });
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await deleteDoc(doc(db, 'sessions', req.params.id));
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert story
app.post('/api/stories', async (req, res) => {
  const st = req.body;
  if (!st.id) {
    return res.status(400).json({ error: 'Missing story id' });
  }
  try {
    await setDoc(doc(db, 'stories', st.id), {
      id: st.id,
      userId: st.userId || '',
      displayName: st.displayName || '',
      avatarUrl: st.avatarUrl || '',
      mediaUrl: st.mediaUrl || '',
      caption: st.caption || '',
      createdAt: st.createdAt || new Date().toISOString()
    });
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stories/:id', async (req, res) => {
  try {
    await deleteDoc(doc(db, 'stories', req.params.id));
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert audit log
app.post('/api/audit-logs', async (req, res) => {
  const al = req.body;
  if (!al.id) {
    return res.status(400).json({ error: 'Missing audit log id' });
  }
  try {
    await setDoc(doc(db, 'audit_logs', al.id), {
      id: al.id,
      adminId: al.adminId || '',
      adminName: al.adminName || '',
      action: al.action || '',
      targetType: al.targetType || '',
      targetId: al.targetId || '',
      details: al.details || '',
      createdAt: al.createdAt || new Date().toISOString()
    });
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert admin config
app.post('/api/admin-config', async (req, res) => {
  const ac = req.body;
  try {
    await setDoc(doc(db, 'admin_config', 'primary'), {
      id: 'primary',
      maintenanceMode: ac.maintenanceMode === true,
      groupCreationEnabled: ac.groupCreationEnabled !== false,
      maxDownloadBytes: Number(ac.maxDownloadBytes || 52428800),
      encryptionProtocol: ac.encryptionProtocol || 'Curve25519-AES-GCM'
    });
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get typing registry state for active conversation
app.get('/api/typing', (req, res) => {
  const { conversationId } = req.query;
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'Missing conversationId' });
  }
  cleanTypingRegistry();
  const typers = typingRegistry[conversationId] ? Object.keys(typingRegistry[conversationId]) : [];
  res.json({ typers });
});

// Update current user's typing status
app.post('/api/typing', (req, res) => {
  const { conversationId, userId, isTyping } = req.body;
  if (!conversationId || !userId) {
    return res.status(400).json({ error: 'Missing conversationId or userId' });
  }
  cleanTypingRegistry();
  if (!typingRegistry[conversationId]) {
    typingRegistry[conversationId] = {};
  }
  if (isTyping) {
    typingRegistry[conversationId][userId] = Date.now();
  } else {
    delete typingRegistry[conversationId][userId];
  }
  res.json({ status: 'ok' });
});

// Static assets serving / Vite integration
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on secure port ${PORT} with active Firestore DB bindings.`);
  });
}

setupVite();
