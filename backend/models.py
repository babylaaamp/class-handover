from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Learner(Base):
    __tablename__ = "learners"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    course = Column(String(160), default="")
    level = Column(String(80), default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TeachingSession(Base):
    __tablename__ = "teaching_sessions"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    learner_id = Column(Integer, ForeignKey("learners.id"), nullable=False, index=True)
    session_date = Column(Date, nullable=False)
    topic = Column(String(240), nullable=False)
    content_covered = Column(Text, default="")
    progress = Column(String(80), default="กำลังพัฒนา")
    difficulties = Column(Text, default="")
    next_steps = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HandoverNote(Base):
    __tablename__ = "handover_notes"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    learner_id = Column(Integer, ForeignKey("learners.id"), nullable=False, index=True)
    title = Column(String(240), nullable=False)
    learner_stuck_on = Column(Text, default="")
    next_teacher_tasks = Column(Text, default="")
    assigned_to = Column(String(255), default="")
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdviceHistory(Base):
    __tablename__ = "advice_history"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    learner_id = Column(Integer, ForeignKey("learners.id"), nullable=True, index=True)
    prompt_summary = Column(Text, default="")
    advice = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
