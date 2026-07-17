from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

from app.analyzers import github_analyzer
from app.analyzers import project_matcher
from app.analyzers import commit_analyzer
from app.analyzers import ai_analyzer
from app.analyzers import score_calculator
from app.utils.logger import get_logger

logger = get_logger("verification_orchestrator")

# Define the State representing the graph context
class AgentState(TypedDict):
    # Inputs
    transaction_id: str
    github_url: str
    resume_text: str
    jd_text: str
    client_id: str
    
    # GitHub Data Node Outputs
    github_user_exists: bool
    github_user_data: Dict[str, Any]
    github_repos: List[Dict[str, Any]]
    claimed_projects: List[Dict[str, Any]]
    project_matches: List[Dict[str, Any]]
    authorship_results: List[Dict[str, Any]]
    account_health: Dict[str, Any]
    
    # AI Analysis Node Outputs
    ai_alignment: Dict[str, Any]
    
    # Score Calculation Node Outputs
    confidence_score: int
    status: str
    flags: List[Dict[str, Any]]
    
    # Final Result Assembled
    final_result: Dict[str, Any]


def fetch_github_data_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 1: Extract username, check if exists, fetch repos, parse projects, match, and check authorship.
    """
    github_url = state.get("github_url", "")
    resume_text = state.get("resume_text", "")
    
    logger.info(f"Starting fetch_github_data_node for URL: {github_url}")
    
    # Clean username from URL
    try:
        username = github_url.rstrip("/").split("/")[-1]
    except Exception:
        logger.error(f"Failed to parse username from URL: {github_url}")
        return {"github_user_exists": False}
        
    # Check user existence
    user_details = github_analyzer.verify_github_user_exists(username)
    if not user_details.get("exists"):
        logger.warn(f"GitHub user {username} does not exist.")
        return {
            "github_user_exists": False,
            "github_user_data": {},
            "github_repos": [],
            "claimed_projects": [],
            "project_matches": [],
            "authorship_results": [],
            "account_health": {"health_score": 0, "flags": ["github_user_not_found"]}
        }
        
    # User exists, proceed to load data
    logger.info(f"User {username} exists. Fetching repos...")
    repos = github_analyzer.fetch_public_repos(username)
    
    # Fetch account-level health metrics
    account_health = github_analyzer.analyze_account_health(username)
    
    # Extract claimed projects from resume using AI (called inside this node to match)
    logger.info("Extracting claimed projects from resume text...")
    claimed_projects = ai_analyzer.extract_projects_with_ai(resume_text)
    
    # Perform fuzzy project matching
    logger.info("Matching claimed projects to public repositories...")
    project_matches = project_matcher.match_projects_to_repos(claimed_projects, repos)
    
    # Perform commit authorship analysis for matched repos
    logger.info("Performing commit authorship checks...")
    authorship_results = []
    for match in project_matches:
        repo_name = match.get("matched_repo")
        if repo_name:
            # Reconstruct full repo name (owner/repo_name)
            repo_full_name = f"{username}/{repo_name}"
            auth_res = commit_analyzer.check_commit_authorship(repo_full_name, username)
            authorship_results.append({
                "repo_name": repo_name,
                **auth_res
            })
            
    return {
        "github_user_exists": True,
        "github_user_data": user_details,
        "github_repos": repos,
        "claimed_projects": claimed_projects,
        "project_matches": project_matches,
        "authorship_results": authorship_results,
        "account_health": account_health
    }


def ai_analysis_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 2: Evaluate skill alignment using Groq AI analyzer.
    """
    if not state.get("github_user_exists"):
        logger.info("Skipping ai_analysis_node because GitHub user does not exist.")
        return {"ai_alignment": {}}
        
    resume_text = state.get("resume_text", "")
    jd_text = state.get("jd_text", "")
    repos = state.get("github_repos", [])
    
    # Get all unique languages/topics from their repositories as initial matched skills
    matched_skills = []
    for r in repos:
        if r.get("language"):
            matched_skills.append(r["language"])
        matched_skills.extend(r.get("languages", []))
        matched_skills.extend(r.get("topics", []))
    matched_skills = list(set([s for s in matched_skills if s]))
    
    logger.info("Starting ai_analysis_node for skill alignment...")
    ai_alignment = ai_analyzer.analyze_skill_alignment(resume_text, jd_text, matched_skills)
    
    return {"ai_alignment": ai_alignment}


def score_calculation_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 3: Compute final confidence score and compile warning flags.
    """
    if not state.get("github_user_exists"):
        logger.info("Computing zero score in score_calculation_node (User does not exist).")
        return {
            "confidence_score": 0,
            "status": "rejected",
            "flags": [
                {
                    "type": "error",
                    "message": "GitHub username not found.",
                    "severity": "high"
                }
            ]
        }
        
    logger.info("Starting score_calculation_node...")
    score_res = score_calculator.compute_confidence_score(
        github_result=state.get("github_user_data", {}),
        project_matches=state.get("project_matches", []),
        authorship_results=state.get("authorship_results", []),
        skill_alignment=state.get("ai_alignment", {}),
        account_health=state.get("account_health", {})
    )
    
    return {
        "confidence_score": score_res.get("confidence_score", 0),
        "status": score_res.get("status", "flagged"),
        "flags": score_res.get("flags", [])
    }


def build_final_result_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 4: Assemble graph outputs, persist result to postgres, handoff to MS1, and update job status.
    """
    logger.info("Starting build_final_result_node...")
    
    transaction_id = state.get("transaction_id")
    client_id = state.get("client_id")
    github_user_exists = state.get("github_user_exists", False)
    
    if not github_user_exists:
        github_url_str = state.get("github_url") or ""
        final_result = {
            "transactionId": transaction_id,
            "status": "rejected",
            "confidenceScore": 0,
            "github": {
                "username": github_url_str.rstrip("/").split("/")[-1] if github_url_str else "",
                "exists": False,
                "reposFound": 0,
                "claimedProjects": 0,
                "verifiedProjects": 0,
                "projectMatches": [],
                "commitAuthorship": False,
                "accountHealth": 0
            },
            "skillAlignment": 0,
            "matchedSkills": [],
            "missingSkills": [],
            "flags": state.get("flags", [])
        }
    else:
        github_user_data = state.get("github_user_data", {})
        project_matches = state.get("project_matches", [])
        ai_alignment = state.get("ai_alignment", {})
        account_health = state.get("account_health", {})
        
        verified_projects_count = sum(1 for m in project_matches if m.get("matched_repo") is not None)
        
        has_authorship = False
        for r in state.get("authorship_results", []):
            if r.get("is_author"):
                has_authorship = True
                break
                
        final_result = {
            "transactionId": transaction_id,
            "status": state.get("status", "flagged"),
            "confidenceScore": state.get("confidence_score", 0),
            "github": {
                "username": github_user_data.get("username"),
                "exists": True,
                "reposFound": len(state.get("github_repos", [])),
                "claimedProjects": len(project_matches),
                "verifiedProjects": verified_projects_count,
                "projectMatches": project_matches,
                "commitAuthorship": has_authorship,
                "accountHealth": account_health.get("health_score", 0)
            },
            "skillAlignment": ai_alignment.get("score", 0),
            "matchedSkills": ai_alignment.get("matched_skills", []),
            "missingSkills": ai_alignment.get("missing_skills", []),
            "flags": state.get("flags", [])
        }
    
    try:
        from app.services import db_service
        from app.services import webhook_dispatcher
        
        # 1. Write the verification result
        db_service.write_verification_result(transaction_id, final_result)
        
        # 2. Update the transaction status to done / rejected / flagged
        db_service.update_transaction_status(transaction_id, final_result["status"], completed=True)
        
        # 3. Call MS1 to trigger webhook dispatcher
        webhook_dispatcher.dispatch_webhook_to_client(transaction_id, client_id, final_result)
        
        # 4. Update job record status to done
        db_service.update_job_record(transaction_id, "done")
    except Exception as e:
        logger.error(f"Failed to persist result or handoff to MS1: {e}")
        try:
            from app.services import db_service
            db_service.update_job_record(transaction_id, "failed", error_message=str(e))
            db_service.update_transaction_status(transaction_id, "failed")
        except Exception as db_err:
            logger.error(f"Failed to write failure status to DB: {db_err}")
        raise e
        
    return {"final_result": final_result}


# Build and compile the LangGraph StateGraph workflow
workflow = StateGraph(AgentState)

workflow.add_node("fetch_github_data", fetch_github_data_node)
workflow.add_node("ai_analysis", ai_analysis_node)
workflow.add_node("score_calculation", score_calculation_node)
workflow.add_node("build_final_result", build_final_result_node)

workflow.set_entry_point("fetch_github_data")
workflow.add_edge("fetch_github_data", "ai_analysis")
workflow.add_edge("ai_analysis", "score_calculation")
workflow.add_edge("score_calculation", "build_final_result")
workflow.add_edge("build_final_result", END)

compiled_graph = workflow.compile()


def run_full_verification(job_data: dict) -> dict:
    """
    Executes the entire verification graph end-to-end for the given job data.
    """
    logger.info(f"Invoking verification graph for Transaction ID: {job_data.get('transactionId')}")
    
    initial_state = {
        "transaction_id": job_data.get("transactionId"),
        "github_url": job_data.get("githubUrl"),
        "resume_text": job_data.get("resumeText", ""),
        "jd_text": job_data.get("jdText", ""),
        "client_id": job_data.get("clientId", ""),
        "github_user_exists": False,
        "github_user_data": {},
        "github_repos": [],
        "claimed_projects": [],
        "project_matches": [],
        "authorship_results": [],
        "account_health": {},
        "ai_alignment": {},
        "confidence_score": 0,
        "status": "flagged",
        "flags": [],
        "final_result": {}
    }
    
    try:
        from app.services import db_service
        # Mark job as active in the database
        db_service.update_job_record(job_data.get("transactionId"), "active", active=True)
        db_service.update_transaction_status(job_data.get("transactionId"), "processing")
        
        final_state = compiled_graph.invoke(initial_state)
        return final_state.get("final_result", {})
    except Exception as e:
        logger.error(f"Unhandled graph execution error: {e}")
        try:
            from app.services import db_service
            db_service.update_job_record(job_data.get("transactionId"), "failed", error_message=str(e))
            db_service.update_transaction_status(job_data.get("transactionId"), "failed")
        except Exception as db_err:
            logger.error(f"Failed to record unhandled failure status: {db_err}")
        raise e
