import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Rotas 100% públicas (sem auth) ──
  const publicRoutes = ['/', '/login', '/cadastro', '/redefinir-senha', '/garantia', '/landing', '/landing.html']
  const isPublic = publicRoutes.some(r => pathname === r || (r !== '/' && r !== '/landing.html' && pathname.startsWith(r)))
  if (isPublic) return NextResponse.next()

  // ── 2. Se Supabase não configurado → dev mode, tudo passa ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    return NextResponse.next()
  }

  // ── 3. Auth guard: verificar se está logado ──
  const { createServerClient } = await import('@supabase/ssr')
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Não logado → redireciona para /login (ou retorna 401 se for API)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── 4. Subscription guard: verificar se tem assinatura ativa ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  let hasActiveSubscription = false
  let userPlan = 'start'
  if (profile?.empresa_id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, plano')
      .eq('empresa_id', profile.empresa_id)
      .eq('status', 'active')
      .single()
    if (sub) {
      hasActiveSubscription = true
      userPlan = sub.plano || 'start'
    }
  }

  // ── Proteção de rotas Pro ──
  const proRoutes = ['/financeiro', '/relatorios', '/clientes/inativos', '/comissoes']
  const isProRoute = proRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (hasActiveSubscription && userPlan !== 'pro' && isProRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/assinar'
    return NextResponse.redirect(url)
  }

  // Logado SEM assinatura → só pode acessar /assinar
  if (!hasActiveSubscription && pathname !== '/assinar') {
    const url = request.nextUrl.clone()
    url.pathname = '/assinar'
    return NextResponse.redirect(url)
  }

  // Logado COM assinatura tentando acessar /assinar → vai pro dashboard
  if (hasActiveSubscription && pathname === '/assinar') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Logado tentando acessar /login ou /cadastro → vai pro dashboard
  if (pathname === '/login' || pathname === '/cadastro') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclui todos os assets estáticos
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:html|css|js|svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|otf|ico|xml|txt|pdf|json)$).*)',
  ],
}
