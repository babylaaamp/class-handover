# Class Handover — MVP

ระบบส่งต่องานระหว่างผู้สอน สำหรับโรงเรียนกวดวิชา/สถาบันภาษา

## Features
- สมัครสมาชิก / เข้าสู่ระบบด้วย JWT
- Dashboard สรุปนักเรียน บันทึกการสอน และงานส่งต่อค้าง
- จัดการข้อมูลนักเรียน
- บันทึก Teaching Sessions
- สร้าง Handover Notes และติดตามสถานะ
- ดูประวัติการเรียนรายคน
- ขอคำแนะนำจาก AI โดยใช้ข้อมูลที่บันทึก และเก็บประวัติคำแนะนำ

## Tech stack
Next.js 14, FastAPI, PostgreSQL (Neon), SQLAlchemy, JWT, Groq API, Vercel, Render

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```
ตั้งค่า `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `FRONTEND_ORIGIN` ใน `backend/.env`.

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
ตั้ง `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`.

## Deploy
- Render: Root Directory `backend`; Build `pip install -r requirements.txt`; Start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Render environment: `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `FRONTEND_ORIGIN`.
- Vercel: Root Directory `frontend`; Environment Variable `NEXT_PUBLIC_API_URL` = Render backend URL.
- ใส่ URL ของ Vercel ใน Render `FRONTEND_ORIGIN` แล้ว redeploy.

## Demo flow
Register → Add Student → Record Session → Create Handover → Ask AI → View advice history.

## Security
ห้าม commit `.env` หรือ `.env.local`; ใช้ environment variables ของ Render/Vercel แทน.
