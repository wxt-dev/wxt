import { fakeBrowser } from '@webext-core/fake-browser';
import { vi } from 'vite-plus/test';

vi.stubGlobal('chrome', fakeBrowser);
vi.stubGlobal('browser', fakeBrowser);
