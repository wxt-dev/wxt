#!/usr/bin/env node

import cac from 'cac';
import { version } from '../../package.json';
import * as commands from './commands';

const cli = cac('wxt');
cli.help();
cli.version(version);

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

// PREPARE
cli
  .command('prepare [root]', 'prepare')
  .option('-c, --config <file>', 'use specified config file')
  .action(commands.prepare);

// PUBLISH
cli.command('publish [root]', 'publish to stores').action(commands.publish);

// INIT
cli
  .command('init [directory]', 'initialize a new project')
  .action(commands.init);

cli.parse();
