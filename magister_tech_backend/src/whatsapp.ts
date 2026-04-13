import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

export type WAStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';

interface WAMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  timestamp: number;
  fromMe: boolean;
}

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  contacts: { id: string; name: string; phone: string }[];
  recentMessages: { [chatId: string]: WAMessage[] };
}

const state: WAState = {
  status: 'disconnected',
  qrDataUrl: null,
  phone: null,
  contacts: [],
  recentMessages: {},
};

let clientInstance: Client | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 3;

// SSE listeners
const listeners = new Set<(data: WAState) => void>();

function broadcast() {
  // Deep copy para evitar que alterações posteriores corrompam o snapshot enviado
  const snapshot = deepCopy();
  listeners.forEach(fn => {
    try { fn(snapshot); } catch {}
  });
}

function deepCopy(): WAState {
  return {
    status: state.status,
    qrDataUrl: state.qrDataUrl,
    phone: state.phone,
    contacts: [...state.contacts],
    recentMessages: Object.fromEntries(
      Object.entries(state.recentMessages).map(([k, v]) => [k, [...v]])
    ),
  };
}

export function addWAListener(fn: (data: WAState) => void) {
  listeners.add(fn);
}

export function removeWAListener(fn: (data: WAState) => void) {
  listeners.delete(fn);
}

export function getWAState(): WAState {
  return deepCopy();
}

// =====================================================
// BOT ENGINE — processa mensagens recebidas
// =====================================================
async function processBotResponse(prisma: PrismaClient, chatId: string, messageText: string): Promise<void> {
  if (!clientInstance || state.status !== 'connected') return;

  try {
    // Buscar configuração do bot
    const config = await (prisma as any).waBotConfig.findFirst();
    if (!config?.isEnabled) {
      console.log(`[BOT] Bot desativado. Mensagem de ${chatId} não processada. Ative o bot na aba "Bot & Automação"`);
      // Mesmo desativado, cria o ticket para não perder o contato
      const phone = chatId.split('@')[0];
      await autoCreateTicket(prisma, chatId, phone, messageText, false);
      return;
    }

    const phone = chatId.split('@')[0];
    const text = messageText.toLowerCase().trim();

    // --- Verificação de Atendimento Humano (Handoff) ---
    const handoff = await (prisma as any).waHandoff.findUnique({
      where: { clientWhatsapp: phone }
    });

    if (handoff && handoff.muteUntil > new Date()) {
      console.log(`[BOT] Silenciado para ${phone} devido a atendimento humano (Mute até ${handoff.muteUntil.toLocaleString()})`);
      return;
    }

    // --- Saudação automática (1x por dia por número no banco) ---
    if (config.greeting) {
      const greetingLog = await (prisma as any).waGreeting.findUnique({
        where: { clientWhatsapp: phone }
      });

      const ONE_DAY = 24 * 60 * 60 * 1000;
      const shouldGreet = !greetingLog || (Date.now() - greetingLog.lastGreetingAt.getTime() > ONE_DAY);

      if (shouldGreet) {
        // Atualizar/Criar log de saudação
        await (prisma as any).waGreeting.upsert({
          where: { clientWhatsapp: phone },
          update: { lastGreetingAt: new Date() },
          create: { clientWhatsapp: phone, lastGreetingAt: new Date() }
        });

        // Checar horário de atendimento
        if (config.workHours) {
          const wh = JSON.parse(config.workHours);
          const now = new Date();
          const day = now.getDay();
          const [startH, startM] = wh.start.split(':').map(Number);
          const [endH, endM] = wh.end.split(':').map(Number);
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          const inWorkHours = wh.days.includes(day) && currentMinutes >= startMinutes && currentMinutes < endMinutes;

          if (!inWorkHours && config.awayMsg) {
            await clientInstance.sendMessage(chatId, config.awayMsg);
            return;
          }
        }

        await clientInstance.sendMessage(chatId, config.greeting);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // --- Matching de regras por keyword ---
    const rules = await (prisma as any).waBotRule.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    let matched = false;
    for (const rule of rules) {
      const keywords = rule.keyword.toLowerCase().split(',').map((k: string) => k.trim()).filter(Boolean);
      if (keywords.some((kw: string) => text.includes(kw) || text === kw)) {
        await clientInstance.sendMessage(chatId, rule.response);
        matched = true;

        // Registrar no audit
        console.log(`[BOT] Regra "${rule.keyword}" ativada para ${phone}`);
        break; // para no primeiro match
      }
    }

    // --- Criar ticket automaticamente se não existir aberto ---
    await autoCreateTicket(prisma, chatId, phone, messageText, matched);

  } catch (err) {
    console.error('[BOT] Erro ao processar resposta:', err);
  }
}

async function autoCreateTicket(prisma: PrismaClient, chatId: string, phone: string, messageText: string, botHandled: boolean): Promise<void> {
  try {
    // Verifica se já existe ticket aberto para este número
    const existing = await prisma.ticket.findFirst({
      where: {
        clientWhatsapp: phone,
        status: { in: ['NOVO', 'EM_ATENDIMENTO'] },
      },
    });

    if (existing) return; // já tem ticket aberto

    const protocol = `TK-${Math.floor(Date.now() / 1000)}`;

    // Tentar encontrar nome do contato
    const contact = state.contacts.find(c => c.id === chatId);
    const clientName = contact?.name || `WhatsApp: ${phone}`;

    // Adicionar no banco de Leads se não existir
    try {
      const existingLead = await (prisma as any).waLead.findUnique({ where: { phone } });
      if (!existingLead) {
        await (prisma as any).waLead.create({
          data: {
            phone,
            name: clientName,
            stage: 'NOVO_LEAD'
          }
        });
        console.log(`[BOT] Novo Lead capturado via WhatsApp: ${phone}`);
      }
    } catch(e) { console.error('Erro ao salvar WaLead:', e); }

    await prisma.ticket.create({
      data: {
        protocol,
        subject: 'Atendimento via WhatsApp',
        description: `Primeira mensagem: "${messageText.substring(0, 200)}"${botHandled ? '\n[Bot respondeu automaticamente]' : ''}`,
        clientName,
        clientWhatsapp: phone,
        status: botHandled ? 'EM_ATENDIMENTO' : 'NOVO',
        priority: 'MEDIA',
      },
    });

    console.log(`[BOT] Ticket ${protocol} criado para ${clientName} (${phone})`);
  } catch (err) {
    console.error('[BOT] Erro ao criar ticket automático:', err);
  }
}

// =====================================================
// INICIALIZAÇÃO DO CLIENTE WHATSAPP
// =====================================================
export async function startWhatsApp(prisma?: PrismaClient) {
  if (clientInstance && state.status !== 'disconnected' && state.status !== 'auth_failure') {
    console.log('[WhatsApp] Já está rodando, status:', state.status);
    return;
  }

  state.status = 'connecting';
  state.qrDataUrl = null;
  broadcast();

  // Detectar Chrome/Chromium instalado
  const chromePaths = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chromium.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ].filter(Boolean) as string[];

  const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--mute-audio',
    '--window-size=1280,720',
  ];

  const puppeteerConfig: any = {
    headless: true,
    args: puppeteerArgs,
  };

  // Tentar usar Chrome instalado (mais estável que Puppeteer bundled no Windows)
  const { existsSync } = await import('fs');
  for (const p of chromePaths) {
    if (existsSync(p)) {
      puppeteerConfig.executablePath = p;
      console.log(`[WhatsApp] Usando Chrome: ${p}`);
      break;
    }
  }

  const wc = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wa_session' }),
    puppeteer: puppeteerConfig,
    webVersionCache: {
      type: 'local',
    },
  });

  console.log('[WhatsApp] Inicializando motor Puppeteer...');

  wc.on('qr', async (qr: string) => {
    try {
      state.qrDataUrl = await qrcode.toDataURL(qr, { width: 300 });
      state.status = 'qr_ready';
      console.log('[WhatsApp] QR Code gerado. Aguardando escaneamento...');
      broadcast();
    } catch (err) {
      console.error('[WhatsApp] Erro ao gerar QR Code:', err);
    }
  });

  wc.on('loading_screen', (percent: number, message: string) => {
    console.log(`[WhatsApp] Carregando... ${percent}% — ${message}`);
  });

  wc.on('authenticated', () => {
    state.status = 'connecting';
    state.qrDataUrl = null;
    reconnectAttempts = 0;
    console.log('[WhatsApp] Autenticado. Aguardando inicialização...');
    broadcast();
  });

  wc.on('ready', async () => {
    state.status = 'connected';
    reconnectAttempts = 0;
    console.log('[WhatsApp] Conectado e pronto!');

    try {
      const info = wc.info;
      state.phone = info.wid.user;

      // Carrega contatos
      const allContacts = await wc.getContacts();
      state.contacts = allContacts
        .filter(c => !c.isGroup && c.name && c.number)
        .map(c => ({ id: c.id._serialized, name: c.name || c.pushname || c.number, phone: c.number }))
        .slice(0, 500);

      // Carrega histórico do banco de dados (WaChatMessage)
      console.log('[WhatsApp] Sincronizando histórico do banco...');
      const dbMessages = await (prisma as any).waChatMessage.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1000 // Total global de cache
      });

      // Agrupar por chatId
      state.recentMessages = {};
      dbMessages.forEach((m: any) => {
        if (!state.recentMessages[m.chatId]) state.recentMessages[m.chatId] = [];
        state.recentMessages[m.chatId].push({
          id: m.waMessageId,
          author: m.authorName,
          text: m.text,
          time: m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.timestamp.getTime(),
          fromMe: m.fromMe
        });
      });

      // Ordenar cada chat por tempo asc
      Object.keys(state.recentMessages).forEach(cid => {
        state.recentMessages[cid].sort((a, b) => a.timestamp - b.timestamp);
      });

      console.log(`[WhatsApp] Histórico carregado do banco: ${Object.keys(state.recentMessages).length} conversas.`);
    } catch (err) {
      console.error('[WhatsApp] Erro ao carregar dados iniciais:', err);
    }

    broadcast();
  });

  // Mensagem recebida — acionar bot
  wc.on('message', async (msg: any) => {
    if (!msg.body || msg.isStatus) return;

    const chatId = msg.from;
    const authorName = msg._data.notifyName || 'Cliente';
    const newMessage: WAMessage = {
      id: msg.id.id,
      author: authorName,
      text: msg.body,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      fromMe: false,
    };

    if (!state.recentMessages[chatId]) state.recentMessages[chatId] = [];
    state.recentMessages[chatId].push(newMessage);
    if (state.recentMessages[chatId].length > 100) state.recentMessages[chatId].shift();

    broadcast();

    // Persistir no banco
    if (prisma) {
      (prisma as any).waChatMessage.create({
        data: {
          waMessageId: msg.id.id,
          chatId,
          authorName,
          text: msg.body,
          fromMe: false,
          timestamp: new Date()
        }
      }).catch(() => {});

      // Disparar bot engine
      processBotResponse(prisma, chatId, msg.body).catch(err =>
        console.error('[BOT] Erro assíncrono:', err)
      );
    }
  });

  wc.on('message_create', async (msg: any) => {
    if (!msg.fromMe || !msg.body) return;

    const chatId = msg.to;
    const phone = chatId.split('@')[0];

    const newMessage: WAMessage = {
      id: msg.id.id,
      author: 'Você',
      text: msg.body,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      fromMe: true,
    };

    if (!state.recentMessages[chatId]) state.recentMessages[chatId] = [];
    state.recentMessages[chatId].push(newMessage);
    if (state.recentMessages[chatId].length > 100) state.recentMessages[chatId].shift();

    broadcast();

    // Persistir no banco e ativar HANDOFF (pausa bot)
    if (prisma) {
      (prisma as any).waChatMessage.create({
        data: {
          waMessageId: msg.id.id,
          chatId,
          authorName: 'Você',
          text: msg.body,
          fromMe: true,
          timestamp: new Date()
        }
      }).catch(() => {});

      // Silenciar bot por 4 horas (Intervenção Humana)
      const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000);
      (prisma as any).waHandoff.upsert({
        where: { clientWhatsapp: phone },
        update: { muteUntil: fourHoursLater },
        create: { clientWhatsapp: phone, muteUntil: fourHoursLater }
      }).catch(() => {});
    }
  });

  wc.on('auth_failure', async (msg: string) => {
    console.error('[WhatsApp] Falha de autenticação:', msg);
    state.status = 'auth_failure';
    broadcast();

    // Limpar sessão corrompida
    try {
      const { rm } = await import('fs/promises');
      await rm('./.wa_session', { recursive: true, force: true });
      console.log('[WhatsApp] Sessão corrompida removida. Reinicializará no próximo start.');
    } catch {}
  });

  wc.on('disconnected', async (reason: string) => {
    console.log('[WhatsApp] Desconectado:', reason);
    state.status = 'disconnected';
    state.qrDataUrl = null;
    state.phone = null;
    state.contacts = [];
    clientInstance = null;
    broadcast();

    // Auto-reconectar (máx 3x)
    if (reconnectAttempts < MAX_RECONNECT && reason !== 'LOGOUT') {
      reconnectAttempts++;
      const delay = reconnectAttempts * 5000;
      console.log(`[WhatsApp] Tentando reconectar (${reconnectAttempts}/${MAX_RECONNECT}) em ${delay / 1000}s...`);
      setTimeout(() => startWhatsApp(prisma), delay);
    }
  });

  try {
    await wc.initialize();
    clientInstance = wc;
  } catch (err: any) {
    console.error('[WhatsApp] Erro crítico na inicialização:', err?.message || err);
    state.status = 'disconnected';
    clientInstance = null;
    broadcast();

    // Auto-reconectar em caso de erro de inicialização
    if (reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++;
      const delay = 10000;
      console.log(`[WhatsApp] Erro de init. Reconectando em ${delay / 1000}s... (${reconnectAttempts}/${MAX_RECONNECT})`);
      setTimeout(() => startWhatsApp(prisma), delay);
    }
  }
}

export async function disconnectWhatsApp() {
  if (clientInstance) {
    try {
      await clientInstance.destroy();
    } catch {}
    clientInstance = null;
  }
  reconnectAttempts = MAX_RECONNECT; // Impede auto-reconexão
  state.status = 'disconnected';
  state.qrDataUrl = null;
  state.phone = null;
  state.contacts = [];
  state.recentMessages = {};
  broadcast();
  // Resetar para próxima sessão
  setTimeout(() => { reconnectAttempts = 0; }, 5000);
}

// Reset completo da sessão (limpa arquivos + reinicia)
export async function resetWhatsAppSession(prismaClient?: PrismaClient) {
  console.log('[WhatsApp] Resetando sessão completa...');
  await disconnectWhatsApp();
  // Aguardar destruição
  await new Promise(r => setTimeout(r, 2000));
  // Limpar pasta de sessão
  try {
    const { rm } = await import('fs/promises');
    await rm('./.wa_session', { recursive: true, force: true });
    await rm('./.wwebjs_auth', { recursive: true, force: true });
    await rm('./.wwebjs_cache', { recursive: true, force: true });
    console.log('[WhatsApp] Sessão limpa com sucesso.');
  } catch (e) {
    console.error('[WhatsApp] Erro ao limpar sessão:', e);
  }
  // Reiniciar
  setTimeout(() => startWhatsApp(prismaClient), 1000);
}

export function getClient() {
  return clientInstance;
}

export async function sendWAMessage(phone: string, text: string): Promise<boolean> {
  if (!clientInstance || state.status !== 'connected') {
    throw new Error('WhatsApp não está conectado.');
  }

  let sanitized = phone.replace(/\D/g, '');
  if (!sanitized.startsWith('55') && sanitized.length <= 11) {
    sanitized = '55' + sanitized;
  }
  const chatId = `${sanitized}@c.us`;

  try {
    await clientInstance.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err);
    throw err;
  }
}
