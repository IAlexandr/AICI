import { GraphQLClient } from 'graphql-request';
import options from 'tools/options';
import schedule from 'node-schedule';
import logger from 'tools/logger';
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
  actualize(repository).catch(err => {
    debug('err', err.message);
  });
  schedules[repository.name] = schedule.scheduleJob('*/5 * * * *', function(
    fireDate
  ) {
    actualize(repository).catch(err => {
      debug('err', err.message);
    });
  });

  debug('[repoWatch] schedule created for:', repository.name);
};

export const actualize = async repository => {
  const { changed } = await IsRepoChanged(repository);
  if (changed) {
    debug(`repository ${repository.name} was changed!`);
    const repFolderPath = path.resolve(
      process.cwd(),
      `../${repository.name}`
    );
    debug('repFolderPath', repFolderPath);
    series(['git status'], { cwd: repFolderPath }, (err, stdout, stderr) => {
      if (err) {
        debug(repository.name, 'err', err);
        debug(repository.name, 'stderr', stderr);
        throw err;
      }
      debug(repository.name, 'stdout', stdout);
      const branchRe = new RegExp(`origin\/${repository.branch}`, 'g');
      const nothingRe = new RegExp(
        'nothing to commit, working tree clean',
        'g'
      );
      if (!stdout.match(branchRe)) {
        debug(repository.name, 'match branchRe', stdout.match(branchRe));
        debug(`local branch is not '${repository.branch}'`);
        // TODO change status
      } else {
        debug(repository.name, 'match nothingRe', stdout.match(nothingRe));
        const isUpToDate = !!(
          stdout.match(branchRe) && stdout.match(nothingRe)
        );
        debug('isUpToDate', isUpToDate);
      }
    });
  }
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

export const IsRepoChanged = async repository => {
  const data = await fetchChanges(repository);
  const lastCommit = data.repository.ref.target.history.edges[0];
  let changed = repository.lastCommit.oid !== lastCommit.oid;
  return { changed, lastCommit };
};

export const repoSync = async repository => {
  const { changed, lastCommit } = await IsRepoChanged(repository);
  repository.lastCommit = lastCommit;
  await db.Repository.update(
    { _id: repository._id },
    { $set: { lastCommit } },
    {},
    err => {
      if (err) {
        throw err;
      }
    }
  );
};

export default {
  init,
  actualize,
  fetchChanges,
  IsRepoChanged,
  repoSync,
  repoWatch,
};
