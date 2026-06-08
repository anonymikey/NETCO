import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Navbar } from "./Navbar";
import { AdminLayout } from "./AdminLayout";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");

  if (isAdminPage) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <Navbar />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
