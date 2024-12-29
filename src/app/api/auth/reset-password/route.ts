import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const applyRateLimit = (request: Request) =>
  new Promise((resolve, reject) => {
    const res = {
      setHeader: () => {},
      status: () => ({ json: () => {} }),
    };
    limiter(request as any, res as any, (result: any) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });

export async function POST(request: Request) {
  try {
    await applyRateLimit(request);
  } catch (error) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { email } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Password reset email sent' });
}
