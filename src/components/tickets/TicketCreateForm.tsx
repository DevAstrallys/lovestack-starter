import { useState, useEffect } from 'react';
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
import { Camera, FileText, Video, Mic, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/hooks/useTaxonomy';
import { useLocations } from '@/hooks/useLocations';
import { buildTicketTitle, InitialityType } from '@/utils/ticketUtils';
import { TicketFormStep } from './TicketFormStep';

const ticketFormSchema = z.object({
  // Sélection du lieu
  locationId: z.string().min(1, 'Veuillez sélectionner un lieu'),
  
  // Initialité et relance
  initiality: z.enum(['initial', 'relance'] as const, {
    required_error: 'Veuillez choisir le type d\'initiative',
  }),
  followUpOfId: z.string().optional(),

  // Taxonomie selon cahier des charges
  action: z.string().min(1, 'Veuillez sélectionner une action'),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  object: z.string().min(1, 'Veuillez sélectionner un objet'),

  // Informations personnelles
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

  // Description et priorité
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Veuillez sélectionner une priorité',
  }),

  // Acceptations
  acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter la politique de confidentialité',
  }),
  wantNotifications: z.boolean().default(false),
}).refine((data) => {
  // Si c'est une relance, il faut un ticket d'origine
  if (data.initiality === 'relance' && !data.followUpOfId) {
    return false;
  }
  return true;
}, {
  message: "Une relance doit référencer un ticket d'origine",
  path: ["followUpOfId"]
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
  const [availableTickets, setAvailableTickets] = useState<Array<{id: string, title: string}>>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  // Hooks pour les données
  const { locations, loading: locationsLoading } = useLocations();
  const { 
    actions, 
    getFilteredCategories, 
    getFilteredObjects, 
    loading: taxonomyLoading 
  } = useTaxonomy(selectedLocationId);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      locationId: '',
      initiality: 'initial',
      followUpOfId: undefined,
      action: '',
      category: '',
      object: '',
      lastName: '',
      firstName: '',
      email: '',
      phone: '+33',
      userType: undefined,
      communicationMode: undefined,
      description: '',
      priority: 'medium',
      acceptPrivacyPolicy: false,
      wantNotifications: false,
    },
  });

  // Surveillance des changements pour générer le titre automatiquement
  const watchedValues = form.watch(['initiality', 'action', 'category', 'object']);
  const watchedLocationId = form.watch('locationId');
  const watchedInitiality = form.watch('initiality');

  useEffect(() => {
    const [initiality, action, category, object] = watchedValues;
    if (action && category && object) {
      const title = buildTicketTitle({
        initiality: initiality as InitialityType,
        action,
        category,
        object,
        relanceIndex: 1 // Pour l'aperçu, on affiche toujours #1
      });
      setPreviewTitle(title);
    } else {
      setPreviewTitle('');
    }
  }, watchedValues);

  // Synchroniser le lieu sélectionné
  useEffect(() => {
    setSelectedLocationId(watchedLocationId || '');
  }, [watchedLocationId]);

  // Charger les tickets disponibles pour relance
  useEffect(() => {
    if (selectedLocationId && watchedInitiality === 'relance') {
      loadAvailableTicketsForLocation(selectedLocationId);
    }
  }, [selectedLocationId, watchedInitiality]);

  const loadAvailableTicketsForLocation = async (locationId: string) => {
    // Pour l'instant, on simule des tickets vides
    setAvailableTickets([]);
  };

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
      // Générer le titre automatique final
      const finalTitle = buildTicketTitle({
        initiality: data.initiality,
        action: data.action,
        category: data.category,
        object: data.object,
        relanceIndex: 1 // L'index sera calculé par le trigger
      });

      // Simulation pour test - remplacer par vraie insertion plus tard
      console.log('Ticket data:', {
        location_id: data.locationId,
        initiality: data.initiality,
        action: data.action,
        category: data.category,
        object: data.object,
        title: finalTitle,
        description: data.description,
        priority: data.priority,
        created_by: user.id
      });
      
      // Simuler un succès
      const error = null;

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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const selectedAction = form.watch('action');
  const selectedCategory = form.watch('category');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Étape 1: Sélection du lieu et initialité */}
        {currentStep === 1 && (
          <TicketFormStep title="Étape 1: Lieu et Type">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un lieu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initiality"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type d'initiative *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="initial" id="initial" />
                        <label htmlFor="initial" className="cursor-pointer">Initial</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="relance" id="relance" />
                        <label htmlFor="relance" className="cursor-pointer">Relance</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedInitiality === 'relance' && (
              <FormField
                control={form.control}
                name="followUpOfId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket d'origine *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le ticket d'origine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTickets.map((ticket) => (
                          <SelectItem key={ticket.id} value={ticket.id}>
                            {ticket.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-between pt-4">
              <div></div>
              <Button type="button" onClick={nextStep} disabled={!selectedLocationId}>
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TicketFormStep>
        )}

        {/* Étape 2: Action, catégorie, objet selon taxonomie */}
        {currentStep === 2 && (
          <TicketFormStep title="Étape 2: Classification">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action *</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Reset category et object quand on change d'action
                    form.setValue('category', '');
                    form.setValue('object', '');
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {actions.map((action) => (
                        <SelectItem key={action.id} value={action.label}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAction && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie *</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Reset object quand on change de catégorie
                      form.setValue('object', '');
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getFilteredCategories(actions.find(a => a.label === selectedAction)?.id || '').map((category) => (
                          <SelectItem key={category.id} value={category.label}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedCategory && (
              <FormField
                control={form.control}
                name="object"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objet *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un objet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getFilteredObjects(getFilteredCategories(actions.find(a => a.label === selectedAction)?.id || '').find(c => c.label === selectedCategory)?.id || '').map((object) => (
                          <SelectItem key={object.id} value={object.label}>
                            {object.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {previewTitle && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Aperçu du titre:</span>
                </div>
                <p className="mt-2 text-sm font-mono bg-background p-2 rounded border">
                  {previewTitle}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
              </Button>
              <Button type="button" onClick={nextStep} disabled={!selectedAction || !selectedCategory || !form.watch('object')}>
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TicketFormStep>
        )}

        {/* Étape 3: Informations personnelles */}
        {currentStep === 3 && (
          <TicketFormStep title="Étape 3: Informations personnelles">
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <FormLabel>Moyen de communication privilégié *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
              </Button>
              <Button type="button" onClick={nextStep}>
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TicketFormStep>
        )}

        {/* Étape 4: Description, pièces jointes et validation */}
        {currentStep === 4 && (
          <TicketFormStep title="Étape 4: Description et validation">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez en détail votre demande, signalement ou information..."
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Pièces jointes (optionnel)</label>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Document
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Vidéo
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Mic className="h-4 w-4 mr-2" />
                  Audio
                </Button>
              </div>
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
                        J'accepte la politique de confidentialité d'Astrallys *
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

            {previewTitle && (
              <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Titre final du ticket:</span>
                </div>
                <p className="mt-2 text-sm font-mono bg-background p-3 rounded border">
                  {previewTitle}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                {isSubmitting ? 'Envoi...' : 'CRÉER LE TICKET'}
              </Button>
            </div>
          </TicketFormStep>
        )}

        {/* Indicateur de progression */}
        <div className="flex justify-center space-x-2 pt-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step 
                  ? 'bg-primary text-primary-foreground' 
                  : currentStep > step
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </form>
    </Form>
  );
};