
"use client";

import React from 'react';

const MarkdownRenderer = ({ text }: { text: string | undefined }) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
                    {listItems.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="font-semibold mt-4 mb-2 text-lg">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('- ')) {
            listItems.push(trimmedLine.substring(2));
        } else if (trimmedLine === '') {
            flushList();
            elements.push(<br key={`br-${index}`} />);
        } else if (trimmedLine) { // Handle regular paragraphs
            flushList();
            elements.push(<p key={index} className="mb-2 last:mb-0">{trimmedLine}</p>);
        }
    });

    flushList(); // Flush any remaining list items

    return <div className="prose prose-sm max-w-none text-muted-foreground">{elements}</div>;
};

export default MarkdownRenderer;
