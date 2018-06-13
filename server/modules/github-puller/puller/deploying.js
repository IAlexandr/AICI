import { getRepFolderPath } from './repo';
import { changeState, createOperation, exec } from './utils';
import path from 'path';
import logger from 'tools/logger';
const { debug } = logger('project.modules.github-puller.deploying');

export const deployContainer = repository =>
  new Promise(async (resolve, reject) => {
    await changeState(repository, {
      status: 'deploying',
      message: 'building container => restart container',
      isBusy: true,
    });
    const repFolderPath = getRepFolderPath(repository);
    const repoScripts = require(path.resolve(repFolderPath, 'package.json'));
    debug('repoScripts', repoScripts.scripts);
    if (
      repoScripts.scripts.hasOwnProperty('build_container') &&
      repoScripts.scripts.hasOwnProperty('restart_container')
    ) {
      const { stdout, stderr } = await exec({
        commands: [
          repoScripts.scripts.build_container,
          repoScripts.scripts.restart_container,
        ],
        options: { cwd: repFolderPath },
        operation: {
          name:
            'run repository package scripts: build_container, restart_container',
        },
        repository,
      });
      debug('build_testing_container result stdout:', stdout);
      changeState(repository, {
        status: 'ok',
        message: 'up',
        isBusy: false,
      });
      return resolve();
    } else {
      return reject(
        new Error(
          `repository '${
            repository.name
          }' package script "build_container" or "restart_container" not found.`
        )
      );
    }
  });
