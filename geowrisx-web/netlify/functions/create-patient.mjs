import { authenticate, handleOptions, json } from './lib/http.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;
    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }

    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
    if (displayName.length < 2 || displayName.length > 100) {
      return json(400, { error: 'ชื่อผู้ป่วยต้องมีความยาว 2–100 ตัวอักษร' });
    }

    const { data, error } = await auth.supabase
      .from('patients')
      .insert({ owner_id: auth.user.id, display_name: displayName })
      .select('id, display_name, created_at')
      .single();
    if (error) throw error;
    return json(201, { patient: data });
  } catch (error) {
    console.error('create-patient function error:', error.message);
    return json(500, { error: 'เพิ่มข้อมูลผู้ป่วยไม่สำเร็จ กรุณาตรวจสอบฐานข้อมูลและ RLS' });
  }
}
