import { a } from './test';

const defineSomething = <T>(config: T): T => {
  return config;
};

export default defineSomething({
  option: 'some value',
  main: () => {
    console.log('main', a);
  },
});
