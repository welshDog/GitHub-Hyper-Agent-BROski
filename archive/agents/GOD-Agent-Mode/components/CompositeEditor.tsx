"use client";

import React, { useMemo, useState } from 'react';
import type { HyperGraph } from '../src/core/schema';
import { HyperGraphSchema } from '../src/core/schema';

export default function CompositeEditor({
  value,
  onChange,
}: {
  value?: HyperGraph;
  onChange: (graph: HyperGraph) => void;
}) {
  const [text, setText] = useState<string>(() =>
    value ? JSON.stringify(value, null, 2) : '{\n  "id": "sub-graph",\n  "nodes": [],\n  "edges": []\n}'
  );
  const [error, setError] = useState<string | null>(null);

  const onApply = () => {
    try {
      const parsed = JSON.parse(text);
      const safe = HyperGraphSchema.parse(parsed);
      setError(null);
      onChange(safe);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  };

  const status = useMemo(() => (error ? 'Invalid' : 'Valid'), [error]);

  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm opacity-80">Composite Subgraph Editor</div>
      <div className="text-xs opacity-60">Status: {status}</div>
      {error ? <div className="text-xs text-red-400">{error}</div> : null}
      <textarea
        className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full h-48 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Composite Subgraph JSON"
      />
      <button
        className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
        onClick={onApply}
        aria-label="Apply Subgraph"
      >
        Apply
      </button>
    </div>
  );
}
