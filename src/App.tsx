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
import Index from "./pages/Index";
import { Admin } from "./pages/Admin";
import { Locations } from "./pages/Locations";
import { Users } from "./pages/Users";
import { Tickets } from "./pages/Tickets";
import { TicketDetail } from "./pages/TicketDetail";
import { TicketForm } from "./pages/TicketForm";
import { TicketLanding } from "./pages/TicketLanding";
import { TicketTracking } from "./pages/TicketTracking";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Health from "./pages/Health";
import { Profile } from "./pages/Profile";

const queryClient = new QueryClient();

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/users" element={<ProtectedAdminRoute><Users /></ProtectedAdminRoute>} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
                <Route path="/ticket-form/:slug" element={<TicketForm />} />
                <Route path="/report/:slug" element={<TicketForm />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/health" element={<Health />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RoleViewProvider>
        </WhiteLabelProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;