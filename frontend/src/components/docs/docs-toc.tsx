"use client";

/**
 * DocTOC — right sidebar table of contents for the current section.
 *
 * Lists all questions in the current section as clickable links.
 * Highlights the currently visible question based on scroll position.
 * Sticky positioning for long pages.
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import type { DocSection } from "@/lib/docs-data";

interface DocTOCProps {
  section: DocSection;
}

export function DocTOC({ section }: DocTOCProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Track scroll position to highlight current question
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("qa-", "");
            setActiveId(id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 },
    );

    // Observe all QA items
    const elements = section.items
      .map((item) => document.getElementById(`qa-${item.id}`))
      .filter(Boolean);

    for (const el of elements) {
      if (el) observer.observe(el);
    }

    return () => {
      for (const el of elements) {
        if (el) observer.unobserve(el);
      }
    };
  }, [section.items]);

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`qa-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  return (
    <aside
      className="w-56 shrink-0 hidden xl:block"
      aria-label="On this page"
    >
      <div className="sticky top-24 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <List className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            On this page
          </span>
        </div>

        {/* Question links */}
        <nav className="space-y-0.5">
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToQuestion(item.id)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-xs transition-all duration-200 border border-transparent",
                activeId === item.id
                  ? "text-primary font-medium bg-primary/5 border-primary/20"
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30",
              )}
            >
              <span className="line-clamp-2 leading-relaxed">{item.question}</span>
            </button>
          ))}
        </nav>

        {/* Section info */}
        <div className="pt-3 border-t border-border px-1">
          <span className="text-[11px] text-muted-foreground/50">
            {section.items.length} question{section.items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </aside>
  );
}
