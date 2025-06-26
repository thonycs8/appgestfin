# 🏦 Gestfin - Sistema de Gestão Financeira

Uma aplicação completa de gestão financeira para empresas e famílias, desenvolvida com React, TypeScript, Supabase e Stripe.

## 🌟 Funcionalidades

### 📊 Dashboard Inteligente
- Visão geral das finanças em tempo real
- Gráficos interativos e métricas
- Separação por grupos (Empresa/Família)

### 💰 Gestão Financeira Completa
- ✅ Receitas e despesas ilimitadas
- ✅ Categorização inteligente
- ✅ Contas a pagar com alertas
- ✅ Metas e orçamentos
- ✅ Relatórios detalhados

### 🔔 Sistema de Alertas
- Contas vencidas e próximas do vencimento
- Orçamentos próximos do limite
- Metas próximas do prazo
- Notificações personalizáveis

### 👥 Multi-usuário
- Separação por grupos e categorias
- Permissões granulares
- Painel administrativo completo

### 💳 Assinaturas Premium
- Integração completa com Stripe
- Múltiplos planos de assinatura
- Período de teste gratuito
- Gestão automática de assinaturas

## 🚀 Deploy

**Aplicação em Produção**: https://gestfin.netlify.app

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React
- **Autenticação**: Clerk
- **Banco de Dados**: Supabase (PostgreSQL)
- **Pagamentos**: Stripe
- **Deploy**: Netlify
- **Gráficos**: Recharts

## 📋 Configuração

Veja o arquivo [SETUP.md](./SETUP.md) para instruções detalhadas de configuração.

### Variáveis de Ambiente

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🏃‍♂️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── layout/         # Layout e navegação
│   ├── dashboard/      # Componentes do dashboard
│   ├── alerts/         # Sistema de alertas
│   └── landing/        # Página inicial
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── lib/                # Utilitários e configurações
├── contexts/           # Context providers
└── types/              # Definições TypeScript
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) no Supabase
- ✅ Autenticação JWT com Clerk
- ✅ Validação de dados no frontend e backend
- ✅ Criptografia de dados sensíveis
- ✅ Conformidade GDPR

## 🌍 Internacionalização

- 🇵🇹 Português (padrão)
- 🇬🇧 Inglês
- Formatação de moeda e datas localizadas

## 📱 Responsividade

- Design mobile-first
- Breakpoints otimizados
- Interface adaptativa

## 🎨 Design System

- Componentes consistentes
- Tema escuro/claro
- Paleta de cores profissional
- Tipografia otimizada

## 📈 Performance

- Lazy loading de componentes
- Otimização de bundle
- Cache inteligente
- Imagens otimizadas

## 🧪 Testes

```bash
# Executar testes
npm run test

# Executar testes com coverage
npm run test:coverage
```

## 📦 Build

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: contato@gestfin.com
- 📱 WhatsApp: +351 999 999 999
- 🌐 Website: https://gestfin.netlify.app

---

**Desenvolvido com ❤️ para simplificar sua gestão financeira**