'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Loader2, MessageCircle, Wrench, Shield, CheckCircle, Clock } from 'lucide-react'

type OS = {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_tel: string | null;
  equipamento: string;
  defeito_relatado: string;
  status: string;
  orcamento: number | null;
  valor_servico: number;
  valor_pecas: number;
  tecnico: string | null;
  criado_em: string;
  previsao: string | null;
  problema: string | null;
  laudo: string | null;
  historico: Array<{ data: string; usuario: string; status: string; status_label: string }> | null;
}

type Empresa = {
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  aguardando:   'Aguardando Orçamento',
  aprovado:     'Orçamento Aprovado',
  em_servico:   'Em Serviço',
  concluido:    'Pronto / Concluído',
  entregue:     'Entregue / Retirado',
  cancelado:    'Cancelado',
}

const STAGES = ['aguardando', 'aprovado', 'em_servico', 'concluido', 'entregue']
const STAGE_LABELS = ['Aguardando', 'Aprovado', 'Em Serviço', 'Pronto', 'Entregue']

export default function PublicAcompanharOS({ params: propsParams }: { params: { id: string } }) {
  const params = useParams()
  const [os, setOs] = useState<OS | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) carregar()
  }, [params.id])

  async function carregar() {
    setLoading(true)
    setErro(null)
    const supabase = createClient()

    try {
      // 1. Busca a Ordem de Serviço pelo UUID público
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('id', params.id)
        .single()

      if (osError || !osData) {
        setErro('Ordem de serviço não encontrada ou link inválido.')
        setLoading(false)
        return
      }

      const osItem = osData as OS
      setOs(osItem)

      // 2. Busca dados da empresa associada à OS
      const { data: empData } = await supabase
        .from('empresas')
        .select('nome,telefone,whatsapp,endereco,cidade,estado')
        .eq('id', osData.empresa_id)
        .single()

      if (empData) {
        setEmpresa(empData as Empresa)
      }
    } catch (e: any) {
      setErro('Erro ao carregar dados: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f2f2f2', gap:'0.75rem', color:'var(--texto-sec)' }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color:'var(--verde)' }}/>
      <span style={{ fontSize:'0.9rem', fontWeight:600 }}>Consultando Ordem de Serviço...</span>
    </div>
  )

  if (erro || !os) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f2f2f2', padding:'1rem' }}>
      <div className="card" style={{ maxWidth:'450px', width:'100%', borderTop:'4px solid var(--vermelho)', textAlign:'center', padding:'2rem' }}>
        <h2 style={{ color:'var(--vermelho)', fontSize:'1.25rem', marginBottom:'0.5rem' }}>Atenção</h2>
        <p style={{ color:'var(--texto-sec)', fontSize:'0.9rem', marginBottom:'1.5rem' }}>{erro || 'Não foi possível carregar a OS.'}</p>
        <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>Verifique o link enviado pela loja ou entre em contato direto com a assistência técnica.</p>
      </div>
    </div>
  )

  const currentStageIndex = STAGES.indexOf(os.status)

  // WhatsApp link do lojista
  const whatsappUrl = empresa?.whatsapp
    ? `https://wa.me/55${empresa.whatsapp.replace(/\D/g, '')}?text=Olá! Gostaria de falar sobre a OS #${String(os.numero).padStart(4,'0')}`
    : empresa?.telefone
      ? `tel:${empresa.telefone.replace(/\D/g, '')}`
      : null

  return (
    <div style={{ background:'#f2f2f2', minHeight:'100vh', padding:'1.5rem 1rem' }}>
      <div style={{ maxWidth:'640px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'1rem' }}>
        
        {/* Card do Cabeçalho da Loja */}
        <div className="card" style={{ padding:'1.25rem', background:'#fff', borderTop:'4px solid var(--verde)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.5rem' }}>
            <div>
              {empresa ? (
                <>
                  <h1 style={{ fontWeight:900, fontSize:'1.25rem', textTransform:'uppercase', margin:0 }}>{empresa.nome}</h1>
                  <p style={{ color:'var(--texto-sec)', fontSize:'0.75rem', marginTop:'0.2rem' }}>
                    {empresa.endereco && `${empresa.endereco} · `}
                    {empresa.cidade && `${empresa.cidade}-${empresa.estado || ''}`}
                  </p>
                </>
              ) : (
                <h1 style={{ fontWeight:900, fontSize:'1.25rem', textTransform:'uppercase', margin:0 }}>Assistência Técnica</h1>
              )}
              <h2 style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--texto-sec)', marginTop:'0.25rem' }}>ACOMPANHAMENTO DE SERVIÇO EM TEMPO REAL</h2>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'1.25rem', fontWeight:900, fontFamily:'JetBrains Mono, monospace' }}>OS #{String(os.numero).padStart(4,'0')}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--texto-desab)' }}>Abertura: {new Date(os.criado_em).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
        </div>

        {/* Card de Status da OS (Stepper) */}
        <div className="card" style={{ padding:'1.5rem 1rem', background:'#fff' }}>
          <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Status Atual do Aparelho</p>
          
          {os.status !== 'cancelado' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {STAGES.map((stage, idx) => {
                const isCompleted = currentStageIndex >= idx
                const isActive = os.status === stage
                
                const color = isActive ? 'var(--verde)' : isCompleted ? 'var(--texto)' : 'var(--texto-desab)'
                const circleBg = isActive ? 'var(--verde-claro)' : isCompleted ? 'var(--verde)' : 'var(--surface-alt)'
                const circleBorder = isCompleted ? 'var(--verde)' : 'var(--borda)'
                
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: idx < STAGES.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '65px', position: 'relative' }}>
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: circleBg,
                        border: `2px solid ${circleBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: isCompleted && !isActive ? '#fff' : color
                      }}>
                        {isCompleted && !isActive ? '✔' : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: isActive || (isCompleted && !isActive) ? 700 : 500, color: color }}>
                        {STAGE_LABELS[idx]}
                      </span>
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '2px',
                        background: currentStageIndex > idx ? 'var(--verde)' : 'var(--borda)',
                        margin: '0 0.25rem',
                        alignSelf: 'center',
                        marginTop: '-10px'
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ background:'var(--vermelho-claro)', border:'1px solid #f1a99e', borderLeft:'3px solid var(--vermelho)', color:'var(--vermelho)', padding:'0.75rem', borderRadius:'var(--radius-sm)', fontSize:'0.82rem', fontWeight:600 }}>
              🛑 Ordem de serviço cancelada. Para mais informações, consulte a loja.
            </div>
          )}
        </div>

        {/* Detalhes do Equipamento e Defeito */}
        <div className="card" style={{ padding:'1.25rem', background:'#fff', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.2rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Aparelho / Equipamento</p>
            <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--texto)' }}>{os.equipamento}</p>
          </div>

          <div>
            <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.2rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Defeito Relatado pelo Cliente</p>
            <p style={{ fontSize:'0.85rem', color:'var(--texto-sec)', background:'var(--surface-alt)', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--borda)' }}>
              {os.defeito_relatado}
            </p>
          </div>

          {os.problema && (
            <div>
              <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.2rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Diagnóstico Técnico</p>
              <p style={{ fontSize:'0.85rem', color:'var(--texto)', background:'var(--surface-alt)', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--amarelo)' }}>
                {os.problema}
              </p>
            </div>
          )}

          {os.laudo && (
            <div>
              <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.2rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Serviço Executado / Laudo</p>
              <p style={{ fontSize:'0.85rem', color:'var(--texto)', background:'var(--verde-claro)', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--verde)', fontStyle:'italic' }}>
                {os.laudo}
              </p>
            </div>
          )}
        </div>

        {/* Orçamento e Previsão */}
        <div className="card" style={{ padding:'1.25rem', background:'#fff' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Previsão de Entrega</p>
              <p style={{ fontWeight:700, fontSize:'0.9rem' }}>
                {os.previsao ? new Date(os.previsao+'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}
              </p>
            </div>
            <div>
              <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Valor total do serviço</p>
              <p className="txt-mono txt-verde" style={{ fontWeight:800, fontSize:'1.1rem' }}>
                {os.orcamento ? formatCurrency(os.orcamento) : formatCurrency(os.valor_servico + os.valor_pecas)}
              </p>
              {os.status === 'aguardando' && (
                <span style={{ fontSize:'0.65rem', color:'var(--amarelo)', fontWeight:700, textTransform:'uppercase' }}>⏳ Aguardando Aprovação</span>
              )}
            </div>
          </div>
        </div>

        {/* Histórico / Timeline de Eventos */}
        {os.historico && os.historico.length > 0 && (
          <div className="card" style={{ padding:'1.25rem', background:'#fff' }}>
            <p style={{ fontWeight:800, fontSize:'0.72rem', color:'var(--texto-sec)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Histórico de Acompanhamento</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', position:'relative', paddingLeft:'0.75rem', borderLeft:'1px solid var(--borda)' }}>
              {os.historico.map((h, idx) => (
                <div key={idx} style={{ position:'relative' }}>
                  {/* Dot */}
                  <span style={{
                    position:'absolute',
                    left:'-15.5px',
                    top:'4px',
                    width:'7px',
                    height:'7px',
                    borderRadius:'50%',
                    background: idx === 0 ? 'var(--verde)' : 'var(--borda-forte)'
                  }} />
                  <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>
                    {new Date(h.data).toLocaleString('pt-BR')}
                  </p>
                  <p style={{ fontSize:'0.82rem', fontWeight: idx === 0 ? 700 : 500, color:'var(--texto)', marginTop:'0.05rem' }}>
                    {h.status_label || h.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Contato WhatsApp */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              padding:'0.75rem 1rem',
              fontSize:'0.9rem',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'0.5rem',
              background:'#25D366',
              borderColor:'#25D366',
              color:'#fff',
              boxShadow:'0 2px 4px rgba(37,211,102,0.2)'
            }}
          >
            <MessageCircle size={18} /> ENTRAR EM CONTATO COM A ASSISTÊNCIA
          </a>
        )}

        <div style={{ textAlign:'center', marginTop:'1rem', fontSize:'0.7rem', color:'var(--texto-desab)' }}>
          Powered by KDL Store © 2026
        </div>

      </div>
    </div>
  )
}
