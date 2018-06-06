const schema = `
  scalar JSON

  type Query{
    repositories: [Repository]
    repository(name: String): Repository
    readLocalCommit(name: String): String!
  }
  type Repository{
    name: String
    owner: String
    branch: String
    lastCommit: LastCommit
    state: RepositoryState
  }
  input RepositoryInput{
    name: String
    owner: String
    branch: String
  }
  type LastCommit{
    oid: String
    messageHeadline: String
    pushedDate: String
  }
  type RepositoryState{
    updatedAt: JSON
    status: String
    message: String
    isBusy: Boolean
  }
  type Mutation{
    addRepository(repository: RepositoryInput): Repository!
    removeRepository(name: String): Int
    rebuildRepository(name: String): Boolean!
    watchRepository(name: String): Boolean!
    stopWatchRepository(name: String): Boolean!
  }
`;
// type Subscription{
//   fileAdded: File!
// },

export default { schema };
