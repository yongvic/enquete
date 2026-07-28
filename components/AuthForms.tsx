"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { registerAdmin } from "@/lib/actions/survey";
import { INK, RUST, SLATE } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(t("invalidCredentials"));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="pt-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="sondage-sans text-sm">
          {t("email")}
          <input name="email" type="email" required className="sondage-input mt-1" />
        </label>
        <label className="sondage-sans text-sm">
          {t("password")}
          <input name="password" type="password" required minLength={8} className="sondage-input mt-1" />
        </label>
        {error && (
          <p className="sondage-sans text-sm" style={{ color: RUST }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="sondage-btn sondage-sans py-3 text-sm text-white flex items-center justify-center gap-2"
          style={{ background: INK, opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {t("loginButton")}
        </button>
      </form>
      <p className="sondage-sans text-sm mt-6" style={{ color: `${INK}99` }}>
        {t("noAccount")}{" "}
        <Link href="/inscription" style={{ color: SLATE }}>
          {t("registerButton")}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await registerAdmin(form);
    setLoading(false);
    if (result.error) {
      setError(result.error === "exists" ? "Email déjà utilisé" : "Formulaire invalide");
      return;
    }
    await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="pt-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">{t("registerTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="sondage-sans text-sm">
          {t("name")}
          <input name="name" type="text" className="sondage-input mt-1" />
        </label>
        <label className="sondage-sans text-sm">
          {t("email")}
          <input name="email" type="email" required className="sondage-input mt-1" />
        </label>
        <label className="sondage-sans text-sm">
          {t("password")}
          <input name="password" type="password" required minLength={8} className="sondage-input mt-1" />
        </label>
        {error && (
          <p className="sondage-sans text-sm" style={{ color: RUST }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="sondage-btn sondage-sans py-3 text-sm text-white flex items-center justify-center gap-2"
          style={{ background: INK, opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {t("registerButton")}
        </button>
      </form>
      <p className="sondage-sans text-sm mt-6" style={{ color: `${INK}99` }}>
        {t("hasAccount")}{" "}
        <Link href="/connexion" style={{ color: SLATE }}>
          {t("loginButton")}
        </Link>
      </p>
    </div>
  );
}
