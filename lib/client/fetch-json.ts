import { signOut } from "next-auth/react";

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  if (response.status === 401) {
    await signOut({
      callbackUrl: "/login",
    });

    throw new Error("La sesión ya no es válida.");
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "No se pudo completar la solicitud.";

    throw new Error(message);
  }

  return data as T;
}