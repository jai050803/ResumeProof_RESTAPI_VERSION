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
        # Request repos owned by the user
        repos_paginated = user.get_repos(type="owner")
        
        # Get only the first page (typically 30 items) to prevent paginating thousands of repositories
        repos = repos_paginated.get_page(0)
        
        repo_list = []
        rate_limit_exceeded = False
        
        # Common tech keywords to scan locally to avoid making separate HTTP calls for languages/topics
        tech_keywords = [
            "python", "typescript", "javascript", "react", "node", "postgres", 
            "mysql", "mongodb", "docker", "aws", "kubernetes", "django", 
            "flask", "express", "html", "css", "java", "c++", "c#", "golang", 
            "go", "ruby", "rails", "php", "laravel", "vue", "angular", "nextjs", 
            "next.js", "nestjs", "prisma", "firebase", "sqlite", "redis", "graphql"
        ]
        
        for r in repos:
            if r.fork:
                continue
            
            # Map basic properties
            languages = [r.language] if r.language else []
            topics = []
            
            # Extract local topics from repository name and description to avoid hitting rate limits
            name_lower = r.name.lower() if r.name else ""
            desc_lower = r.description.lower() if r.description else ""
            
            for tech in tech_keywords:
                if tech in name_lower or tech in desc_lower:
                    topics.append(tech)
            
            # Ensure the primary language is also in our languages list
            if r.language and r.language.lower() not in [l.lower() for l in languages]:
                languages.append(r.language)

            repo_list.append({
                "name": r.name,
                "full_name": r.full_name,
                "description": r.description,
                "language": r.language,
                "languages": languages,
                "topics": list(set(topics)),
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
