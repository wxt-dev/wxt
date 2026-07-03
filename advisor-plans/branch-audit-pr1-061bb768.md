# Branch Audit — PR #1 (`feat/storage-schema`)

Written against: `061bb768` · Date: 2026-07-03 · Scope: files changed vs `origin/main`

## Recon summary

| Field           | Value                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Package         | `@wxt-dev/storage` v2.0.0 → v2.1.0 (implied by CHANGELOG)                                                                                      |
| Scope           | `packages/storage/**` only                                                                                                                     |
| LOC             | index.ts 1923 · types.ts 565 (both new/heavily modified)                                                                                       |
| Tests           | 361 runtime + 60 type-level (7 test files, 209 `it()` blocks in main)                                                                          |
| tsc             | 0 errors, strict + 10 additional flags                                                                                                         |
| TODOs / FIXMEs  | 0 (clean)                                                                                                                                      |
| Non-null `!`    | 0                                                                                                                                              |
| Verify commands | `npx tsc --noEmit -p tsconfig.json` · `bun run test --run` · `bun run test:types`                                                              |
| Deps            | `@standard-schema/spec` `^1.1.0`, `@standard-schema/utils` `~0.3.0`, `@wxt-dev/browser` (workspace), `async-mutex` `^0.5.0`, `dequal` `^2.0.3` |

**Intent docs consulted:**

- Issue #1173 thread (the ADR-equivalent for this PR — design agreements captured)
- CHANGELOG v2.0.0 (breaking changes documented)
- No `docs/adr/` or `CONTEXT.md` in repo — issue thread is the source of truth

**Design agreements (from #1173) — NOT findings, by-design:**

- Standard Schema on the parse branch, codec separate ✓
- `onValidationError` = reads only, writes always throw ✓
- Migrate then validate ✓
- VueUse naming: `serializer.{read, write}` ✓
- Metadata + encoder deferred to PR #4/#5 ✓

---

## Findings table (branch-scoped, ordered by leverage)

| #       | Finding                                                                                                                                                 | Category    | Tag                    | Impact | Effort | Risk   | Confidence | Evidence                                                                                                                                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------- | ------ | ------ | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1**  | Migration pre-write schema validation has **zero tests**                                                                                                | tests       | introduced             | HIGH   | S      | LOW    | HIGH       | `index.ts:764-778` — new code path, no test in `index.test.ts` matches `migrationValidation\|migration pre-write`                                                                                                                                                                  |
| **F2**  | `rawMetaValue as Record<string, unknown>` inline cast in `migrate()` duplicates the new `isRecord` predicate — inconsistent with the fix we just landed | tech debt   | introduced             | MEDIUM | XS     | LOW    | HIGH       | `index.ts:708` — `? (rawMetaValue as Record<string, unknown>)` — should call `isRecord()` for consistency with `getMetaValue`                                                                                                                                                      |
| **F3**  | `structuredClone(fallback)` not applied — mutable-fallback bug (issue #1766) worsens with schema pipeline                                               | correctness | pre-existing (touched) | MEDIUM | M      | MEDIUM | HIGH       | `index.ts:806` `getFallback = () => opts?.fallback ?? opts?.defaultValue ?? null` returns live reference. aklinker flagged this in #1766: _"WXT should probably structuredClone that for you... though this might be a problem if we add support for #1173. Can't clone classes."_ |
| **F4**  | Docs miss the migration pre-write validation behaviour change                                                                                           | docs        | introduced             | MEDIUM | XS     | LOW    | HIGH       | `docs/storage.md` — 472 LOC, mentions schema/serializer/migrations but not "invalid migration output throws MigrationError with SchemaError cause"                                                                                                                                 |
| **F5**  | Empty PR description will lose the "Closes #1025, Closes #1855" attribution                                                                             | docs / DX   | introduced             | MEDIUM | XS     | LOW    | HIGH       | PR description not yet written — issues need explicit `Closes #NNN` for auto-close on merge                                                                                                                                                                                        |
| **F6**  | `dequal` dependency imported but never used in changed files                                                                                            | deps        | pre-existing (touched) | LOW    | XS     | LOW    | MEDIUM     | `package.json` has `"dequal": "^2.0.3"` but `rg -n dequal src/` = 0 hits. Was it used before v2.0?                                                                                                                                                                                 |
| **F7**  | Concurrent-read-during-migration race untested                                                                                                          | tests       | introduced             | LOW    | M      | LOW    | MEDIUM     | `initMutex` guards init, `migrationsDone` is a promise. Two `getValue()` calls started before migrate finishes — both `await migrationsDone` correctly, but no explicit test for that ordering                                                                                     |
| **F8**  | `changes[key] as { … }` cast at line 1058 — inline object type cast in `driver.watch` fanout                                                            | tech debt   | pre-existing (touched) | LOW    | S      | LOW    | MEDIUM     | `index.ts:1058` — narrow to `Browser.storage.StorageChange` via type guard instead                                                                                                                                                                                                 |
| **F9**  | `defaultValue` @deprecated but no runtime warning                                                                                                       | DX          | pre-existing (touched) | LOW    | S      | LOW    | MEDIUM     | `types.ts:275,314` JSDoc `@deprecated`, but `getValueOrFallback` silently reads it. Consumers upgrading from v1 won't notice until they read the CHANGELOG                                                                                                                         |
| **F10** | `Object.entries(obj) as Array<[K, V]>` cast in `typedEntries` helper — return-type cast with no runtime guard                                           | tech debt   | pre-existing (touched) | LOW    | S      | LOW    | MEDIUM     | `index.ts:124` — `TypedEntries<T>` from type-fest would remove the cast                                                                                                                                                                                                            |

**Not audited:** deep review of the 2182-line test file (skimmed for coverage gaps only), security (no user-input surfaces — chrome.storage is the trust boundary and it's correctly typed `unknown`), performance (no benchmarks in scope).

---

## Direction items (not ranked against findings — options for maintainer)

1. **Address issue #1766 in this PR** — the `structuredClone` concern aklinker raised. Two paths: (a) always clone fallback via `structuredClone(fallback)` — fails for `Set`/`Map`/class instances a `serializer.read` might produce; (b) clone only when no `serializer.read` is present, otherwise trust the serializer to produce fresh values. **Recommend (b)** — matches aklinker's intent, tests already cover fresh-object semantics for schema/serializer paths.
2. **Follow-up issue: `defineMap`** (already tracked as wxt-dev/wxt#1864). Out of scope here — mention in PR description as roadmap.
3. **Add `.test-d.ts` for migration chain integrity** — cover `defineMigrations<T>()` overload dispatch precision. Currently 7 tests in `migrations-narrow.test-d.ts` — verify all 6 overloads dispatch.

---

## Recommended action before opening the PR

**Do all 3, in order (all quick):**

1. **F1** — Add tests for migration pre-write validation (2–3 tests: (a) invalid output → `MigrationError` with `SchemaError` cause; (b) version stays un-bumped after failed migration; (c) valid transformed output flows through)
2. **F2** — Replace `rawMetaValue as Record<string, unknown>` on `index.ts:708` with `isRecord()` call for consistency
3. **F4 + F5** — Add migration-validation section to `docs/storage.md` + write PR description with `Closes #1025, Closes #1855, Refs #1173`

**Defer (open follow-up issue):**

- F3 (structuredClone) — non-trivial, needs a design decision on `serializer` interaction with cloning. Comment on issue #1766 with the plan.
- F6 (unused `dequal`) — verify with `bun run build` inspection; likely used in unchanged files.
- F7–F10 — genuine LOW leverage, follow-up work.

**Verify all fixes with:**

```
npx tsc --noEmit -p tsconfig.json      # 0 errors
bun run test --run                       # ≥ 364 tests (361 + F1's 3)
bun run test:types                       # no type errors
```
