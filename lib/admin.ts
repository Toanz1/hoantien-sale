import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(accessToken: string) {
  const token = accessToken?.trim();

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "ADMIN AUTH: Missing Supabase environment variables"
    );

    throw new Error("SERVER_CONFIGURATION_ERROR");
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },

      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const userEmail =
    user.email?.trim().toLowerCase();

  if (!userEmail) {
    throw new Error("FORBIDDEN");
  }

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) =>
        email.trim().toLowerCase()
      )
      .filter(Boolean)
  );

  if (adminEmails.size === 0) {
    console.error(
      "ADMIN AUTH: ADMIN_EMAILS is not configured"
    );

    throw new Error("SERVER_CONFIGURATION_ERROR");
  }

  if (!adminEmails.has(userEmail)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}