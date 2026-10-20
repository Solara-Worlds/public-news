# Solara Worlds news

This repository is the public news feed and the Community Standards text for the Solara Worlds launcher. It does not contain the launcher, game clients, or any secret.

The launcher reads these URLs with no credentials:

| File | URL |
| --- | --- |
| News | `https://raw.githubusercontent.com/Solara-Worlds/public-news/main/news.json` |
| Standards manifest | `https://raw.githubusercontent.com/Solara-Worlds/public-news/main/standards.json` |
| Standards text | `https://raw.githubusercontent.com/Solara-Worlds/public-news/main/community-standards.md` |

Images live under `images/` and are loaded from the same `main/` prefix. A change on `main` shows up in the launcher without a new application release. The launcher also ships a copy of the standards for offline use and keeps the last news document that parsed.

## Post a news item

1. Add an image under `images/` if the card needs one. The name is `images/<file>.png`, `.jpg`, `.jpeg`, or `.webp`. Letters, digits, `.`, `_`, and `-` only. No `..`.
2. Add an object to the top of `items` in `news.json`.
3. Open a pull request. The **Validate news** workflow runs `node scripts/validate-news.mjs`.
4. Merge to `main`.

`schemaVersion` stays `1`. At most 50 items.

| Field | Rule |
| --- | --- |
| `id` | Unique. 1–64 characters, `[a-z0-9-]`, starting with a letter or digit. |
| `title` | 1–140 characters. No `<`, `>`, or control characters. |
| `date` | `YYYY-MM-DD`. |
| `summary` | 1–600 characters, same plain-text rule as the title. |
| `image` | Optional. A file under `images/` as above. |
| `link` | Optional. `https` only. No username or password in the URL. The launcher opens it in the system browser. |
| `games` | Optional. Game ids. Omit or use `[]` to show the card for every game. World of Warcraft is `wow-335a`. |
| `standards` | Required. `version`, `updated`, and `path` must match `standards.json`. |

Do not put HTML in a title or summary. The launcher rejects the whole document, and players keep the previous cached copy.

`schema/news.schema.json` is the shape, for people reading the repo. The script is what CI runs. It also checks that each image file exists.

The sample item `welcome` uses `images/welcome.png`, which is the Solara Worlds mark.

## Update the Community Standards

The launcher sidebar opens this text in a dialog. It fetches `standards.json`, then `community-standards.md`, and falls back to the copy bundled in the app when the fetch fails or the bundled version is newer.

`standards.json`:

```json
{
  "schemaVersion": 1,
  "version": 2,
  "updated": "2026-10-19",
  "title": "Solara Worlds Community Standards",
  "path": "community-standards.md"
}
```

`path` has to stay `community-standards.md`. The launcher will not follow a different path.

To publish a new revision:

1. Replace `community-standards.md`. If the source is the Word document, convert it with `scripts/import-community-standards.py` in the `game-launcher` repository. That script copies the words and only adds Markdown headings, lists, emphasis, and links. Do not reword the document.
2. Add 1 to `version`. Set `updated` to the day you publish (`YYYY-MM-DD`).
3. Put the same `version`, `updated`, and `path` in `news.json` under `standards`.
4. Open a pull request. CI checks that the two files agree, that the Markdown is under 200000 characters, and that it has no null bytes, `<script`, or `javascript:`.
5. Merge to `main`.

Players who have already opened an older version see an **Updated** label until they open the dialog. No launcher release is required for the online copy. Copy the same Markdown and `standards.json` into `game-launcher/resources/` when you want a new install to have the text offline.

## What is in the text today

`community-standards.md` is the import of the Solara Worlds Terms of Service & Community Standards, effective October 19, 2026. `standards.json` is version 2, updated `2026-10-19`. `news.json` includes that pointer and the `welcome` post.

## What this repository is not

It is not a place for launcher builds. Those go to [Solara-Worlds/public-release](https://github.com/Solara-Worlds/public-release). It is not a private repo: the launcher cannot send a token, so everything here is public.
