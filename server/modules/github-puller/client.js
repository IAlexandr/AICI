import { GraphQLClient } from 'graphql-request';
import options from 'tools/options';
import schedule from 'node-schedule';
import logger from 'tools/logger';
import { db } from 'tools/db/nedb';
import path from 'path';
import { series } from './exec';

const { debug, time } = logger('project.modules.github-puller');

let client;
const schedules = {};

export const init = async db => {
  debug('init');
  client = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: `Bearer  ${options.config.githubApiToken}`,
    },
  });
  const profileName = await connectedBy();
  debug('connected by profileName:', profileName);
  db.Repository.find({}, (err, docs) => {
    docs.forEach(repository => {
      repoWatch(repository);
    });
  });
  return client;
};

export const stopRepoWatch = repository => {
  if (schedules[repository.name]) {
    schedules[repository.name].cancel();
    debug('schebdule', repository.name, 'was canceled.');
  }
};

export const repoWatch = repository => {
  if (schedules.hasOwnProperty(repository.name)) {
    debug('[repoWatch] ', repository.name, 'already has schedule.');
    return;
  }
  actualize({ repository, firstSync: true });
  schedules[repository.name] = schedule.scheduleJob('*/1 * * * *', function(
    fireDate
  ) {
    actualize({ repository });
  });

  debug('[repoWatch] schedule created for:', repository.name);
};

const changeState = (repository, status) => {
  db.Repository.update(
    { _id: repository._id },
    {
      $set: {
        ...{
          status: {
            updatedAt: new Date(),
          },
        },
        ...status,
      },
    },
    err => {
      if (err) {
        debug('changeState err', err);
      }
    }
  );
};

const createOperation = operation => {
  db.Operation.insert(operation, err => {
    if (err) {
      debug('createOperation err', err.message);
    }
  });
};

const getRepFolderPath = repository =>
  path.resolve(process.cwd(), `../${repository.name}`);

export const actualize = async ({ repository, firstSync = false }) => {
  debug('actualize', repository.name);
  let changed;
  if (firstSync) {
    let res = await repoSync(repository);
    changed = res.changed;
  } else {
    let res = await IsRepoChanged(repository);
    changed = res.changed;
  }
  if (changed) {
    debug(`repository ${repository.name} was changed!`);
    changeState(repository, {
      status: 'actualizing..',
      message: 'remote repository has changes\'',
    });
    const repFolderPath = getRepFolderPath(repository);
    debug('repFolderPath', repFolderPath);
    series(
      ['git status'],
      { cwd: repFolderPath },
      async (err, stdout, stderr) => {
        createOperation({
          name: 'git status',
          repoName: repository.name,
          stdout,
          stderr,
          err,
          createdAt: new Date(),
        });
        if (err) {
          debug(repository.name, 'err', err);
          debug(repository.name, 'stderr', stderr);
          changeState(repository, {
            status: 'exec err',
            message: err.message,
          });
        } else {
          debug(repository.name, 'stdout', stdout);
          const branchRe = new RegExp(`origin\/${repository.branch}`, 'g');
          const nothingRe = new RegExp(
            'nothing to commit, working tree clean',
            'g'
          );
          if (!stdout.match(branchRe)) {
            debug(repository.name, 'match branchRe', stdout.match(branchRe));
            debug(`local branch is not '${repository.branch}'`);
            changeState(repository, {
              status: 'err',
              message: `local branch is not '${repository.branch}'`,
            });
          } else {
            const readyForPull = !!(
              stdout.match(branchRe) && stdout.match(nothingRe)
            );
            debug('readyForPull', readyForPull);

            if (readyForPull) {
              await gitPull(repository, repFolderPath);
            } else {
              changeState(repository, {
                status: 'warning',
                message: 'repository has uncommitted changes',
              });
            }
          }
        }
      }
    );
  }
};

const gitPull = (repository, repFolderPath) => {
  return new Promise((resolve, reject) => {
    debug('gitPull', repository.name);
    changeState(repository, {
      status: 'actualizing..',
      message: 'github pulling..\'',
    });
    series(
      [`git pull origin ${repository.branch}`],
      { cwd: repFolderPath },
      async (err, stdout, stderr) => {
        createOperation({
          name: 'git pull',
          repoName: repository.name,
          stdout,
          stderr,
          err,
          createdAt: new Date(),
        });
        if (err) {
          debug(repository.name, 'err', err);
          debug(repository.name, 'stderr', stderr);
          changeState(repository, {
            status: 'exec err',
            message: err.message,
          });
        } else {
          debug(repository.name, 'stdout', stdout);
          const isUpToDateRe = new RegExp('Already up-to-date');
          if (stdout.match(isUpToDateRe)) {
            changeState(repository, {
              status: 'ok',
              message: 'repository branch is up-to-date',
            });
          } else {
            // TODO
            debug('BUILD TEST CONTAINER');
          }
        }
      }
    );
  });
};

export const connectedBy = () => {
  const query = `{
    viewer{
      login
    }
  }`;
  return client.request(query).then(data => {
    return data.viewer && data.viewer.login;
  });
};

export const fetchChanges = repository => {
  const query = `{
  viewer{
    login
  }
  repository(owner:"${repository.owner}", name:"${repository.name}"){
    createdAt
    pushedAt
    name
    ref(qualifiedName:"${repository.branch}"){
      name
      target{
        ... on Commit {
          history(first: 1){
            edges{
              node{
                oid
                messageHeadline
                pushedDate
              }
            }
          }
        }
      }
    }
  }
}`;
  return client.request(query);
};

export const IsRepoChanged = repository =>
  new Promise(async (resolve, reject) => {
    const data = await fetchChanges(repository);
    const lastCommit = data.repository.ref.target.history.edges[0].node;
    let changed = repository.lastCommit.oid !== lastCommit.oid;
    return resolve({ changed, lastCommit });
  });

export const readLocalCommit = repository =>
  new Promise((resolve, reject) => {
    const repFolderPath = getRepFolderPath(repository);
    series(
      ['git log -1'],
      { cwd: repFolderPath },
      async (err, stdout, stderr) => {
        createOperation({
          name: 'git read last commit',
          repoName: repository.name,
          stdout,
          stderr,
          err,
          createdAt: new Date(),
        });
        if (err) {
          debug(repository.name, 'err', err);
          debug(repository.name, 'stderr', stderr);
          changeState(repository, {
            status: 'exec err',
            message: err.message,
          });
          return reject(err);
        }
        debug('last commit result', stdout);
        const re = new RegExp('(commit)(.*?)(?=\\n)', 'g');
        let commitOid = stdout.match(re);
        commitOid = commitOid[0].replace('commit', '').trim();
        debug('commitOid', commitOid);
        return resolve(commitOid);
      }
    );
  });

export const repoSync = repository =>
  new Promise(async (resolve, reject) => {
    // TODO read last localCommit and compare with remote.
    const localCommitOid = await readLocalCommit(repository);
    const { changed, lastCommit } = await IsRepoChanged(repository);

    repository.lastCommit = lastCommit;
    db.Repository.update(
      { _id: repository._id },
      { $set: { lastCommit } },
      {},
      err => {
        if (err) {
          return reject(err);
        }
        if (localCommitOid === lastCommit.oid) {
          debug(
            `repository ${
              repository.name
            } synchronized. branch is up-to-date.`
          );
          return resolve({ changed: false });
        }
        return resolve({ changed });
      }
    );
  });

export default {
  init,
  actualize,
  fetchChanges,
  IsRepoChanged,
  repoSync,
  repoWatch,
};
