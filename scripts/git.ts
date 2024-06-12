import { RawGitCommit, getGitDiff } from 'changelogen';
import { consola } from 'consola';

export async function listCommitsInDir(
  dir: string,
  lastTag: string,
): Promise<RawGitCommit[]> {
  consola.info('Listing commits:', { lastTag, dir });
  const commits = await getGitDiff(lastTag);
  consola.info('All commits:', commits.length);
  consola.debug(commits);
  // commit.body contains all the files that were modified/added. So just check to make sure "\t" + "packages/storage" + "/" is in the body to include
  // '"\n\nM\tpackages/wxt/vitest.config.ts\n"'
  const filtered = commits.filter((commit) =>
    commit.body.includes(`\t${dir}/`),
  );
  consola.info('Filtered:', filtered.length);
  consola.debug(filtered);
  return filtered;
}
