import { getRepFolderPath } from './repo';
import { changeState, exec } from './utils';
import path from 'path';
import logger from 'tools/logger';
const { debug } = logger('project.modules.github-puller.testing');

export const testingContainer = repository =>
  new Promise(async (resolve, reject) => {
    await changeState(repository, {
      status: 'testing',
      message: 'building test container => testing container',
      isBusy: true,
    });
    const repFolderPath = getRepFolderPath(repository);
    const repoScripts = require(path.resolve(repFolderPath, 'package.json'));
    debug('repoScripts', repoScripts.scripts);
    if (
      repoScripts.scripts.hasOwnProperty('build_testing_container') &&
      repoScripts.scripts.hasOwnProperty('run_testing_container')
    ) {
      const { stdout, stderr } = await exec({
        commands: [
          repoScripts.scripts.build_testing_container,
          repoScripts.scripts.run_testing_container,
        ],
        options: { cwd: repFolderPath },
        operation: {
          name:
            'run repository package scripts: build_testing_container, run_testing_container',
        },
        repository,
      });
      debug('build_testing_container result stdout:', stdout);
      delete require.cache[path.resolve(repFolderPath, 'package.json')];
      return resolve();
    } else {
      delete require.cache[path.resolve(repFolderPath, 'package.json')];
      return reject(
        new Error(
          `repository '${
            repository.name
          }'repository package scripts "build_testing_container" or "run_testing_container" not found.`
        )
      );
    }
  });
