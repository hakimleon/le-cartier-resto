"use client";

import React from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownRenderer({ text }: { text: string | undefined }) {
  if (!text) return null;

  // Pre-process the text to ensure newlines before block elements.
  // This is crucial for the regex in renderMarkdown to work correctly,
  // especially when the source text is a single line.
  const processedText = text
    .replace(/\s*#\s*/g, "\n\n# ") // Headings
    .replace(/(\d+\.)/g, "\n$1")   // Numbered lists
    .replace(/\s*\*\s*/g, "\n* ");  // Bulleted lists

  const html = renderMarkdown(processedText);

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}