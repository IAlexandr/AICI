import { db } from 'tools/db/nedb';
import { changeState, createOperation, exec } from './utils';
import { fetchChanges } from './github-gql-client';
import path from 'path';
import logger from 'tools/logger';
const { debug, time } = logger('project.modules.github-puller.repo');

export const repoSync = (repository, firstSync) =>
  new Promise(async (resolve, reject) => {
    let repo = await getRepository(repository);
    let state = repo.state;
    const localCommitOid = await readLocalCommit(repo);

    if (firstSync) {
      state = repo.state;
      if (state.isBusy) {
        state.isBusy = false;
        // state.status = 'none';
        // state.message = '';
      }
    }
    const localCommit = { oid: localCommitOid };
    db.Repository.update(
      { _id: repository._id },
      { $set: { localCommit, state, updatedAt: new Date() } },
      {},
      err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }
    );
  });

export const getRemoteCommit = repository =>
  new Promise(async (resolve, reject) => {
    let repo = await getRepository(repository);
    const data = await fetchChanges(repo);
    const remoteCommit = data.repository.ref.target.history.edges[0].node;
    let changed = repo.localCommit.oid !== remoteCommit.oid;
    return resolve({ changed, remoteCommit });
  });

export const getRepFolderPath = repository =>
  path.resolve(process.cwd(), `../${repository.name}`);

export const readLocalCommit = repository =>
  new Promise(async (resolve, reject) => {
    const repFolderPath = getRepFolderPath(repository);
    const { stdout, stderr } = await exec({
      commands: ['git log -1'],
      options: { cwd: repFolderPath },
      operation: { name: 'git read last commit' },
      repository,
      withoutLog: true,
    });
    const re = new RegExp('(commit)(.*?)(?=\\n)', 'g');
    let commitOid = stdout.match(re);
    commitOid = commitOid[0].replace('commit', '').trim();
    return resolve(commitOid);
  });

export const getRepository = repository =>
  new Promise((resolve, reject) => {
    db.Repository.find({ _id: repository._id }, (err, docs) => {
      if (err) {
        return reject(err);
      }
      if (!docs || !docs.length) {
        return reject(new Error('repository not found.'));
      }
      return resolve(docs[0]);
    });
  });
