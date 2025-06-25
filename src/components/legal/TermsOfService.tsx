import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

export function TermsOfService() {
  const { language } = useApp();

  const content = {
    pt: {
      title: 'Termos de Serviço',
      lastUpdated: 'Última atualização: 24 de dezembro de 2024',
      sections: [
        {
          title: '1. Aceitação dos Termos',
          content: 'Ao acessar e usar o Gestfin, você concorda em cumprir estes Termos de Serviço e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.'
        },
        {
          title: '2. Descrição do Serviço',
          content: 'O Gestfin é uma plataforma de gestão financeira que permite aos usuários controlar receitas, despesas, categorias e contas a pagar. O serviço é fornecido "como está" e pode ser modificado ou descontinuado a qualquer momento.'
        },
        {
          title: '3. Conta de Usuário',
          content: 'Para usar certas funcionalidades do serviço, você deve criar uma conta. Você é responsável por manter a confidencialidade de sua conta e senha e por todas as atividades que ocorrem sob sua conta.'
        },
        {
          title: '4. Uso Aceitável',
          content: 'Você concorda em não usar o serviço para: (a) atividades ilegais ou não autorizadas; (b) violar direitos de propriedade intelectual; (c) transmitir vírus ou código malicioso; (d) tentar obter acesso não autorizado ao sistema.'
        },
        {
          title: '5. Privacidade',
          content: 'Sua privacidade é importante para nós. Nossa Política de Privacidade explica como coletamos, usamos e protegemos suas informações quando você usa nosso serviço.'
        },
        {
          title: '6. Propriedade Intelectual',
          content: 'O serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva do Gestfin e seus licenciadores.'
        },
        {
          title: '7. Limitação de Responsabilidade',
          content: 'Em nenhuma circunstância o Gestfin será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis.'
        },
        {
          title: '8. Modificações',
          content: 'Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer pelo menos 30 dias de aviso antes de quaisquer novos termos entrarem em vigor.'
        },
        {
          title: '9. Lei Aplicável',
          content: 'Estes Termos serão interpretados e regidos de acordo com as leis de Portugal, sem considerar suas disposições de conflito de leis.'
        },
        {
          title: '10. Contato',
          content: 'Se você tiver alguma dúvida sobre estes Termos de Serviço, entre em contato conosco em: contato@gestfin.com'
        }
      ]
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: December 24, 2024',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: 'By accessing and using Gestfin, you agree to comply with these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.'
        },
        {
          title: '2. Service Description',
          content: 'Gestfin is a financial management platform that allows users to control income, expenses, categories and payables. The service is provided "as is" and may be modified or discontinued at any time.'
        },
        {
          title: '3. User Account',
          content: 'To use certain features of the service, you must create an account. You are responsible for maintaining the confidentiality of your account and password and for all activities that occur under your account.'
        },
        {
          title: '4. Acceptable Use',
          content: 'You agree not to use the service for: (a) illegal or unauthorized activities; (b) violating intellectual property rights; (c) transmitting viruses or malicious code; (d) attempting to gain unauthorized access to the system.'
        },
        {
          title: '5. Privacy',
          content: 'Your privacy is important to us. Our Privacy Policy explains how we collect, use and protect your information when you use our service.'
        },
        {
          title: '6. Intellectual Property',
          content: 'The service and its original content, features and functionality are and will remain the exclusive property of Gestfin and its licensors.'
        },
        {
          title: '7. Limitation of Liability',
          content: 'Under no circumstances shall Gestfin be liable for indirect, incidental, special, consequential or punitive damages, including, without limitation, loss of profits, data, use, goodwill or other intangible losses.'
        },
        {
          title: '8. Modifications',
          content: 'We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.'
        },
        {
          title: '9. Governing Law',
          content: 'These Terms shall be interpreted and governed in accordance with the laws of Portugal, without regard to its conflict of law provisions.'
        },
        {
          title: '10. Contact',
          content: 'If you have any questions about these Terms of Service, please contact us at: contact@gestfin.com'
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