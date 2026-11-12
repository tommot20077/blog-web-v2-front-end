# Article Highlight UI Design

## Goal

Add the first usable Highlight UI slice to `ArticleDetail`: authenticated readers can select text, create a highlight, see it rendered inline in the article, and manage their highlights for the current article.

This slice connects the existing backend highlight contract to the article reading experience. It includes basic anchor restoration so saved highlights are useful when the reader reopens an article.

## Existing Context

- `ArticleDetail.vue` already renders article content as Markdown-derived HTML inside `[data-testid="article-body"]`.
- The real backend adapter already exists at `src/api/real/highlightService.ts`.
- The backend contract is:
  - `GET /api/v1/articles/{articleUuid}/highlights`
  - `POST /api/v1/articles/{articleUuid}/highlights`
  - `PUT /api/v1/highlights/{uuid}`
  - `DELETE /api/v1/highlights/{uuid}`
- Create request constraints:
  - `snippet`: required, max 500
  - `prefix`: optional, max 64
  - `suffix`: optional, max 64
  - `color`: required `#RRGGBB`
  - `note`: optional, max 2000
- Highlight endpoints require authentication.

## Architecture

Add a top-level `src/api/highlightService.ts` facade so UI code does not import the real adapter directly. The facade routes to `src/api/mock/highlightService.ts` when `VITE_USE_MOCK === 'true'`, otherwise to the real service.

Add `useArticleHighlights(articleUuidRef)` as the state boundary for the feature. It owns highlight loading, create/update/delete calls, optimistic local list updates where safe, and error rollback. `ArticleDetail.vue` only wires the current article UUID and renders the selection toolbar plus highlight panel.

Add two focused UI components:

- `ArticleTextSelectionToolbar.vue`: appears when the user selects valid text inside the article body. It offers a small color picker and create action.
- `ArticleHighlightPanel.vue`: lists highlights for the current article and supports color changes, note editing, and delete.

Add one DOM utility/composable boundary for inline rendering:

- `useInlineArticleHighlights(articleBodyRef, highlights)`: maps saved highlights back into the rendered article body after Markdown HTML is ready. It finds text-node ranges by `snippet` and prefers matches whose nearby text matches the stored `prefix` / `suffix`, then wraps the matched text with a stable `<mark data-highlight-uuid="...">`.

## User Experience

When an authenticated reader selects text inside the article body, a compact floating toolbar appears near the selection. The toolbar offers three fixed colors and a create button. The default color is `#FFEB3B`.

When the reader creates a highlight, the selected text is saved as `snippet`. The UI also sends simple `prefix` and `suffix` context collected from nearby body text, each trimmed to 64 characters. If the selected text is empty, outside the article body, or longer than 500 characters after trimming, no create request is sent and the UI shows a concise error state.

After create succeeds, the selected range is immediately rendered inline with `<mark>` using the chosen color. When the article is opened later, saved highlights are restored into the rendered article body.

Basic restore behavior:

- Search the article body's text nodes for `snippet`.
- If the snippet appears once, mark that occurrence.
- If the snippet appears multiple times, prefer the occurrence whose surrounding body text best matches `prefix` and `suffix`.
- If no safe occurrence is found, keep the highlight in the panel and show it as "not located" instead of guessing a wrong location.
- Re-render highlights after article content or the highlight list changes by first removing previous highlight wrappers and then applying the current list.

The saved highlight appears in a "My highlights" panel on the article page. Each item shows the snippet, selected color, optional note, and actions to edit note, change color, or delete. Note edits are capped at 2000 characters before submit.

The first implementation still avoids advanced content-version repair. If the article text changed enough that `snippet` plus `prefix` / `suffix` cannot identify a safe location, the UI does not force an inline mark.

## Authentication Behavior

Anonymous readers can still read the article. Highlight management is auth-gated:

- The panel does not load highlights until the user is authenticated and the article UUID is available.
- Creating, updating, or deleting a highlight requires auth through the existing auth-wall pattern.
- Auth or network failures do not break article reading.

## Data Flow

1. `ArticleDetail.vue` loads the article and computes `articleUuidRef`.
2. `useArticleHighlights(articleUuidRef)` loads highlights for authenticated users.
3. `ArticleTextSelectionToolbar` observes selection events within the article body.
4. A valid create action calls `useArticleHighlights.createHighlight({ snippet, prefix, suffix, color })`.
5. The created highlight is inserted into the panel list from the API response.
6. `useInlineArticleHighlights` observes the highlight list and article body, then applies inline `<mark>` wrappers for located highlights.
7. Color and note edits call `highlightService.update(uuid, payload)` and update both the panel item and the inline mark color from the API response.
8. Delete calls `highlightService.delete(uuid)`, removes the local item after success, and removes its inline mark.

## Error Handling

- `list` failure: log a concise console error and show an empty panel state with retry.
- `create` failure: keep the selected text available and show a concise error.
- `update` failure: rollback local edits and show a concise error.
- `delete` failure: keep the item in the list and show a concise error.
- Inline restore miss: keep the item in the panel with a "not located" state; do not mark a guessed location.
- Missing article UUID skips all API calls.
- Non-authenticated create/update/delete should route through the auth wall instead of sending API requests.

## Testing

Implementation must follow TDD:

- Add facade tests for `src/api/highlightService.ts` covering mock/real routing.
- Add mock service tests or facade mock-mode tests for list/create/update/delete behavior.
- Add `useArticleHighlights.test.ts` for auth gating, list, create, update, delete, rollback, missing UUID, and error handling.
- Add component tests for:
  - selection toolbar only appearing for valid article-body selections
  - create payload including snippet/color/prefix/suffix
  - highlight panel rendering, note edit, color change, delete
- Add inline restore tests for:
  - unique snippet is wrapped with `<mark data-highlight-uuid>`
  - duplicate snippet uses prefix/suffix to choose the right occurrence
  - unresolved snippet is not guessed and is exposed as not located
  - update color changes the inline mark color
  - delete removes the inline mark
- Extend `ArticleDetail.test.ts` to verify the toolbar, panel, and inline restore receive the article UUID / body element integration points.

Verification should include focused tests first, then the full Vitest suite. Build may still expose unrelated project-wide type debt; if so, separate changed-file regressions from pre-existing build issues.

## Non-Goals

- No cross-article "all highlights" page.
- No advanced anchor repair when article content changes.
- No collaborative or public highlights.
