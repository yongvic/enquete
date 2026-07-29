"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { registerAdmin } from "@/lib/actions/survey";
import { OCHRE, RUST, SLATE } from "@/lib/constants";
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
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="sondage-sans text-sm font-medium auth-label">
          {t("email")}
          <input name="email" type="email" required autoComplete="email" className="auth-input mt-2" placeholder="vous@exemple.com" />
        </label>
        <label className="sondage-sans text-sm font-medium auth-label">
          {t("password")}
          <input name="password" type="password" required minLength={8} autoComplete="current-password" className="auth-input mt-2" />
        </label>
        {error && (
          <p className="sondage-sans text-sm auth-error px-3 py-2 rounded-sm" style={{ color: RUST }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="sondage-btn sondage-sans py-3.5 text-sm text-white flex items-center justify-center gap-2 font-semibold mt-1"
          style={{ background: OCHRE, opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {t("loginButton")}
        </button>
      </form>
      <p className="sondage-sans text-sm mt-6 text-center auth-footer-link">
        {t("noAccount")}{" "}
        <Link href="/inscription" className="font-semibold" style={{ color: OCHRE }}>
          {t("registerButton")}
        </Link>
      </p>
    </>
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
      setError(result.error === "exists" ? t("emailExists") : t("invalidForm"));
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
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="sondage-sans text-sm font-medium auth-label">
          {t("name")}
          <input name="name" type="text" autoComplete="name" className="auth-input mt-2" />
        </label>
        <label className="sondage-sans text-sm font-medium auth-label">
          {t("email")}
          <input name="email" type="email" required autoComplete="email" className="auth-input mt-2" placeholder="vous@exemple.com" />
        </label>
        <label className="sondage-sans text-sm font-medium auth-label">
          {t("password")}
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="auth-input mt-2" />
        </label>
        {error && (
          <p className="sondage-sans text-sm auth-error px-3 py-2 rounded-sm" style={{ color: RUST }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="sondage-btn sondage-sans py-3.5 text-sm text-white flex items-center justify-center gap-2 font-semibold mt-1"
          style={{ background: OCHRE, opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {t("registerButton")}
        </button>
      </form>
      <p className="sondage-sans text-sm mt-6 text-center auth-footer-link">
        {t("hasAccount")}{" "}
        <Link href="/connexion" className="font-semibold" style={{ color: OCHRE }}>
          {t("loginButton")}
        </Link>
      </p>
    </>
  );
}
