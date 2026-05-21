import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, nome, papel, empresaId } = await request.json()

    if (!email || !empresaId) {
      return NextResponse.json({ error: 'E-mail e empresaId são obrigatórios' }, { status: 400 })
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

    // Gera token único
    const token = [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

    // Mapeia papel da UI para o banco de dados
    const MAP_PAPEL_TO_DB: Record<string, string> = {
      admin: 'admin',
      vendedor: 'operador',
      estoquista: 'visualizador',
      operador: 'operador',
      visualizador: 'visualizador'
    }
    const dbPapel = MAP_PAPEL_TO_DB[papel] || 'operador'

    // 1. Inserir no banco de dados na tabela convites
    const { data: conviteData, error: dbError } = await supabaseAdmin
      .from('convites')
      .insert({
        empresa_id: empresaId,
        email: email.trim().toLowerCase(),
        nome: nome?.trim() || null,
        papel: dbPapel,
        token: token,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'Erro ao registrar convite no banco: ' + dbError.message }, { status: 500 })
    }

    // 2. Usar o Supabase Auth nativo para disparar o e-mail
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
      data: {
        invite_token: token,
        empresa_id: empresaId,
        papel: dbPapel,
        nome: nome?.trim() || null,
      },
      redirectTo: `${siteUrl}/convite?token=${token}`
    })

    if (authError) {
      // Falhou o envio de email, marcamos o convite como falha ou excluímos
      await supabaseAdmin.from('convites').delete().eq('id', conviteData.id)
      return NextResponse.json({ error: 'Erro ao enviar o e-mail pelo Supabase: ' + authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, convite: conviteData })

  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno do servidor: ' + err.message }, { status: 500 })
  }
}
