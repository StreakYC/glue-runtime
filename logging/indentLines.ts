export function indentLines(text: string, indent: string = "  "): string {
  return text.split("\n").map((line) => (line ? indent + line : line)).join("\n");
}
