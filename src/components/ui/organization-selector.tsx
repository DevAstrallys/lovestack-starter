import React from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOrganization } from '@/contexts/OrganizationContext';

export function OrganizationSelector() {
  const { 
    organizations, 
    selectedOrganization, 
    setSelectedOrganization, 
    loading,
    isplatformAdmin 
  } = useOrganization();
  
  const [open, setOpen] = React.useState(false);

  // Ne pas afficher le sélecteur si pas admin plateforme ou s'il n'y a qu'une organisation
  if (!isplatformAdmin || organizations.length <= 1) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <Building2 className="h-4 w-4" />
        <div className="h-8 w-48 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {selectedOrganization 
                ? selectedOrganization.name 
                : "Sélectionner une organisation..."
              }
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher une organisation..." />
          <CommandList>
            <CommandEmpty>Aucune organisation trouvée.</CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => {
                    setSelectedOrganization(org);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOrganization?.id === org.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    {org.description && (
                      <span className="text-sm text-muted-foreground">
                        {org.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}