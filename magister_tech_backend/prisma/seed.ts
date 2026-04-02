import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar tabelas
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.content.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuários
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Magister',
      email: 'admin@magistertech.com.br',
      password: adminPassword,
      role: 'ADMIN',
      sector: 'Diretoria'
    }
  });

  const ctoUser = await prisma.user.create({
    data: {
      name: 'Daniel Borges',
      email: 'daniel@magistertech.com.br',
      password: adminPassword,
      role: 'CTO',
      sector: 'Desenvolvimento'
    }
  });

  const designerUser = await prisma.user.create({
    data: {
      name: 'Ana Silva',
      email: 'ana@magistertech.com.br',
      password: adminPassword,
      role: 'DESIGNER',
      sector: 'Criação'
    }
  });

  // 2. Criar Clientes (7 clientes)
  const clientes = [
    { name: 'Cinepasse Labs', company: 'Cinepasse', email: 'contato@cinepasse.com', status: 'ATIVO', responsible: ctoUser.id },
    { name: 'Eletroc Gestão', company: 'Eletroc', email: 'adm@eletroc.com.br', status: 'ATIVO', responsible: ctoUser.id },
    { name: 'Holozonic Longevidade', company: 'Clínica Holozonic', email: 'holozonic@clinica.com', status: 'ATIVO', responsible: adminUser.id },
    { name: 'Investcorp BR', company: 'Investcorp', email: 'contato@investcorp.com.br', status: 'ATIVO', responsible: adminUser.id },
    { name: 'Moda Prime', company: 'Moda Prime', email: 'contato@modaprime.com', status: 'ATIVO', responsible: designerUser.id },
    { name: 'Tech Solutions LTDA', company: 'Tech Sol', email: 'contato@techsol.com', status: 'ATIVO', responsible: ctoUser.id },
    { name: 'Construtora Horizonte', company: 'Horizonte Construções', email: 'contato@construtorahorizonte.com', status: 'ATIVO', responsible: adminUser.id }
  ];

  const clientesCriados = [];
  for (const c of clientes) {
    const cliente = await prisma.client.create({ data: c });
    clientesCriados.push(cliente);
  }

  // 3. Criar Projetos e Contratos para alguns clientes
  const cinepasse = clientesCriados[0];
  const eletroc = clientesCriados[1];

  const p1 = await prisma.project.create({
    data: {
      name: 'ERP Cloud Cinepasse',
      type: 'sistemas',
      status: 'EM_ANDAMENTO',
      clientId: cinepasse.id,
      startDate: new Date('2026-03-01'),
      description: 'Desenvolvimento do ERP completo para gestão de assinaturas do Cinepasse.'
    }
  });

  const p2 = await prisma.project.create({
    data: {
      name: 'App Gestão Eletroc',
      type: 'aplicativo',
      status: 'PLANEJAMENTO',
      clientId: eletroc.id,
      startDate: new Date('2026-04-10'),
      description: 'App mobile para gestão de frotas e serviços técnicos da Eletroc.'
    }
  });

  await prisma.contract.create({
    data: {
      title: 'Dev ERP Cinepasse',
      value: 15000.00,
      type: 'projeto',
      clientId: cinepasse.id,
      startDate: new Date('2026-03-01'),
      status: 'VIGENTE'
    }
  });

  // 4. Criar Tarefas no Kanban
  const tarefas = [
    { title: 'Levantamento de Requisitos', status: 'DONE', priority: 'ALTA', projectId: p1.id, clientId: cinepasse.id, assigneeId: ctoUser.id },
    { title: 'Design Arquitetura BD', status: 'DOING', priority: 'ALTA', projectId: p1.id, clientId: cinepasse.id, assigneeId: ctoUser.id, tags: 'Backend' },
    { title: 'Telas React Native', status: 'A_FAZER', priority: 'MEDIA', projectId: p2.id, clientId: eletroc.id, assigneeId: designerUser.id, tags: 'Design' },
    { title: 'Aprovação Contrato Final', status: 'AGUARDANDO_CLIENTE', priority: 'URGENTE', clientId: eletroc.id, assigneeId: adminUser.id, tags: 'Comercial' },
    { title: 'Criar Landing Page Moda Prime', status: 'BACKLOG', priority: 'MEDIA', clientId: clientesCriados[4].id, assigneeId: designerUser.id, tags: 'Dev' },
  ];
  for (const t of tarefas) {
    await prisma.task.create({ data: t });
  }

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
