import { GraphQLClient } from 'graphql-request';
import options from 'tools/options';

let githubGqlClient;

console.log(options);
export default () => {
  if (!githubGqlClient) {
    githubGqlClient = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: `Bearer  ${options.config.githubApiToken}`,
      },
    });
  }
  return githubGqlClient;
};

export const connectedBy = () => {
  const query = `{
    viewer{
      login
    }
  }`;
  return githubGqlClient.request(query).then(data => {
    return data.viewer && data.viewer.login;
  });
};

export const fetchChanges = repository => {
  const query = `{
  viewer{
    login
  }
  repository(owner:"${repository.owner}", name:"${repository.name}"){
    createdAt
    pushedAt
    name
    ref(qualifiedName:"${repository.branch}"){
      name
      target{
        ... on Commit {
          history(first: 1){
            edges{
              node{
                oid
                messageHeadline
                pushedDate
              }
            }
          }
        }
      }
    }
  }
}`;
  return githubGqlClient.request(query);
};
