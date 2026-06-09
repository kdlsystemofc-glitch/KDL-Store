import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/usuario/alterar-status
 * Body: { userId: string, novoStatus: 'ativo' | 'congelado' | 'excluido', empresaId: string }
 *
 * Fix 1.7 — Logout seguro:
 * Além de atualizar `profiles.status`, invalida a sessão Supabase Auth do usuário
 * usando supabaseAdmin.auth.admin.signOut(userId) para garantir que ele seja
 * desconectado imediatamente, sem depender do realtime do cliente.
 */
export async function POST(request: Request) {
  try {
    const { userId, novoStatus, empresaId } = await request.json()

    if (!userId || !novoStatus || !empresaId) {
      return NextResponse.json({ error: 'userId, novoStatus e empresaId são obrigatórios' }, { status: 400 })
    }

    const statusValidos = ['ativo', 'congelado', 'excluido']
    if (!statusValidos.includes(novoStatus)) {
      return NextResponse.json({ error: 'Status inválido. Use: ativo, congelado ou excluido' }, { status: 400 })
    }

    // Verificar autenticação do chamador
    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 })
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verificar se o chamador é admin da mesma empresa
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('papel, empresa_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.empresa_id !== empresaId || callerProfile.papel !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem alterar o status de usuários.' }, { status: 403 })
    }

    // Impedir que admin altere o próprio status
    if (userId === caller.id) {
      return NextResponse.json({ error: 'Não é possível alterar o próprio status.' }, { status: 400 })
    }

    // Verificar que o alvo pertence à mesma empresa
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('empresa_id, nome')
      .eq('id', userId)
      .single()

    if (!targetProfile || targetProfile.empresa_id !== empresaId) {
      return NextResponse.json({ error: 'Usuário não encontrado nesta empresa.' }, { status: 404 })
    }

    // 1. Atualizar status no profiles
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: novoStatus })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar status: ' + updateError.message }, { status: 500 })
    }

    // 2. Se suspendendo ou excluindo → invalidar sessão Supabase Auth imediatamente
    if (novoStatus === 'congelado' || novoStatus === 'excluido') {
      try {
        await supabaseAdmin.auth.admin.signOut(userId, 'global')
      } catch (signOutErr) {
        // Não bloqueia — o status já foi atualizado. O middleware vai barrar na próxima requisição.
        console.warn('[alterar-status] signOut falhou (não crítico):', signOutErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status de "${targetProfile.nome}" alterado para "${novoStatus}" com sucesso.`
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
