import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaPowerOff, FaShieldAlt, FaTerminal, FaSlash, FaVolumeUp } from 'react-icons/fa';
import VoiceVisualizer from './components/VoiceVisualizer';

const App: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [provider, setProvider] = useState<'openai' | 'claude' | 'gemini'>('claude');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Offline'); // Offline, Standby, Listening, Thinking, Speaking
  const [health, setHealth] = useState<any>({ openai: '...', gemini: '...', claude: '...' });
  const [lastResponse, setLastResponse] = useState('');
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);

  // Inicializa Áudio Reativo (Requer Interação do Usuário)
  const startProtocol = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setStatus('Standby');
      initSpeechRecognition();
    } catch (e) {
      console.error("MIC ACCESS DENIED", e);
      setStatus('Error');
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('[PROCESSED]', transcript);
        
        if (transcript.includes('sexta feira')) {
          const command = transcript.split('sexta feira')[1]?.trim();
          if (command) {
            handleSend(command);
          } else {
            setStatus('Listening'); // Feedback visual imediato
            speak("Sim, Capitão. Em que posso ser útil?");
          }
        }
      };

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => { if (isListening) recognition.start(); };
      
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const speak = async (text: string) => {
    setStatus('Speaking');
    try {
      // 1. Tenta Voz de Alta Qualidade (ElevenLabs no Backend)
      const { data } = await axios.post('http://localhost:4000/api/speak', { text }, { responseType: 'arraybuffer' });
      const audioContext = audioContextRef.current || new AudioContext();
      const audioSource = await audioContext.decodeAudioData(data);
      const playSource = audioContext.createBufferSource();
      playSource.buffer = audioSource;
      playSource.connect(audioContext.destination);
      playSource.onended = () => setStatus('Standby');
      playSource.start();
    } catch (e) { 
      console.warn('ElevenLabs Offline, usando Voz Nativa...');
      // 2. Fallback: Voz Nativa do Navegador (Grátis e Offline)
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1;
      utterance.onend = () => setStatus('Standby');
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (text: string) => {
    setStatus('Thinking');
    try {
      const { data } = await axios.post('http://localhost:4000/api/chat', { message: text, provider });
      setLastResponse(data.response);
      await speak(data.response);
    } catch (error) {
      setStatus('Standby');
    }
  };

  return (
    <div className="dashboard-container">
      {/* HUD SIDEBAR */}
      <aside className="hud-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FaShieldAlt size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1rem', letterSpacing: '3px', margin: 0 }}>SEXTA-FEIRA</h1>
        </div>

        <div className="hud-section">
          <p style={{ opacity: 0.4, fontSize: '0.6rem' }}>CORE FREQUENCY</p>
          <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
             {status.toUpperCase()}
          </p>
        </div>

        {status === 'Offline' && (
          <button 
            className="neon-button active" 
            style={{ marginTop: '20px', fontSize: '0.7rem' }}
            onClick={startProtocol}
          >
             START PROTOCOL
          </button>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', opacity: 0.4 }}>
           <FaTerminal />
           <FaSlash />
           <p style={{ fontSize: '0.5rem' }}>RELATIONAL SINGULARITY 1.0.5</p>
        </div>
      </aside>

      {/* REACTIVE CORE AREA */}
      <main className="main-content">
        <button className="emergency-delete" onClick={() => window.location.reload()}>
            <FaPowerOff style={{ marginRight: '10px' }} /> Protocol Delete
        </button>

        <div className="core-container">
           {/* O MOTOR DA ORB REATIVA */}
           <VoiceVisualizer analyser={analyserRef.current} status={status} />
           
           <div style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.3 }}>
              {status === 'Thinking' && <p style={{ color: 'var(--secondary)' }}>PROCESSING...</p>}
              {status === 'Listening' && <p style={{ color: 'var(--primary)' }}>HEARING...</p>}
           </div>
        </div>

        {/* FEEDBACK VOCAL SUBTIL */}
        {lastResponse && (
           <div className="chat-overlay" style={{ textAlign: 'center', border: 'none', borderBottom: '1px solid var(--primary)' }}>
              <FaVolumeUp style={{ color: 'var(--primary)', marginBottom: '10px' }} />
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>{status === 'Speaking' ? lastResponse.slice(0, 100) + '...' : ''}</p>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
