
"use client";

import React from "react";

const inlineFormat = (text: string) => {
  if (!text) return "";
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
    if (!md) return [];
    
    // Add a newline before any number followed by a dot, if it's not already at the start of a line.
    let sanitizedMd = md
      .replace(/\r\n/g, "\n")
      .replace(/(\S)(\s*)(\d+\.\s)/g, '$1\n$3') 
      .replace(/\n{2,}/g, '\n');

    const lines = sanitizedMd.split("\n");
    const nodes: MarkdownNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i]?.trim();
        if(!line) {
            i++;
            continue;
        }
        
        const hMatch = line.match(/^(#{1,3})\s*(.*)$/);
        if (hMatch) {
            const level = hMatch[1].length;
            nodes.push({ type: `h${level + 2}`, content: hMatch[2].trim() });
            i++;
            continue;
        }
        
        if (line.match(/^(\d+)\.\s/)) {
            const items: string[] = [];
            while (i < lines.length) {
                const currentLine = lines[i]?.trim();
                const currentMatch = currentLine?.match(/^(\d+)\.\s+(.*)/);
                if (currentMatch) {
                    items.push(currentMatch[2]);
                    i++;
                } else {
                    break;
                }
            }
            nodes.push({ type: "ol", items });
            continue;
        }

        if (line.startsWith("- ")) {
            const items: string[] = [];
            while (i < lines.length && lines[i]?.trim().startsWith("- ")) {
                items.push(lines[i].trim().substring(2));
                i++;
            }
            nodes.push({ type: "ul", items });
            continue;
        }
        
        const paraLines: string[] = [];
        if(line) {
             while (i < lines.length && lines[i]?.trim() && !lines[i].trim().match(/^(#{1,6})\s/) && !lines[i].trim().match(/^(\d+)\.\s/) && !lines[i].trim().startsWith("- ")) {
                paraLines.push(lines[i]);
                i++;
            }
            nodes.push({ type: "p", content: paraLines.join("\n") }); 
            continue;
        }

        i++; 
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
         if (n.type === "ol") {
          return (
            <ol key={idx} className="list-decimal list-inside mb-4 space-y-1.5">
              {n.items?.map((it, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
              ))}
            </ol>
          );
        }
        if (n.type === "p") {
          const contentWithBreaks = inlineFormat(n.content).replace(/\n/g, '<br />');
          return <p key={idx} className="mb-4" dangerouslySetInnerHTML={{ __html: contentWithBreaks }} />;
        }
        return null;
      })}
    </div>
  );
}
