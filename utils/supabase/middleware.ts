import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    const { error } = await supabase.auth.getUser();
    if (error) {
      // If there's an error (like invalid refresh token), we might want to clear the session
      // but only if it's a specific auth error.
      if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
        // We can't easily clear all cookies here without knowing their names, 
        // but Supabase usually handles its own cookie removal if we call signOut or if we let the client handle it.
        // For now, we just ensure the response continues.
      }
    }
  } catch {
    // If auth check fails in middleware, we still want to return the response
    // and let the client-side handle the auth state.
  }

  return response;
}
