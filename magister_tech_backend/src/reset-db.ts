import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando Limpeza de Dados (Reset de Fábrica)...');

  // 1. Limpar TODAS as tabelas operacionais
  await prisma.content.deleteMany();
  await prisma.task.deleteMany();
  await prisma.fatura.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.project.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany(); // Limpa inclusive usuários para reset total

  console.log('🛡️ Criando Usuário Root (Admin)...');

  // 2. Criar apenas o Admin Master
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

  console.log('✅ Sistema Zerado com Sucesso!');
  console.log('🔑 Acesso Admin: admin@magistertech.com.br / admin123');
}

main()
  .catch(e => {
    console.error('❌ Erro ao zerar dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
