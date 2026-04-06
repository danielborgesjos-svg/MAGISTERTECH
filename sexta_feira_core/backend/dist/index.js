"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = require("openai");
const sdk_1 = require("@anthropic-ai/sdk");
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Provedores de IA
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'fake-key' });
const anthropic = new sdk_1.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'fake-key' });
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key');
/**
 * PROTOCOLO SEXTA-FEIRA: Relational Singularity
 * Versão 1.0.0 - Alpha
 */
class SextaFeiraCore {
    constructor() {
        this.memoryPath = '../data/knowledge_graph.json';
    }
    chat(prompt_1) {
        return __awaiter(this, arguments, void 0, function* (prompt, provider = 'openai') {
            const refinedPrompt = this.applyDensityProtocol(prompt);
            console.log(`[Sexta-Feira] Executando tarefa via ${provider}...`);
            try {
                if (provider === 'openai') {
                    const response = yield openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "system", content: "Você é a SEXTA-FEIRA, uma IA de alta performance, técnica, densa e proativa." }, { role: "user", content: refinedPrompt }],
                    });
                    return response.choices[0].message.content;
                }
                if (provider === 'claude') {
                    const response = yield anthropic.messages.create({
                        model: "claude-3-5-sonnet-20240620",
                        max_tokens: 4000,
                        system: "Você é a SEXTA-FEIRA, focada em engenharia de prompt e automação total.",
                        messages: [{ role: "user", content: refinedPrompt }],
                    });
                    return response.content[0].type === 'text' ? response.content[0].text : '';
                }
                if (provider === 'gemini') {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                    const result = yield model.generateContent(refinedPrompt);
                    return result.response.text();
                }
            }
            catch (error) {
                return `Erro no provedor ${provider}: ${error.message}`;
            }
        });
    }
    applyDensityProtocol(prompt) {
        return `
      [PROTOCOL: SEXTA-FEIRA HIGH-PERFORMANCE]
      - Resposta técnica, sem redundâncias.
      - Elaborada, completa e exaustiva.
      - Foco em modularidade e escalabilidade.
      ---
      CONTEXTO: ${prompt}
    `;
    }
    speak(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
            const API_KEY = process.env.ELEVENLABS_API_KEY;
            if (!API_KEY || !VOICE_ID)
                throw new Error("Configuração de voz ausente.");
            const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
            const response = yield axios_1.default.post(url, {
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            }, {
                headers: { "xi-api-key": API_KEY },
                responseType: 'arraybuffer'
            });
            return response.data;
        });
    }
}
const core = new SextaFeiraCore();
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, provider } = req.body;
    const response = yield core.chat(message, provider);
    res.json({ response });
}));
app.post('/api/speak', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const audio = yield core.speak(text);
        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audio));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[SEXT-FEIRA] Core Operacional: http://localhost:${PORT}`);
});
