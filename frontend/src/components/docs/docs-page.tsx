"use client";

/**
 * DocsPage — the main documentation page with a three-panel layout.
 *
 * Layout:
 * ┌──────────────┬─────────────────────┬──────────────┐
 * │  Left        │  Center             │  Right       │
 * │  Sidebar     │  (Content)          │  TOC         │
 * │  (Nav)       │                     │  (Quick nav) │
 * └──────────────┴─────────────────────┴──────────────┘
 *
 * Features:
 * - Section switching via sidebar
 * - Full-text search across all Q&A items
 * - Expandable/collapsible Q&A cards
 * - Right sidebar TOC with scroll tracking
 * - Responsive: sidebar becomes hamburger on mobile
 */
import { useState, useCallback } from "react";
import { Menu, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOC_SECTIONS, getSection } from "@/lib/docs-data";
import { DocSidebar } from "./docs-sidebar";
import { DocTOC } from "./docs-toc";
import { DocsSearch } from "./docs-search";
import { QASection } from "./qa-section";
import { Callout } from "./callout";

interface DocsPageProps {
  initialSection?: string;
}

export function DocsPage({ initialSection = "about" }: DocsPageProps) {
  const [currentSectionId, setCurrentSectionId] = useState(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentSection = getSection(currentSectionId);

  const handleSelectSection = useCallback((sectionId: string) => {
    setCurrentSectionId(sectionId);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectQuestion = useCallback((questionId: string) => {
    const el = document.getElementById(`qa-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // Open the item by clicking it
      const button = el.querySelector("button");
      if (button && button.getAttribute("aria-expanded") !== "true") {
        button.click();
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header Bar ── */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden h-8 w-8 shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>

            {/* Section indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {currentSection && (
                <>
                  <span className="text-lg shrink-0">{currentSection.icon}</span>
                  <h1 className="text-sm font-semibold text-foreground truncate">
                    {currentSection.title}
                  </h1>
                </>
              )}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md hidden sm:block">
              <DocsSearch
                onSelectSection={handleSelectSection}
                onSelectQuestion={handleSelectQuestion}
                currentSection={currentSectionId}
              />
            </div>

            {/* Mobile search toggle spacer */}
            <div className="sm:hidden w-8" />
          </div>
        </div>
      </div>

      {/* ── Mobile Search Bar ── */}
      <div className="sm:hidden border-b border-border px-4 py-3">
        <DocsSearch
          onSelectSection={handleSelectSection}
          onSelectQuestion={handleSelectQuestion}
          currentSection={currentSectionId}
        />
      </div>

      {/* ── Three-Panel Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0">
        {/* Left Sidebar */}
        <DocSidebar
          currentSection={currentSectionId}
          onSelectSection={handleSelectSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Center Content */}
        <main className="flex-1 min-w-0 py-8 md:py-10 px-0 md:px-8 xl:px-10">
          {currentSection ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Section Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currentSection.icon}</span>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    {currentSection.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentSection.description}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Q&A Content */}
              <QASection section={currentSection} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <Callout type="warning">
                Section not found. Please select a section from the sidebar.
              </Callout>
            </div>
          )}
        </main>

        {/* Right TOC */}
        {currentSection && currentSection.items.length > 0 && (
          <DocTOC section={currentSection} />
        )}
      </div>
    </div>
  );
}
