import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function SubscriptionCancel() {
  const { language } = useApp();

  const handleGoBack = () => {
    window.location.href = '/subscription';
  };

  const handleTryAgain = () => {
    window.location.href = '/subscription';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">
            {language === 'pt' ? 'Assinatura Cancelada' : 'Subscription Cancelled'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {language === 'pt' 
                ? 'Sua assinatura foi cancelada. Nenhuma cobrança foi realizada.'
                : 'Your subscription was cancelled. No charges were made.'
              }
            </p>
            
            <p className="text-sm text-muted-foreground">
              {language === 'pt' 
                ? 'Você pode tentar novamente a qualquer momento ou continuar usando a versão gratuita.'
                : 'You can try again anytime or continue using the free version.'
              }
            </p>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleTryAgain} className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              {language === 'pt' ? 'Tentar Novamente' : 'Try Again'}
            </Button>
            
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'pt' ? 'Voltar ao Dashboard' : 'Back to Dashboard'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}