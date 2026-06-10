import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type TipoNotificacao =
  | 'estoque_critico'
  | 'garantia_expirando'
  | 'fiado_vencido'
  | 'os_vencida'
  | 'pedido_aguardando_entrada'

export interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  descricao: string
  link?: string
  lida: boolean
  criado_em: string
}

export function useNotifications(empresaId: string | null) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(false)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    const supabase = createClient()
    const hoje = new Date().toISOString().slice(0, 10)
    const em7Dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    try {
      // 1. Busca empresa para obter configuração de fiado
      const { data: empresa } = await supabase
        .from('empresas')
        .select('crm_prazo_inatividade_dias')
        .eq('id', empresaId)
        .single()
      const prazoFiado = empresa?.crm_prazo_inatividade_dias ?? 30

      const dataFiado = new Date(Date.now() - prazoFiado * 86400000).toISOString().slice(0, 10)

      // 2. Carrega notificações persistidas (não lidas)
      const { data: notifDB } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('lida', false)
        .order('criado_em', { ascending: false })
        .limit(50)

      // 3. Gera notificações "ao vivo" das tabelas de dados
      const promises = await Promise.allSettled([
        // 3a. Produtos com estoque crítico
        supabase.from('produtos')
          .select('id,nome,qtd_atual,qtd_minima')
          .eq('empresa_id', empresaId)
          .gt('qtd_minima', 0)
          .limit(100),

        // 3b. Garantias expirando em ≤ 7 dias
        supabase.from('garantias')
          .select('id,produto_nome,data_fim')
          .eq('empresa_id', empresaId)
          .lte('data_fim', em7Dias)
          .gte('data_fim', hoje)
          .limit(10),

        // 3c. Fiados vencidos
        supabase.from('fiados')
          .select('id,cliente_nome,valor_aberto,data_vencimento')
          .eq('empresa_id', empresaId)
          .eq('status', 'aberto')
          .lt('data_vencimento', hoje)
          .limit(10),

        // 3d. OS com prazo vencido
        supabase.from('ordens_servico')
          .select('id,numero,cliente_nome,prazo_entrega')
          .eq('empresa_id', empresaId)
          .not('status', 'in', '(concluida,cancelada)')
          .lt('prazo_entrega', hoje)
          .limit(10),

        // 3e. Pedidos de compra aguardando entrada (status=enviado)
        supabase.from('pedidos_fornecedor')
          .select('id,numero,produto')
          .eq('empresa_id', empresaId)
          .eq('status', 'enviado')
          .limit(10),
      ])

      // Construir lista de notificações ao vivo
      const aoVivo: Notificacao[] = []
      const agora = new Date().toISOString()

      // Estoque crítico
      const estoqueCritico = promises[0].status === 'fulfilled'
        ? ((promises[0] as PromiseFulfilledResult<any>).value?.data || [])
        : []
      // Filtra manualmente pois o .lte com referência de coluna não funciona via JS
      estoqueCritico
        .filter((p: any) => p.qtd_atual <= (p.qtd_minima ?? 0))
        .slice(0, 5)
        .forEach((p: any) => {
          aoVivo.push({
            id: `estoque-${p.id}`,
            tipo: 'estoque_critico',
            titulo: '📦 Estoque crítico',
            descricao: `"${p.nome}" com apenas ${p.qtd_atual} unidades (mín. ${p.qtd_minima ?? 0})`,
            link: '/estoque',
            lida: false,
            criado_em: agora,
          })
        })

      // Garantias expirando
      const garantias = promises[1].status === 'fulfilled'
        ? ((promises[1] as PromiseFulfilledResult<any>).value?.data || [])
        : []
      garantias.slice(0, 5).forEach((g: any) => {
        const dias = Math.ceil((new Date(g.data_fim).getTime() - Date.now()) / 86400000)
        aoVivo.push({
          id: `garantia-${g.id}`,
          tipo: 'garantia_expirando',
          titulo: '🛡️ Garantia expirando',
          descricao: `"${g.produto_nome}" expira em ${dias} dia(s)`,
          link: '/garantias',
          lida: false,
          criado_em: agora,
        })
      })

      // Fiados vencidos
      const fiadosVenc = promises[2].status === 'fulfilled'
        ? ((promises[2] as PromiseFulfilledResult<any>).value?.data || [])
        : []
      fiadosVenc.slice(0, 5).forEach((f: any) => {
        aoVivo.push({
          id: `fiado-${f.id}`,
          tipo: 'fiado_vencido',
          titulo: '💸 Fiado vencido',
          descricao: `${f.cliente_nome || 'Cliente'} — R$ ${(f.valor_aberto || 0).toFixed(2).replace('.', ',')} vencido em ${f.data_vencimento ? new Date(f.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}`,
          link: '/financeiro/fiado',
          lida: false,
          criado_em: agora,
        })
      })

      // OS vencidas
      const osVencidas = promises[3].status === 'fulfilled'
        ? ((promises[3] as PromiseFulfilledResult<any>).value?.data || [])
        : []
      osVencidas.slice(0, 5).forEach((os: any) => {
        aoVivo.push({
          id: `os-${os.id}`,
          tipo: 'os_vencida',
          titulo: '🔧 OS com prazo vencido',
          descricao: `OS #${os.numero || os.id.slice(0, 6).toUpperCase()} — ${os.cliente_nome || ''}`,
          link: '/ordens-de-servico',
          lida: false,
          criado_em: agora,
        })
      })

      // Pedidos aguardando entrada
      const pedidosEnv = promises[4].status === 'fulfilled'
        ? ((promises[4] as PromiseFulfilledResult<any>).value?.data || [])
        : []
      pedidosEnv.slice(0, 5).forEach((p: any) => {
        aoVivo.push({
          id: `pedido-${p.id}`,
          tipo: 'pedido_aguardando_entrada',
          titulo: '📥 Pedido aguardando entrada',
          descricao: `Pedido #${p.numero ? String(p.numero).padStart(4, '0') : p.id.slice(0, 8).toUpperCase()} — ${p.produto}`,
          link: '/fornecedores',
          lida: false,
          criado_em: agora,
        })
      })

      // Merge: ao vivo primeiro, depois DB (as não-lidas persistidas são alertas históricos)
      const dbNotifs: Notificacao[] = (notifDB || []).map((n: any) => ({
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo,
        descricao: n.descricao,
        link: n.link,
        lida: n.lida,
        criado_em: n.criado_em,
      }))

      // Dedup por id
      const seen = new Set<string>()
      const merged: Notificacao[] = []
      for (const n of [...aoVivo, ...dbNotifs]) {
        if (!seen.has(n.id)) { seen.add(n.id); merged.push(n) }
      }

      setNotificacoes(merged)
    } catch (e) {
      console.error('[useNotifications] erro:', e)
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function marcarLida(id: string) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    // Persiste no banco somente notificações com UUID real (não geradas ao vivo)
    if (!id.startsWith('estoque-') && !id.startsWith('garantia-') && !id.startsWith('fiado-') && !id.startsWith('os-') && !id.startsWith('pedido-')) {
      try {
        await createClient().from('notificacoes').update({ lida: true }).eq('id', id)
      } catch {}
    }
  }

  async function marcarTodasLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    if (!empresaId) return
    try {
      await createClient().from('notificacoes').update({ lida: true }).eq('empresa_id', empresaId).eq('lida', false)
    } catch {}
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return { notificacoes, naoLidas, loading, marcarLida, marcarTodasLidas, recarregar: carregar }
}
