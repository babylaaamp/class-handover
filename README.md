# Class Handover

ระบบช่วยบันทึกการสอนและส่งต่องานระหว่างครู พร้อม AI ช่วยวางแผนการสอน

## Features
- สมัครสมาชิกและเข้าสู่ระบบด้วย JWT
- Dashboard สรุปจำนวนนักเรียน ประวัติการสอน และงานส่งต่อค้าง
- จัดการข้อมูลนักเรียนและดูประวัติรายคน
- **บันทึกการสอนหลายคนพร้อมกัน**: เลือกนักเรียนหลายคน กรอกข้อมูลการสอนครั้งเดียว ระบบสร้างประวัติแยกรายคน
- **สร้าง handover หลายคนพร้อมกัน**: ใช้เนื้อหาส่งต่อร่วมกัน แต่ติดตามสถานะแต่ละคนแยกกัน
- AI ช่วยสร้างแผนการสอน ร่างบันทึกส่งต่อ และสรุปความคืบหน้า
- แสดงคำตอบ AI ด้วย Markdown headings, bullet lists, numbered steps และตัวหนา
- เก็บประวัติคำแนะนำ AI

## Tech stack
Next.js 14, React 18, FastAPI, PostgreSQL/SQLite, SQLAlchemy, JWT, Groq API

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=sqlite:///./class_handover.db
JWT_SECRET=replace-with-a-long-random-secret
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
FRONTEND_ORIGIN=http://localhost:3000
```

Run backend:
```bash
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run frontend:
```bash
npm run dev
```

## Bulk API
- `POST /sessions/bulk`: accepts `learner_ids` plus shared session fields.
- `POST /handovers/bulk`: accepts `learner_ids` plus shared handover fields.
- Both endpoints validate that every selected learner belongs to the signed-in user before saving. Writes are all-or-nothing.

## AI
`POST /advice` accepts `advice_type`:
- `teaching_plan`
- `handover_draft`
- `progress_summary`

AI output is requested in Thai Markdown and rendered as formatted text. Verify AI drafts before sharing or saving them as official student records. The app must have `GROQ_API_KEY` set on the backend.

## Deploy
- Render: Root Directory `backend`; Build `pip install -r requirements.txt`; Start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Set `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, and `FRONTEND_ORIGIN` in Render environment.
- Vercel: Root Directory `frontend`; set `NEXT_PUBLIC_API_URL` to the deployed backend URL.
- Set `FRONTEND_ORIGIN` to the deployed frontend URL, then redeploy backend.

## Security
Never commit `.env` or `.env.local`. Store secrets in deployment environment variables. AI uses only the signed-in user's learner records and should not be treated as a substitute for teacher review.
