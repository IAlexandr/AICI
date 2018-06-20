import options from 'tools/options';
import actualize from './actualizing';
import { readLocalCommit } from './repo';
import { db } from 'tools/db/nedb';
import { stopRepoWatch, repoWatch, watchingRepositories } from './watching';
import {
  default as githubGqlClient,
  connectedBy,
  fetchChanges,
} from './github-gql-client';
import { startClean } from './cleaner';
import logger from 'tools/logger';

const { debug, time } = logger('project.modules.github-puller.puller');

export const init = async db => {
  debug('init');
  await startClean({});
  const client = githubGqlClient();
  const profileName = await connectedBy();
  debug('connected by profileName:', profileName);
  db.Repository.find({}, (err, docs) => {
    docs.forEach(repository => {
      if (repository.sync) {
        repoWatch(repository);
      }
    });
  });
  return client;
};

export default {
  init,
  connectedBy,
  fetchChanges,
  stopRepoWatch,
  repoWatch,
  watchingRepositories,
  actualize,
  readLocalCommit,
};
