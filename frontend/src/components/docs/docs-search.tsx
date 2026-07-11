"use client";

/**
 * DocsSearch — a search bar that filters Q&A items across all docs sections.
 *
 * Shows results grouped by section as the user types.
 * Clicking a result scrolls to the relevant Q&A item and switches to that section.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOC_SECTIONS, getAllQAItems } from "@/lib/docs-data";
import type { DocSection } from "@/lib/docs-data";

interface DocsSearchProps {
  onSelectSection: (sectionId: string) => void;
  onSelectQuestion: (questionId: string) => void;
  currentSection: string;
}

interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  sectionIcon: string;
  questionId: string;
  question: string;
  matchType: "question" | "answer";
  snippet?: string;
}

export function DocsSearch({
  onSelectSection,
  onSelectQuestion,
  currentSection,
}: DocsSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Perform search
  const performSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = q.toLowerCase();
    const allItems = getAllQAItems();
    const searchResults: SearchResult[] = [];

    for (const item of allItems) {
      const questionLower = item.question.toLowerCase();
      const answerLower = item.answer.toLowerCase();

      const inQuestion = questionLower.includes(lowerQuery);
      const inAnswer = answerLower.includes(lowerQuery);

      if (inQuestion || inAnswer) {
        // Find a snippet from the answer
        let snippet: string | undefined;
        if (inAnswer) {
          const idx = answerLower.indexOf(lowerQuery);
          const start = Math.max(0, idx - 60);
          const end = Math.min(item.answer.length, idx + lowerQuery.length + 60);
          snippet =
            (start > 0 ? "..." : "") +
            item.answer.slice(start, end) +
            (end < item.answer.length ? "..." : "");
        }

        searchResults.push({
          sectionId: item.sectionId,
          sectionTitle: item.sectionTitle,
          sectionIcon: DOC_SECTIONS.find((s) => s.id === item.sectionId)?.icon ?? "",
          questionId: item.id,
          question: item.question,
          matchType: inQuestion ? "question" : "answer",
          snippet: snippet?.replace(/\n/g, " ").replace(/\*\*/g, ""),
        });
      }
    }

    setResults(searchResults.slice(0, 20));
    setSelectedIndex(0);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 150);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.sectionId !== currentSection) {
      onSelectSection(result.sectionId);
    }
    // Small delay to let the section render first
    setTimeout(() => {
      onSelectQuestion(result.questionId);
    }, 100);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-md" role="search">
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center rounded-lg border transition-all duration-200",
          isFocused
            ? "border-primary/50 ring-1 ring-primary/20 shadow-lg shadow-primary/5"
            : "border-border hover:border-border/80",
        )}
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 py-2.5 pl-10 pr-8 outline-none"
          aria-label="Search documentation"
          aria-expanded={results.length > 0}
          role="combobox"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-2 p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground/50 border border-border/50 bg-muted/30">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        )}
      </div>

      {/* Results Dropdown */}
      {results.length > 0 && isFocused && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden z-50"
          role="listbox"
        >
          <div className="max-h-[400px] overflow-y-auto py-2">
            {results.map((result, index) => (
              <button
                key={`${result.questionId}-${index}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full text-left px-4 py-3 transition-colors",
                  index === selectedIndex ? "bg-muted" : "hover:bg-muted/50",
                )}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{result.sectionIcon}</span>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {result.sectionTitle}
                  </span>
                  {result.matchType === "answer" && (
                    <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">
                      Answer
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {result.question}
                </p>
                {result.snippet && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {result.snippet}
                  </p>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-muted border border-border">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-muted border border-border">
                ⏎
              </kbd>{" "}
              Select
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-muted border border-border">
                Esc
              </kbd>{" "}
              Close
            </span>
          </div>
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden z-50">
          <div className="px-4 py-8 text-center">
            <Search className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No results found for{" "}
              <span className="text-foreground font-medium">&quot;{query}&quot;</span>
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Try different keywords or browse the sections below
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
