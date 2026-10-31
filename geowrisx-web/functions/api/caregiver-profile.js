import { authenticate, json, options } from '../../cloudflare/http.js';

export const onRequestOptions = options;

export async function onRequest(context) {
  try {
    const auth = await authenticate(context);
    if (auth.response) return auth.response;
    if (context.request.method === 'GET') {
      const { data, error } = await auth.supabase.from('caregiver_profiles').select('user_id, full_name, phone, relationship_to_patient, created_at, updated_at').eq('user_id', auth.user.id).maybeSingle();
      if (error) throw error;
      return json(context, 200, { profile: data || { user_id: auth.user.id, full_name: auth.user.user_metadata?.full_name || '', phone: '', relationship_to_patient: '' }, email: auth.user.email || '' });
    }
    if (context.request.method !== 'PUT') return json(context, 405, { error: 'Method not allowed' });
    let body; try { body = await context.request.json(); } catch { return json(context, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const relationship = typeof body.relationship_to_patient === 'string' ? body.relationship_to_patient.trim() : '';
    if (fullName.length < 2 || fullName.length > 100) return json(context, 400, { error: 'ชื่อผู้ดูแลต้องมีความยาว 2–100 ตัวอักษร' });
    if (phone.length > 30) return json(context, 400, { error: 'เบอร์โทรศัพท์ยาวเกินไป' });
    if (relationship.length > 80) return json(context, 400, { error: 'ความสัมพันธ์ต้องไม่เกิน 80 ตัวอักษร' });
    const { data, error } = await auth.supabase.from('caregiver_profiles').upsert({ user_id: auth.user.id, full_name: fullName, phone: phone || null, relationship_to_patient: relationship || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('user_id, full_name, phone, relationship_to_patient, created_at, updated_at').single();
    if (error) throw error;
    return json(context, 200, { profile: data, email: auth.user.email || '' });
  } catch (error) {
    console.error('caregiver-profile function error:', error.message);
    return json(context, 500, { error: 'จัดการโปรไฟล์ผู้ดูแลไม่สำเร็จ กรุณารัน migration และตรวจสอบสิทธิ์ฐานข้อมูล' });
  }
}
