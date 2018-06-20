import { db } from 'tools/db/nedb';
import moment from 'moment';
import schedule from 'node-schedule';
import logger from 'tools/logger';
const { debug, time } = logger('project.modules.github-puller.cleaner');

export const startClean = ({ num, type, scheduleJob = '*/1 * * * *' }) =>
  new Promise(async resolve => {
    try {
      debug('start cleaner scheduleJob:', scheduleJob);
      await clean({ num, type, scheduleJob });
      schedule.scheduleJob(scheduleJob, function(fireDate) {
        clean({ num, type });
      });
      return resolve();
    } catch (e) {}
  });

export const clean = ({ num = 1, type = 'minutes' }) =>
  new Promise((resolve, reject) => {
    const done = time('cleaning..', num, type);
    db.Operation.remove(
      {
        createdAt: {
          $lt: moment()
            .subtract(num, type)
            .toDate(),
        },
      },
      { multi: true },
      function(err, numRemoved) {
        if (err) {
          done('err', err.message);
          return reject(err);
        } else {
          done('Operations numRemoved:', numRemoved);
          return resolve(numRemoved);
        }
      }
    );
  });
