'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    setError(null)
    const supabase = createClient()
    const { error: e } = await supabase.auth.signInWithPassword({ email: data.email, password: data.senha })
    if (e) { setError('E-mail ou senha incorretos.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-black text-gray-900 mb-1">Entrar no sistema</h2>
      <p className="text-gray-500 mb-8">Acesse sua conta para continuar</p>

      {error && (
        <div className="alert-danger mb-5">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-base" htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" className={`input-base text-base ${errors.email ? 'error' : ''}`}
            placeholder="seu@email.com" {...register('email')} />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-base" htmlFor="login-senha">Senha</label>
          <div className="relative">
            <input id="login-senha" type={showPwd ? 'text' : 'password'}
              className={`input-base text-base pr-11 ${errors.senha ? 'error' : ''}`}
              placeholder="••••••••" {...register('senha')} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon p-1.5">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.senha && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.senha.message}</p>}
          <div className="text-right mt-2">
            <button type="button" id="link-forgot-password" className="text-xs font-semibold" style={{ color: '#16a34a' }}>
              Esqueci minha senha
            </button>
          </div>
        </div>

        <button id="btn-login-submit" type="submit" disabled={isSubmitting}
          className="btn-primary w-full py-4 text-base mt-2">
          {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : '→ Entrar'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Não tem conta?{' '}
          <Link id="link-go-to-register" href="/cadastro" className="font-bold" style={{ color: '#16a34a' }}>
            Criar conta grátis
          </Link>
        </p>
        <p className="text-xs text-gray-300 mt-4">30 dias grátis · Sem cartão de crédito</p>
      </div>
    </div>
  )
}
