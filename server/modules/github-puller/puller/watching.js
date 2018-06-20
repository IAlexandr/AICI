import actualize from './actualizing';
import { db } from 'tools/db/nedb';
import schedule from 'node-schedule';
import logger from 'tools/logger';
import { getRepository } from './repo';
const { debug, time } = logger('project.modules.github-puller.watching');

export const schedules = {};

export const watchingRepositories = () =>
  new Promise(resolve => {
    return resolve(Object.keys(schedules).map(repoName => repoName));
  });

export const repoWatch = repository =>
  new Promise(async (resolve, reject) => {
    let repo = await getRepository(repository);
    if (schedules.hasOwnProperty(repo.name)) {
      debug('[repoWatch] ', repo.name, 'already has schedule.');
      return resolve(true);
    }
    if (repo.sync) {
      actualize({ repository: repo, firstSync: true });
      schedules[repo.name] = schedule.scheduleJob('*/1 * * * *', function(
        fireDate
      ) {
        try {
          actualize({ repository: repo });
        } catch (err) {
          debug('actualize err', err.message);
        }
      });
      debug('[repoWatch] schedule created for:', repo.name);
      return resolve(true);
    } else {
      return reject(
        new Error('can`t start watching. (repository.sync: false)')
      );
    }
  });

export const stopRepoWatch = repository => {
  if (schedules[repository.name]) {
    schedules[repository.name].cancel();
    delete schedules[repository.name];
    debug('schebdule', repository.name, 'was canceled.');
    return true;
  }
  return false;
};
