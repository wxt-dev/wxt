import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { removeEmptyDirs } from "../index";

// `stat` is mocked (defaulting to the real implementation) so individual
// tests can override it to simulate a file disappearing mid-walk - the race
// this suite exists to cover (oleks/mcp-chrome#61).
vi.mock("node:fs/promises", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs/promises")>();
	return { ...actual, stat: vi.fn(actual.stat) };
});

const mockedStat = vi.mocked(stat);
let realStat: typeof import("node:fs/promises").stat;

describe("removeEmptyDirs", () => {
	beforeAll(async () => {
		realStat = (
			await vi.importActual<typeof import("node:fs/promises")>(
				"node:fs/promises",
			)
		).stat;
	});

	afterEach(() => {
		mockedStat.mockImplementation(realStat);
	});

	it("removes nested empty directories", async () => {
		const dir = await mkdtemp(join(tmpdir(), "wxt-remove-empty-dirs-"));
		try {
			await mkdir(join(dir, "a", "b"), { recursive: true });
			await writeFile(join(dir, "a", "keep.txt"), "x");

			await removeEmptyDirs(dir);

			await expect(realStat(join(dir, "a", "b"))).rejects.toThrow();
			await expect(realStat(join(dir, "a", "keep.txt"))).resolves.toBeDefined();
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("does not throw when a file disappears between readdir and stat (a concurrent plugin write, oleks/mcp-chrome#61)", async () => {
		const dir = await mkdtemp(join(tmpdir(), "wxt-remove-empty-dirs-"));
		try {
			await mkdir(join(dir, "inject-scripts"), { recursive: true });
			const raceyFile = join(dir, "inject-scripts", "recorder.js");
			await writeFile(raceyFile, "x");

			mockedStat.mockImplementation((async (
				path: Parameters<typeof stat>[0],
				...args: unknown[]
			) => {
				if (path === raceyFile) {
					const err: NodeJS.ErrnoException = new Error(
						"ENOENT: no such file or directory",
					);
					err.code = "ENOENT";
					throw err;
				}
				return (realStat as (...a: unknown[]) => unknown)(path, ...args);
			}) as typeof stat);

			await expect(removeEmptyDirs(dir)).resolves.not.toThrow();
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
