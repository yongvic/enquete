"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { MessageSquare, X, Loader2, Check } from "lucide-react";
import { submitFeedback } from "@/lib/actions/feedback";
import { INK, OCHRE, RUST, SLATE } from "@/lib/constants";

export function FeedbackWidget() {
  const t = useTranslations("feedback");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const close = () => {
    setOpen(false);
    setError("");
    if (done) {
      setMessage("");
      setEmail("");
      setRating(undefined);
      setDone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError(t("errors.tooShort"));
      return;
    }
    setLoading(true);
    setError("");
    const result = await submitFeedback({
      message,
      email: email.trim() || undefined,
      rating,
      page: pathname,
    });
    setLoading(false);
    if (result.error) {
      setError(t("errors.failed"));
      return;
    }
    setDone(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="feedback-fab sondage-btn fixed z-40 flex items-center gap-2 shadow-lg"
        aria-label={t("open")}
      >
        <MessageSquare size={18} />
        <span className="sondage-sans text-xs font-semibold hidden sm:inline">{t("open")}</span>
      </button>

      {open && (
        <div className="feedback-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("close")} onClick={close} />
          <div className="feedback-panel relative w-full sm:max-w-md max-h-[90dvh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-lg">{t("title")}</h2>
                <p className="sondage-sans text-sm mt-1" style={{ color: `${INK}88` }}>
                  {t("subtitle")}
                </p>
              </div>
              <button type="button" onClick={close} className="sondage-btn p-2 shrink-0" aria-label={t("close")}>
                <X size={18} style={{ color: SLATE }} />
              </button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <Check size={32} className="mx-auto" style={{ color: OCHRE }} />
                <p className="sondage-sans text-sm mt-4 font-medium">{t("thanks")}</p>
                <button
                  type="button"
                  onClick={close}
                  className="sondage-btn sondage-sans text-sm mt-6 px-5 py-2.5 text-white"
                  style={{ background: INK }}
                >
                  {t("close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <span className="sondage-sans text-sm font-medium">{t("rating")}</span>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n === rating ? undefined : n)}
                        className="sondage-btn sondage-sans text-sm w-10 h-10"
                        style={{
                          border: `1px solid ${rating === n ? OCHRE : SLATE + "66"}`,
                          background: rating === n ? `${OCHRE}18` : "transparent",
                          color: rating === n ? OCHRE : INK,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="sondage-sans text-sm font-medium">
                  {t("message")}
                  <textarea
                    className="auth-input mt-2 min-h-[120px] resize-y"
                    rows={4}
                    required
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                  />
                </label>

                <label className="sondage-sans text-sm font-medium">
                  {t("email")}
                  <input
                    type="email"
                    className="auth-input mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                  />
                </label>

                {error && (
                  <p className="sondage-sans text-sm" style={{ color: RUST }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="sondage-btn sondage-sans py-3 text-sm text-white font-semibold flex items-center justify-center gap-2"
                  style={{ background: OCHRE, opacity: loading ? 0.7 : 1 }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {t("submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
