import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { canCreateClient, createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

type ProfileHeader = Pick<Profile, "display_name" | "avatar_emoji">;

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!canCreateClient()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_emoji")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileHeader | null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <header
        className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              {profile?.avatar_emoji ?? "🙂"}
            </span>
            <span className="text-sm font-medium">
              {profile?.display_name ?? user.email}
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto max-w-2xl">{children}</div>
      <BottomNav />
    </div>
  );
}
