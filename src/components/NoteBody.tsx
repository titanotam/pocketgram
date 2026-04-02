"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitMarkdownWithExamples } from "@/lib/markdown";

type Props = {
  markdown: string;
};

const mdComponents: Components = {
  img: ({ src, alt, ...rest }) => (
    <img
      {...rest}
      src={src}
      alt={alt ?? ""}
      className="my-4 max-w-full rounded-lg border border-gray-200"
    />
  ),
};

export function NoteBody({ markdown }: Props) {
  const parts = splitMarkdownWithExamples(markdown);
  const remarkPlugins = [remarkGfm];

  return (
    <div className="prose prose-gray-900 max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:text-gray-900 prose-a:underline prose-code:text-gray-900 prose-pre:bg-gray-100">
      {parts.map((part, i) =>
        part.kind === "markdown" ? (
          <ReactMarkdown
            key={i}
            remarkPlugins={remarkPlugins}
            components={mdComponents}
          >
            {part.text}
          </ReactMarkdown>
        ) : (
          <aside
            key={i}
            className="not-prose my-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-600">
              Example
            </p>
            <div className="prose prose-sm prose-gray-900 max-w-none prose-p:my-2 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:font-semibold prose-img:rounded-lg prose-img:border prose-img:border-gray-200">
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                components={mdComponents}
              >
                {part.text}
              </ReactMarkdown>
            </div>
          </aside>
        )
      )}
    </div>
  );
}
