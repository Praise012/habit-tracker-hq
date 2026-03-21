import { useState } from "react";
import { LogOut, Lock, User, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { PinSetup } from "@/components/PinLock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

export default function Settings() {
  const { user, signOut } = useAuth();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showRemovePin, setShowRemovePin] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleRemovePin = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("app_settings")
      .update({ pin_hash: null, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to remove PIN");
    } else {
      toast.success("PIN removed");
      setShowRemovePin(false);
    }
  };

  return (
    <div className="pb-28 space-y-6">
      <h1 className="text-2xl font-bold font-display">Settings</h1>

      {/* Account Section */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account</h2>
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h2>
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Security</h2>
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
          <button
            onClick={() => { setShowPinSetup(true); setShowRemovePin(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium">Change PIN</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => { setShowRemovePin(true); setShowPinSetup(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium">Remove PIN</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* PIN Setup Inline */}
      {showPinSetup && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <PinSetup onComplete={() => setShowPinSetup(false)} />
        </div>
      )}

      {/* Remove PIN Confirmation */}
      {showRemovePin && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3 text-center">
          <p className="text-sm text-muted-foreground">Are you sure you want to remove your PIN lock?</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => setShowRemovePin(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleRemovePin}>Remove PIN</Button>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}
