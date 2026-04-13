/**
 * Script de seed — Equipe Magister Tech
 * Cria os 6 colaboradores com senha padrão 123456 (devem alterar no primeiro login)
 * 
 * Uso: node seed-equipe.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const MEMBERS = [
  {
    name: 'Daniel Borges',
    email: 'daniel@magistertech.com.br',
    role: 'CEO',
    sector: 'Diretoria',
    phone: '',
  },
  {
    name: 'Ester Ferreira',
    email: 'ester@magistertech.com.br',
    role: 'GESTOR',
    sector: 'Comercial',
    phone: '',
  },
  {
    name: 'Lucas Larroca',
    email: 'lucas@magistertech.com.br',
    role: 'COLABORADOR',
    sector: 'Tecnologia',
    phone: '',
  },
  {
    name: 'Gustavo Cruz',
    email: 'gustavo@magistertech.com.br',
    role: 'COLABORADOR',
    sector: 'Criativo',
    phone: '',
  },
  {
    name: 'Cristiano Ferreira',
    email: 'cristiano@magistertech.com.br',
    role: 'COLABORADOR',
    sector: 'Criativo',
    phone: '',
  },
  {
    name: 'Livia',
    email: 'livia@magistertech.com.br',
    role: 'COLABORADOR',
    sector: 'Conteúdo',
    phone: '',
  },
];

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Magister Tech — Seed Equipe           ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const hashedPassword = await bcrypt.hash('123456', 10);

  for (const member of MEMBERS) {
    const existing = await prisma.user.findUnique({ where: { email: member.email } });

    if (existing) {
      console.log(`[SKIP] ${member.name} <${member.email}> já existe.`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        password: hashedPassword,
        role: member.role,
        sector: member.sector,
        phone: member.phone,
        isActive: true,
      },
    });

    console.log(`[OK]   ${user.name} — ${user.role} — ${user.email}`);
  }

  console.log('\n✓ Todos os colaboradores foram processados.');
  console.log('  Senha padrão: 123456 (cada um deve alterar no primeiro login)');
  console.log('  Rota para alterar: /admin/perfil → Alterar Senha\n');
}

main()
  .catch(err => { console.error('[ERRO]', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
