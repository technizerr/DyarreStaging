import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MortgageCalculator from "./pages/MortgageCalculator";
import Documentation from "./pages/Documentation";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import PropertyManagement from "./pages/admin/PropertyManagement";
import UserManagement from "./pages/admin/UserManagement";
import MigrationPanel from "./pages/admin/MigrationPanel";
import AdminSettings from "./pages/admin/AdminSettings";
import VisitorStats from "./pages/admin/VisitorStats";
import Leads from "./pages/admin/Leads";
import NotFound from "./pages/NotFound";
import { usePageTracking } from "@/hooks/usePageTracking";
import { TrackingScripts } from "@/components/TrackingScripts";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

function PageTracker() {
  usePageTracking();
  return null;
}


const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <PageTracker />
              <TrackingScripts />
              <Routes>

                <Route path="/" element={<Index />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
                <Route path="/docs" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/properties" element={<ProtectedRoute><PropertyManagement /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/migrations" element={<ProtectedRoute><MigrationPanel /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                <Route path="/admin/visitors" element={<ProtectedRoute><VisitorStats /></ProtectedRoute>} />
                <Route path="/admin/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
