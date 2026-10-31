# คู่มือ Deploy แบบฟรีสำหรับ GeoWrisX AD

## ใช้บริการอะไรบ้าง
- GitHub Free: เก็บโค้ดใน repository (Private ได้)
- Cloudflare Pages: โฮสต์ React/Vite และ Pages Functions ใช้โดเมน `*.pages.dev`
- Supabase Free: Auth และ PostgreSQL
- ไม่ใช้ paid database, paid domain, หรือ MQTT broker ในรุ่นแรก

## ขั้นตอน
1. สร้าง Supabase project โดยเลือก Free plan แล้วรัน `supabase/setup.sql` ใน SQL Editor
2. สร้าง GitHub repository แบบ Private แล้ว push โค้ด โดยไม่ commit `.env`
3. ที่ Cloudflare Workers & Pages เลือก Create application → Pages → Import an existing Git repository
4. ใช้ Root directory `geowrisx-web`, build command `npm run build`, output directory `dist`; ดูรายละเอียดใน `CLOUDFLARE.md`
5. ตั้ง Variables และ encrypted Secrets ตาม `.env.example` ใน Cloudflare โดยตั้ง `SUPABASE_SERVICE_ROLE_KEY` และ `DEVICE_INGEST_SECRET` เฉพาะฝั่ง Functions ห้ามใส่ `VITE_` หรือ commit ลง GitHub
6. เพิ่ม URL `https://ชื่อเว็บ.pages.dev` ใน Supabase Authentication URL Configuration / Redirect URLs
7. Deploy และทดสอบสมัครบัญชี, login, เพิ่มผู้ป่วยทดสอบ และสิทธิ์ RLS

## ข้อจำกัดของ Free tier
- ตรวจโควตา Cloudflare Pages และ Workers ของแผนที่เลือกก่อนเปิดใช้งานจริง
- Supabase Free มีโควตาฐานข้อมูลและพื้นที่จัดเก็บจำกัด และโปรเจกต์ที่ไม่มี activity เพียงพออาจถูก pause หลังประมาณ 7 วัน
- จึงเหมาะกับงานพัฒนาต้นแบบ/สาธิต ไม่ควรใช้เป็นระบบติดตามหรือกล่องยาที่ต้องพึ่งพาได้ตลอดเวลาโดยไม่มีการเฝ้าระวังสำรอง
- MQTT ยังไม่ได้ติดตั้งในรุ่นนี้: ให้เริ่มจาก HTTPS API ก่อน แล้วค่อยเลือก broker หลังทดสอบความต้องการจริง โดยต้องไม่ฝัง credential ใน browser
- ใช้ข้อมูลสมมติสำหรับ demo อย่าป้อนข้อมูลสุขภาพหรือพิกัดที่ระบุตัวบุคคลได้ลงระบบทดสอบ

## ลิงก์ทางการ
- Cloudflare Pages: https://www.cloudflare.com/developer-platform/products/pages/
- Supabase pricing: https://supabase.com/pricing
- GitHub plans: https://github.com/pricing
