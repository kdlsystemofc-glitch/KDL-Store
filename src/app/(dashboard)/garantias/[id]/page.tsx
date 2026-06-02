'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Printer, ShieldCheck, Calendar, FileText, CheckCircle2, AlertTriangle, XCircle, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type Garantia = {
  id: string
  produto_nome: string
  num_serie: string | null
  cliente_nome: string | null
  cliente_tel: string | null
  data_compra: string
  data_vencimento: string
  status: string
  texto_garantia: string | null
  venda_id: string | null
}

type Empresa = {
  nome: string
  telefone: string | null
  whatsapp: string | null
  endereco: string | null
}

export default function DocumentoGarantiaPage() {
  const params = useParams()
  const id = String(params?.id ?? '')
  const [loading, setLoading] = useState(true)
  const [garantia, setGarantia] = useState<Garantia | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function carregarGarantia() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: gData, error: gError } = await supabase
          .from('garantias')
          .select('*')
          .eq('id', id)
          .single()
        
        if (gError || !gData) {
          setErro('Garantia não encontrada no sistema.')
          setLoading(false)
          return
        }

        setGarantia(gData as Garantia)

        if (gData.empresa_id) {
          const { data: empData } = await supabase
            .from('empresas')
            .select('nome, telefone, whatsapp, endereco')
            .eq('id', gData.empresa_id)
            .single()
          if (empData) setEmpresa(empData as Empresa)
        }
      } catch (e) {
        console.error(e)
        setErro('Erro ao se conectar ao banco de dados.')
      } finally {
        setLoading(false)
      }
    }
    carregarGarantia()
  }, [id])

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', padding:'5rem', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
        <Loader2 size={36} className="blink" style={{ color:'var(--verde)', animation:'spin 1s linear infinite' }} />
        <p style={{ color:'var(--verde)', fontSize:'0.78rem', letterSpacing:'0.08em', fontWeight:700 }}>CARREGANDO CERTIFICADO SEGURO_</p>
      </div>
    )
  }

  if (erro || !garantia) {
    return (
      <div style={{ padding: '2rem', maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="alerta alerta-perigo" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <XCircle size={32} />
          <p style={{ fontWeight: 700 }}>{erro || 'Erro inesperado.'}</p>
        </div>
        <Link href="/garantias" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Voltar para Garantias
        </Link>
      </div>
    )
  }

  // Cálculos de datas e vigência
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dtCompra = new Date(garantia.data_compra + 'T12:00:00')
  const dtVenc = new Date(garantia.data_vencimento + 'T12:00:00')
  
  // Total de dias de prazo
  const totalDias = Math.max(1, Math.ceil((dtVenc.getTime() - dtCompra.getTime()) / (1000 * 60 * 60 * 24)))
  // Dias restantes ou vencido
  const diasRestantes = Math.ceil((dtVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  const vencida = diasRestantes < 0 || garantia.status === 'vencida'
  const emDevolucao = garantia.status === 'em devolução'

  // Progresso (0 a 100)
  const diasDecorridos = Math.max(0, totalDias - Math.max(0, diasRestantes))
  const pctProgresso = Math.min(100, Math.round((diasDecorridos / totalDias) * 100))

  // Código de autenticidade (Visual Profissional)
  const authCode = `KDL-${garantia.id.substring(0, 8).toUpperCase()}-${garantia.id.substring(9, 13).toUpperCase()}`

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>

      {/* Ações Superiores */}
      <div className="pg-header no-print">
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
          <Link href="/garantias" className="btn btn-secondary" style={{ padding:'0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
              🛡️ Certificado de Garantia
            </h1>
            <p className="pg-sub">Código Digital: {authCode}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {garantia.cliente_tel && (
            <a href={`https://wa.me/55${garantia.cliente_tel.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${garantia.cliente_nome}! Segue seu certificado digital de garantia seguro para o produto *${garantia.produto_nome}*.\n\nCódigo do Certificado: *${authCode}*\nValidade até: *${dtVenc.toLocaleDateString('pt-BR')}*\nLink para verificação oficial: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn" style={{ background:'#25D366', color:'#fff', border:'none', fontWeight:700, display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', padding:'0.4rem 0.75rem' }}>
              <Phone size={14} /> Enviar no WhatsApp
            </a>
          )}
          <button className="btn btn-primary" onClick={() => window.print()} style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', padding:'0.4rem 0.75rem' }}>
            <Printer size={14} /> Imprimir Certificado
          </button>
        </div>
      </div>

      {/* Alertas de status rápidas */}
      {emDevolucao ? (
        <div className="alerta alerta-aviso no-print" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <AlertTriangle size={18} />
          <span>Este produto encontra-se em processo de <strong>devolução / troca sob garantia</strong>.</span>
        </div>
      ) : vencida ? (
        <div className="alerta alerta-perigo no-print" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <XCircle size={18} />
          <span>Atenção: Este termo de garantia encontra-se <strong>vencido</strong> desde {dtVenc.toLocaleDateString('pt-BR')}.</span>
        </div>
      ) : diasRestantes <= 30 ? (
        <div className="alerta alerta-aviso no-print" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <AlertTriangle size={18} />
          <span>Atenção: Esta garantia está prestes a expirar. Faltam apenas <strong>{diasRestantes} dias</strong> de vigência.</span>
        </div>
      ) : null}

      {/* CERTIFICADO PROFISSIONAL */}
      <div id="certificado" className="card" style={{
        maxWidth:'680px',
        margin: '0 auto',
        padding: '2rem',
        border: '2px solid var(--borda-forte)',
        background: 'var(--surface)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Selo holográfico/Marca d'água decorativa de fundo */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          opacity: 0.03,
          transform: 'rotate(-15deg)',
          pointerEvents: 'none',
          color: 'var(--texto)'
        }}>
          <ShieldCheck size={320} />
        </div>

        {/* Borda decorativa interna */}
        <div style={{
          position: 'absolute',
          inset: '6px',
          border: '1px solid rgba(26,122,60,0.15)',
          borderRadius: '6px',
          pointerEvents: 'none'
        }} />

        {/* Cabeçalho */}
        <div style={{ textAlign:'center', borderBottom:'2px solid rgba(26,122,60,0.25)', paddingBottom:'1.25rem', marginBottom:'1.5rem', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.625rem', marginBottom:'0.35rem' }}>
            <ShieldCheck size={32} style={{ color:'var(--verde)' }} />
            <span style={{ fontWeight:950, fontSize:'1.4rem', color:'var(--verde)', letterSpacing:'0.06em', textTransform:'uppercase' }}>CERTIFICADO DE GARANTIA</span>
          </div>
          <p style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--texto)', textTransform:'uppercase', margin: 0 }}>
            {empresa?.nome || 'KDL ASSISTÊNCIA E COMÉRCIO'}
          </p>
          <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)', marginTop:'3px', margin: 0 }}>
            {empresa?.endereco || 'Endereço da Assistência'}
            {empresa?.telefone && ` · Contato: ${empresa.telefone}`}
          </p>
        </div>

        {/* Seção Autenticidade */}
        <div style={{
          background: 'var(--surface-alt)',
          border: '1px solid var(--borda)',
          borderRadius: '4px',
          padding: '0.625rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--texto-desab)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Registro de Autenticidade Digital</p>
            <p style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--texto)', margin: '2px 0 0 0' }}>{authCode}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(26,122,60,0.1)', border: '1px solid var(--verde)', borderRadius: '999px', padding: '0.18rem 0.625rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--verde)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--verde)' }}>VERIFICADO OFICIAL</span>
          </div>
        </div>

        {/* Grid de Especificações */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'1.25rem' }}>
          {/* Box Produto */}
          <div style={{ border:'1px solid var(--borda)', borderRadius:'4px', padding:'0.75rem 1rem', background:'var(--verde-claro)' }}>
            <p style={{ fontSize:'0.62rem', fontWeight:800, color:'var(--texto-sec)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px', margin: 0 }}>Especificação do Equipamento</p>
            <p style={{ fontWeight:900, fontSize:'1.05rem', color:'var(--verde-esc)', margin: 0 }}>{garantia.produto_nome}</p>
            <p style={{ fontSize:'0.78rem', color:'var(--texto-sec)', marginTop:'3px', margin: 0 }}>
              Série: <strong style={{ fontFamily:'monospace', fontWeight:700 }}>{garantia.num_serie || 'NÃO APLICÁVEL'}</strong>
            </p>
          </div>

          {/* Box Proprietário */}
          <div style={{ border:'1px solid var(--borda)', borderRadius:'4px', padding:'0.75rem 1rem', background:'var(--surface-alt)' }}>
            <p style={{ fontSize:'0.62rem', fontWeight:800, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px', margin: 0 }}>Beneficiário / Proprietário</p>
            <p style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--texto)', margin: 0 }}>{garantia.cliente_nome || 'Consumidor Final'}</p>
            <p style={{ fontSize:'0.78rem', color:'var(--texto-sec)', marginTop:'3px', margin: 0 }}>
              Tel: {garantia.cliente_tel || 'NÃO INFORMADO'}
            </p>
          </div>
        </div>

        {/* Seção Vigência com Gráfico de Progresso */}
        <div style={{ border:'1px solid var(--borda)', borderRadius:'4px', padding:'1rem', marginBottom:'1.25rem', background:'var(--surface-alt)' }}>
          <p style={{ fontSize:'0.62rem', fontWeight:800, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'0.75rem', margin: 0 }}>Período de Vigência e Cobertura</p>
          
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', textAlign:'center', marginBottom:'1rem' }}>
            <div>
              <p style={{ fontSize:'0.62rem', color:'var(--texto-desab)', margin: 0 }}>DATA DA COMPRA</p>
              <p style={{ fontWeight:700, fontSize:'0.85rem', marginTop:'2px', margin: 0 }}>{dtCompra.toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p style={{ fontSize:'0.62rem', color:'var(--texto-desab)', margin: 0 }}>VALIDADE ATÉ</p>
              <p style={{ fontWeight:800, fontSize:'0.85rem', color: vencida ? 'var(--vermelho)' : 'var(--verde)', marginTop:'2px', margin: 0 }}>
                {dtVenc.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p style={{ fontSize:'0.62rem', color:'var(--texto-desab)', margin: 0 }}>PRAZO TOTAL</p>
              <p style={{ fontWeight:700, fontSize:'0.85rem', marginTop:'2px', margin: 0 }}>{totalDias} dias</p>
            </div>
          </div>

          {/* Barra de Progresso Real */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${pctProgresso}%`,
                background: emDevolucao ? 'var(--amarelo)' : vencida ? 'var(--vermelho)' : 'var(--verde)',
                transition: 'width 0.5s ease-in-out',
                borderRadius: '999px'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--texto-desab)' }}>
              <span>{pctProgresso}% decorrido</span>
              <span>
                {emDevolucao ? 'Sob Devolução' : vencida ? 'Garantia Expirada' : `${diasRestantes} dias restantes`}
              </span>
            </div>
          </div>
        </div>

        {/* Cláusulas e Termos Estruturados */}
        <div style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontSize:'0.65rem', fontWeight:800, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.625rem', borderBottom:'1px solid var(--borda)', paddingBottom:'2px', margin: 0 }}>
            Regulamento Geral e Cláusulas Contratuais
          </p>
          
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.74rem', color:'var(--texto-sec)', lineHeight:'1.5' }}>
            <div>
              <p style={{ fontWeight:800, color:'var(--verde-esc)', margin: '0 0 2px 0', fontSize:'0.76rem' }}>🛡️ 1. O QUE ESTÁ COBERTO:</p>
              <p style={{ margin: 0 }}>
                Esta garantia cobre exclusivamente defeitos de fabricação em componentes internos e hardware do equipamento sob condições normais de uso. 
                Estão inclusos o custo de peças originais de reposição e a respectiva mão de obra técnica para restabelecimento da plena funcionalidade.
              </p>
            </div>
            
            <div>
              <p style={{ fontWeight:800, color:'var(--vermelho)', margin: '0 0 2px 0', fontSize:'0.76rem' }}>❌ 2. O QUE NÃO ESTÁ COBERTO (EXCLUSÕES):</p>
              <p style={{ margin: 0 }}>
                Esta cobertura será imediatamente anulada em casos de: (a) danos causados por mau uso, quedas accidentais, impactos físicos ou pressões excessivas; 
                (b) infiltração de líquidos de qualquer espécie; (c) danos decorrentes de oscilações de energia elétrica ou uso de carregadores incompatíveis; 
                (d) violação dos lacres de segurança ou abertura do equipamento por técnicos não credenciados pela loja.
              </p>
            </div>

            <div>
              <p style={{ fontWeight:800, color:'var(--texto)', margin: '0 0 2px 0', fontSize:'0.76rem' }}>📞 3. PROCEDIMENTO PARA ACIONAMENTO:</p>
              <p style={{ margin: 0 }}>
                Para acionar a assistência técnica autorizada sob este termo, o beneficiário deverá apresentar este documento digital ou impresso 
                junto ao equipamento em nosso estabelecimento físico. O prazo de reparo é de até 30 dias contados a partir da data de recebimento do equipamento.
              </p>
            </div>
            
            {garantia.texto_garantia && (
              <div style={{ marginTop: '0.25rem', padding: '0.625rem', background: 'var(--surface-alt)', borderLeft: '3px solid var(--verde)', borderRadius: '2px' }}>
                <p style={{ fontWeight:800, color:'var(--texto)', margin: '0 0 2px 0', fontSize:'0.72rem', textTransform:'uppercase' }}>📋 Observações Adicionais do Vendedor:</p>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.72rem' }}>&quot;{garantia.texto_garantia}&quot;</p>
              </div>
            )}
          </div>
        </div>

        {/* Assinatura e Rodapé */}
        <div style={{ borderTop:'1px dashed var(--borda-forte)', paddingTop:'1rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom: '1rem' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ height:'35px', borderBottom:'1px solid var(--borda)', marginBottom:'4px' }} />
              <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)', margin: 0 }}>Emitido por Representante Comercial</p>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ height:'35px', borderBottom:'1px solid var(--borda)', marginBottom:'4px' }} />
              <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)', margin: 0 }}>Assinatura e Acordo do Cliente</p>
            </div>
          </div>
          <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)', textAlign:'center', margin: 0 }}>
            Documento emitido digitalmente. As assinaturas atestam o pleno conhecimento e acordo das cláusulas descritas neste termo.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          #certificado { 
            box-shadow: none !important; 
            border: 2px solid #ccc !important; 
            max-width: 100% !important; 
            padding: 1rem !important;
            margin: 0 !important;
          }
          /* Remove custom variables colors for standard printer-friendly black */
          #certificado, #certificado p, #certificado span, #certificado strong {
            color: #000 !important;
          }
          #certificado .alerta, #certificado button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
