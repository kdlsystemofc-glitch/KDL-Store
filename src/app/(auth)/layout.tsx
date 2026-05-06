import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'NexoCommerce', template: '%s | NexoCommerce' },
  description: 'Sistema de gestão para pequeno comércio',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding verde forte */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #14532d 0%, #15803d 40%, #16a34a 100%)' }}>

        {/* Pattern decorativo */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-black" style={{ color: '#15803d' }}>N</span>
            </div>
            <div>
              <p className="text-white font-black text-xl leading-none">NexoCommerce</p>
              <p className="text-green-200 text-xs font-medium">Gestão para o seu balcão</p>
            </div>
          </div>
        </div>

        {/* Centro */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight mb-3">
              Seu negócio organizado.<br />
              <span className="text-green-200">Do jeito certo.</span>
            </h1>
            <p className="text-green-100 text-base leading-relaxed">
              Controle vendas, estoque, garantias e fornecedores em minutos. 
              Simples como um caixa de mercado.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { emoji: '🛒', text: 'Registre uma venda em menos de 30 segundos' },
              { emoji: '📦', text: 'Estoque atualizado automaticamente a cada venda' },
              { emoji: '🛡️', text: 'Garantia digital gerada na hora da venda' },
              { emoji: '📊', text: 'Veja quanto faturou hoje ao abrir o sistema' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {f.emoji}
                </div>
                <span className="text-green-50 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative bg-white/10 rounded-2xl p-4 border border-white/20">
          <p className="text-green-100 text-sm italic leading-relaxed">
            "Antes eu perdia produto sem saber. Agora sei o estoque exato e quanto entrou no dia."
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black" style={{ color: '#15803d' }}>J</div>
            <div>
              <p className="text-white text-xs font-bold">José Aparecido</p>
              <p className="text-green-300 text-xs">Loja de eletrônicos, 25 de Março SP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16" style={{ background: '#f4f6f8' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#15803d' }}>
              <span className="text-white font-black text-lg">N</span>
            </div>
            <span className="font-black text-lg text-gray-900">NexoCommerce</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
