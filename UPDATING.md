# Re-porting the editors code from GitHub Desktop

`src/editors/` is a port of [desktop/desktop](https://github.com/desktop/desktop)'s
`app/src/lib/editors`. Upstream is Electron app code carrying its own helpers,
logging and settings UI; this package keeps the editor knowledge and drops the
scaffolding.

Keep upstream's structure line for line — same functions, order, control flow,
variable names, comments — so the next sync is a readable diff. The freedom is in
what to drop, not how to arrange what stays.

Last synced commit: `src/editors/upstream.json`.

## Contract

`src/index.ts` keeps exporting, unchanged:

```ts
export type Editor // { editor: string; path: string }
export function getAvailableEditors(): Promise<ReadonlyArray<Editor>> // sorted by name, cached, rejects on an unsupported platform
export function launchEditor(editor: Editor, path: string): Promise<void> // rejects if the executable is gone
```

Adding a field to a returned editor is a minor bump; removing one or changing a
signature is major, and not something a sync does as a side effect.

## Layout

```
src/index.ts                        public API, dispatch, cache, sort, launch
src/editors/{darwin,linux,win32}.ts IFoundEditor, getAvailableEditors
```

Each platform file is self-contained — node plus the two runtime deps, nothing
else. Duplicating a five-line `pathExists` beats a module they share.

Format with upstream's own prettier settings, pinned to 2.x (3 reindents nested
ternaries, which is noise in the files you diff):

```bash
npx prettier@2 --single-quote --trailing-comma es5 --no-semi --arrow-parens avoid --write src tests
```

## 1. Fetch

```bash
gh api repos/desktop/desktop/commits/development --jq '.sha, .commit.committer.date'
gh api repos/desktop/desktop/contents/app/src/lib/editors/<name>?ref=<sha> --jq .content | base64 -d
```

Stop if the sha already matches `upstream.json`. Always pin the sha, never
`development`. Read the files; don't write them into `src/`.

## 2. Port

Nearly all the value is in the three `editors` arrays — bundle identifiers,
install paths, registry keys, display name prefixes, publishers, executable shim
paths. **Copy them verbatim**, comments included. A wrong entry is an editor that
silently stops being detected on an OS you don't run.

Because it is mostly data, transform the upstream file mechanically rather than
retyping it, then diff the set of quoted literals on both sides to prove nothing
was lost.

Deviations are a closed list. Anything else is a bug in the port:

| deviation | reason |
| --- | --- |
| two-line provenance header | points at `upstream.json` and this file |
| `IFoundEditor` declared per platform file | upstream's generic lived in a `found-editor.ts` this package doesn't have |
| `pathExists` inlined | no support modules |
| `memoize-one` replaced by a cached promise | the call takes no arguments, so the dependency buys nothing |
| no `log.*` calls | the logger was a no-op |
| no custom integrations (`launchCustomExternalEditor`) | unreachable from the public API |
| no `findEditorOrDefault` / `ExternalEditorError` / `suggestedExternalEditor` | unreachable |
| plain error wording | upstream's strings tell the user to open Settings |

New upstream imports get inlined or dropped — never vendor the module graph behind
them, and check any new dependency is actually published.

## 3. Keep this package's own behavior

Not upstream's, and must survive a sync:

- `getAvailableEditors` sorts by name, and throws on an unsupported platform where
  upstream logs a warning and returns `[]`.
- `launchEditor` takes `(editor, path)`; upstream's launcher takes them the other
  way round.

## 4. Verify

```bash
npm run typecheck
npm test # compiles, then runs tests/*.test.mts on node:test
```

`npm test` only covers the current platform, and only checks the shape of what
comes back — no editor is guaranteed to be installed anywhere. So re-read each
port side by side against upstream, and diff the literals. Roughly 95% of
upstream's non-blank lines should survive verbatim; materially less means
something got restructured.

## 5. Report

Update `src/editors/upstream.json`, then report new and removed editors per
platform, public API changes with the semver bump that follows, and anything
deliberately dropped. Don't bump the version or commit unless asked.
