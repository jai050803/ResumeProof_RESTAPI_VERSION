import asyncio
from bullmq import Worker, Job
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("job_consumer")

async def process_single_job(job: Job, token: str):
    try:
        logger.info(f"Received job ID: {job.id}, Name: {job.name}")
        logger.info(f"Job payload data: {job.data}")
    except Exception as e:
        logger.error(f"Error logging job {job.id}: {e}")
        raise e

async def start_consumer():
    logger.info("Initializing BullMQ job consumer worker...")
    try:
        # Connects to the same Redis instance and queue name ('verification-queue')
        worker = Worker(
            "verification-queue",
            process_single_job,
            {
                "connection": settings.redis_url,
                "concurrency": 1
            }
        )
        logger.info("BullMQ job consumer worker started.")
        
        # Keep worker running
        try:
            while True:
                await asyncio.sleep(3600)
        except asyncio.CancelledError:
            logger.info("BullMQ job consumer task cancelled.")
        finally:
            await worker.close()
            logger.info("BullMQ job consumer worker closed.")
    except Exception as e:
        logger.error(f"Failed to run BullMQ job consumer: {e}")
        raise e
