import { Link, useNavigate } from "@tanstack/react-router";
import { Bus, Languages, LogOut, Menu, Moon, ShieldCheck, Sun, Ticket, WalletMinimal } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/hooks/use-session";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { user } = useSession();
  const { isStaff } = useRoles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = (
    <>
      <Link to="/" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setOpen(false)}>
        {t("nav_home")}
      </Link>
      <Link
        to="/search"
        search={{ from: "Chennai", to: "Coimbatore", date: new Date().toISOString().slice(0, 10) }}
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        {t("nav_search")}
      </Link>
      <Link
        to="/bookings"
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => setOpen(false)}
      >
        {t("nav_bookings")}
      </Link>
      {user && (
        <Link
          to="/wallet"
          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => setOpen(false)}
        >
          {t("nav_wallet")}
        </Link>
      )}
      {isStaff && (
        <Link
          to="/admin"
          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => setOpen(false)}
        >
          {t("nav_admin")}
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="brand-gradient flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Bus className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            NXTIXA <span className="brand-text">Go</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">{links}</nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            aria-label="Switch language"
            className="gap-1.5"
          >
            <Languages className="size-4" aria-hidden />
            <span className="text-xs font-semibold uppercase">{lang === "en" ? "EN" : "தமிழ்"}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  {user.email?.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate({ to: "/bookings" })}>
                  <Ticket className="mr-2 size-4" /> {t("my_tickets")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/wallet" })}>
                  <WalletMinimal className="mr-2 size-4" /> {t("nav_wallet")}
                </DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <ShieldCheck className="mr-2 size-4" /> {t("nav_admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 size-4" /> {t("sign_out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">{t("sign_in")}</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-border bg-background px-4 py-2 md:hidden", open ? "block" : "hidden")}>
        <nav className="flex flex-col">
          {links}
          {!user && (
            <Link to="/auth" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setOpen(false)}>
              {t("sign_in")}
            </Link>
          )}
          {user && (
            <button className="rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted" onClick={signOut}>
              {t("sign_out")}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
