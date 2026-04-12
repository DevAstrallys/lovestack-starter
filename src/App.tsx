import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleViewProvider } from "@/contexts/RoleViewContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { WhiteLabelProvider } from "@/contexts/WhiteLabelContext";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

// Static imports — critical for first render / public pages
import Index from "./pages/Index";
import { TicketLanding } from "./pages/TicketLanding";
import { TicketForm } from "./pages/TicketForm";
import Health from "./pages/Health";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Lazy-loaded pages
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Locations = lazy(() => import('./pages/Locations').then(m => ({ default: m.Locations })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const Tickets = lazy(() => import('./pages/Tickets').then(m => ({ default: m.Tickets })));
const TicketDetail = lazy(() => import('./pages/TicketDetail').then(m => ({ default: m.TicketDetail })));
const TicketTracking = lazy(() => import('./pages/TicketTracking').then(m => ({ default: m.TicketTracking })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <WhiteLabelProvider>
        <RoleViewProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-muted-foreground">Chargement...</div></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/users" element={<ProtectedAdminRoute><Users /></ProtectedAdminRoute>} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/ticket-form/:slug" element={<TicketLanding />} />
                  <Route path="/ticket-form/:slug/form" element={<TicketForm />} />
                  <Route path="/report/:slug" element={<TicketForm />} />
                  <Route path="/suivi/:slug" element={<TicketTracking />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </RoleViewProvider>
        </WhiteLabelProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
