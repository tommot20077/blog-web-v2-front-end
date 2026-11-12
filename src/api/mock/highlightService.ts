import type {
  CreateHighlightRequest,
  Highlight,
  UpdateHighlightRequest,
} from '../real/highlightService'

const highlightsByArticle = new Map<string, Highlight[]>()
let idCounter = 0

function now() {
  return new Date().toISOString()
}

function cloneHighlight(highlight: Highlight): Highlight {
  return { ...highlight }
}

function findHighlight(uuid: string): { articleUuid: string; index: number; highlight: Highlight } | null {
  for (const [articleUuid, highlights] of highlightsByArticle.entries()) {
    const index = highlights.findIndex((highlight) => highlight.uuid === uuid)
    if (index >= 0) return { articleUuid, index, highlight: highlights[index]! }
  }
  return null
}

export const highlightService = {
  async list(articleUuid: string): Promise<Highlight[]> {
    return (highlightsByArticle.get(articleUuid) ?? []).map(cloneHighlight)
  },

  async create(articleUuid: string, request: CreateHighlightRequest): Promise<Highlight> {
    const timestamp = now()
    const highlight: Highlight = {
      uuid: `mock-highlight-${++idCounter}`,
      snippet: request.snippet,
      prefix: request.prefix ?? '',
      suffix: request.suffix ?? '',
      color: request.color,
      note: request.note ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const highlights = highlightsByArticle.get(articleUuid) ?? []
    highlightsByArticle.set(articleUuid, [...highlights, highlight])
    return cloneHighlight(highlight)
  },

  async update(uuid: string, request: UpdateHighlightRequest): Promise<Highlight> {
    const found = findHighlight(uuid)
    if (!found) throw new Error('Highlight not found')

    const next: Highlight = {
      ...found.highlight,
      color: request.color ?? found.highlight.color,
      note: request.note ?? found.highlight.note ?? null,
      updatedAt: now(),
    }
    const highlights = highlightsByArticle.get(found.articleUuid) ?? []
    highlights.splice(found.index, 1, next)
    highlightsByArticle.set(found.articleUuid, [...highlights])
    return cloneHighlight(next)
  },

  async delete(uuid: string): Promise<void> {
    const found = findHighlight(uuid)
    if (!found) return

    const highlights = highlightsByArticle.get(found.articleUuid) ?? []
    highlightsByArticle.set(
      found.articleUuid,
      highlights.filter((highlight) => highlight.uuid !== uuid),
    )
  },
}
