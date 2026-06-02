'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Search, Loader2, X, Wrench, Shield, CheckCircle2, Clock, AlertTriangle, AlertCircle, FileText } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { useSubscription } from '@/hooks/useSubscription'
import { formatCurrency } from '@/lib/utils'

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
  aguardando:   'AGUARDANDO',
  aprovado:     'APROVADO',
  em_servico:   'EM SERVICO',
  concluido:    'CONCLUIDO',
  entregue:     'ENTREGUE',
  cancelado:    'CANCELADO',
}

const STATUS_CLS: Record<string, string> = {
  aguardando: 'tag-cinza',
  aprovado:   'tag-amarelo',
  em_servico: 'tag-azul',
  concluido:  'tag-verde',
  entregue:   'tag-verde',
  cancelado:  'tag-vermelho',
}

const FLUXO: Record<string, string> = {
  aguardando: 'aprovado',
  aprovado:   'em_servico',
  em_servico: 'concluido',
  concluido:  'entregue'
}

export default function OrdensServicoPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresaId()
  const { plano } = useSubscription()
  
  const [ordens, setOrdens] = useState<OS[]>([])
  const [clientesDB, setClientesDB] = useState<Cliente[]>([])
  const [tecnicosDB, setTecnicosDB] = useState<Profile[]>([])
  const [tecnicosExternos, setTecnicosExternos] = useState<string[]>([])
  
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [loadingOS, setLoadingOS] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  // Cliente autocomplete state
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteSugs, setClienteSugs] = useState<Cliente[]>([])
  
  // Cadastro rápido de cliente
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [quickClient, setQuickClient] = useState({ nome: '', cpf: '', telefone: '' })
  const [cadastrandoCliente, setCadastrandoCliente] = useState(false)
  
  // Técnico customizado state
  const [showCustomTecnico, setShowCustomTecnico] = useState(false)
  
  // Seção técnica adicional colapsável
  const [showTechnical, setShowTechnical] = useState(false)
  
  const [form, setForm] = useState({
    cliente_id: null as string | null,
    cliente_nome: '',
    cliente_tel: '',
    equipamento: '',
    defeito_relatado: '',
    orcamento: '',
    valor_servico: '',
    valor_pecas: '',
    tecnico: '',
    previsao: '',
    problema: '',
    laudo: '',
    observacoes: ''
  })

  // Soma automática de mão de obra + peças
  useEffect(() => {
    const serv = parseFloat(form.valor_servico) || 0
    const pec = parseFloat(form.valor_pecas) || 0
    if (serv > 0 || pec > 0) {
      setForm(f => ({ ...f, orcamento: (serv + pec).toFixed(2) }))
    }
  }, [form.valor_servico, form.valor_pecas])

  useEffect(() => {
    if (empresaId) {
      carregar(empresaId)
    } else if (!loadingEmpresa && !empresaId) {
      setLoadingOS(false)
    }
  }, [empresaId, loadingEmpresa])

  async function carregar(eid: string) {
    setLoadingOS(true)
    const supabase = createClient()
    
    try {
      // 1. Carrega Ordens de Serviço
      const { data: dataOS } = await supabase
        .from('ordens_servico')
        .select('id,numero,cliente_id,cliente_nome,cliente_tel,equipamento,defeito_relatado,status,orcamento,valor_servico,valor_pecas,tecnico,criado_em,previsao,problema,laudo,observacoes')
        .eq('empresa_id', eid)
        .order('criado_em', { ascending: false })
        
      // 2. Carrega Clientes para o autocomplete
      const { data: dataClientes } = await supabase
        .from('clientes')
        .select('id,nome,telefone,cpf')
        .eq('empresa_id', eid)
        .eq('ativo', true)
        .order('nome')
        
      // 3. Carrega Usuários do sistema (Técnicos em potencial)
      const { data: dataProfiles } = await supabase
        .from('profiles')
        .select('id,nome,papel')
        .eq('empresa_id', eid)
        .eq('status', 'ativo')

      const osList = (dataOS || []) as OS[]
      setOrdens(osList)
      setClientesDB((dataClientes || []) as Cliente[])
      setTecnicosDB((dataProfiles || []) as Profile[])
      
      // Filtra técnicos externos únicos baseados no histórico
      const externos = Array.from(
        new Set(
          osList
            .map(o => o.tecnico)
            .filter((t): t is string => !!t && !dataProfiles?.some(p => p.nome === t))
        )
      )
      setTecnicosExternos(externos)
    } catch (e) {
      console.error('Erro ao carregar Ordens de Serviço:', e)
    } finally {
      setLoadingOS(false)
    }
  }

  async function cadastrarClienteRapido() {
    if (!quickClient.nome) { alert('Digite o nome do cliente.'); return }
    setCadastrandoCliente(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        empresa_id: empresaId,
        nome: quickClient.nome,
        cpf: quickClient.cpf || null,
        telefone: quickClient.telefone || null,
        tipo: 'varejo',
        ativo: true
      })
      .select('id,nome,telefone,cpf')
      .single()
      
    setCadastrandoCliente(false)
    if (error) {
      alert('Erro ao cadastrar cliente: ' + error.message)
      return
    }
    
    const novoCli = data as Cliente
    setClientesDB(prev => [novoCli, ...prev])
    setClienteBusca(novoCli.nome)
    setForm(f => ({
      ...f,
      cliente_nome: novoCli.nome,
      cliente_tel: novoCli.telefone || '',
      cliente_id: novoCli.id
    }))
    setShowQuickClient(false)
    setQuickClient({ nome: '', cpf: '', telefone: '' })
  }

  async function salvar() {
    if (!form.cliente_nome || !form.equipamento || !form.defeito_relatado) {
      setErro('Preencha cliente, equipamento e defeito relatado.'); return
    }
    if (!empresaId) return
    setSalvando(true); setErro(null)
    
    const { error } = await createClient().from('ordens_servico').insert({
      empresa_id:       empresaId,
      cliente_id:       form.cliente_id || null,
      cliente_nome:     form.cliente_nome,
      cliente_tel:      form.cliente_tel || null,
      equipamento:      form.equipamento,
      defeito_relatado: form.defeito_relatado,
      orcamento:        form.orcamento ? parseFloat(form.orcamento) : null,
      valor_servico:    form.valor_servico ? parseFloat(form.valor_servico) : 0,
      valor_pecas:      form.valor_pecas ? parseFloat(form.valor_pecas) : 0,
      tecnico:          form.tecnico || null,
      previsao:         form.previsao || null,
      problema:         form.problema || null,
      laudo:            form.laudo || null,
      observacoes:      form.observacoes || null,
      status:           'aguardando',
    })
    
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    
    setShowForm(false)
    setClienteBusca('')
    setShowCustomTecnico(false)
    setShowTechnical(false)
    setForm({
      cliente_id: null, cliente_nome: '', cliente_tel: '', equipamento: '',
      defeito_relatado: '', orcamento: '', valor_servico: '', valor_pecas: '',
      tecnico: '', previsao: '', problema: '', laudo: '', observacoes: ''
    })
    carregar(empresaId)
  }

  async function avancar(id: string, status: string) {
    const next = FLUXO[status]
    if (!next) return
    const { error } = await createClient().from('ordens_servico').update({ status: next }).eq('id', id)
    if (error) {
      alert('Erro ao avançar status: ' + error.message)
      return
    }
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, status: next } : o))
  }

  async function cancelar(id: string) {
    if (!confirm('Deseja realmente cancelar esta Ordem de Serviço?')) return
    const { error } = await createClient().from('ordens_servico').update({ status: 'cancelado' }).eq('id', id)
    if (error) {
      alert('Erro ao cancelar OS: ' + error.message)
      return
    }
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelado' } : o))
  }

  const filtradas = ordens.filter(o => {
    const term = busca.toLowerCase()
    const match = o.cliente_nome.toLowerCase().includes(term) ||
      o.equipamento.toLowerCase().includes(term) ||
      String(o.numero).includes(busca) ||
      (o.tecnico && o.tecnico.toLowerCase().includes(term))
    return match && (filtro === 'todos' || o.status === filtro)
  })

  // Estatísticas das ordens de serviço
  const totalGeral    = ordens.length
  const totalAbertas  = ordens.filter(o => !['entregue', 'cancelado'].includes(o.status)).length
  const totalAguardando = ordens.filter(o => o.status === 'aguardando').length
  const totalEmServico  = ordens.filter(o => o.status === 'em_servico').length

  const isMesAtual = (d: string) => {
    const dt = new Date(d), hj = new Date()
    return dt.getMonth() === hj.getMonth() && dt.getFullYear() === hj.getFullYear()
  }

  // OS finalizadas (concluidas + entregues) no mês
  const osMes = ordens.filter(o => ['concluido', 'entregue'].includes(o.status) && isMesAtual(o.criado_em))
  const totalConcluidoMes = osMes.length

  // KPIs financeiros reais: apenas OS concluídas/entregues
  const faturamentoMes   = osMes.reduce((acc, o) => acc + (o.orcamento || o.valor_servico + o.valor_pecas), 0)
  const receitaServicoMes = osMes.reduce((acc, o) => acc + (o.valor_servico || 0), 0)
  const custoPecasMes     = osMes.reduce((acc, o) => acc + (o.valor_pecas  || 0), 0)

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">ORDENS DE SERVIÇO</h1>
          <p className="pg-sub">{totalGeral} OS REGISTRADAS · {totalAbertas} EM ABERTO</p>
        </div>
        <button onClick={() => setShowForm(v=>!v)} className="btn btn-primary">
          {showForm ? '✕ CANCELAR' : '+ NOVA OS'}
        </button>
      </div>

      <PageTabs tabs={[
        { label: 'Garantias', href: '/garantias' },
        { label: 'Ordens de Serviço', href: '/ordens-de-servico' },
        { label: plano === 'pro' ? 'Comissões' : 'Comissões 🔒', href: '/comissoes' }
      ]} />

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'0.625rem', marginBottom:'0.375rem' }}>
        <div className="kpi-card" style={{ borderTopColor: 'var(--borda-forte)' }}>
          <span className="kpi-label">OS em Aberto</span>
          <span className="kpi-valor">{totalAbertas}</span>
          <span className="kpi-sub">Total não finalizadas</span>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--amarelo)' }}>
          <span className="kpi-label">Aguardando</span>
          <span className="kpi-valor" style={{ color: 'var(--amarelo)' }}>{totalAguardando}</span>
          <span className="kpi-sub">Sem orçamento/aprovação</span>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--azul)' }}>
          <span className="kpi-label">Em Serviço</span>
          <span className="kpi-valor" style={{ color: 'var(--azul)' }}>{totalEmServico}</span>
          <span className="kpi-sub">Técnicos trabalhando</span>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--verde)' }}>
          <span className="kpi-label">Finalizadas (Mês)</span>
          <span className="kpi-valor" style={{ color: 'var(--verde)' }}>{totalConcluidoMes}</span>
          <span className="kpi-sub">Prontas ou entregues</span>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--verde)' }}>
          <span className="kpi-label">Faturamento (Mês)</span>
          <span className="kpi-valor-verde">{formatCurrency(faturamentoMes)}</span>
          <span className="kpi-sub">OS concluídas/entregues</span>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--azul)' }}>
          <span className="kpi-label">Receita Serviços</span>
          <span className="kpi-valor" style={{ color:'var(--azul)', fontSize:'0.95rem' }}>{formatCurrency(receitaServicoMes)}</span>
          <span className="kpi-sub">Mão de obra no mês</span>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--amarelo)' }}>
          <span className="kpi-label">Custo Peças</span>
          <span className="kpi-valor" style={{ color:'var(--amarelo)', fontSize:'0.95rem' }}>{formatCurrency(custoPecasMes)}</span>
          <span className="kpi-sub">Peças/materiais no mês</span>
        </div>
      </div>

      {/* Formulário Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'600px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'3px' }}>
            
            {/* Modal Header */}
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>NOVA ORDEM DE SERVIÇO</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Abra um atendimento ou orçamento técnico</p>
              </div>
              <button onClick={()=>setShowForm(false)} className="btn-icon"><X size={16}/></button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {erro && <div className="alerta alerta-perigo">{erro}</div>}
              
              {/* Cliente Selector */}
              <div style={{ border: '1px solid var(--borda-leve)', padding: '0.75rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="campo-label" style={{ margin: 0 }}>Cliente *</label>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickClient(!showQuickClient)}
                    className="txt-verde"
                    style={{ background: 'none', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    {showQuickClient ? '✕ Cancelar' : '+ Rápido'}
                  </button>
                </div>

                {!showQuickClient ? (
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="campo"
                      placeholder="🔍 Digite para pesquisar cliente..."
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
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 110, background: 'var(--surface)', border: '1px solid var(--borda-forte)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '180px', overflowY: 'auto' }}>
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
                            {c.cpf && <span style={{ fontSize: '0.65rem', color: 'var(--texto-desab)' }}>CPF: {c.cpf}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.375rem', padding: '0.5rem', border: '1px dashed var(--verde-borda)', background: 'var(--surface)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--verde)' }}>CADASTRO RÁPIDO</div>
                    <input 
                      className="campo"
                      placeholder="Nome do cliente *"
                      value={quickClient.nome}
                      onChange={e => setQuickClient(c => ({ ...c, nome: e.target.value }))}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input 
                        className="campo"
                        placeholder="WhatsApp (ex: 11999990000)"
                        value={quickClient.telefone}
                        onChange={e => setQuickClient(c => ({ ...c, telefone: e.target.value }))}
                      />
                      <input 
                        className="campo"
                        placeholder="CPF (apenas números)"
                        value={quickClient.cpf}
                        onChange={e => setQuickClient(c => ({ ...c, cpf: e.target.value }))}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={cadastrarClienteRapido}
                      disabled={cadastrandoCliente}
                      className="btn btn-primary"
                      style={{ fontSize: '0.72rem', alignSelf: 'flex-end', padding: '0.3rem 0.75rem' }}
                    >
                      {cadastrandoCliente ? 'SALVANDO...' : '✔ CADASTRAR E VINCULAR'}
                    </button>
                  </div>
                )}
                
                {form.cliente_id && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--verde)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                    <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--verde)' }}></span>
                    CLIENTE VINCULADO AO SISTEMA
                  </div>
                )}
              </div>

              {/* Whatsapp */}
              <div>
                <label className="campo-label">WhatsApp de Contato</label>
                <input className="campo" placeholder="(11) 99999-0000"
                  value={form.cliente_tel} onChange={e=>setForm(f=>({...f,cliente_tel:e.target.value}))}/>
              </div>

              {/* Equipamento */}
              <div>
                <label className="campo-label">Equipamento *</label>
                <input className="campo" placeholder="Ex: Som Pioneer DEH-S1253UB, iPhone 13, Placa Mãe Asus"
                  value={form.equipamento} onChange={e=>setForm(f=>({...f,equipamento:e.target.value}))}/>
              </div>

              {/* Defeito */}
              <div>
                <label className="campo-label">Defeito Relatado *</label>
                <textarea className="campo" rows={2} style={{ resize:'none' }}
                  placeholder="Descreva detalhadamente o problema alegado pelo cliente..."
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
                      
                      {tecnicosDB.length > 0 && (
                        <optgroup label="Usuários do Sistema">
                          {tecnicosDB.map(t => (
                            <option key={t.id} value={t.nome}>{t.nome} ({t.papel})</option>
                          ))}
                        </optgroup>
                      )}
                      
                      {tecnicosExternos.length > 0 && (
                        <optgroup label="Técnicos Externos do Histórico">
                          {tecnicosExternos.map(te => (
                            <option key={te} value={te}>{te}</option>
                          ))}
                        </optgroup>
                      )}
                      
                      <option value="__custom__">+ Novo Técnico Externo...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input
                        className="campo"
                        placeholder="Nome do técnico externo"
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
                        title="Voltar para seleção"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="campo-label">Previsão de Entrega</label>
                  <input className="campo" type="date"
                    value={form.previsao} onChange={e=>setForm(f=>({...f,previsao:e.target.value}))}/>
                </div>
              </div>

              {/* Orçamento Geral */}
              <div>
                <label className="campo-label">Orçamento Total Estimado (R$)</label>
                <input className="campo" type="number" step="0.01"
                  placeholder="0,00 (Deixe em branco se for avaliar primeiro)" value={form.orcamento} onChange={e=>setForm(f=>({...f,orcamento:e.target.value}))}/>
              </div>

              {/* Collapsible Technical Details */}
              <div style={{ marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--texto-sec)', borderBottom: '1px solid var(--borda-leve)' }}
                  onClick={() => setShowTechnical(!showTechnical)}
                >
                  <span>{showTechnical ? '▼' : '▶'} INFORMAÇÕES TÉCNICAS E VALORES DETALHADOS</span>
                </button>
                
                {showTechnical && (
                  <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem 0 0', marginTop: '0.25rem' }}>
                    <div>
                      <label className="campo-label">Problema Diagnosticado (Real)</label>
                      <input className="campo" placeholder="Qual defeito foi realmente encontrado..."
                        value={form.problema} onChange={e=>setForm(f=>({...f,problema:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="campo-label">Laudo Técnico</label>
                      <textarea className="campo" rows={2} style={{ resize:'none' }}
                        placeholder="Laudo para exibir no recibo do cliente..."
                        value={form.laudo} onChange={e=>setForm(f=>({...f,laudo:e.target.value}))}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                      <div>
                        <label className="campo-label">Valor Mão de Obra (R$)</label>
                        <input className="campo" type="number" step="0.01" placeholder="0,00"
                          value={form.valor_servico} onChange={e=>setForm(f=>({...f,valor_servico:e.target.value}))}/>
                      </div>
                      <div>
                        <label className="campo-label">Valor Peças (R$)</label>
                        <input className="campo" type="number" step="0.01" placeholder="0,00"
                          value={form.valor_pecas} onChange={e=>setForm(f=>({...f,valor_pecas:e.target.value}))}/>
                      </div>
                    </div>
                    <div>
                      <label className="campo-label">Observações Internas</label>
                      <textarea className="campo" rows={2} style={{ resize:'none' }}
                        placeholder="Observações que não aparecem no recibo do cliente..."
                        value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.75rem', borderTop: '1px solid var(--borda-leve)', paddingTop: '0.75rem' }}>
                <button onClick={()=>setShowForm(false)} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>CANCELAR</button>
                <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{fontSize:'0.72rem'}}>
                  {salvando ? 'SALVANDO...' : '▶ CRIAR OS'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', alignItems:'center' }}>
        {[['todos','TODAS'],['aguardando','AGUARDANDO'],['aprovado','APROVADO'],['em_servico','EM SERVIÇO'],['concluido','CONCLUÍDO'],['entregue','ENTREGUE'],['cancelado', 'CANCELADA']].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)}
            className={filtro===v?'btn btn-primary':'btn btn-secondary'}
            style={{fontSize:'0.65rem',padding:'0.3rem 0.625rem'}}>{l}</button>
        ))}
        <input className="campo" placeholder="🔍 BUSCAR OS, CLIENTE, EQUIP. OU TÉCNICO..."
          style={{flex:1,maxWidth:'280px'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loadingEmpresa || loadingOS ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO ORDENS<span className="blink">_</span></p>
        </div>
      ) : !empresaId ? (
        <div className="alerta alerta-perigo" style={{ margin: '1rem' }}>
          Empresa não vinculada ou erro de autenticação. Por favor, tente recarregar a página ou faça login novamente.
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
          <p style={{fontSize:'0.7rem',letterSpacing:'0.1em',fontWeight:700,marginBottom:'0.375rem'}}>
            {busca||filtro!=='todos' ? '[ NENHUMA OS ENCONTRADA ]' : '[ NENHUMA OS REGISTRADA ]'}
          </p>
          {!busca&&filtro==='todos'&&(
            <button onClick={()=>setShowForm(true)} className="btn btn-primary" style={{marginTop:'0.5rem',fontSize:'0.72rem'}}>+ CRIAR PRIMEIRA OS</button>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>CLIENTE</th>
                <th>EQUIPAMENTO</th>
                <th>DEFEITO RELATADO</th>
                <th>TÉCNICO</th>
                <th style={{textAlign:'right'}}>ORÇAMENTO</th>
                <th>PREVISÃO</th>
                <th style={{textAlign:'center'}}>STATUS</th>
                <th style={{textAlign:'center'}}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(o => (
                <tr key={o.id}>
                  <td style={{color:'var(--texto-mono)',fontWeight:700,fontSize:'0.75rem'}}>
                    #{String(o.numero||'').padStart(4,'0')}
                  </td>
                  <td>
                    <div style={{fontWeight:700,fontSize:'0.82rem'}}>{o.cliente_nome}</div>
                    {o.cliente_tel && (
                      <a href={`https://wa.me/55${o.cliente_tel.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        style={{fontSize:'0.65rem',color:'var(--verde)',fontWeight:600}}>
                        📱 {o.cliente_tel}
                      </a>
                    )}
                  </td>
                  <td style={{fontWeight:600,fontSize:'0.78rem'}}>{o.equipamento}</td>
                  <td style={{fontSize:'0.72rem',color:'var(--texto-desab)',maxWidth:'160px'}}>
                    <span title={o.defeito_relatado} style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {o.defeito_relatado}
                    </span>
                  </td>
                  <td style={{fontSize:'0.72rem',color:'var(--texto-sec)',fontWeight:500}}>{o.tecnico||'—'}</td>
                  <td style={{textAlign:'right',fontWeight:700,color:'var(--verde)',fontVariantNumeric:'tabular-nums'}}>
                    {o.orcamento ? formatCurrency(o.orcamento) : '—'}
                  </td>
                  <td style={{fontSize:'0.72rem',color:o.previsao && o.previsao < new Date().toISOString().slice(0,10) && !['concluido', 'entregue', 'cancelado'].includes(o.status) ? 'var(--vermelho)':'var(--texto-desab)', fontWeight: o.previsao && o.previsao < new Date().toISOString().slice(0,10) ? 600 : 400}}>
                    {o.previsao ? new Date(o.previsao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span className={`tag ${STATUS_CLS[o.status] || 'tag-cinza'}`} style={{fontSize:'0.65rem',fontWeight:700}}>
                      {STATUS_LABEL[o.status]||o.status}
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <div style={{display:'flex',gap:'0.25rem',justifyContent:'center',alignItems:'center'}}>
                      <a href={`/ordens-de-servico/${o.id}`} className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem'}}>
                        VER DETALHES
                      </a>
                      {FLUXO[o.status] && (
                        <button onClick={()=>avancar(o.id,o.status)}
                          className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem',fontWeight:600}}>
                          → {STATUS_LABEL[FLUXO[o.status]]}
                        </button>
                      )}
                      {!['entregue','cancelado'].includes(o.status) && (
                        <button onClick={()=>cancelar(o.id)}
                          className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem',color:'var(--vermelho)',borderColor:'var(--vermelho-claro)'}}>
                          ✕ CANCELAR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
