import { db } from 'tools/db/nedb';
import moment from 'moment';
import schedule from 'node-schedule';
import logger from 'tools/logger';
const { debug, time } = logger('project.modules.github-puller.cleaner');

/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/
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
