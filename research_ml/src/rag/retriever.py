"""
HumanLens AI — Semantic Vector Retriever for De-escalation Strategies
Member 3: Research / ML Lead

Implements:
1. Primary Semantic Backend: SentenceTransformer (sentence-transformers/all-MiniLM-L6-v2)
2. Graceful Fallback Backend: TF-IDF + Cosine Similarity
3. Lazy loading with availability detection and non-blocking fallback
4. Explicit provenance reporting (backend_used = 'sentence_transformers' vs 'tfidf_fallback')
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.rag.knowledge_base import KNOWLEDGE_ITEMS


class DeEscalationRetriever:
    """
    Retrieves evidence-informed guidance from the curated de-escalation knowledge base.
    Uses SentenceTransformer dense embeddings when available, falling back to TF-IDF.
    """

    def __init__(
        self,
        backend: str = "sentence_transformers",
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        top_k: int = 3,
        fallback_to_tfidf: bool = True,
    ):
        self.backend_choice = backend
        self.embedding_model_name = embedding_model
        self.top_k = top_k
        self.fallback_to_tfidf = fallback_to_tfidf

        self.corpus = KNOWLEDGE_ITEMS
        self.texts = [
            f"{item['category']} trigger:{item['trigger']} principle:{item['principle']} strategy:{item['strategy']} {' '.join(item['tactics'])}"
            for item in self.corpus
        ]

        # TF-IDF fallback structures
        self._tfidf_vectorizer = None
        self._tfidf_matrix = None

        # Dense embedding structures
        self._st_model = None
        self._corpus_embeddings = None
        self._st_initialized = False
        self._st_error = None

    def _init_tfidf(self):
        if self._tfidf_vectorizer is None:
            self._tfidf_vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            self._tfidf_matrix = self._tfidf_vectorizer.fit_transform(self.texts)

    def _init_sentence_transformer(self) -> bool:
        if not self._st_initialized:
            try:
                from sentence_transformers import SentenceTransformer
                # Try loading from local cache first to prevent hangs
                try:
                    self._st_model = SentenceTransformer(self.embedding_model_name, local_files_only=True)
                except Exception:
                    # Attempt download with fallback
                    self._st_model = SentenceTransformer(self.embedding_model_name)

                self._corpus_embeddings = self._st_model.encode(
                    self.texts, convert_to_numpy=True, normalize_embeddings=True
                )
                self._st_initialized = True
                return True
            except Exception as e:
                self._st_error = str(e)
                self._st_initialized = True
                return False
        return self._st_model is not None

    def retrieve(self, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieves top-k evidence items for the query context.
        Returns list of items with 'relevance_score' and 'retrieval_backend'.
        """
        k = top_k if top_k is not None else self.top_k
        k = min(k, len(self.corpus))

        if not query or not query.strip():
            results = []
            for item in self.corpus[:k]:
                entry = dict(item)
                entry["relevance_score"] = 0.50
                entry["retrieval_backend"] = "default_order"
                results.append(entry)
            return results

        # Try SentenceTransformer if requested
        if self.backend_choice == "sentence_transformers":
            st_ready = self._init_sentence_transformer()
            if st_ready and self._st_model is not None and self._corpus_embeddings is not None:
                try:
                    q_emb = self._st_model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
                    sims = np.dot(self._corpus_embeddings, q_emb.T).flatten()
                    top_indices = np.argsort(sims)[::-1][:k]

                    results = []
                    for idx in top_indices:
                        item = dict(self.corpus[idx])
                        item["relevance_score"] = round(float(sims[idx]), 4)
                        item["retrieval_backend"] = "sentence_transformers"
                        results.append(item)
                    return results
                except Exception as e:
                    self._st_error = str(e)

        # Graceful fallback to TF-IDF
        if self.fallback_to_tfidf:
            self._init_tfidf()
            q_vec = self._tfidf_vectorizer.transform([query])
            sims = cosine_similarity(q_vec, self._tfidf_matrix)[0]
            top_indices = np.argsort(sims)[::-1][:k]

            results = []
            for idx in top_indices:
                item = dict(self.corpus[idx])
                item["relevance_score"] = round(float(sims[idx]), 4)
                item["retrieval_backend"] = "tfidf_fallback"
                results.append(item)
            return results

        return []
