'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

type Garantia = {
  num: string; produto: string; serie: string; cliente: { nome: string; cpf: string; tel: string }
  dataCompra: string; vencimento: string; diasPrazo: number; termos: string
  loja: { nome: string; tel: string; endereco: string }
}

const mock: Record<string, Garantia> = {
  '1': {
    num: '0001', produto: 'Som JBL Stage 200', serie: 'SN-123456',
    cliente: { nome: 'João Silva', cpf: '123.456.789-00', tel: '(11) 98888-0001' },
    dataCompra: '2026-05-02', vencimento: '2026-08-02', diasPrazo: 90,
    termos: 'Garantia contra defeitos de fabricação pelo prazo indicado. A garantia não cobre danos causados por mau uso, quedas, líquidos, instalação inadequada ou desgaste natural. Para acionar a garantia, o cliente deve apresentar este documento e o produto original.',
    loja: { nome: 'Eletrônicos do João', tel: '(11) 99999-0000', endereco: 'R. 25 de Março, 500 — São Paulo/SP' }
  },
  '2': {
    num: '0002', produto: 'Amplificador Taramps DS800', serie: 'SN-654321',
    cliente: { nome: 'Carlos Lima', cpf: '', tel: '(11) 98888-0003' },
    dataCompra: '2026-04-10', vencimento: '2026-07-10', diasPrazo: 90,
    termos: 'Garantia contra defeitos de fabricação pelo prazo indicado. Não cobre danos por mau uso ou instalação incorreta.',
    loja: { nome: 'Eletrônicos do João', tel: '(11) 99999-0000', endereco: 'R. 25 de Março, 500 — São Paulo/SP' }
  }
}

export default function DocumentoGarantiaPage() {
  const params = useParams()
  const id = String(params?.id ?? '1')
  const g = mock[id] ?? mock['1']

  const hoje = new Date()
  const venc = new Date(g.vencimento)
  const diasRestantes = Math.ceil((venc.getTime() - hoje.getTime()) / (1000*60*60*24))
  const vencida = diasRestantes < 0

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>

      {/* Ações */}
      <div className="pg-header no-print">
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
          <Link href="/garantias" className="btn btn-secondary" style={{ padding:'0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">🛡️ Certificado de Garantia #{g.num}</h1>
            <p className="pg-sub">{g.produto} · {g.cliente.nome}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <a href={`https://wa.me/55${g.cliente.tel.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${g.cliente.nome}! Segue seu certificado de garantia do produto ${g.produto}. Qualquer dúvida, estou à disposição.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn" style={{ background:'#25D366', color:'#fff', border:'none', fontWeight:700 }}>
            💬 WhatsApp
          </a>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* Alerta de status */}
      {!vencida && diasRestantes <= 30 && (
        <div className="alerta alerta-aviso no-print">
          <span>⚠️</span>
          <span>Esta garantia vence em <strong>{diasRestantes} dias</strong> ({formatDate(g.vencimento)}). Considere avisar o cliente.</span>
        </div>
      )}
      {vencida && (
        <div className="alerta alerta-perigo no-print">
          <span>✕</span>
          <span>Esta garantia está <strong>vencida</strong> desde {formatDate(g.vencimento)}.</span>
        </div>
      )}

      {/* Certificado */}
      <div id="certificado" className="card" style={{ maxWidth:'600px' }}>

        {/* Cabeçalho */}
        <div style={{ textAlign:'center', borderBottom:'3px solid var(--verde)', paddingBottom:'0.875rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
            <span style={{ fontSize:'1.75rem' }}>🛡️</span>
            <span style={{ fontWeight:900, fontSize:'1.375rem', color:'var(--verde)' }}>CERTIFICADO DE GARANTIA</span>
          </div>
          <p style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--texto-sec)' }}>{g.loja.nome}</p>
          <p style={{ fontSize:'0.78rem', color:'var(--texto-desab)' }}>{g.loja.endereco} · Tel: {g.loja.tel}</p>
        </div>

        {/* Produto */}
        <div style={{ border:'2px solid var(--verde-borda)', borderRadius:'var(--radius-sm)', padding:'0.875rem 1rem', marginBottom:'0.875rem', background:'var(--verde-claro)' }}>
          <p style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>Produto</p>
          <p style={{ fontWeight:900, fontSize:'1.125rem', color:'var(--verde-esc)' }}>{g.produto}</p>
          {g.serie && <p style={{ fontSize:'0.82rem', color:'var(--texto-sec)', marginTop:'2px' }}>Nº de Série: <strong style={{ fontFamily:'monospace' }}>{g.serie}</strong></p>}
        </div>

        {/* Cliente */}
        <div style={{ border:'1px solid var(--borda)', borderRadius:'var(--radius-sm)', padding:'0.75rem 0.875rem', marginBottom:'0.875rem', background:'var(--surface-alt)' }}>
          <p style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>Proprietário</p>
          <p style={{ fontWeight:700 }}>{g.cliente.nome}</p>
          {g.cliente.cpf && <p style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>CPF: {g.cliente.cpf}</p>}
          <p style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>Tel: {g.cliente.tel}</p>
        </div>

        {/* Vigência */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem', marginBottom:'0.875rem' }}>
          {[
            { label:'Data da Compra', valor:formatDate(g.dataCompra), cor:'var(--texto)' },
            { label:'Validade até',   valor:formatDate(g.vencimento),  cor: vencida?'var(--vermelho)':'var(--verde)' },
            { label:'Prazo',          valor:`${g.diasPrazo} dias`,     cor:'var(--azul)' },
          ].map(d => (
            <div key={d.label} style={{ textAlign:'center', padding:'0.625rem', border:'1px solid var(--borda)', borderRadius:'var(--radius-sm)', background:'var(--surface-alt)' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--texto-desab)', textTransform:'uppercase', marginBottom:'4px' }}>{d.label}</p>
              <p style={{ fontWeight:900, fontSize:'0.95rem', color:d.cor }}>{d.valor}</p>
            </div>
          ))}
        </div>

        {/* Status vigência */}
        <div style={{ textAlign:'center', padding:'0.625rem', marginBottom:'0.875rem', borderRadius:'var(--radius-sm)',
          background: vencida ? '#fef2f2' : 'var(--verde-claro)',
          border: `2px solid ${vencida ? 'var(--vermelho)' : 'var(--verde)'}` }}>
          <p style={{ fontWeight:900, fontSize:'0.9rem', color: vencida ? 'var(--vermelho)' : 'var(--verde)' }}>
            {vencida ? `✕ GARANTIA VENCIDA` : `✓ GARANTIA ATIVA — ${diasRestantes} dias restantes`}
          </p>
        </div>

        {/* Termos */}
        <div style={{ marginBottom:'1rem' }}>
          <p style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>Termos e Condições</p>
          <p style={{ fontSize:'0.82rem', color:'var(--texto-sec)', lineHeight:'1.6' }}>{g.termos}</p>
        </div>

        {/* Assinatura e rodapé */}
        <div style={{ borderTop:'2px dashed var(--borda)', paddingTop:'0.875rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ height:'40px', borderBottom:'1px solid var(--borda)', marginBottom:'4px' }} />
              <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)' }}>Assinatura do Vendedor</p>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ height:'40px', borderBottom:'1px solid var(--borda)', marginBottom:'4px' }} />
              <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)' }}>Assinatura do Cliente</p>
            </div>
          </div>
          <p style={{ fontSize:'0.68rem', color:'var(--texto-desab)', textAlign:'center', marginTop:'0.75rem' }}>
            Certificado gerado via NexoCommerce · Verificar em nexocommerce.app/garantia/{g.num}
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #certificado { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
