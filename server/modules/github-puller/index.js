import nedb from './nedb';
import { default as githubPuller } from './client';
import typeDefs from './graphql/type-defs';
import resolvers from './graphql/resolvers';

export default {
  moduleName: 'githubPuller',
  nedb,
  githubPuller,
  graphql: {
    typeDefs,
    resolvers,
  },
};
