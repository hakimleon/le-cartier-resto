"use client";

import React from "react";

// Inline formatting for bold text
const inlineFormat = (text: string) => {
  if (!text) return "";
  // A simple and safe replacement for **bold** text.
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return safeText;
};

const parseProcedure = (text: string | undefined) => {
  if (!text) return [];

  // Split the entire procedure by the numbered steps (e.g., "1. ", "2. ").
  // The regex uses a positive lookahead to split *before* the pattern, keeping the delimiter.
  const mainSteps = text.split(/(?=\d+\.\s)/).filter(s => s.trim());

  return mainSteps.map(stepBlock => {
    // For each block, find the sub-steps marked with '*'
    const subSteps = stepBlock.split(/\*/).filter(s => s.trim());
    
    // The first item is always the title of the main step.
    const title = subSteps.shift() || '';

    return {
      title: title.trim(),
      subSteps: subSteps.map(s => s.trim()) // The rest are the sub-steps.
    };
  });
};

export default function MarkdownRenderer({ text }: { text: string | undefined }) {
  if (!text) return null;

  const procedure = parseProcedure(text);

  if (procedure.length === 0) {
    // Fallback for text that doesn't match the expected structure
    return <p>{text}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none text-muted-foreground">
      {procedure.map((step, index) => (
        <div key={index} className="mb-4">
          <p 
            className="font-semibold text-foreground/90 mt-4" 
            dangerouslySetInnerHTML={{ __html: inlineFormat(step.title) }} 
          />
          {step.subSteps.length > 0 && (
            <ul className="list-disc list-outside pl-8 mt-2 space-y-1">
              {step.subSteps.map((subStep, subIndex) => (
                <li 
                  key={subIndex} 
                  dangerouslySetInnerHTML={{ __html: inlineFormat(subStep) }} 
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
