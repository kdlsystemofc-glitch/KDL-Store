'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Printer, ShieldCheck, Phone,
  XCircle, AlertTriangle, CheckCircle2, Info,
  Building2, User, Package, CalendarDays, Hash, QrCode
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  cnpj: string | null
  telefone: string | null
  whatsapp: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  email: string | null
}

export default function DocumentoGarantiaPage() {
  const params = useParams()
  const id = String(params?.id ?? '')
  const [loading, setLoading] = useState(true)
  const [garantia, setGarantia] = useState<Garantia | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [qrSrc, setQrSrc] = useState<string>('')

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
            .select('nome, cnpj, telefone, whatsapp, endereco, cidade, estado, email')
            .eq('id', gData.empresa_id)
            .single()
          if (empData) setEmpresa(empData as Empresa)
        }

        // Gera QR Code via API pública (sem dependência npm)
        const url = typeof window !== 'undefined' ? `${window.location.origin}/garantia/${id}` : ''
        setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}&color=1a2a1a&bgcolor=f0f7f0`)
      } catch (e) {
        console.error(e)
        setErro('Erro ao conectar ao banco de dados.')
      } finally {
        setLoading(false)
      }
    }
    carregarGarantia()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: 'var(--verde)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--verde)', fontSize: '0.78rem', letterSpacing: '0.08em', fontWeight: 700 }}>CARREGANDO CERTIFICADO_</p>
      </div>
    )
  }

  if (erro || !garantia) {
    return (
      <div style={{ padding: '2rem', maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="alerta alerta-perigo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={32} />
          <p style={{ fontWeight: 700 }}>{erro || 'Erro inesperado.'}</p>
        </div>
        <Link href="/garantias" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Voltar para Garantias
        </Link>
      </div>
    )
  }

  // ── Cálculos ──
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dtCompra = new Date(garantia.data_compra + 'T00:00:00')
  const dtVenc   = new Date(garantia.data_vencimento + 'T00:00:00')

  const totalDias      = Math.max(1, Math.round((dtVenc.getTime() - dtCompra.getTime()) / 86400000))
  const diasRestantes  = Math.round((dtVenc.getTime() - hoje.getTime()) / 86400000)
  const diasDecorridos = Math.max(0, totalDias - Math.max(0, diasRestantes))
  const pctProgresso   = Math.min(100, Math.round((diasDecorridos / totalDias) * 100))

  const vencida     = diasRestantes < 0 || garantia.status === 'vencida'
  const emDevolucao = garantia.status === 'em devolução'
  const ativa       = !vencida && !emDevolucao

  const authCode = `GAR-${garantia.id.substring(0, 8).toUpperCase()}-${garantia.id.substring(9, 13).toUpperCase()}`

  const statusCor   = emDevolucao ? '#d97706' : vencida ? '#dc2626' : '#16a34a'
  const statusLabel = emDevolucao ? 'EM ANÁLISE' : vencida ? 'EXPIRADA' : 'ATIVA'
  const statusIcon  = emDevolucao ? <AlertTriangle size={13} /> : vencida ? <XCircle size={13} /> : <CheckCircle2 size={13} />

  // ── Linha de rodapé de endereço ──
  const enderecoCompleto = [
    empresa?.endereco,
    empresa?.cidade,
    empresa?.estado,
  ].filter(Boolean).join(', ')

  const contatoLinha = [
    empresa?.whatsapp && `WhatsApp: ${empresa.whatsapp}`,
    empresa?.telefone && empresa.telefone !== empresa?.whatsapp && `Tel: ${empresa.telefone}`,
    empresa?.email,
  ].filter(Boolean).join('  ·  ')

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* ── Barra de ações (não imprime) ── */}
      <div className="pg-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/garantias" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--verde)' }} />
              Certificado de Garantia
            </h1>
            <p className="pg-sub">Código: {authCode}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(garantia.cliente_tel || empresa?.whatsapp) && (
            <a
              href={`https://wa.me/55${(garantia.cliente_tel || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá ${garantia.cliente_nome || 'cliente'}! Segue seu certificado de garantia para o produto *${garantia.produto_nome}*.\n\nCódigo: *${authCode}*\nValidade: *${dtVenc.toLocaleDateString('pt-BR')}*\nVerifique online: ${typeof window !== 'undefined' ? `${window.location.origin}/garantia/${id}` : ''}`
              )}`}
              target="_blank" rel="noopener noreferrer"
              className="btn"
              style={{ background: '#25D366', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              <Phone size={14} /> Enviar no WhatsApp
            </a>
          )}
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {/* ── Alertas rápidos (não imprime) ── */}
      {emDevolucao && (
        <div className="alerta alerta-aviso no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>Este produto está em processo de <strong>devolução / troca sob garantia</strong>.</span>
        </div>
      )}
      {vencida && !emDevolucao && (
        <div className="alerta alerta-perigo no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={18} />
          <span>Atenção: Este certificado está <strong>vencido</strong> desde {dtVenc.toLocaleDateString('pt-BR')}.</span>
        </div>
      )}
      {ativa && diasRestantes <= 30 && (
        <div className="alerta alerta-aviso no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>Atenção: Esta garantia expira em <strong>{diasRestantes} dias</strong>.</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          CERTIFICADO — design premium para impressão
      ══════════════════════════════════════════════ */}
      <div id="certificado" style={{
        maxWidth: '720px',
        margin: '0 auto',
        background: '#fff',
        color: '#1a1a1a',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        position: 'relative',
      }}>

        {/* ── Faixa superior verde ── */}
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%)',
          padding: '1.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Padrão geométrico de fundo */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            {/* Nome da empresa + título */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <ShieldCheck size={28} style={{ color: '#86efac' }} />
                <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Certificado de Garantia
                </span>
              </div>
              <p style={{ color: '#bbf7d0', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                {empresa?.nome || 'Estabelecimento Comercial'}
              </p>
              {empresa?.cnpj && (
                <p style={{ color: '#86efac', fontSize: '0.75rem', margin: '2px 0 0 0', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  CNPJ: {empresa.cnpj}
                </p>
              )}
            </div>

            {/* Badge de status */}
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              border: `1px solid rgba(255,255,255,0.3)`,
              borderRadius: '999px',
              padding: '0.35rem 0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              backdropFilter: 'blur(4px)',
              flexShrink: 0,
            }}>
              <span style={{ color: statusCor === '#16a34a' ? '#86efac' : statusCor === '#dc2626' ? '#fca5a5' : '#fde68a', display: 'flex' }}>
                {statusIcon}
              </span>
              <span style={{
                color: statusCor === '#16a34a' ? '#86efac' : statusCor === '#dc2626' ? '#fca5a5' : '#fde68a',
                fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em'
              }}>
                GARANTIA {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Faixa de autenticidade ── */}
        <div style={{
          background: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0',
          padding: '0.625rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Hash size={13} style={{ color: '#15803d' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Código de Autenticidade:
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.82rem', color: '#14532d', letterSpacing: '0.1em' }}>
              {authCode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: ativa ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#15803d', letterSpacing: '0.05em' }}>DOCUMENTO VERIFICADO</span>
          </div>
        </div>

        {/* ── Corpo do certificado ── */}
        <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Grid: produto + cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Produto */}
            <div style={{
              border: '1px solid #d1fae5',
              borderRadius: '8px',
              padding: '1rem',
              background: '#f0fdf4',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                <Package size={14} style={{ color: '#15803d' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Produto / Equipamento
                </span>
              </div>
              <p style={{ fontWeight: 900, fontSize: '1rem', color: '#14532d', margin: 0, lineHeight: 1.3 }}>
                {garantia.produto_nome}
              </p>
              {garantia.num_serie && (
                <p style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '4px', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  Nº Série: <strong>{garantia.num_serie}</strong>
                </p>
              )}
            </div>

            {/* Beneficiário */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              background: '#f9fafb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                <User size={14} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Beneficiário / Titular
                </span>
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', margin: 0 }}>
                {garantia.cliente_nome || 'Consumidor Final'}
              </p>
              {garantia.cliente_tel && (
                <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
                  {garantia.cliente_tel}
                </p>
              )}
            </div>
          </div>

          {/* Vigência */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            background: '#f9fafb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
              <CalendarDays size={14} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Período de Vigência
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center', marginBottom: '0.875rem' }}>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Data da Compra</p>
                <p style={{ fontWeight: 800, fontSize: '0.88rem', color: '#374151', margin: '3px 0 0 0' }}>
                  {dtCompra.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Prazo Total</p>
                <p style={{ fontWeight: 900, fontSize: '1rem', color: '#111827', margin: '3px 0 0 0' }}>
                  {totalDias} dias
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Válido Até</p>
                <p style={{ fontWeight: 800, fontSize: '0.88rem', color: statusCor, margin: '3px 0 0 0' }}>
                  {dtVenc.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div>
              <div style={{ height: '7px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pctProgresso}%`,
                  background: emDevolucao ? '#f59e0b' : vencida ? '#dc2626' : pctProgresso > 70 ? '#f59e0b' : '#16a34a',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9ca3af', marginTop: '4px' }}>
                <span>{pctProgresso}% do prazo decorrido</span>
                <span style={{ fontWeight: 700, color: statusCor }}>
                  {emDevolucao ? 'Sob Análise'
                    : vencida ? 'Expirada'
                    : `${diasRestantes} ${diasRestantes === 1 ? 'dia restante' : 'dias restantes'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Termos da garantia específicos do produto */}
          {garantia.texto_garantia && (
            <div style={{
              border: '1px solid #bfdbfe',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '0 8px 8px 0',
              padding: '0.875rem 1rem',
              background: '#eff6ff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.35rem' }}>
                <Info size={13} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Observações do Fabricante / Vendedor
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#1e40af', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{garantia.texto_garantia}"
              </p>
            </div>
          )}

          {/* ── Cláusulas legais ── */}
          <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
              Regulamento e Cláusulas de Cobertura
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.72rem', color: '#374151', lineHeight: 1.55 }}>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <span style={{ flexShrink: 0, fontWeight: 800, color: '#15803d', fontSize: '0.65rem', paddingTop: '2px' }}>✔</span>
                <div>
                  <strong style={{ color: '#111827' }}>O QUE ESTÁ COBERTO:</strong>{' '}
                  Defeitos de fabricação comprovados em componentes internos e de hardware, sob condições normais de
                  uso. Inclui peças de reposição originais e mão de obra técnica autorizada para restabelecimento
                  da plena funcionalidade do equipamento.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <span style={{ flexShrink: 0, fontWeight: 800, color: '#dc2626', fontSize: '0.65rem', paddingTop: '2px' }}>✘</span>
                <div>
                  <strong style={{ color: '#111827' }}>EXCLUSÕES DE COBERTURA:</strong>{' '}
                  Mau uso, quedas e impactos físicos; infiltração de líquidos; oscilações de energia elétrica ou
                  carregadores incompatíveis; violação de lacres ou abertura por técnicos não autorizados;
                  danos estéticos sem prejuízo de funcionamento; desgaste natural por uso.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <span style={{ flexShrink: 0, fontWeight: 800, color: '#2563eb', fontSize: '0.65rem', paddingTop: '2px' }}>➜</span>
                <div>
                  <strong style={{ color: '#111827' }}>COMO ACIONAR:</strong>{' '}
                  Apresentar este documento (digital ou impresso) junto ao equipamento em nossa loja.
                  O prazo de reparo é de até <strong>30 dias</strong> a partir do recebimento, conforme{' '}
                  <strong>CDC Art. 18</strong>. Após análise, informaremos se o defeito está coberto.
                </div>
              </div>

              {/* Texto legal CDC */}
              <div style={{
                marginTop: '0.25rem',
                padding: '0.625rem 0.75rem',
                background: '#fafafa',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}>
                <p style={{ fontSize: '0.64rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: '#374151' }}>Base Legal — Código de Defesa do Consumidor (Lei 8.078/1990):</strong>{' '}
                  Produtos não duráveis têm garantia legal de <strong>30 dias</strong> (Art. 26, I); produtos duráveis,{' '}
                  <strong>90 dias</strong> (Art. 26, II), contados a partir da entrega efetiva — independentemente da garantia
                  contratual concedida neste certificado. Os prazos desta garantia são cumulativos à garantia legal.
                  Em caso de defeito, o consumidor pode exigir substituição do produto, restituição do valor pago ou
                  abatimento proporcional do preço (CDC Art. 18 §1°).
                </p>
              </div>
            </div>
          </div>

          {/* ── Rodapé: QR Code + assinaturas ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '1.5rem',
            alignItems: 'flex-end',
            borderTop: '1px dashed #d1d5db',
            paddingTop: '1.25rem',
          }}>
            {/* QR Code */}
            <div style={{ textAlign: 'center' }}>
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt="QR Code de verificação da garantia"
                  width={96}
                  height={96}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '6px', display: 'block' }}
                />
              ) : (
                <div style={{ width: 96, height: 96, border: '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={48} style={{ color: '#d1d5db' }} />
                </div>
              )}
              <p style={{ fontSize: '0.55rem', color: '#9ca3af', margin: '4px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verificar online
              </p>
            </div>

            {/* Assinaturas + info da empresa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '32px', borderBottom: '1px solid #d1d5db', marginBottom: '4px' }} />
                  <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: 0, fontWeight: 600 }}>Responsável Comercial</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '32px', borderBottom: '1px solid #d1d5db', marginBottom: '4px' }} />
                  <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: 0, fontWeight: 600 }}>Assinatura do Cliente</p>
                </div>
              </div>

              {/* Info da loja */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                  <Building2 size={11} style={{ color: '#9ca3af', marginTop: '1px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#374151', margin: 0 }}>
                      {empresa?.nome || 'Estabelecimento Comercial'}
                      {empresa?.cnpj && <span style={{ fontWeight: 400, color: '#6b7280' }}> — CNPJ: {empresa.cnpj}</span>}
                    </p>
                    {enderecoCompleto && (
                      <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '1px 0 0 0' }}>{enderecoCompleto}</p>
                    )}
                    {contatoLinha && (
                      <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: '1px 0 0 0' }}>{contatoLinha}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* ── Faixa inferior ── */}
        <div style={{
          background: '#f0fdf4',
          borderTop: '1px solid #bbf7d0',
          padding: '0.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <p style={{ fontSize: '0.6rem', color: '#6b7280', margin: 0 }}>
            Emitido digitalmente pelo sistema KDL Store · Documento com validade legal conforme CDC
          </p>
          <p style={{ fontSize: '0.6rem', color: '#9ca3af', margin: 0, fontFamily: 'monospace' }}>
            {authCode}
          </p>
        </div>
      </div>

      {/* ── Estilos de impressão ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          #certificado {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          @page { margin: 1cm; size: A4; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
