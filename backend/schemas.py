from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field, model_validator


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


class SessionFields(BaseModel):
    session_date: date
    topic: str = Field(min_length=1, max_length=240)
    content_covered: str = ""
    progress: str = "กำลังพัฒนา"
    difficulties: str = ""
    next_steps: str = ""


class SessionIn(SessionFields):
    learner_id: int


class SessionBulkIn(SessionFields):
    learner_ids: list[int] = Field(min_length=1, max_length=200)

    @model_validator(mode="after")
    def unique_learner_ids(self):
        if len(set(self.learner_ids)) != len(self.learner_ids):
            raise ValueError("learner_ids must be unique")
        return self


class HandoverFields(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    learner_stuck_on: str = ""
    next_teacher_tasks: str = ""
    assigned_to: str = ""


class HandoverIn(HandoverFields):
    learner_id: int


class HandoverBulkIn(HandoverFields):
    learner_ids: list[int] = Field(min_length=1, max_length=200)

    @model_validator(mode="after")
    def unique_learner_ids(self):
        if len(set(self.learner_ids)) != len(self.learner_ids):
            raise ValueError("learner_ids must be unique")
        return self


class HandoverUpdate(BaseModel):
    is_completed: bool


class AdviceIn(BaseModel):
    learner_id: Optional[int] = None
    question: str = Field(default="ช่วยแนะนำสิ่งที่ควรทบทวนและกิจกรรมการสอนครั้งถัดไป", max_length=4000)
    advice_type: str = Field(default="teaching_plan", pattern="^(teaching_plan|handover_draft|progress_summary)$")


class AdviceOut(BaseModel):
    id: int
    learner_id: Optional[int] = None
    prompt_summary: str
    advice: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
