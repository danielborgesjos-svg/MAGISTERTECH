const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@magister.com'; // O login default comum
  const newPassword = '123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  let user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'CEO' }
    });
    console.log(`Senha atualizada para o usuário ${email}`);
  } else {
    user = await prisma.user.create({
      data: {
        name: 'Administrador (CEO)',
        email,
        password: hashedPassword,
        role: 'CEO',
        isActive: true
      }
    });
    console.log(`Usuário ${email} CRIADO com sucesso!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
