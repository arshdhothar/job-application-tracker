from typing import Optional
from sqlmodel import Field, SQLModel

class JobBase(SQLModel):
    company: str
    role: str
    status: str = "Applied"
    location: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    date_applied: Optional[str] = None

class Job(JobBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class JobCreate(JobBase):
    pass

class JobUpdate(SQLModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    date_applied: Optional[str] = None