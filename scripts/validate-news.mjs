#!/usr/bin/env node
/**
 * Check news.json, standards.json, and community-standards.md.
 * The launcher's src/core/news/parse.ts and src/core/standards/document.ts
 * apply the same limits. This script is the copy that runs without that repo.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relative) {
  const file = path.join(root, relative);
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    fail(`${relative} is missing.`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relative} is not JSON (${error instanceof Error ? error.message : "parse error"}).`);
    return null;
  }
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function plain(value, min, max) {
  return typeof value === "string" && value.length >= min && value.length <= max && !/[<>\u0000-\u001f]/.test(value);
}

const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
const imagePattern = /^images\/[A-Za-z0-9][A-Za-z0-9._-]{0,80}\.(png|jpe?g|webp)$/;

function checkPointer(pointer, label) {
  if (!pointer || typeof pointer !== "object") {
    fail(`${label} is missing.`);
    return null;
  }
  if (!Number.isInteger(pointer.version) || pointer.version < 1 || pointer.version > 100_000) {
    fail(`${label}.version must be an integer from 1 to 100000.`);
  }
  if (typeof pointer.updated !== "string" || !isIsoDate(pointer.updated)) {
    fail(`${label}.updated must be a real YYYY-MM-DD date.`);
  }
  if (pointer.path !== "community-standards.md") {
    fail(`${label}.path must be community-standards.md.`);
  }
  return pointer;
}

const standards = readJson("standards.json");
if (standards) {
  if (standards.schemaVersion !== 1) fail("standards.json schemaVersion must be 1.");
  if (!plain(standards.title, 1, 120)) fail("standards.json title must be plain text, 1 to 120 characters.");
  checkPointer(standards, "standards.json");
  for (const key of Object.keys(standards)) {
    if (!["schemaVersion", "version", "updated", "title", "path"].includes(key)) {
      fail(`standards.json has unexpected field ${key}.`);
    }
  }
}

const markdownPath = path.join(root, "community-standards.md");
if (!fs.existsSync(markdownPath)) {
  fail("community-standards.md is missing.");
} else {
  const markdown = fs.readFileSync(markdownPath, "utf8");
  if (markdown.length === 0) fail("community-standards.md is empty.");
  if (markdown.length > 200_000) fail("community-standards.md is larger than 200000 characters.");
  if (markdown.includes("\0")) fail("community-standards.md contains a null byte.");
  if (/<script/i.test(markdown)) fail("community-standards.md contains a script tag.");
  if (/javascript:/i.test(markdown)) fail("community-standards.md contains a javascript: URL.");
}

const news = readJson("news.json");
if (news) {
  if (news.schemaVersion !== 1) fail("news.json schemaVersion must be 1.");
  const pointer = checkPointer(news.standards, "news.json standards");
  if (standards && pointer && standards.version !== undefined) {
    if (pointer.version !== standards.version || pointer.updated !== standards.updated || pointer.path !== standards.path) {
      fail("news.json standards must match version, updated, and path in standards.json.");
    }
  }
  if (!Array.isArray(news.items) || news.items.length > 50) {
    fail("news.json items must be an array of at most 50 entries.");
  } else {
    const seen = new Set();
    for (const [index, item] of news.items.entries()) {
      const where = `items[${index}]`;
      if (!item || typeof item !== "object") {
        fail(`${where} is not an object.`);
        continue;
      }
      if (typeof item.id !== "string" || !idPattern.test(item.id)) fail(`${where}.id is invalid.`);
      if (seen.has(item.id)) fail(`${where}.id is duplicated.`);
      seen.add(item.id);
      if (!plain(item.title, 1, 140)) fail(`${where}.title must be plain text, 1 to 140 characters.`);
      if (typeof item.date !== "string" || !isIsoDate(item.date)) fail(`${where}.date must be a real YYYY-MM-DD date.`);
      if (!plain(item.summary, 1, 600)) fail(`${where}.summary must be plain text, 1 to 600 characters.`);
      if (item.image !== undefined) {
        if (typeof item.image !== "string" || !imagePattern.test(item.image) || item.image.includes("..")) {
          fail(`${where}.image must be images/<file>.png, .jpg, .jpeg, or .webp.`);
        } else if (!fs.existsSync(path.join(root, item.image))) {
          fail(`${where}.image file ${item.image} does not exist.`);
        }
      }
      if (item.link !== undefined) {
        let url;
        try {
          url = new URL(item.link);
        } catch {
          url = null;
        }
        if (!url || url.protocol !== "https:" || url.username || url.password) {
          fail(`${where}.link must be an https URL with no username or password.`);
        }
      }
      if (item.games !== undefined) {
        if (!Array.isArray(item.games) || item.games.length > 12 || item.games.some((game) => typeof game !== "string" || !idPattern.test(game))) {
          fail(`${where}.games must be an array of ids, at most 12.`);
        }
      }
    }
  }
}

for (const schema of ["schema/news.schema.json", "schema/standards.schema.json", "schema/standards-pointer.schema.json"]) {
  readJson(schema);
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log("news.json, standards.json, and community-standards.md match the feed rules.");
