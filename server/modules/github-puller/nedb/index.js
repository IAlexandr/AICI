import logger from 'tools/logger';
const { debug, time } = logger('nedb.dbseed.repositories');
const FORCE = true;

const tempOperations = [];
const newRepoDocs = [
  // {
  //   name: 'test1',
  //   owner: 'IAlexandr',
  //   branch: 'master',
  //   sync: true,
  //   localCommit: {
  //     oid: null,
  //   },
  //   state: {
  //     isBusy: false,
  //     status: 'none',
  //     remoteCommit: { oid: null },
  //   },
  // },
  // {
  //   name: 'deql-ms-auth',
  //   owner: 'IAlexandr',
  //   branch: 'master',
  //   sync: true,
  //   localCommit: {
  //     oid: null,
  //   },
  //   state: {
  //     isBusy: false,
  //     status: 'none',
  //     remoteCommit: { oid: null },
  //   },
  // },
  {
    name: 'deql-ms-system',
    owner: 'IAlexandr',
    branch: 'master',
    sync: true,
    pullWithUncommittedChanges: true,
    localCommit: {
      oid: null,
    },
    state: {
      isBusy: false,
      status: 'none',
      remoteCommit: { oid: null },
    },
  },
];
// TODO все переделать
function seed(db, collection, newDocs, resolve, reject) {
  db[collection].findOne({}, (err, docs) => {
    if (err) {
      return reject(err);
    }
    if (!docs) {
      debug('inserting docs');
      db[collection].insert(newDocs, err => {
        return reject(err);
      });
      return resolve();
    } else {
      return resolve();
    }
  });
}

const remove = (collection, db) => {
  return new Promise((resolve, reject) => {
    db[collection].remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
        return reject(err);
      }
      debug(`${collection} docs removed ${numRemoved}`);
      return resolve();
    });
  });
};

const collections = {
  Repository: { seed: newRepoDocs },
  Operation: {},
};

export default {
  dbmodels: collections,
  dbseed: db =>
    new Promise(async (resolve, reject) => {
      if (FORCE) {
        const removePromises = Object.keys(collections).map(collection =>
          remove(collection, db)
        );
        await Promise.all(removePromises);
      }
      const seedPromises = Object.keys(collections).map(collection => {
        if (!collections[collection].hasOwnProperty('seed')) {
          return Promise.resolve;
        }
        return seed(
          db,
          collection,
          collections[collection].seed,
          resolve,
          reject
        );
      });
      await Promise.all(seedPromises);
    }),
};
