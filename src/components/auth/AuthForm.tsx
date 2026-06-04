"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { setToken } from "@/services/api";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthStore();
  const [loading, setLoading] = useState<"login" | "register" | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    college: "",
    branch: "",
    year: "",
    skills: "",
  });

  useEffect(() => {
    const token =
      searchParams.get("access_token") ?? searchParams.get("token") ?? null;
    if (!token) return;
    setToken(token);
    void auth.getCurrentUser().then(() => router.replace("/dashboard"));
  }, [auth, router, searchParams]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("login");
    try {
      await auth.login(loginData);
      toast.success("Welcome back to VibeTribe");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = registerData.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      toast.error("Username must be 3-30 lowercase letters, numbers, or underscores.");
      return;
    }
    setLoading("register");
    try {
      await auth.register({
        name: registerData.name,
        username,
        email: registerData.email,
        password: registerData.password,
        college: registerData.college || null,
        branch: registerData.branch || null,
        year: registerData.year ? Number(registerData.year) : null,
        skills: registerData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });
      toast.success("Account created");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Join VibeTribe</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-6 space-y-5">
            <GoogleLoginButton />
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(event) =>
                    setLoginData({ ...loginData, email: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(event) =>
                    setLoginData({ ...loginData, password: event.target.value })
                  }
                />
              </div>
              <Button
                className="auth-primary-cta w-full"
                disabled={loading === "login"}
                variant="default"
              >
                {loading === "login" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Login
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register" className="mt-6">
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={registerData.name}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9_]{3,30}"
                    placeholder="sneha_21"
                    value={registerData.username}
                    onChange={(event) =>
                      setRegisterData({
                        ...registerData,
                        username: event.target.value.toLowerCase(),
                      })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Lowercase letters, numbers, and underscores only.
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, email: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, password: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College</Label>
                  <Input
                    id="college"
                    value={registerData.college}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, college: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={registerData.branch}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, branch: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1"
                    max="6"
                    value={registerData.year}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, year: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    placeholder="React, Python, UI"
                    value={registerData.skills}
                    onChange={(event) =>
                      setRegisterData({ ...registerData, skills: event.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                className="auth-primary-cta w-full"
                disabled={loading === "register"}
                variant="default"
              >
                {loading === "register" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
