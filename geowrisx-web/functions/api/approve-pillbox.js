import { authenticate, json, options } from '../../cloudflare/http.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const onRequestOptions = options;

export async function onRequestPost(context) {
  try {
    const auth = await authenticate(context);
    if (auth.response) return auth.response;
    let body; try { body = await context.request.json(); } catch { return json(context, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
    const requestId = typeof body.request_id === 'string' ? body.request_id : '';
    if (!UUID_RE.test(requestId)) return json(context, 400, { error: 'รหัสคำขอไม่ถูกต้อง' });
    const { data, error } = await auth.supabase.rpc('approve_pillbox_request', { p_request_id: requestId });
    if (error) {
      const message = error.message || '';
      if (message.includes('BLE_NOT_VERIFIED')) return json(context, 409, { error: 'ยังไม่ได้รับการยืนยันระยะใกล้ผ่าน BLE จากกล่องยา' });
      if (message.includes('REQUEST_EXPIRED')) return json(context, 409, { error: 'คำขอนี้หมดอายุแล้ว กรุณาให้กล่องยาส่งคำขอใหม่' });
      if (message.includes('REQUEST_NOT_PENDING')) return json(context, 409, { error: 'คำขอนี้ถูกดำเนินการไปแล้ว' });
      if (message.includes('REQUEST_NOT_FOUND')) return json(context, 404, { error: 'ไม่พบคำขอหรือคุณไม่มีสิทธิ์อนุมัติคำขอนี้' });
      console.error('approve-pillbox RPC error:', message);
      return json(context, 500, { error: 'อนุมัติไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล' });
    }
    return json(context, 200, { result: data, message: 'อนุมัติแล้วและเพิ่มคำสั่งลงคิวอุปกรณ์แล้ว' });
  } catch (error) {
    console.error('approve-pillbox function error:', error.message);
    return json(context, 500, { error: 'เกิดข้อผิดพลาดขณะอนุมัติคำขอ' });
  }
}
