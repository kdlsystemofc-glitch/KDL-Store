import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── POST /api/convite/aceitar ────────────────────────────────────────────────
// Aceita um convite de forma confiável:
// 1. Valida o token server-side (service role)
// 2. Cria o usuário no Supabase Auth com email já confirmado e a senha escolhida
//    — OU — se o e-mail já existe, atualiza a senha do usuário existente
// 3. Garante que o profile aponte para a empresa/papel certos (via upsert)
// 4. Marca o convite como 'aceito'
//
// Não depende do trigger on_auth_user_created para funcionar corretamente.
// O cliente então chama signInWithPassword com a senha recém-definida.
export async function POST(request: Request) {
  try {
    const { token, nome, senha } = await request.json()

    if (!token || !nome?.trim() || !senha) {
      return NextResponse.json(
        { error: 'token, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração ausente no servidor' },
        { status: 500 }
      )
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // ── 1. Valida o convite ──────────────────────────────────────────────────
    const { data: convite, error: conviteErr } = await admin
      .from('convites')
      .select('id, email, nome, papel, empresa_id, auth_user_id, status')
      .eq('token', token)
      .in('status', ['pendente', 'aceito'])
      .gt('expira_em', new Date().toISOString())
      .single()

    if (conviteErr || !convite) {
      return NextResponse.json(
        { error: 'Convite inválido ou expirado' },
        { status: 404 }
      )
    }

    if (convite.status === 'aceito' && !convite.auth_user_id) {
      return NextResponse.json(
        { error: 'Este convite já foi aceito' },
        { status: 400 }
      )
    }

    const email    = convite.email as string
    const nomeFinal = nome.trim() || (convite.nome as string | null) || email.split('@')[0]

    // ── 2. Define/Atualiza a senha do usuário ───────────────────────────────
    let userId: string | null = (convite.auth_user_id as string | null) || null

    if (userId) {
      // Verifica se o convite já foi de fato finalizado pelo convidado
      const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(userId)
      if (!getErr && authUser?.user?.user_metadata?.invite_accepted === true) {
        return NextResponse.json(
          { error: 'Este convite já foi aceito' },
          { status: 400 }
        )
      }

      // O usuário já existe no Supabase Auth porque o convite o pré-registrou.
      // Atualiza a senha e os metadados diretamente via Admin API.
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        password: senha,
        email_confirm: true, // Garante que o e-mail está confirmado ao aceitar
        user_metadata: { nome: nomeFinal, invite_token: token, invite_accepted: true },
      })

      if (updateErr) {
        return NextResponse.json(
          { error: 'Erro ao atualizar senha: ' + updateErr.message },
          { status: 500 }
        )
      }
    } else {
      // Caso não tenha auth_user_id (convite legado ou fallback), tentamos criar ou achar por e-mail:
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          invite_token: token,
          nome: nomeFinal,
          invite_accepted: true,
        },
      })

      if (!createErr && created?.user) {
        userId = created.user.id
      } else if (createErr) {
        const msg = createErr.message?.toLowerCase() ?? ''
        const jaExiste =
          msg.includes('already been registered') ||
          msg.includes('already registered') ||
          msg.includes('user already exists') ||
          msg.includes('duplicate')

        if (!jaExiste) {
          return NextResponse.json(
            { error: 'Erro ao criar conta: ' + createErr.message },
            { status: 500 }
          )
        }

        // E-mail já existe → localiza o ID via função helper
        const { data: existingId, error: rpcErr } = await admin
          .rpc('get_auth_user_id_by_email', { p_email: email })

        if (rpcErr || !existingId) {
          return NextResponse.json(
            { error: 'Erro ao localizar usuário existente no banco. Execute o SQL do database.sql para criar a função get_auth_user_id_by_email.' },
            { status: 500 }
          )
        }

        userId = existingId as string

        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
          password: senha,
          email_confirm: true,
          user_metadata: { nome: nomeFinal, invite_token: token, invite_accepted: true },
        })

        if (updateErr) {
          return NextResponse.json(
            { error: 'Erro ao atualizar senha: ' + updateErr.message },
            { status: 500 }
          )
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Erro interno ao identificar o usuário' },
        { status: 500 }
      )
    }

    // ── 3. Upsert do profile — garante empresa/papel corretos ────────────────
    // Mesmo que o trigger já tenha criado o profile corretamente, este upsert
    // sobrescreve qualquer empresa errada que o trigger possa ter criado.
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(
        {
          id:         userId,
          empresa_id: convite.empresa_id,
          nome:       nomeFinal,
          papel:      convite.papel,     // valor do banco: 'admin'|'operador'|'visualizador'
          status:     'ativo',
        },
        { onConflict: 'id' }
      )

    if (profileErr) {
      console.error('[aceitar] profile upsert error:', profileErr)
      // Não falha a requisição; o login ainda pode funcionar
    }

    // ── 4. Marca o convite como aceito ───────────────────────────────────────
    await admin
      .from('convites')
      .update({ status: 'aceito' })
      .eq('id', convite.id)

    return NextResponse.json({ success: true, email })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erro interno: ' + err.message },
      { status: 500 }
    )
  }
}
