export default {
  port: '8888',
  projectName: 'deql-ms',
  graphql: {
    engineApiKey: 'service:deql-ms-server:4bBKVv14mLq7dWyaQeqfjA',
    useEngine: false,
  },
  redis: {
    host: '10.157.1.12',
    port: 32768,
    password: 'redispass',
  },
  nedb: {
    force: true,
    cleaner: {
      num: 2,
      type: 'days',
    },
  },
  sequelize: {
    options: {
      dialect: 'postgres',
      host: '10.10.10.20',
      port: 5433,
      logging: false,
    },
    username: 'postgres',
    password: 'postgres',
    dbName: 'template_postgis',
    accessDbSeed: true,
    syncForce: true,
    accessSyncForce: true,
  },
  rabbitmq: {
    connection: {
      name: '',
      user: '',
      pass: '',
      host: '',
      port: '',
      vhost: '%2f',
    },
  },
  NODE_ENV: 'development',
  githubApiToken: 'cb8f6999634f28d028bd5dabd5da04a410b8da35',
};
