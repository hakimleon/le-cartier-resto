"use client";

import React from "react";

const inlineFormat = (text: string) => {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let t = esc(text);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return t;
};

type MarkdownNode = {
    type: string;
    content?: any;
    items?: string[];
    level?: number;
}

function parseMarkdown(md: string): MarkdownNode[] {
  md = md.replace(/\r\n/g, "\n");
  md = md.replace(/([^\n])(?=###\s)/g, "$1\n");

  const lines = md.split("\n");
  const nodes: MarkdownNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    const hMatch = line.match(/^(#{1,6})\s*(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      nodes.push({ type: `h${level}`, content: hMatch[2].trim() });
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("- ")) {
        items.push(lines[j].trim().replace(/^-\s+/, ""));
        j++;
      }
      nodes.push({ type: "ul", items });
      i = j;
      continue;
    }
    let j = i;
    const paraLines: string[] = [];
    while (j < lines.length) {
      const l = lines[j].trim();
      if (!l || l.match(/^(#{1,6})\s/) || l.startsWith("- ")) break;
      paraLines.push(l);
      j++;
    }
    nodes.push({ type: "p", content: paraLines.join(" ") });
    i = j;
  }
  return nodes;
}

export default function MarkdownRenderer({ text }: { text: string | undefined }) {
  if (!text) return null;
  const nodes = parseMarkdown(text);
  return (
    <div className="prose prose-sm max-w-none text-muted-foreground">
      {nodes.map((n, idx) => {
        if (n.type && n.type.startsWith("h")) {
          const Tag = n.type as keyof JSX.IntrinsicElements;
          return (
            <Tag key={idx} className="mt-4 mb-2 font-semibold text-foreground/90">
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(n.content) }} />
            </Tag>
          );
        }
        if (n.type === "ul") {
          return (
            <ul key={idx} className="list-disc list-inside mb-4 space-y-1">
              {n.items?.map((it, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
              ))}
            </ul>
          );
        }
        if (n.type === "p") {
          return <p key={idx} className="mb-4" dangerouslySetInnerHTML={{ __html: inlineFormat(n.content) }} />;
        }
        return null;
      })}
    </div>
  );
}