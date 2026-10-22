import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Battery, BellRing,
  CheckCircle2, ChevronRight, Clock3, HeartPulse, LockKeyhole, LogOut,
  MapPinned, Plus, RefreshCw, ShieldCheck, Smartphone, Watch, XCircle,
  Archive, Pencil, RotateCcw, Save, UserRound, X,
} from 'lucide-react';
import { apiRequest } from './lib/api.js';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';

const emptyData = { patients: [], devices: [], alerts: [], approvals: [], commands: [] };

function SetupNotice() {
  return (
    <div className="min-h-screen grid place-items-center p-5 soft-grid">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 panel-shadow">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><ShieldCheck /></div>
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่า GeoWrisX AD</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">ยังไม่ได้เชื่อมต่อ Supabase ให้สร้างไฟล์ <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code> จาก <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> แล้วใส่ Project URL และ Publishable Key ของโปรเจกต์ของคุณ จากนั้นรีสตาร์ตเซิร์ฟเวอร์</p>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700">VITE_SUPABASE_URL=https://...supabase.co<br />VITE_SUPABASE_PUBLISHABLE_KEY=...</div>
        <p className="mt-4 text-xs leading-5 text-slate-500">คีย์ Publishable ใช้ในเบราว์เซอร์ได้เมื่อเปิด RLS ถูกต้อง ส่วน Service Role Key ต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น</p>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setNotice(null);
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setNotice({ kind: 'success', text: data.session ? 'สร้างบัญชีสำเร็จ' : 'สมัครสมาชิกแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีตามการตั้งค่า Supabase' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setNotice({ kind: 'error', text: error.message || 'ดำเนินการไม่สำเร็จ' });
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-white">
      <section className="relative hidden overflow-hidden bg-[#17294b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><HeartPulse size={23} /></div><div><div className="text-lg font-bold">GeoWrisX <span className="text-blue-200">AD</span></div><div className="text-xs text-blue-100/70">Caregiver Safety Console</div></div></div>
        <div className="relative max-w-xl py-10"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-blue-100"><ShieldCheck size={14} /> Dual-Safety Matrix</div><h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">ดูแลได้ใกล้ชิดขึ้น<br /><span className="text-blue-200">โดยไม่ต้องเฝ้าตลอดเวลา</span></h1><p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75">ศูนย์รวมสถานะสายรัดข้อมือ การแจ้งเตือนพื้นที่ปลอดภัย และคำขออนุมัติเปิดกล่องยาสำหรับผู้ดูแล</p><div className="mt-10 grid max-w-md grid-cols-2 gap-3"><FeatureMini icon={<MapPinned size={17} />} title="Geofencing" text="ติดตามเหตุการณ์ออกนอกพื้นที่" /><FeatureMini icon={<LockKeyhole size={17} />} title="2FA Pillbox" text="ตรวจ BLE และอนุมัติโดยผู้ดูแล" /></div></div>
        <div className="relative text-xs text-blue-100/45">ต้นแบบเพื่อการศึกษา · ไม่ใช่อุปกรณ์การแพทย์ที่ผ่านการรับรอง</div>
      </section>
      <section className="grid place-items-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-800"><HeartPulse /></div><div><div className="text-lg font-bold">GeoWrisX AD</div><div className="text-xs text-slate-500">Caregiver Safety Console</div></div></div>
          <p className="text-sm font-semibold text-blue-700">ยินดีต้อนรับ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้ดูแล'}</h2>
          <p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'เข้าสู่ระบบเพื่อดูสถานะและการแจ้งเตือน' : 'สร้างบัญชีสำหรับผู้ดูแลและเริ่มตั้งค่าระบบ'}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'signup' && <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อผู้ดูแล</span><input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="ชื่อที่ใช้แสดงในระบบ" /></label>}
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">อีเมล</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">รหัสผ่าน</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
            {notice && <div role="status" className={`rounded-xl border px-3 py-2.5 text-sm leading-6 ${notice.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice.text}</div>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3764] px-4 py-3 font-semibold text-white transition hover:bg-[#28477e] disabled:opacity-60">{busy ? <RefreshCw className="animate-spin" size={17} /> : <ShieldCheck size={17} />}{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">{mode === 'login' ? 'ยังไม่มีบัญชีผู้ใช้?' : 'มีบัญชีอยู่แล้ว?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setNotice(null); }} className="font-semibold text-blue-700 hover:text-blue-900">{mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button></div>
          <p className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-400">ข้อมูลผู้ป่วยและข้อมูลตำแหน่งเป็นข้อมูลอ่อนไหว ควรใช้เฉพาะข้อมูลทดสอบจนกว่าจะตรวจสอบความปลอดภัยและได้รับความยินยอมครบถ้วน</p>
        </div>
      </section>
    </main>
  );
}

function FeatureMini({ icon, title, text }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5"><div className="mb-2 text-blue-200">{icon}</div><div className="text-sm font-semibold">{title}</div><div className="mt-1 text-xs leading-5 text-blue-100/65">{text}</div></div>;
}

function StatCard({ icon: Icon, label, value, note, tone = 'blue' }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
  }[tone];
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-4 panel-shadow sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div><p className="mt-1.5 text-xs text-slate-500">{note}</p></div><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}><Icon size={19} /></div></div></div>;
}

function formatDate(value) {
  if (!value) return 'ยังไม่มีข้อมูล';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ยังไม่มีข้อมูล';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusLabel(status) {
  if (status === 'online') return 'ออนไลน์';
  if (status === 'offline') return 'ออฟไลน์';
  return 'ยังไม่ทราบสถานะ';
}

function Dashboard({ session }) {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientRelationship, setNewPatientRelationship] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [approvingId, setApprovingId] = useState('');
  const [showArchivedPatients, setShowArchivedPatients] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState('');
  const [patientDraft, setPatientDraft] = useState({ display_name: '', relationship: '', date_of_birth: '' });
  const [savingPatient, setSavingPatient] = useState(false);
  const [caregiverProfile, setCaregiverProfile] = useState({ full_name: session.user?.user_metadata?.full_name || '', phone: '', relationship_to_patient: '' });
  const [profileEmail, setProfileEmail] = useState(session.user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const result = await apiRequest('dashboard', { token: session.access_token });
      setData({ ...emptyData, ...result });
    } catch (e) {
      setError(e.message || 'โหลดข้อมูลไม่ได้');
    } finally { setLoading(false); setRefreshing(false); }
  }, [session.access_token]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    let active = true;
    apiRequest('caregiver-profile', { token: session.access_token }).then((result) => {
      if (!active) return;
      setCaregiverProfile({ full_name: result.profile?.full_name || session.user?.user_metadata?.full_name || '', phone: result.profile?.phone || '', relationship_to_patient: result.profile?.relationship_to_patient || '' });
      setProfileEmail(result.email || session.user?.email || '');
    }).catch((e) => {
      if (active) setNotice({ kind: 'error', text: e.message || 'โหลดโปรไฟล์ผู้ดูแลไม่สำเร็จ หากเพิ่งอัปเดตระบบให้รัน migration ก่อน' });
    });
    return () => { active = false; };
  }, [session.access_token, session.user?.email, session.user?.user_metadata?.full_name]);

  const activePatients = useMemo(() => data.patients.filter((patient) => !patient.is_archived), [data.patients]);
  const archivedPatients = useMemo(() => data.patients.filter((patient) => Boolean(patient.is_archived)), [data.patients]);
  const visiblePatients = showArchivedPatients ? archivedPatients : activePatients;
  const patientNames = useMemo(() => new Map(data.patients.map((p) => [p.id, p.display_name])), [data.patients]);
  const onlineDevices = data.devices.filter((device) => device.status === 'online').length;
  const unacknowledgedAlerts = data.alerts.filter((alert) => !alert.acknowledged_at).length;
  const pendingApprovals = data.approvals.filter((item) => item.status === 'pending').length;

  async function addPatient(event) {
    event.preventDefault();
    setAddingPatient(true); setNotice(null);
    try {
      await apiRequest('create-patient', { token: session.access_token, method: 'POST', body: { display_name: newPatientName, relationship: newPatientRelationship, date_of_birth: newPatientDob } });
      setNewPatientName('');
      setNewPatientRelationship('');
      setNewPatientDob('');
      setNotice({ kind: 'success', text: 'เพิ่มโปรไฟล์ผู้ป่วยแล้ว' });
      await loadDashboard(true);
    } catch (e) { setNotice({ kind: 'error', text: e.message }); }
    finally { setAddingPatient(false); }
  }

  async function saveCaregiverProfile(event) {
    event.preventDefault(); setSavingProfile(true); setNotice(null);
    try {
      const result = await apiRequest('caregiver-profile', { token: session.access_token, method: 'PUT', body: caregiverProfile });
      setCaregiverProfile({ full_name: result.profile.full_name || '', phone: result.profile.phone || '', relationship_to_patient: result.profile.relationship_to_patient || '' });
      setProfileEmail(result.email || profileEmail);
      await supabase.auth.updateUser({ data: { full_name: result.profile.full_name } }).catch(() => {});
      setNotice({ kind: 'success', text: 'บันทึกโปรไฟล์ผู้ดูแลแล้ว' });
    } catch (e) { setNotice({ kind: 'error', text: e.message || 'บันทึกโปรไฟล์ผู้ดูแลไม่สำเร็จ' }); }
    finally { setSavingProfile(false); }
  }

  function startEditingPatient(patient) {
    setEditingPatientId(patient.id);
    setPatientDraft({ display_name: patient.display_name || '', relationship: patient.relationship || '', date_of_birth: patient.date_of_birth || '' });
  }

  async function savePatient(event) {
    event.preventDefault(); setSavingPatient(true); setNotice(null);
    try {
      await apiRequest('update-patient', { token: session.access_token, method: 'PATCH', body: { patient_id: editingPatientId, ...patientDraft } });
      setEditingPatientId('');
      setNotice({ kind: 'success', text: 'บันทึกข้อมูลผู้ป่วยแล้ว' });
      await loadDashboard(true);
    } catch (e) { setNotice({ kind: 'error', text: e.message || 'แก้ไขข้อมูลผู้ป่วยไม่สำเร็จ' }); }
    finally { setSavingPatient(false); }
  }

  async function toggleArchivePatient(patient) {
    const archive = !patient.is_archived;
    const message = archive ? `เก็บโปรไฟล์ "${patient.display_name}" เข้าคลังหรือไม่? ประวัติจะยังถูกเก็บไว้` : `กู้คืนโปรไฟล์ "${patient.display_name}" หรือไม่?`;
    if (!window.confirm(message)) return;
    setNotice(null);
    try {
      const result = await apiRequest('archive-patient', { token: session.access_token, method: 'POST', body: { patient_id: patient.id, is_archived: archive } });
      setNotice({ kind: 'success', text: result.message });
      if (editingPatientId === patient.id) setEditingPatientId('');
      await loadDashboard(true);
    } catch (e) { setNotice({ kind: 'error', text: e.message || 'เปลี่ยนสถานะโปรไฟล์ไม่สำเร็จ' }); }
  }

  async function approve(requestId) {
    setApprovingId(requestId); setNotice(null);
    try {
      const result = await apiRequest('approve-pillbox', { token: session.access_token, method: 'POST', body: { request_id: requestId } });
      setNotice({ kind: 'success', text: `${result.message} คำสั่งมีอายุสั้นและจะยังไม่เปิดกลอนจริงจนกว่าจะเชื่อม Device Gateway/MQTT กับเฟิร์มแวร์` });
      await loadDashboard(true);
    } catch (e) { setNotice({ kind: 'error', text: e.message }); }
    finally { setApprovingId(''); }
  }

  async function logout() { await supabase.auth.signOut(); }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e3764] text-white"><HeartPulse size={21} /></div><div><div className="font-bold text-slate-900">GeoWrisX <span className="text-blue-700">AD</span></div><div className="text-[11px] text-slate-400">Caregiver Console</div></div></div>
        <div className="mt-10 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">เมนูหลัก</div>
        <nav className="mt-3 space-y-1"><NavItem active icon={Activity} label="ภาพรวมระบบ" /><NavItem icon={Watch} label="สายรัดและอุปกรณ์" /><NavItem icon={BellRing} label="การแจ้งเตือน" count={unacknowledgedAlerts} /><NavItem icon={LockKeyhole} label="อนุมัติกล่องยา" count={pendingApprovals} /></nav>
        <div className="mt-auto rounded-2xl bg-blue-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-blue-950"><ShieldCheck size={17} /> Dual-Safety Matrix</div><p className="mt-2 text-xs leading-5 text-blue-900/65">Geofencing · Anti-Removal · Caregiver Approval</p><div className="mt-3 rounded-lg border border-blue-100 bg-white/80 px-2.5 py-2 text-[11px] text-blue-900/70">Prototype mode</div></div>
      </aside>

      <main className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-800 lg:hidden"><HeartPulse size={19} /></div><div><div className="text-xs text-slate-400">พื้นที่ผู้ดูแล / <span className="text-slate-600">ภาพรวม</span></div><div className="text-sm font-semibold text-slate-900">Caregiver Dashboard</div></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><div className="hidden text-right sm:block"><div className="max-w-48 truncate text-xs font-semibold text-slate-700">{session.user?.user_metadata?.full_name || session.user?.email}</div><div className="text-[11px] text-slate-400">บัญชีผู้ดูแล</div></div><button onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><LogOut size={15} /><span className="hidden sm:inline">ออกจากระบบ</span></button></div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> ระบบติดตามและแจ้งเตือน</div><h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">ภาพรวมความปลอดภัย</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">ติดตามสถานะอุปกรณ์ ตรวจเหตุการณ์ผิดปกติ และอนุมัติคำขอจากกล่องยาในหน้าจอเดียว</p></div><button onClick={() => loadDashboard(true)} disabled={refreshing} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"> <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> รีเฟรชข้อมูล</button></div>

          {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><div><div className="font-semibold">โหลดข้อมูลไม่สำเร็จ</div><div className="mt-1 leading-6">{error}</div><div className="mt-2 text-xs text-rose-700">ตรวจสอบว่าได้รัน supabase/setup.sql และตั้งค่า Environment Variables ครบแล้ว</div></div></div>}
          {notice && <div role="status" className={`mt-5 flex items-start gap-2 rounded-xl border p-3.5 text-sm leading-6 ${notice.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice.kind === 'error' ? <XCircle size={17} className="mt-1 shrink-0" /> : <CheckCircle2 size={17} className="mt-1 shrink-0" />}<div className="flex-1">{notice.text}</div><button aria-label="ปิดข้อความ" onClick={() => setNotice(null)}><XCircle size={16} /></button></div>}

          <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 panel-shadow sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={19} /></div>
              <div><h2 className="font-bold text-slate-900">โปรไฟล์ผู้ดูแล</h2><p className="mt-1 text-xs leading-5 text-slate-500">จัดการข้อมูลติดต่อของบัญชีนี้ อีเมลแสดงจากบัญชีเข้าสู่ระบบและแก้ไขที่นี่ไม่ได้</p></div>
            </div>
            <form onSubmit={saveCaregiverProfile} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">ชื่อผู้ดูแล</span><input value={caregiverProfile.full_name} onChange={(e) => setCaregiverProfile((p) => ({ ...p, full_name: e.target.value }))} required minLength={2} maxLength={100} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="ชื่อที่ใช้แสดง" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">อีเมลบัญชี</span><input value={profileEmail} readOnly className="w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">เบอร์โทรศัพท์ (ไม่บังคับ)</span><input type="tel" value={caregiverProfile.phone} onChange={(e) => setCaregiverProfile((p) => ({ ...p, phone: e.target.value }))} maxLength={30} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="เบอร์สำหรับติดต่อ" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600">ความสัมพันธ์กับผู้ป่วย (ไม่บังคับ)</span><input value={caregiverProfile.relationship_to_patient} onChange={(e) => setCaregiverProfile((p) => ({ ...p, relationship_to_patient: e.target.value }))} maxLength={80} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="เช่น บุตร / ผู้ดูแลหลัก" /></label>
              <div className="sm:col-span-2 xl:col-span-4"><button disabled={savingProfile} className="inline-flex items-center gap-2 rounded-xl bg-[#1e3764] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#28477e] disabled:opacity-60"><Save size={15} />{savingProfile ? 'กำลังบันทึก…' : 'บันทึกโปรไฟล์ผู้ดูแล'}</button></div>
            </form>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={HeartPulse} label="ผู้ป่วยที่ลงทะเบียน" value={loading ? '—' : activePatients.length} note={archivedPatients.length ? 'มีโปรไฟล์ในคลัง ' + archivedPatients.length + ' ราย' : 'โปรไฟล์ที่ใช้งานในบัญชี'} tone="blue" />
            <StatCard icon={Smartphone} label="อุปกรณ์ออนไลน์" value={loading ? '—' : `${onlineDevices}/${data.devices.length}`} note="สายรัด / กล่องยา / Gateway" tone="green" />
            <StatCard icon={BellRing} label="การแจ้งเตือนที่ต้องตรวจสอบ" value={loading ? '—' : unacknowledgedAlerts} note="ยังไม่รับทราบ" tone={unacknowledgedAlerts ? 'red' : 'green'} />
            <StatCard icon={LockKeyhole} label="คำขอเปิดกล่องยาที่รออยู่" value={loading ? '—' : pendingApprovals} note="ต้องมี BLE proof และไม่หมดอายุ" tone={pendingApprovals ? 'amber' : 'blue'} />
          </section>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 panel-shadow sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">ผู้ป่วยและอุปกรณ์</h2><p className="mt-1 text-xs leading-5 text-slate-500">อุปกรณ์จะแสดงเมื่อมีการลงทะเบียนผ่าน Device Gateway</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Watch size={19} /></div></div>
              <form onSubmit={addPatient} className="mt-5 grid gap-2 sm:grid-cols-2">
                <input value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} minLength={2} maxLength={100} required placeholder="ชื่อผู้ป่วยหรือรหัสนามแฝง (แนะนำ)" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                <input value={newPatientRelationship} onChange={(e) => setNewPatientRelationship(e.target.value)} maxLength={80} placeholder="ความสัมพันธ์ (ไม่บังคับ)" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                <label className="text-xs text-slate-500"><span className="mb-1 block">วันเกิด (ไม่บังคับ)</span><input type="date" value={newPatientDob} onChange={(e) => setNewPatientDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" /></label>
                <div className="flex items-end"><button disabled={addingPatient} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3764] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#28477e] disabled:opacity-60"><Plus size={16} />{addingPatient ? 'กำลังบันทึก…' : 'เพิ่มผู้ป่วย'}</button></div>
              </form>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">แนะนำใช้ชื่อสมมติระหว่างพัฒนา ระบบจะเก็บประวัติไว้เมื่อเก็บโปรไฟล์เข้าคลัง</p>
                <button type="button" onClick={() => setShowArchivedPatients((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Archive size={14} />{showArchivedPatients ? 'กลับไปผู้ป่วยที่ใช้งาน' : 'ดูคลังผู้ป่วย (' + archivedPatients.length + ')'}</button>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {loading ? <div className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูล…</div> : visiblePatients.length === 0 ? <EmptyState icon={HeartPulse} title={showArchivedPatients ? 'ยังไม่มีผู้ป่วยในคลัง' : 'ยังไม่มีโปรไฟล์ผู้ป่วย'} text={showArchivedPatients ? 'โปรไฟล์ที่เก็บเข้าคลังจะแสดงในส่วนนี้' : 'เพิ่มโปรไฟล์เพื่อเริ่มผูกอุปกรณ์ทดสอบ โดยใช้ชื่อสมมติในช่วงพัฒนา'} /> : visiblePatients.map((patient) => {
                  const patientDevices = data.devices.filter((device) => device.patient_id === patient.id);
                  return <div key={patient.id} className="py-4 first:pt-5 last:pb-0"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">{patient.display_name.slice(0, 1)}</div><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{patient.display_name}</div><div className="mt-0.5 text-xs text-slate-400">เพิ่มเมื่อ {formatDate(patient.created_at)}</div></div></div><span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{patientDevices.length} อุปกรณ์</span></div>
                    {patientDevices.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{patientDevices.map((device) => <div key={device.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold">{device.device_name}</span><span className={`inline-flex items-center gap-1 text-[11px] ${device.status === 'online' ? 'text-emerald-700' : 'text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${device.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />{statusLabel(device.status)}</span></div><div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Battery size={13} />{device.battery_percent == null ? 'ไม่มีข้อมูลแบตเตอรี่' : `แบตเตอรี่ ${device.battery_percent}%`}<span className="mx-1 text-slate-300">·</span><Clock3 size={12} />{formatDate(device.last_seen_at)}</div></div>)}</div>}
                  </div>;
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 panel-shadow sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">คำขออนุมัติกล่องยา</h2><p className="mt-1 text-xs leading-5 text-slate-500">อนุมัติได้เมื่อกล่องยายืนยัน BLE proximity แล้วเท่านั้น</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><LockKeyhole size={19} /></div></div>
              <div className="mt-4 space-y-3">{loading ? <div className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูล…</div> : data.approvals.length === 0 ? <EmptyState icon={LockKeyhole} title="ไม่มีคำขอในขณะนี้" text="เมื่อกล่องยาส่งคำขอที่มี BLE proof ผ่าน Device Gateway รายการจะแสดงตรงนี้" /> : data.approvals.map((request) => {
                const canApprove = request.status === 'pending' && request.ble_verified && new Date(request.expires_at).getTime() > Date.now();
                const status = request.status === 'pending' ? (request.ble_verified ? 'รออนุมัติ' : 'รอ BLE proof') : request.status === 'approved' ? 'อนุมัติแล้ว' : request.status === 'expired' ? 'หมดอายุ' : 'ปฏิเสธ';
                return <div key={request.id} className="rounded-xl border border-slate-200 p-3.5"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold text-slate-900">ช่องยา {request.compartment_no} · {patientNames.get(request.patient_id) || 'ผู้ป่วย'}</div><div className="mt-1.5 text-xs text-slate-500">รับคำขอ {formatDate(request.requested_at)}</div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : request.status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{status}</span></div>{request.status === 'pending' && <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className={`text-xs ${request.ble_verified ? 'text-emerald-700' : 'text-slate-500'}`}>{request.ble_verified ? '✓ กล่องยายืนยัน BLE แล้ว' : 'ยังไม่ยืนยันระยะใกล้ผ่าน BLE'}<div className="mt-1 text-[11px] text-slate-400">หมดอายุ: {formatDate(request.expires_at)}</div></div><button disabled={!canApprove || approvingId === request.id} onClick={() => approve(request.id)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1e3764] px-3 py-2 text-xs font-semibold text-white hover:bg-[#28477e]">{approvingId === request.id ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}อนุมัติ</button></div>}</div>;
              })}</div>
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900/80"><strong>ข้อจำกัดของต้นแบบ:</strong> ระบบนี้สร้างคิวคำสั่งเท่านั้น ต้องเชื่อม MQTT/ตัวอ่านคิวกับเฟิร์มแวร์กล่องยา และให้กล่องยาตรวจเงื่อนไขความปลอดภัยอีกครั้งก่อนขับ Solenoid</div>
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 panel-shadow sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">เหตุการณ์และการแจ้งเตือนล่าสุด</h2><p className="mt-1 text-xs text-slate-500">การออกนอก Geofence · การเปิดสายรัด · แบตเตอรี่ต่ำ · BLE ขาดการเชื่อมต่อ</p></div><BellRing size={19} className="text-slate-400" /></div>
            <div className="mt-4">{loading ? <div className="py-8 text-center text-sm text-slate-400">กำลังโหลดข้อมูล…</div> : data.alerts.length === 0 ? <EmptyState icon={BellRing} title="ยังไม่มีเหตุการณ์แจ้งเตือน" text="รายการจริงจะแสดงเมื่อ Device Gateway บันทึกเหตุการณ์จากอุปกรณ์" /> : <div className="space-y-2">{data.alerts.map((alert) => <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"><div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${alert.severity === 'critical' ? 'bg-rose-50 text-rose-700' : alert.severity === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}><AlertTriangle size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-800">{alert.message}</span>{!alert.acknowledged_at && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">ยังไม่รับทราบ</span>}</div><div className="mt-1 text-xs text-slate-400">{patientNames.get(alert.patient_id) || 'ผู้ป่วย'} · {formatDate(alert.occurred_at)}</div></div><ChevronRight size={16} className="mt-2 shrink-0 text-slate-300" /></div>)}</div>}</div>
          </section>

          <footer className="mt-7 flex flex-col gap-2 border-t border-slate-200 pt-5 text-[11px] leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>GeoWrisX AD · Research prototype · R&D / OCOP</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} /> ข้อมูลทดสอบเท่านั้นจนกว่าจะผ่านการตรวจสอบความปลอดภัยและการทดสอบจริง</span></footer>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, count = 0 }) {
  return <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-500'}`}><Icon size={17} /><span className="flex-1">{label}</span>{count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">{count}</span>}</div>;
}

function EmptyState({ icon: Icon, title, text }) {
  return <div className="grid justify-items-center px-4 py-8 text-center"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon size={20} /></div><div className="mt-3 text-sm font-semibold text-slate-700">{title}</div><p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{text}</p></div>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setCheckingSession(false); return undefined; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setCheckingSession(false); }
    }).catch(() => { if (alive) setCheckingSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCheckingSession(false);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (checkingSession) return <div className="grid min-h-screen place-items-center bg-[#f5f7fb]"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm"><RefreshCw className="animate-spin text-blue-700" size={18} />กำลังตรวจสอบเซสชัน…</div></div>;
  return session ? <Dashboard session={session} /> : <AuthScreen />;
}
