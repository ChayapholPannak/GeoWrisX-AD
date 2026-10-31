import { createClient } from '@supabase/supabase-js';
import { json, options } from '../../cloudflare/http.js';

const allowedEventTypes = new Set(['GEOFENCE_EXIT', 'TAMPER', 'LOW_BATTERY', 'BLE_DISCONNECTED', 'DEVICE_STATUS', 'PILLBOX_REQUEST']);
const encoder = new TextEncoder();

function secretsMatch(expected, supplied) {
  if (!expected || !supplied) return false;
  const expectedBytes = encoder.encode(expected);
  const suppliedBytes = encoder.encode(supplied);
  return expectedBytes.byteLength === suppliedBytes.byteLength && crypto.subtle.timingSafeEqual(expectedBytes, suppliedBytes);
}

export const onRequestOptions = options;

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!secretsMatch(env.DEVICE_INGEST_SECRET, request.headers.get('x-device-ingest-secret'))) return json(context, 401, { error: 'อุปกรณ์ไม่ได้รับอนุญาต' });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json(context, 500, { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า device-ingest' });
  let body; try { body = await request.json(); } catch { return json(context, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
  if (!allowedEventTypes.has(body.event_type) || typeof body.device_id !== 'string') return json(context, 400, { error: 'ชนิดเหตุการณ์หรือรหัสอุปกรณ์ไม่ถูกต้อง' });
  try {
    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: device, error: deviceError } = await admin.from('devices').select('id, patient_id, device_type').eq('id', body.device_id).single();
    if (deviceError || !device) return json(context, 404, { error: 'ไม่พบอุปกรณ์' });
    if (body.event_type === 'DEVICE_STATUS') {
      const battery = Number(body.battery_percent);
      if (!Number.isInteger(battery) || battery < 0 || battery > 100) return json(context, 400, { error: 'battery_percent ต้องเป็นจำนวนเต็ม 0–100' });
      const { error } = await admin.from('devices').update({ status: body.status === 'online' ? 'online' : 'offline', battery_percent: battery, last_seen_at: new Date().toISOString() }).eq('id', device.id);
      if (error) throw error;
      return json(context, 200, { ok: true, event: 'DEVICE_STATUS' });
    }
    if (body.event_type === 'PILLBOX_REQUEST') {
      const compartment = Number(body.compartment_no);
      if (!Number.isInteger(compartment) || compartment < 1 || compartment > 3) return json(context, 400, { error: 'compartment_no ต้องอยู่ระหว่าง 1–3' });
      const { data, error } = await admin.from('pillbox_approvals').insert({ patient_id: device.patient_id, compartment_no: compartment, status: 'pending', ble_verified: body.ble_proximity_verified === true, expires_at: new Date(Date.now() + 60_000).toISOString() }).select('id, status, ble_verified, expires_at').single();
      if (error) throw error;
      return json(context, 201, { ok: true, approval: data });
    }
    const messages = { GEOFENCE_EXIT: 'สายรัดตรวจพบการออกนอกพื้นที่ที่กำหนด', TAMPER: 'ตรวจพบการเปิดหรือถอดสายรัด', LOW_BATTERY: 'แบตเตอรี่อุปกรณ์ใกล้หมด', BLE_DISCONNECTED: 'การเชื่อมต่อ BLE ขาดหาย' };
    const message = typeof body.message === 'string' && body.message.trim() ? body.message.trim().slice(0, 300) : messages[body.event_type];
    const { data, error } = await admin.from('alerts').insert({ patient_id: device.patient_id, device_id: device.id, alert_type: body.event_type, severity: body.event_type === 'TAMPER' || body.event_type === 'GEOFENCE_EXIT' ? 'critical' : 'warning', message }).select('id, alert_type, severity, occurred_at').single();
    if (error) throw error;
    return json(context, 201, { ok: true, alert: data });
  } catch (error) {
    console.error('device-event error:', error.message);
    return json(context, 500, { error: 'บันทึกเหตุการณ์จากอุปกรณ์ไม่สำเร็จ' });
  }
}
