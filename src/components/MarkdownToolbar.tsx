"use client";

import type { RefObject } from "react";
import {
  insertLink,
  insertSnippet,
  prefixCurrentLine,
  wrapSelection,
} from "@/lib/markdown-insert";

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  setValue: (v: string) => void;
};

type BtnProps = {
  label: string;
  title: string;
  onClick: () => void;
};

function ToolBtn({ label, title, onClick }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100"
    >
      {label}
    </button>
  );
}

export function MarkdownToolbar({ textareaRef, value, setValue }: Props) {
  const ta = () => textareaRef.current;

  return (
    <div
      className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2"
      role="toolbar"
      aria-label="Markdown formatting"
    >
      <ToolBtn
        label="Bold"
        title="Bold (**text**)"
        onClick={() =>
          wrapSelection(ta(), value, setValue, "**", "**", "bold text")
        }
      />
      <ToolBtn
        label="Italic"
        title="Italic (*text*)"
        onClick={() =>
          wrapSelection(ta(), value, setValue, "*", "*", "italic")
        }
      />
      <ToolBtn
        label="Code"
        title="Inline code (`code`)"
        onClick={() =>
          wrapSelection(ta(), value, setValue, "`", "`", "code")
        }
      />
      <ToolBtn
        label="H2"
        title="Heading level 2"
        onClick={() => prefixCurrentLine(ta(), value, setValue, "## ")}
      />
      <ToolBtn
        label="• List"
        title="Bullet list item"
        onClick={() => prefixCurrentLine(ta(), value, setValue, "- ")}
      />
      <ToolBtn
        label="1."
        title="Numbered list item"
        onClick={() => prefixCurrentLine(ta(), value, setValue, "1. ")}
      />
      <ToolBtn
        label="Quote"
        title="Blockquote"
        onClick={() => prefixCurrentLine(ta(), value, setValue, "> ")}
      />
      <ToolBtn
        label="Link"
        title="Insert link [text](https://)"
        onClick={() => insertLink(ta(), value, setValue)}
      />
      <ToolBtn
        label="---"
        title="Horizontal rule"
        onClick={() => insertSnippet(ta(), value, setValue, "\n---\n")}
      />
      <ToolBtn
        label="{ }"
        title="Code block"
        onClick={() =>
          insertSnippet(ta(), value, setValue, "```\n\n```", {
            startOffset: 4,
            endOffset: 4,
          })
        }
      />
      <ToolBtn
        label="Example"
        title="Example box (:::example … :::) "
        onClick={() =>
          insertSnippet(ta(), value, setValue, ":::example\n\n:::\n", {
            startOffset: 11,
            endOffset: 11,
          })
        }
      />
    </div>
  );
}
