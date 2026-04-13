const fs = require('fs');
let d = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8'); d = d.replace(', RefreshCw', ''); fs.writeFileSync('src/pages/Dashboard.tsx', d);
let f = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8'); f = f.replace('Plus, ', '').replace('DollarSign, ', '').replace(', getBalance', '').replace('const custosVariaveisMensais = transactions.filter(t => t.type === \'expense\' && !t.isFixedExpense && t.status === \'pago\').reduce((a,c) => a + c.amount, 0);', ''); fs.writeFileSync('src/pages/Financeiro.tsx', f);
let p = fs.readFileSync('src/pages/Perfil.tsx', 'utf8'); p = p.replace(', Upload', '').replace(', Badge', '').replace('const [showNewPwd, setShowNewPwd] = useState(false);', ''); fs.writeFileSync('src/pages/Perfil.tsx', p);
let t = fs.readFileSync('src/pages/Tickets.tsx', 'utf8'); t = t.replace('HelpCircle, Activity', 'Activity'); fs.writeFileSync('src/pages/Tickets.tsx', t);
console.log('Fixed unused variables');
