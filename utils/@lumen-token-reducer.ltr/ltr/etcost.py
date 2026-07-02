"""Effective-Tokens (ET) cost metric (Lumen Industries).

Weighting from the GitHub agentic-workflow token-efficiency research
(filed: /home/lumen/research/research_queue/inbox/
github_token_optimization_mcp_pruning_2026-05-29.md):

  ET = model_multiplier * (input*1.0 + output*4.0 + cache_read*0.1)

A 10% ET drop == 10% cost reduction, model-agnostic.
"""
MODEL_MULT = {
    "haiku": 0.25,
    "sonnet": 1.0,
    "opus": 5.0,
    "deepseek": 0.15,  # Lumen fleet default brain (approx. price ratio vs sonnet)
}
W_INPUT, W_OUTPUT, W_CACHE_READ = 1.0, 4.0, 0.1


def effective_tokens(input_tokens=0, output_tokens=0, cache_read_tokens=0, model="sonnet"):
    m = MODEL_MULT.get(model, 1.0)
    return m * (W_INPUT * input_tokens + W_OUTPUT * output_tokens + W_CACHE_READ * cache_read_tokens)


def et_report(before_input, after_input, cached_after=0, model="sonnet"):
    """ET view of a reduction: `before` all-fresh vs `after` where the stable
    (cache-aware) prefix is billed at cache-read weight on warm calls."""
    et_before = effective_tokens(input_tokens=before_input, model=model)
    et_after_cold = effective_tokens(input_tokens=after_input, model=model)
    et_after_warm = effective_tokens(
        input_tokens=max(after_input - cached_after, 0),
        cache_read_tokens=cached_after, model=model,
    )
    return {
        "model": model,
        "et_before": round(et_before, 1),
        "et_after_cold": round(et_after_cold, 1),
        "et_after_warm": round(et_after_warm, 1),
        "et_reduction_cold_pct": round(100 * (1 - et_after_cold / max(et_before, 1e-9)), 1),
        "et_reduction_warm_pct": round(100 * (1 - et_after_warm / max(et_before, 1e-9)), 1),
    }
