import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login/LoginForm";
import { canCreateClient, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let user = null;

  if (canCreateClient()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Show the login form if session refresh fails (e.g. stale cookies).
    }
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
