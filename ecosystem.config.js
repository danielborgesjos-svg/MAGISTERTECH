module.exports = {
  apps: [{
    name: 'jarvis-core',
    script: 'core.js',
    instances: 1,
    autorestart: true,
    watch: false, // PM2 watch desligado para o core gerenciar via fs.watch interno, evitando restarts desnecessários
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      TEAM_CODE: 'JARVIS-001'
    },
    env_production: {
      NODE_ENV: 'production',
      TEAM_CODE: 'JARVIS-001'
    }
  }, {
    name: 'gestor-financeiro',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }, {
    name: 'holozonic-backend',
    cwd: './holozonic_backend',
    script: 'pm2-start.js',
    max_memory_restart: '800M',
    env: {
      NODE_ENV: 'development',
      PORT: 3333
    }
  }, {
    name: 'holozonic-admin',
    cwd: './holozonic_admin',
    script: 'npm.cmd',
    args: 'run dev -- --port 5173',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
