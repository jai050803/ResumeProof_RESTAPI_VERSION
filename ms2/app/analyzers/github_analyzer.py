from datetime import datetime, timezone
from github import GithubException
from app.utils.github_client import get_authenticated_github_client
from app.utils.logger import get_logger

logger = get_logger("github_analyzer")

def verify_github_user_exists(username: str) -> dict:
    """
    Verifies if a GitHub user exists.
    Returns details if exists, or {'exists': False} if not.
    """
    g = get_authenticated_github_client()
    try:
        user = g.get_user(username)
        # Accessing an attribute triggers the API request
        _ = user.login 
        
        created_at = user.created_at
        account_age_days = (datetime.now(timezone.utc) - created_at.replace(tzinfo=timezone.utc)).days
        
        return {
            "exists": True,
            "username": user.login,
            "name": user.name,
            "email": user.email,
            "created_at": created_at.isoformat(),
            "public_repos": user.public_repos,
            "followers": user.followers,
            "account_age_days": account_age_days
        }
    except GithubException as e:
        if e.status == 404:
            return {"exists": False}
        logger.error(f"GitHub API error verifying user {username}: {e}")
        raise e

def fetch_public_repos(username: str, max_repos: int = 50) -> list:
    """
    Fetches non-forked public repositories owned by the user.
    Limits to the top `max_repos` recently pushed repos to avoid rate limits.
    """
    g = get_authenticated_github_client()
    try:
        user = g.get_user(username)
        # Sort by pushed to get active repos first
        repos = user.get_repos(type="owner", sort="pushed", direction="desc")
        repo_list = []
        for r in repos:
            if len(repo_list) >= max_repos:
                break
                
            if r.fork:
                continue
            
            # Use primary language to save API calls instead of get_languages()
            languages = [r.language] if r.language else []
            
            # Only get topics if not likely to hit rate limit, or just skip it for speed.
            # To be safe and fast, we'll try to get topics but ignore errors.
            try:
                topics = r.get_topics()
            except Exception:
                topics = []

            repo_list.append({
                "name": r.name,
                "full_name": r.full_name,
                "description": r.description,
                "language": r.language,
                "languages": languages,
                "topics": topics,
                "created_at": r.created_at.isoformat(),
                "pushed_at": r.pushed_at.isoformat() if r.pushed_at else None,
                "size_kb": r.size,
                "stars": r.stargazers_count,
                "is_fork": False
            })
        return repo_list
    except GithubException as e:
        logger.error(f"GitHub API error fetching repos for user {username}: {e}")
        raise e

def analyze_account_health(profile) -> dict:
    """
    Analyzes holistic account health and checks GitHub rate limit parameters.
    Accepts a username string or a dictionary containing username.
    """
    g = get_authenticated_github_client()
    username = profile if isinstance(profile, str) else profile.get("username")
    if not username:
        raise ValueError("A valid username or profile dict must be provided to analyze_account_health")

    try:
        try:
            rate_limit = g.get_rate_limit()
            core_rate = getattr(rate_limit, 'core', getattr(rate_limit, 'rate', None))
            remaining = core_rate.remaining if core_rate else 0
            limit = core_rate.limit if core_rate else 0
            reset = core_rate.reset.isoformat() if core_rate and core_rate.reset else None
        except Exception:
            remaining = limit = 0
            reset = None
            
        user = g.get_user(username)
        created_at = user.created_at
        account_age_days = (datetime.now(timezone.utc) - created_at.replace(tzinfo=timezone.utc)).days
        
        health_score = 100
        flags = []
        
        if account_age_days < 60:
            health_score -= 30
            flags.append("account_too_new")
        elif account_age_days < 180:
            health_score -= 10
            flags.append("account_relatively_new")
            
        if user.public_repos == 0:
            health_score -= 20
            flags.append("no_public_repos")
            
        return {
            "health_score": max(0, health_score),
            "flags": flags,
            "rate_limit_remaining": remaining,
            "rate_limit_limit": limit,
            "rate_limit_reset": reset
        }
    except GithubException as e:
        logger.error(f"GitHub API error in account health for user {username}: {e}")
        raise e
