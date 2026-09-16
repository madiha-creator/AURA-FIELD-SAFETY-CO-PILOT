"""
DAT-002: query_manual_db similarity search + safe-range context integration
"""

import os
import json
import math
from collections import Counter
from typing import Dict, Any, Optional, List

from data.build_manual_index import tokenize, main as rebuild_index, INDEX_FILE
from safety.safe_ranges import get_safe_range


def _load_index() -> Dict[str, Any]:
    if not os.path.exists(INDEX_FILE):
        rebuild_index()
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def query_manual_db(
    procedure: str,
    step: Optional[int] = None,
    parameter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs similarity search over indexed manuals and joins SAF-001 ranges.

    Returns:
    {
      "excerpt": string,
      "step_text": string,
      "related_ranges": [{"parameter": string, "min": number, "max": number, "unit": string}],
      "sources": [{"doc_id": string, "title": string, "score": number}]
    }
    """
    index_data = _load_index()
    idf = index_data.get("idf", {})
    chunks = index_data.get("chunks", [])

    query_str = f"{procedure} {f'step {step}' if step else ''} {parameter or ''}".strip()
    query_tokens = tokenize(query_str)

    # Compute normalized TF-IDF vector for query
    q_tf = Counter(query_tokens)
    q_total = len(query_tokens) or 1
    q_vec = {}
    q_norm_sq = 0.0
    for token, count in q_tf.items():
        token_idf = idf.get(token, 1.0)
        val = (count / q_total) * token_idf
        q_vec[token] = val
        q_norm_sq += val * val

    q_norm = math.sqrt(q_norm_sq) or 1.0
    q_norm_vec = {k: v / q_norm for k, v in q_vec.items()}

    # Compute cosine similarity against all chunks
    scored_chunks = []
    for chunk in chunks:
        doc_vec = chunk["vector"]
        score = 0.0
        for token, q_val in q_norm_vec.items():
            if token in doc_vec:
                score += q_val * doc_vec[token]

        # Boost score if procedure_id matches or step matches
        proc_norm = procedure.lower().replace("-", "_").replace(" ", "_")
        if proc_norm in chunk["procedure_id"].lower():
            score += 0.3
        if step is not None and chunk["step"] == int(step):
            score += 0.2

        scored_chunks.append((score, chunk))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)

    sources = []
    top_chunk = None
    if scored_chunks:
        top_score, top_chunk = scored_chunks[0]
        for sc, ch in scored_chunks[:3]:
            sources.append({
                "doc_id": ch["doc_id"],
                "title": ch["title"],
                "score": round(sc, 3)
            })

    excerpt = top_chunk["full_text"] if top_chunk else f"Manual instructions for {procedure} step {step or 1}."
    step_text = top_chunk["step_text"] if top_chunk else f"Step {step or 1}: Check system parameters."

    # Join safe ranges
    related_ranges = []
    params_to_check = []
    if parameter:
        params_to_check.append(parameter)

    # Also extract parameter names from top excerpt or procedure
    known_params = ["coolant_line_pressure", "coolant_temperature", "hydraulic_pressure", "fluid_temperature", "vibration_frequency", "oil_pressure"]
    for p in known_params:
        p_clean = p.replace("_", " ")
        if p_clean in excerpt.lower() or p_clean in procedure.lower():
            if p_clean not in params_to_check:
                params_to_check.append(p_clean)

    if not params_to_check:
        params_to_check = ["coolant line pressure"]

    for p_name in params_to_check:
        r_info = get_safe_range(p_name, procedure_id=procedure)
        if r_info:
            related_ranges.append({
                "parameter": r_info.get("parameter", p_name),
                "min": float(r_info["min"]),
                "max": float(r_info["max"]),
                "unit": r_info.get("unit", "")
            })

    return {
        "excerpt": excerpt,
        "step_text": step_text,
        "related_ranges": related_ranges,
        "sources": sources
    }
