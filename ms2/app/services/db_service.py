import httpx
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("db_service")

def _get_headers():
    return {
        "Content-Type": "application/json",
        "X-Internal-Secret": settings.internal_secret
    }

def get_transaction_details(transaction_id: str) -> dict:
    """
    Fetches the transaction details (githubUrl, resumeText, jdText, clientId) from MS1.
    """
    url = f"{settings.ms1_internal_url}/internal/transaction/{transaction_id}"
    logger.info(f"Fetching transaction details from MS1: {url}")
    try:
        response = httpx.get(url, headers=_get_headers(), timeout=10.0)
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch transaction details from MS1: {response.text}")
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching transaction details from MS1: {e}")
        raise e

def write_verification_result(transaction_id: str, result: dict) -> str:
    """
    Placeholder/stub in MS2 since writing results is handled by MS1's /internal/result handoff.
    """
    logger.info(f"write_verification_result called for {transaction_id}. The handoff step will persist this to Postgres.")
    return transaction_id

def update_transaction_status(transaction_id: str, status: str, completed: bool = False):
    """
    Updates the transaction status in MS1.
    """
    url = f"{settings.ms1_internal_url}/internal/status"
    payload = {
        "transactionId": transaction_id,
        "status": status
    }
    logger.info(f"Updating transaction status to {status} via MS1 internal route...")
    try:
        response = httpx.post(url, json=payload, headers=_get_headers(), timeout=10.0)
        if response.status_code != 200:
            logger.error(f"MS1 rejected transaction status update: {response.text}")
    except Exception as e:
        logger.error(f"Failed to update transaction status via MS1: {e}")

def update_job_record(transaction_id: str, status: str, error_message: str = None, active: bool = False):
    """
    Updates the job execution state in MS1.
    """
    url = f"{settings.ms1_internal_url}/internal/status"
    payload = {
        "transactionId": transaction_id,
        "status": status,
        "errorMessage": error_message
    }
    logger.info(f"Updating job status to {status} via MS1 internal route...")
    try:
        response = httpx.post(url, json=payload, headers=_get_headers(), timeout=10.0)
        if response.status_code != 200:
            logger.error(f"MS1 rejected job status update: {response.text}")
    except Exception as e:
        logger.error(f"Failed to update job status via MS1: {e}")
