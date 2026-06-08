import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Initialise API base URL (picks up VITE_API_BASE_URL when deployed)
import "@/lib/api";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Pricing from "@/pages/pricing";
import Plans from "@/pages/plans";
import Checkout from "@/pages/checkout";
import Dashboard from "@/pages/dashboard";
import HowToConnect from "@/pages/how-to-connect";
import ServerStatus from "@/pages/server-status";
import FAQs from "@/pages/faqs";
import Contact from "@/pages/contact";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import CheckExpiry from "@/pages/check-expiry";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import Notifications from "@/pages/notifications";
import OrderStatus from "@/pages/order-status";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoute() {
  const { user, isAdminUser, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdminUser)) {
      navigate("/login");
    }
  }, [loading, user, isAdminUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdminUser) return null;

  return <Admin />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/plans" component={Plans} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/account" component={Account} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/how-to-connect" component={HowToConnect} />
      <Route path="/server-status" component={ServerStatus} />
      <Route path="/faqs" component={FAQs} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/check-expiry" component={CheckExpiry} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/order-status" component={OrderStatus} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
