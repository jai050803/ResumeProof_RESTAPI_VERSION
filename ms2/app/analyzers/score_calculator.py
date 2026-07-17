def determine_verification_status(score: int) -> str:
    """
    Determines verification status based on the confidence score:
    - score >= 70: verified
    - score 40-69: flagged
    - score < 40: rejected
    """
    if score >= 70:
        return "verified"
    elif score >= 40:
        return "flagged"
    else:
        return "rejected"

def assemble_flags(project_matches: list, authorship_results: list, skill_alignment: dict, account_health: dict) -> list:
    """
    Assembles warning and observation flags from all verification stages.
    """
    flags = []
    
    # 1. Flags from Account Health
    health_flags = account_health.get("flags", [])
    for hf in health_flags:
        if hf == "account_too_new":
            flags.append({
                "type": "warning",
                "message": "GitHub account is extremely new (under 60 days old).",
                "severity": "high"
            })
        elif hf == "account_relatively_new":
            flags.append({
                "type": "observation",
                "message": "GitHub account is relatively new (under 180 days old).",
                "severity": "medium"
            })
        elif hf == "no_public_repos":
            flags.append({
                "type": "warning",
                "message": "GitHub profile has zero public repositories.",
                "severity": "high"
            })
            
    # 2. Flags from Project Matcher
    for pm in project_matches:
        if pm.get("matched_repo") is None:
            flags.append({
                "type": "warning",
                "message": f"Could not find matching GitHub repository for claimed project '{pm.get('claimed_project')}'.",
                "severity": "medium"
            })
            
    # 3. Flags from Commit Analyzer
    for r in authorship_results:
        repo_name = r.get("repo_name")
        suspicious = r.get("suspicious_patterns", [])
        if not r.get("is_author") and repo_name:
            flags.append({
                "type": "warning",
                "message": f"Candidate is not the author of any commits in matched repository '{repo_name}'.",
                "severity": "high"
            })
        for pattern in suspicious:
            if pattern == "all_commits_single_day":
                flags.append({
                    "type": "warning",
                    "message": f"Suspicious commit history in '{repo_name}': all commits were pushed on a single day.",
                    "severity": "high"
                })
            elif pattern == "compressed_burst":
                flags.append({
                    "type": "warning",
                    "message": f"Suspicious commit history in '{repo_name}': commit frequency shows a scripted compressed burst (10+ commits in <3 days).",
                    "severity": "medium"
                })
            elif pattern == "single_clock_hour":
                flags.append({
                    "type": "observation",
                    "message": f"Suspicious commit history in '{repo_name}': all commits occurred within the same clock hour of the day.",
                    "severity": "medium"
                })
            elif pattern == "perfectly_uniform_spacing":
                flags.append({
                    "type": "warning",
                    "message": f"Suspicious commit history in '{repo_name}': commits have perfectly uniform spacing, suggesting automation.",
                    "severity": "high"
                })
                
    # 4. Flags from AI alignment
    missing = skill_alignment.get("missing_skills", [])
    if missing:
        flags.append({
            "type": "observation",
            "message": f"Missing key skills requested in JD: {', '.join(missing)}.",
            "severity": "low"
        })
        
    return flags

def compute_confidence_score(github_result: dict, project_matches: list, authorship_results: list, skill_alignment: dict, account_health: dict) -> dict:
    """
    Computes a final integer score (0-100) using a weighted formula:
    - 40% Project Existence & Match Quality
    - 30% Commit Authorship (without suspicious patterns)
    - 20% Skill-JD Alignment (scaled proportionally if JD is missing)
    - 10% Account Health
    """
    # 1. Project matches points (Max 40)
    claimed_count = len(project_matches)
    verified_count = sum(1 for m in project_matches if m.get("matched_repo") is not None)
    
    if claimed_count > 0:
        match_scores = [m.get("score", 0.0) for m in project_matches if m.get("matched_repo") is not None]
        avg_match_score = sum(match_scores) / len(match_scores) if match_scores else 0.0
        project_points = 40.0 * (verified_count / claimed_count) * avg_match_score
    else:
        project_points = 40.0
        
    # 2. Commit authorship points (Max 30)
    has_authorship = any(r.get("is_author", False) for r in authorship_results)
    commit_points = 0.0
    if has_authorship:
        commit_points = 30.0
        # Gather all suspicious pattern types detected
        all_patterns = []
        for r in authorship_results:
            all_patterns.extend(r.get("suspicious_patterns", []))
        unique_patterns = set(all_patterns)
        
        # Deduct 10 points per suspicious pattern type
        deductions = len(unique_patterns) * 10.0
        commit_points = max(0.0, commit_points - deductions)
        
    # 3. Account health points (Max 10)
    health_points = 10.0 * (account_health.get("health_score", 100) / 100.0)
    
    # 4. Skill-JD Alignment points (Max 20)
    has_jd = skill_alignment.get("score") is not None and "skipped" not in skill_alignment.get("summary", "").lower()
    
    if has_jd:
        alignment_points = 20.0 * (skill_alignment.get("score", 0) / 100.0)
        total_score = project_points + commit_points + health_points + alignment_points
    else:
        # Scale score up proportionally to fit 100 points
        raw_sum = project_points + commit_points + health_points
        total_score = raw_sum * (100.0 / 80.0)
        
    final_score = int(round(total_score))
    final_score = max(0, min(100, final_score))
    
    status = determine_verification_status(final_score)
    flags = assemble_flags(project_matches, authorship_results, skill_alignment, account_health)
    
    return {
        "confidence_score": final_score,
        "status": status,
        "flags": flags
    }
