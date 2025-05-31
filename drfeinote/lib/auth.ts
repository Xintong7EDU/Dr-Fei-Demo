export async function signIn(
  supabase: { auth: { signInWithPassword: (opts: { email: string; password: string }) => Promise<any> } },
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(
  supabase: { auth: { signUp: (opts: { email: string; password: string }) => Promise<any> } },
  email: string,
  password: string
) {
  return supabase.auth.signUp({ email, password })
}
