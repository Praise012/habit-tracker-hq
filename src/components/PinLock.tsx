import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Fingerprint, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("app_settings")
      .select("pin_hash")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.pin_hash) {
          setHasPin(true);
        } else {
          setHasPin(false);
          onUnlock(); // No PIN set, skip lock
        }
      });
  }, [user, onUnlock]);

  const handleDigit = (digit: string) => {
    if (isSettingPin) {
      if (step === "enter") {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setStep("confirm");
          setPin("");
          setConfirmPin(next);
        }
      } else {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          if (next === confirmPin) {
            savePin(next);
          } else {
            toast.error("PINs don't match. Try again.");
            setPin("");
            setStep("enter");
            setConfirmPin("");
          }
        }
      }
    } else {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const savePin = async (pinValue: string) => {
    if (!user) return;
    const hashed = await hashPin(pinValue);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ user_id: user.id, pin_hash: hashed, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) {
      toast.error("Failed to save PIN");
      setPin("");
      return;
    }
    toast.success("PIN set successfully!");
    onUnlock();
  };

  const verifyPin = async (pinValue: string) => {
    if (!user) return;
    const hashed = await hashPin(pinValue);
    const { data } = await supabase
      .from("app_settings")
      .select("pin_hash")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.pin_hash === hashed) {
      onUnlock();
    } else {
      toast.error("Incorrect PIN");
      setPin("");
    }
  };

  if (hasPin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasPin && !isSettingPin) {
    return null; // Already unlocked via useEffect
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xs space-y-8 text-center"
      >
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display">
            {isSettingPin
              ? step === "enter"
                ? "Create PIN"
                : "Confirm PIN"
              : "Enter PIN"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSettingPin
              ? step === "enter"
                ? "Choose a 4-digit PIN"
                : "Enter the same PIN again"
              : "Enter your 4-digit PIN to continue"}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: pin.length > i ? 1.2 : 1 }}
              className={`w-4 h-4 rounded-full transition-colors ${
                pin.length > i ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="h-14 rounded-2xl bg-muted hover:bg-muted/80 text-xl font-display font-semibold transition-colors active:scale-95"
            >
              {num}
            </button>
          ))}
          <div /> {/* empty spacer */}
          <button
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-muted hover:bg-muted/80 text-xl font-display font-semibold transition-colors active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl hover:bg-muted text-sm text-muted-foreground transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Exported separately for use in settings
export function PinSetup({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");

  const handleDigit = (digit: string) => {
    if (step === "enter") {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        setStep("confirm");
        setPin("");
        setConfirmPin(next);
      }
    } else {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        if (next === confirmPin) {
          savePin(next);
        } else {
          toast.error("PINs don't match");
          setPin("");
          setStep("enter");
          setConfirmPin("");
        }
      }
    }
  };

  const savePin = async (pinValue: string) => {
    if (!user) return;
    const hashed = await hashPin(pinValue);
    await supabase
      .from("app_settings")
      .upsert({ user_id: user.id, pin_hash: hashed, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    toast.success("PIN updated!");
    onComplete();
  };

  return (
    <div className="space-y-6 text-center">
      <h2 className="font-display font-semibold">
        {step === "enter" ? "Enter New PIN" : "Confirm PIN"}
      </h2>
      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              pin.length > i ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num.toString())}
            className="h-12 rounded-2xl bg-muted hover:bg-muted/80 text-lg font-display font-semibold transition-colors"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          className="h-12 rounded-2xl bg-muted hover:bg-muted/80 text-lg font-display font-semibold transition-colors"
        >
          0
        </button>
        <button
          onClick={() => setPin((p) => p.slice(0, -1))}
          className="h-12 rounded-2xl hover:bg-muted text-xs text-muted-foreground transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
