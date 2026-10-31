# GeoWrisX AD — Deployment checklist


## Free-tier cost check
- [ ] ใช้ Cloudflare Pages subdomain `*.pages.dev` ระหว่างทดสอบ และตรวจโควต้าปัจจุบันก่อน deploy
- [ ] ไม่เปิดซื้อ credits เพิ่มหรือ auto recharge
- [ ] Supabase organization/project ยังคงเป็น Free และไม่มี paid add-ons
- [ ] ยังไม่ตั้ง MQTT broker แบบเสียเงิน; เวอร์ชันแรกทดสอบ API ผ่าน HTTPS
- [ ] ตรวจ Usage dashboard และเข้าใจว่าบริการอาจ pause เมื่อถึงโควตาหรือไม่มี activity
- [ ] ใช้ข้อมูลทดสอบ ไม่ใช้ข้อมูลผู้ป่วยจริงในต้นแบบ

## Before push to GitHub
- [ ] `npm install` ผ่าน
- [ ] `npm run build` ผ่าน
- [ ] `.env` ไม่ถูก track โดย Git
- [ ] ไม่พบ Service Role Key ใน `src/`, `public/`, หรือไฟล์ที่ส่งขึ้น GitHub
- [ ] รัน `supabase/setup.sql` แล้ว
- [ ] RLS เปิดอยู่ทุกตารางใน schema

## Before Cloudflare Pages deploy
- [ ] Repository เชื่อมกับ Cloudflare Pages
- [ ] Build command `npm run build`, publish directory `dist`
- [ ] เพิ่ม `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] เพิ่ม server-side vars `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- [ ] หากเปิด Device Gateway: เพิ่ม `SUPABASE_SERVICE_ROLE_KEY`, `DEVICE_INGEST_SECRET`
- [ ] ตั้ง `ALLOWED_ORIGIN` ให้ตรงกับโดเมนจริง
- [ ] เพิ่ม Cloudflare Pages URL ใน Supabase Auth Redirect URLs
- [ ] Redeploy หลังเปลี่ยน Environment Variables

## Smoke tests
- [ ] สมัครบัญชีใหม่
- [ ] ยืนยันอีเมล (ถ้าเปิดใช้งาน)
- [ ] Login / Logout
- [ ] เพิ่มชื่อผู้ป่วยทดสอบ
- [ ] ตรวจสอบว่าบัญชีอื่นไม่สามารถอ่านผู้ป่วยคนแรกได้
- [ ] ส่ง Test event จาก gateway แล้วดู Alerts
- [ ] ทดสอบอนุมัติ: BLE false ต้องถูกปฏิเสธ
- [ ] ทดสอบอนุมัติ: request หมดอายุต้องถูกปฏิเสธ
- [ ] ยืนยันว่าการ approve เพียงสร้าง command queued ไม่ได้ขับกลอนจริงจนกว่า firmware/gateway จะเชื่อมต่อ
