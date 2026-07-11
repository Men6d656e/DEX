"use client";

/**
 * DocSidebar — left sidebar navigation for the docs page.
 *
 * Shows all documentation sections with icons.
 * Highlights the currently active section.
 * Includes quick links to external resources.
 */
import { cn } from "@/lib/utils";
import { BookOpen, ExternalLink } from "lucide-react";
import { DOC_SECTIONS } from "@/lib/docs-data";
import type { DocSection } from "@/lib/docs-data";

interface DocSidebarProps {
  currentSection: string;
  onSelectSection: (sectionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function DocSidebar({
  currentSection,
  onSelectSection,
  isOpen,
  onClose,
}: DocSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-16 md:top-24 left-0 z-40 md:z-0",
          "w-64 h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)]",
          "bg-background border-r border-border",
          "transform transition-transform duration-300 ease-in-out",
          "overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Documentation navigation"
      >
        <div className="p-4">
          {/* Section list */}
          <nav className="space-y-1">
            {DOC_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  onSelectSection(section.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                  currentSection === section.id
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent",
                )}
                aria-current={currentSection === section.id ? "page" : undefined}
              >
                <span className="text-base shrink-0">{section.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{section.title}</div>
                  <div className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                    {section.items.length} questions
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* External links */}
          <div className="space-y-1">
            <a
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Back to Dashboard</span>
            </a>
            <a
              href="https://github.com/Men6d656e/DEX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
