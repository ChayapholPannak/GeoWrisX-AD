import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { handleOptions, json } from './lib/http.mjs';

const allowedEventTypes = new Set(['GEOFENCE_EXIT', 'TAMPER', 'LOW_BATTERY', 'BLE_DISCONNECTED', 'DEVICE_STATUS', 'PILLBOX_REQUEST']);

/**
 * Prototype-only device gateway endpoint.
 * Do not embed a shared secret in a consumer product for production; use per-device
 * credentials/signatures and replay protection before real patient deployment.
 */
export default async function handler(request) {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const expectedSecret = process.env.DEVICE_INGEST_SECRET;
  const suppliedSecret = request.headers.get('x-device-ingest-secret');
  const secretsMatch = Boolean(expectedSecret && suppliedSecret && Buffer.byteLength(suppliedSecret) === Buffer.byteLength(expectedSecret) && timingSafeEqual(Buffer.from(suppliedSecret), Buffer.from(expectedSecret)));
  if (!secretsMatch) return json(401, { error: 'อุปกรณ์ไม่ได้รับอนุญาต' });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json(500, { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า device-ingest' });

  let body;
  try { body = await request.json(); } catch { return json(400, { error: 'รูปแบบข้อมูลไม่ถูกต้อง' }); }
  if (!allowedEventTypes.has(body.event_type) || typeof body.device_id !== 'string') {
    return json(400, { error: 'ชนิดเหตุการณ์หรือรหัสอุปกรณ์ไม่ถูกต้อง' });
  }

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: device, error: deviceError } = await admin
      .from('devices')
      .select('id, patient_id, device_type')
      .eq('id', body.device_id)
      .single();
    if (deviceError || !device) return json(404, { error: 'ไม่พบอุปกรณ์' });

    if (body.event_type === 'DEVICE_STATUS') {
      const battery = Number(body.battery_percent);
      if (!Number.isInteger(battery) || battery < 0 || battery > 100) return json(400, { error: 'battery_percent ต้องเป็นจำนวนเต็ม 0–100' });
      const { error } = await admin.from('devices').update({
        status: body.status === 'online' ? 'online' : 'offline',
        battery_percent: battery,
        last_seen_at: new Date().toISOString(),
      }).eq('id', device.id);
      if (error) throw error;
      return json(200, { ok: true, event: 'DEVICE_STATUS' });
    }

    if (body.event_type === 'PILLBOX_REQUEST') {
      const compartment = Number(body.compartment_no);
      if (!Number.isInteger(compartment) || compartment < 1 || compartment > 3) return json(400, { error: 'compartment_no ต้องอยู่ระหว่าง 1–3' });
      // Firmware must set this true only after the pillbox itself verifies the wristband over BLE.
      const bleVerified = body.ble_proximity_verified === true;
      const expiresAt = new Date(Date.now() + 60_000).toISOString();
      const { data, error } = await admin.from('pillbox_approvals').insert({
        patient_id: device.patient_id,
        compartment_no: compartment,
        status: 'pending',
        ble_verified: bleVerified,
        expires_at: expiresAt,
      }).select('id, status, ble_verified, expires_at').single();
      if (error) throw error;
      return json(201, { ok: true, approval: data });
    }

    const messages = {
      GEOFENCE_EXIT: 'สายรัดตรวจพบการออกนอกพื้นที่ที่กำหนด',
      TAMPER: 'ตรวจพบการเปิดหรือถอดสายรัด',
      LOW_BATTERY: 'แบตเตอรี่อุปกรณ์ใกล้หมด',
      BLE_DISCONNECTED: 'การเชื่อมต่อ BLE ขาดหาย',
    };
    const severity = body.event_type === 'TAMPER' || body.event_type === 'GEOFENCE_EXIT' ? 'critical' : 'warning';
    const message = typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 300)
      : messages[body.event_type];
    const { data, error } = await admin.from('alerts').insert({
      patient_id: device.patient_id,
      device_id: device.id,
      alert_type: body.event_type,
      severity,
      message,
    }).select('id, alert_type, severity, occurred_at').single();
    if (error) throw error;
    return json(201, { ok: true, alert: data });
  } catch (error) {
    console.error('device-event error:', error.message);
    return json(500, { error: 'บันทึกเหตุการณ์จากอุปกรณ์ไม่สำเร็จ' });
  }
}
