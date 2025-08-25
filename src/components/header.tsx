"use client";

import { Button } from "@/components/ui/button";
import { Code2, User, Power, Info, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import InfoDialog from "./info-dialog";

const Header = () => {
  const [isActivated, setIsActivated] = useState(false);
  const [anonHash, setAnonHash] = useState<string | undefined>(undefined);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const router = useRouter();

  /* 📲 Handle PWA Install */
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  /* 🔐 Check Activation Status */
  useEffect(() => {
    const checkActivation = () => {
      const activated = Cookies.get("is_activated") === "true";
      const hash = Cookies.get("anon_hash");
      setIsActivated(activated);
      setAnonHash(hash);
    };
    checkActivation();
    const interval = setInterval(checkActivation, 500);
    return () => clearInterval(interval);
  }, []);

  /* 👨‍💻 Hidden Admin Shortcut */
  useEffect(() => {
    if (logoClickCount === 3) {
      router.push("/admin/login");
      setLogoClickCount(0);
    }
    const timer = setTimeout(() => {
      if (logoClickCount > 0) setLogoClickCount(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, [logoClickCount, router]);

  const handleLogoClick = () => setLogoClickCount((prev) => prev + 1);

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/95 border-b border-border shadow-[0_0_12px_rgba(0,255,255,0.3)] backdrop-blur-md scanlines">
        <div className="container max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          {/* 🚀 Logo + Title */}
          <div className="flex items-center gap-3">
            <div
              onClick={handleLogoClick}
              className="cursor-pointer text-accent hover:drop-shadow-[0_0_6px_#00ffe0]"
              title="ConfessCode"
            >
              <Code2 className="h-8 w-8 animate-pulse" />
            </div>
            <Link
              href="/"
              className="text-2xl font-code font-bold glitch"
              data-text="<ConfessCode/>"
            >
              &lt;ConfessCode/&gt;
            </Link>
          </div>

          {/* 🔐 Right Section */}
          <div className="flex items-center gap-2">
            {isActivated && anonHash && (
              <div className="hidden md:flex items-center gap-2 font-mono text-xs px-2 py-1 rounded-md border border-accent text-accent shadow-[0_0_6px_#39ff14]">
                <User className="h-4 w-4" />
                <span>usr::{anonHash.substring(0, 6)}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              {/* ℹ️ Info */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsInfoOpen(true)}
                aria-label="Information"
                className="btn-hacker"
              >
                <Info className="h-5 w-5" />
              </Button>

              {/* 📲 Install App */}
              {installPrompt && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleInstallClick}
                  aria-label="Install App"
                  title="Install ConfessCode"
                  className="btn-hacker"
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}

              {/* 🔑 Activate */}
              {!isActivated && (
                <Button asChild className="btn-hacker hidden md:inline-flex">
                  <Link href="/activate">
                    <Power className="mr-2 h-4 w-4" /> activate
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 💻 Typing Effect Subline */}
        <div className="container max-w-2xl mx-auto px-4 pb-2">
          <p className="text-sm font-mono text-muted-foreground cursor-blink">
            _system awaiting your confession...
          </p>
        </div>
      </header>

      {/* ℹ️ Info Modal */}
      <InfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
    </>
  );
};

export default Header;
