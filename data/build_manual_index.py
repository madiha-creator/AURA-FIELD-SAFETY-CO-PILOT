"""
DAT-001: Offline Manual Indexer (TF-IDF / Cosine Vector Index)
"""

import os
import re
import json
import math
from collections import Counter
from typing import List, Dict, Any

MANUALS_DIR = os.path.join(os.path.dirname(__file__), "manuals")
INDEX_DIR = os.path.join(os.path.dirname(__file__), "indexes")
INDEX_FILE = os.path.join(INDEX_DIR, "manual_index.json")


def tokenize(text: str) -> List[str]:
    """Tokenizes text into lowercase alphanumeric terms."""
    return re.findall(r"\b\w+\b", text.lower())


def parse_markdown_manuals(manuals_dir: str) -> List[Dict[str, Any]]:
    """
    Parses markdown manual files chunked by procedure and step.
    """
    chunks = []
    if not os.path.exists(manuals_dir):
        return chunks

    for fname in os.listdir(manuals_dir):
        if not fname.endswith(".md"):
            continue

        fpath = os.path.join(manuals_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        proc_id = os.path.splitext(fname)[0]
        title_match = re.search(r"^Title:\s*(.+)$", content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else proc_id

        # Split into steps by '## Step '
        step_blocks = re.split(r"(?m)^##\s+Step\s+(\d+)", content)
        for i in range(1, len(step_blocks), 2):
            step_num = int(step_blocks[i])
            step_text = step_blocks[i+1].strip() if i+1 < len(step_blocks) else ""

            doc_id = f"{proc_id}_step_{step_num}"
            full_text = f"{title} procedure {proc_id} step {step_num} {step_text}"

            chunks.append({
                "doc_id": doc_id,
                "procedure_id": proc_id,
                "title": title,
                "step": step_num,
                "step_text": step_text,
                "full_text": full_text,
                "tokens": tokenize(full_text)
            })

    return chunks


def build_tfidf_index(chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes TF-IDF vectors for chunks and returns index data structure.
    """
    num_docs = len(chunks)
    df = Counter()
    for chunk in chunks:
        unique_tokens = set(chunk["tokens"])
        for token in unique_tokens:
            df[token] += 1

    idf = {}
    for token, freq in df.items():
        idf[token] = math.log((num_docs + 1) / (freq + 1)) + 1.0

    processed_chunks = []
    for chunk in chunks:
        tf = Counter(chunk["tokens"])
        total_tokens = len(chunk["tokens"]) or 1
        tfidf_vec = {}
        norm_sq = 0.0
        for token, count in tf.items():
            val = (count / total_tokens) * idf[token]
            tfidf_vec[token] = val
            norm_sq += val * val

        norm = math.sqrt(norm_sq) or 1.0
        norm_vec = {k: v / norm for k, v in tfidf_vec.items()}

        processed_chunks.append({
            "doc_id": chunk["doc_id"],
            "procedure_id": chunk["procedure_id"],
            "title": chunk["title"],
            "step": chunk["step"],
            "step_text": chunk["step_text"],
            "full_text": chunk["full_text"],
            "vector": norm_vec
        })

    return {
        "num_docs": num_docs,
        "idf": idf,
        "chunks": processed_chunks
    }


def main():
    os.makedirs(INDEX_DIR, exist_ok=True)
    chunks = parse_markdown_manuals(MANUALS_DIR)
    index_data = build_tfidf_index(chunks)

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2)

    print(f"Built manual vector index with {len(chunks)} chunks at {INDEX_FILE}")


if __name__ == "__main__":
    main()
