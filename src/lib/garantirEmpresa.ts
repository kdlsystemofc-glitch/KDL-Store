import { createClient } from '@/lib/supabase/client'

/**
 * Garante que o usuário logado tem uma empresa vinculada.
 * Se não tiver, cria automaticamente com dados básicos.
 */
export async function garantirEmpresa(): Promise<string | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verifica se já tem empresa
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (profile?.empresa_id) return profile.empresa_id

  // Cria empresa com nome da loja passado no cadastro
  const nomeLoja = user.user_metadata?.nome_loja || 'Minha Loja'
  const { data: empresa, error } = await supabase
    .from('empresas')
    .insert({ nome: nomeLoja, plano: 'start' })
    .select('id')
    .single()

  if (error || !empresa) return null

  // Vincula ao profile
  await supabase
    .from('profiles')
    .update({ empresa_id: empresa.id, nome: user.user_metadata?.nome_loja || user.email })
    .eq('id', user.id)

  return empresa.id
}
