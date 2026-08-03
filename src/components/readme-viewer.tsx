"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function resolveUrl(src: string | undefined, base: string): string {
  if (!src) return "";
  if (/^(https?:|data:)/i.test(src)) return src;
  const branch = base.split("/").pop() ?? "main";
  const repoPath = base.split("/").slice(0, 2).join("/");
  const clean = src.replace(/^\.\//, "");
  return `https://raw.githubusercontent.com/${repoPath}/${branch}/${clean}`;
}

export function ReadmeViewer({
  readme,
  repoFullName,
  defaultBranch,
}: {
  readme: string;
  repoFullName: string;
  defaultBranch: string;
}) {
  const base = `${repoFullName}/${defaultBranch}`;

  return (
    <div className="readme-viewer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0969da] hover:underline dark:text-[#4493f8]"
              {...props}
            >
              {children}
            </a>
          ),
          h1: ({ children, ...props }) => (
            <h1
              className="border-b pb-2 text-2xl font-semibold tracking-tight"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="border-b pb-1 pt-6 text-xl font-semibold tracking-tight"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="pt-4 text-lg font-semibold" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="pt-3 text-base font-semibold" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="my-4 leading-7" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="my-4 list-disc space-y-1 pl-8" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-4 list-decimal space-y-1 pl-8" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-7" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-[#d0d7de] pl-4 text-[#57606a] dark:border-[#3d444d] dark:text-[#9198a1]"
              {...props}
            >
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <code
                className={`${className} block overflow-x-auto rounded-lg border border-[#d0d7de] p-4 text-[13px] leading-6 dark:border-[#3d444d]`}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className="rounded bg-[#eaeef2] px-1.5 py-0.5 font-mono text-[0.85em] text-[#1f2328] dark:bg-[#2d333b] dark:text-[#e6edf3]"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className="w-full border-collapse border border-[#d0d7de] text-sm dark:border-[#3d444d]"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-left font-semibold dark:border-[#3d444d] dark:bg-[#21262d]"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="border border-[#d0d7de] px-3 py-1.5 align-top dark:border-[#3d444d]"
              {...props}
            >
              {children}
            </td>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === "string" ? resolveUrl(src, base) : undefined}
              alt={alt ?? ""}
              className="my-4 max-w-full rounded-md"
              loading="lazy"
            />
          ),
          input: ({ checked, disabled, type }) =>
            type === "checkbox" ? (
              <input
                type="checkbox"
                checked={!!checked}
                disabled={!!disabled}
                readOnly
                className="mr-2 inline-block translate-y-[1px] accent-[#0969da] dark:accent-[#4493f8]"
              />
            ) : (
              <input type={type} disabled={disabled} />
            ),
          hr: () => <hr className="my-6 border-[#d0d7de] dark:border-[#3d444d]" />,
        }}
      >
        {readme}
      </ReactMarkdown>
    </div>
  );
}
