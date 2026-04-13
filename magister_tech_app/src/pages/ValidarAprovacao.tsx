import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileImage, ThumbsUp, ThumbsDown } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Approval {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  clientId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  client: { name: string };
}

export default function ValidarAprovacao() {
  const { id } = useParams();
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // The backend file URL should be absolute if backend domain is different. 
  // In development, the proxy handles "/uploads"
  // In production, we might need a full URL if decoupled. For now we use the path.
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (id) loadApproval(id);
  }, [id]);

  const loadApproval = async (id: string) => {
    try {
      const data = await apiFetch<Approval>(`/api/approvals/${id}`);
      setApproval(data);
    } catch (err: any) {
      setError('Material não encontrado ou indisponível.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (status: 'APPROVED' | 'REJECTED') => {
    if (!approval) return;
    setIsSubmitting(true);
    try {
      const respondedBy = approval.client?.name + ' (Cliente)';
      await apiFetch(`/api/approvals/${approval.id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ status, respondedBy })
      });
      setApproval({ ...approval, status });
      setSuccessMsg(status === 'APPROVED' ? 'Aprovado com sucesso!' : 'Material recusado com sucesso.');
    } catch (err) {
      alert('Erro ao enviar resposta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0f172a' }}>Carregando Material...</div>;
  }

  if (error || !approval) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400 }}>
          <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Link Inválido</h2>
          <p style={{ color: '#64748b' }}>{error}</p>
        </div>
      </div>
    );
  }

  const isImage = approval.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isVideo = approval.fileUrl?.match(/\.(mp4|webm|ogg)$/i);
  
  // Helper for the file URL (append backend URL if it starts with /uploads and in dev/prod cross-origin scenarios)
  // If Vite handles the proxy perfectly, we can just use the path `approval.fileUrl`
  const displayUrl = approval.fileUrl.startsWith('http') ? approval.fileUrl : `${backendUrl}${approval.fileUrl}`;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Magister Tech</h1>
          <p style={{ fontSize: 16, color: '#64748b', marginTop: 10 }}>Portal de Aprovação de Materiais</p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', border: '1px solid #e2e8f0' }}>
          {/* Cabeçalho */}
          <div style={{ padding: 30, borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <div style={{ display: 'inline-block', background: '#eff6ff', color: '#3b82f6', fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 20, marginBottom: 10 }}>
                  {approval.type}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{approval.title}</h2>
                <p style={{ fontSize: 14, color: '#64748b', marginTop: 5 }}>Preparado para: <strong>{approval.client?.name}</strong></p>
              </div>
              
              {approval.status !== 'PENDING' && (
                <div style={{ textAlign: 'center' }}>
                  {approval.status === 'APPROVED' ? (
                     <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CheckCircle size={32} />
                        <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>APROVADO</span>
                     </div>
                  ) : (
                    <div style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <XCircle size={32} />
                        <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>RECUSADO</span>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Preview */}
          <div style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, padding: 40 }}>
            {isImage ? (
              <img src={displayUrl} alt={approval.title} style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            ) : isVideo ? (
              <video src={displayUrl} controls style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                <FileImage size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>Preview não disponível para este formato.</p>
                <a href={displayUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Baixar Arquivo Completo</a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: 30, background: '#fff' }}>
            {successMsg ? (
              <div style={{ padding: 20, background: approval.status === 'APPROVED' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${approval.status === 'APPROVED' ? '#6ee7b7' : '#fca5a5'}`, borderRadius: 12, textAlign: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: approval.status === 'APPROVED' ? '#065f46' : '#991b1b' }}>{successMsg}</h3>
                <p style={{ marginTop: 6, color: approval.status === 'APPROVED' ? '#047857' : '#b91c1c' }}>A equipe já foi notificada!</p>
              </div>
            ) : approval.status === 'PENDING' ? (
              <div>
                <p style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 }}>
                  Por favor, analise o material acima. Se estiver de acordo, clique em Aprovar. Caso precise de ajustes ou não concorde, clique em Recusar.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <button 
                    onClick={() => handleReply('REJECTED')}
                    disabled={isSubmitting}
                    style={{ 
                      flex: 1, maxWidth: 200, padding: '14px 24px', background: '#fff', border: '1px solid #ef4444', 
                      color: '#ef4444', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                  >
                    <ThumbsDown size={20} /> Recusar
                  </button>
                  <button 
                    onClick={() => handleReply('APPROVED')}
                    disabled={isSubmitting}
                    style={{ 
                      flex: 1, maxWidth: 200, padding: '14px 24px', background: '#3b82f6', border: 'none', 
                      color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                    onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                  >
                    {isSubmitting ? 'Enviando...' : <><ThumbsUp size={20} /> Aprovar Material</>}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 13 }}>
          &copy; {new Date().getFullYear()} Magister Tech - Plataforma de Gestão e Aprovações
        </div>
      </div>
    </div>
  );
}
