from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LearnerIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    course: str = ""
    level: str = ""
    notes: str = ""

class LearnerOut(LearnerIn):
    id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class SessionIn(BaseModel):
    learner_id: int
    session_date: date
    topic: str = Field(min_length=1, max_length=240)
    content_covered: str = ""
    progress: str = "กำลังพัฒนา"
    difficulties: str = ""
    next_steps: str = ""

class HandoverIn(BaseModel):
    learner_id: int
    title: str = Field(min_length=1, max_length=240)
    learner_stuck_on: str = ""
    next_teacher_tasks: str = ""
    assigned_to: str = ""

class HandoverUpdate(BaseModel):
    is_completed: bool

class AdviceIn(BaseModel):
    learner_id: Optional[int] = None
    question: str = "ช่วยแนะนำสิ่งที่ควรทบทวนและกิจกรรมการสอนครั้งถัดไป"

class AdviceOut(BaseModel):
    id: int
    learner_id: Optional[int] = None
    prompt_summary: str
    advice: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
