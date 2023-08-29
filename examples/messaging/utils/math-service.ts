import { defineProxyService } from '@webext-core/proxy-service';

export const [registerMathService, getMathService] = defineProxyService(
  'BackgroundMath',

  // Define the code that will run in the background.
  () => ({
    fibbonnaci(number: number): number {
      console.log('Calculating fib of ' + number);
      if (number <= 1) return 1;
      return number * this.fibbonnaci(number - 1);
    },
  }),
);
