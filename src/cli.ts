#!/usr/bin/env node

import cac from 'cac';
import { version } from '../package.json';
import * as commands from './commands';

const cli = cac('exvite');
cli.help();
cli.version(version);

// DEV
cli
  .command('[root]', 'start dev server')
  .option('-c, --config <file>', 'use specified config file')
  .option('-b, --browser <browser>', 'specify a browser', {
    type: ['chrome', 'firefox'],
  })
  .option('-m, --mode <mode>', 'set env mode', {
    default: 'development',
  })
  .action(commands.dev);

// BUILD
cli
  .command('build [root]', 'build for production')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode')
  .action(commands.build);

// PREPARE
cli
  .command('prepare [root]', 'prepare')
  .option('-c, --config <file>', 'use specified config file')
  .option('-m, --mode <mode>', 'set env mode', {
    default: 'production',
  })
  .action(commands.prepare);

// PUBLISH
cli.command('publish [root]', 'publish to stores').action(commands.publish);

// INIT
cli
  .command('init [directory]', 'initialize a new project')
  .action(commands.init);

cli.parse();
