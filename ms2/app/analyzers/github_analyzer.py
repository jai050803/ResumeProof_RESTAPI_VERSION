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

def fetch_public_repos(username: str) -> list:
    """
    Fetches non-forked public repositories owned by the user.
    Uses rate-limit fallback protection. Limits fetching to the first page (max 100 repos) to avoid hanging.
    """
    g = get_authenticated_github_client()
    try:
        user = g.get_user(username)
        # Request up to 100 items per page
        repos_paginated = user.get_repos(type="owner", per_page=100)
        
        # Get only the first page to prevent paginating thousands of repositories and blocking/sleeping
        repos = repos_paginated.get_page(0)
        
        repo_list = []
        rate_limit_exceeded = False
        
        for r in repos:
            if r.fork:
                continue
            
            languages = []
            topics = []
            
            if not rate_limit_exceeded:
                # Fetch languages
                try:
                    languages = list(r.get_languages().keys())
                except GithubException as ge:
                    if ge.status == 403:
                        logger.warning(f"GitHub Rate Limit hit while fetching languages for {r.name}. Falling back to default properties.")
                        rate_limit_exceeded = True
                    languages = [r.language] if r.language else []
                except Exception:
                    languages = [r.language] if r.language else []
                
                # Fetch topics
                if not rate_limit_exceeded:
                    try:
                        topics = r.get_topics()
                    except GithubException as ge:
                        if ge.status == 403:
                            logger.warning(f"GitHub Rate Limit hit while fetching topics for {r.name}. Falling back to empty topics.")
                            rate_limit_exceeded = True
                        topics = []
                    except Exception:
                        topics = []
            else:
                # Rate limit exceeded fallback
                languages = [r.language] if r.language else []
                topics = []

            repo_list.append({
                "name": r.name,
                "full_name": r.full_name,
                "description": r.description,
                "language": r.language,
                "languages": languages,
                "topics": topics,
                "created_at": r.created_at.isoformat(),
                "pushed_at": r.pushed_at.isoformat(),
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
        rate_limit = g.get_rate_limit()
        core_rate = rate_limit.core
        
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
            "rate_limit_remaining": core_rate.remaining,
            "rate_limit_limit": core_rate.limit,
            "rate_limit_reset": core_rate.reset.isoformat() if core_rate.reset else None
        }
    except GithubException as e:
        logger.error(f"GitHub API error in account health for user {username}: {e}")
        raise e
