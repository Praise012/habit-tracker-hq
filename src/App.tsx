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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <img src={heroImg} alt="SpendWise" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-2xl font-bold">S</span>
          </div>
          <div className="animate-pulse text-foreground font-display text-xl font-bold">SpendWise</div>
        </div>
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
