'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Save, Loader2 } from 'lucide-react'

const CATEGORIAS_FORN = ['Eletrônicos','Acessórios','Autopeças','Serviços','Embalagens','Outros']
const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export function FormFornecedor({ onSuccess, onCancel }: { onSuccess: () => void; onCancel?: () => void }) {
  const { empresaId } = useEmpresaId()
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState<string|null>(null)

  async function salvar() {
    const nome = (document.getElementById('f-nome') as HTMLInputElement)?.value?.trim()
    if (!nome) { setErro('O nome do fornecedor é obrigatório.'); return }
    if (!empresaId) return
    setSalvando(true); setErro(null)
    const { error } = await createClient().from('fornecedores').insert({
      empresa_id:     empresaId,
      nome,
      contato:        (document.getElementById('f-contato')  as HTMLInputElement)?.value || null,
      telefone:       (document.getElementById('f-tel')      as HTMLInputElement)?.value || null,
      email:          (document.getElementById('f-email')    as HTMLInputElement)?.value || null,
      cnpj:           (document.getElementById('f-cnpj')     as HTMLInputElement)?.value || null,
      categoria:      (document.getElementById('f-cat')      as HTMLSelectElement)?.value || null,
      endereco:       (document.getElementById('f-endereco') as HTMLInputElement)?.value || null,
      cidade:         (document.getElementById('f-cidade')   as HTMLInputElement)?.value || null,
      estado:         (document.getElementById('f-estado')   as HTMLSelectElement)?.value || null,
      prazo_entrega:  (document.getElementById('f-prazo')    as HTMLInputElement)?.value || null,
      pedido_minimo:  parseFloat((document.getElementById('f-pedmin') as HTMLInputElement)?.value)||null,
      anotacoes:      (document.getElementById('f-obs')      as HTMLTextAreaElement)?.value || null,
      ativo: true,
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: '+error.message); return }
    onSuccess()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        <div>
          <label className="campo-label">Nome da empresa *</label>
          <input id="f-nome" className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: JBL Distribuidora SP"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
          <div>
            <label className="campo-label">Nome do contato</label>
            <input id="f-contato" className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: Sandro"/>
          </div>
          <div>
            <label className="campo-label">CNPJ</label>
            <input id="f-cnpj" className="campo" style={{marginTop:'0.375rem',fontFamily:'monospace'}} placeholder="00.000.000/0001-00"/>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
          <div>
            <label className="campo-label">Telefone / WhatsApp</label>
            <input id="f-tel" className="campo" style={{marginTop:'0.375rem'}} placeholder="(11) 99999-0000"/>
          </div>
          <div>
            <label className="campo-label">E-mail</label>
            <input id="f-email" className="campo" type="email" style={{marginTop:'0.375rem'}} placeholder="vendas@empresa.com"/>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
          <div>
            <label className="campo-label">Categoria</label>
            <select id="f-cat" className="campo" style={{marginTop:'0.375rem'}}>
              <option value="">Selecionar...</option>
              {CATEGORIAS_FORN.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="campo-label">Prazo de entrega</label>
            <input id="f-prazo" className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: 24h, 3 dias úteis"/>
          </div>
        </div>
        <div>
          <label className="campo-label">Endereço completo</label>
          <input id="f-endereco" className="campo" style={{marginTop:'0.375rem'}} placeholder="Rua, número, bairro"/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'0.625rem'}}>
          <div>
            <label className="campo-label">Cidade</label>
            <input id="f-cidade" className="campo" style={{marginTop:'0.375rem'}} placeholder="Cidade"/>
          </div>
          <div>
            <label className="campo-label">Estado</label>
            <select id="f-estado" className="campo" style={{marginTop:'0.375rem',width:'90px'}}>
              <option value="">UF</option>
              {ESTADOS_BR.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="campo-label">Pedido mínimo (R$)</label>
          <div style={{position:'relative',marginTop:'0.375rem'}}>
            <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)'}}>R$</span>
            <input id="f-pedmin" className="campo" type="number" step="0.01" min="0" style={{paddingLeft:'2rem'}} placeholder="0,00"/>
          </div>
        </div>
        <div>
          <label className="campo-label">Anotações</label>
          <textarea id="f-obs" className="campo" rows={2} style={{marginTop:'0.375rem',resize:'none'}} placeholder="Condições especiais, observações..."/>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.5rem' }}>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
        <button onClick={salvar} disabled={salvando} className="btn btn-primary"
          style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
          {salvando?<><Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:<><Save size={15}/>Salvar fornecedor</>}
        </button>
      </div>
    </div>
  )
}
