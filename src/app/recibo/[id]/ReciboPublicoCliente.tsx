'use client'
import { useState, useEffect } from 'react'
import { Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Venda = { id:string; numero:number; cliente_nome:string|null; forma_pagamento:string; subtotal:number; desconto:number; total:number; status:string; criado_em:string; motivo_cancelamento?:string; registrado_nome?:string|null; cliente_id?:string|null; obs?:string|null }
type Item = { id:string; produto_id:string; produto_nome:string; quantidade:number; preco_unitario:number; brinde:boolean; num_serie:string|null }
type EmpresaInfo = { nome:string; cnpj:string|null; whatsapp:string|null; telefone:string|null; email:string|null; endereco:string|null; cidade:string|null; estado:string|null; logo_url:string|null }

const FORMA_ICON: Record<string,string> = { PIX:'📱', Dinheiro:'💵', Crédito:'💳', Débito:'💴', Fiado:'📒' }

function formatarEndereco(enderecoStr: string | null): string {
  if (!enderecoStr) return '—'
  if (enderecoStr.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(enderecoStr)
      const partes = [
        obj.rua && `${obj.rua}${obj.numero ? `, ${obj.numero}` : ''}`,
        obj.complemento,
        obj.bairro,
        obj.cidade && `${obj.cidade}${obj.estado ? ` - ${obj.estado}` : ''}`,
        obj.cep && `CEP ${obj.cep}`
      ].filter(Boolean)
      return partes.join(', ')
    } catch (e) {
      return enderecoStr
    }
  }
  return enderecoStr
}

export function ReciboPublicoCliente({
  venda,
  itens,
  clienteInfo,
  empresa,
  garantias,
}: {
  venda: Venda
  itens: Item[]
  clienteInfo: { nome:string; telefone:string|null; email:string|null; cpf:string|null; endereco:string|null }|null
  empresa: EmpresaInfo|null
  garantias: { id:string; produto_nome:string; num_serie:string|null; data_vencimento:string; status:string }[]
}) {
  const [qrSrc, setQrSrc] = useState('')

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(url)}&color=14532d&bgcolor=ffffff`)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '1.5rem',
      maxWidth: '680px', width: '100%', margin: '2rem auto', padding: '0 1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="no-print">
        <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--borda)', cursor: 'pointer', borderRadius: '6px' }}>
          <Printer size={15} /> Imprimir Recibo
        </button>
      </div>

      {venda.status === 'cancelada' && (
        <div className="alerta alerta-perigo" style={{ fontWeight: 900, textAlign: 'center', fontSize: '1.1rem', textTransform: 'uppercase', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '1rem', borderRadius: '6px' }}>
          ● Venda Cancelada
          {venda.motivo_cancelamento && <div style={{ fontSize: '0.85rem', fontWeight: 400, marginTop: '4px', textTransform: 'none' }}>Motivo: {venda.motivo_cancelamento}</div>}
        </div>
      )}

      {/* ── RECIBO PREMIUM RENDERING ── */}
      <div id="recibo-print" style={{
        background: '#fff', color: '#1a1a1a',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        border: '1px solid #e5e7eb', borderRadius: '8px',
        overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        width: '100%',
      }}>
        {/* ── Cabeçalho Principal ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '1.5rem 2rem', position: 'relative',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {empresa?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={empresa.logo_url} alt="Logo" style={{ maxHeight: '60px', maxWidth: '160px', borderRadius: '4px', objectFit: 'contain', background: '#fff', padding: '4px' }} />
              ) : (
                <div style={{ background: '#00bfa5', color: '#000', width: '45px', height: '45px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem' }}>
                  {(empresa?.nome || 'N')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0, color: '#fff' }}>
                  {empresa?.nome || 'KDL Store'}
                </h2>
                {empresa?.cnpj && (
                  <p style={{ color: '#00bfa5', fontSize: '0.72rem', margin: '3px 0 0', fontFamily: 'monospace', letterSpacing: '0.02em', fontWeight: 700 }}>
                    CNPJ: {empresa.cnpj}
                  </p>
                )}
                {(empresa?.endereco || empresa?.cidade) && (
                  <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '2px 0 0' }}>
                    {[empresa.endereco, empresa.cidade, empresa.estado].filter(Boolean).join(', ')}
                  </p>
                )}
                {(empresa?.whatsapp || empresa?.telefone || empresa?.email) && (
                  <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '2px 0 0' }}>
                    {empresa.whatsapp ? `Zap: ${empresa.whatsapp}` : empresa.telefone ? `Tel: ${empresa.telefone}` : ''}
                    {empresa.email ? `  ·  ${empresa.email}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px', padding: '0.625rem 1rem', display: 'inline-block'
              }}>
                <p style={{ color: '#00bfa5', fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>COMPROVANTE DE VENDA</p>
                <p style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'monospace', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                  #{String(venda.numero).padStart(4, '0')}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.65rem', margin: '2px 0 0' }}>
                  {new Date(venda.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barra de status ── */}
        <div style={{
          background: venda.status === 'concluida' ? '#f0fdf4' : '#fef2f2',
          borderBottom: '1px solid',
          borderColor: venda.status === 'concluida' ? '#dcfce7' : '#fee2e2',
          padding: '0.625rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: venda.status === 'concluida' ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            <strong style={{ color: venda.status === 'concluida' ? '#15803d' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {venda.status === 'concluida' ? 'Transação Concluída' : 'Transação Cancelada'}
            </strong>
          </div>
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            Operador: {venda.registrado_nome || 'Sistema'}
          </span>
        </div>

        {/* ── Informações da Transação (Cliente & Pagamento) ── */}
        <div style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Cliente</h3>
            {clienteInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{clienteInfo.nome}</p>
                {clienteInfo.cpf && <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>CPF/CNPJ: <span style={{ fontFamily: 'monospace' }}>{clienteInfo.cpf}</span></p>}
                {clienteInfo.telefone && <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>WhatsApp: {clienteInfo.telefone}</p>}
                {clienteInfo.endereco && <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Endereço: {formatarEndereco(clienteInfo.endereco)}</p>}
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{venda.cliente_nome || 'Consumidor Final'}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0', fontStyle: 'italic' }}>Nenhum dado cadastrado</p>
              </div>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Pagamento</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>
                {FORMA_ICON[venda.forma_pagamento.split(' ')[0]] || '💳'} {venda.forma_pagamento}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                Status: <span style={{ color: '#15803d', fontWeight: 700 }}>PAGO</span>
              </p>
              {venda.obs && (
                <p style={{ fontSize: '0.68rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569', margin: '4px 0 0', fontStyle: 'italic' }}>
                  {venda.obs}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Itens da Venda ── */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Especificação dos Itens</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição do Item</th>
                <th style={{ textAlign: 'center', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}>Qtd</th>
                <th style={{ textAlign: 'right', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Unitário</th>
                <th style={{ textAlign: 'right', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: idx < itens.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '0.625rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.produto_nome}</span>
                      {item.brinde && (
                        <span style={{ fontSize: '0.58rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '3px', fontWeight: 900, letterSpacing: '0.04em' }}>BRINDE</span>
                      )}
                    </div>
                    {item.num_serie && (
                      <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '3px 0 0', fontFamily: 'monospace' }}>S/N: {item.num_serie}</p>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.625rem 0', color: '#0f172a', fontWeight: 700 }}>{item.quantidade}</td>
                  <td style={{ textAlign: 'right', padding: '0.625rem 0', fontFamily: 'monospace', color: '#334155' }}>
                    {item.brinde ? 'R$ 0,00' : formatCurrency(item.preco_unitario)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.625rem 0', fontFamily: 'monospace', fontWeight: 800, color: item.brinde ? '#16a34a' : '#0f172a' }}>
                    {item.brinde ? 'R$ 0,00' : formatCurrency(item.quantidade * item.preco_unitario)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totais ── */}
        <div style={{ padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>Subtotal dos itens</span>
            <span style={{ fontFamily: 'monospace', minWidth: '100px', textAlign: 'right', color: '#334155', fontSize: '0.82rem' }}>
              {formatCurrency(Number(venda.total) + Number(venda.desconto || 0))}
            </span>
          </div>
          {venda.desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem' }}>
              <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700 }}>Desconto aplicado</span>
              <span style={{ fontFamily: 'monospace', minWidth: '100px', textAlign: 'right', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>
                − {formatCurrency(venda.desconto)}
              </span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '3rem',
            borderTop: '1px solid #e2e8f0', paddingTop: '0.625rem', marginTop: '0.25rem',
          }}>
            <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a', letterSpacing: '0.04em' }}>TOTAL LIQUIDO PAGO</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', color: '#16a34a', minWidth: '100px', textAlign: 'right', lineHeight: 1 }}>
              {formatCurrency(venda.total)}
            </span>
          </div>
        </div>

        {/* ── Certificado de Garantia dos Itens (Se houver) ── */}
        {garantias.length > 0 && (
          <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', background: 'rgba(0,191,165,0.02)' }}>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#00bfa5', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              🛡️ Certificado de Garantia dos Itens
            </h3>
            <div className="tabela-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,191,165,0.15)', color: '#475569' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '4px', fontWeight: 700 }}>Produto</th>
                    <th style={{ textAlign: 'left', paddingBottom: '4px', fontWeight: 700, width: '140px' }}>Número de Série</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px', fontWeight: 700, width: '100px' }}>Vencimento</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px', fontWeight: 700, width: '80px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {garantias.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#1e293b', fontWeight: 600 }}>{g.produto_nome}</td>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', color: '#334155' }}>{g.num_serie || '—'}</td>
                      <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: '#00bfa5' }}>
                        {new Date(g.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.58rem',
                          background: g.status === 'ativa' ? 'rgba(0,191,165,0.1)' : 'rgba(239,68,68,0.1)',
                          color: g.status === 'ativa' ? '#00bfa5' : '#dc2626',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}>
                          {g.status === 'ativa' ? 'Ativa' : g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Assinaturas & Termo Legal ── */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '0.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', height: '30px', marginBottom: '4px' }} />
              <p style={{ fontSize: '0.62rem', color: '#64748b', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Responsável Comercial</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', height: '30px', marginBottom: '4px' }} />
              <p style={{ fontSize: '0.62rem', color: '#64748b', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assinatura do Cliente</p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#0f172a' }}>Termo de Garantia Simplificado (Art. 26 do CDC - Lei 8.078/90):</strong>
              <br />
              Conforme a legislação brasileira, é assegurada a garantia legal de <strong>30 dias</strong> para produtos não duráveis e <strong>90 dias</strong> para produtos duráveis. Eventuais garantias contratuais adicionais concedidas pelo fabricante ou estabelecimento estão discriminadas por item no corpo deste recibo. Para acionamento, é obrigatória a apresentação deste documento contendo o número de série correspondente.
            </p>
          </div>
        </div>

        {/* ── Rodapé com QR Code ── */}
        <div style={{ background: '#f8fafc', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0, fontWeight: 700 }}>Obrigado pela preferência!</p>
            <p style={{ fontSize: '0.62rem', color: '#64748b', margin: '1px 0 0' }}>Volte sempre e confira as novidades em nosso catálogo.</p>
            <p style={{ fontSize: '0.55rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 600 }}>Nexocommerce — Desenvolvido por KDL Store</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.55rem', color: '#94a3b8', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>DOCUMENTO DIGITAL</p>
              <p style={{ fontSize: '0.62rem', color: '#64748b', margin: '1px 0 0' }}>Acesse pelo QR Code</p>
            </div>
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR Code" width={56} height={56} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', padding: '2px' }} />
            ) : (
              <div style={{ width: 56, height: 56, border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f1f5f9' }} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          #recibo-print {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          /* High-quality printing styles */
          #recibo-print {
            border: 1px solid #000 !important;
          }
          #recibo-print > div:first-child {
            background: #0f172a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #recibo-print > div:first-child * {
            color: #ffffff !important;
          }
          #recibo-print > div:nth-child(2) {
            background: #f0fdf4 !important;
            color: #15803d !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </div>
  )
}
