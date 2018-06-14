import { getRepository, getRepFolderPath } from './repo';
import { changeState, createOperation, exec } from './utils';
import path from 'path';
import logger from 'tools/logger';
const { debug } = logger('project.modules.github-puller.pulling');

const LOCAL_REBUILD = true;

export const isReadyForPull = ({ folderPath, branch, repository }) =>
  new Promise(async (resolve, reject) => {
    const { stdout, stderr } = await exec({
      commands: ['git status'],
      options: { cwd: folderPath },
      operation: { name: `git status (folderPAth: ${folderPath})` },
      repository,
    });

    const branchRe = new RegExp(`origin\/${branch}`, 'g');
    const nothingRe = new RegExp(
      'nothing to commit, working tree clean',
      'g'
    );
    if (!stdout.match(branchRe)) {
      // debug(repository.name, 'match branchRe', stdout.match(branchRe));
      debug(`local branch is not '${branch}'`);
      await changeState(repository, {
        status: 'err',
        message: `local branch is not '${branch}'`,
        isBusy: false,
      });
      return resolve({ readyForPull: false });
    } else {
      const readyForPull = !!(
        stdout.match(branchRe) && stdout.match(nothingRe)
      );
      if (!readyForPull) {
        await changeState(repository, {
          status: 'err',
          message: 'repository has uncommitted changes',
          isBusy: false,
        });
      }
      debug('readyForPull', readyForPull);
      return resolve({ readyForPull });
    }
  });

export const gitPull = repository =>
  new Promise(async (resolve, reject) => {
    let repo = await getRepository(repository);
    const repFolderPath = getRepFolderPath(repo);
    const repoScripts = require(path.resolve(repFolderPath, 'package.json'));
    if (repoScripts.scripts.hasOwnProperty('git-pull-submodules')) {
    }

    debug('gitPull', repo.name);
    await changeState(repo, {
      status: 'actualizing..',
      message: 'github pulling..\'',
      isBusy: true,
    });
    const { stdout, stderr } = await exec({
      commands: [
        `git pull origin ${repo.branch}`,
        'git pull --recurse-submodules',
      ],
      options: { cwd: repFolderPath },
      operation: { name: 'git pull' },
      repository,
    });
    const isUpToDateRe = new RegExp('Already up-to-date');
    const isUpToDate = stdout.match(isUpToDateRe) && !LOCAL_REBUILD;
    if (isUpToDate) {
      await changeState(repo, {
        status: 'ok',
        message: 'repository branch is up-to-date',
        isBusy: false,
      });
    }
    return resolve({ isUpToDate });
  });
