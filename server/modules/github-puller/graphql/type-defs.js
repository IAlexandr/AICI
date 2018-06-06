const schema = `
  scalar JSON

  type Query{
    repositories: [Repository]
    repository(name: String): Repository
  }
  type Repository{
    name: String
    owner: String
    branch: String
    lastCommit: LastCommit
    state: RepositoryState
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
    rebuildRepository(name: String): Boolean!
  }
`;
// type Subscription{
//   fileAdded: File!
// },

export default { schema };
