'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Loader2, Save } from 'lucide-react'

type Empresa = { id:string; nome:string; slug:string|null; cnpj:string|null; telefone:string|null; email:string|null; cidade:string|null; estado:string|null; endereco:string|null; whatsapp:string|null; instagram:string|null; plano:string }

const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function ConfigEmpresaPage() {
  const { empresaId } = useEmpresaId()
  const [empresa,  setEmpresa]  = useState<Empresa|null>(null)
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso,  setSucesso]  = useState(false)
  const [erro,     setErro]     = useState<string|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient().from('empresas').select('*').eq('id',eid).single()
    setEmpresa(data)
    setLoading(false)
  }

  async function salvar() {
    if (!empresa || !empresaId) return
    if (!empresa.nome.trim()) { setErro('O nome da loja é obrigatório.'); return }
    setSalvando(true); setErro(null)
    const { error } = await createClient().from('empresas').update({
      nome: empresa.nome, slug: empresa.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || null, cnpj: empresa.cnpj||null, telefone: empresa.telefone||null,
      email: empresa.email||null, cidade: empresa.cidade||null, estado: empresa.estado||null,
      endereco: empresa.endereco||null, whatsapp: empresa.whatsapp||null, instagram: empresa.instagram||null,
    }).eq('id', empresaId)
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: '+error.message); return }
    setSucesso(true)
    setTimeout(()=>setSucesso(false), 3000)
  }

  const inp: React.CSSProperties = { width:'100%', marginTop:'0.375rem' }

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
      <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando...
    </div>
  )

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'680px'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🏪 Dados da Empresa</h1>
          <p className="pg-sub">Informações da sua loja · Plano: <strong style={{color:'var(--verde)'}}>{empresa?.plano||'essencial'}</strong></p>
        </div>
      </div>

      {erro&&<div className="alerta alerta-perigo">{erro}</div>}
      {sucesso&&<div className="alerta alerta-ok" style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>✅ Dados salvos com sucesso!</div>}

      {empresa&&(
        <>
          <div className="card" style={{padding:'2rem'}}>
            <h2 style={{fontSize:'1.2rem',fontWeight:900,marginBottom:'1.5rem',borderBottom:'2px solid var(--borda)',paddingBottom:'0.5rem'}}>🏷️ Identificação</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'2rem'}}>
              <div>
                <label className="campo-label">Nome da loja *</label>
                <input className="campo" style={inp} value={empresa.nome} onChange={e=>setEmpresa(em=>em?{...em,nome:e.target.value}:em)} placeholder="Nome da sua loja"/>
              </div>
              <div>
                <label className="campo-label">Link do catálogo (URL única)</label>
                <div style={{display:'flex', alignItems:'center', gap:'0.375rem', marginTop:'0.375rem'}}>
                  <span style={{fontSize:'0.82rem', color:'var(--texto-desab)'}}>loja/</span>
                  <input className="campo" style={{flex:1}} value={empresa.slug||''} onChange={e=>setEmpresa(em=>em?{...em,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}:em)} placeholder="minha-loja"/>
                </div>
                <p style={{fontSize:'0.72rem', color:'var(--texto-sec)', marginTop:'0.25rem'}}>Apenas letras, números e hífens.</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div>
                  <label className="campo-label">CNPJ / CPF</label>
                  <input className="campo" style={{...inp,fontFamily:'monospace'}} value={empresa.cnpj||''} onChange={e=>setEmpresa(em=>em?{...em,cnpj:e.target.value}:em)} placeholder="00.000.000/0001-00"/>
                </div>
                <div>
                  <label className="campo-label">E-mail</label>
                  <input className="campo" type="email" style={inp} value={empresa.email||''} onChange={e=>setEmpresa(em=>em?{...em,email:e.target.value}:em)} placeholder="contato@loja.com"/>
                </div>
              </div>
            </div>

            <h2 style={{fontSize:'1.2rem',fontWeight:900,marginBottom:'1.5rem',borderBottom:'2px solid var(--borda)',paddingBottom:'0.5rem'}}>📍 Localização</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'2rem'}}>
              <div>
                <label className="campo-label">Endereço completo</label>
                <input className="campo" style={inp} value={empresa.endereco||''} onChange={e=>setEmpresa(em=>em?{...em,endereco:e.target.value}:em)} placeholder="Rua, número, bairro"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'1rem'}}>
                <div>
                  <label className="campo-label">Cidade</label>
                  <input className="campo" style={inp} value={empresa.cidade||''} onChange={e=>setEmpresa(em=>em?{...em,cidade:e.target.value}:em)} placeholder="Cidade"/>
                </div>
                <div>
                  <label className="campo-label">Estado</label>
                  <select className="campo" style={{...inp,width:'120px'}} value={empresa.estado||''} onChange={e=>setEmpresa(em=>em?{...em,estado:e.target.value}:em)}>
                    <option value="">UF</option>
                    {ESTADOS_BR.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <h2 style={{fontSize:'1.2rem',fontWeight:900,marginBottom:'1.5rem',borderBottom:'2px solid var(--borda)',paddingBottom:'0.5rem'}}>📱 Contato e Redes Sociais</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'2rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div>
                  <label className="campo-label">WhatsApp</label>
                  <input className="campo" style={inp} value={empresa.whatsapp||''} onChange={e=>setEmpresa(em=>em?{...em,whatsapp:e.target.value}:em)} placeholder="(11) 99999-0000"/>
                </div>
                <div>
                  <label className="campo-label">Telefone fixo</label>
                  <input className="campo" style={inp} value={empresa.telefone||''} onChange={e=>setEmpresa(em=>em?{...em,telefone:e.target.value}:em)} placeholder="(11) 3333-0000"/>
                </div>
              </div>
              <div>
                <label className="campo-label">Instagram</label>
                <div style={{position:'relative',marginTop:'0.375rem'}}>
                  <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',color:'var(--texto-desab)',fontWeight:600}}>@</span>
                  <input className="campo" style={{paddingLeft:'1.75rem'}} value={empresa.instagram||''} onChange={e=>setEmpresa(em=>em?{...em,instagram:e.target.value}:em)} placeholder="sualojaoficial"/>
                </div>
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'1rem',paddingTop:'1.5rem',borderTop:'2px solid var(--borda)'}}>
              <button onClick={salvar} disabled={salvando} className="btn btn-primary"
                style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.875rem 2rem',fontSize:'1.1rem',fontWeight:900}}>
                {salvando?<><Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:<><Save size={20}/>Salvar Alterações</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
