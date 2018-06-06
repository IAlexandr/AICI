import GraphQLJSON from 'graphql-type-json';
import { rebuildRepository } from './../client';

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
  },
  // Subscription: {
  //   fileAdded: {
  //     subscribe: () => {
  //       return pubsub.asyncIterator('FILE_ADDED');
  //     },
  //   },
  // },
  Mutation: {
    rebuildRepository: (parent, { name }, { db }) => {
      return rebuildRepository(name);
    },
  },
});
