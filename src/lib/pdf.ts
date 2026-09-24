/**
 * 「本」の PDF 生成（企画書 5-2）。
 * expo-print で HTML を印刷業界標準に寄せたページサイズの PDF に変換する。
 * トリムサイズは自費出版でよく使われる A5 相当（148×210mm）を採用。
 * 無線綴じを見越して内側に寄せず、左右対称の余裕あるマージンにしている
 * （実際に紙へ発注する際は印刷会社の指定に合わせて再生成すればよい）。
 */
import * as Print from 'expo-print';
import { Directory, File, Paths } from 'expo-file-system';

import { formatLongJa } from './date';
import { CONTENT_CATEGORIES, type EntryWithRelations } from './entries';
import { newId } from './ids';
import { toEmbeddableUri } from './media';

const MM_TO_PT = 2.8346;
export const PAGE_WIDTH = Math.round(148 * MM_TO_PT); // 420pt
export const PAGE_HEIGHT = Math.round(210 * MM_TO_PT); // 595pt
export const PAGE_MARGIN = { top: 56, bottom: 56, left: 48, right: 48 };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bodyToHtml(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return '<p class="empty">（本文なし）</p>';
  return trimmed
    .split('\n')
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p>&nbsp;</p>'))
    .join('');
}

async function entryToHtml(entry: EntryWithRelations): Promise<string> {
  const photos = entry.media.length
    ? `<div class="photos">${(
        await Promise.all(
          entry.media.map(async (m) => {
            const src = await toEmbeddableUri(m.local_uri, m.remote_url);
            return `<img src="${src}" />`;
          }),
        )
      ).join('')}</div>`
    : '';

  const tags = entry.content.length
    ? `<div class="tags">${entry.content
        .map((c) => {
          const cat = CONTENT_CATEGORIES.find((x) => x.key === c.category);
          return `<span class="tag">${escapeHtml(cat?.label ?? '')}: ${escapeHtml(c.title)}</span>`;
        })
        .join('')}</div>`
    : '';

  return `<section class="entry">
    <h2>${formatLongJa(entry.entry_date)}</h2>
    <div class="body">${bodyToHtml(entry.body)}</div>
    ${photos}
    ${tags}
  </section>`;
}

export interface BookHtmlOptions {
  title: string;
  rangeLabel: string;
}

export async function buildBookHtml(
  entries: EntryWithRelations[],
  opts: BookHtmlOptions,
): Promise<string> {
  const sections = await Promise.all(entries.map(entryToHtml));

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: ${PAGE_WIDTH}pt ${PAGE_HEIGHT}pt; margin: ${PAGE_MARGIN.top}pt ${PAGE_MARGIN.right}pt ${PAGE_MARGIN.bottom}pt ${PAGE_MARGIN.left}pt; }
  * { box-sizing: border-box; }
  body {
    font-family: "Hiragino Mincho ProN", "Hiragino Serif", serif;
    color: #2A2622;
    font-size: 11pt;
    line-height: 1.9;
    margin: 0;
  }
  .cover {
    height: ${PAGE_HEIGHT - PAGE_MARGIN.top - PAGE_MARGIN.bottom}pt;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    page-break-after: always;
  }
  .cover h1 { font-size: 24pt; margin: 0 0 14pt; font-weight: 600; }
  .cover .range { color: #6B6157; font-size: 11pt; }
  .cover .brand { margin-top: 90pt; font-size: 9pt; letter-spacing: 3pt; color: #B5623C; }
  section.entry { page-break-inside: avoid; margin-bottom: 20pt; }
  section.entry h2 {
    font-size: 11pt;
    font-weight: 600;
    border-bottom: 0.75pt solid #E4D9C5;
    padding-bottom: 4pt;
    margin: 0 0 8pt;
  }
  .body p { margin: 0 0 6pt; }
  .body p.empty { color: #9a9186; }
  .photos { display: flex; flex-wrap: wrap; gap: 6pt; margin: 8pt 0; }
  .photos img { width: 96pt; height: 96pt; object-fit: cover; border-radius: 4pt; }
  .tags { margin-top: 6pt; font-size: 9pt; color: #6B6157; }
  .tag { display: inline-block; margin-right: 10pt; }
</style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(opts.title)}</h1>
    <div class="range">${escapeHtml(opts.rangeLabel)}</div>
    <div class="brand">HISTORARY</div>
  </div>
  ${sections.join('\n')}
</body>
</html>`;
}

export interface RenderedBook {
  /** 端末内に永続化した PDF の URI */
  uri: string;
  pageCount: number;
}

function booksDir(): Directory {
  const dir = new Directory(Paths.document, 'books');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** HTML → PDF 化し、document ディレクトリへコピーして永続化する。 */
export async function renderBookPdf(html: string): Promise<RenderedBook> {
  const { uri, numberOfPages } = await Print.printToFileAsync({
    html,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    margins: PAGE_MARGIN,
    base64: false,
  });

  const dest = new File(booksDir(), `${newId()}.pdf`);
  new File(uri).copy(dest);

  return { uri: dest.uri, pageCount: numberOfPages ?? 0 };
}
