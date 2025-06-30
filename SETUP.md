# 🚀 Guia de Configuração do Gestfin

## Status Atual
✅ **Aplicação implantada**: https://gestfin.netlify.app  
✅ **Código fonte completo**  
✅ **Banco de dados estruturado**  
⚠️ **Configurações de serviços externos** - REQUER ATENÇÃO

## 🔧 CORREÇÃO URGENTE - Erro do Clerk

### ❌ Problema Atual
A aplicação está apresentando erro de inicialização do Clerk. Isso acontece quando:
1. A chave do Clerk não é válida
2. O domínio não está configurado corretamente no Clerk
3. A chave está incorreta no arquivo `.env`

### ✅ Solução Imediata

#### 1. Verificar/Obter Nova Chave do Clerk
1. **Acesse**: https://dashboard.clerk.com
2. **Vá para**: API Keys
3. **Copie a Publishable Key** (deve começar com `pk_test_` ou `pk_live_`)
4. **Crie um arquivo `.env` baseado no `.env.example` e adicione sua chave**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=sua_nova_chave_aqui
   ```

#### 2. Configurar Domínios no Clerk
1. **No painel do Clerk**, vá para **Settings** → **Domains**
2. **Adicione os domínios**:
   - Development: `http://localhost:5173`
   - Production: `https://gestfin.netlify.app`
3. **Salve as configurações**

#### 3. Verificar Configuração
Após as alterações:
1. **Reinicie o servidor de desenvolvimento**
2. **Limpe o cache do navegador**
3. **Teste o acesso à aplicação**

---

## 📋 Configuração Completa dos Serviços

### 1. Configurar Supabase

1. **Acesse**: https://supabase.com
2. **Crie um novo projeto** ou use um existente
3. **Copie as credenciais**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Configure as Edge Functions**:
   ```bash
   # No painel do Supabase, vá em Edge Functions
   # Faça upload das funções em /supabase/functions/
   ```

### 2. Configurar Clerk (Autenticação) - CRÍTICO

1. **Acesse**: https://clerk.com
2. **Crie uma nova aplicação**
3. **Configure os domínios** (OBRIGATÓRIO):
   - Development: `http://localhost:5173`
   - Production: `https://gestfin.netlify.app`
4. **Copie a Publishable Key** (pk_test_...)
5. **Atualize o arquivo `.env`**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_real_aqui
   ```

### 3. Configurar Stripe (Pagamentos)

1. **Acesse**: https://dashboard.stripe.com
2. **Obtenha as chaves**:
   - Secret Key (sk_test_...)
   - Webhook Secret (whsec_...)
3. **Configure o webhook endpoint**:
   - URL: `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`

### 4. Configurar Variáveis no Netlify

1. **Acesse**: https://app.netlify.com
2. **Vá para**: Site settings → Environment variables
3. **Adicione**:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_real_aqui
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 5. Configurar Variáveis no Supabase

1. **Acesse**: Project Settings → Edge Functions
2. **Adicione**:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 🧪 Testes de Funcionalidade

Após as configurações, teste:

### ✅ Autenticação (PRIORIDADE)
- [ ] Carregamento da página sem erros
- [ ] Registro de novo usuário
- [ ] Login/Logout
- [ ] Proteção de rotas

### ✅ Funcionalidades Core
- [ ] Criar transações (receitas/despesas)
- [ ] Gerenciar categorias
- [ ] Contas a pagar
- [ ] Dashboard com gráficos

### ✅ Sistema de Assinaturas
- [ ] Visualizar planos
- [ ] Processo de checkout
- [ ] Webhooks do Stripe
- [ ] Atualização de status

## 🎯 Recursos Implementados

### 📊 **Dashboard Inteligente**
- Métricas em tempo real
- Gráficos interativos
- Visão por grupos (Empresa/Família)

### 💰 **Gestão Financeira**
- Receitas e despesas ilimitadas
- Categorização automática
- Contas a pagar com alertas
- Metas financeiras

### 🔔 **Sistema de Alertas**
- Contas vencidas
- Orçamentos no limite
- Metas próximas do prazo
- Notificações personalizáveis

### 👥 **Multi-usuário**
- Separação por grupos
- Permissões granulares
- Painel administrativo

### 💳 **Assinaturas Premium**
- Integração completa com Stripe
- Múltiplos planos
- Período de teste gratuito
- Gestão de assinaturas

### 🔒 **Segurança**
- Autenticação com Clerk
- RLS (Row Level Security)
- Criptografia de dados
- Conformidade GDPR

### 🌍 **Internacionalização**
- Português e Inglês
- Formatação de moeda
- Datas localizadas

## 📱 **Design Responsivo**
- Mobile-first
- Interface moderna
- Componentes reutilizáveis
- Tema escuro/claro

## 🚀 **Performance**
- Lazy loading
- Otimização de imagens
- Cache inteligente
- Bundle otimizado

---

## 💡 Dicas Importantes

1. **SEMPRE use chaves reais** do Clerk - chaves de exemplo não funcionam
2. **Configure domínios** no Clerk antes de testar
3. **Teste em ambiente local primeiro** antes de configurar produção
4. **Use chaves de teste** do Stripe durante desenvolvimento
5. **Configure webhooks** para sincronização automática
6. **Monitore logs** no Supabase e Netlify para debug

## 🆘 Suporte

Se encontrar problemas:
1. **Verifique os logs** no console do navegador
2. **Confirme as variáveis de ambiente** estão corretas
3. **Teste a conectividade** com os serviços
4. **Verifique as permissões RLS** no Supabase
5. **Confirme os domínios** no Clerk

## ⚠️ Problemas Comuns

### Erro de Clerk (Atual)
- **Causa**: Chave inválida ou domínio não configurado
- **Solução**: Seguir os passos da "Correção Urgente" acima

### Erro de Supabase
- **Causa**: URL ou chave incorreta
- **Solução**: Verificar credenciais no painel do Supabase

### Erro de Stripe
- **Causa**: Webhook não configurado
- **Solução**: Configurar endpoint no dashboard do Stripe

---

**🎉 Sua aplicação estará pronta após corrigir o Clerk!**