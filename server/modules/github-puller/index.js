import { GraphQLClient } from 'graphql-request';
import options from 'tools/options';
import logger from 'tools/logger';
const { debug, time } = logger('project.modules.github-puller');

export default () => {
  const client = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: `Bearer  ${options.config.githubApiToken}`,
    },
  });

  debug(client);
  const query = `{
  viewer{
    login
  }
  repository(owner:"geoworks", name:"deck"){
    createdAt
    pushedAt
    name
    ref(qualifiedName:"gis"){
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
  client.request(query).then(data => debug('data', data));
};
