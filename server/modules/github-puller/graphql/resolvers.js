import GraphQLJSON from 'graphql-type-json';
import {
  rebuildRepository,
  readLocalCommit,
  repoWatch,
  stopRepoWatch,
} from './../client';

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
      findRepositoryByName(name, db).then(readLocalCommit),
  },
  // Subscription: {
  //   fileAdded: {
  //     subscribe: () => {
  //       return pubsub.asyncIterator('FILE_ADDED');
  //     },
  //   },
  // },
  Mutation: {
    addRepository: (parent, { repository }, { db }) =>
      new Promise((resolve, reject) => {
        repository = {
          ...repository,
          ...{
            lastCommit: {
              oid: null,
            },
            state: {
              isBusy: false,
              status: 'none',
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
      findRepositoryByName(name, db).then(repo => repoWatch(repo)),
    stopWatchRepository: (parent, { name }, { db }) =>
      findRepositoryByName(name, db).then(repo => stopRepoWatch(repo)),
    rebuildRepository: (parent, { name }, { db }) => {
      return rebuildRepository(name);
    },
  },
});
