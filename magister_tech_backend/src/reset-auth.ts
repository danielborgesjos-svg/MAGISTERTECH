import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPwd = await bcrypt.hash('admin123', 10);
  const gestorPwd = await bcrypt.hash('gestor123', 10);

  console.log('🔄 Resetando senhas...');

  // 1. Reset admin@magister.com (atual admin no banco)
  try {
    await prisma.user.update({
      where: { email: 'admin@magister.com' },
      data: { password: adminPwd, isActive: true, role: 'ADMIN' }
    });
    console.log('✅ admin@magister.com resetado.');
  } catch (e) {
    console.log('⚠️ admin@magister.com não encontrado para reset.');
  }

  // 2. Garantir admin@magistertech.com.br (padrao do seed)
  await prisma.user.upsert({
    where: { email: 'admin@magistertech.com.br' },
    update: { password: adminPwd, isActive: true, role: 'ADMIN' },
    create: {
      name: 'Admin Magister',
      email: 'admin@magistertech.com.br',
      password: adminPwd,
      role: 'ADMIN',
      isActive: true
    }
  });
  console.log('✅ admin@magistertech.com.br garantido.');

  // 3. Reset ester@magistertech.com.br
  try {
    await prisma.user.update({
      where: { email: 'ester@magistertech.com.br' },
      data: { password: gestorPwd, isActive: true }
    });
    console.log('✅ ester@magistertech.com.br resetado.');
  } catch (e) {
    console.log('⚠️ ester@magistertech.com.br não encontrado.');
  }

  console.log('🚀 Pronto! Tente logar com admin@magister.com ou admin@magistertech.com.br usando a senha admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
