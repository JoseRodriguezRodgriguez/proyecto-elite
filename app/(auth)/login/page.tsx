"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EliteLogo from "/public/EliteLogo.svg";
import { GENERIC_LOGIN_ERROR } from "@/lib/auth/constants";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await signIn("credentials", {
        user: usuario,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(GENERIC_LOGIN_ERROR);
      } else {
        router.push("/");
      }
    } catch {
      setError(GENERIC_LOGIN_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA]">
      <div className="absolute w-80 h-80 bg-[#4e497a] rounded-full blur-3xl top-10 left-10 opacity-40"></div>
      <div className="absolute w-64 h-64 bg-[#262451] rounded-full blur-3xl bottom-10 right-32 opacity-30"></div>
      <div className="absolute w-72 h-72 bg-[#646cff] rounded-full blur-3xl bottom-0 left-20 opacity-40"></div>

      <div className="flex items-center justify-center min-h-screen">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded shadow-md w-full max-w-sm"
        >
          <div className="flex justify-center mb-4">
            <Image
              src={EliteLogo}
              alt="Elite Logo"
              width={80}
              height={80}
              style={{ color: "#262451" }}
            />
          </div>
          <h2 className="text-center text-xl font-bold mb-2">¡Bienvenido!</h2>
          <p className="text-center text-gray-600 mb-6">
            introduzca su usuario y contraseña para acceder
          </p>

          {error && <p className="text-red-500 text-center mb-2">{error}</p>}
          <div className="mb-4">
            <Input
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full"
              autoComplete="username"
              disabled={submitting}
            />
          </div>
          <div className="mb-6">
            <Input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-[#262451] text-white hover:bg-[#3b3970]"
          >
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
}
