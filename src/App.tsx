import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PinLock from "@/components/PinLock";
import { useState } from "react";
import heroImg from "@/assets/hero-2.jpg";

const queryClient = new QueryClient();

function AppContent() {
  const { session, loading } = useAuth();
  const [pinUnlocked, setPinUnlocked] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-display">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!pinUnlocked) {
    return <PinLock onUnlock={() => setPinUnlocked(true)} />;
  }

  return (
    <Routes>
      <Route path="/*" element={<Index />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
