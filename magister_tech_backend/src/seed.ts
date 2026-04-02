import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Criar Clientes Iniciais
  const c1 = await prisma.client.upsert({
    where: { email: 'contato@eletroc.com.br' },
    update: {},
    create: {
      name: 'Eletroc Gestão',
      email: 'contato@eletroc.com.br',
      cnpj: '12.345.678/0001-90',
      status: 'ATIVO',
    },
  });

  const c2 = await prisma.client.upsert({
    where: { email: 'atendimento@cinepasse.com.br' },
    update: {},
    create: {
      name: 'Cinepasse Labs',
      email: 'atendimento@cinepasse.com.br',
      cnpj: '98.765.432/0001-10',
      status: 'ATIVO',
    },
  });

  // Criar Contratos Iniciais
  await prisma.contract.create({
    data: {
      title: 'SaaS Gestão Eletroc',
      value: 1200.0,
      startDate: new Date(),
      clientId: c1.id,
    }
  });

  await prisma.contract.create({
    data: {
      title: 'Site Institucional Cinepasse',
      value: 3000.0,
      startDate: new Date(),
      clientId: c2.id,
    }
  });

  // Criar Tarefas do Kanban
  await prisma.task.createMany({
    data: [
      { title: 'Layout Landing Page (Eletroc)', status: 'BACKLOG', priority: 'medium', tag: 'Design' },
      { title: 'Aprovação Orçamento', status: 'BACKLOG', priority: 'high', tag: 'Comercial' },
      { title: 'Setup Banco de Dados (Cinepasse)', status: 'DOING', priority: 'high', tag: 'Backend' },
      { title: 'Integração API Pagamento', status: 'DOING', priority: 'medium', tag: 'Dev' },
      { title: 'Testes de Integração', status: 'REVIEW', priority: 'low', tag: 'QA' },
      { title: 'Assinatura Contrato AFP', status: 'DONE', priority: 'high', tag: 'Admin' },
    ]
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
