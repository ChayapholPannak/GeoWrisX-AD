import { authenticate, handleOptions, json } from './lib/http.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return handleOptions();

  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    if (request.method === 'GET') {
      const { data, error } = await auth.supabase
        .from('caregiver_profiles')
        .select('user_id, full_name, phone, relationship_to_patient, created_at, updated_at')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return json(200, {
        profile: data || {
          user_id: auth.user.id,
          full_name: auth.user.user_metadata?.full_name || '',
          phone: '',
          relationship_to_patient: '',
        },
        email: auth.user.email || '',
      });
    }

    if (request.method !== 'PUT') return json(405, { error: 'Method not allowed' });

    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }

    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const relationship = typeof body.relationship_to_patient === 'string' ? body.relationship_to_patient.trim() : '';

    if (fullName.length < 2 || fullName.length > 100) {
      return json(400, { error: 'ชื่อผู้ดูแลต้องมีความยาว 2–100 ตัวอักษร' });
    }
    if (phone.length > 30) return json(400, { error: 'เบอร์โทรศัพท์ยาวเกินไป' });
    if (relationship.length > 80) return json(400, { error: 'ความสัมพันธ์ต้องไม่เกิน 80 ตัวอักษร' });

    const { data, error } = await auth.supabase
      .from('caregiver_profiles')
      .upsert({
        user_id: auth.user.id,
        full_name: fullName,
        phone: phone || null,
        relationship_to_patient: relationship || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('user_id, full_name, phone, relationship_to_patient, created_at, updated_at')
      .single();
    if (error) throw error;

    return json(200, { profile: data, email: auth.user.email || '' });
  } catch (error) {
    console.error('caregiver-profile function error:', error.message);
    return json(500, { error: 'จัดการโปรไฟล์ผู้ดูแลไม่สำเร็จ กรุณารัน migration และตรวจสอบสิทธิ์ฐานข้อมูล' });
  }
}
