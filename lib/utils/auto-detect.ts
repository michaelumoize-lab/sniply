export type SnippetType = "code" | "terminal" | "sql" | "prompt" | "regex" | "text" | "other";

export interface DetectionResult {
  type: SnippetType;
  language: string | null;
  confidence: "high" | "medium" | "low";
}

const TERMINAL_COMMANDS = [
  "git", "docker", "npm", "pnpm", "yarn", "bun", "npx",
  "pip", "pip3", "python -m", "brew", "cargo", "apt", "apt-get",
  "systemctl", "curl", "wget", "chmod", "chown", "sudo", "export",
  "grep", "awk", "sed", "find", "ssh", "scp", "rsync", "kubectl"
];

const SQL_KEYWORDS = [
  "SELECT", "INSERT INTO", "UPDATE", "DELETE FROM", "CREATE TABLE",
  "ALTER TABLE", "DROP TABLE", "CREATE INDEX", "BEGIN TRANSACTION", "WITH"
];

const AI_PROMPT_PHRASES = [
  "act as", "you are a", "you are an expert", "explain how",
  "refactor the following", "review this code", "write a unit test",
  "generate a regex", "summarize", "find potential race conditions",
  "suggest improvements", "write a function that"
];

/**
 * Detects type and programming language from snippet content.
 */
export function detectSnippetMetadata(content: string): DetectionResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { type: "code", language: null, confidence: "low" };
  }

  // 1. JSON check (strict validation)
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      return { type: "code", language: "json", confidence: "high" };
    } catch {
      // Not valid JSON, continue checks
    }
  }

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "";
  const firstLineLower = firstLine.toLowerCase();

  // 2. Terminal / Shell command check
  const isPromptLeading = firstLine.startsWith("$ ") || firstLine.startsWith("> ");
  const strippedFirstLine = isPromptLeading ? firstLine.slice(2).trim() : firstLine;
  const firstWord = strippedFirstLine.split(/\s+/)[0]?.toLowerCase();

  if (firstWord && TERMINAL_COMMANDS.includes(firstWord)) {
    return { type: "terminal", language: "bash", confidence: "high" };
  }

  if (strippedFirstLine.startsWith("#!/bin/bash") || strippedFirstLine.startsWith("#!/bin/sh")) {
    return { type: "terminal", language: "bash", confidence: "high" };
  }

  // 3. SQL check
  const firstWordsUpper = strippedFirstLine.toUpperCase();
  for (const sqlKeyword of SQL_KEYWORDS) {
    if (firstWordsUpper.startsWith(sqlKeyword)) {
      return { type: "sql", language: "sql", confidence: "high" };
    }
  }

  // 4. Regex check
  if (/^\/[^/\n]+\/[gimsuy]*$/.test(trimmed) || (/^\^/.test(trimmed) && trimmed.length < 200 && /[+*?{}\[\]\\]/.test(trimmed))) {
    return { type: "regex", language: "regex", confidence: "high" };
  }

  // 5. AI Prompt check
  const contentLower = trimmed.toLowerCase();
  for (const phrase of AI_PROMPT_PHRASES) {
    if (contentLower.includes(phrase)) {
      return { type: "prompt", language: "markdown", confidence: "high" };
    }
  }

  // 6. Python check
  if (
    /^(def |import |from \w+ import|class \w+:|if __name__ ==)/m.test(trimmed) ||
    /:\s*$\s*^\s+/m.test(trimmed)
  ) {
    return { type: "code", language: "python", confidence: "high" };
  }

  // 7. TypeScript / JavaScript check
  if (
    /^(import .* from ['"]|export (default |const |function |class |type |interface )|const \w+ =|let \w+ =)/m.test(trimmed) ||
    trimmed.includes("console.log(") ||
    trimmed.includes("=> {")
  ) {
    const isTs = /:\s*(string|number|boolean|any|void|\w+\[\])|interface\s+\w+|type\s+\w+\s*=/.test(trimmed);
    return { type: "code", language: isTs ? "typescript" : "javascript", confidence: "high" };
  }

  // 8. HTML check
  if (/^<!DOCTYPE html>|^<html|^<div|^<template/i.test(trimmed)) {
    return { type: "code", language: "html", confidence: "high" };
  }

  // 9. Dockerfile / YAML check
  if (/^FROM \w+|^RUN \w+|^COPY \w+|^ENTRYPOINT /m.test(trimmed)) {
    return { type: "code", language: "dockerfile", confidence: "high" };
  }
  if (/^version:\s*['"]?\d/m.test(trimmed) || /^services:\s*$/m.test(trimmed) || /^apiVersion:\s*/m.test(trimmed)) {
    return { type: "code", language: "yaml", confidence: "high" };
  }

  // 10. General text vs code fallback
  if (lines.length > 2 && !/[{}[\];=><]/.test(trimmed) && trimmed.includes(". ")) {
    return { type: "text", language: "markdown", confidence: "medium" };
  }

  return { type: "code", language: null, confidence: "low" };
}
