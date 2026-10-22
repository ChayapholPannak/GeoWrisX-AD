import { authenticate, handleOptions, json } from './lib/http.mjs';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;
    const { supabase } = auth;

    // RLS limits this query to patients owned by the authenticated caregiver.
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, display_name, relationship, date_of_birth, is_archived, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (patientsError) throw patientsError;

    const patientIds = (patients || []).map((patient) => patient.id);
    if (patientIds.length === 0) {
      return json(200, { patients: [], devices: [], alerts: [], approvals: [], commands: [] });
    }

    const [devicesResult, alertsResult, approvalsResult, commandsResult] = await Promise.all([
      supabase.from('devices')
        .select('id, patient_id, device_type, device_name, status, battery_percent, last_seen_at, created_at')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false }),
      supabase.from('alerts')
        .select('id, patient_id, device_id, alert_type, severity, message, occurred_at, acknowledged_at')
        .in('patient_id', patientIds)
        .order('occurred_at', { ascending: false })
        .limit(20),
      supabase.from('pillbox_approvals')
        .select('id, patient_id, compartment_no, status, ble_verified, requested_at, expires_at, approved_at')
        .in('patient_id', patientIds)
        .order('requested_at', { ascending: false })
        .limit(20),
      supabase.from('device_commands')
        .select('id, patient_id, command_type, compartment_no, status, created_at, expires_at')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    for (const result of [devicesResult, alertsResult, approvalsResult, commandsResult]) {
      if (result.error) throw result.error;
    }

    return json(200, {
      patients: patients || [],
      devices: devicesResult.data || [],
      alerts: alertsResult.data || [],
      approvals: approvalsResult.data || [],
      commands: commandsResult.data || [],
    });
  } catch (error) {
    console.error('dashboard function error:', error.message);
    return json(500, { error: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาตรวจสอบโครงสร้างฐานข้อมูลและ RLS' });
  }
}
