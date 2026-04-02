/** Helpers to insert Markdown around the textarea selection or at the cursor. */

function focusRange(
  el: HTMLTextAreaElement,
  start: number,
  end: number
): void {
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start, end);
  });
}

export function wrapSelection(
  textarea: HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void,
  before: string,
  after: string,
  placeholderWhenEmpty: string
): void {
  if (!textarea) {
    setValue(value + before + placeholderWhenEmpty + after);
    return;
  }
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const middle = selected || placeholderWhenEmpty;
  const next =
    value.slice(0, start) + before + middle + after + value.slice(end);
  setValue(next);
  if (selected) {
    focusRange(textarea, start + before.length, start + before.length + selected.length);
  } else {
    const i = start + before.length;
    focusRange(textarea, i, i + placeholderWhenEmpty.length);
  }
}

export function insertSnippet(
  textarea: HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void,
  snippet: string,
  selectInside?: { startOffset: number; endOffset: number }
): void {
  if (!textarea) {
    setValue(value + snippet);
    return;
  }
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const padBefore =
    start > 0 && value[start - 1] !== "\n" && !snippet.startsWith("\n")
      ? "\n"
      : "";
  const padAfter =
    end < value.length && value[end] !== "\n" && !snippet.endsWith("\n")
      ? "\n"
      : "";
  const insertion = padBefore + snippet + padAfter;
  const next = value.slice(0, start) + insertion + value.slice(end);
  setValue(next);
  const insertStart = start + padBefore.length;
  if (selectInside) {
    focusRange(
      textarea,
      insertStart + selectInside.startOffset,
      insertStart + selectInside.endOffset
    );
  } else {
    const pos = insertStart + snippet.length;
    focusRange(textarea, pos, pos);
  }
}

export function prefixCurrentLine(
  textarea: HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void,
  prefix: string
): void {
  if (!textarea) {
    setValue(value + prefix);
    return;
  }
  const pos = textarea.selectionStart;
  const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  const nextNl = value.indexOf("\n", lineStart);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  const line = value.slice(lineStart, lineEnd);
  if (line.startsWith(prefix.trimEnd())) {
    return;
  }
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  setValue(next);
  const newPos = pos + prefix.length;
  focusRange(textarea, newPos, newPos);
}

export function insertLink(
  textarea: HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void
): void {
  if (!textarea) {
    setValue(`${value}[link text](https://)`);
    return;
  }
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const text = selected || "link text";
  const insert = `[${text}](https://)`;
  const next = value.slice(0, start) + insert + value.slice(end);
  setValue(next);
  const urlStart = start + text.length + 3;
  const urlEnd = urlStart + "https://".length;
  focusRange(textarea, urlStart, urlEnd);
}
