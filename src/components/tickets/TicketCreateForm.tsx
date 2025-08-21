import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileText, Video, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ticketFormSchema = z.object({
  lastName: z.string().min(1, 'Le nom est requis'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  userType: z.enum(['locataire', 'proprietaire', 'intervenant', 'visiteur'], {
    required_error: 'Veuillez sélectionner votre statut',
  }),
  communicationMode: z.enum(['email', 'sms'], {
    required_error: 'Veuillez choisir un moyen de communication',
  }),
  requestType: z.enum(['demande', 'signalement'], {
    required_error: 'Veuillez choisir le type de demande',
  }),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Veuillez sélectionner une priorité',
  }),
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter la politique de confidentialité',
  }),
  wantNotifications: z.boolean().default(false),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketCreateFormProps {
  onSuccess?: () => void;
}

export const TicketCreateForm = ({ onSuccess }: TicketCreateFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      phone: '+33',
      userType: undefined,
      communicationMode: undefined,
      requestType: 'demande',
      description: '',
      priority: 'medium',
      acceptPrivacyPolicy: false,
      wantNotifications: false,
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer un ticket',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For now, we'll use a placeholder building_id - this should be selected in a real scenario
      const { error } = await supabase.from('tickets').insert({
        title: `${data.requestType === 'demande' ? 'Demande' : 'Signalement'} - ${data.firstName} ${data.lastName}`,
        description: data.description,
        status: 'open',
        priority: data.priority,
        category_code: data.requestType === 'demande' ? 'maintenance_request' : 'incident_report',
        created_by: user.id,
        building_id: '00000000-0000-0000-0000-000000000000', // Placeholder - should be selected
        contact_info: {
          phone: data.phone,
          email: data.email,
          communication_mode: data.communicationMode,
          user_type: data.userType
        }
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Votre ticket a été créé avec succès',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création du ticket',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(2);
  const prevStep = () => setCurrentStep(1);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Je suis ? *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="locataire">Locataire</SelectItem>
                        <SelectItem value="proprietaire">Propriétaire</SelectItem>
                        <SelectItem value="intervenant">Intervenant</SelectItem>
                        <SelectItem value="visiteur">Visiteur</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communicationMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quel moyen de communication voulez-vous privilégier ? *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez votre mode de communication" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <div></div>
                <Button type="button" onClick={nextStep}>
                  Suivant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Détails de la demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Je demande / Je signale</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="demande" id="demande" />
                          <label htmlFor="demande">Je demande</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="signalement" id="signalement" />
                          <label htmlFor="signalement">Je signale</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre demande ou signalement..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la priorité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" size="icon">
                  <Camera className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="acceptPrivacyPolicy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          J'accepte la politique de confidentialité d'Astrallys*
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wantNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Je souhaite être informé des étapes de résolution
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Précédent
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Envoi...' : 'SOUMETTRE'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination indicator */}
        <div className="flex justify-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
            currentStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
            currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>
      </form>
    </Form>
  );
};