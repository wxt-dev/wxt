import { WxtBuilder } from '../../types';

export class UnknownBuilder implements WxtBuilder {
  name = 'unknown';
  version = '0.0.0';

  build(): never {
    this.missingBuilder();
  }

  importEntrypoint(): never {
    this.missingBuilder();
  }

  importEntrypoints(): never {
    this.missingBuilder();
  }

  createServer(): never {
    this.missingBuilder();
  }

  private missingBuilder(): never {
    throw Error('No builder available. Install `vite`');
  }
}
