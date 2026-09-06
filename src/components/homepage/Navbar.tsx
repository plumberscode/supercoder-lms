"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, MessageCircle } from "lucide-react";

const navLinks = [
  { label: "Program", href: "#program" },
  { label: "Manfaat", href: "#manfaat" },
  { label: "Tech Stack", href: "#bahasa" },
  { label: "Journey", href: "#journey" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "Galeri", href: "#galeri" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }
    },
    { scope: headerRef },
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      style={{ top: "var(--promo-bar-height, 0px)" }}
      className={`fixed inset-x-0 z-50 transition-[top,background-color,box-shadow,padding] duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3 sm:py-3.5"
          : "bg-white/85 backdrop-blur-md border-b border-slate-200/60 py-4 sm:py-5"
      }`}
    >
      <nav className="max-w-6xl mx-auto pl-5 sm:pl-6 min-[1174px]:pl-0 pr-4 sm:pr-6 min-[1174px]:pr-0 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/images/Logo transparent orange.webp"
            alt="Supercoder Logo"
            width={140}
            height={40}
            className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex items-center gap-1.5 font-poppins text-[13.5px] font-semibold text-slate-600 bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="px-3.5 py-1.5 rounded-full hover:text-red-600 hover:bg-red-50/70 transition-all duration-200 block"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            className="hidden sm:inline-flex rounded-full px-3.5 py-2 h-9 sm:h-10 text-slate-700 hover:text-orange-600 font-poppins font-semibold text-xs sm:text-sm"
          >
            <Link href="/login">
              <span>Login LMS</span>
            </Link>
          </Button>

          <Button
            asChild
            className="hidden sm:inline-flex rounded-full px-4 sm:px-5 py-2 h-9 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-xs sm:text-sm shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Link href="/daftar" className="inline-flex items-center">
              <span>Daftar Sekarang</span>
            </Link>
          </Button>

          {/* Mobile Sheet Menu */}
          <div className="lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-10 h-10 border-slate-200 bg-white/80 backdrop-blur-sm text-slate-800 hover:bg-slate-100 shadow-sm"
                  aria-label="Buka Menu Navigasi"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[360px] p-6 bg-white flex flex-col justify-between"
              >
                <div>
                  <SheetHeader className="text-left pb-5 border-b border-slate-100 mb-6">
                    <SheetTitle className="flex items-center">
                      <Image
                        src="/images/Logo transparent orange.webp"
                        alt="Supercoder Logo"
                        width={130}
                        height={38}
                        className="h-8 w-auto object-contain"
                      />
                    </SheetTitle>
                  </SheetHeader>

                  <ul className="flex flex-col gap-1.5 font-poppins font-semibold text-slate-700 text-[15px]">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          onClick={() => setSheetOpen(false)}
                          className="block px-4 py-3 rounded-xl hover:bg-orange-50/80 hover:text-orange-600 active:bg-orange-100 transition-all duration-150"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <Button
                    asChild
                    className="w-full rounded-2xl h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm shadow-md"
                  >
                    <Link
                      href="/daftar"
                      onClick={() => setSheetOpen(false)}
                      className="inline-flex items-center justify-center"
                    >
                      Daftar Kelas Sekarang
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-2xl h-11 border-slate-200 text-slate-700 font-poppins font-semibold text-sm"
                  >
                    <Link
                      href="/login"
                      onClick={() => setSheetOpen(false)}
                      className="inline-flex items-center justify-center"
                    >
                      Login ke LMS
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-2xl h-11 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-poppins font-semibold text-sm"
                  >
                    <a
                      href="https://wa.me/6287788931919"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Chat WhatsApp
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
