const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.waBotConfig.findFirst();
  if (!existing) {
    await prisma.waBotConfig.create({ data: { isEnabled: false } });
    console.log('Config bot criada');
  }

  const count = await prisma.waBotRule.count();
  if (count === 0) {
    const rules = [
      { keyword: 'oi,ola,ola,bom dia,boa tarde,boa noite', response: 'Ola! Sou o assistente da Magister Tech. Como posso te ajudar?', order: 0 },
      { keyword: 'preco,preço,valor,orcamento,orcamento,quanto custa', response: 'Nossos planos comecam a partir de R$997/mes. Quer falar com um consultor?', order: 1 },
      { keyword: 'suporte,problema,bug,erro,nao funciona', response: 'Entendido! Vou registrar seu chamado. Nossa equipe retorna em ate 2h uteis.', order: 2 },
      { keyword: 'horario,horario,funcionamento,expediente', response: 'Atendemos de Seg a Sex, 8h as 18h. Fora do horario, nosso bot esta disponivel!', order: 3 },
      { keyword: 'obrigado,obrigada,valeu,thanks', response: 'Disponha! Qualquer duvida estamos a disposicao.', order: 4 },
    ];
    for (const rule of rules) {
      await prisma.waBotRule.create({ data: rule });
    }
    console.log('5 regras de exemplo criadas');
  }

  const colCount = await prisma.boardColumn.count();
  if (colCount === 0) {
    const kanbanCols = [
      { boardType: 'KANBAN', title: 'Backlog', color: '#94a3b8', order: 0 },
      { boardType: 'KANBAN', title: 'A Fazer', color: '#3b82f6', order: 1 },
      { boardType: 'KANBAN', title: 'Em Andamento', color: '#f59e0b', order: 2 },
      { boardType: 'KANBAN', title: 'Revisão', color: '#8b5cf6', order: 3 },
      { boardType: 'KANBAN', title: 'Aprovado', color: '#10b981', order: 4 },
      { boardType: 'KANBAN', title: 'Entregue', color: '#059669', order: 5 },
    ];
    const pipelineCols = [
      { boardType: 'PIPELINE', title: 'Novos Leads', color: '#60a5fa', order: 0 },
      { boardType: 'PIPELINE', title: 'Reunião', color: '#a78bfa', order: 1 },
      { boardType: 'PIPELINE', title: 'Em Negociação', color: '#f59e0b', order: 2 },
      { boardType: 'PIPELINE', title: 'Contrato Fechado', color: '#10b981', order: 3 },
      { boardType: 'PIPELINE', title: 'Ajustes', color: '#ef4444', order: 4 },
    ];
    for (const c of [...kanbanCols, ...pipelineCols]) {
      await prisma.boardColumn.create({ data: c });
    }
    console.log('Colunas de quadros inicializadas');
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
