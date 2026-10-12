"use client";

import { PanelsTopLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type DirectoryPanel,
  DirectoryPanelCard,
} from "@/components/panels/directory-panel-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export function PanelsDirectory({ panels }: { panels: DirectoryPanel[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return panels;
    return panels.filter(
      (panel) =>
        panel.name.toLowerCase().includes(needle) ||
        (panel.description ?? "").toLowerCase().includes(needle),
    );
  }, [panels, query]);

  if (panels.length === 0) {
    return (
      <EmptyState
        icon={<PanelsTopLeft className="size-5" />}
        title="No panels yet"
        description="Admins add domains from the control room — members pick them when they check in."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or description"
          aria-label="Search panels"
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No panels match your search"
          description={`Nothing here matches “${query.trim()}”. Try another name or keyword.`}
          action={
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((panel, index) => (
            <div
              key={panel.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
            >
              <DirectoryPanelCard panel={panel} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
