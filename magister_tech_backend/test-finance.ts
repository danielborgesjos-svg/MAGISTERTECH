import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  console.log('Testing transaction creation with fix fields...');
  try {
    const t = await prisma.transaction.create({
      data: {
        description: 'Teste Despesa Fixa JARVIS',
        type: 'DESPESA',
        amount: 150.75,
        dueDate: new Date(),
        status: 'PENDENTE',
        isFixedExpense: true,
        recurrence: true,
        recurringType: 'mensal',
        category: 'Software / Sistemas'
      }
    });
    console.log('Created:', JSON.stringify(t, null, 2));
    
    // Cleanup
    await prisma.transaction.delete({ where: { id: t.id } });
    console.log('Cleanup done.');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
