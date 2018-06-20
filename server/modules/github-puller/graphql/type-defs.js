const schema = `
  scalar JSON

  type Query{
    repositories: [Repository]
    repository(name: String): Repository
    readLocalCommit(name: String): String!
    watchingRepositories: [String]
  }
  type Repository{
    name: String
    owner: String
    branch: String
    localCommit: CommitInfo
    sync: Boolean,
    pullWithUncommittedChanges: Boolean,
    state: RepositoryState
  }
  input RepositoryInput{
    name: String
    owner: String
    branch: String
  }
  type CommitInfo{
    oid: String
    messageHeadline: String
    pushedDate: String
  }
  type RepositoryState{
    updatedAt: JSON
    status: String
    message: String
    isBusy: Boolean
    remoteCommit: CommitInfo
  }
  type Mutation{
    addRepository(repository: RepositoryInput, sync: Boolean = true, pullWithUncommittedChanges: Boolean = false): Repository!
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
