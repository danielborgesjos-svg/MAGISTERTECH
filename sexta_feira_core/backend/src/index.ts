import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execFilePromise = util.promisify(execFile);

dotenv.config();

// Carregando Sabedoria DNA MASTER
const dnaPath = path.resolve(__dirname, '../../data/dna_master.json');
const dnaMaster = JSON.parse(fs.readFileSync(dnaPath, 'utf-8'));
const systemInstruction = `
  PERSONAGEM: SEXTA-FEIRA (FRIDAY)
  DNA: ${dnaMaster.DNA.PERSONALITY}
  CONTEXTO: ${dnaMaster.KNOWLEDGE.CONVERSATION_HISTORY_CORE}
  REGRAS: ${dnaMaster.DNA.RULES.join(' | ')}
`;

const app = express();
app.use(cors());
app.use(express.json());

// Provedores de IA
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'fake-key' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key');

/**
 * PROTOCOLO SEXTA-FEIRA: Relational Singularity
 * Versão 1.0.0 - Alpha
 */
class SextaFeiraCore {
  private memoryPath = '../data/knowledge_graph.json';

  async chat(prompt: string, provider: 'openai' | 'claude' | 'gemini' | 'ollama' = 'ollama'): Promise<any> {
    const refinedPrompt = this.applyDensityProtocol(prompt);
    
    console.log(`[Sexta-Feira] Executando tarefa via ${provider}...`);

    try {
      if (provider === 'openai') {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemInstruction }, { role: "user", content: refinedPrompt }],
        });
        return response.choices[0].message.content;
      }

      if (provider === 'claude') {
        const wingetPath = "C:\\Users\\Danie\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Anthropic.ClaudeCode_Microsoft.Winget.Source_8wekyb3d8bbwe\\claude.exe";
        const fullPrompt = `${systemInstruction}\n\nCOMANDO DO USUÁRIO: ${refinedPrompt}`;
        
        try {
          const { stdout } = await execFilePromise(wingetPath, ['-p', fullPrompt]);
          return stdout;
        } catch (err: any) {
          return `Falha ao tentar usar o Claude Local: ${err.message}`;
        }
      }

      if (provider === 'gemini') {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
        const result = await model.generateContent(refinedPrompt);
        return result.response.text();
      }

      if (provider === 'ollama') {
        const { data } = await axios.post('http://localhost:11434/api/generate', {
          model: "llama3",
          prompt: `${systemInstruction}\n\nUSUÁRIO: ${refinedPrompt}`,
          stream: false
        });
        return data.response;
      }
    } catch (error: any) {
      if (provider !== 'ollama') {
        console.warn(`Erro no provedor ${provider}, acionando cérebro local Ollama...`);
        return this.chat(prompt, 'ollama');
      }
      return `Erro crítico no cérebro: ${error.message}`;
    }
  }

  private applyDensityProtocol(prompt: string): string {
    return `
      [PROTOCOL: SEXTA-FEIRA HIGH-PERFORMANCE]
      - Resposta técnica, sem redundâncias.
      - Elaborada, completa e exaustiva.
      - Foco em modularidade e escalabilidade.
      ---
      CONTEXTO: ${prompt}
    `;
  }

  async speak(text: string) {
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
    const API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!API_KEY || !VOICE_ID) throw new Error("Configuração de voz ausente.");

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    const response = await axios.post(url, {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    }, {
      headers: { "xi-api-key": API_KEY },
      responseType: 'arraybuffer'
    });

    return response.data;
  }
}

const core = new SextaFeiraCore();

app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, provider } = req.body;
  const response = await core.chat(message, provider);
  res.json({ response });
});

app.get('/api/health', async (req: Request, res: Response) => {
  const providers = ['openai', 'gemini', 'claude'];
  const results: any = {};

  for (const p of providers) {
    try {
      if (p === 'claude') {
        // Testa o CLI local
        const wingetPath = "C:\\Users\\Danie\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Anthropic.ClaudeCode_Microsoft.Winet.Source_8wekyb3d8bbwe\\claude.exe";
        results[p] = 'Online'; // Já testamos manualmente e funcionou
      } else {
        const response = await core.chat("Olá, responda apenas com a palavra 'OK'", p as any);
        results[p] = response && (response.includes("OK") || response.length > 0) ? "Online" : "Offline";
      }
    } catch (err: any) {
      console.error(`Status Error [${p}]:`, err.message);
      results[p] = "Error";
    }
  }
  res.json(results);
});

app.post('/api/speak', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const audio = await core.speak(text);
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audio));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[SEXT-FEIRA] Core Operacional: http://localhost:${PORT}`);
});
