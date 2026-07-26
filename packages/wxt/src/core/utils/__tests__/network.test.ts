import { describe, expect, it, vi } from 'vitest';
import * as dns from 'node:dns';
import { isOnline, fetchCached } from '../network';
import { ResolvedConfig } from '../../../types';

type DnsCallback = (err: NodeJS.ErrnoException | null) => void;

vi.mock('node:dns');

const fetchMock = vi.fn<typeof fetch>();
global.fetch = fetchMock;

function mockOnline() {
  vi.mocked(dns.resolve).mockImplementationOnce(((
    _: string,
    callback: DnsCallback,
  ) => {
    callback(null);
  }) as typeof dns.resolve);
}

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
      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          status: 200,
          text: async () => mockContent,
        } as Response),
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

      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          status: 500,
          text: async () => '',
        } as Response),
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

    it('should fall back to cache when the body read throws', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('from cache'),
        },
        logger: { debug: vi.fn() },
      };

      fetchMock.mockResolvedValueOnce({
        status: 200,
        text: async () => {
          throw new TypeError('terminated');
        },
      } as unknown as Response);

      const result = await fetchCached(
        'https://example.com',
        mockConfig as unknown as ResolvedConfig,
      );

      expect(result).toBe('from cache');
      expect(mockConfig.logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Failed to download'),
      );
    });

    it('should fall back to cache when the request throws', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('from cache'),
        },
        logger: { debug: vi.fn() },
      };

      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

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
      expect(fetchMock).not.toHaveBeenCalled();
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

    it('should not cache content that fails verification', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: { set: vi.fn(), get: vi.fn().mockResolvedValueOnce(null) },
        logger: { debug: vi.fn() },
      };

      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          status: 200,
          text: async () => 'malicious',
        } as Response),
      );

      await expect(
        fetchCached(
          'https://example.com',
          mockConfig as unknown as ResolvedConfig,
          {
            verify: () => {
              throw Error('Integrity check failed');
            },
          },
        ),
      ).rejects.toThrow('Integrity check failed');

      expect(mockConfig.fsCache.set).not.toHaveBeenCalled();
    });

    it('should fall back to cache and warn when the download fails verification', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('trusted'),
        },
        logger: { debug: vi.fn(), warn: vi.fn() },
      };

      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          status: 200,
          text: async () => 'malicious',
        } as Response),
      );

      const result = await fetchCached(
        'https://example.com',
        mockConfig as unknown as ResolvedConfig,
        {
          verify: (content) => {
            if (content !== 'trusted') throw Error('Integrity check failed');
          },
        },
      );

      expect(result).toBe('trusted');
      expect(mockConfig.fsCache.set).not.toHaveBeenCalled();
      expect(mockConfig.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('changed upstream'),
      );
    });

    it('should not warn when falling back to cache after a failed request', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('from cache'),
        },
        logger: { debug: vi.fn(), warn: vi.fn() },
      };

      fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

      const result = await fetchCached(
        'https://example.com',
        mockConfig as unknown as ResolvedConfig,
        { verify: () => {} },
      );

      expect(result).toBe('from cache');
      expect(mockConfig.logger.warn).not.toHaveBeenCalled();
    });

    it('should verify content read from the cache', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: {
          set: vi.fn(),
          get: vi.fn().mockResolvedValueOnce('poisoned'),
        },
        logger: { debug: vi.fn() },
      };

      fetchMock.mockReturnValueOnce(
        Promise.resolve({ status: 500, text: async () => '' } as Response),
      );

      await expect(
        fetchCached(
          'https://example.com',
          mockConfig as unknown as ResolvedConfig,
          {
            verify: () => {
              throw Error('Integrity check failed');
            },
          },
        ),
      ).rejects.toThrow('Integrity check failed');
    });

    it('should not touch the cache when noCache is set', async () => {
      mockOnline();

      const mockConfig = {
        fsCache: { set: vi.fn(), get: vi.fn() },
        logger: { debug: vi.fn() },
      };

      fetchMock.mockReturnValueOnce(
        Promise.resolve({
          status: 200,
          text: async () => 'fresh',
        } as Response),
      );

      const result = await fetchCached(
        'https://example.com',
        mockConfig as unknown as ResolvedConfig,
        { noCache: true },
      );

      expect(result).toBe('fresh');
      expect(mockConfig.fsCache.set).not.toHaveBeenCalled();
      expect(mockConfig.fsCache.get).not.toHaveBeenCalled();
    });
  });
});
