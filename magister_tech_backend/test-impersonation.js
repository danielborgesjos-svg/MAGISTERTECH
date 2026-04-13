const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany().then(users => {
  prisma.client.findMany().then(clients => {
    console.log("USERS:", JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role })), null, 2));
    console.log("CLIENTS:", JSON.stringify(clients.map(c => ({ id: c.id, name: c.name, clientUserId: c.clientUserId })), null, 2));
    prisma.$disconnect();
  });
});
