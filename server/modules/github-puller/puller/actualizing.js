import {
  repoSync,
  readLocalCommit,
  getRepository,
  getRemoteCommit,
  getRepFolderPath,
} from './repo';
import { testingContainer } from './testing';
import { isReadyForPull, gitPull } from './pulling';
import { deployContainer } from './deploying';
import { changeState, exec } from './utils';
import path from 'path';
import logger from 'tools/logger';
const { debug, time } = logger('project.modules.github-puller.actualizing');

export default ({ repository, firstSync = false }) =>
  new Promise(async (resolve, reject) => {
    try {
      await repoSync(repository, firstSync);
      const { remoteCommit, changed } = await getRemoteCommit(repository);
      let repo = await getRepository(repository);
      if (repo.state.isBusy) {
        return resolve(true);
      }
      if (
        repo.state.remoteCommit.oid === remoteCommit.oid &&
        ['exec err', 'err', 'ok'].indexOf(repo.state.status) !== -1
      ) {
        // проверка уже выполнена
        return resolve(true);
      }
      await changeState(repo, { remoteCommit });

      debug(
        `repository ${
          repository.name
        } local and remote last commit are different.`
      );
      await changeState(repo, {
        status: 'actualizing..',
        message: 'local and remote last commit are different.',
        isBusy: true,
        remoteCommit: remoteCommit,
      });
      // TODO if repo or submodules have changes

      // have changes
      const repFolderPath = getRepFolderPath(repo);
      debug('repFolderPath', repFolderPath);
      const { readyForPull } = await isReadyForPull({
        folderPath: repFolderPath,
        branch: repo.branch,
        repository: repo,
      });
      if (readyForPull) {
        const { isUpToDate } = await gitPull(repo);
        if (!isUpToDate) {
          if (repo.usingTests) {
            await testingContainer(repo);
          }
          await deployContainer(repository);
          debug('actualized.');
          return resolve(true);
        }
      }
    } catch (err) {
      try {
        await changeState(repository, {
          status: 'exec err',
          message: err.message,
          isBusy: false,
        });
      } catch (e) {
        debug('change state err', e.message);
      }
      debug('actualizing err', err.message);
      return resolve(true);
    }
  });
