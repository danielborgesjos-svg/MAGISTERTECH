<!-- HOLOZONIC LANDING - ÁREA DO PACIENTE SALA SCRIPT -->
<!-- Este arquivo é injetado no landing.html via <script src="/sala.js"> -->
<!-- Gerencia a sala de espera do paciente e comunicação com o painel -->

(function() {
  // ========== SALA STATE via localStorage ==========
  const SALA_KEY = 'holozonic_salas';
  const CHAT_KEY = 'holozonic_chat_';

  window.HolSala = {
    getSalas: () => JSON.parse(localStorage.getItem(SALA_KEY) || '[]'),
    setSalas: (s) => localStorage.setItem(SALA_KEY, JSON.stringify(s)),
    getChat: (id) => JSON.parse(localStorage.getItem(CHAT_KEY + id) || '[]'),
    setChat: (id, msgs) => localStorage.setItem(CHAT_KEY + id, JSON.stringify(msgs)),

    criarSala: (paciente) => {
      const salas = window.HolSala.getSalas();
      const id = 'sala_' + paciente.cpf + '_' + Date.now();
      const nova = {
        id, cpf: paciente.cpf, nome: paciente.nome,
        tel: paciente.tel || '', procedimento: paciente.procedimento || '',
        status: 'aguardando', criadaEm: new Date().toISOString(),
        meetLink: null
      };
      salas.push(nova);
      window.HolSala.setSalas(salas);
      window.HolSala.setChat(id, [{ de: 'sistema', msg: 'Bem-vindo(a) ' + paciente.nome + '! Sua sala está pronta. O médico entrará em breve.', hora: new Date().toLocaleTimeString('pt-BR') }]);
      return nova;
    },

    buscarPorCpf: (cpf) => {
      const cpfLimpo = cpf.replace(/\D/g, '');
      return window.HolSala.getSalas().find(s => s.cpf === cpfLimpo && s.status !== 'encerrada');
    },

    enviarMsg: (salaId, msg, de) => {
      const chat = window.HolSala.getChat(salaId);
      chat.push({ de, msg, hora: new Date().toLocaleTimeString('pt-BR') });
      window.HolSala.setChat(salaId, chat);
    },

    getMeetLink: (salaId) => {
      const salas = window.HolSala.getSalas();
      const sala = salas.find(s => s.id === salaId);
      return sala ? sala.meetLink : null;
    }
  };
})();
