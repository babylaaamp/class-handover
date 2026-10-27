import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import Base, engine, get_db
import models, schemas
from auth_utils import hash_password, verify_password, create_access_token, get_current_user

load_dotenv()
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Class Handover API")
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").rstrip("/")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({frontend_origin, "http://localhost:3000"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "Class Handover API is running"}

@app.post("/auth/register", response_model=schemas.TokenOut)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(409, "Email already registered")
    user = models.User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"access_token": create_access_token(user.id)}

@app.post("/auth/login", response_model=schemas.TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_access_token(user.id)}

def owned_learner(db, learner_id, user_id):
    learner = db.query(models.Learner).filter_by(id=learner_id, owner_id=user_id).first()
    if not learner:
        raise HTTPException(404, "Learner not found")
    return learner

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {
        "learners": db.query(models.Learner).filter_by(owner_id=user.id).count(),
        "sessions": db.query(models.TeachingSession).filter_by(owner_id=user.id).count(),
        "pending_handovers": db.query(models.HandoverNote).filter_by(owner_id=user.id, is_completed=False).count(),
    }

@app.get("/learners", response_model=list[schemas.LearnerOut])
def list_learners(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Learner).filter_by(owner_id=user.id).order_by(desc(models.Learner.created_at)).all()

@app.post("/learners", response_model=schemas.LearnerOut)
def add_learner(payload: schemas.LearnerIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    row = models.Learner(owner_id=user.id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return row

@app.get("/sessions")
def list_sessions(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.TeachingSession).filter_by(owner_id=user.id).order_by(desc(models.TeachingSession.session_date)).all()
    return [{
        "id": x.id, "learner_id": x.learner_id, "learner_name": owned_learner(db, x.learner_id, user.id).name,
        "session_date": x.session_date.isoformat(), "topic": x.topic, "content_covered": x.content_covered,
        "progress": x.progress, "difficulties": x.difficulties, "next_steps": x.next_steps
    } for x in rows]

@app.post("/sessions")
def add_session(payload: schemas.SessionIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    owned_learner(db, payload.learner_id, user.id)
    row = models.TeachingSession(owner_id=user.id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {
        "id": row.id, "learner_id": row.learner_id, "learner_name": owned_learner(db, row.learner_id, user.id).name,
        "session_date": row.session_date.isoformat(), "topic": row.topic, "content_covered": row.content_covered,
        "progress": row.progress, "difficulties": row.difficulties, "next_steps": row.next_steps
    }

@app.get("/handovers")
def list_handovers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.HandoverNote).filter_by(owner_id=user.id).order_by(desc(models.HandoverNote.created_at)).all()
    return [{
        "id": x.id, "learner_id": x.learner_id, "learner_name": owned_learner(db, x.learner_id, user.id).name,
        "title": x.title, "learner_stuck_on": x.learner_stuck_on, "next_teacher_tasks": x.next_teacher_tasks,
        "assigned_to": x.assigned_to, "is_completed": x.is_completed, "created_at": x.created_at
    } for x in rows]

@app.post("/handovers")
def add_handover(payload: schemas.HandoverIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    owned_learner(db, payload.learner_id, user.id)
    row = models.HandoverNote(owner_id=user.id, **payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return {
        "id": row.id, "learner_id": row.learner_id, "learner_name": owned_learner(db, row.learner_id, user.id).name,
        "title": row.title, "learner_stuck_on": row.learner_stuck_on, "next_teacher_tasks": row.next_teacher_tasks,
        "assigned_to": row.assigned_to, "is_completed": row.is_completed, "created_at": row.created_at
    }

@app.patch("/handovers/{handover_id}")
def update_handover(handover_id: int, payload: schemas.HandoverUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    row = db.query(models.HandoverNote).filter_by(id=handover_id, owner_id=user.id).first()
    if not row:
        raise HTTPException(404, "Handover not found")
    row.is_completed = payload.is_completed
    db.commit()
    return {"status": "ok", "is_completed": row.is_completed}

@app.get("/learners/{learner_id}/history")
def learner_history(learner_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    learner = owned_learner(db, learner_id, user.id)
    sessions = db.query(models.TeachingSession).filter_by(owner_id=user.id, learner_id=learner_id).order_by(desc(models.TeachingSession.session_date)).all()
    handovers = db.query(models.HandoverNote).filter_by(owner_id=user.id, learner_id=learner_id).order_by(desc(models.HandoverNote.created_at)).all()
    return {
        "learner": {"id": learner.id, "name": learner.name, "course": learner.course, "level": learner.level, "notes": learner.notes},
        "sessions": [{"id": x.id, "session_date": x.session_date.isoformat(), "topic": x.topic, "content_covered": x.content_covered, "progress": x.progress, "difficulties": x.difficulties, "next_steps": x.next_steps} for x in sessions],
        "handovers": [{"id": x.id, "title": x.title, "learner_stuck_on": x.learner_stuck_on, "next_teacher_tasks": x.next_teacher_tasks, "assigned_to": x.assigned_to, "is_completed": x.is_completed} for x in handovers],
    }

@app.get("/advice", response_model=list[schemas.AdviceOut])
def list_advice(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.AdviceHistory).filter_by(owner_id=user.id).order_by(desc(models.AdviceHistory.created_at)).all()

@app.post("/advice", response_model=schemas.AdviceOut)
def create_advice(payload: schemas.AdviceIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise HTTPException(503, "GROQ_API_KEY is not configured")
    learner = owned_learner(db, payload.learner_id, user.id) if payload.learner_id else None
    sessions = db.query(models.TeachingSession).filter_by(owner_id=user.id, learner_id=learner.id).order_by(desc(models.TeachingSession.session_date)).limit(8).all() if learner else []
    handovers = db.query(models.HandoverNote).filter_by(owner_id=user.id, learner_id=learner.id).order_by(desc(models.HandoverNote.created_at)).limit(8).all() if learner else []
    context = f"ผู้เรียน: {learner.name if learner else 'ไม่ได้เลือก'}; คอร์ส: {learner.course if learner else '-'}; ระดับ: {learner.level if learner else '-'}\n"
    context += "\n".join([f"{x.session_date} หัวข้อ={x.topic}; ความคืบหน้า={x.progress}; จุดติด={x.difficulties}; ขั้นต่อไป={x.next_steps}" for x in sessions]) or "ยังไม่มีประวัติการสอน"
    context += "\nHandover:\n" + ("\n".join([f"{x.title}; จุดติด={x.learner_stuck_on}; งานถัดไป={x.next_teacher_tasks}; เสร็จ={x.is_completed}" for x in handovers]) or "ยังไม่มีบันทึกส่งต่อ")
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": "openai/gpt-oss-20b", "messages": [
                {"role": "system", "content": "คุณเป็นผู้ช่วยครู ตอบภาษาไทย ใช้เฉพาะข้อมูลที่ได้รับ ห้ามแต่งข้อมูลผู้เรียน หากข้อมูลไม่พอให้บอกว่าข้อมูลไม่พอ เสนอขั้นตอนสอนที่ทำได้จริง ห้ามวินิจฉัยสุขภาพหรือสภาพจิตใจ"},
                {"role": "user", "content": f"คำถาม: {payload.question}\nข้อมูลผู้เรียน: {context}\nเสนอสิ่งที่ควรทบทวน วิธีสอนครั้งถัดไป งานติดตาม และคำถามที่ควรถามผู้เรียน"}
            ], "temperature": 0.3},
            timeout=45,
        )
        if response.status_code >= 400:
            raise HTTPException(502, "AI provider error: " + response.text[:300])
        answer = response.json()["choices"][0]["message"]["content"]
    except requests.RequestException:
        raise HTTPException(502, "AI service unavailable")
    row = models.AdviceHistory(owner_id=user.id, learner_id=learner.id if learner else None, prompt_summary=payload.question, advice=answer)
    db.add(row); db.commit(); db.refresh(row)
    return row
