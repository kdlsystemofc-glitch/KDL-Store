'use client'
import { useState } from 'react'
import { Save, Loader2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'

type EnderecoJSON = {
  cep: string; rua: string; numero: string; complemento: string
  bairro: string; cidade: string; estado: string
}

const enderecoVazio = (): EnderecoJSON => ({
  cep:'', rua:'', numero:'', complemento:'', bairro:'', cidade:'', estado:''
})

const Campo = ({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem', gridColumn: span2 ? '1 / -1' : undefined }}>
    <label style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--texto-sec)' }}>{label}</label>
    {children}
  </div>
)

export function FormCliente({ onSuccess, onCancel }: { onSuccess: () => void; onCancel?: () => void }) {
  const { empresaId } = useEmpresaId()
  const [salvando, setSalvando] = useState(false)
  const [tipo,     setTipo]     = useState<'varejo'|'atacado'|'vip'>('varejo')
  const [erro,     setErro]     = useState<string|null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Campos de texto simples
  const [nome,      setNome]      = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [cpf,       setCpf]       = useState('')
  const [email,     setEmail]     = useState('')
  const [anotacoes, setAnotacoes] = useState('')

  // Endereço estruturado
  const [end, setEnd] = useState<EnderecoJSON>(enderecoVazio())
  const setEndField = (k: keyof EnderecoJSON, v: string) => setEnd(p => ({ ...p, [k]: v }))

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setEnd(p => ({
          ...p,
          rua:    data.logradouro || p.rua,
          bairro: data.bairro     || p.bairro,
          cidade: data.localidade || p.cidade,
          estado: data.uf        || p.estado,
        }))
      }
    } catch { /* silently ignore */ }
    setBuscandoCep(false)
  }

  const salvar = async () => {
    setErro(null)
    if (!nome.trim()) { setErro('O nome do cliente é obrigatório.'); return }
    setSalvando(true)
    const supabase = createClient()
    if (!empresaId) { setErro('Erro ao identificar sua empresa.'); setSalvando(false); return }

    // Serialise address as JSON string (only if at least one field is filled)
    const endFilled = Object.values(end).some(v => v.trim() !== '')
    const endStr = endFilled ? JSON.stringify(end) : null

    const { error } = await supabase.from('clientes').insert({
      empresa_id: empresaId,
      nome:      nome.trim(),
      telefone:  telefone  || null,
      cpf:       cpf       || null,
      email:     email     || null,
      endereco:  endStr,
      anotacoes: anotacoes || null,
      tipo,
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    onSuccess()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {/* Nome */}
        <Campo label="Nome completo *">
          <input className="campo" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: João Silva"/>
        </Campo>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Campo label="Telefone / WhatsApp">
            <input className="campo" value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="(11) 99999-0000"/>
          </Campo>
          <Campo label="CPF (opcional)">
            <input className="campo" style={{ fontFamily:'monospace' }} value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00"/>
          </Campo>
        </div>

        <Campo label="E-mail (opcional)">
          <input className="campo" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.com"/>
        </Campo>

        {/* ── Endereço estruturado ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', padding:'0.75rem', background:'var(--surface-alt)', borderRadius:'var(--radius-sm)', border:'1px solid var(--borda)' }}>
          <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'0.125rem' }}>📍 Endereço (opcional)</p>

          {/* CEP com busca automática */}
          <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:'0.5rem', alignItems:'end' }}>
            <Campo label="CEP">
              <div style={{ display:'flex', gap:'0.375rem' }}>
                <input
                  className="campo"
                  style={{ fontFamily:'monospace', flex:1 }}
                  value={end.cep}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g,'').slice(0,8)
                    const fmt = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v
                    setEndField('cep', fmt)
                    if (v.length === 8) buscarCep(v)
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding:'0 0.5rem' }}
                  onClick={() => buscarCep(end.cep)}
                  disabled={buscandoCep}
                  title="Buscar CEP"
                >
                  {buscandoCep ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Search size={14}/>}
                </button>
              </div>
            </Campo>
            <Campo label="Rua / Logradouro">
              <input className="campo" value={end.rua} onChange={e=>setEndField('rua', e.target.value)} placeholder="Nome da rua"/>
            </Campo>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:'0.5rem' }}>
            <Campo label="Número">
              <input className="campo" value={end.numero} onChange={e=>setEndField('numero', e.target.value)} placeholder="Ex: 42"/>
            </Campo>
            <Campo label="Complemento">
              <input className="campo" value={end.complemento} onChange={e=>setEndField('complemento', e.target.value)} placeholder="Apto, Bloco, Sala..."/>
            </Campo>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:'0.5rem' }}>
            <Campo label="Bairro">
              <input className="campo" value={end.bairro} onChange={e=>setEndField('bairro', e.target.value)} placeholder="Bairro"/>
            </Campo>
            <Campo label="Cidade">
              <input className="campo" value={end.cidade} onChange={e=>setEndField('cidade', e.target.value)} placeholder="Cidade"/>
            </Campo>
            <Campo label="UF">
              <input className="campo" value={end.estado} onChange={e=>setEndField('estado', e.target.value.toUpperCase().slice(0,2))} placeholder="SP" maxLength={2}/>
            </Campo>
          </div>
        </div>

        <Campo label="Anotações (opcional)">
          <textarea className="campo" rows={2} style={{ resize:'none' }} value={anotacoes} onChange={e=>setAnotacoes(e.target.value)}
            placeholder="Ex: Prefere pagar no PIX, interessa por eletrônicos..."/>
        </Campo>
      </div>

      {/* Tipo de cliente */}
      <div>
        <label className="campo-label" style={{ marginBottom:'0.5rem', display:'block' }}>Tipo de Cliente</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem' }}>
          {(['varejo','atacado','vip'] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)} type="button"
              style={{
                padding:'0.75rem', borderRadius:'var(--radius-sm)',
                border:`2px solid ${tipo===t?'var(--verde)':'var(--borda)'}`,
                background: tipo===t ? 'var(--verde-claro)' : 'var(--surface)',
                cursor:'pointer', fontFamily:'inherit',
                color: tipo===t ? 'var(--verde-esc)' : 'var(--texto-sec)', fontWeight:700
              }}>
              {t==='varejo'?'🏪 Varejo':t==='atacado'?'📦 Atacado':'⭐ VIP'}
              <p style={{ fontSize:'0.68rem', fontWeight:400, marginTop:'3px', color:'inherit' }}>
                {t==='varejo'?'Preço normal':t==='atacado'?'Preço atacado':'Preço especial'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.5rem' }}>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
        <button id="btn-salvar-cliente" className="btn btn-primary" disabled={salvando} onClick={salvar}
          style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          {salvando ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Salvando...</> : <><Save size={15}/> Salvar cliente</>}
        </button>
      </div>
    </div>
  )
}
