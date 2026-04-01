import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ToastProvider } from "./Toast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
