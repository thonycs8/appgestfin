import { useState } from 'react';
import { Shield, Database, Settings, Activity, AlertTriangle, CheckCircle, Server, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const systemStats = {
  uptime: '99.9%',
  totalUsers: 156,
  activeUsers: 89,
  totalTransactions: 2847,
  storageUsed: 68,
  memoryUsage: 45,
  cpuUsage: 23
};

const systemLogs = [
  {
    id: '1',
    timestamp: '2024-01-20 14:30:25',
    level: 'info',
    message: 'Usuário admin@missaodesign.com fez login',
    source: 'auth'
  },
  {
    id: '2',
    timestamp: '2024-01-20 14:25:10',
    level: 'warning',
    message: 'Tentativa de login falhada para usuario@teste.com',
    source: 'auth'
  },
  {
    id: '3',
    timestamp: '2024-01-20 14:20:05',
    level: 'error',
    message: 'Erro na conexão com banco de dados',
    source: 'database'
  },
  {
    id: '4',
    timestamp: '2024-01-20 14:15:30',
    level: 'info',
    message: 'Backup automático concluído com sucesso',
    source: 'system'
  }
];

const systemSettings = {
  maintenanceMode: false,
  allowRegistrations: true,
  emailNotifications: true,
  backupEnabled: true,
  debugMode: false,
  maxFileSize: '10',
  sessionTimeout: '30'
};

export function AdminSystem() {
  const [settings, setSettings] = useState(systemSettings);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Sistema em manutenção. Voltaremos em breve.');

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.uptime}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CPU</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.cpuUsage}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Memória</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.memoryUsage}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <HardDrive className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Armazenamento</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.storageUsed}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Uso de Recursos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU</span>
                    <span>{systemStats.cpuUsage}%</span>
                  </div>
                  <Progress value={systemStats.cpuUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memória</span>
                    <span>{systemStats.memoryUsage}%</span>
                  </div>
                  <Progress value={systemStats.memoryUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Armazenamento</span>
                    <span>{systemStats.storageUsed}%</span>
                  </div>
                  <Progress value={systemStats.storageUsed} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Uso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total de Usuários</span>
                  <span className="text-blue-600 font-bold">{systemStats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Usuários Ativos</span>
                  <span className="text-green-600 font-bold">{systemStats.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total de Transações</span>
                  <span className="text-purple-600 font-bold">{systemStats.totalTransactions}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Banco de Dados</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">API</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Autenticação</span>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Email</span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Lento</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Modo Manutenção</Label>
                      <p className="text-sm text-gray-600">Desabilita o acesso ao sistema</p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(value) => handleSettingChange('maintenanceMode', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registrations">Permitir Registros</Label>
                      <p className="text-sm text-gray-600">Permite novos usuários se registrarem</p>
                    </div>
                    <Switch
                      id="registrations"
                      checked={settings.allowRegistrations}
                      onCheckedChange={(value) => handleSettingChange('allowRegistrations', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Notificações por Email</Label>
                      <p className="text-sm text-gray-600">Envia notificações automáticas</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="backup">Backup Automático</Label>
                      <p className="text-sm text-gray-600">Realiza backups diários</p>
                    </div>
                    <Switch
                      id="backup"
                      checked={settings.backupEnabled}
                      onCheckedChange={(value) => handleSettingChange('backupEnabled', value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fileSize">Tamanho Máximo de Arquivo (MB)</Label>
                    <Input
                      id="fileSize"
                      type="number"
                      value={settings.maxFileSize}
                      onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="debug">Modo Debug</Label>
                      <p className="text-sm text-gray-600">Ativa logs detalhados</p>
                    </div>
                    <Switch
                      id="debug"
                      checked={settings.debugMode}
                      onCheckedChange={(value) => handleSettingChange('debugMode', value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-1 rounded ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{log.message}</p>
                        <Badge variant="outline" className="text-xs">
                          {log.source}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6">
                <Button variant="outline">Carregar Mais Logs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas de Manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="maintenanceMessage">Mensagem de Manutenção</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Digite a mensagem que será exibida durante a manutenção..."
                  className="mt-2"
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Database className="h-6 w-6 mb-2" />
                  Backup Manual
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  Limpar Cache
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Activity className="h-6 w-6 mb-2" />
                  Verificar Sistema
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Shield className="h-6 w-6 mb-2" />
                  Auditoria de Segurança
                </Button>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-red-700">Zona de Perigo</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="destructive" className="h-16 flex flex-col items-center justify-center">
                    <AlertTriangle className="h-5 w-5 mb-1" />
                    Reiniciar Sistema
                  </Button>
                  
                  <Button variant="destructive" className="h-16 flex flex-col items-center justify-center">
                    <Database className="h-5 w-5 mb-1" />
                    Reset Banco de Dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}