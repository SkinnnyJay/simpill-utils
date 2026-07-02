"""LTR -- Lumen Token Reducer (Lumen Industries). Strictly lossless."""
from .reducer import reduce_text, verify_result
from .tokens import tok
from .segment import segment
from .dedup import dedup
from .encode import encode_segment, verify_encoding
from .select import make_selector, rank_segments
from .assemble import assemble
from .etcost import effective_tokens, et_report

__version__ = "1.0.0"
__all__ = [
    "reduce_text", "verify_result", "tok", "segment", "dedup",
    "encode_segment", "verify_encoding", "make_selector", "rank_segments",
    "assemble", "effective_tokens", "et_report",
]
