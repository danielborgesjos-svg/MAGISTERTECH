import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetProduction() {
  console.log('🛑 Iniciando RESET de produção...');

  try {
    // 1. Limpar todas as tabelas operacionais e de negócio
    // A ordem importa devido às foreign keys
    await prisma.ticketMessage.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.fatura.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.interaction.deleteMany();
    await prisma.content.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.event.deleteMany();
    await prisma.project.deleteMany();
    await prisma.client.deleteMany();
    
    // Novos modelos (caso já existam)
    await prisma.feedComment.deleteMany();
    await prisma.feedPost.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatChannel.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.boardColumn.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();

    console.log('✅ Dados de clientes, contratos e operações removidos.');

    // 2. Manter apenas o Admin principal
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      console.log(`ℹ️ Mantendo usuário ADMIN: ${admin.email}`);
      await prisma.user.deleteMany({
        where: { id: { not: admin.id } }
      });
    } else {
      console.warn('⚠️ Nenhum admin encontrado. O sistema pode ficar sem acesso.');
    }

    console.log('✨ Base de dados pronta para produção!');
  } catch (err) {
    console.error('❌ Erro durante o reset:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetProduction();
