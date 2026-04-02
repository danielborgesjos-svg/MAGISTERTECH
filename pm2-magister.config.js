module.exports = {
  apps: [
    {
      name: 'magister-backend',
      script: 'npx',
      args: 'ts-node src/server.ts',
      cwd: './magister_tech_backend',
      watch: true
    },
    {
      name: 'magister-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './magister_tech_app',
      watch: false
    }
  ]
};
