
"use client";

import React from "react";

const inlineFormat = (text: string) => {
  if (!text) return "";
  // Basic formatting for bold and italics
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let t = esc(text);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return t;
};

type MarkdownNode = {
    type: 'h3' | 'p' | 'ol' | 'ul';
    content?: string;
    items?: string[];
}

function parseMarkdown(md: string | undefined): MarkdownNode[] {
    if (!md) return [];

    const nodes: MarkdownNode[] = [];
    // Split by '### ' but keep the delimiter
    const sections = md.split(/(?=###\s)/g).map(s => s.trim()).filter(Boolean);

    sections.forEach(section => {
        if (section.startsWith('### ')) {
            const contentWithoutHeader = section.substring(4);
            const [header, ...restOfContent] = contentWithoutHeader.split('\n');
            nodes.push({ type: 'h3', content: header });
            parseSectionContent(restOfContent.join('\n'), nodes);
        } else {
            parseSectionContent(section, nodes);
        }
    });

    return nodes;
}

function parseSectionContent(content: string, nodes: MarkdownNode[]) {
    if (!content) return;
    const lines = content.split('\n');
    let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null;

    const flushList = () => {
        if (currentList) {
            nodes.push(currentList);
            currentList = null;
        }
    };

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Ignore empty lines

        const olMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
        const ulMatch = trimmedLine.match(/^-\s+(.*)/);

        if (olMatch) {
            if (currentList?.type !== 'ol') {
                flushList();
                currentList = { type: 'ol', items: [] };
            }
            currentList.items.push(olMatch[2]);
            continue;
        }

        if (ulMatch) {
            if (currentList?.type !== 'ul') {
                flushList();
                currentList = { type: 'ul', items: [] };
            }
            currentList.items.push(ulMatch[1]);
            continue;
        }
        
        // If it's not a list item, flush any existing list and treat it as a paragraph
        flushList();
        nodes.push({ type: 'p', content: trimmedLine });
    }

    flushList(); // Flush any remaining list items at the end
}


export default function MarkdownRenderer({ text }: { text: string | undefined }) {
  if (!text) return null;
  const nodes = parseMarkdown(text);
  
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground">
      {nodes.map((node, idx) => {
        switch (node.type) {
          case 'h3':
            return (
              <h3 key={idx} className="mt-4 mb-2 font-semibold text-foreground/90 text-base" dangerouslySetInnerHTML={{ __html: inlineFormat(node.content || '') }} />
            );
          case 'p':
            return (
              <p key={idx} className="mb-2" dangerouslySetInnerHTML={{ __html: inlineFormat(node.content || '') }} />
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal list-outside pl-6 my-2 space-y-2">
                {node.items?.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                ))}
              </ol>
            );
          case 'ul':
            return (
              <ul key={idx} className="list-disc list-outside pl-6 my-2 space-y-1">
                {node.items?.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
