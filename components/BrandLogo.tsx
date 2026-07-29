import Image from "next/image";
import { Link } from "@/i18n/navigation";

interface BrandLogoProps {
  variant?: "full" | "dark" | "icon";
  href?: string;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ variant = "full", href = "/", className = "", priority = false }: BrandLogoProps) {
  const src =
    variant === "icon" ? "/icon.png" : variant === "dark" ? "/logo.png" : "/logo-header.png";
  const width = variant === "icon" ? 40 : 220;
  const height = variant === "icon" ? 40 : 56;

  const img = (
    <Image
      src={src}
      alt="Sondage"
      width={width}
      height={height}
      priority={priority}
      className={`brand-logo brand-logo--${variant}${className ? ` ${className}` : ""}`}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="sondage-btn inline-flex items-center min-h-0 py-0">
      {img}
    </Link>
  );
}
