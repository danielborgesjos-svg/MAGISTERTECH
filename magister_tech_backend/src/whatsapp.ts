import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

export type WAStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  contacts: { id: string; name: string; phone: string }[];
  recentMessages: { [chatId: string]: { id: string; author: string; text: string; time: string; timestamp: number; fromMe: boolean }[] };
}

const state: WAState = {
  status: 'disconnected',
  qrDataUrl: null,
  phone: null,
  contacts: [],
  recentMessages: {},
};

let clientInstance: Client | null = null;
// SSE listeners
const listeners = new Set<(data: WAState) => void>();

function broadcast() {
  listeners.forEach(fn => fn({ ...state }));
}

export function addWAListener(fn: (data: WAState) => void) {
  listeners.add(fn);
}

export function removeWAListener(fn: (data: WAState) => void) {
  listeners.delete(fn);
}

export function getWAState(): WAState {
  return { ...state };
}

export async function startWhatsApp() {
  if (clientInstance && state.status !== 'disconnected' && state.status !== 'auth_failure') {
    return; // já rodando
  }

  state.status = 'connecting';
  state.qrDataUrl = null;
  broadcast();

  const wc = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wa_session' }),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: true,
    },
  });

  console.log('[WhatsApp] Inicializando motor Puppeteer...');

  wc.on('qr', async (qr: string) => {
    try {
      state.qrDataUrl = await qrcode.toDataURL(qr, { width: 300 });
      state.status = 'qr_ready';
      broadcast();
    } catch (err) {
      console.error('[WhatsApp] Erro ao gerar QR Code:', err);
    }
  });

  wc.on('authenticated', () => {
    state.status = 'connecting';
    state.qrDataUrl = null;
    broadcast();
  });

  wc.on('ready', async () => {
    state.status = 'connected';
    try {
      const info = wc.info;
      state.phone = info.wid.user;

      // Carrega contatos principais
      const allContacts = await wc.getContacts();
      state.contacts = allContacts
        .filter(c => !c.isGroup && c.name && c.number)
        .map(c => ({ id: c.id._serialized, name: c.name || c.pushname || c.number, phone: c.number }))
        .slice(0, 500);

      // --- RECUPERAR HISTÓRICO (Últimas 100 mensagens) ---
      console.log('[WhatsApp] Sincronizando histórico de mensagens...');
      const chats = await wc.getChats();
      // Pegar os 20 chats mais recentes para não sobrecarregar
      const recentChats = chats.slice(0, 20);

      for (const chat of recentChats) {
        const messages = await chat.fetchMessages({ limit: 100 });
        state.recentMessages[chat.id._serialized] = messages.map((m: any) => ({
          id: m.id.id,
          author: m.fromMe ? 'Você' : (m._data.notifyName || 'Cliente'),
          text: m.body,
          time: new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.timestamp * 1000,
          fromMe: m.fromMe
        }));
      }
      console.log(`[WhatsApp] Histórico carregado para ${recentChats.length} conversas.`);
    } catch (err) {
      console.error('[WhatsApp] Erro ao carregar histórico:', err);
    }
    broadcast();
  });

  wc.on('message', async (msg: any) => {
    // Apenas mensagens de texto simples para o Cockpit
    if (msg.body) {
      const chatId = msg.from;
      const newMessage = {
        id: msg.id.id,
        author: msg._data.notifyName || 'Cliente',
        text: msg.body,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        fromMe: false
      };
      
      if (!state.recentMessages[chatId]) state.recentMessages[chatId] = [];
      state.recentMessages[chatId].push(newMessage);
      if (state.recentMessages[chatId].length > 50) state.recentMessages[chatId].shift();
      
      broadcast();
    }
  });

  wc.on('message_create', async (msg: any) => {
    if (msg.fromMe && msg.body) {
      const chatId = msg.to;
      const newMessage = {
        id: msg.id.id,
        author: 'Você',
        text: msg.body,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        fromMe: true
      };
      if (!state.recentMessages[chatId]) state.recentMessages[chatId] = [];
      state.recentMessages[chatId].push(newMessage);
      broadcast();
    }
  });

  wc.on('auth_failure', (msg: string) => {
    console.error('[WhatsApp] Auth failure:', msg);
    state.status = 'auth_failure';
    broadcast();
  });

  wc.on('disconnected', (reason: string) => {
    console.log('[WhatsApp] Desconectado:', reason);
    state.status = 'disconnected';
    state.qrDataUrl = null;
    state.phone = null;
    state.contacts = [];
    broadcast();
  });

  try {
    await wc.initialize();
    clientInstance = wc;
  } catch (err) {
    console.error('[WhatsApp] Erro ao inicializar:', err);
    state.status = 'disconnected';
    broadcast();
  }
}

export async function disconnectWhatsApp() {
  if (clientInstance) {
    try { await clientInstance.destroy(); } catch {}
    clientInstance = null;
  }
  state.status = 'disconnected';
  state.qrDataUrl = null;
  state.phone = null;
  state.contacts = [];
  broadcast();
}

export function getClient() {
  return clientInstance;
}

export async function sendWAMessage(phone: string, text: string): Promise<boolean> {
  if (!clientInstance || state.status !== 'connected') {
    throw new Error('WhatsApp não está conectado.');
  }
  
  try {
    // Formata o número (exige DDI e sufiro @c.us)
    let sanitized = phone.replace(/\D/g, '');
    if (!sanitized.startsWith('55') && sanitized.length <= 11) {
      sanitized = '55' + sanitized; // assume BR fallback
    }
    const chatId = `${sanitized}@c.us`;
    await clientInstance.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err);
    throw err;
  }
}
