# Reading Progress Sync Design

## Goal

Connect the existing article reading progress UI to the backend progress contract for authenticated readers.

This slice only covers `ArticleDetail` progress persistence. It does not add a recent-reading page, because the frontend does not currently have a backend list endpoint for that workflow.

## Existing Context

- `ArticleDetail.vue` already renders a fixed progress bar with `useReadingProgress(articleEl)`.
- `useReadingProgress` currently computes local scroll progress as `0..100`.
- The real backend adapter already exists at `src/api/real/readingProgressService.ts`.
- The backend contract is:
  - `GET /api/v1/articles/{articleUuid}/progress`
  - `PUT /api/v1/articles/{articleUuid}/progress`
  - request/response `progress` uses `0.000..1.000`
  - `lastHeading` is optional and max 255 characters.

## Architecture

Keep the local progress bar calculation separate from backend persistence.

`useReadingProgress(articleEl)` remains responsible for viewport scroll calculation and UI progress. A new persistence composable, `usePersistedReadingProgress(articleUuidRef, progressRef)`, handles authenticated API reads/writes. `ArticleDetail.vue` wires both together but does not own API retry, throttling, or progress normalization logic.

Add a top-level `src/api/readingProgressService.ts` facade so code outside `src/api/real` does not import real adapters directly. This matches the bookmark facade pattern introduced for the previous bookmarks slice.

## Data Flow

1. `ArticleDetail.vue` loads article detail and computes `articleUuidRef`.
2. `useReadingProgress(articleEl)` emits local UI progress as `0..100`.
3. `usePersistedReadingProgress(articleUuidRef, progressRef)` loads saved progress for authenticated users.
4. Scroll changes are normalized from `0..100` to `0..1` before writing.
5. Writes are throttled so normal scrolling does not spam the backend.
6. Changes smaller than `0.03` are ignored unless progress reaches the completion threshold.
7. Progress at or above `0.95` is persisted as `1`.

The saved backend progress is used as persistence state only. The first implementation will not auto-scroll the reader to the saved position, because automatic page movement on article open can feel disruptive and requires more UI affordance.

## Authentication Behavior

The reading progress endpoints require authentication. The composable should avoid calling them when there is no stable article UUID. If the backend returns an auth or network error, reading should continue normally and the UI progress bar should remain local.

This design does not add an auth wall to reading an article. Anonymous users can still read and see the local progress bar; they just do not get persistence.

## Error Handling

- `GET` failure: log a concise console error and continue with local progress.
- `PUT` failure: log a concise console error and keep the UI unchanged.
- Invalid progress values are clamped before write.
- Missing article UUID skips both load and update.

## Testing

Implementation must follow TDD:

- Add `src/api/readingProgressService.test.ts` for the facade routing to mock/real services.
- Extend or add `src/composables/usePersistedReadingProgress.test.ts` for load, throttle/write, completion normalization, small-delta skip, missing UUID skip, and failure behavior.
- Extend `src/views/ArticleDetail.test.ts` to verify the article UUID and local progress are wired into persistence.
- Keep existing `useReadingProgress.test.ts` focused on local scroll calculation.

Verification should include focused tests first, then the full Vitest suite. Build may still expose unrelated project-wide type debt; if so, separate changed-file regressions from pre-existing build issues.
