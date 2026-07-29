"use client";

import { Navbar } from "./Navbar";

interface LandingHeaderProps {
  showAuthLinks?: boolean;
}

export function LandingHeader({ showAuthLinks = true }: LandingHeaderProps) {
  return <Navbar compactAuth={!showAuthLinks} priority />;
}
