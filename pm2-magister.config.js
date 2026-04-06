// PM2 config de PRODUÇÃO — usado pelo deploy.sh
// Para usar manualmente: pm2 start pm2-magister.config.js
module.exports = {
  apps: [
    {
      name: 'magister-backend',
      // Roda o JS compilado, nunca ts-node em produção
      script: './magister_tech_backend/dist/server.js',
      cwd: './magister_tech_backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
