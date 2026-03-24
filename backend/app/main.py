import asyncio
from fastapi import FastAPI
from app.api.routes import router
from app.hardware.serial_reader import serial_reader_task

app = FastAPI(title="Numonautas Backend")

app.include_router(router)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(serial_reader_task())
