'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  nome_loja: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa ter uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa ter um número'),
  confirmar_senha: z.string(),
  tipo_negocio: z.string().min(1, 'Selecione o tipo'),
}).refine(d => d.senha === d.confirmar_senha, {
  message: 'As senhas não coincidem', path: ['confirmar_senha']
})

type Form = z.infer<typeof schema>

function PwdStrength({ senha }: { senha: string }) {
  const checks = [
    { label: '8+ caracteres', ok: senha.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(senha) },
    { label: 'Número', ok: /[0-9]/.test(senha) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['#ef4444', '#f59e0b', '#22c55e']
  const labels = ['Fraca', 'Média', 'Forte']
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: i < score ? colors[score - 1] : '#e5e7eb' }} />
        ))}
      </div>
      {senha && <p className="text-xs font-bold" style={{ color: colors[score - 1] || '#9ca3af' }}>
        Senha {labels[score - 1] || ''}
      </p>}
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 text-xs font-medium ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            {c.ok ? <Check size={11} /> : <X size={11} />} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CadastroPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [senhaVal, setSenhaVal] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    setError(null)
    const supabase = createClient()
    const { error: e } = await supabase.auth.signUp({
      email: data.email, password: data.senha,
      options: { data: { nome_loja: data.nome_loja, tipo_negocio: data.tipo_negocio } }
    })
    if (e) { setError(e.message); return }
    router.push('/dashboard')
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-black text-gray-900 mb-1">Criar conta grátis</h2>
      <p className="text-gray-500 mb-6">30 dias gratuitos · Sem cartão de crédito</p>

      {/* Benefícios */}
      <div className="rounded-xl p-3 mb-6 flex flex-wrap gap-2"
        style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
        {['✓ PDV ilimitado', '✓ Controle de estoque', '✓ Garantias digitais', '✓ Suporte grátis'].map(b => (
          <span key={b} className="text-xs font-bold" style={{ color: '#15803d' }}>{b}</span>
        ))}
      </div>

      {error && <div className="alert-danger mb-4">⚠️ {error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-base" htmlFor="cad-nome-loja">Nome da sua loja *</label>
          <input id="cad-nome-loja" className={`input-base text-base ${errors.nome_loja ? 'error' : ''}`}
            placeholder="Ex: Eletrônicos do João" {...register('nome_loja')} />
          {errors.nome_loja && <p className="mt-1 text-xs font-medium text-red-600">{errors.nome_loja.message}</p>}
        </div>

        <div>
          <label className="label-base" htmlFor="cad-tipo">Tipo de negócio *</label>
          <select id="cad-tipo" className={`select-base text-base ${errors.tipo_negocio ? 'error' : ''}`}
            {...register('tipo_negocio')}>
            <option value="">Selecione seu negócio...</option>
            <option value="eletronicos">🔊 Eletrônicos / Som Automotivo</option>
            <option value="acessorios">🚗 Acessórios para Veículos</option>
            <option value="roupas">👕 Roupas e Calçados</option>
            <option value="alimentacao">🍕 Alimentação</option>
            <option value="papelaria">📚 Papelaria / Livraria</option>
            <option value="geral">🏪 Comércio Geral</option>
            <option value="outro">Outro</option>
          </select>
          {errors.tipo_negocio && <p className="mt-1 text-xs font-medium text-red-600">{errors.tipo_negocio.message}</p>}
        </div>

        <div>
          <label className="label-base" htmlFor="cad-email">E-mail *</label>
          <input id="cad-email" type="email" className={`input-base text-base ${errors.email ? 'error' : ''}`}
            placeholder="seu@email.com" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-base" htmlFor="cad-senha">Senha *</label>
          <div className="relative">
            <input id="cad-senha" type={showPwd ? 'text' : 'password'}
              className={`input-base text-base pr-11 ${errors.senha ? 'error' : ''}`}
              placeholder="Mínimo 8 caracteres"
              {...register('senha', { onChange: e => setSenhaVal(e.target.value) })} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon p-1.5">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {senhaVal && <PwdStrength senha={senhaVal} />}
          {errors.senha && <p className="mt-1 text-xs font-medium text-red-600">{errors.senha.message}</p>}
        </div>

        <div>
          <label className="label-base" htmlFor="cad-confirmar">Confirmar senha *</label>
          <input id="cad-confirmar" type={showPwd ? 'text' : 'password'}
            className={`input-base text-base ${errors.confirmar_senha ? 'error' : ''}`}
            placeholder="Repita a senha" {...register('confirmar_senha')} />
          {errors.confirmar_senha && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmar_senha.message}</p>}
        </div>

        <button id="btn-register-submit" type="submit" disabled={isSubmitting}
          className="btn-primary w-full py-4 text-base mt-2">
          {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Criando conta...</> : '🚀 Criar minha conta grátis'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Ao criar sua conta você concorda com os <span className="font-semibold text-gray-600 cursor-pointer">Termos de Uso</span> e{' '}
          <span className="font-semibold text-gray-600 cursor-pointer">Política de Privacidade</span>
        </p>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Já tem uma conta?{' '}
          <Link id="link-go-to-login" href="/login" className="font-bold" style={{ color: '#16a34a' }}>
            Entrar no sistema
          </Link>
        </p>
      </div>
    </div>
  )
}
