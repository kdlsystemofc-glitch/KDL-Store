import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, nome, papel, senha, empresaId } = await request.json()

    if (!email || !nome?.trim() || !senha || !empresaId) {
      return NextResponse.json({ error: 'Nome, e-mail, senha e empresaId são obrigatórios' }, { status: 400 })
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuração SUPABASE_SERVICE_ROLE_KEY ausente no servidor' }, { status: 500 })
    }

    // Cliente admin para ignorar RLS e usar a auth.admin API
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Obter o plano ativo da empresa
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plano')
      .eq('empresa_id', empresaId)
      .maybeSingle()

    const plano = sub?.plano || 'start'

    // 2. Contar usuários ativos associados à empresa no profiles
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
        error: `O seu plano atual (${plano === 'pro' ? 'Pro' : 'Start'}) permite no máximo ${limit} usuário(s). Faça o upgrade do plano para adicionar mais colaboradores.`
      }, { status: 403 })
    }

    // Mapeia papel da UI para o banco de dados
    const MAP_PAPEL_TO_DB: Record<string, string> = {
      admin: 'admin',
      vendedor: 'operador',
      estoquista: 'visualizador',
      operador: 'operador',
      visualizador: 'visualizador',
    }
    const dbPapel = MAP_PAPEL_TO_DB[papel] || 'operador'

    // Gera token único para que o trigger associe corretamente o profile
    const token = [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

    // 3. Inserir convite temporário no banco de dados (pendente)
    const { error: dbError } = await supabaseAdmin
      .from('convites')
      .insert({
        empresa_id: empresaId,
        email: email.trim().toLowerCase(),
        nome: nome.trim(),
        papel: dbPapel,
        token: token,
        status: 'pendente',
      })

    if (dbError) {
      return NextResponse.json({ error: 'Erro ao registrar usuário no banco: ' + dbError.message }, { status: 500 })
    }

    // 4. Criar o usuário diretamente no Supabase Auth com senha temporária
    const { data: inviteData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: senha,
      email_confirm: true, // E-mail já confirmado
      user_metadata: {
        invite_token: token,
        nome: nome.trim(),
        forcar_troca_senha: true, // Força a redefinição de senha no primeiro login
      }
    })

    if (authError) {
      // Remove o convite temporário criado
      await supabaseAdmin.from('convites').delete().eq('token', token)

      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('exists')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro ao criar conta de usuário: ' + authError.message }, { status: 500 })
    }

    // Atualiza o convite com o ID do usuário criado
    const authUserId = inviteData?.user?.id ?? null
    if (authUserId) {
      await supabaseAdmin
        .from('convites')
        .update({ auth_user_id: authUserId })
        .eq('token', token)
    }

    return NextResponse.json({ success: true, user: inviteData.user })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno do servidor: ' + err.message }, { status: 500 })
  }
}
