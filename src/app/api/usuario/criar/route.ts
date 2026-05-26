import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Validação de senha forte
function validarSenhaForte(senha: string): string | null {
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  if (!/[A-Z]/.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula.'
  if (!/[0-9]/.test(senha)) return 'A senha deve conter pelo menos um número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) return 'A senha deve conter pelo menos um caractere especial.'
  return null
}

export async function POST(request: Request) {
  try {
    const { email, nome, papel, senha, empresaId } = await request.json()

    if (!email || !nome?.trim() || !senha || !empresaId) {
      return NextResponse.json({ error: 'Nome, e-mail, senha e empresaId são obrigatórios' }, { status: 400 })
    }

    // Validar senha forte
    const erroSenha = validarSenhaForte(senha)
    if (erroSenha) {
      return NextResponse.json({ error: erroSenha }, { status: 400 })
    }

    // Verificar se quem está chamando é admin da empresa
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

    // Verificar se o chamador é admin da empresa
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('papel, empresa_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.empresa_id !== empresaId || callerProfile.papel !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem criar usuários.' }, { status: 403 })
    }

    // Verificar limite do plano
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plano')
      .eq('empresa_id', empresaId)
      .maybeSingle()

    const plano = sub?.plano || 'start'

    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .neq('status', 'excluido')

    if (countError) {
      return NextResponse.json({ error: 'Erro ao verificar limite de usuários: ' + countError.message }, { status: 500 })
    }

    const currentUsers = count || 0
    const limit = plano === 'pro' ? 5 : 1

    if (currentUsers >= limit) {
      return NextResponse.json({
        error: `Seu plano ${plano === 'pro' ? 'Pro' : 'Start'} permite no máximo ${limit} usuário(s) além do administrador. Faça upgrade para adicionar mais colaboradores.`
      }, { status: 403 })
    }

    // Mapear papel
    const MAP_PAPEL: Record<string, string> = {
      admin: 'admin',
      vendedor: 'operador',
      estoquista: 'visualizador',
      operador: 'operador',
      visualizador: 'visualizador',
    }
    const dbPapel = MAP_PAPEL[papel] || 'operador'

    // Criar usuário diretamente no Supabase Auth
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nome.trim(),
        forcar_troca_senha: true,
      }
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro ao criar conta: ' + authError.message }, { status: 500 })
    }

    const authUserId = newUser?.user?.id
    if (!authUserId) {
      return NextResponse.json({ error: 'Erro inesperado ao obter ID do usuário criado.' }, { status: 500 })
    }

    // Upsert no profile associando à empresa
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUserId,
        empresa_id: empresaId,
        nome: nome.trim(),
        papel: dbPapel,
        status: 'ativo',
      }, { onConflict: 'id' })

    if (profileError) {
      // Tentar reverter: deletar o user do auth
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: 'Erro ao criar perfil do usuário: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
