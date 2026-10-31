import { createClient } from '@supabase/supabase-js';

function headers(request, env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || new URL(request.url).origin,
    'Access-Control-Allow-Headers': 'authorization, content-type, x-device-ingest-secret',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export function json(context, status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: headers(context.request, context.env) });
}

export function options(context) {
  return new Response(null, { status: 204, headers: headers(context.request, context.env) });
}

export async function authenticate(context) {
  const { request, env } = context;
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !key) return { response: json(context, 500, { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase environment variables' }) };
  if (!token) return { response: json(context, 401, { error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' }) };

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { response: json(context, 401, { error: 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' }) };
  return { supabase, user: data.user };
}
