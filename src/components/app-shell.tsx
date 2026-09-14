import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, PanelsTopLeft, PenLine, Sparkles } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useDesk } from "@/lib/store";
import { useExchangeTicker } from "@/lib/use-exchange";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Desk", icon: LayoutGrid },
  { to: "/create", label: "Compose", icon: PenLine },
  { to: "/inventory", label: "Inventory", icon: PanelsTopLeft },
  { to: "/studio", label: "Studio", icon: Sparkles },
] as const;

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <rect x="3.5" y="13.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <rect x="13.5" y="13.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function AppShell({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrate = useDesk((s) => s.hydrate);
  const hydrated = useDesk((s) => s.hydrated);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useExchangeTicker();

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-bg md:flex">
        <Link to="/" className="flex items-center gap-2 px-5 py-6 text-fg">
          <Mark className="size-6" />
          <span className="font-display text-xl tracking-tight">Multiniche</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active
                    ? "bg-raised text-fg"
                    : "text-muted hover:bg-raised/60 hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="px-5 py-6 text-[11px] leading-relaxed text-subtle">
          Ads exchange. House advertiser{" "}
          <a
            href="https://multinicheai.com"
            className="text-muted underline-offset-2 hover:text-fg hover:underline"
          >
            multinicheai.com
          </a>
          .
          <span className="mt-2 block">© 2026 MULTINICHE AI. All rights reserved.</span>
        </p>
      </aside>

      <header className="sticky top-0 z-10 flex items-center border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Mark className="size-5" />
          <span className="font-display text-lg">Multiniche</span>
        </Link>
      </header>

      <main className="md:pl-56">
        <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow ? (
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-subtle">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="font-display text-3xl tracking-tight md:text-4xl">{title}</h1>
            </div>
            <div className="w-full min-w-0 md:w-auto">{action}</div>
          </div>
          {children}
          {!hydrated ? (
            <p className="mt-8 text-xs text-subtle">Loading the book from the exchange…</p>
          ) : null}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
