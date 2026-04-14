import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileImage, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Approval {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  clientId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  client: { name: string };
}

export default function ValidarAprovacao() {
  const { id } = useParams();
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

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
    if (status === 'REJECTED' && !rejectReason.trim()) {
      alert('Por favor, informe o motivo da reprovação.');
      return;
    }

    if (!approval) return;
    setIsSubmitting(true);
    try {
      const respondedBy = approval.client?.name + ' (Cliente)';
      await apiFetch(`/api/approvals/${approval.id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ status, respondedBy, rejectReason: status === 'REJECTED' ? rejectReason : null })
      });
      setApproval({ ...approval, status, rejectReason: status === 'REJECTED' ? rejectReason : undefined });
      setShowRejectForm(false);
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

  // Parse files
  let files: string[] = [];
  try {
    const parsed = JSON.parse(approval.fileUrl);
    files = Array.isArray(parsed) ? parsed : [approval.fileUrl];
  } catch (e) {
    files = approval.fileUrl ? [approval.fileUrl] : [];
  }

  const getDisplayUrl = (url: string) => url.startsWith('http') ? url : `${backendUrl}${url}`;
  const currentUrl = files[currentFileIndex] ? getDisplayUrl(files[currentFileIndex]) : '';
  const isImage = currentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isVideo = currentUrl.match(/\.(mp4|webm|ogg)$/i);

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
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: 20 }}>
              <div style={{ flex: 1 }}>
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

          {/* Media Preview com Carrossel */}
          <div style={{ background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, padding: 40, position: 'relative' }}>
            {files.length > 1 && (
              <div style={{ position: 'absolute', top: 16, right: 16, background: '#1e293b', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 10 }}>
                {currentFileIndex + 1} / {files.length}
              </div>
            )}
            
            {files.length > 0 ? (
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* Botão anterior */}
                {files.length > 1 && (
                  <button 
                    onClick={() => setCurrentFileIndex(i => i > 0 ? i - 1 : files.length - 1)}
                    style={{ position: 'absolute', left: -20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  >
                    <ChevronLeft size={20} color="#0f172a" />
                  </button>
                )}

                {/* Conteúdo */}
                {isImage ? (
                  <img src={currentUrl} alt={approval.title} style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                ) : isVideo ? (
                  <video src={currentUrl} controls style={{ maxWidth: '100%', maxHeight: 600, borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                    <FileImage size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p>Preview não disponível para este formato.</p>
                    <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Baixar Arquivo Completo</a>
                  </div>
                )}

                {/* Botão próximo */}
                {files.length > 1 && (
                  <button 
                    onClick={() => setCurrentFileIndex(i => i < files.length - 1 ? i + 1 : 0)}
                    style={{ position: 'absolute', right: -20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  >
                    <ChevronRight size={20} color="#0f172a" />
                  </button>
                )}
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>Nenhum anexo encontrado.</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: 30, background: '#fff' }}>
            {successMsg ? (
               <div style={{ padding: 20, background: approval.status === 'APPROVED' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${approval.status === 'APPROVED' ? '#6ee7b7' : '#fca5a5'}`, borderRadius: 12, textAlign: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: approval.status === 'APPROVED' ? '#065f46' : '#991b1b' }}>{successMsg}</h3>
                <p style={{ marginTop: 6, color: approval.status === 'APPROVED' ? '#047857' : '#b91c1c' }}>A equipe já foi notificada!</p>
                {approval.status === 'REJECTED' && approval.rejectReason && (
                   <p style={{ marginTop: 12, paddingtop: 12, borderTop: '1px solid #fecaca', color: '#7f1d1d', fontSize: 13 }}>
                     <strong>Seu motivo:</strong> {approval.rejectReason}
                   </p>
                )}
              </div>
            ) : approval.status === 'PENDING' ? (
              <div>
                {!showRejectForm ? (
                  <>
                    <p style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 }}>
                      Por favor, analise o material acima. Se estiver de acordo, clique em Aprovar. Caso precise de ajustes, informe o motivo clicando em Recusar.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                      <button 
                        onClick={() => setShowRejectForm(true)}
                        disabled={isSubmitting}
                        style={{ 
                          flex: 1, maxWidth: 200, padding: '14px 24px', background: '#fff', border: '1px solid #ef4444', 
                          color: '#ef4444', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' 
                        }}
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
                        }}
                      >
                        {isSubmitting ? 'Enviando...' : <><ThumbsUp size={20} /> Aprovar Material</>}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s ease' }}>
                    <h4 style={{ fontSize: 18, color: '#0f172a', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle size={18} color="#ef4444" /> Motivo da Reprovação
                    </h4>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Por favor, informe detalhadamente por que o material está sendo alterado ou reprovado para que a equipe corrija.</p>
                    <textarea 
                       value={rejectReason}
                       onChange={e => setRejectReason(e.target.value)}
                       placeholder="Ex: A cor do card precisa ser mais viva. O botão de comprar precisa ser mais amigável..."
                       style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, fontFamily: 'inherit', marginBottom: 16, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                       <button onClick={() => setShowRejectForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: 'none', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                         Voltar
                       </button>
                       <button onClick={() => handleReply('REJECTED')} disabled={isSubmitting || !rejectReason.trim()} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: (isSubmitting || !rejectReason.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !rejectReason.trim()) ? 0.6 : 1 }}>
                         <ThumbsDown size={16} /> Confirmar Rejeição
                       </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 13 }}>
          &copy; {new Date().getFullYear()} Magister Tech - Inovação em TI e Marketing
        </div>
      </div>
    </div>
  );
}
