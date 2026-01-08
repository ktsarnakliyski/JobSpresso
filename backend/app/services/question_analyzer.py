"""
Question Coverage Analyzer

Analyzes whether a job description answers common candidate questions.
Inspired by COSMO/Rufus Q&A coverage analysis.
"""

import re
from typing import Optional
from pydantic import BaseModel

from app.services.field_mappings import QUESTION_TO_FIELD


class QuestionCoverage(BaseModel):
    """Whether a candidate question is answered in the JD."""
    question_id: str
    question_text: str
    is_answered: bool
    importance: str  # high, medium, low
    evidence: Optional[str] = None  # Text excerpt that answers the question
    suggestion: Optional[str] = None  # How to answer if missing
    impact_stat: str


# Candidate questions that job seekers commonly want answered
CANDIDATE_QUESTIONS = {
    "compensation": {
        "question": "What is the salary range for this role?",
        "importance": "high",
        "impact_stat": "Job posts with salary ranges get 30% more applications",
        "detection_patterns": [
            r"\$[\d,]+",  # Dollar amounts
            r"salary\s*(range)?",
            r"compensation",
            r"\d+k\s*[-–to]+\s*\d+k",
            r"pay\s*(range)?",
            r"£[\d,]+",  # British pounds
            r"€[\d,]+",  # Euros
        ],
        "suggestion": "Add a salary range (e.g., '$80,000 - $100,000'). Even a broad range significantly increases applications.",
    },
    "remote_policy": {
        "question": "Can I work remotely?",
        "importance": "high",
        "impact_stat": "87% of workers want remote flexibility (Gallup)",
        "detection_patterns": [
            r"remote",
            r"hybrid",
            r"on[- ]?site",
            r"work\s*from\s*home",
            r"wfh",
            r"in[- ]?office",
            r"location[- ]?flexible",
        ],
        "suggestion": "Specify work arrangement: fully remote, hybrid (X days in office), or on-site with location.",
    },
    "day_to_day": {
        "question": "What will I actually do day-to-day?",
        "importance": "high",
        "impact_stat": "Clear role descriptions reduce early turnover by 23%",
        "detection_patterns": [
            r"day[- ]?to[- ]?day",
            r"typical\s+day",
            r"you('ll|.will)\s+(do|build|work|create|develop|manage|lead)",
            r"responsibilities\s*include",
            r"your\s+role",
            r"what\s+you('ll|.will)\s+do",
        ],
        "suggestion": "Add a section describing what a typical day or week looks like in this role.",
    },
    "growth_opportunities": {
        "question": "How can I grow in this role?",
        "importance": "medium",
        "impact_stat": "94% of employees would stay longer with career development (LinkedIn)",
        "detection_patterns": [
            r"growth",
            r"career\s+(path|development|progression)",
            r"advancement",
            r"promotion",
            r"learning\s+(opportunities|budget)",
            r"professional\s+development",
            r"mentorship",
        ],
        "suggestion": "Mention career paths, learning budgets, promotion opportunities, or mentorship programs.",
    },
    "team_culture": {
        "question": "What is the team like?",
        "importance": "medium",
        "impact_stat": "Culture fit is the top factor for 46% of job seekers",
        "detection_patterns": [
            r"team\s+(of|size|culture)",
            r"our\s+culture",
            r"our\s+values",
            r"work\s+environment",
            r"collaborate",
            r"cross[- ]?functional",
            r"you('ll|.will)\s+work\s+with",
        ],
        "suggestion": "Describe the team size, working style, values, and what collaboration looks like.",
    },
    "benefits": {
        "question": "What benefits are offered?",
        "importance": "medium",
        "impact_stat": "60% of candidates consider benefits over salary (Glassdoor)",
        "detection_patterns": [
            r"benefits",
            r"health\s*(care|insurance)",
            r"401\s*\(?k\)?",
            r"pto|paid\s+time\s+off",
            r"vacation",
            r"equity|stock\s+options",
            r"parental\s+leave",
            r"wellness",
        ],
        "suggestion": "List key benefits: health insurance, PTO policy, 401k, equity, parental leave, etc.",
    },
    "requirements_clarity": {
        "question": "Am I qualified for this role?",
        "importance": "high",
        "impact_stat": "Women apply when meeting 100% of requirements vs men at 60%",
        "detection_patterns": [
            r"must[- ]?have",
            r"required",
            r"minimum\s+qualifications",
            r"nice[- ]?to[- ]?have",
            r"preferred",
            r"bonus\s+if",
            r"\d+\+?\s*years?\s*(of)?\s*experience",
        ],
        "suggestion": "Clearly separate 'must-have' from 'nice-to-have' requirements to encourage more diverse applicants.",
    },
    "hiring_process": {
        "question": "What is the hiring process like?",
        "importance": "low",
        "impact_stat": "Clear process info increases application completion by 15%",
        "detection_patterns": [
            r"interview\s+(process|stages)",
            r"hiring\s+(process|timeline)",
            r"selection\s+process",
            r"how\s+to\s+apply",
            r"application\s+process",
            r"\d+\s*(round|stage)s?\s*(of)?\s*interview",
        ],
        "suggestion": "Briefly outline the interview stages and expected timeline.",
    },
    "start_date": {
        "question": "When would I start?",
        "importance": "low",
        "impact_stat": "Timeline clarity helps candidates plan their transitions",
        "detection_patterns": [
            r"start\s+date",
            r"immediate(ly)?",
            r"asap",
            r"q[1-4]\s*\d{4}",
            r"(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4}",
        ],
        "suggestion": "Include expected start date or hiring timeline.",
    },
    "reporting_structure": {
        "question": "Who would I report to?",
        "importance": "low",
        "impact_stat": "Manager relationship is the #1 factor in job satisfaction",
        "detection_patterns": [
            r"report(ing)?\s+to",
            r"manager",
            r"supervisor",
            r"director",
            r"team\s+lead",
            r"vp\s+of",
            r"head\s+of",
        ],
        "suggestion": "Mention who this role reports to and the team structure.",
    },
}


class QuestionCoverageAnalyzer:
    """Analyzes whether a JD answers common candidate questions."""

    def analyze(
        self, jd_text: str, excluded_topics: Optional[set[str]] = None
    ) -> list[QuestionCoverage]:
        """
        Check each candidate question against the JD.

        Args:
            jd_text: The job description text to analyze
            excluded_topics: Topics excluded by voice profile rules (e.g., {'salary', 'benefits'})
                           Questions for these topics will be skipped
        """
        excluded = excluded_topics or set()
        results = []

        for qid, qdata in CANDIDATE_QUESTIONS.items():
            # Skip questions for excluded topics (using shared mapping)
            topic = QUESTION_TO_FIELD.get(qid)
            if topic and topic in excluded:
                continue
            is_answered = False
            evidence = None

            for pattern in qdata["detection_patterns"]:
                match = re.search(pattern, jd_text, re.IGNORECASE)
                if match:
                    is_answered = True
                    # Extract surrounding context as evidence
                    start = max(0, match.start() - 30)
                    end = min(len(jd_text), match.end() + 70)
                    evidence = jd_text[start:end].strip()
                    # Clean up the evidence
                    if start > 0:
                        evidence = "..." + evidence
                    if end < len(jd_text):
                        evidence = evidence + "..."
                    break

            results.append(
                QuestionCoverage(
                    question_id=qid,
                    question_text=qdata["question"],
                    is_answered=is_answered,
                    importance=qdata["importance"],
                    evidence=evidence,
                    suggestion=None if is_answered else qdata["suggestion"],
                    impact_stat=qdata["impact_stat"],
                )
            )

        return results

    def get_summary(self, coverage: list[QuestionCoverage]) -> dict:
        """Get summary statistics for question coverage."""
        total = len(coverage)
        answered = sum(1 for q in coverage if q.is_answered)

        high_priority = [q for q in coverage if q.importance == "high"]
        high_answered = sum(1 for q in high_priority if q.is_answered)

        return {
            "total": total,
            "answered": answered,
            "percentage": round((answered / total) * 100) if total > 0 else 0,
            "high_priority_total": len(high_priority),
            "high_priority_answered": high_answered,
        }

    def estimate_application_boost(
        self, coverage: list[QuestionCoverage], bias_issue_count: int = 0
    ) -> int:
        """
        Estimate potential increase in applications if improvements are made.

        Returns a percentage estimate (e.g., 35 means +35% applications).
        """
        boost = 0

        # Salary transparency boost (biggest impact)
        salary_q = next((q for q in coverage if q.question_id == "compensation"), None)
        if salary_q and not salary_q.is_answered:
            boost += 30

        # Remote policy boost
        remote_q = next((q for q in coverage if q.question_id == "remote_policy"), None)
        if remote_q and not remote_q.is_answered:
            boost += 10

        # Requirements clarity boost (affects diversity)
        req_q = next((q for q in coverage if q.question_id == "requirements_clarity"), None)
        if req_q and not req_q.is_answered:
            boost += 15

        # Bias language reduction boost
        if bias_issue_count > 0:
            boost += min(20, bias_issue_count * 5)

        return boost
