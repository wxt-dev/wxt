import { fakeBrowser } from '@webext-core/fake-browser';
import { vi } from 'vitest';

vi.stubGlobal('chrome', fakeBrowser);
vi.stubGlobal('browser', fakeBrowser);
