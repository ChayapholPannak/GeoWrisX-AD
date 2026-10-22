# GeoWrisX AD — Caregiver Web Application

> Portfolio overview: see the repository root [README](../README.md) and [PORTFOLIO.md](../PORTFOLIO.md) for project summary, implementation status, responsible-use boundaries and admissions evidence checklist.

เว็บแอปต้นแบบสำหรับโครงงาน **ระบบช่วยเหลือผู้ป่วยโรคอัลไซเมอร์ (GeoWrisX AD)** อ้างอิงขอบเขตจากเอกสารโครงงานที่ให้มา โดยรวมงานหลักของผู้ดูแลไว้ในแดชบอร์ดเดียว:

- สมัครสมาชิกและเข้าสู่ระบบด้วย Supabase Auth (JWT)
- Dashboard รายชื่อโปรไฟล์ผู้ป่วยและสถานะอุปกรณ์
- รายการแจ้งเตือน เช่น ออกจาก Geofence, เปิด/ถอดสายรัด, แบตเตอรี่ต่ำ และ BLE หลุด
- คำขออนุมัติกล่องยา: ตรวจว่าเจ้าของบัญชีถูกต้อง คำขอยังไม่หมดอายุ และมี `ble_verified = true` ก่อนอนุมัติ
- เพิ่มโปรไฟล์ผู้ป่วยสำหรับการทดสอบ
- Netlify Functions เป็น API layer และ Supabase Postgres เป็นฐานข้อมูล

> **สถานะ:** Research prototype / OCOP เท่านั้น ไม่ใช่อุปกรณ์การแพทย์ที่ผ่านการรับรอง และยังไม่ควรใช้กับข้อมูลผู้ป่วยจริงหรือให้กลอนยาจริงทำงานจนกว่าจะผ่านการทดสอบความปลอดภัย การประเมินความเสี่ยง และการตรวจสอบโดยผู้รับผิดชอบ


## ใช้งานแบบฟรี (ไม่ต้องสมัครแพ็กเกจเสียเงิน)

โปรเจกต์นี้ตั้งค่าให้ทดลองและพัฒนาบน Free tier ได้ โดยไม่ต้องซื้อโดเมนหรือสมัครบริการ Pro:

| ส่วนประกอบ | แพ็กเกจ/บริการ | หมายเหตุเรื่องค่าใช้จ่าย |
|---|---|---|
| เก็บโค้ด | GitHub Free | ใช้ repository แบบ Private ได้ |
| Frontend + API Functions | Netlify Free | ใช้ URL ฟรีรูปแบบ `ชื่อเว็บ.netlify.app`; มีโควตา 300 credits/เดือนตามเงื่อนไขปัจจุบัน เมื่อถึงขีดจำกัดเว็บอาจถูกพักจนรอบใหม่ ไม่จำเป็นต้องซื้อเครดิตเพิ่ม |
| Login + Database | Supabase Free | เหมาะกับ prototype; โควตาตามหน้าราคาปัจจุบันรวมฐานข้อมูล 500 MB ต่อโปรเจกต์และพื้นที่ไฟล์ 1 GB; โปรเจกต์ที่ไม่มีการใช้งานเพียงพออาจถูกพักหลังไม่มี activity ประมาณ 7 วัน |
| MQTT | **ยังไม่ต้องใช้ในเวอร์ชันแรก** | ตัวอย่างนี้ให้เว็บ/API ทำงานผ่าน HTTPS ก่อน จึงไม่ต้องสมัคร MQTT Broker แบบมีค่าใช้จ่ายเพื่อเริ่มทดลอง |

### วิธีหลีกเลี่ยงค่าใช้จ่ายโดยไม่ตั้งใจ

1. ใช้ Netlify subdomain ฟรี ไม่ต้องซื้อ custom domain ในช่วงทำโครงงาน
2. คงบัญชี Netlify ไว้ที่ Free และ **อย่าเปิดการซื้อเครดิตเพิ่ม/auto recharge** หากมีตัวเลือกดังกล่าว
3. คง Supabase Organization ไว้ที่ Free และอย่ากด Upgrade หรือเพิ่ม paid add-ons
4. ใช้ข้อมูลจำลองระหว่างพัฒนา จำกัดรูปภาพ/ไฟล์ที่อัปโหลด และตรวจการใช้งานจากหน้า Usage ของทั้งสองบริการเป็นระยะ
5. Free tier อาจพักแอปเมื่อโควตาหมดหรือพักโปรเจกต์เมื่อไม่มีการใช้งาน จึงเหมาะกับต้นแบบ OCOP/สาธิต ไม่ใช่การรับประกันระบบเฝ้าระวังผู้ป่วยแบบ 24/7
6. ห้ามนำข้อมูลสุขภาพจริงหรือข้อมูลระบุตัวผู้ป่วยใส่ในต้นแบบสาธิตโดยไม่ได้รับอนุญาตและจัดมาตรการคุ้มครองข้อมูลให้เหมาะสม

> ค่าโควตาและเงื่อนไข Free tier อาจเปลี่ยนได้ โปรดตรวจ [Netlify Pricing](https://www.netlify.com/pricing/) และ [Supabase Pricing](https://supabase.com/pricing) ก่อน Deploy ทุกครั้ง

## Technology stack

- Frontend: React + Vite + Tailwind CSS v4 + Lucide
- Authentication: Supabase Auth (JWT)
- Database: Supabase PostgreSQL + Row Level Security (RLS)
- Backend/API: Netlify Functions (Node.js / Fetch API handlers)
- Hosting/CI/CD: GitHub + Netlify
- Device bridge: `device-event` เป็น HTTPS endpoint สำหรับต้นแบบ; MQTT ต้องต่อผ่าน gateway/worker แยก ไม่ควรเปิด MQTT credentials ไว้ใน browser

## Folder structure

```text
geowrisx-web/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── .env.example
├── .gitignore
├── README.md
├── supabase/
│   └── setup.sql
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   └── lib/
│       ├── api.js
│       └── supabase.js
└── netlify/
    └── functions/
        ├── lib/http.mjs
        ├── dashboard.mjs
        ├── create-patient.mjs
        ├── approve-pillbox.mjs
        └── device-event.mjs
```

## 1. Create a Supabase project

1. ไปที่ [Supabase](https://supabase.com/) แล้วสร้าง Project ใหม่
2. เปิด **SQL Editor** และรันไฟล์ `supabase/setup.sql` ทั้งไฟล์
3. เปิด **Project Settings → API / Connect** แล้วคัดลอก Project URL และ Publishable key (โปรเจกต์รุ่นเก่าอาจแสดง `anon` key)
4. ไปที่ **Authentication → URL Configuration** แล้วใส่ URL สำหรับ Local และ Netlify ใน Site URL / Redirect URLs เช่น:
   - Local: `http://localhost:8888/**`
   - Production: `https://YOUR-SITE.netlify.app/**`
5. ตั้งค่า Email Confirmation ตามนโยบายของโครงงาน หากเปิดยืนยันอีเมล ผู้ใช้ต้องกดยืนยันจากอีเมลก่อนจึงเข้าสู่ระบบได้

### Environment variables สำหรับ Local

คัดลอก `.env.example` เป็น `.env` แล้วแก้ค่าตัวอย่างให้เป็นค่าจริง:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DEVICE_INGEST_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGIN=http://localhost:8888
```

- `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY` เป็นค่าที่ frontend ใช้ได้โดยตั้งใจ แต่ต้องเปิด RLS ตาม `setup.sql`
- `SUPABASE_SERVICE_ROLE_KEY` ใช้เฉพาะ Function `device-event` ฝั่งเซิร์ฟเวอร์เท่านั้น **ห้ามตั้งชื่อขึ้นต้น `VITE_` ห้ามใส่ใน React และห้าม commit ขึ้น GitHub**
- `DEVICE_INGEST_SECRET` ใช้สำหรับต้นแบบของอุปกรณ์เท่านั้น การใช้ shared secret ฝังใน firmware ไม่ใช่แนวทางเพียงพอสำหรับผลิตภัณฑ์จริง ควรเปลี่ยนเป็น credential แยกต่ออุปกรณ์พร้อม signature/replay protection

## 2. Install and run locally

ติดตั้ง Node.js 20+ (แนะนำ Node 22) จากนั้นในโฟลเดอร์โปรเจกต์:

```bash
npm install
npm run netlify:dev
```

เปิด `http://localhost:8888` เพื่อทดสอบทั้ง Vite frontend และ Netlify Functions ผ่าน URL เดียวกัน

คำสั่ง `npm run dev` ใช้พัฒนา UI อย่างเดียว; การเรียก API `/api/*` ให้ทดสอบผ่าน `npm run netlify:dev` เพราะเป็นตัวที่เปิด Netlify Functions ให้ด้วย

## 3. GitHub repository workflow

This web app lives in the existing repository `ChayapholPannak/GeoWrisX-AD`, under `geowrisx-web/`. **Do not create another repository just for this folder unless you intentionally want to split the project.**

- Keep source code and documentation in GitHub.
- Do not commit real `.env` files, service-role/secret keys, patient data, private email addresses or exact home coordinates.
- When changing files, review the diff in GitHub Desktop, commit the intended changes, and push to the existing `main` branch.
- If working from a new computer and there is no local copy yet, clone the existing repository once. Do not clone it again if an existing local working copy is already present.

## 4. Deploy to Netlify

Import the existing repository `ChayapholPannak/GeoWrisX-AD` in Netlify. Because this app is stored in the `geowrisx-web/` subdirectory, configure:

- **Base directory:** `geowrisx-web`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

Keep these values consistent with `geowrisx-web/netlify.toml`. Do not set the publish directory to the repository root.

In **Project configuration → Environment variables**, configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only; used by `device-event`)
- `DEVICE_INGEST_SECRET` (server-side only; used by `device-event`)
- `ALLOWED_ORIGIN` (the exact production origin, e.g. `https://YOUR-SITE.netlify.app`)

Never use a `VITE_` prefix for service-role or device-ingestion secrets. The site URL used for Supabase Auth email confirmation must also be configured under **Authentication → URL Configuration** in Supabase.

## 4. Deploy to Netlify

1. เข้าสู่ [Netlify](https://app.netlify.com/) แล้วเลือก **Add new site → Import an existing project**
2. เชื่อม GitHub และเลือก repository นี้
3. ค่า build ที่กำหนดใน `netlify.toml` คือ:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. ที่ **Site configuration → Environment variables** เพิ่มตัวแปร:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (ใช้สำหรับ `device-event` เท่านั้น)
   - `DEVICE_INGEST_SECRET` (ใช้สำหรับ `device-event` เท่านั้น)
   - `ALLOWED_ORIGIN` = URL ของ Netlify site เช่น `https://YOUR-SITE.netlify.app`
5. กำหนดให้ตัวแปรลับมีค่าเป็น Secret/Sensitive ตามที่ UI รองรับ และตรวจ Scope ให้ Netlify Functions อ่านตัวแปรฝั่ง server ได้
6. กด Deploy แล้วกลับไป Supabase → Authentication → URL Configuration เพื่อเพิ่ม URL จริงของเว็บไซต์ Netlify
7. ทดสอบสมัครผู้ใช้ใหม่, ยืนยันอีเมล (หากเปิดไว้), login, เพิ่มโปรไฟล์ และตรวจ Function logs เมื่อมีข้อผิดพลาด
8. ทุกครั้งที่แก้ Environment Variables ให้ trigger deploy ใหม่ เพื่อให้ build frontend และ Functions ใช้ค่าใหม่

## 5. Register devices for a test patient

แอปเริ่มจากเพิ่มโปรไฟล์ผู้ป่วยในหน้า Dashboard ก่อน จากนั้นต้อง provision `devices` สำหรับสายรัดและกล่องยา ตัวอย่าง SQL สำหรับการทดสอบเท่านั้น:

```sql
-- ตรวจสอบ patient id และ owner ก่อน
select id, owner_id, display_name from public.patients order by created_at desc;

-- ใช้ patient_id ที่ได้จากแถวผู้ป่วยทดสอบของคุณ
insert into public.devices (patient_id, device_type, device_name, status)
values
  ('PASTE-PATIENT-UUID-HERE', 'wristband', 'GeoWrisX WristBand (Test)', 'unknown'),
  ('PASTE-PATIENT-UUID-HERE', 'pillbox', 'GeoWrisX Pillbox (Test)', 'unknown');
```

อย่าใช้ UUID ตัวอย่างหรือข้อมูลผู้ป่วยจริงในการทดลองร่วมกันหลายคนโดยไม่ได้กำหนดสิทธิ์ให้ชัดเจน คำสั่งข้างต้นต้องรันโดยผู้ดูแลฐานข้อมูล ไม่ควรเปิดให้ผู้ใช้ทั่วไปสร้างอุปกรณ์แบบอิสระในระบบจริง

## 6. API routes

ทุก route ด้านล่างยกเว้น `device-event` ต้องส่ง Supabase access token ใน `Authorization: Bearer <access_token>`:

| Endpoint | Method | หน้าที่ |
|---|---|---|
| `/api/dashboard` | GET | อ่าน patients, devices, alerts, approvals, commands ของผู้ใช้ที่ล็อกอิน |
| `/api/create-patient` | POST | สร้างโปรไฟล์ผู้ป่วยของบัญชีปัจจุบัน |
| `/api/approve-pillbox` | POST | เรียก RPC ที่ตรวจเจ้าของคำขอ, pending state, เวลา expiry และ BLE proof ก่อนเพิ่มคำสั่งเข้าคิว |
| `/api/device-event` | POST | รับสถานะ/เหตุการณ์จาก hardware gateway สำหรับ prototype โดยใช้ `x-device-ingest-secret` |

ตัวอย่าง body สำหรับเพิ่มผู้ป่วย:

```json
{ "display_name": "ผู้ป่วยทดสอบ A" }
```

ตัวอย่าง body สำหรับอนุมัติ:

```json
{ "request_id": "UUID-OF-A-PENDING-REQUEST" }
```

ตัวอย่าง event จาก gateway (ใช้ UUID ของ device ที่ provision ไว้แล้ว):

```json
{
  "device_id": "UUID-OF-DEVICE",
  "event_type": "GEOFENCE_EXIT",
  "message": "ตรวจพบการออกนอกพื้นที่ทดสอบ"
}
```

Header ของ gateway: `x-device-ingest-secret: <DEVICE_INGEST_SECRET>`

สำหรับแจ้งสถานะแบตเตอรี่ ให้ส่ง `event_type: "DEVICE_STATUS"`, `status: "online"` หรือ `"offline"` และ `battery_percent` เป็นจำนวนเต็ม 0–100

สำหรับคำขอเปิดกล่องยา ส่ง `event_type: "PILLBOX_REQUEST"`, `compartment_no` 1–3 และ `ble_proximity_verified: true` **ได้ต่อเมื่อเฟิร์มแวร์กล่องยาตรวจ BLE ใกล้จริงด้วยตัวเองแล้วเท่านั้น** ห้ามให้หน้าเว็บเป็นผู้ตั้งค่า BLE proof

## 7. Security model and limitations

- Supabase Auth ใช้ JWT และจัดการ password hashing ให้ การสมัคร/ล็อกอินไม่เก็บรหัสผ่านเองในตารางของแอป และไม่ต้อง hash password ใน React
- RLS บังคับให้ caregiver อ่าน/เพิ่มได้เฉพาะ patient profiles ที่เป็นเจ้าของ; device records และ alerts ถูกจำกัดตาม patient owner
- ผู้ใช้ทั่วไปอ่าน device status/alerts/approvals ได้ แต่เขียนข้อมูล device, BLE proof และ command ไม่ได้โดยตรง
- `approve_pillbox_request` เป็น database function ที่ตรวจ `auth.uid()`, สถานะคำขอ, BLE proof และเวลา expiry ภายในการทำงานเดียว แล้วบันทึกคำสั่งที่มีอายุจำกัดลง `device_commands`
- **การอนุมัติบนเว็บไม่ได้เปิด Solenoid จริงโดยตัวมันเอง** ต้องพัฒนาตัวอ่าน command/MQTT gateway และ firmware ที่ตรวจ BLE proximity กับ expiry ซ้ำก่อนขับกลอน
- `device-event` เป็นช่องทาง prototype ที่ใช้ secret ร่วมเพื่อให้ทดสอบได้ง่าย ไม่เหมาะเป็นการพิสูจน์ตัวตนของอุปกรณ์จริงที่ติดตั้งกับผู้ป่วย ต้องใช้ credential ต่ออุปกรณ์, request signature, timestamp/nonce และ rate limiting ก่อนขึ้นระบบจริง
- ตั้ง CORS `ALLOWED_ORIGIN` เป็นเว็บไซต์จริง แทน `*` และเพิ่ม rate limiting / logging / backup / monitoring ตามความเสี่ยงของระบบ
- เริ่มทดสอบด้วยชื่อสมมติ หลีกเลี่ยงการเก็บพิกัด GPS ต่อเนื่องโดยไม่จำเป็น กำหนดอายุเก็บข้อมูลและขอความยินยอมก่อนนำข้อมูลผู้ป่วยมาใช้
- ระบบแจ้งเตือนนี้ไม่ใช่บริการฉุกเฉินและไม่รับประกันความปลอดภัยของผู้ป่วย ต้องมีช่องทางดูแลสำรองและวิธีเปิดกล่องยาอย่างปลอดภัยเมื่อไฟดับหรือระบบขัดข้อง

## 8. Recommended next steps

1. ตั้ง Supabase และทดสอบ login/RLS ก่อน
2. เพิ่มหน้า provision device สำหรับ Admin แทนการลงทะเบียนอุปกรณ์ด้วย SQL
3. เพิ่ม firmware integration: M5StickC Plus2 + GPS UART + Hall sensor + vibration motor
4. เพิ่ม gateway ที่เชื่อม MQTT กับฐานข้อมูล โดยไม่เปิด broker credentials ใน browser
5. เขียน test plan สำหรับ BLE lost/reconnect, command expiry, duplicate requests, battery low, device offline และ fallback manual unlock
6. ทำ threat model และทดสอบการแยกสิทธิ์ก่อนใช้กับผู้ใช้จริง
