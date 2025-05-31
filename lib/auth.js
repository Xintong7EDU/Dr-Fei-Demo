export async function signIn(supabase, email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(supabase, email, password) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut(supabase) {
  return supabase.auth.signOut()
}
