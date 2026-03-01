import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { OrgLogo } from '@/components/ui/org-logo';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Ticket,
  MapPin,
  Users,
  Settings,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { title: 'Accueil', url: '/', icon: LayoutDashboard },
  { title: 'Tickets', url: '/tickets', icon: Ticket },
  { title: 'Lieux', url: '/locations', icon: MapPin },
  { title: 'Utilisateurs', url: '/users', icon: Users },
  { title: 'Administration', url: '/admin', icon: Shield },
];

const BOTTOM_ITEMS = [
  { title: 'Mon Profil', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedOrganization } = useOrganization();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error('Erreur de déconnexion');
    else toast.success('Déconnecté');
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-2">
        {/* Logo / Org branding */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-4 mb-2',
          collapsed && 'justify-center px-2'
        )}>
          <OrgLogo size={collapsed ? 'sm' : 'md'} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sidebar-primary truncate">
                {selectedOrganization?.name || 'ASTRALINK'}
              </p>
              <p className="text-[11px] text-sidebar-foreground/60 truncate">
                Plateforme de gestion
              </p>
            </div>
          )}
        </div>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                      className={cn(
                        'h-10 transition-all duration-150',
                        active && 'bg-sidebar-accent text-sidebar-primary font-semibold'
                      )}
                    >
                      <item.icon className={cn('h-[18px] w-[18px]', active && 'text-sidebar-primary')} />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {BOTTOM_ITEMS.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                tooltip={item.title}
                className={cn(
                  'h-10',
                  isActive(item.url) && 'bg-sidebar-accent text-sidebar-primary font-semibold'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {!collapsed && <span>{item.title}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Déconnexion"
              className="h-10 text-sidebar-foreground/60 hover:text-destructive"
            >
              <LogOut className="h-[18px] w-[18px]" />
              {!collapsed && <span>Déconnexion</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
