export type MarkdownPart =
  | { kind: "markdown"; text: string }
  | { kind: "example"; text: string };

const EXAMPLE_BLOCK =
  /^:::example\s*\n([\s\S]*?)^:::\s*$/gim;

/** Splits markdown so :::example blocks can be rendered in a styled box with full MD support. */
export function splitMarkdownWithExamples(source: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];
  let last = 0;
  const re = new RegExp(EXAMPLE_BLOCK.source, EXAMPLE_BLOCK.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m.index > last) {
      parts.push({ kind: "markdown", text: source.slice(last, m.index) });
    }
    parts.push({ kind: "example", text: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < source.length) {
    parts.push({ kind: "markdown", text: source.slice(last) });
  }
  if (parts.length === 0) {
    parts.push({ kind: "markdown", text: source });
  }
  return parts;
}
