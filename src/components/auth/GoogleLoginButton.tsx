"use client";

import { Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { redirectToGoogleLogin } from "@/services/authService";

export function GoogleLoginButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        if (!redirectToGoogleLogin()) {
          toast.error("Google sign-in is unavailable right now. Please try again later.");
        }
      }}
    >
      <Globe className="h-4 w-4" />
      Continue with Google
    </Button>
  );
}
