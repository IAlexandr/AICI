import logger from 'tools/logger';
import { init } from 'tools/db/nedb';
import options from 'tools/options';
import githubPuller from 'project_modules/github-puller/puller';

const { debug, time } = logger('project.dependencies');

export const dependencies = async function({ app }) {
  const initialized = time('initializing');
  const db = await init({ modules: options.modules });
  await githubPuller.init(db);
  initialized('done.');
  return { db };
};
