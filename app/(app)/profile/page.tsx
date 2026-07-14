import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const profile = data as Profile | null;

  if (!profile) {
    return (
      <main className="p-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-neutral-600">Profile not found.</p>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Biometrics power baseline calorie burn and exercise estimates.
        </p>
      </div>
      <ProfileForm initialProfile={profile} />
    </main>
  );
}
