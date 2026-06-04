"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirectToGoogleLogin } from "@/services/authService";

export function GoogleLoginButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={redirectToGoogleLogin}
    >
      <Globe className="h-4 w-4" />
      Continue with Google
    </Button>
  );
}
