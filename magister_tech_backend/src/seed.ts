import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── Usuários ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const gestorPassword = await bcrypt.hash('gestor123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@magistertech.com.br' },
    update: {},
    create: {
      name: 'Daniel Borges',
      email: 'admin@magistertech.com.br',
      password: adminPassword,
      role: 'ADMIN',
      sector: 'Diretoria',
    },
  });

  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@magistertech.com.br' },
    update: {},
    create: {
      name: 'Ana Lima',
      email: 'gestor@magistertech.com.br',
      password: gestorPassword,
      role: 'GESTOR',
      sector: 'Gestão de Projetos',
    },
  });

  const designer = await prisma.user.upsert({
    where: { email: 'design@magistertech.com.br' },
    update: {},
    create: {
      name: 'Carlos Mendes',
      email: 'design@magistertech.com.br',
      password: await bcrypt.hash('design123', 10),
      role: 'COLABORADOR',
      sector: 'Design',
    },
  });

  // ─── Limpa dados existentes para evitar duplicatas ─────────
  await prisma.content.deleteMany();
  await prisma.task.deleteMany();
  await prisma.fatura.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.project.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.client.deleteMany();

  // ─── Clientes ──────────────────────────────────────────────
  const c1 = await prisma.client.create({
    data: {
      name: 'Marcos Silva',
      company: 'Eletroc Gestão',
      email: 'contato@eletroc.com.br',
      phone: '(11) 99999-0001',
      cnpj: '12.345.678/0001-90',
      status: 'ATIVO',
      segment: 'Software',
      responsible: 'Ana Lima',
      healthScore: 82,
    },
  });

  const c2 = await prisma.client.create({
    data: {
      name: 'Fernanda Costa',
      company: 'Cinepasse Labs',
      email: 'atendimento@cinepasse.com.br',
      phone: '(21) 98888-0002',
      cnpj: '98.765.432/0001-10',
      status: 'ATIVO',
      segment: 'E-commerce',
      responsible: 'Daniel Borges',
      healthScore: 65,
    },
  });

  // ─── Contratos ─────────────────────────────────────────────
  const contrato1 = await prisma.contract.create({
    data: {
      title: 'Gestão de Redes — Eletroc',
      type: 'servicos',
      value: 2500.0,
      recurrence: 'Mensal',
      startDate: new Date('2025-01-01'),
      status: 'VIGENTE',
      clientId: c1.id,
    },
  });

  const contrato2 = await prisma.contract.create({
    data: {
      title: 'Tráfego Pago + Social — Cinepasse',
      type: 'servicos',
      value: 4800.0,
      recurrence: 'Mensal',
      startDate: new Date('2025-03-01'),
      status: 'VIGENTE',
      clientId: c2.id,
    },
  });

  // ─── Faturas ───────────────────────────────────────────────
  const hoje = new Date();
  const mesPassado = new Date(hoje); mesPassado.setMonth(hoje.getMonth() - 1);
  const mesFuturo = new Date(hoje); mesFuturo.setDate(hoje.getDate() + 15);

  await prisma.fatura.create({ data: { contratoId: contrato1.id, clienteId: c1.id, valor: 2500, vencimento: mesPassado, status: 'PAGO', paidAt: mesPassado, descricao: 'Competência Março/2026' } });
  await prisma.fatura.create({ data: { contratoId: contrato1.id, clienteId: c1.id, valor: 2500, vencimento: mesFuturo, status: 'PENDENTE', descricao: 'Competência Abril/2026' } });
  await prisma.fatura.create({ data: { contratoId: contrato2.id, clienteId: c2.id, valor: 4800, vencimento: mesPassado, status: 'PAGO', paidAt: mesPassado, descricao: 'Competência Março/2026' } });
  await prisma.fatura.create({ data: { contratoId: contrato2.id, clienteId: c2.id, valor: 4800, vencimento: new Date(hoje.getTime() - 86400000 * 3), status: 'VENCIDO', descricao: 'Competência Fevereiro/2026' } });

  // ─── Projetos ──────────────────────────────────────────────
  const proj1 = await prisma.project.create({
    data: {
      name: 'Gestão de Redes Abril/2026',
      type: 'marketing',
      status: 'EM_ANDAMENTO',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      clientId: c1.id,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'Campanha Lançamento Produto',
      type: 'marketing',
      status: 'EM_ANDAMENTO',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-05-15'),
      clientId: c2.id,
    },
  });

  // ─── Tarefas (Kanban por cliente) ──────────────────────────
  const amanha = new Date(); amanha.setDate(hoje.getDate() + 1);
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
  const daqui3 = new Date(); daqui3.setDate(hoje.getDate() + 3);

  // Eletroc — c1
  await prisma.task.create({ data: { title: 'Post feed — Novidade de produto', status: 'A_PRODUZIR', priority: 'ALTA', tipo: 'post', deadline: daqui3, assigneeId: designer.id, clientId: c1.id, projectId: proj1.id } });
  await prisma.task.create({ data: { title: 'Stories sequência 5 frames', status: 'EM_PRODUCAO', priority: 'MEDIA', tipo: 'stories', deadline: amanha, assigneeId: designer.id, clientId: c1.id, projectId: proj1.id } });
  await prisma.task.create({ data: { title: 'Reels tendência semana', status: 'QA', priority: 'ALTA', tipo: 'video', deadline: ontem, assigneeId: gestor.id, clientId: c1.id, projectId: proj1.id } });
  await prisma.task.create({ data: { title: 'Campanha Google Ads Abril', status: 'AGUARDANDO_APROVACAO', priority: 'ALTA', tipo: 'trafego', deadline: daqui3, assigneeId: gestor.id, clientId: c1.id, projectId: proj1.id } });
  await prisma.task.create({ data: { title: 'Post carrossel portfólio', status: 'AGENDADO', priority: 'BAIXA', tipo: 'post', assigneeId: designer.id, clientId: c1.id, projectId: proj1.id } });
  await prisma.task.create({ data: { title: 'Stories enquete produto X', status: 'PUBLICADO', priority: 'BAIXA', tipo: 'stories', assigneeId: designer.id, clientId: c1.id, projectId: proj1.id } });
  // Cinepasse — c2
  await prisma.task.create({ data: { title: 'Teaser lançamento 15s', status: 'A_PRODUZIR', priority: 'ALTA', tipo: 'video', deadline: amanha, assigneeId: designer.id, clientId: c2.id, projectId: proj2.id } });
  await prisma.task.create({ data: { title: 'Post feed lançamento', status: 'EM_PRODUCAO', priority: 'MEDIA', tipo: 'post', deadline: daqui3, assigneeId: designer.id, clientId: c2.id, projectId: proj2.id } });
  await prisma.task.create({ data: { title: 'Meta Ads — retargeting', status: 'AGUARDANDO_APROVACAO', priority: 'ALTA', tipo: 'trafego', deadline: ontem, assigneeId: gestor.id, clientId: c2.id, projectId: proj2.id } });

  // ─── Conteúdos aguardando aprovação ────────────────────────
  await prisma.content.create({ data: { title: 'Post "Semana da Inovação"', platform: 'instagram', status: 'AGUARDANDO_APROVACAO', versao: 2, clientId: c1.id, authorId: designer.id, projectId: proj1.id } });
  await prisma.content.create({ data: { title: 'Stories produto destaque', platform: 'instagram', status: 'AGUARDANDO_APROVACAO', versao: 1, clientId: c1.id, authorId: designer.id, projectId: proj1.id } });
  await prisma.content.create({ data: { title: 'Reels lançamento campanha', platform: 'instagram', status: 'AGUARDANDO_APROVACAO', versao: 1, clientId: c2.id, authorId: gestor.id, projectId: proj2.id } });

  console.log('✅ Seed concluído!');
  console.log('');
  console.log('Credenciais de acesso:');
  console.log('  Admin:   admin@magistertech.com.br / admin123');
  console.log('  Gestor:  gestor@magistertech.com.br / gestor123');
  console.log('  Design:  design@magistertech.com.br / design123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
