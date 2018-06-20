import GraphQLJSON from 'graphql-type-json';
import { default as puller } from './../puller';

const findRepositoryByName = (name, db) =>
  new Promise((resolve, reject) => {
    db.Repository.find({ name }, {}, (err, docs) => {
      if (err) {
        return reject(err);
      }
      if (!docs || !docs.length) {
        return reject(new Error('Repository not found'));
      }
      return resolve(docs[0]);
    });
  });

export default pubsub => ({
  JSON: GraphQLJSON,

  Query: {
    repositories: (repositories, args, { db }) => {
      return new Promise((resolve, reject) => {
        db.Repository.find({}, { multi: true }, (err, docs) => {
          if (err) {
            return reject(err);
          }
          return resolve(docs);
        });
      });
    },
    repository: (repository, { name }, { db }) =>
      findRepositoryByName(name, db),
    readLocalCommit: (parent, { name }, { db }) =>
      findRepositoryByName(name, db).then(puller.readLocalCommit),
    watchingRepositories: (parent, {}, { db }) =>
      puller.watchingRepositories(),
  },
  // Subscription: {
  //   fileAdded: {
  //     subscribe: () => {
  //       return pubsub.asyncIterator('FILE_ADDED');
  //     },
  //   },
  // },
  Mutation: {
    addRepository: (
      parent,
      { repository, sync, pullWithUncommittedChanges },
      { db }
    ) =>
      new Promise((resolve, reject) => {
        repository = {
          ...repository,
          ...{
            localCommit: {
              oid: null,
            },
            sync,
            pullWithUncommittedChanges,
            state: {
              isBusy: false,
              status: 'none',
              remoteCommit: { oid: null },
            },
          },
        };
        db.Repository.insert(repository, (err, docs) => {
          if (err) {
            return reject(err);
          }
          console.log('docs', docs);
          return resolve(docs);
        });
      }),
    removeRepository: (parent, { name }, { db }) =>
      new Promise((resolve, reject) => {
        db.Repository.remove({ name }, {}, (err, removed) => {
          if (err) {
            return reject(err);
          }
          console.log('removed', removed);
          return resolve(removed);
        });
      }),
    watchRepository: (parent, { name }, { db }) =>
      findRepositoryByName(name, db).then(repo => puller.repoWatch(repo)),
    stopWatchRepository: (parent, { name }, { db }) =>
      findRepositoryByName(name, db).then(repo =>
        puller.stopRepoWatch(repo)
      ),
    rebuildRepository: (parent, { name }, { db }) =>
      findRepositoryByName(name, db).then(repo =>
        puller.actualize({ repository: repo })
      ),
  },
});
