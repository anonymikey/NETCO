import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  console.log("[v0] Layout RENDER - location:", location);

  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow flex flex-col">{children}</main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
