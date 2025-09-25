
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
    type: 'h3' | 'p' | 'ol' | 'ul';
    content?: string;
    items?: string[];
}

function parseMarkdown(md: string | undefined): MarkdownNode[] {
    if (!md) return [];

    const nodes: MarkdownNode[] = [];
    const lines = md.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim() !== '');

    let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null;

    const flushList = () => {
        if (currentList) {
            nodes.push(currentList);
            currentList = null;
        }
    };

    for (const line of lines) {
        // ### Titres
        const h3Match = line.match(/^###\s+(.*)/);
        if (h3Match) {
            flushList();
            nodes.push({ type: 'h3', content: h3Match[1] });
            continue;
        }

        // Titres comme "Preparation:" ou "Cuisson :"
        const titleMatch = line.match(/^([a-zA-Z\s]+):(.*)/);
        if (titleMatch && titleMatch[1].length < 30) {
             flushList();
             nodes.push({ type: 'h3', content: titleMatch[1] });
             if(titleMatch[2].trim()){
                nodes.push({ type: 'p', content: titleMatch[2].trim() });
             }
             continue;
        }

        // Listes ordonnées
        const olMatch = line.match(/^\d+\.\s+(.*)/);
        if (olMatch) {
            if (currentList?.type !== 'ol') {
                flushList();
                currentList = { type: 'ol', items: [] };
            }
            currentList.items.push(olMatch[1]);
            continue;
        }

        // Listes non-ordonnées
        const ulMatch = line.match(/^-\s+(.*)/);
        if (ulMatch) {
            if (currentList?.type !== 'ul') {
                flushList();
                currentList = { type: 'ul', items: [] };
            }
            currentList.items.push(ulMatch[1]);
            continue;
        }

        // Sinon, c'est un paragraphe
        flushList();
        nodes.push({ type: 'p', content: line });
    }

    flushList(); // S'assurer que la dernière liste est ajoutée

    return nodes;
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
              <ol key={idx} className="list-decimal list-outside pl-6 my-2 space-y-1.5">
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
