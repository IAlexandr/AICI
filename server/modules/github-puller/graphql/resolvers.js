import GraphQLJSON from 'graphql-type-json';
import {
  rebuildRepository,
  readLocalCommit,
  repoWatch,
  stopRepoWatch,
} from './../client';

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
    repository: (repository, { name }, { db }) => {
      return new Promise((resolve, reject) => {
        db.Repository.find({ name }, {}, (err, docs) => {
          if (err) {
            return reject(err);
          }
          return resolve(docs[0]);
        });
      });
    },
    readLocalCommit: (parent, { name }, { db }) =>
      new Promise((resolve, reject) => {
        db.Repository.find({ name }, {}, (err, docs) => {
          if (err) {
            return reject(err);
          }
          if (!docs || !docs.length) {
            return reject(new Error('Repository not found'));
          }
          const repository = docs[0];
          return readLocalCommit(repository).then(resolve);
        });
      }),
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
    watchRepository: (parent, { name }, { db }) => {
      db.Repository.find({ name }, {}, (err, doc) => {
        if (err) {
          return reject(err);
        }
        return repoWatch(doc);
      });
    },
    rebuildRepository: (parent, { name }, { db }) => {
      return rebuildRepository(name);
    },
  },
});
