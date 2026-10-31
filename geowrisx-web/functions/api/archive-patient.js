import { authenticate, json, options } from '../../cloudflare/http.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const onRequestOptions = options;

export async function onRequestPost(context) {
  try {
    const auth = await authenticate(context);
    if (auth.response) return auth.response;
    let body; try { body = await context.request.json(); } catch { return json(context, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
    const patientId = typeof body.patient_id === 'string' ? body.patient_id : '';
    if (!UUID_RE.test(patientId)) return json(context, 400, { error: 'รหัสผู้ป่วยไม่ถูกต้อง' });
    if (typeof body.is_archived !== 'boolean') return json(context, 400, { error: 'สถานะเก็บเข้าคลังไม่ถูกต้อง' });
    const { data, error } = await auth.supabase.from('patients').update({ is_archived: body.is_archived, updated_at: new Date().toISOString() }).eq('id', patientId).select('id, display_name, is_archived, updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return json(context, 404, { error: 'ไม่พบผู้ป่วยหรือคุณไม่มีสิทธิ์แก้ไขข้อมูลนี้' });
    return json(context, 200, { patient: data, message: body.is_archived ? 'เก็บโปรไฟล์ผู้ป่วยเข้าคลังแล้ว' : 'กู้คืนโปรไฟล์ผู้ป่วยแล้ว' });
  } catch (error) {
    console.error('archive-patient function error:', error.message);
    return json(context, 500, { error: 'เปลี่ยนสถานะผู้ป่วยไม่สำเร็จ กรุณาตรวจสอบ migration และสิทธิ์ฐานข้อมูล' });
  }
}
