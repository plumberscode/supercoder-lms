"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

type CredentialResponse = { credential: string };

type GoogleAccountsId = {
  initialize: (config: Record<string, unknown>) => void;
  prompt: () => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("GSI gagal dimuat")));
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

// Supabase memverifikasi nonce mentah terhadap hash SHA-256 yang ada di ID token.
async function generateNonce(): Promise<[string, string]> {
  const nonce = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
  );
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce),
  );
  const hashedNonce = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [nonce, hashedNonce];
}

/**
 * Google One Tap: memakai akun Google yang sedang login di Chrome.
 * Pengguna yang pernah memberi izin akan otomatis masuk (auto_select);
 * pengguna baru cukup sekali klik di prompt One Tap.
 */
export default function GoogleOneTap({
  redirectTo = "/dashboard",
}: {
  redirectTo?: string;
}) {
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = redirectTo;
        return;
      }

      const [nonce, hashedNonce] = await generateNonce();
      await loadGsiScript();
      if (cancelled || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        auto_select: true,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
        itp_support: true,
        callback: async ({ credential }: CredentialResponse) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: credential,
            nonce,
          });
          if (error) {
            console.error("Google One Tap gagal:", error.message);
            return;
          }
          window.location.href = redirectTo;
        },
      });
      window.google.accounts.id.prompt();
    })().catch((err) => console.error(err));

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
    };
  }, [redirectTo]);

  return null;
}
