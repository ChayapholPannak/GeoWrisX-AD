import { createClient } from '@supabase/supabase-js';

const sharedCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-device-ingest-secret',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  Vary: 'Origin',
});

export function json(statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: sharedCorsHeaders(),
  });
}

export function handleOptions() {
  return new Response(null, { status: 204, headers: sharedCorsHeaders() });
}

export async function authenticate(request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { response: json(500, { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Supabase environment variables' }) };
  }
  if (!token) {
    return { response: json(401, { error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' }) };
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return { response: json(401, { error: 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' }) };
  }
  return { supabase: client, user: data.user };
}
