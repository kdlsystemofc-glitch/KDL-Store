import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── POST /api/convite ────────────────────────────────────────────────────────
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
      visualizador: 'visualizador',
    }
    const dbPapel = MAP_PAPEL_TO_DB[papel] || 'operador'

    // 1. Inserir convite no banco de dados
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

    // 2. Tentar enviar e-mail via Supabase Auth (falha silenciosa se usuário já existe)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: {
          invite_token: token,      // IMPORTANTE: trigger lê 'invite_token'
          empresa_id: empresaId,
          papel: dbPapel,
          nome: nome?.trim() || null,
        },
        redirectTo: `${siteUrl}/convite?token=${token}`,
      }
    )

    // Se falhou (ex: usuário já existe), o convite no banco continua válido.
    // O admin pode copiar o link e enviar manualmente via WhatsApp/etc.
    const emailSent = !authError

    return NextResponse.json({ success: true, convite: conviteData, emailSent })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno do servidor: ' + err.message }, { status: 500 })
  }
}

// ─── GET /api/convite?token=... ───────────────────────────────────────────────
// Valida o token do convite usando service role key (bypassa RLS completamente).
// Necessário porque o usuário convidado ainda não tem sessão nem profile,
// portanto a política RLS convites_minha_empresa retorna NULL e bloqueia a query.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuração ausente no servidor' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabaseAdmin
      .from('convites')
      .select('email, nome, papel')
      .eq('token', token)
      .eq('status', 'pendente')
      .gt('expira_em', new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Convite inválido ou expirado' }, { status: 404 })
    }

    // Mapeia papel do banco para a UI
    const MAP_DB_TO_UI: Record<string, string> = {
      admin: 'admin',
      operador: 'vendedor',
      visualizador: 'estoquista',
    }
    const uiPapel = MAP_DB_TO_UI[data.papel] || data.papel

    return NextResponse.json({ convite: { ...data, papel: uiPapel } })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno: ' + err.message }, { status: 500 })
  }
}
