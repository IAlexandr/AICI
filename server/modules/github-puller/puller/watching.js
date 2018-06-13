import actualize from './actualizing';
import schedule from 'node-schedule';
import logger from 'tools/logger';
const { debug, time } = logger('project.modules.github-puller.watching');

export const schedules = {};

export const repoWatch = repository => {
  if (schedules.hasOwnProperty(repository.name)) {
    debug('[repoWatch] ', repository.name, 'already has schedule.');
    return true;
  }
  actualize({ repository, firstSync: true });
  schedules[repository.name] = schedule.scheduleJob('*/1 * * * *', function(
    fireDate
  ) {
    try {
      actualize({ repository });
    } catch (err) {
      debug('actualize err', err.message);
    }
  });

  debug('[repoWatch] schedule created for:', repository.name);
  return true;
};

export const stopRepoWatch = repository => {
  if (schedules[repository.name]) {
    schedules[repository.name].cancel();
    delete schedules[repository.name];
    debug('schebdule', repository.name, 'was canceled.');
    return true;
  }
  return false;
};
