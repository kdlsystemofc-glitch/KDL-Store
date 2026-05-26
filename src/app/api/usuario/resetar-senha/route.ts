import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { usuarioId, novaSenha, empresaId } = await request.json()

    if (!usuarioId || !novaSenha || !empresaId) {
      return NextResponse.json({ error: 'usuarioId, novaSenha e empresaId são obrigatórios' }, { status: 400 })
    }

    // Validação de senha forte
    if (novaSenha.length < 8) return NextResponse.json({ error: 'Mínimo 8 caracteres.' }, { status: 400 })
    if (!/[A-Z]/.test(novaSenha)) return NextResponse.json({ error: 'Deve conter letra maiúscula.' }, { status: 400 })
    if (!/[0-9]/.test(novaSenha)) return NextResponse.json({ error: 'Deve conter número.' }, { status: 400 })
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha)) {
      return NextResponse.json({ error: 'Deve conter caractere especial.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 })
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verificar se o chamador é admin da empresa
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('papel, empresa_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.empresa_id !== empresaId || callerProfile.papel !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem resetar senhas.' }, { status: 403 })
    }

    // Verificar que o usuário alvo pertence à mesma empresa
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('empresa_id')
      .eq('id', usuarioId)
      .single()

    if (!targetProfile || targetProfile.empresa_id !== empresaId) {
      return NextResponse.json({ error: 'Usuário não encontrado nesta empresa.' }, { status: 404 })
    }

    // Resetar a senha e forçar troca no próximo login
    const { error } = await supabaseAdmin.auth.admin.updateUserById(usuarioId, {
      password: novaSenha,
      user_metadata: { forcar_troca_senha: true }
    })

    if (error) {
      return NextResponse.json({ error: 'Erro ao resetar senha: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
