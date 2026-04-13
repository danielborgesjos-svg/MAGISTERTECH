const fs = require('fs');
let k = fs.readFileSync('src/pages/Kanban.tsx', 'utf8'); k = k.replace('import api from \'../lib/api\';', 'import { api } from \'../lib/api\';'); fs.writeFileSync('src/pages/Kanban.tsx', k);
let p = fs.readFileSync('src/pages/Perfil.tsx', 'utf8'); p = p.replace('type={showNewPwd ? \'text\' : \'password\'}', 'type=\'password\''); fs.writeFileSync('src/pages/Perfil.tsx', p);
let t = fs.readFileSync('src/pages/Tickets.tsx', 'utf8'); t = t.replace('HelpCircle, Activity', 'Activity').replace('X, Send, HelpCircle', 'X, Send'); fs.writeFileSync('src/pages/Tickets.tsx', t);
console.log('Fixed syntax issues');
