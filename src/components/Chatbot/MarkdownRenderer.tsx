// src/components/Chatbot/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './markdown-styles.css';

interface MarkdownRendererProps {
  content: string;
  isBot?: boolean;
}

/**
 * Custom Markdown renderer for chat messages
 * Supports: bold, italic, headings, lists, code blocks, links, blockquotes, etc.
 * Handles incremental streaming (partial Markdown gets rendered progressively)
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isBot = true,
}) => {
  return (
    <div className={`markdown-content ${isBot ? 'bot-markdown' : 'user-markdown'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-3 mb-2 text-gray-900" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-3 mb-2 text-gray-800" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-2 mb-1 text-gray-800" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mt-2 mb-1 text-gray-700" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-semibold mt-2 mb-1 text-gray-700" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
          ),

          // Bold text
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),

          // Italic text
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Unordered lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 ml-2" {...props} />
          ),

          // Ordered lists
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 ml-2" {...props} />
          ),

          // List items
          li: ({ node, ...props }) => (
            <li className="text-gray-800 leading-relaxed" {...props} />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 py-2 my-2 italic text-gray-700 bg-gray-50 rounded-r"
              {...props}
            />
          ),

          // Inline code
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return !inline && language ? (
              // Code block with syntax highlighting
              <div className="my-3 rounded-lg overflow-hidden">
                <div className="bg-gray-800 text-gray-200 px-4 py-2 text-xs font-mono">
                  {language}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="!mt-0 !mb-0"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              // Inline code
              <code
                className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Pre (for code blocks without language)
          pre: ({ node, ...props }) => (
            <pre
              className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2 text-sm font-mono"
              {...props}
            />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-t border-gray-300" {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-gray-300" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr className="border-b border-gray-300" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-4 py-2" {...props} />
          ),

          // Images
          img: ({ node, ...props }) => (
            <img
              className="max-w-full h-auto rounded-lg my-2"
              loading="lazy"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
