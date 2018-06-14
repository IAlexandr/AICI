import { db } from 'tools/db/nedb';
import { exec as chProcessExec } from 'child_process';
import { getRepository } from './repo';
import logger from 'tools/logger';
const { debug } = logger('project.modules.github-puller.utils');

export const exec = props =>
  new Promise((resolve, reject) => {
    const { commands, options, operation, repository } = props;
    const { name } = operation;
    series(commands, options, async (err, stdout, stderr) => {
      createOperation({
        name,
        repoName: repository.name,
        stdout,
        stderr,
        err,
        createdAt: new Date(),
      });
      if (err) {
        debug('repository:', repository.name, 'err', err);
        debug('repository:', repository.name, 'stderr', stderr);
        debug('repository:', repository.name, 'stdout', stdout);
        changeState(repository, {
          status: 'exec err',
          message: err.message,
          isBusy: false,
        });
        return reject(err);
      } else {
        // debug('repository:', repository.name, 'stdout:', stdout);
        return resolve({ stdout, stderr });
      }
    });
  });

export const createOperation = operation =>
  new Promise((resolve, reject) => {
    db.Operation.insert(operation, err => {
      if (err) {
        debug('createOperation err', err.message);
        return reject(err);
      }
      return resolve();
    });
  });

export const changeState = (repository, state) =>
  new Promise(async (resolve, reject) => {
    debug(`repository ${repository._id} "${repository.name}" changing state: 
    * status:${state.status}, 
    * message: ${state.message}
    * isBusy: ${state.isBusy} `);
    const repo = await getRepository(repository);
    repo.state.updatedAt = new Date();
    db.Repository.update(
      { _id: repository._id },
      {
        $set: {
          state: {
            ...repo.state,
            ...state,
          },
        },
      },
      err => {
        if (err) {
          debug('changeState err', err);
          return reject(err);
        }
        return resolve();
      }
    );
  });

export const series = function(cmds, options, callback) {
  var execNext = function() {
    chProcessExec(cmds.shift(), options, function(error, stdout, stderr) {
      if (error) {
        callback(error, stdout, stderr);
      } else {
        if (cmds.length) execNext();
        else callback(null, stdout, stderr);
      }
    });
  };
  execNext();
};
