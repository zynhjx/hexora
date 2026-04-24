"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim() || email.split('@')[0] } },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Check your email to confirm.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Logged in successfully!");
        router.push("/home");
      }
    }

    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-theme-dark-blue px-0 py-0 font-sans sm:px-8 sm:py-10">
      <section className="relative w-full max-w-lg rounded-none border-0 bg-theme-dark-blue p-8 text-white shadow-none sm:rounded-3xl sm:border sm:border-white/20 sm:p-10 sm:shadow-[0_24px_60px_rgba(0,0,0,0.55)] min-h-screen sm:min-h-0 flex flex-col justify-center">
        <header className="mb-8 space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/60">Hexora Access</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-base text-white/70">
            {mode === "login"
              ? "Sign in to continue to your workspace."
              : "Register below to start using Hexora."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5">
            {mode === "register" && (
              <label htmlFor="username" className="space-y-2 text-sm text-white/85">
                <span className="font-medium">Username</span>
                <input
                  id="username"
                  type="text"
                  placeholder="your_handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-white/25 bg-theme-dark-blue px-4 text-base text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                />
              </label>
            )}

            <label htmlFor="email" className="space-y-2 text-sm text-white/85">
              <span className="font-medium">Email</span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-white/25 bg-theme-dark-blue px-4 text-base text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:ring-2 focus:ring-white/20"
              />
            </label>

            <label htmlFor="password" className="space-y-2 text-sm text-white/85">
              <span className="font-medium">Password</span>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-white/25 bg-theme-dark-blue px-4 pr-12 text-base text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/65 transition hover:bg-white/8 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {mode === "register" && (
              <label htmlFor="confirmPassword" className="space-y-2 text-sm text-white/85">
                <span className="font-medium">Confirm Password</span>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-white/25 bg-theme-dark-blue px-4 pr-12 text-base text-white outline-none transition placeholder:text-white/45 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/65 transition hover:bg-white/8 hover:text-white"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-white text-base font-semibold text-theme-dark-blue transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>

            <p className="text-center text-sm text-white/75">
              {mode === "login" ? "Don&apos;t have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="font-semibold text-white underline decoration-white/60 underline-offset-4 transition hover:text-white/80"
              >
                {mode === "login" ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
