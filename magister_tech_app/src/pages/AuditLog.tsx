import { Clock, User, Fingerprint } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function AuditLog() {
  const { logs, apiReady } = useData();
  const loading = !apiReady;

  return (
    <div className="animate-in" style={{ paddingBottom: 40, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger)' }}>
            <Fingerprint /> Registros de Auditoria (Master)
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Histórico completo de interações de usuários no sistema</p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Carregando malha de segurança...</p>
        ) : logs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Nenhuma auditoria registrada.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-muted)' }}>Horário</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-muted)' }}>Colaborador</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-muted)' }}>Evento</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-muted)' }}>Módulo</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-muted)' }}>Detalhes Técnicos</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <Clock size={12} style={{ display: 'inline', marginBottom: -2, marginRight: 4 }}/> 
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    <User size={12} style={{ display: 'inline', marginBottom: -2, marginRight: 4 }}/> 
                    {log.userName}
                    <span className="badge" style={{ fontSize: 9, marginLeft: 6, background: 'var(--danger-glow)', color: 'var(--danger)' }}>{log.userRole}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: 'var(--text-main)' }}>{log.action}</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge" style={{ background: 'var(--bg-card)' }}>{log.module}</span></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-sec)', fontSize: 11, fontFamily: 'monospace' }}>
                    {log.details.length > 50 ? log.details.substring(0, 50) + '...' : log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
