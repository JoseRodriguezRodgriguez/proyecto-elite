"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GENERIC_ACTIVATION_ERROR,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth/constants";
import { validatePasswordConfirmation } from "@/lib/auth/password-validation";

function ActivateAccountForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(GENERIC_ACTIVATION_ERROR);
      return;
    }

    const validation = validatePasswordConfirmation(password, confirmPassword);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error || GENERIC_ACTIVATION_ERROR);
        return;
      }

      setSuccess(data.message || "Account activated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not activate the account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA]">
      <div className="absolute w-80 h-80 bg-[#4e497a] rounded-full blur-3xl top-10 left-10 opacity-40" />
      <div className="absolute w-64 h-64 bg-[#262451] rounded-full blur-3xl bottom-10 right-32 opacity-30" />

      <div className="flex items-center justify-center min-h-screen p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
        >
          <h1 className="text-xl font-bold text-center text-[#262451]">
            Activar cuenta
          </h1>
          <p className="text-sm text-center text-gray-600">
            Establezca una contraseña de al menos {MIN_PASSWORD_LENGTH} caracteres.
            No use espacios al inicio ni al final.
          </p>

          {!token && (
            <p className="text-red-500 text-sm text-center">
              {GENERIC_ACTIVATION_ERROR}
            </p>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && (
            <div className="space-y-3 text-center">
              <p className="text-green-700 text-sm">{success}</p>
              <Button asChild className="bg-[#262451] hover:bg-[#3b3970]">
                <Link href="/login">Ir a iniciar sesión</Link>
              </Button>
            </div>
          )}

          {!success && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting || !token}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting || !token}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !token}
                className="w-full bg-[#262451] hover:bg-[#3b3970]"
              >
                {submitting ? "Activando..." : "Activar cuenta"}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Cargando...
        </div>
      }
    >
      <ActivateAccountForm />
    </Suspense>
  );
}
