"""
DAT-005: Similar Incident Search Engine & Pattern Signal Generator
"""

import os
import json
import math
from collections import Counter
from typing import Dict, Any, List, Optional

from data.build_manual_index import tokenize

FIXTURES_FILE = os.path.join(os.path.dirname(__file__), "fixtures", "incidents.json")


def load_incidents() -> List[Dict[str, Any]]:
    if os.path.exists(FIXTURES_FILE):
        with open(FIXTURES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def search_similar_incidents(
    query_text: str,
    equipment: Optional[str] = None,
    hazard_type: Optional[str] = None,
    site: Optional[str] = None,
    top_k: int = 3
) -> Dict[str, Any]:
    """
    Searches near-miss reports by narrative + equipment + hazard_type.
    Computes cosine similarity over TF-IDF vectors.
    If 2 or more hits share site+equipment or site+hazard_type, generates a pattern_signal.

    Returns:
    {
      "matches": [
        {
          "id": string,
          "score": float,
          "summary": string,
          "site": string,
          "equipment": string,
          "hazard_type": string
        }
      ],
      "pattern_signal": {
        "recurring": bool,
        "count": int,
        "sentence": string,
        "shared_key": string
      }
    }
    """
    incidents = load_incidents()
    if not incidents:
        return {
            "matches": [],
            "pattern_signal": {
                "recurring": False,
                "count": 0,
                "sentence": "No prior similar incidents recorded.",
                "shared_key": ""
            }
        }

    search_combined = f"{query_text} {equipment or ''} {hazard_type or ''} {site or ''}".strip()
    query_tokens = tokenize(search_combined)

    # Compute IDF over incident database
    num_docs = len(incidents)
    df = Counter()
    doc_tokens = []
    for inc in incidents:
        text = f"{inc.get('narrative', '')} {inc.get('equipment', '')} {inc.get('hazard_type', '')} {inc.get('summary', '')}"
        tokens = tokenize(text)
        doc_tokens.append(tokens)
        for t in set(tokens):
            df[t] += 1

    idf = {t: math.log((num_docs + 1) / (freq + 1)) + 1.0 for t, freq in df.items()}

    # Compute Query Vector
    q_tf = Counter(query_tokens)
    q_len = len(query_tokens) or 1
    q_vec = {}
    q_norm_sq = 0.0
    for t, count in q_tf.items():
        val = (count / q_len) * idf.get(t, 1.0)
        q_vec[t] = val
        q_norm_sq += val * val

    q_norm = math.sqrt(q_norm_sq) or 1.0
    q_norm_vec = {k: v / q_norm for k, v in q_vec.items()}

    # Score incidents
    scored_incidents = []
    for inc, tokens in zip(incidents, doc_tokens):
        d_tf = Counter(tokens)
        d_len = len(tokens) or 1
        d_vec = {}
        d_norm_sq = 0.0
        for t, count in d_tf.items():
            val = (count / d_len) * idf.get(t, 1.0)
            d_vec[t] = val
            d_norm_sq += val * val
        d_norm = math.sqrt(d_norm_sq) or 1.0
        d_norm_vec = {k: v / d_norm for k, v in d_vec.items()}

        score = sum(q_val * d_norm_vec[t] for t, q_val in q_norm_vec.items() if t in d_norm_vec)

        # Exact matching boosts
        if equipment and equipment.lower() in inc.get("equipment", "").lower():
            score += 0.25
        if hazard_type and hazard_type.lower() in inc.get("hazard_type", "").lower():
            score += 0.2
        if site and site.lower() in inc.get("site", "").lower():
            score += 0.15

        scored_incidents.append((score, inc))

    scored_incidents.sort(key=lambda x: x[0], reverse=True)

    matches = []
    for sc, inc in scored_incidents[:top_k]:
        matches.append({
            "id": inc["id"],
            "score": round(sc, 3),
            "summary": inc.get("summary", ""),
            "site": inc.get("site", ""),
            "equipment": inc.get("equipment", ""),
            "hazard_type": inc.get("hazard_type", "")
        })

    # Pattern Signal Detection: Analyze top matches and full dataset for shared site+equipment or site+hazard
    shared_eq = Counter()
    shared_haz = Counter()

    for m in matches:
        site_eq_key = f"{m['site']}::EQ::{m['equipment']}"
        site_haz_key = f"{m['site']}::HAZ::{m['hazard_type']}"
        shared_eq[site_eq_key] += 1
        shared_haz[site_haz_key] += 1

    recurring = False
    count = 0
    sentence = "No recurring incident pattern detected."
    shared_key = ""

    top_eq_key, top_eq_count = shared_eq.most_common(1)[0] if shared_eq else ("", 0)
    top_haz_key, top_haz_count = shared_haz.most_common(1)[0] if shared_haz else ("", 0)

    if top_eq_count >= 2:
        recurring = True
        count = top_eq_count
        site_name, eq_name = top_eq_key.split("::EQ::")
        sentence = f"Recurring hazard pattern detected: {count} similar incidents recorded for equipment '{eq_name}' at {site_name}."
        shared_key = top_eq_key
    elif top_haz_count >= 2:
        recurring = True
        count = top_haz_count
        site_name, haz_name = top_haz_key.split("::HAZ::")
        sentence = f"Recurring hazard pattern detected: {count} similar '{haz_name}' incidents recorded at {site_name}."
        shared_key = top_haz_key

    return {
        "matches": matches,
        "pattern_signal": {
            "recurring": recurring,
            "count": count,
            "sentence": sentence,
            "shared_key": shared_key
        }
    }
