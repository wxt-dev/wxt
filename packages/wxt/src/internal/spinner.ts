import { styleText } from 'node:util';

type ColorName = Parameters<typeof styleText>[0];

interface SpinnerOptions {
  frames?: string[];
  color?: ColorName | null;
}

interface UpdateOptions {
  text?: string;
}

export interface Spinner {
  start(startText?: string): Spinner;
  update(opts?: string | UpdateOptions): Spinner;
  clear(): Spinner;
  stop(finalText?: string): Spinner;
  success(finalText?: string): Spinner;
  error(finalText?: string): Spinner;
}

export function createSpinner(
  initialText: string = '',
  options: SpinnerOptions = {},
): Spinner {
  const { color = 'cyan' } = options;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const FRAME_INTERVAL = 80;
  let frameIndex = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let text = initialText;

  function render(): void {
    const frame = frames[frameIndex % frames.length];
    const coloredFrame = color ? styleText(color, frame) : frame;
    process.stdout.write(`\r${coloredFrame} ${text}\x1B[K`);
  }

  const spinner: Spinner = {
    start(startText?: string): Spinner {
      if (startText !== undefined) text = startText;
      if (timer) return spinner;
      process.stdout.write('\x1B[?25l');
      render();
      timer = setInterval(() => {
        frameIndex++;
        render();
      }, FRAME_INTERVAL);

      return spinner;
    },

    update(opts: string | UpdateOptions = {}): Spinner {
      text = typeof opts === 'string' ? opts : (opts.text ?? text);
      if (timer) render();
      return spinner;
    },

    clear(): Spinner {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      process.stdout.write('\r\x1B[K');
      process.stdout.write('\x1B[?25h');
      return spinner;
    },

    stop(finalText: string = ''): Spinner {
      spinner.clear();
      if (finalText) process.stdout.write(finalText + '\n');
      return spinner;
    },

    success(finalText?: string): Spinner {
      const message = finalText ?? text;
      return spinner.stop(`${styleText('green', '✔')} ${message}`);
    },

    error(finalText?: string): Spinner {
      const message = finalText ?? text;
      return spinner.stop(`${styleText('red', '✖')} ${message}`);
    },
  };

  return spinner;
}
