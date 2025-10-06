
"use client";

import React from "react";

const inlineFormat = (text: string) => {
  if (!text) return "";
  // Escape HTML to prevent XSS, then apply formatting
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return safeText;
};

const renderNodes = (lines: string[]) => {
    const elements: React.ReactNode[] = [];
    let currentSubList: string[] | null = null;
    let keyCounter = 0;

    const flushSubList = () => {
        if (currentSubList && currentSubList.length > 0) {
            elements.push(
                <ul key={`ul-${keyCounter++}`} className="list-disc list-outside pl-8 mt-2 space-y-1">
                    {currentSubList.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                    ))}
                </ul>
            );
            currentSubList = null;
        }
    };

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            return; // Ignore empty lines
        }

        if (trimmedLine.match(/^(\d+)\./)) { // This is a main title/step like "1. ..."
            flushSubList();
            elements.push(
                <p key={`p-${keyCounter++}`} className="font-semibold text-foreground/90 mt-4" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmedLine) }} />
            );
        } else if (trimmedLine.startsWith('*')) { // This is a sub-list item
            if (currentSubList === null) {
                currentSubList = [];
            }
            currentSubList.push(trimmedLine.substring(1).trim());
        } else { // This is a continuation of the previous line or a simple paragraph
             flushSubList();
             elements.push(<p key={`p-${keyCounter++}`} dangerouslySetInnerHTML={{ __html: inlineFormat(trimmedLine)}} />);
        }
    });

    flushSubList(); // Flush any remaining list at the end
    return elements;
}


export default function MarkdownRenderer({ text }: { text: string | undefined }) {
  if (!text) return null;

  // Split by newlines to process line by line
  const lines = text.split('\n');
  const nodes = renderNodes(lines);

  return (
    <div className="prose prose-sm max-w-none text-muted-foreground">
      {nodes}
    </div>
  );
}
