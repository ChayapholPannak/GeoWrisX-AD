import { authenticate, handleOptions, json } from './lib/http.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;
    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
    const requestId = typeof body.request_id === 'string' ? body.request_id : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return json(400, { error: 'รหัสคำขอไม่ถูกต้อง' });
    }

    // The database RPC verifies ownership, request expiry, and BLE verification,
    // then atomically approves and queues a short-lived device command.
    const { data, error } = await auth.supabase.rpc('approve_pillbox_request', {
      p_request_id: requestId,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('BLE_NOT_VERIFIED')) return json(409, { error: 'ยังไม่ได้รับการยืนยันระยะใกล้ผ่าน BLE จากกล่องยา' });
      if (msg.includes('REQUEST_EXPIRED')) return json(409, { error: 'คำขอนี้หมดอายุแล้ว กรุณาให้กล่องยาส่งคำขอใหม่' });
      if (msg.includes('REQUEST_NOT_PENDING')) return json(409, { error: 'คำขอนี้ถูกดำเนินการไปแล้ว' });
      if (msg.includes('REQUEST_NOT_FOUND')) return json(404, { error: 'ไม่พบคำขอหรือคุณไม่มีสิทธิ์อนุมัติคำขอนี้' });
      console.error('approve-pillbox RPC error:', msg);
      return json(500, { error: 'อนุมัติไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล' });
    }
    return json(200, { result: data, message: 'อนุมัติแล้วและเพิ่มคำสั่งลงคิวอุปกรณ์แล้ว' });
  } catch (error) {
    console.error('approve-pillbox function error:', error.message);
    return json(500, { error: 'เกิดข้อผิดพลาดขณะอนุมัติคำขอ' });
  }
}
