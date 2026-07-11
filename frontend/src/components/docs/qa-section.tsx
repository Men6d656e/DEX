"use client";

/**
 * QASection — renders a section with its title and all Q&A items.
 *
 * Each Q&A item is rendered as an expandable card with:
 * - The question as a clickable header
 * - The answer with rich formatting (bold, code, line breaks)
 * - An optional callout at the bottom
 * - Smooth expand/collapse animation
 */
import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Callout } from "./callout";
import type { DocSection } from "@/lib/docs-data";

interface QASectionProps {
  section: DocSection;
  defaultOpen?: boolean;
}

/** Render simple markdown-like formatting */
function renderAnswer(text: string): React.ReactNode[] {
  // Split on code blocks first
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    // Inline code
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="text-xs bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Handle bold
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return (
          <strong key={`${i}-${j}`} className="font-semibold text-foreground">
            {bp.slice(2, -2)}
          </strong>
        );
      }
      // Handle line breaks
      const lines = bp.split("\n");
      return lines.map((line, k) => {
        // Handle blockquotes
        if (line.trim().startsWith("> ")) {
          return (
            <div
              key={`${i}-${j}-${k}`}
              className="my-2 pl-3 border-l-2 border-muted-foreground/30 text-muted-foreground italic text-sm"
            >
              {line.trim().slice(2)}
            </div>
          );
        }
        // Handle ordered list items
        if (line.trim().match(/^\d+\.\s/)) {
          return (
            <div key={`${i}-${j}-${k}`} className="flex items-start gap-2 ml-4 my-1">
              <span className="text-blue-400 shrink-0">
                {line.trim().match(/^(\d+)\./)?.[1]}
              </span>
              <span>{line.trim().replace(/^\d+\.\s/, "")}</span>
            </div>
          );
        }
        // Handle unordered list items
        if (line.trim().match(/^[-*]\s/)) {
          return (
            <div key={`${i}-${j}-${k}`} className="flex items-start gap-2 ml-4 my-1">
              <span className="text-blue-400 shrink-0">•</span>
              <span>{line.trim().slice(2)}</span>
            </div>
          );
        }
        if (line.trim() === "") {
          return <div key={`${i}-${j}-${k}`} className="h-2" />;
        }
        return (
          <span key={`${i}-${j}-${k}`}>
            {line}
            {k < lines.length - 1 && <br />}
          </span>
        );
      });
    });
  });
}

/** Render a table header + rows */
function renderTable(header: string[], rows: string[][]): React.ReactNode {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {header.map((h, i) => (
              <th key={i} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-foreground/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function QASection({ section, defaultOpen = true }: QASectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(section.items.map((item) => item.id)),
  );

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Extract tables from answer text (simple parsing)
  const processAnswer = (answer: string) => {
    const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)*)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(answer)) !== null) {
      // Text before the table
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`} className="leading-relaxed">
            {renderAnswer(answer.slice(lastIndex, match.index))}
          </div>,
        );
      }

      // Parse the table
      const header = match[1].split("|").filter((h) => h.trim() !== "").map((h) => h.trim());
      const rows: string[][] = [];
      const rowLines = match[2].trim().split("\n");
      for (const rowLine of rowLines) {
        const row = rowLine.split("|").filter((c) => c.trim() !== "").map((c) => c.trim());
        if (row.length > 0) rows.push(row);
      }
      parts.push(<div key={`table-${match.index}`}>{renderTable(header, rows)}</div>);
      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < answer.length) {
      parts.push(
        <div key={`text-${lastIndex}`} className="leading-relaxed">
          {renderAnswer(answer.slice(lastIndex))}
        </div>,
      );
    }

    return parts.length > 0 ? parts : (
      <div className="leading-relaxed">{renderAnswer(answer)}</div>
    );
  };

  return (
    <div className="space-y-4">
      {section.items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div
            key={item.id}
            id={`qa-${item.id}`}
            className="rounded-xl border border-border overflow-hidden transition-all duration-200 hover:border-border/80"
          >
            {/* Question Header */}
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-card hover:bg-muted/20 transition-colors"
              aria-expanded={isOpen}
            >
              <h3 className="text-sm font-semibold text-foreground leading-relaxed pr-4">
                {item.question}
              </h3>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {/* Answer Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="px-5 pb-5 pt-1 border-t border-border/50">
                <div className="text-sm text-foreground/80 leading-relaxed space-y-2">
                  {processAnswer(item.answer)}
                </div>

                {/* Callout */}
                {item.callout && (
                  <div className="mt-4">
                    <Callout type={item.callout.type}>
                      {item.callout.text}
                    </Callout>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
