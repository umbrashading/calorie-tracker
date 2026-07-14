import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export const dynamic = "force-dynamic";

type ProfilePreview = Pick<Profile, "id" | "display_name" | "avatar_emoji">;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_emoji")
    .order("display_name");

  const profiles = (data ?? []) as ProfilePreview[];

  return (
    <main className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Signed in as {user?.email}. Daily summaries will appear here in milestone 6.
        </p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-500">Household</h2>
        <ul className="mt-3 space-y-2">
          {(profiles ?? []).map((profile) => (
            <li key={profile.id} className="flex items-center gap-2 text-sm">
              <span aria-hidden>{profile.avatar_emoji}</span>
              <span>{profile.display_name ?? "Unnamed"}</span>
              {profile.id === user?.id ? (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  You
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {!profiles.length ? (
          <p className="mt-3 text-sm text-neutral-500">
            No profiles yet. Run the Supabase migrations and create users in the Auth
            dashboard.
          </p>
        ) : null}
      </section>
    </main>
  );
}
