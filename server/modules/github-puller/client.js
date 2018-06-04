import { GraphQLClient } from 'graphql-request';
import options from 'tools/options';
import schedule from 'node-schedule';
import logger from 'tools/logger';

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
  schedules[repository.name] = schedule.scheduleJob('*/1 * * * *', function(
    fireDate
  ) {
    actualize(repository);
  });

  debug('[repoWatch] schedule created for:', repository.name);
};

export const actualize = repository =>
  IsRepoChanged(repository).then(({ changed }) => {
    if (changed) {
      // TODO git pull from repo folder
      debug(`repository ${repository.name} was changed!`);
    }
  });

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
