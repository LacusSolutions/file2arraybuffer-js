# AGENTS.md

## Project

`file2arraybuffer` is a tiny, zero-dependency browser library published to npm by LacusSolutions (repo `LacusSolutions/file2arraybuffer-js`, MIT). It exports one function, `fileToArrayBuffer(target)`, which returns `Promise<ArrayBuffer>` for a single file. People mainly use it to prepare uploads for APIs like the SharePoint REST API.

Supported inputs (TS overloads):

- `ArrayBuffer`: resolved as-is.
- `Blob` / `File`: uses `blob.arrayBuffer()` when available, otherwise falls back to `FileReader.readAsArrayBuffer`.
- `HTMLInputElement` (type="file"): converts `files[0]`.
- `FileList`: converts `[0]`.
- `string`: a CSS selector resolved with `document.querySelector` to an input element.

Bad input makes the promise **reject** with an `Error` (empty param, selector without a DOM, selector not found, input not of type file, empty FileList, unsupported type). The function **throws synchronously** only when the environment lacks `Promise`, `ArrayBuffer` or `FileReader`. It converts one file per call. For multi-file inputs, callers map over `Array.from(input.files)`.

## Structure

```
src/index.ts                 # re-exports the default export only
src/file-to-arraybuffer.ts   # the whole implementation (default export)
tests/*.test.ts              # bun:test suite
tests/setup.ts               # test preload (via bunfig.toml): registers happy-dom globals
rollup.config.mjs            # 3 build targets (see Build)
tsconfig.json                # target ES5, lib DOM + ES2015.Promise, strict
eslint.config.mjs            # eslint-config-any `sharedNodeAndBrowser`
.github/workflows/           # ci.yml, publish.yml, pr-author-assign.yml
.husky/                      # git hooks
build/, dist/                # generated output (gitignored)
```

## Architecture notes

- Type detection relies on `constructor ===` checks for `ArrayBuffer`, `HTMLInputElement`, `FileList` and `File`, and on `instanceof Blob`. Each global is guarded with `typeof X !== 'undefined'` so the code stays safe in non-DOM environments.
- A `File` recurses into the `Blob` branch.
- ES5 + legacy-browser support (the README advertises IE11) is a deliberate design constraint. Keep syntax and APIs compatible, and guard every global you use.
- There are no runtime dependencies. Keep it that way.

## Build (`bun run build` → Rollup)

1. **UMD** (TypeScript + Babel `preset-env`, targets `> 0.25%, not dead`): `dist/file-to-arraybuffer.js` and `.min.js` (terser). Global name: `fileToArrayBuffer`. This step also cleans `build/*` and `dist/*` first.
2. **CJS + ESM** (esbuild, `esnext`): `build/index.cjs.js`, `build/index.esm.js`. All dependencies are marked external.
3. **Types**: `build/index.d.ts` via `rollup-plugin-dts`.

Every bundle gets a banner with the version from `package.json`. `package.json` points `main` → `build/index.cjs.js` and `types` → `build/index.d.ts`. It has no `module` or `exports` field.

Published files are controlled by `.npmignore`: `src/`, `tests/`, dotfiles, configs and lockfiles are excluded, so only `build/`, `dist/`, README and LICENSE ship.

## Scripts & tooling

Bun is the package manager and runner (`bun.lock`).

| Command | What it does |
|---|---|
| `bun install` | install deps (also runs `prepare` → husky) |
| `bun run build` | Rollup build (above) |
| `bun run type-check` | `tsc --noEmit` |
| `bun run lint` | ESLint on `src/`, `tests/` + config files |
| `bun run test` | `bun test` with happy-dom (DOM globals) preloaded |
| `bun run commit` | Commitizen prompt (conventional changelog) |

Git hooks (husky):

- `pre-commit` runs `lint-staged` (`eslint --fix` on `*.{js,ts}`).
- `commit-msg` runs commitlint with `@commitlint/config-conventional`, so use Conventional Commits (`feat:`, `fix:`, `chore(scope):`, `ci:` …).
- `pre-push` runs `tsc --noEmit`.

## CI/CD

- `ci.yml`: runs on every push. It has four jobs: type-check, lint, test, and build + `npm publish --dry-run`. Runners use Bun latest and Node 24. Actions are **pinned to commit SHAs**; keep that convention.
- `publish.yml`: runs when a GitHub Release is created. It checks that the tag matches `v<MAJOR>.<MINOR>.<PATCH>[-(rc|alpha|beta).<N>]`, sets the version with `npm version --no-git-tag-version`, then runs `npm publish` with `NPM_TOKEN`. `package.json` stays at `0.0.0` in the repo; **never bump the version manually**.
- `pr-author-assign.yml`: auto-assigns each PR to its author.
- CODEOWNERS: `@LacusSolutions/engineering`.

## Known gotchas

- The README's CDN snippet references `dist/to-arraybuffer.min.js`, but the build emits `dist/file-to-arraybuffer.min.js`.
- happy-dom quirks the tests work around: `DataTransfer.files` is a plain Array (so tests build a `FileList` with `new FileList()` + `push`), and a non-file input returns an empty `FileList` instead of `null`.
- TypeScript 6 defaults `types` to `[]`, so the test file pulls Bun types with `/// <reference types="bun" />`. `skipLibCheck` is on because `bun-types` expects a newer `@types/node` than the pinned `^24`.
- `tsconfig` sets `ignoreDeprecations: "6.0"` (TypeScript 6), because `target: ES5`, `baseUrl` and `moduleResolution: node` are deprecated there.
