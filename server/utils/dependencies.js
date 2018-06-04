import logger from 'tools/logger';
import { init } from 'tools/db/nedb';
import options from 'tools/options';

const { debug, time } = logger('project.dependencies');

export const dependencies = async function({ app }) {
  const initialized = time('initializing');
  const db = await init({ modules: options.modules });
  initialized('done.');
  return { db };
};
