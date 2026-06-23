"use client";

import { motion } from "framer-motion";
import BrandLogo from "@/components/ui/BrandLogo";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }} className="sticky top-0 z-40 border-b border-sand bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[82px] max-w-[1380px] items-center px-5 lg:px-8">
          <BrandLogo />
        </div>
      </motion.header>
      {children}
    </div>
  );
}
