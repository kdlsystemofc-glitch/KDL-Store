'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Loader2, Save, Camera, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Empresa = {
  id: string; nome: string; slug: string | null; cnpj: string | null
  telefone: string | null; email: string | null; whatsapp: string | null
  instagram: string | null; plano: string
  // Endereço estruturado (mesmo formato dos fornecedores)
  cep: string | null; rua: string | null; numero: string | null
  bairro: string | null; complemento: string | null
  cidade: string | null; estado: string | null; endereco: string | null
  // Logo da loja
  logo_url: string | null
}

const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function ConfigEmpresaPage() {
  const { empresaId } = useEmpresaId()
  const [empresa,   setEmpresa]   = useState<Empresa | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [logoFile,  setLogoFile]  = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient().from('empresas').select('*').eq('id', eid).single()
    setEmpresa(data)
    if (data?.logo_url) setLogoPreview(data.logo_url)
    setLoading(false)
  }

  async function buscarCep(cepVal: string) {
    const limpo = cepVal.replace(/\D/g, '')
    if (limpo.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
      const data = await res.json()
      if (data.erro) { toast.error('CEP não encontrado.'); return }
      setEmpresa(prev => prev ? {
        ...prev,
        cep: cepVal,
        rua: data.logradouro || prev.rua || '',
        bairro: data.bairro || prev.bairro || '',
        cidade: data.localidade || prev.cidade || '',
        estado: data.uf || prev.estado || ''
      } : prev)
      toast.success('Endereço preenchido automaticamente!')
    } catch {
      toast.error('Erro ao buscar CEP.')
    } finally {
      setBuscandoCep(false)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo não pode ter mais de 2MB.'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removerLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setEmpresa(prev => prev ? { ...prev, logo_url: null } : prev)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function salvar() {
    if (!empresa || !empresaId) return
    if (!empresa.nome.trim()) { toast.error('O nome da loja é obrigatório.'); return }
    setSalvando(true)

    let logoUrl = empresa.logo_url

    // Upload da logo se selecionada
    if (logoFile) {
      try {
        const fd = new FormData()
        fd.append('file', logoFile)
        fd.append('empresaId', empresaId)
        const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          toast.error('Erro no upload da logo: ' + (json.error ?? res.statusText))
          setSalvando(false)
          return
        }
        logoUrl = json.url as string
      } catch {
        toast.error('Erro ao enviar logo.')
        setSalvando(false)
        return
      }
    }

    // Monta endereço composto para compatibilidade
    const partesEndereco = [empresa.rua, empresa.numero, empresa.bairro, empresa.complemento].filter(Boolean)
    const enderecoComosto = partesEndereco.join(', ')

    const { error } = await createClient().from('empresas').update({
      nome:        empresa.nome,
      slug:        empresa.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || null,
      cnpj:        empresa.cnpj || null,
      telefone:    empresa.telefone || null,
      email:       empresa.email || null,
      whatsapp:    empresa.whatsapp || null,
      instagram:   empresa.instagram || null,
      // Endereço estruturado
      cep:         empresa.cep || null,
      rua:         empresa.rua || null,
      numero:      empresa.numero || null,
      bairro:      empresa.bairro || null,
      complemento: empresa.complemento || null,
      cidade:      empresa.cidade || null,
      estado:      empresa.estado || null,
      endereco:    enderecoComosto || null,
      // Logo
      logo_url:    logoUrl || null,
    }).eq('id', empresaId)

    setSalvando(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    setLogoFile(null)
    if (logoUrl) setLogoPreview(logoUrl)
    toast.success('Configurações da empresa salvas com sucesso!')
  }

  const inp: React.CSSProperties = { width: '100%', marginTop: '0.375rem' }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--texto-desab)' }}>
      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
    </div>
  )

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '680px' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🏪 Dados da Empresa</h1>
          <p className="pg-sub">Informações da sua loja · Plano: <strong style={{ color: 'var(--verde)' }}>{empresa?.plano || 'essencial'}</strong></p>
        </div>
      </div>

      {empresa && (
        <>
          <div className="card" style={{ padding: '2rem' }}>

            {/* ─── Logo da Loja ─────────────────────────────── */}
            <h2 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2px solid var(--borda)', paddingBottom: '0.5rem' }}>🖼️ Logo da Loja</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Preview */}
              <div style={{
                width: '96px', height: '96px', borderRadius: '12px',
                background: logoPreview ? 'transparent' : 'var(--fundo)',
                border: '2px dashed var(--borda)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
                cursor: 'pointer',
              }} onClick={() => logoInputRef.current?.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--texto-desab)' }}>
                    <Camera size={28} />
                    <p style={{ fontSize: '0.62rem', marginTop: '4px' }}>Logo</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleLogoChange} />
                <button type="button" onClick={() => logoInputRef.current?.click()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem' }}>
                  <Camera size={14} /> {logoPreview ? 'Trocar Logo' : 'Enviar Logo'}
                </button>
                {logoPreview && (
                  <button type="button" onClick={removerLogo} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: 'var(--vermelho)' }}>
                    <X size={14} /> Remover Logo
                  </button>
                )}
                <p style={{ fontSize: '0.68rem', color: 'var(--texto-desab)' }}>PNG, JPG ou WEBP · Máx. 2MB</p>
              </div>
            </div>

            {/* ─── Identificação ─────────────────────────────── */}
            <h2 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2px solid var(--borda)', paddingBottom: '0.5rem' }}>🏷️ Identificação</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label className="campo-label">Nome da loja *</label>
                <input className="campo" style={inp} value={empresa.nome} onChange={e => setEmpresa(em => em ? { ...em, nome: e.target.value } : em)} placeholder="Nome da sua loja" />
              </div>
              <div>
                <label className="campo-label">Link do catálogo (URL única)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--texto-desab)' }}>loja/</span>
                  <input className="campo" style={{ flex: 1 }} value={empresa.slug || ''} onChange={e => setEmpresa(em => em ? { ...em, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') } : em)} placeholder="minha-loja" />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--texto-sec)', marginTop: '0.25rem' }}>Apenas letras, números e hífens.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="campo-label">CNPJ / CPF</label>
                  <input className="campo" style={{ ...inp, fontFamily: 'monospace' }} value={empresa.cnpj || ''} onChange={e => setEmpresa(em => em ? { ...em, cnpj: e.target.value } : em)} placeholder="00.000.000/0001-00" />
                </div>
                <div>
                  <label className="campo-label">E-mail</label>
                  <input className="campo" type="email" style={inp} value={empresa.email || ''} onChange={e => setEmpresa(em => em ? { ...em, email: e.target.value } : em)} placeholder="contato@loja.com" />
                </div>
              </div>
            </div>

            {/* ─── Localização (CEP + ViaCEP) ─────────────────── */}
            <h2 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2px solid var(--borda)', paddingBottom: '0.5rem' }}>📍 Localização</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {/* CEP com busca automática */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label className="campo-label">CEP</label>
                  <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                    <input
                      className="campo"
                      style={{ fontFamily: 'monospace', paddingRight: buscandoCep ? '2rem' : undefined }}
                      maxLength={9}
                      value={empresa.cep || ''}
                      onChange={e => setEmpresa(em => em ? { ...em, cep: e.target.value } : em)}
                      onBlur={e => buscarCep(e.target.value)}
                      placeholder="00000-000"
                    />
                    {buscandoCep && (
                      <Loader2 size={14} style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite', color: 'var(--verde)' }} />
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--texto-sec)', paddingBottom: '0.5rem' }}>
                  ↑ Informe o CEP para preencher o endereço automaticamente
                </p>
              </div>

              {/* Rua + Número */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem' }}>
                <div>
                  <label className="campo-label">Rua / Logradouro</label>
                  <input className="campo" style={inp} value={empresa.rua || ''} onChange={e => setEmpresa(em => em ? { ...em, rua: e.target.value } : em)} placeholder="Rua, Av., Travessa..." />
                </div>
                <div>
                  <label className="campo-label">Número</label>
                  <input className="campo" style={inp} value={empresa.numero || ''} onChange={e => setEmpresa(em => em ? { ...em, numero: e.target.value } : em)} placeholder="Ex: 123" />
                </div>
              </div>

              {/* Bairro + Complemento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="campo-label">Bairro</label>
                  <input className="campo" style={inp} value={empresa.bairro || ''} onChange={e => setEmpresa(em => em ? { ...em, bairro: e.target.value } : em)} placeholder="Bairro" />
                </div>
                <div>
                  <label className="campo-label">Complemento</label>
                  <input className="campo" style={inp} value={empresa.complemento || ''} onChange={e => setEmpresa(em => em ? { ...em, complemento: e.target.value } : em)} placeholder="Sala, Bloco, Apto..." />
                </div>
              </div>

              {/* Cidade + Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                <div>
                  <label className="campo-label">Cidade</label>
                  <input className="campo" style={inp} value={empresa.cidade || ''} onChange={e => setEmpresa(em => em ? { ...em, cidade: e.target.value } : em)} placeholder="Cidade" />
                </div>
                <div>
                  <label className="campo-label">Estado</label>
                  <select className="campo" style={{ ...inp, width: '120px' }} value={empresa.estado || ''} onChange={e => setEmpresa(em => em ? { ...em, estado: e.target.value } : em)}>
                    <option value="">UF</option>
                    {ESTADOS_BR.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ─── Contato e Redes ──────────────────────────── */}
            <h2 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.25rem', borderBottom: '2px solid var(--borda)', paddingBottom: '0.5rem' }}>📱 Contato e Redes Sociais</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="campo-label">WhatsApp</label>
                  <input className="campo" style={inp} value={empresa.whatsapp || ''} onChange={e => setEmpresa(em => em ? { ...em, whatsapp: e.target.value } : em)} placeholder="(11) 99999-0000" />
                </div>
                <div>
                  <label className="campo-label">Telefone fixo</label>
                  <input className="campo" style={inp} value={empresa.telefone || ''} onChange={e => setEmpresa(em => em ? { ...em, telefone: e.target.value } : em)} placeholder="(11) 3333-0000" />
                </div>
              </div>
              <div>
                <label className="campo-label">Instagram</label>
                <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                  <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)', fontWeight: 600 }}>@</span>
                  <input className="campo" style={{ paddingLeft: '1.75rem' }} value={empresa.instagram || ''} onChange={e => setEmpresa(em => em ? { ...em, instagram: e.target.value } : em)} placeholder="sualojaoficial" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '2px solid var(--borda)' }}>
              <button onClick={salvar} disabled={salvando} className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.875rem 2rem', fontSize: '1.1rem', fontWeight: 900 }}>
                {salvando ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />Salvando...</> : <><Save size={20} />Salvar Alterações</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
