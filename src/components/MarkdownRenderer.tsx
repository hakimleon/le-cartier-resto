
"use client";

import React from 'react';

const MarkdownRenderer = ({ text }: { text: string | undefined }) => {
    if (!text) return null;

    // Replace Markdown-like syntax with HTML tags
    const formattedText = text
        .replace(/### (.*)/g, '<h3 class="font-semibold mt-4 mb-2 text-lg">$1</h3>')
        .replace(/^- (.*)/gm, '<li class="ml-5 list-disc">$1</li>')
        // Wrap list items in a ul
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        // Consolidate multiple lists
        .replace(/<\/ul>\s*<ul>/g, '');


    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
};

export default MarkdownRenderer;
