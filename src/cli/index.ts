import cac from 'cac';
import { version } from '../../package.json';
import * as commands from './commands';

const cli = cac('wxt');
cli.help();
cli.version(version);

cli.option('--debug', 'enable debug mode');

// DEV
cli
  .command('[root]', 'start dev server')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .option('-b, --browser <browser>', 'specify a browser')
  .option('--mv3', 'target manifest v3')
  .option('--mv2', 'target manifest v2')
  .action(commands.dev);

// BUILD
cli
  .command('build [root]', 'build for production')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .option('-b, --browser <browser>', 'specify a browser')
  .option('--mv3', 'target manifest v3')
  .option('--mv2', 'target manifest v2')
  .action(commands.build);

// ZIP
cli
  .command('zip [root]', 'build for production and zip output')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .option('-b, --browser <browser>', 'specify a browser')
  .option('--mv3', 'target manifest v3')
  .option('--mv2', 'target manifest v2')
  .action(commands.zip);

// PREPARE
cli
  .command('prepare [root]', 'prepare typescript project')
  .option('-c, --config <file>', 'use specified config file')
  .action(commands.prepare);

// CLEAN
cli
  .command('clean [root]', 'clean generated files and caches')
  .action(commands.clean);

// PUBLISH
cli.command('publish [root]', 'publish to stores').action(commands.publish);

// INIT
cli
  .command('init [directory]', 'initialize a new project')
  .option('-t, --template <template>', 'template to use')
  .option('--pm <packageManager>', 'which package manager to use')
  .action(commands.init);

cli.parse();
