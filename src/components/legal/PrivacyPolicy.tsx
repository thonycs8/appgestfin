import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

export function PrivacyPolicy() {
  const { language } = useApp();

  const content = {
    pt: {
      title: 'Política de Privacidade',
      lastUpdated: 'Última atualização: 24 de dezembro de 2024',
      sections: [
        {
          title: '1. Informações que Coletamos',
          content: 'Coletamos informações que você nos fornece diretamente, como quando você cria uma conta, adiciona transações financeiras, ou entra em contato conosco. Isso inclui: nome, endereço de email, dados financeiros (receitas, despesas, categorias), e informações de uso do serviço.'
        },
        {
          title: '2. Como Usamos Suas Informações',
          content: 'Usamos as informações coletadas para: (a) fornecer, manter e melhorar nossos serviços; (b) processar transações e enviar notificações relacionadas; (c) responder a comentários e perguntas; (d) enviar informações técnicas, atualizações e alertas de segurança.'
        },
        {
          title: '3. Compartilhamento de Informações',
          content: 'Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto: (a) com seu consentimento; (b) para cumprir obrigações legais; (c) para proteger nossos direitos e segurança; (d) com prestadores de serviços que nos ajudam a operar nosso serviço.'
        },
        {
          title: '4. Segurança dos Dados',
          content: 'Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia de dados, controles de acesso e monitoramento regular.'
        },
        {
          title: '5. Retenção de Dados',
          content: 'Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.'
        },
        {
          title: '6. Seus Direitos (GDPR)',
          content: 'Sob o GDPR, você tem direito a: (a) acessar suas informações pessoais; (b) retificar informações imprecisas; (c) apagar suas informações; (d) restringir o processamento; (e) portabilidade de dados; (f) opor-se ao processamento; (g) retirar consentimento.'
        },
        {
          title: '7. Cookies e Tecnologias Similares',
          content: 'Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.'
        },
        {
          title: '8. Transferências Internacionais',
          content: 'Suas informações podem ser transferidas e mantidas em computadores localizados fora do seu país, onde as leis de proteção de dados podem diferir. Garantimos proteções adequadas para tais transferências.'
        },
        {
          title: '9. Alterações nesta Política',
          content: 'Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova política nesta página e atualizando a data de "última atualização".'
        },
        {
          title: '10. Contato',
          content: 'Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos, entre em contato conosco em: privacidade@gestfin.com ou pelo endereço: Gestfin, Rua da Privacidade 123, 1000-000 Lisboa, Portugal.'
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: December 24, 2024',
      sections: [
        {
          title: '1. Information We Collect',
          content: 'We collect information you provide directly to us, such as when you create an account, add financial transactions, or contact us. This includes: name, email address, financial data (income, expenses, categories), and service usage information.'
        },
        {
          title: '2. How We Use Your Information',
          content: 'We use the collected information to: (a) provide, maintain and improve our services; (b) process transactions and send related notifications; (c) respond to comments and questions; (d) send technical information, updates and security alerts.'
        },
        {
          title: '3. Information Sharing',
          content: 'We do not sell, trade or transfer your personal information to third parties, except: (a) with your consent; (b) to comply with legal obligations; (c) to protect our rights and security; (d) with service providers who help us operate our service.'
        },
        {
          title: '4. Data Security',
          content: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure or destruction. This includes data encryption, access controls and regular monitoring.'
        },
        {
          title: '5. Data Retention',
          content: 'We retain your personal information only for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required or permitted by law.'
        },
        {
          title: '6. Your Rights (GDPR)',
          content: 'Under GDPR, you have the right to: (a) access your personal information; (b) rectify inaccurate information; (c) erase your information; (d) restrict processing; (e) data portability; (f) object to processing; (g) withdraw consent.'
        },
        {
          title: '7. Cookies and Similar Technologies',
          content: 'We use cookies and similar technologies to improve your experience, analyze service usage and personalize content. You can control cookie usage through your browser settings.'
        },
        {
          title: '8. International Transfers',
          content: 'Your information may be transferred to and maintained on computers located outside your country, where data protection laws may differ. We ensure adequate protections for such transfers.'
        },
        {
          title: '9. Changes to This Policy',
          content: 'We may update our Privacy Policy periodically. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.'
        },
        {
          title: '10. Contact',
          content: 'If you have questions about this Privacy Policy or want to exercise your rights, contact us at: privacy@gestfin.com or at the address: Gestfin, Privacy Street 123, 1000-000 Lisbon, Portugal.'
        }
      ]
    }
  };

  const t = content[language];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{t.title}</CardTitle>
          <p className="text-muted-foreground">{t.lastUpdated}</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {t.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-xl font-semibold">{section.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}