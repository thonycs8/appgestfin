import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, Download, Trash2, Eye, Edit } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth, useUser } from '@clerk/clerk-react';

interface GDPRSettings {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  necessary: boolean;
}

export function GDPRCompliance() {
  const { language } = useApp();
  const { user } = useUser();
  const { signOut } = useAuth();
  
  const [settings, setSettings] = useState<GDPRSettings>({
    analytics: false,
    marketing: false,
    functional: true,
    necessary: true
  });

  const [showDataExport, setShowDataExport] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const content = {
    pt: {
      title: 'Conformidade GDPR',
      subtitle: 'Gerencie suas preferências de privacidade e dados pessoais',
      consentManagement: 'Gestão de Consentimento',
      dataRights: 'Seus Direitos de Dados',
      cookieSettings: 'Configurações de Cookies',
      necessary: 'Necessários',
      necessaryDesc: 'Essenciais para o funcionamento do site',
      functional: 'Funcionais',
      functionalDesc: 'Melhoram a funcionalidade e personalização',
      analytics: 'Analíticos',
      analyticsDesc: 'Nos ajudam a entender como você usa o site',
      marketing: 'Marketing',
      marketingDesc: 'Usados para publicidade direcionada',
      viewData: 'Ver Meus Dados',
      exportData: 'Exportar Dados',
      deleteData: 'Excluir Dados',
      updateData: 'Atualizar Dados',
      dataExportTitle: 'Exportar Seus Dados',
      dataExportDesc: 'Baixe uma cópia de todos os seus dados pessoais',
      exportFormat: 'Formato de Exportação',
      startExport: 'Iniciar Exportação',
      deleteAccountTitle: 'Excluir Conta',
      deleteAccountDesc: 'Esta ação excluirá permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.',
      deleteAccountConfirm: 'Excluir Permanentemente',
      dataProcessingBasis: 'Base Legal para Processamento',
      consentBasis: 'Consentimento',
      contractBasis: 'Execução de Contrato',
      legitimateInterest: 'Interesse Legítimo',
      legalObligation: 'Obrigação Legal',
      lastUpdated: 'Última atualização',
      saveSettings: 'Salvar Configurações'
    },
    en: {
      title: 'GDPR Compliance',
      subtitle: 'Manage your privacy preferences and personal data',
      consentManagement: 'Consent Management',
      dataRights: 'Your Data Rights',
      cookieSettings: 'Cookie Settings',
      necessary: 'Necessary',
      necessaryDesc: 'Essential for website functionality',
      functional: 'Functional',
      functionalDesc: 'Improve functionality and personalization',
      analytics: 'Analytics',
      analyticsDesc: 'Help us understand how you use the site',
      marketing: 'Marketing',
      marketingDesc: 'Used for targeted advertising',
      viewData: 'View My Data',
      exportData: 'Export Data',
      deleteData: 'Delete Data',
      updateData: 'Update Data',
      dataExportTitle: 'Export Your Data',
      dataExportDesc: 'Download a copy of all your personal data',
      exportFormat: 'Export Format',
      startExport: 'Start Export',
      deleteAccountTitle: 'Delete Account',
      deleteAccountDesc: 'This action will permanently delete your account and all associated data. This action cannot be undone.',
      deleteAccountConfirm: 'Delete Permanently',
      dataProcessingBasis: 'Legal Basis for Processing',
      consentBasis: 'Consent',
      contractBasis: 'Contract Performance',
      legitimateInterest: 'Legitimate Interest',
      legalObligation: 'Legal Obligation',
      lastUpdated: 'Last updated',
      saveSettings: 'Save Settings'
    }
  };

  const t = content[language];

  const handleSettingChange = (key: keyof GDPRSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userData = {
        user: {
          id: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName,
          createdAt: user?.createdAt
        },
        exportDate: new Date().toISOString(),
        dataTypes: ['transactions', 'categories', 'payables', 'preferences']
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gestfin-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowDataExport(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real implementation, this would call an API to delete all user data
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t.title}</CardTitle>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cookie Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.cookieSettings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{t.necessary}</Label>
                  <Badge variant="secondary">Sempre Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.necessaryDesc}</p>
              </div>
              <Switch checked={settings.necessary} disabled />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">{t.functional}</Label>
                <p className="text-sm text-muted-foreground">{t.functionalDesc}</p>
              </div>
              <Switch 
                checked={settings.functional} 
                onCheckedChange={(value) => handleSettingChange('functional', value)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">{t.analytics}</Label>
                <p className="text-sm text-muted-foreground">{t.analyticsDesc}</p>
              </div>
              <Switch 
                checked={settings.analytics} 
                onCheckedChange={(value) => handleSettingChange('analytics', value)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">{t.marketing}</Label>
                <p className="text-sm text-muted-foreground">{t.marketingDesc}</p>
              </div>
              <Switch 
                checked={settings.marketing} 
                onCheckedChange={(value) => handleSettingChange('marketing', value)}
              />
            </div>
          </div>

          <Button className="w-full">{t.saveSettings}</Button>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dataRights}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Eye className="h-6 w-6 mb-2" />
              {t.viewData}
            </Button>

            <Dialog open={showDataExport} onOpenChange={setShowDataExport}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Download className="h-6 w-6 mb-2" />
                  {t.exportData}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.dataExportTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{t.dataExportDesc}</p>
                  <div className="space-y-2">
                    <Label>{t.exportFormat}</Label>
                    <select className="w-full p-2 border rounded">
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  <Button 
                    onClick={handleExportData} 
                    disabled={exportLoading}
                    className="w-full"
                  >
                    {exportLoading ? 'Exportando...' : t.startExport}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Edit className="h-6 w-6 mb-2" />
              {t.updateData}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-red-600 hover:text-red-700">
                  <Trash2 className="h-6 w-6 mb-2" />
                  {t.deleteData}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.deleteAccountTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.deleteAccountDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t.deleteAccountConfirm}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Legal Basis */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dataProcessingBasis}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Dados de conta e autenticação</span>
              <Badge>{t.contractBasis}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Dados financeiros</span>
              <Badge>{t.contractBasis}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Cookies analíticos</span>
              <Badge>{t.consentBasis}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Cookies de marketing</span>
              <Badge>{t.consentBasis}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Logs de segurança</span>
              <Badge>{t.legitimateInterest}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>{t.lastUpdated}: 24 de dezembro de 2024</p>
        <p>Para dúvidas sobre privacidade: privacidade@gestfin.com</p>
      </div>
    </div>
  );
}