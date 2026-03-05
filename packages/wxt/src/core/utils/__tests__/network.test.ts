import { describe, expect, it, vi } from 'vitest';
import * as dns from 'node:dns';
import { isOnline, fetchCached } from '../network';
import { ResolvedConfig } from '../../../types';

type DnsCallback = (err: NodeJS.ErrnoException | null) => void;
type MockedFetch = ReturnType<typeof vi.fn>;

vi.mock('node:dns');

global.fetch = vi.fn();

describe('Network utils', () => {
  describe('isOnline', () => {
    it('should return true when online', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(((
        _: string,
        callback: DnsCallback,
      ) => {
        callback(null);
      }) as typeof dns.resolve);

      const result = await isOnline();
      expect(result).toBe(true);
    });

    it('should return false on DNS error', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(((
        _: string,
        callback: DnsCallback,
      ) => {
        callback(new Error('ENOTFOUND'));
      }) as typeof dns.resolve);

      const result = await isOnline();
      expect(result).toBe(false);
    });

    it('should return false on timeout', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(() => {
        // Simulate timeout by not calling callback
      });

      const result = await isOnline();
      expect(result).toBe(false);
    });

    it('should handle dns.resolve errors gracefully', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(() => {
        throw new Error('DNS resolution failed');
      });

      const result = await isOnline();
      expect(result).toBe(false);
    });
  });

  describe('fetchCached', () => {
    it('should fetch from network when online', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(((
        _: string,
        callback: DnsCallback,
      ) => {
        callback(null);
      }) as typeof dns.resolve);

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn(),
        },
        logger: {
          debug: vi.fn(),
        },
      };

      const mockContent = 'cached content';
      (global.fetch as MockedFetch).mockReturnValueOnce(
        Promise.resolve({
          status: 200,
          text: async () => mockContent,
        }),
      );

      const result = await fetchCached(
        'https://example.com',
        mockConfig as unknown as ResolvedConfig,
      );

      expect(result).toBe(mockContent);
      expect(mockConfig.fsCache.set).toHaveBeenCalledWith(
        'https://example.com',
        mockContent,
      );
    });

    it('should fall back to cache when network fails', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(((
        _: string,
        callback: DnsCallback,
      ) => {
        callback(null);
      }) as typeof dns.resolve);

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('from cache'),
        },
        logger: {
          debug: vi.fn(),
        },
      };

      (global.fetch as MockedFetch).mockReturnValueOnce(
        Promise.resolve({
          status: 500,
          text: async () => '',
        }),
      );

      const result = await fetchCached(
        'https://example.com',
        mockConfig as unknown as ResolvedConfig,
      );

      expect(result).toBe('from cache');
      expect(mockConfig.logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Failed to download'),
      );
    });

    it('should use cache when offline', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(((
        _: string,
        callback: DnsCallback,
      ) => {
        callback(new Error('ENOTFOUND'));
      }) as typeof dns.resolve);

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('offline cache'),
        },
        logger: {
          debug: vi.fn(),
        },
      };

      const result = await fetchCached(
        'https://example.com',
        mockConfig as any,
      );

      expect(result).toBe('offline cache');
      expect(global.fetch as MockedFetch).not.toHaveBeenCalled();
    });

    it('should throw error when offline and no cache available', async () => {
      vi.mocked(dns.resolve).mockImplementationOnce(((
        _: string,
        callback: DnsCallback,
      ) => {
        callback(new Error('ENOTFOUND'));
      }) as typeof dns.resolve);

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce(null),
        },
        logger: {
          debug: vi.fn(),
        },
      };

      await expect(
        fetchCached(
          'https://example.com',
          mockConfig as unknown as ResolvedConfig,
        ),
      ).rejects.toThrow(
        'Offline and "https://example.com" has not been cached. Try again when online.',
      );
    });
  });
});
