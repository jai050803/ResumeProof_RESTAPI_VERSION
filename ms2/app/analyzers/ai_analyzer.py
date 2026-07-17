import json
import re
from groq import Groq
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("ai_analyzer")

# Simple counter for manual test verification
_groq_call_count = 0

def get_groq_client():
    return Groq(api_key=settings.groq_api_key)

def clean_json_response(text: str) -> str:
    text = text.strip()
    match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
    if match:
        return match.group(1).strip()
    match_plain = re.search(r'```\s*([\s\S]*?)\s*```', text)
    if match_plain:
        return match_plain.group(1).strip()
    return text

def extract_projects_with_ai(resume_text: str) -> list:
    """
    Extracts candidate's claimed projects and tech stacks from resume text using Groq LLM.
    """
    global _groq_call_count
    _groq_call_count += 1
    logger.info(f"Groq API Call Count: {_groq_call_count}")

    client = get_groq_client()
    prompt = f"""
You are an expert technical resume parser.
Analyze the following resume text and extract all projects claimed by the candidate.
For each project, identify the project name and the technologies/languages used in it.

Resume Text:
{resume_text}

You MUST return ONLY a valid JSON array of objects. Do not include any explanation, markdown formatting (outside of json code blocks), or extra text.
Format:
[
  {{"name": "Project Name", "technologies": ["Tech1", "Tech2"]}}
]
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise JSON extractor that only outputs raw JSON arrays."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-70b-8192",
            temperature=0.0
        )
        response_text = chat_completion.choices[0].message.content
        cleaned = clean_json_response(response_text)
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Error extracting projects with AI: {e}")
        return []

def analyze_skill_alignment(resume_text: str, jd_text: str, matched_skills: list) -> dict:
    """
    Analyzes alignment between candidate's resume, matched GitHub skills, and the Job Description.
    """
    global _groq_call_count
    _groq_call_count += 1
    logger.info(f"Groq API Call Count: {_groq_call_count}")

    if not jd_text or len(jd_text.strip()) < 50:
        return {
            "score": 0,
            "matched_skills": matched_skills,
            "missing_skills": [],
            "experience_level": "unknown",
            "summary": "No job description provided for alignment analysis."
        }

    client = get_groq_client()
    prompt = f"""
You are an expert technical recruiter and resume analyzer.
Analyze the candidate's resume against the target Job Description (JD).
Also, consider these technical skills that were already matched from their GitHub profile: {matched_skills}

Resume Text:
{resume_text}

Job Description:
{jd_text}

Compare the skills demanded in the JD with the skills present in the resume and matched GitHub skills.
Determine:
1. Alignment Score (0 to 100).
2. List of matched skills.
3. List of missing skills (skills requested in JD but not present/demonstrated).
4. Estimated experience level (e.g. Junior, Mid, Senior).
5. A concise 2-sentence summary of the candidate's alignment.

You MUST return ONLY a valid JSON object. Do not include any explanations, markdown formatting (outside of json code blocks), or extra text.
Format:
{{
  "score": 85,
  "matched_skills": ["Python", "Docker"],
  "missing_skills": ["AWS"],
  "experience_level": "Mid",
  "summary": "..."
}}
"""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise recruiter assistant that only outputs raw JSON objects."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-70b-8192",
            temperature=0.0
        )
        response_text = chat_completion.choices[0].message.content
        cleaned = clean_json_response(response_text)
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Error analyzing skill alignment with AI: {e}")
        return {
            "score": 0,
            "matched_skills": matched_skills,
            "missing_skills": [],
            "experience_level": "unknown",
            "summary": "AI alignment analysis failed due to an error."
        }

def get_call_count() -> int:
    return _groq_call_count
