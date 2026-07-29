"use client";

import { Role } from "@prisma/client";
import { Navbar } from "./Navbar";

interface HeaderProps {
  isLoggedIn?: boolean;
  role?: Role;
}

export function Header({ isLoggedIn, role }: HeaderProps) {
  return <Navbar isLoggedIn={isLoggedIn} role={role} />;
}
