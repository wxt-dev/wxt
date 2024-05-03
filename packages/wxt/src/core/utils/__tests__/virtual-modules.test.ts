import { describe, it } from 'vitest';
import {
  VirtualModuleId,
  VirtualModuleName,
  VirtualEntrypointType,
  VirtualEntrypointModuleName,
} from '../virtual-modules';

describe('Virtual Modules', () => {
  it('should resolve types to litteral values, not string', () => {
    // @ts-expect-error
    const _c: VirtualEntrypointType = '';
    // @ts-expect-error
    const _d: VirtualEntrypointModuleName = '';
    // @ts-expect-error
    const _b: VirtualModuleName = '';
    // @ts-expect-error
    const _a: VirtualModuleId = '';
  });
});
