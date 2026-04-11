import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Edit, 
  Eye, 
  Save, 
  Plus, 
  Copy,
  Trash2,
  Code,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id: string;
  name: string;
  type: 'welcome' | 'notification' | 'ticket' | 'custom';
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

const defaultTemplates = {
  welcome: {
    subject: 'Bienvenue {{name}} !',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenue</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">Bienvenue {{name}} !</h1>
  <p>Nous sommes ravis de vous accueillir dans <strong>{{organizationName}}</strong>.</p>
  <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à tous les services de notre plateforme.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{loginUrl}}" style="background-color: #007ee6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
      Accéder à la plateforme
    </a>
  </div>
  <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
  <p style="color: #666; font-size: 14px; margin-top: 30px;">
    Cordialement,<br>
    L'équipe {{organizationName}}
  </p>
</body>
</html>`,
    variables: ['name', 'organizationName', 'loginUrl']
  },
  notification: {
    subject: '{{title}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Notification</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin: 20px 0;">
    <span style="background-color: {{priorityColor}}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
      Priorité {{priorityLabel}}
    </span>
  </div>
  <h1 style="color: #333;">{{title}}</h1>
  <p>{{message}}</p>
  {{#if actionUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{actionUrl}}" style="background-color: #007ee6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
      {{actionText}}
    </a>
  </div>
  {{/if}}
  <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px;">
    Cette notification a été envoyée par {{organizationName}}.<br>
    Si vous ne souhaitez plus recevoir ces notifications, vous pouvez modifier vos préférences dans votre profil.
  </p>
</body>
</html>`,
    variables: ['title', 'message', 'priorityColor', 'priorityLabel', 'actionUrl', 'actionText', 'organizationName']
  },
  ticket: {
    subject: 'Ticket #{{ticketNumber}} - {{status}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333;">Ticket #{{ticketNumber}}</h1>
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Titre:</strong> {{title}}</p>
    <p><strong>Statut:</strong> 
      <span style="background-color: {{statusColor}}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
        {{status}}
      </span>
    </p>
    <p><strong>Priorité:</strong>
      <span style="background-color: {{priorityColor}}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
        {{priority}}
      </span>
    </p>
    {{#if assignedTo}}
    <p><strong>Assigné à:</strong> {{assignedTo}}</p>
    {{/if}}
  </div>
  {{#if description}}
  <hr style="border: 1px solid #eee; margin: 20px 0;">
  <h3>Description:</h3>
  <p style="color: #555;">{{description}}</p>
  {{/if}}
  {{#if ticketUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ticketUrl}}" style="background-color: #007ee6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
      Voir le ticket
    </a>
  </div>
  {{/if}}
  <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px;">
    Cette notification a été envoyée par {{organizationName}}.<br>
    Vous recevez cet email car vous êtes impliqué dans ce ticket.
  </p>
</body>
</html>`,
    variables: ['ticketNumber', 'title', 'status', 'statusColor', 'priority', 'priorityColor', 'assignedTo', 'description', 'ticketUrl', 'organizationName']
  }
};

export const EmailTemplatesManager = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'custom' as const,
    subject: '',
    content: '',
    variables: [] as string[]
  });
  const { toast } = useToast();

  // Simulation des templates existants (en attendant l'intégration DB)
  React.useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Email de Bienvenue',
        type: 'welcome',
        subject: defaultTemplates.welcome.subject,
        content: defaultTemplates.welcome.content,
        variables: defaultTemplates.welcome.variables,
        isActive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Notification Standard',
        type: 'notification',
        subject: defaultTemplates.notification.subject,
        content: defaultTemplates.notification.content,
        variables: defaultTemplates.notification.variables,
        isActive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Notification Ticket',
        type: 'ticket',
        subject: defaultTemplates.ticket.subject,
        content: defaultTemplates.ticket.content,
        variables: defaultTemplates.ticket.variables,
        isActive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  const handleSaveTemplate = async () => {
    if (editMode && selectedTemplate) {
      // Mise à jour d'un template existant
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id 
          ? { ...selectedTemplate, updated_at: new Date().toISOString() }
          : t
      );
      setTemplates(updatedTemplates);
      toast({
        title: "Template mis à jour",
        description: "Le template a été sauvegardé avec succès"
      });
    } else if (newTemplate.name && newTemplate.subject && newTemplate.content) {
      // Création d'un nouveau template
      const template: EmailTemplate = {
        id: Date.now().toString(),
        ...newTemplate,
        isActive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTemplates([...templates, template]);
      setNewTemplate({
        name: '',
        type: 'custom',
        subject: '',
        content: '',
        variables: []
      });
      toast({
        title: "Template créé",
        description: "Le nouveau template a été créé avec succès"
      });
      setActiveTab('list');
    }
    setEditMode(false);
  };

  const handleTestTemplate = async (template: EmailTemplate) => {
    // Ici on pourrait intégrer avec la fonction send-email pour tester
    toast({
      title: "Test en préparation",
      description: "La fonction de test sera bientôt disponible"
    });
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-green-100 text-green-800';
      case 'notification': return 'bg-blue-100 text-blue-800';
      case 'ticket': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Gestion des Templates d'Emails</span>
        </CardTitle>
        <CardDescription>
          Créez et gérez vos templates d'emails personnalisés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Templates</TabsTrigger>
            <TabsTrigger value="create">Créer</TabsTrigger>
            <TabsTrigger value="edit">Éditer</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Templates existants</h3>
              <Button onClick={() => setActiveTab('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </div>
            
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge className={getTypeColor(template.type)}>
                          {template.type}
                        </Badge>
                        {!template.isActive && (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sujet : {template.subject}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setPreviewMode(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setEditMode(true);
                          setActiveTab('edit');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestTemplate(template)}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <h3 className="text-lg font-medium">Créer un nouveau template</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Nom du template</Label>
                <Input
                  id="templateName"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Ex: Email de confirmation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateType">Type</Label>
                <Select
                  value={newTemplate.type}
                  onValueChange={(value: string) => setNewTemplate({...newTemplate, type: value as EmailTemplate['type']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Bienvenue</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSubject">Sujet de l'email</Label>
              <Input
                id="templateSubject"
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                placeholder="Ex: Bienvenue {{name}} !"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateContent">Contenu HTML</Label>
              <Textarea
                id="templateContent"
                value={newTemplate.content}
                onChange={(e) => {
                  const content = e.target.value;
                  const variables = extractVariables(content);
                  setNewTemplate({
                    ...newTemplate, 
                    content,
                    variables
                  });
                }}
                placeholder="Contenu HTML du template..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Variables disponibles</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Variables utilisateur</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code className="bg-muted px-1 rounded">{'{{name}}'}</code> - Nom de l'utilisateur</p>
                      <p><code className="bg-muted px-1 rounded">{'{{email}}'}</code> - Email de l'utilisateur</p>
                      <p><code className="bg-muted px-1 rounded">{'{{assignedTo}}'}</code> - Utilisateur assigné</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Variables organisation</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code className="bg-muted px-1 rounded">{'{{organizationName}}'}</code> - Nom de l'organisation</p>
                      <p><code className="bg-muted px-1 rounded">{'{{loginUrl}}'}</code> - URL de connexion</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Variables notification</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code className="bg-muted px-1 rounded">{'{{title}}'}</code> - Titre de la notification</p>
                      <p><code className="bg-muted px-1 rounded">{'{{message}}'}</code> - Message principal</p>
                      <p><code className="bg-muted px-1 rounded">{'{{priority}}'}</code> - Niveau de priorité</p>
                      <p><code className="bg-muted px-1 rounded">{'{{priorityColor}}'}</code> - Couleur de priorité</p>
                      <p><code className="bg-muted px-1 rounded">{'{{priorityLabel}}'}</code> - Label de priorité</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Variables ticket</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code className="bg-muted px-1 rounded">{'{{ticketNumber}}'}</code> - Numéro du ticket</p>
                      <p><code className="bg-muted px-1 rounded">{'{{status}}'}</code> - Statut du ticket</p>
                      <p><code className="bg-muted px-1 rounded">{'{{statusColor}}'}</code> - Couleur du statut</p>
                      <p><code className="bg-muted px-1 rounded">{'{{description}}'}</code> - Description du ticket</p>
                      <p><code className="bg-muted px-1 rounded">{'{{ticketUrl}}'}</code> - URL du ticket</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Variables actions</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code className="bg-muted px-1 rounded">{'{{actionUrl}}'}</code> - URL d'action</p>
                      <p><code className="bg-muted px-1 rounded">{'{{actionText}}'}</code> - Texte du bouton</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Variables conditionnelles</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <p><code className="bg-muted px-1 rounded">{'{{#if variable}}'}</code> - Condition si</p>
                      <p><code className="bg-muted px-1 rounded">{'{{/if}}'}</code> - Fin de condition</p>
                    </div>
                  </div>
                </div>
              </div>

              {newTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables détectées dans votre template</Label>
                  <div className="flex flex-wrap gap-2">
                    {newTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleSaveTemplate} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Créer le template
            </Button>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            {selectedTemplate ? (
              <>
                <h3 className="text-lg font-medium">Éditer : {selectedTemplate.name}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du template</Label>
                    <Input
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        name: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={selectedTemplate.type}
                      onValueChange={(value: string) => setSelectedTemplate({
                        ...selectedTemplate,
                        type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Bienvenue</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="ticket">Ticket</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sujet de l'email</Label>
                  <Input
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      subject: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenu HTML</Label>
                  <Textarea
                    value={selectedTemplate.content}
                    onChange={(e) => {
                      const content = e.target.value;
                      const variables = extractVariables(content);
                      setSelectedTemplate({
                        ...selectedTemplate,
                        content,
                        variables
                      });
                    }}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Variables détectées</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <Badge key={variable} variant="outline">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button onClick={handleSaveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('list')}>
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Sélectionnez un template à éditer depuis la liste
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('list')}
                  className="mt-4"
                >
                  Retour à la liste
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Modal */}
        {previewMode && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Aperçu : {selectedTemplate.name}</h3>
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Fermer
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTemplate.content) }} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};