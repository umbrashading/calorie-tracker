import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/nav/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

type ProfileHeader = Pick<Profile, "display_name" | "avatar_emoji">;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
    .single();

  const profile = data as ProfileHeader | null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
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
    </div>
  );
}
