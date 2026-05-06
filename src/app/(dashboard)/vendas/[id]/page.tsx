'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

type ItemVenda = { nome: string; sku: string; qty: number; precoUnit: number; brinde: boolean; garantia: string; serie: string }
type Venda = {
  id: string; num: string; data: string; vendedor: string; puxador: string
  pagamento: string; troco: number; desconto: number; subtotal: number; total: number
  cliente: { nome: string; cpf: string; telefone: string }
  itens: ItemVenda[]
  loja: { nome: string; telefone: string; endereco: string }
}

const loja = { nome: 'Eletrônicos do João', telefone: '(11) 99999-0000', endereco: 'R. 25 de Março, 500 — São Paulo/SP' }

const mockVendas: Record<string, Venda> = {
  '42': {
    id: '42', num: '0042', data: '2026-05-05T13:45:00', vendedor: 'Admin', puxador: 'Carlos',
    pagamento: 'PIX', troco: 0, desconto: 0, subtotal: 850, total: 850,
    cliente: { nome: 'João Silva', cpf: '123.456.789-00', telefone: '(11) 98888-0001' },
    itens: [{ nome: 'Som JBL Stage 200', sku: 'JBL001', qty: 1, precoUnit: 850, brinde: false, garantia: '90 dias', serie: 'SN-123456' }],
    loja,
  },
  '41': {
    id: '41', num: '0041', data: '2026-05-05T12:20:00', vendedor: 'Admin', puxador: '',
    pagamento: 'Crédito', troco: 0, desconto: 50, subtotal: 400, total: 350,
    cliente: { nome: 'Maria Souza', cpf: '', telefone: '(11) 98888-0002' },
    itens: [
      { nome: 'Câmera de Ré Universal', sku: 'CAM001', qty: 1, precoUnit: 120, brinde: false, garantia: '30 dias', serie: 'SN-999002' },
      { nome: 'Cabo RCA 5m',            sku: 'CAB001', qty: 2, precoUnit: 25,  brinde: false, garantia: '',         serie: '' },
      { nome: 'Suporte Celular',        sku: 'SUP001', qty: 1, precoUnit: 30,  brinde: true,  garantia: '',         serie: '' },
    ],
    loja,
  },
}

export default function ReciboPage() {
  const params = useParams()
  const id     = String(params?.id ?? '42')
  const v      = mockVendas[id] ?? mockVendas['42']

  const waMsg = encodeURIComponent(`Olá ${v.cliente.nome}! Segue seu recibo da venda #${v.num} — ${formatCurrency(v.total)}. Obrigado pela compra! 🛒`)

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Barra de ações */}
      <div className="pg-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/vendas" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">🧾 Recibo #{v.num}</h1>
            <p className="pg-sub">{formatDateTime(v.data)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {v.cliente.telefone && (
            <a href={`https://wa.me/55${v.cliente.telefone.replace(/\D/g,'')}?text=${waMsg}`}
               target="_blank" rel="noopener noreferrer"
               className="btn" style={{ background: '#25D366', color: '#fff', border: 'none', fontWeight: 700 }}>
              💬 Enviar WhatsApp
            </a>
          )}
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* Recibo */}
      <div id="recibo" className="card" style={{ maxWidth: '580px' }}>

        {/* Loja */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--borda)', paddingBottom: '0.875rem', marginBottom: '0.875rem' }}>
          <p style={{ fontWeight: 900, fontSize: '1.125rem' }}>{v.loja.nome}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--texto-sec)' }}>{v.loja.endereco}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--texto-sec)' }}>Tel: {v.loja.telefone}</p>
        </div>

        {/* Número */}
        <div style={{ textAlign: 'center', marginBottom: '0.875rem' }}>
          <p style={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--texto-desab)' }}>Recibo de Venda</p>
          <p style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--verde)', lineHeight: 1 }}>#{v.num}</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--texto-sec)', marginTop: '4px' }}>{formatDateTime(v.data)}</p>
        </div>

        {/* Cliente */}
        {v.cliente.nome && (
          <div style={{ border: '1px solid var(--borda)', borderRadius: 'var(--radius-sm)', padding: '0.625rem 0.875rem', marginBottom: '0.875rem', background: 'var(--surface-alt)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--texto-desab)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Cliente</p>
            <p style={{ fontWeight: 700 }}>{v.cliente.nome}</p>
            {v.cliente.cpf && <p style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>CPF: {v.cliente.cpf}</p>}
            <p style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>Tel: {v.cliente.telefone}</p>
          </div>
        )}

        {/* Itens */}
        <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--texto-desab)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Itens</p>
        <div style={{ border: '1px solid var(--borda)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '0.875rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#2c3e50' }}>
                <th style={{ padding: '0.375rem 0.75rem', textAlign: 'left', color: '#c8d6e5', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Produto</th>
                <th style={{ padding: '0.375rem 0.5rem', textAlign: 'center', color: '#c8d6e5', fontWeight: 700, fontSize: '0.68rem' }}>Qtd</th>
                <th style={{ padding: '0.375rem 0.75rem', textAlign: 'right', color: '#c8d6e5', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {v.itens.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--borda-leve)', background: i % 2 === 0 ? '#fff' : 'var(--surface-alt)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      {item.brinde && '🎁 '}
                      {item.nome}
                      {item.brinde && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--verde)', background: 'var(--verde-claro)', padding: '1px 5px', borderRadius: '2px' }}>BRINDE</span>
                      )}
                    </p>
                    {item.serie    && <p style={{ fontSize: '0.7rem', color: 'var(--texto-desab)', marginTop: '2px' }}>Série: {item.serie}</p>}
                    {item.garantia && <p style={{ fontSize: '0.7rem', color: 'var(--verde)', marginTop: '2px' }}>🛡 Garantia: {item.garantia}</p>}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace' }}>
                    {item.brinde
                      ? <span style={{ color: 'var(--verde)', fontSize: '0.78rem', fontWeight: 900 }}>BRINDE</span>
                      : formatCurrency(item.precoUnit * item.qty)
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div style={{ border: '1px solid var(--borda)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 0.875rem', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--texto-sec)' }}>Subtotal</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(v.subtotal)}</span>
          </div>
          {v.desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--vermelho)' }}>Desconto</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--vermelho)', fontWeight: 600 }}>- {formatCurrency(v.desconto)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--borda)', paddingTop: '0.5rem', marginTop: '0.375rem' }}>
            <span style={{ fontWeight: 900, fontSize: '1rem' }}>TOTAL</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.5rem', color: 'var(--verde)', lineHeight: 1 }}>{formatCurrency(v.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--texto-sec)' }}>Pagamento</span>
            <span style={{ fontWeight: 700 }}>{v.pagamento}</span>
          </div>
          {v.troco > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--texto-sec)' }}>Troco</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(v.troco)}</span>
            </div>
          )}
          {v.puxador && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', paddingTop: '0.375rem', borderTop: '1px dashed var(--borda-leve)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--texto-desab)' }}>Indicado por</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--azul)' }}>{v.puxador}</span>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ borderTop: '1px dashed var(--borda)', paddingTop: '0.75rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--texto-sec)' }}>Documento emitido via <strong>NexoCommerce</strong></p>
          <p style={{ fontSize: '0.68rem', color: 'var(--texto-desab)', marginTop: '2px' }}>Autenticidade: nexocommerce.app/verificar/{v.num}</p>
        </div>
      </div>

      {/* Garantias */}
      {v.itens.some(i => i.garantia) && (
        <div className="card anim-fade" style={{ maxWidth: '580px', border: '2px solid var(--verde-borda)', background: 'var(--verde-claro)' }}>
          <p style={{ fontWeight: 800, marginBottom: '0.625rem', color: 'var(--verde-esc)' }}>🛡️ Termos de Garantia</p>
          {v.itens.filter(i => i.garantia).map((item, i) => (
            <div key={i} style={{ padding: '0.5rem 0', borderBottom: i < v.itens.filter(x => x.garantia).length - 1 ? '1px solid var(--verde-borda)' : 'none' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.nome}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--verde-esc)', marginTop: '2px' }}>
                Garantia de <strong>{item.garantia}</strong> contra defeitos de fabricação. O produto deve ser utilizado conforme o manual do fabricante.
              </p>
              {item.serie && <p style={{ fontSize: '0.72rem', color: 'var(--texto-sec)', marginTop: '2px' }}>Nº de Série: <strong>{item.serie}</strong></p>}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #recibo { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
