import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendTestEmail } from '@/services/notifications';
import { createLogger } from '@/lib/logger';

const log = createLogger('component:email-tester');

export const EmailTester = () => {
  const [email, setEmail] = useState('');
  const [template, setTemplate] = useState('welcome');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const emailData = {
        template,
        to: [email],
        data: {
          name: userName || 'Utilisateur Test',
          subject: subject || 'Email de test',
          message: message || 'Ceci est un email de test envoyé depuis votre système.',
          organizationName: 'Test Organization'
        }
      };

      const data = await sendTestEmail(emailData);
      setLastResult({ 
        success: true, 
        message: `Email envoyé avec succès ! ID: ${data.email_id}` 
      });
      toast({
        title: "Email envoyé !",
        description: "L'email de test a été envoyé avec succès",
      });
    } catch (error: unknown) {
      log.error('Unexpected error sending test email', { error });
      setLastResult({ 
        success: false, 
        message: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      });
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Test d'Envoi d'Emails</span>
        </CardTitle>
        <CardDescription>
          Testez votre système d'envoi d'emails avec différents templates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email de destination</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Bienvenue</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userName">Nom d'utilisateur (optionnel)</Label>
          <Input
            id="userName"
            placeholder="Jean Dupont"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        {template === 'notification' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                placeholder="Sujet de l'email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Contenu du message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </>
        )}

        <Button 
          onClick={handleSendTestEmail}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Envoyer l'email de test
            </>
          )}
        </Button>

        {lastResult && (
          <div className={`p-4 rounded-lg border ${
            lastResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Succès' : 'Erreur'}
              </span>
            </div>
            <p className={`mt-1 text-sm ${
              lastResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {lastResult.message}
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Information</h4>
          <p className="text-sm text-muted-foreground">
            Ce test utilise la fonction Edge <code>send-email</code> configurée avec Resend.
            Vérifiez les logs de la fonction pour plus de détails sur l'envoi.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};