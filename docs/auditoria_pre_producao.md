# Auditoria Pré-Produção — KDL Store
Data: 15 de Maio de 2026

## Resumo Executivo
- Total de problemas encontrados: 7
- Críticos (bloqueiam lançamento): 1
- Altos (corrigir antes): 1
- Médios (corrigir em seguida): 4
- Baixos (backlog): 1

## Problemas por Categoria

### [CRÍTICO] — Fluxo de Venda Inconsistente (Race Condition e Falta de Rollback)
- Arquivo: `src/app/(dashboard)/vendas/nova/page.tsx`
- Linha: ~136 a 165
- Descrição: O insert dos itens da venda não possui tratamento de erro para fazer o rollback da venda (caso ela já tenha sido criada e a inserção dos itens falhe). Além disso, a atualização do estoque lê o estoque atual no frontend e subtrai o valor para enviar um `update` direto ao Supabase dentro de um loop `for`.
- Impacto: Furos financeiros e vendas fantasmas. Se a internet do usuário cair durante o loop, itens não terão o estoque debitado. Se duas lojas venderem o mesmo produto com estoque = 1 ao mesmo tempo, a primeira compra subtrairá o estoque para 0 e a segunda também enviará um update para 0, não resultando em saldo negativo de alerta.
- Solução sugerida: Migrar o processamento de criar venda, itens e reduzir estoque para uma Stored Procedure (RPC) dentro do Supabase, rodando como uma transação atômica única no servidor.

### [ALTO] — Variável de Ambiente Faltante (`SUPABASE_SERVICE_ROLE_KEY`)
- Arquivo: `.env.local`
- Descrição: As rotas de API, como `/api/convite/route.ts`, utilizam a variável `SUPABASE_SERVICE_ROLE_KEY` para criar usuários no painel auth (bypass de RLS). Ela não está configurada no `.env.local` do projeto.
- Impacto: A funcionalidade de envio de convites de equipes (Plano PRO) falhará com erro estourando no servidor/log da Vercel.
- Solução sugerida: Obter a *service_role key* nas configurações de API do projeto do Supabase e adicioná-la tanto no `.env.local` localmente quanto nas variáveis de ambiente de produção da Vercel.

### [MÉDIO] — Middleware com Redirecionamento HTML em APIs
- Arquivo: `src/middleware.ts`
- Linha: ~37 a 42
- Descrição: Caso haja uma requisição em `/api/` sem sessão válida, o middleware redireciona (código 307 ou 302) o cliente para a página `/login`, devolvendo conteúdo HTML.
- Impacto: O Client-side tentará fazer parse do resultado de `/api/...` como JSON e a aplicação inteira travará no componente chamador.
- Solução sugerida: Incluir lógica no Middleware verificando se `pathname.startsWith('/api')` para devolver `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` em vez do `NextResponse.redirect`.

### [MÉDIO] — Componentes UX acionam `alert()`
- Arquivo: `src/components/FormProduto.tsx`, `src/app/(dashboard)/clientes/page.tsx`, etc.
- Linhas: Várias.
- Descrição: O feedback visual de diversas operações assíncronas é dado inteiramente através do modal nativo `alert('Salvo com sucesso!')`.
- Impacto: Uma experiência de uso muito aquém do "Design Premium" exigido. Modais nativos travam todo o processamento de background e threads no navegador.
- Solução sugerida: Usar uma biblioteca de toast-notifications baseada em React (ex: React Hot Toast) para os feedbacks de Sucesso/Erro.

### [MÉDIO] — Funcionalidades Falsas Configurações
- Arquivo: `src/app/(dashboard)/configuracoes/page.tsx`
- Linha: ~135 a 137
- Descrição: Os botões de **"DEL DADOS DE TESTE"** e **"ENCERRAR CONTA"** mostram modal de confirmação e retornam um simples `alert('Dados limpos!')` e `alert('Conta encerrada.')`, sem executar lógicas de exclusão ativas na API.
- Impacto: O lojista clica acreditando que fez a limpeza do caixa ou da conta, mas os dados seguem vivos no Supabase.
- Solução sugerida: Implementar a exclusão real (RPC ou DELETE cascade) com verificação de segurança, ou remover a UI até que o recurso esteja pronto.

### [MÉDIO] — Botão Redirecionando sem Aviso
- Arquivo: `src/app/(dashboard)/puxadores/page.tsx`
- Linha: 3
- Descrição: O arquivo executa de forma forçada um `redirect('/comissoes')`. Se o usuário estava no layout da URL `/puxadores`, a tela pisca ou há transição sem explicações.
- Impacto: Confusão de navegação caso o usuário possua a rota antiga listada ou salva.
- Solução sugerida: Excluir `src/app/(dashboard)/puxadores` e garantir que não existe link apontando para ele no `layout.tsx`.

### [BAIXO] — Uso de `console.error` em Produção
- Arquivo: `src/lib/useEmpresaId.ts`, `src/components/BarcodeScannerModal.tsx`
- Linhas: Várias.
- Descrição: Alguns `console.error(err)` foram esquecidos no código após o dev.
- Impacto: Exposição de rastros de stack para o cliente final caso acesse o console do devtools.
- Solução sugerida: Limpar esses consoles ou envelopá-los em uma estrutura baseada em `process.env.NODE_ENV !== 'production'`.

## O que está funcionando corretamente

✅ **Tipagem e Compilação:** 
- O Next.js fez o processo de `npm run build` e gerou perfeitamente as 38 rotas sem problemas impeditivos de lint.
- A auditoria `npx tsc --noEmit` completou perfeitamente, garantindo tipagem sólida no frontend.

✅ **Bloqueios de Botões de Duplo Clique:**
- Existe um uso extremamente cuidadoso de estados como `salvando`, `salvandoForn`, `salvandoOS` sendo usados diretamente nos `disabled={}` de diversos formulários cruciais para evitar duplicações e corridas acidentais do operador.

✅ **Gerenciamento de Segredos de Repositório:**
- Nenhuma string literal de JWT (como tokens `eyJ`), tokens secretos da API ou keys `sk_` foram encrustadas no código estático. Tudo é puxado através da malha `process.env`.
- O arquivo `.env.local` é blindado adequadamente pelo `.gitignore`.

✅ **Guards no Middleware:**
- As verificações sobre quais contas são `Pro` bloqueiam corretamente o acionamento dos caminhos como `/financeiro` e `/relatorios`, evitando acessos indevidos pelo painel `Start`.
- A verificação de login funciona e bloqueia rotas fechadas sem sessão.
- Estado "vazio/skeleton" mapeados por condições `if (loading) return (...)`.
