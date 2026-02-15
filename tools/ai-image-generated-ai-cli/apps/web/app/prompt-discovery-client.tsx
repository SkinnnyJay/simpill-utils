"use client";

import { useState, useMemo } from "react";
import type { PromptEntry, EngineId } from "@simpill/image-ai-core";

const ENGINE_IDS: EngineId[] = ["gemini", "openai", "xai"];

export function PromptDiscoveryClient({
  initialPrompts,
}: {
  initialPrompts: PromptEntry[];
}) {
  const [tagFilter, setTagFilter] = useState("");
  const [query, setQuery] = useState("");
  const [engineHint, setEngineHint] = useState<EngineId | "">("");

  const prompts = useMemo(() => {
    let out = initialPrompts;

    if (tagFilter.trim()) {
      const set = new Set(tagFilter.split(",").map((t) => t.trim()));
      out = out.filter((p) => p.tags.some((t) => set.has(t)));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.template.toLowerCase().includes(q) ||
          (p.label?.toLowerCase().includes(q) ?? false)
      );
    }

    if (engineHint) {
      out = out.filter(
        (p) => p.modelHint === undefined || p.modelHint === engineHint
      );
    }

    return out;
  }, [initialPrompts, tagFilter, query, engineHint]);

  return (
    <>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Search</span>
          <input
            type="text"
            placeholder="Search in id, template, label..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Tags (comma-separated)</span>
          <input
            type="text"
            placeholder="e.g. game, sprite"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Engine hint</span>
          <select
            value={engineHint}
            onChange={(e) =>
              setEngineHint((e.target.value || "") as EngineId | "")
            }
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          >
            <option value="">Any</option>
            {ENGINE_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: 12 }}>
          Prompts ({prompts.length})
        </h2>
        {prompts.length === 0 ? (
          <p style={{ color: "#666" }}>No prompts match the filters.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {prompts.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {p.id}
                  {p.label ? ` — ${p.label}` : ""}
                </div>
                {p.tags.length > 0 && (
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    {p.tags.join(", ")}
                  </div>
                )}
                <pre
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {p.template}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
