import { authenticate, json, options } from '../../cloudflare/http.js';

const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const onRequestOptions = options;

export async function onRequestPost(context) {
  try {
    const auth = await authenticate(context);
    if (auth.response) return auth.response;
    let body; try { body = await context.request.json(); } catch { return json(context, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
    const relationship = typeof body.relationship === 'string' ? body.relationship.trim() : '';
    const dateOfBirth = typeof body.date_of_birth === 'string' ? body.date_of_birth.trim() : '';
    if (displayName.length < 2 || displayName.length > 100) return json(context, 400, { error: 'ชื่อผู้ป่วย/รหัสนามแฝงต้องมีความยาว 2–100 ตัวอักษร' });
    if (relationship.length > 80) return json(context, 400, { error: 'ความสัมพันธ์ต้องไม่เกิน 80 ตัวอักษร' });
    if (dateOfBirth && (!DATE_RE.test(dateOfBirth) || Number.isNaN(Date.parse(dateOfBirth)) || new Date(dateOfBirth).toISOString().slice(0, 10) !== dateOfBirth)) return json(context, 400, { error: 'วันเกิดไม่ถูกต้อง' });
    const { data, error } = await auth.supabase.from('patients').insert({ owner_id: auth.user.id, display_name: displayName, relationship: relationship || null, date_of_birth: dateOfBirth || null }).select('id, display_name, relationship, date_of_birth, is_archived, created_at, updated_at').single();
    if (error) throw error;
    return json(context, 201, { patient: data });
  } catch (error) {
    console.error('create-patient function error:', error.message);
    return json(context, 500, { error: 'เพิ่มข้อมูลผู้ป่วยไม่สำเร็จ กรุณาตรวจสอบฐานข้อมูลและ RLS' });
  }
}
