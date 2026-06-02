'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ArrowLeft, Printer, MessageCircle, CheckCircle, Edit, X, Share2, Copy } from 'lucide-react'

type OS = {
  id: string;
  numero: number;
  cliente_id: string | null;
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
  observacoes: string | null;
  venda_id: string | null;
  historico: Array<{ data: string; usuario: string; status: string; status_label: string }> | null;
}

type Empresa = {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  cpf: string | null;
}

type Profile = {
  id: string;
  nome: string;
  papel: string;
}

const STATUS_LABEL: Record<string, string> = {
  aguardando:   '⏳ Aguardando Orçamento',
  aprovado:     '✅ Orçamento Aprovado',
  em_servico:   '🔧 Em Serviço',
  concluido:    '✔ Pronto / Concluído',
  entregue:     '📦 Entregue / Retirado',
  cancelado:    '✕ Cancelado',
}

const STATUS_CLS: Record<string, string> = {
  aguardando: 'tag-cinza',
  aprovado:   'tag-amarelo',
  em_servico: 'tag-azul',
  concluido:  'tag-verde',
  entregue:   'tag-verde',
  cancelado:  'tag-vermelho',
}

const STAGES = ['aguardando', 'aprovado', 'em_servico', 'concluido', 'entregue']
const STAGE_LABELS = ['Aguardando', 'Aprovado', 'Em Serviço', 'Pronto', 'Entregue']

export default function OSDetalhePage({ params: propsParams }: { params: { id: string } }) {
  const params = useParams()
  const { empresaId, loading: loadingEmpresa } = useEmpresaId()
  const [os, setOs] = useState<OS | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loggedUser, setLoggedUser] = useState('Operador')
  
  // Data lists for Edit Modal
  const [clientesDB, setClientesDB] = useState<Cliente[]>([])
  const [tecnicosDB, setTecnicosDB] = useState<Profile[]>([])
  const [tecnicosExternos, setTecnicosExternos] = useState<string[]>([])
  
  const [loadingOS, setLoadingOS] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [erroEdit, setErroEdit] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  
  // Edit Form State
  const [form, setForm] = useState({
    cliente_id: null as string | null,
    cliente_nome: '',
    cliente_tel: '',
    equipamento: '',
    defeito_relatado: '',
    status: '',
    orcamento: '',
    valor_servico: '',
    valor_pecas: '',
    tecnico: '',
    previsao: '',
    problema: '',
    laudo: '',
    observacoes: ''
  })

  // Edit Autocomplete client
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteSugs, setClienteSugs] = useState<Cliente[]>([])
  const [showCustomTecnico, setShowCustomTecnico] = useState(false)

  // Auto summation of parts + labor
  useEffect(() => {
    const serv = parseFloat(form.valor_servico) || 0
    const pec = parseFloat(form.valor_pecas) || 0
    if (serv > 0 || pec > 0) {
      setForm(f => ({ ...f, orcamento: (serv + pec).toFixed(2) }))
    }
  }, [form.valor_servico, form.valor_pecas])

  const carregar = useCallback(async () => {
    if (!empresaId || !params.id) return
    setLoadingOS(true)
    const supabase = createClient()
    
    try {
      // 0. Carrega dados do Usuário Logado para o histórico
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
        if (prof?.nome) setLoggedUser(prof.nome)
      }

      // Executa queries em paralelo para performance
      const [osRes, empRes, clientesRes, profilesRes] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('*')
          .eq('id', params.id)
          .eq('empresa_id', empresaId)
          .single(),
        supabase
          .from('empresas')
          .select('id,nome,cnpj,telefone,whatsapp,endereco,cidade,estado')
          .eq('id', empresaId)
          .single(),
        supabase
          .from('clientes')
          .select('id,nome,telefone,cpf')
          .eq('empresa_id', empresaId)
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('profiles')
          .select('id,nome,papel')
          .eq('empresa_id', empresaId)
          .eq('status', 'ativo'),
      ])

      const osData = osRes.data
      const empData = empRes.data
      const dataClientes = clientesRes.data
      const dataProfiles = profilesRes.data

      if (osData) {
        setOs(osData as OS)
        setForm({
          cliente_id:       osData.cliente_id,
          cliente_nome:     osData.cliente_nome,
          cliente_tel:      osData.cliente_tel || '',
          equipamento:      osData.equipamento,
          defeito_relatado: osData.defeito_relatado,
          status:           osData.status,
          orcamento:        osData.orcamento ? String(osData.orcamento) : '',
          valor_servico:    osData.valor_servico ? String(osData.valor_servico) : '',
          valor_pecas:      osData.valor_pecas ? String(osData.valor_pecas) : '',
          tecnico:          osData.tecnico || '',
          previsao:         osData.previsao || '',
          problema:         osData.problema || '',
          laudo:            osData.laudo || '',
          observacoes:      osData.observacoes || ''
        })
        setClienteBusca(osData.cliente_nome)

        // Extrai técnicos externos do próprio registro (sem query extra)
        if (dataProfiles && osData.tecnico && !dataProfiles.some((p: Profile) => p.nome === osData.tecnico)) {
          setTecnicosExternos([osData.tecnico])
        }
      }
      
      if (empData) setEmpresa(empData as Empresa)
      if (dataClientes) setClientesDB(dataClientes as Cliente[])
      if (dataProfiles) setTecnicosDB(dataProfiles as Profile[])
    } catch (e) {
      console.error('Erro ao carregar OS:', e)
    } finally {
      setLoadingOS(false)
    }
  }, [empresaId, params.id])

  useEffect(() => {
    if (empresaId) {
      carregar()
    } else if (!loadingEmpresa && !empresaId) {
      setLoadingOS(false)
    }
  }, [empresaId, loadingEmpresa, carregar])

  async function concluir() {
    if (!os || !empresaId) return
    setSalvando(true)
    
    // Grava histórico
    const newLog = {
      data: new Date().toISOString(),
      usuario: loggedUser,
      status: 'concluido',
      status_label: 'Pronto / Concluído'
    }
    const updatedHistory = [newLog, ...(os.historico || [])]

    const { error } = await createClient()
      .from('ordens_servico')
      .update({ status: 'concluido', historico: updatedHistory })
      .eq('id', os.id)
      
    if (error) {
      alert('Erro ao concluir OS: ' + error.message)
      setSalvando(false)
      return
    }
    
    setOs({ ...os, status: 'concluido', historico: updatedHistory })
    setForm(f => ({ ...f, status: 'concluido' }))
    setSalvando(false)
  }

  async function salvarEdicao() {
    if (!form.cliente_nome || !form.equipamento || !form.defeito_relatado) {
      setErroEdit('Preencha cliente, equipamento e defeito.'); return
    }
    setSalvando(true); setErroEdit(null)
    
    // Constrói histórico se status mudou
    const updatedHistory = [...(os?.historico || [])]
    if (form.status !== os?.status) {
      updatedHistory.unshift({
        data: new Date().toISOString(),
        usuario: loggedUser,
        status: form.status,
        status_label: STATUS_LABEL[form.status] || form.status
      })
    }
    
    const { error } = await createClient()
      .from('ordens_servico')
      .update({
        cliente_id:       form.cliente_id || null,
        cliente_nome:     form.cliente_nome,
        cliente_tel:      form.cliente_tel || null,
        equipamento:      form.equipamento,
        defeito_relatado: form.defeito_relatado,
        status:           form.status,
        orcamento:        form.orcamento ? parseFloat(form.orcamento) : null,
        valor_servico:    form.valor_servico ? parseFloat(form.valor_servico) : 0,
        valor_pecas:      form.valor_pecas ? parseFloat(form.valor_pecas) : 0,
        tecnico:          form.tecnico || null,
        previsao:         form.previsao || null,
        problema:         form.problema || null,
        laudo:            form.laudo || null,
        observacoes:      form.observacoes || null,
        historico:        updatedHistory,
        atualizado_em:    new Date().toISOString()
      })
      .eq('id', params.id)
      
    setSalvando(false)
    if (error) { setErroEdit('Erro: ' + error.message); return }
    
    setShowEdit(false)
    carregar()
  }

  const copiarRastreamento = () => {
    const url = window.location.origin + '/acompanhar-os/' + os?.id
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  if (loadingEmpresa) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--texto-desab)'}}>
      <Loader2 size={24} style={{animation:'spin 1s linear infinite'}}/>
    </div>
  )

  if (!empresaId) return (
    <div className="alerta alerta-perigo" style={{ margin: '1rem' }}>
      Empresa não vinculada ou erro de autenticação. Por favor, tente recarregar a página ou faça login novamente.
    </div>
  )

  if (loadingOS) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--texto-desab)'}}>
      <Loader2 size={24} style={{animation:'spin 1s linear infinite'}}/>
    </div>
  )
  if (!os) return <div className="alerta alerta-perigo">OS não encontrada.</div>

  const printOS = () => window.print()

  // Monta link do rastreio
  const publicTrackingUrl = typeof window !== 'undefined' ? window.location.origin + '/acompanhar-os/' + os.id : ''

  // Templates de WhatsApp
  const wppMsgAbertura = `Olá ${os.cliente_nome}! Recebemos seu equipamento *${os.equipamento}* para manutenção sob a *OS #${String(os.numero).padStart(4,'0')}*. Você pode acompanhar o andamento técnico em tempo real clicando no link: ${publicTrackingUrl}`
  
  const wppMsgOrcamento = `Olá ${os.cliente_nome}! O orçamento do seu equipamento *${os.equipamento}* (OS #${String(os.numero).padStart(4,'0')}) está pronto. Valor Total: *${formatCurrency(os.orcamento || os.valor_servico + os.valor_pecas)}*. Você pode ver os detalhes e o laudo completo em: ${publicTrackingUrl}`
  
  const wppMsgPronto = `Boas notícias, ${os.cliente_nome}! Seu equipamento *${os.equipamento}* (OS #${String(os.numero).padStart(4,'0')}) já está pronto e testado para retirada. Valor Final: *${formatCurrency(os.orcamento || os.valor_servico + os.valor_pecas)}*. Endereço da loja: ${empresa?.endereco || 'Nossa assistência'}. Veja mais detalhes em: ${publicTrackingUrl}`

  const sendWppMessage = (msg: string) => {
    if (!os.cliente_tel) return
    window.open(`https://wa.me/55${os.cliente_tel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const currentStageIndex = STAGES.indexOf(os.status)

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'1.25rem', maxWidth:'680px' }}>
      
      {/* Botões de Ação Superiores */}
      <div className="no-print pg-header" style={{ borderBottom: 'none', marginBottom: 0 }}>
        <Link href="/ordens-de-servico" className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <ArrowLeft size={16}/> Voltar
        </Link>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={() => setShowEdit(true)} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
            <Edit size={16}/> Editar OS
          </button>
          <button onClick={() => setShowShare(true)} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'var(--verde-claro)', color:'var(--verde-esc)', borderColor:'var(--verde-borda)' }}>
            <Share2 size={16}/> Enviar / Compartilhar
          </button>
          <button onClick={printOS} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
            <Printer size={16}/> Imprimir
          </button>
        </div>
      </div>

      {/* Card da OS com Área de Impressão */}
      <div className="card printable-receipt-card" id="print-area" style={{ borderTop: '4px solid var(--verde)' }}>
        
        {/* Cabeçalho Profissional de Impressão */}
        <div style={{ borderBottom:'1px solid var(--borda-forte)', paddingBottom:'1rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              {empresa ? (
                <>
                  <h2 style={{ fontWeight:900, fontSize:'1.4rem', textTransform:'uppercase', color:'var(--texto)' }}>{empresa.nome}</h2>
                  <p style={{ color:'var(--texto-sec)', fontSize:'0.75rem', marginTop:'0.2rem' }}>
                    {empresa.endereco && `${empresa.endereco} · `}
                    {empresa.cidade && `${empresa.cidade}-${empresa.estado || ''}`}
                  </p>
                  <p style={{ color:'var(--texto-sec)', fontSize:'0.75rem' }}>
                    {empresa.cnpj && `CNPJ: ${empresa.cnpj} · `}
                    {empresa.telefone && `Contato: ${empresa.telefone}`}
                  </p>
                </>
              ) : (
                <h2 style={{ fontWeight:900, fontSize:'1.4rem', textTransform:'uppercase' }}>Assistência Técnica</h2>
              )}
              <h3 style={{ fontSize:'1rem', fontWeight:800, marginTop:'0.5rem', color:'var(--verde)' }}>COMPROVANTE DE ATENDIMENTO TÉCNICO</h3>
            </div>
            
            <div style={{ textAlign:'right' }}>
              <h1 style={{ fontWeight:900, fontSize:'1.6rem', fontFamily:'JetBrains Mono, monospace', margin:0 }}>OS #{String(os.numero).padStart(4,'0')}</h1>
              <span className={`tag ${STATUS_CLS[os.status]} no-print`} style={{ display:'inline-block', marginTop:'0.5rem', padding:'0.25rem 0.625rem', fontSize:'0.75rem' }}>
                {STATUS_LABEL[os.status]}
              </span>
              <div className="print-only" style={{ display:'none', fontSize:'0.85rem', fontWeight:700, border:`1px solid ${os.status === 'cancelado' ? '#c0392b' : '#1a7a3c'}`, padding:'0.25rem 0.5rem', marginTop:'0.5rem', textTransform:'uppercase' }}>
                Status: {os.status === 'aguardando' ? 'Aguardando Orçamento' : os.status === 'em_servico' ? 'Em Serviço' : STATUS_LABEL[os.status]}
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Visual de Status (Apenas na tela, oculto na impressão) */}
        {os.status !== 'cancelado' ? (
          <div className="no-print" style={{ borderBottom:'1px solid var(--borda-leve)', paddingBottom:'1.25rem', marginBottom:'1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {STAGES.map((stage, idx) => {
                const isCompleted = currentStageIndex >= idx
                const isActive = os.status === stage
                
                const color = isActive ? 'var(--verde)' : isCompleted ? 'var(--texto)' : 'var(--texto-desab)'
                const circleBg = isActive ? 'var(--verde-claro)' : isCompleted ? 'var(--verde)' : 'var(--surface-alt)'
                const circleBorder = isCompleted ? 'var(--verde)' : 'var(--borda)'
                
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: idx < STAGES.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '70px', position: 'relative' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: circleBg,
                        border: `2px solid ${circleBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: isCompleted && !isActive ? '#fff' : color
                      }}>
                        {isCompleted && !isActive ? '✔' : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: isActive || (isCompleted && !isActive) ? 700 : 500, color: color }}>
                        {STAGE_LABELS[idx]}
                      </span>
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '2px',
                        background: currentStageIndex > idx ? 'var(--verde)' : 'var(--borda)',
                        margin: '0 0.5rem',
                        alignSelf: 'center',
                        marginTop: '-12px'
                      }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="alerta alerta-perigo no-print" style={{ marginBottom:'1rem' }}>
            <p>🛑 ESTA ORDEM DE SERVIÇO FOI CANCELADA E NÃO PODE MAIS SER TRABALHADA.</p>
          </div>
        )}

        {/* Informações Principais (Cliente e Informações do Serviço) */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Cliente</p>
            <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--texto)' }}>{os.cliente_nome}</p>
            <p style={{ color:'var(--texto-sec)', fontSize:'0.82rem', marginTop:'0.15rem' }}>📱 {os.cliente_tel || 'Sem telefone cadastrado'}</p>
            <p style={{ color:'var(--texto-desab)', fontSize:'0.72rem', marginTop:'0.25rem' }}>
              Data Abertura: {new Date(os.criado_em).toLocaleString('pt-BR')}
            </p>
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Dados Gerais</p>
            <p style={{ fontSize:'0.85rem' }}>Técnico: <span style={{ fontWeight:700, color:'var(--texto)' }}>{os.tecnico || 'Não designado'}</span></p>
            <p style={{ fontSize:'0.85rem', marginTop:'0.15rem' }}>Previsão: <span style={{ fontWeight:700, color:'var(--texto)' }}>{os.previsao ? new Date(os.previsao+'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span></p>
            <p style={{ fontSize:'0.85rem', marginTop:'0.15rem' }}>Venda Vinculada: <span style={{ fontWeight:700, color: os.venda_id ? 'var(--verde)' : 'var(--texto-desab)' }}>{os.venda_id ? 'Sim' : 'Não'}</span></p>
          </div>
        </div>

        {/* Informações Técnicas e Equipamento */}
        <div style={{ borderTop:'1px solid var(--borda-leve)', paddingTop:'1rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Equipamento / Aparelho</p>
            <p style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--texto)' }}>{os.equipamento}</p>
          </div>
          
          <div>
            <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Defeito Relatado</p>
            <p style={{ fontSize:'0.9rem', color:'var(--texto)', background:'var(--surface-alt)', padding:'0.625rem', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--borda)' }}>
              {os.defeito_relatado}
            </p>
          </div>

          {os.problema && (
            <div>
              <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Problema Constatado (Diagnóstico)</p>
              <p style={{ fontSize:'0.9rem', color:'var(--texto)', background:'var(--surface-alt)', padding:'0.625rem', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--amarelo)' }}>
                {os.problema}
              </p>
            </div>
          )}

          {os.laudo && (
            <div>
              <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Laudo Técnico / Resolução</p>
              <p style={{ fontSize:'0.9rem', color:'var(--texto)', background:'var(--verde-claro)', padding:'0.625rem', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--verde)', fontStyle:'italic' }}>
                {os.laudo}
              </p>
            </div>
          )}

          {os.observacoes && (
            <div className="no-print">
              <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Observações Internas (Oculto no Recibo)</p>
              <p style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{os.observacoes}</p>
            </div>
          )}
        </div>

        {/* Quadro de Valores */}
        <div style={{ borderTop:'1px solid var(--borda-leve)', paddingTop:'1rem', marginTop:'1.25rem' }}>
          <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Valores e Orçamento</p>
          <div style={{ background:'var(--surface-alt)', border:'1px solid var(--borda)', borderRadius:'var(--radius-sm)', padding:'0.75rem', display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:'1rem', textAlign:'center' }}>
            <div style={{ borderRight:'1px solid var(--borda-leve)' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--texto-sec)' }}>MÃO DE OBRA (SERVIÇOS)</p>
              <p className="txt-mono" style={{ fontSize:'1rem', fontWeight:700, marginTop:'0.25rem' }}>{formatCurrency(os.valor_servico)}</p>
            </div>
            <div style={{ borderRight:'1px solid var(--borda-leve)' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--texto-sec)' }}>PEÇAS / MATERIAIS</p>
              <p className="txt-mono" style={{ fontSize:'1rem', fontWeight:700, marginTop:'0.25rem' }}>{formatCurrency(os.valor_pecas)}</p>
            </div>
            <div>
              <p style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--verde)' }}>VALOR FINAL (ORÇAMENTO)</p>
              <p className="txt-mono txt-verde" style={{ fontSize:'1.15rem', fontWeight:800, marginTop:'0.25rem' }}>
                {os.orcamento ? formatCurrency(os.orcamento) : formatCurrency(os.valor_servico + os.valor_pecas)}
              </p>
            </div>
          </div>
        </div>

        {/* Histórico / Timeline no Painel de Controle */}
        {os.historico && os.historico.length > 0 && (
          <div className="no-print" style={{ borderTop:'1px solid var(--borda-leve)', paddingTop:'1rem', marginTop:'1.25rem' }}>
            <p style={{ fontWeight:800, fontSize:'0.75rem', color:'var(--texto-sec)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>Linha do Tempo (Logs de Auditoria)</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', paddingLeft:'0.75rem', borderLeft:'1px solid var(--borda-leve)' }}>
              {os.historico.map((h, idx) => (
                <div key={idx} style={{ fontSize:'0.75rem' }}>
                  <span style={{ color:'var(--texto-desab)', marginRight:'0.5rem' }}>{new Date(h.data).toLocaleString('pt-BR')}</span>
                  <span style={{ fontWeight:700, color:'var(--texto)' }}>{h.status_label || h.status}</span>
                  <span style={{ color:'var(--texto-sec)' }}> por {h.usuario}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venda vinculada banner (Oculto no print) */}
        {os.venda_id && (
          <div className="alerta alerta-info no-print" style={{ marginTop:'1.25rem' }}>
            <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>🔗 Venda Registrada no PDV</p>
            <p style={{ fontSize:'0.82rem' }}>Esta OS está vinculada a uma venda. O fechamento e faturamento já foram lançados.</p>
            <Link href={`/vendas`} className="btn btn-secondary" style={{ marginTop:'0.5rem', fontSize:'0.72rem', padding:'0.25rem 0.5rem', display:'inline-block' }}>
              Ver Vendas
            </Link>
          </div>
        )}

        {/* Termo de Garantia e Assinaturas (Apenas no print) */}
        <div className="print-only" style={{ display:'none', borderTop:'1px dashed var(--borda-forte)', marginTop:'2rem', paddingTop:'1rem', fontSize:'0.75rem', color:'var(--texto-sec)' }}>
          <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>TERMO DE RECEBIMENTO E CONDIÇÕES DE SERVIÇO</p>
          <p style={{ lineHeight:1.4 }}>
            1. O equipamento descrito acima foi entregue à assistência para fins de avaliação e/ou reparo.
            2. O cliente declara estar ciente de que equipamentos não retirados em até 90 (noventa) dias após a notificação de conclusão serão considerados abandonados.
            3. A garantia do serviço realizado é de 90 dias, limitando-se única e exclusivamente às peças trocadas e serviços descritos no laudo técnico.
          </p>
          
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginTop:'3rem', textAlign:'center' }}>
            <div>
              <p style={{ marginBottom:'0.25rem' }}>__________________________________________</p>
              <p style={{ fontWeight:700 }}>ASSINATURA DO CLIENTE</p>
              <p style={{ fontSize:'0.65rem' }}>Autorizo a execução dos serviços</p>
            </div>
            <div>
              <p style={{ marginBottom:'0.25rem' }}>__________________________________________</p>
              <p style={{ fontWeight:700 }}>RESPONSÁVEL TÉCNICO</p>
              <p style={{ fontSize:'0.65rem' }}>{os.tecnico || 'Assinatura do Técnico'}</p>
            </div>
          </div>
        </div>

        {/* Ação rápida de concluir na tela */}
        <div className="no-print" style={{ display:'flex', justifyContent:'flex-end', borderTop:'1px solid var(--borda-leve)', paddingTop:'1.25rem', marginTop:'1.25rem' }}>
          {os.status !== 'concluido' && os.status !== 'entregue' && os.status !== 'cancelado' && (
            <button onClick={concluir} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'1rem', padding:'0.6rem 1.25rem' }}>
              {salvando ? <Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle size={16}/>}
              Marcar como Concluída (Pronta)
            </button>
          )}
        </div>
      </div>

      {/* Modal de Compartilhamento (WhatsApp e Rastreio) */}
      {showShare && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowShare(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'520px', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'3px', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
            
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontWeight:800, fontSize:'0.82rem', color:'var(--verde)', textTransform:'uppercase' }}>Compartilhar Ordem de Serviço</p>
              <button onClick={()=>setShowShare(false)} className="btn-icon"><X size={16}/></button>
            </div>

            {/* Copiar Link de Acompanhamento */}
            <div style={{ background:'var(--surface-alt)', border:'1px dashed var(--verde-borda)', padding:'0.75rem', borderRadius:'var(--radius-sm)' }}>
              <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--texto-sec)', marginBottom:'0.375rem' }}>LINK DE RASTREAMENTO PÚBLICO</p>
              <div style={{ display:'flex', gap:'0.375rem' }}>
                <input readOnly className="campo" style={{ fontSize:'0.75rem', flex:1 }} value={publicTrackingUrl} />
                <button onClick={copiarRastreamento} className="btn btn-primary" style={{ fontSize:'0.72rem', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                  <Copy size={12} /> {linkCopiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)', marginTop:'0.25rem' }}>O cliente pode acompanhar o stepper visual e laudo por este link sem precisar de login.</p>
            </div>

            {/* Templates de Mensagem do WhatsApp */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--texto-sec)' }}>SELECIONE UM TEMPLATE DE WHATSAPP</p>
              
              {/* Template 1: Abertura */}
              <div style={{ border:'1px solid var(--borda)', borderRadius:'var(--radius-sm)', padding:'0.625rem' }}>
                <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--texto)' }}>1. Abertura do Atendimento (Aparelho Recebido)</p>
                <p style={{ fontSize:'0.72rem', color:'var(--texto-sec)', margin:'0.25rem 0', fontStyle:'italic', background:'var(--surface-alt)', padding:'0.375rem' }}>
                  {wppMsgAbertura.slice(0, 100)}...
                </p>
                <button onClick={()=>sendWppMessage(wppMsgAbertura)} className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'0.25rem 0.5rem', background:'#25D366', color:'#fff', borderColor:'#25D366', marginTop:'0.25rem' }}>
                  Enviar no WhatsApp
                </button>
              </div>

              {/* Template 2: Orçamento */}
              <div style={{ border:'1px solid var(--borda)', borderRadius:'var(--radius-sm)', padding:'0.625rem' }}>
                <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--texto)' }}>2. Orçamento Pronto (Aguardando Aprovação)</p>
                <p style={{ fontSize:'0.72rem', color:'var(--texto-sec)', margin:'0.25rem 0', fontStyle:'italic', background:'var(--surface-alt)', padding:'0.375rem' }}>
                  {wppMsgOrcamento.slice(0, 100)}...
                </p>
                <button onClick={()=>sendWppMessage(wppMsgOrcamento)} className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'0.25rem 0.5rem', background:'#25D366', color:'#fff', borderColor:'#25D366', marginTop:'0.25rem' }}>
                  Enviar no WhatsApp
                </button>
              </div>

              {/* Template 3: Pronto */}
              <div style={{ border:'1px solid var(--borda)', borderRadius:'var(--radius-sm)', padding:'0.625rem' }}>
                <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--texto)' }}>3. Equipamento Pronto (Aviso de Retirada)</p>
                <p style={{ fontSize:'0.72rem', color:'var(--texto-sec)', margin:'0.25rem 0', fontStyle:'italic', background:'var(--surface-alt)', padding:'0.375rem' }}>
                  {wppMsgPronto.slice(0, 100)}...
                </p>
                <button onClick={()=>sendWppMessage(wppMsgPronto)} className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'0.25rem 0.5rem', background:'#25D366', color:'#fff', borderColor:'#25D366', marginTop:'0.25rem' }}>
                  Enviar no WhatsApp
                </button>
              </div>
            </div>

            <button onClick={()=>setShowShare(false)} className="btn btn-secondary" style={{ fontSize:'0.72rem', alignSelf:'flex-end' }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal de Edição de OS */}
      {showEdit && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowEdit(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'600px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'3px' }}>
            
            {/* Header */}
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>EDITAR ORDEM DE SERVIÇO #{os.numero}</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Ajuste os dados de atendimento ou laudo técnico</p>
              </div>
              <button onClick={()=>setShowEdit(false)} className="btn-icon"><X size={16}/></button>
            </div>
            
            {/* Body */}
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {erroEdit && <div className="alerta alerta-perigo">{erroEdit}</div>}
              
              {/* Cliente Autocomplete */}
              <div style={{ border: '1px solid var(--borda-leve)', padding: '0.75rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', position:'relative' }}>
                <label className="campo-label">Cliente *</label>
                <input 
                  className="campo"
                  placeholder="Pesquisar cliente..."
                  value={clienteBusca}
                  onChange={e => {
                    const val = e.target.value
                    setClienteBusca(val)
                    setForm(f => ({ ...f, cliente_nome: val, cliente_id: null }))
                    const q = val.toLowerCase()
                    if (q.length > 0) {
                      const s = clientesDB.filter(c => c.nome.toLowerCase().includes(q))
                      setClienteSugs(s.slice(0, 8))
                    } else {
                      setClienteSugs([])
                    }
                  }}
                  onFocus={() => {
                    const q = clienteBusca.toLowerCase()
                    const s = clientesDB.filter(c => c.nome.toLowerCase().includes(q))
                    setClienteSugs(s.slice(0, 8))
                  }}
                  onBlur={() => {
                    setTimeout(() => setClienteSugs([]), 200)
                  }}
                />
                {clienteSugs.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: '0.75rem', right: '0.75rem', zIndex: 110, background: 'var(--surface)', border: '1px solid var(--borda-forte)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '180px', overflowY: 'auto' }}>
                    {clienteSugs.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--borda-leve)', fontSize: '0.8rem', fontFamily: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        onMouseDown={e => {
                          e.preventDefault()
                          setClienteBusca(c.nome)
                          setForm(f => ({ ...f, cliente_nome: c.nome, cliente_tel: c.telefone || '', cliente_id: c.id }))
                          setClienteSugs([])
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--texto)' }}>{c.nome}</div>
                        {c.telefone && <div style={{ fontSize: '0.65rem', color: 'var(--texto-sec)' }}>Telefone: {c.telefone}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Whatsapp */}
              <div>
                <label className="campo-label">WhatsApp Contato</label>
                <input className="campo" value={form.cliente_tel} onChange={e=>setForm(f=>({...f,cliente_tel:e.target.value}))}/>
              </div>

              {/* Status Selector */}
              <div>
                <label className="campo-label">Status da OS *</label>
                <select className="campo" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {Object.entries(STATUS_LABEL).map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Equipamento */}
              <div>
                <label className="campo-label">Equipamento *</label>
                <input className="campo" value={form.equipamento} onChange={e=>setForm(f=>({...f,equipamento:e.target.value}))}/>
              </div>

              {/* Defeito */}
              <div>
                <label className="campo-label">Defeito Relatado *</label>
                <textarea className="campo" rows={2} style={{ resize:'none' }}
                  value={form.defeito_relatado} onChange={e=>setForm(f=>({...f,defeito_relatado:e.target.value}))}/>
              </div>

              {/* Técnico e Previsão */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                <div>
                  <label className="campo-label">Técnico Responsável</label>
                  {!showCustomTecnico ? (
                    <select
                      className="campo"
                      value={form.tecnico}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '__custom__') {
                          setShowCustomTecnico(true)
                          setForm(f => ({ ...f, tecnico: '' }))
                        } else {
                          setForm(f => ({ ...f, tecnico: val }))
                        }
                      }}
                    >
                      <option value="">— Sem Técnico —</option>
                      {tecnicosDB.map(t => (
                        <option key={t.id} value={t.nome}>{t.nome} ({t.papel})</option>
                      ))}
                      {tecnicosExternos.map(te => (
                        <option key={te} value={te}>{te}</option>
                      ))}
                      <option value="__custom__">+ Novo Técnico Externo...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input
                        className="campo"
                        placeholder="Nome do técnico"
                        value={form.tecnico}
                        onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem', minWidth: '30px' }}
                        onClick={() => {
                          setShowCustomTecnico(false)
                          setForm(f => ({ ...f, tecnico: '' }))
                        }}
                        title="Voltar"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="campo-label">Previsão de Entrega</label>
                  <input className="campo" type="date" value={form.previsao} onChange={e=>setForm(f=>({...f,previsao:e.target.value}))}/>
                </div>
              </div>

              {/* Diagnósticos Adicionais */}
              <div>
                <label className="campo-label">Problema Diagnosticado (Real)</label>
                <input className="campo" placeholder="Defeito real encontrado no laboratório"
                  value={form.problema} onChange={e=>setForm(f=>({...f,problema:e.target.value}))}/>
              </div>

              <div>
                <label className="campo-label">Laudo Técnico</label>
                <textarea className="campo" rows={2} style={{ resize:'none' }}
                  placeholder="Relato das peças e serviços executados"
                  value={form.laudo} onChange={e=>setForm(f=>({...f,laudo:e.target.value}))}/>
              </div>

              {/* Valores Mão de Obra e Peças */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                <div>
                  <label className="campo-label">Mão de Obra (R$)</label>
                  <input className="campo" type="number" step="0.01" value={form.valor_servico} onChange={e=>setForm(f=>({...f,valor_servico:e.target.value}))}/>
                </div>
                <div>
                  <label className="campo-label">Peças (R$)</label>
                  <input className="campo" type="number" step="0.01" value={form.valor_pecas} onChange={e=>setForm(f=>({...f,valor_pecas:e.target.value}))}/>
                </div>
              </div>

              {/* Orçamento Geral */}
              <div>
                <label className="campo-label">Orçamento Total (R$)</label>
                <input className="campo" type="number" step="0.01" value={form.orcamento} onChange={e=>setForm(f=>({...f,orcamento:e.target.value}))}/>
              </div>

              <div>
                <label className="campo-label">Observações Internas (Oculto no Recibo)</label>
                <textarea className="campo" rows={2} style={{ resize:'none' }}
                  value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))}/>
              </div>

              {/* Ações */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.75rem', borderTop: '1px solid var(--borda-leve)', paddingTop: '0.75rem' }}>
                <button onClick={()=>setShowEdit(false)} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>CANCELAR</button>
                <button onClick={salvarEdicao} disabled={salvando} className="btn btn-primary" style={{fontSize:'0.72rem'}}>
                  {salvando ? 'SALVANDO...' : '✔ SALVAR ALTERAÇÕES'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* Estilo embutido para controlar a impressão específica da OS */}
      <style jsx global>{`
        @media print {
          body, html, main {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-receipt-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
