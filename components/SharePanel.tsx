"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Ticket, Copy, Check, Share2, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSurveyShareUrl, INK, OCHRE, SLATE } from "@/lib/constants";

interface SharePanelProps {
  code: string;
}

export function SharePanel({ code }: SharePanelProps) {
  const t = useTranslations("created");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareUrl = getSurveyShareUrl(code, locale);

  const copy = async (text: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
      }
    } catch {
      /* ignore */
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t("title"), text: code, url: shareUrl });
      } catch {
        copy(shareUrl, "link");
      }
    } else {
      copy(shareUrl, "link");
    }
  };

  return (
    <div className="pt-10 flex flex-col items-center text-center">
      <Ticket size={28} style={{ color: OCHRE }} />
      <h2 className="text-2xl font-bold mt-4">{t("title")}</h2>
      <p className="sondage-sans text-sm mt-2 max-w-md" style={{ color: `${INK}99` }}>
        {t("subtitle")}
      </p>

      <div className="mt-6 px-8 py-5 w-full max-w-sm" style={{ border: `2px dashed ${INK}` }}>
        <div className="sondage-mono text-4xl tracking-[0.3em] font-bold">{code}</div>
      </div>

      <button onClick={() => copy(code, "code")} className="sondage-btn sondage-sans flex items-center gap-2 mt-4 text-sm" style={{ color: OCHRE }}>
        {copiedCode ? <Check size={15} /> : <Copy size={15} />}
        {copiedCode ? tc("copied") : tc("copy")}
      </button>

      <div className="mt-8 w-full max-w-sm text-left">
        <div className="sondage-mono text-xs tracking-widest uppercase mb-2" style={{ color: SLATE }}>
          {t("shareLink")}
        </div>
        <div className="sondage-sans text-sm break-all py-2 px-3 mb-3" style={{ border: `1px solid ${SLATE}55` }}>
          {shareUrl}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => copy(shareUrl, "link")}
            className="sondage-btn sondage-sans flex-1 py-2 text-sm flex items-center justify-center gap-2"
            style={{ border: `1px solid ${INK}` }}
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            {copiedLink ? tc("copied") : tc("copy")}
          </button>
          <button
            onClick={shareNative}
            className="sondage-btn sondage-sans flex-1 py-2 text-sm flex items-center justify-center gap-2 text-white"
            style={{ background: INK }}
          >
            <Share2 size={14} /> {tc("share")}
          </button>
        </div>
      </div>

      <div className="mt-8 w-full max-w-sm">
        <div className="sondage-mono text-xs tracking-widest uppercase mb-3" style={{ color: SLATE }}>
          {t("qrCode")}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${code}?locale=${locale}`}
          alt={`QR ${code}`}
          className="mx-auto w-48 h-48"
          width={192}
          height={192}
        />
        <a
          href={`/api/qr/${code}?locale=${locale}`}
          download={`sondage-${code}-qr.png`}
          className="sondage-btn sondage-sans inline-flex items-center gap-2 mt-3 text-sm"
          style={{ color: OCHRE }}
        >
          <Download size={14} /> {t("downloadQr")}
        </a>
      </div>

      <div className="flex gap-3 mt-8 w-full max-w-sm">
        <Link
          href={`/repondre/${code}`}
          className="sondage-btn sondage-sans flex-1 py-2.5 text-sm text-center"
          style={{ border: `1px solid ${INK}` }}
        >
          {t("testAnswer")}
        </Link>
        <Link
          href={`/resultats/${code}`}
          className="sondage-btn sondage-sans flex-1 py-2.5 text-sm text-white text-center"
          style={{ background: INK }}
        >
          {t("viewResults")}
        </Link>
      </div>
    </div>
  );
}
