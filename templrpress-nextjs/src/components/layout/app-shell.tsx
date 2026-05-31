"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { eventBus, EVENTS } from "@/lib/event-bus";
import type { NavbarVisibilityEvent } from "@/lib/event-bus";

const NAVBAR_HIDDEN_ROUTES = ["/login", "/signup"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initialVisible = !NAVBAR_HIDDEN_ROUTES.includes(
    pathname.replace(/\/$/, "") || "/"
  );
  const [showNavbar, setShowNavbar] = useState(initialVisible);

  useEffect(() => {
    const off = eventBus.on<NavbarVisibilityEvent>(
      EVENTS.NAVBAR_VISIBILITY,
      ({ visible }) => setShowNavbar(visible)
    );
    return off;
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {showNavbar && <Navbar />}
      <main className={`flex-1 ${showNavbar ? "pt-14" : ""}`}>{children}</main>
      {showNavbar && pathname === "/" && <Footer />}
    </div>
  );
}
