"use client";

import { INK, OCHRE } from "@/lib/constants";
import { ReactNode } from "react";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
  href?: string;
  full?: boolean;
}

export function ActionCard({ icon, title, desc, onClick, full }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`sondage-btn text-left p-5 w-full ${full ? "sm:col-span-2" : ""}`}
      style={{ border: `1px solid ${INK}`, background: "transparent" }}
    >
      <div style={{ color: OCHRE }}>{icon}</div>
      <div className="mt-3 font-bold text-[17px]">{title}</div>
      <div className="sondage-sans text-[13px] mt-1" style={{ color: `${INK}99` }}>
        {desc}
      </div>
    </button>
  );
}
