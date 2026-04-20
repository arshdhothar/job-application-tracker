from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, engine
from models import Job, JobCreate, JobUpdate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/jobs")
def get_jobs():
    with Session(engine) as session:
        jobs = session.exec(select(Job)).all()
        return jobs

@app.post("/jobs")
def create_job(job: JobCreate):
    with Session(engine) as session:
        db_job = Job.from_orm(job)
        session.add(db_job)
        session.commit()
        session.refresh(db_job)
        return db_job

@app.patch("/jobs/{job_id}")
def update_job(job_id: int, job: JobUpdate):
    with Session(engine) as session:
        db_job = session.get(Job, job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        job_data = job.dict(exclude_unset=True)
        for key, value in job_data.items():
            setattr(db_job, key, value)
        session.add(db_job)
        session.commit()
        session.refresh(db_job)
        return db_job

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int):
    with Session(engine) as session:
        db_job = session.get(Job, job_id)
        if not db_job:
            raise HTTPException(status_code=404, detail="Job not found")
        session.delete(db_job)
        session.commit()
        return {"ok": True}