import { assertEquals } from "@std/assert";
import { indentLines } from "./indentLines.ts";

Deno.test("indentLines", () => {
  const text = "line1\nline2\nline3";
  const indented = indentLines(text, ">>");
  assertEquals(indented, ">>line1\n>>line2\n>>line3");
});

Deno.test("indentLines ignores empty lines", () => {
  const text = "line1\n\nline3\n";
  const indented = indentLines(text, ">>");
  assertEquals(indented, ">>line1\n\n>>line3\n");
});
