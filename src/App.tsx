import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

// Pages
import { SplashScreen } from "@/pages/SplashScreen";
import { LoginPage } from "@/pages/LoginPage";
import { Dashboard } from "@/pages/Dashboard";
import { BillingPage } from "@/pages/BillingPage";
import { RecentBillsPage } from "@/pages/RecentBillsPage";
import { StaffManagementPage } from "@/pages/StaffManagementPage";
import NotFound from "@/pages/NotFound";

// Layout
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

// Protected route wrapper for role-based access
const RoleGuard: React.FC<{ 
  children: React.ReactNode;
  allowedRoles: ('owner' | 'staff')[];
}> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes with layout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Staff only routes */}
        <Route
          path="/billing"
          element={
            <RoleGuard allowedRoles={['staff']}>
              <BillingPage />
            </RoleGuard>
          }
        />
        <Route
          path="/bills"
          element={
            <RoleGuard allowedRoles={['staff']}>
              <RecentBillsPage />
            </RoleGuard>
          }
        />
        
        {/* Owner only routes */}
        <Route
          path="/bills-history"
          element={
            <RoleGuard allowedRoles={['owner']}>
              <RecentBillsPage isOwnerView />
            </RoleGuard>
          }
        />
        <Route
          path="/staff"
          element={
            <RoleGuard allowedRoles={['owner']}>
              <StaffManagementPage />
            </RoleGuard>
          }
        />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
