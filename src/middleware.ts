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
    if (pathname.startsWith('/api/stripe/webhook')) {
      // O webhook não precisa de auth do Supabase, ele valida pela assinatura do Stripe
      return supabaseResponse
    }
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
  let motivoRedirecionamento = ''

  if (profile?.empresa_id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, plano, cancel_at_period_end, current_period_end')
      .eq('empresa_id', profile.empresa_id)
      .single()
      
    if (sub) {
      userPlan = sub.plano || 'start'
      const agora = new Date()
      const end = sub.current_period_end ? new Date(sub.current_period_end) : null
      
      let podeAcessar = false

      if (sub.status === 'active' || sub.status === 'trialing') {
        podeAcessar = true
      }
      
      if (sub.cancel_at_period_end === true && end && end > agora) {
        podeAcessar = true
      }

      if (!podeAcessar) {
        if (sub.status === 'past_due') motivoRedirecionamento = '?motivo=inadimplente'
        else if (sub.status === 'cancelled' || (sub.cancel_at_period_end && end && end <= agora)) motivoRedirecionamento = '?motivo=cancelado'
      } else {
        hasActiveSubscription = true
      }
    }
  }

  // ── Proteção de rotas Pro ──
  // Deixamos que o cliente carregue a página normalmente para que o componente <ProOnly>
  // faça a verificação do plano no lado do cliente e exiba a tela de upgrade premium (Locker).
  // Isso evita loops de redirecionamento e proporciona uma experiência SaaS premium e consistente.
  /*
  const proRoutes = ['/financeiro', '/relatorios', '/clientes/inativos', '/comissoes']
  const isProRoute = proRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

  // Se logado e tem rota Pro mas não tem plano Pro -> Bloqueia
  if (hasActiveSubscription && userPlan !== 'pro' && isProRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/assinar'
    return NextResponse.redirect(url)
  }
  */

  // Permite acesso livre a /configuracoes/planos mesmo inadimplente para ele poder mudar cartão
  if (!hasActiveSubscription && pathname === '/configuracoes/planos') {
    return supabaseResponse
  }

  // Logado SEM assinatura → vai para /assinar com o motivo específico
  if (!hasActiveSubscription && pathname !== '/assinar' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone()
    url.pathname = '/assinar'
    url.search = motivoRedirecionamento
    return NextResponse.redirect(url)
  }

  // Logado COM assinatura tentando acessar /assinar sem querer mudar de plano
  if (hasActiveSubscription && pathname === '/assinar' && !request.nextUrl.searchParams.get('mudar_plano')) {
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
