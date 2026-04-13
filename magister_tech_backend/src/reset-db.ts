import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando Reset Total do Banco (Factory Reset)...');

  // === FASE 1: Limpar tabelas com dependências externas primeiro ===
  await prisma.comment.deleteMany();
  console.log('  ✓ Comentários de tarefas removidos');

  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  console.log('  ✓ Tickets e mensagens removidos');

  await prisma.feedComment.deleteMany();
  await prisma.feedPost.deleteMany();
  console.log('  ✓ Feed interno removido');

  await prisma.chatMessage.deleteMany();
  await prisma.chatChannel.deleteMany();
  console.log('  ✓ Chat global removido');

  await prisma.waChatMessage.deleteMany();
  await prisma.waGreeting.deleteMany();
  await prisma.waHandoff.deleteMany();
  await prisma.waBotRule.deleteMany();
  await prisma.waBotConfig.deleteMany();
  console.log('  ✓ Motor WhatsApp limpo');

  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  console.log('  ✓ Notificações e logs de auditoria removidos');

  // === FASE 2: Limpar tabelas operacionais ===
  await prisma.content.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.task.deleteMany();
  await prisma.event.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.boardColumn.deleteMany();
  console.log('  ✓ Conteúdo, tarefas, eventos e metas removidos');

  await prisma.fatura.deleteMany();
  await prisma.transaction.deleteMany();
  console.log('  ✓ Faturas e transações removidas');

  await prisma.contract.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  console.log('  ✓ Contratos, projetos e clientes removidos');

  await prisma.user.deleteMany();
  console.log('  ✓ Usuários removidos');

  // === FASE 3: Criar Admin Root ===
  console.log('\n🛡️  Criando Usuário Root (Admin Master)...');
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
    data: {
      name: 'Daniel Borges',
      email: 'admin@magistertech.com.br',
      password: adminPassword,
      role: 'ADMIN',
      sector: 'Diretoria',
    },
  });

  // === FASE 4: Criar canais de chat padrão (SQLite: um por vez) ===
  await prisma.chatChannel.create({ data: { name: 'geral', icon: '💬', description: 'Canal geral da equipe' } });
  await prisma.chatChannel.create({ data: { name: 'projetos', icon: '📊', description: 'Atualizações de projetos' } });
  await prisma.chatChannel.create({ data: { name: 'marketing', icon: '📣', description: 'Time de marketing' } });

  console.log('\n✅ Sistema Zerado com Sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Admin: admin@magistertech.com.br');
  console.log('🔑 Senha: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => {
    console.error('❌ Erro ao zerar dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
