"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", icon: "📊" },
  { href: "/log/intake", label: "Eat", icon: "🍽️" },
  { href: "/log/burn", label: "Burn", icon: "🏃" },
  { href: "/history", label: "History", icon: "📅" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-2xl">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs ${
                active ? "font-semibold text-neutral-900" : "text-neutral-500"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
