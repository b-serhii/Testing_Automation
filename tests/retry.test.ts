import { describe, it, expect, vi, afterEach } from 'vitest';
import { withRetry } from '../src/retry';

describe('withRetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('повертає результат без очікування, якщо перша спроба вдала', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(action)).resolves.toBe('ok');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('повторює спробу після невдачі', async () => {
    vi.useFakeTimers();
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error('TIMEOUT'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(action, 3, 1000);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe('ok');
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('після вичерпання спроб повертає останню помилку', async () => {
    vi.useFakeTimers();
    const action = vi.fn().mockRejectedValue(new Error('TIMEOUT'));

    const promise = withRetry(action, 3, 1000);
    const assertion = expect(promise).rejects.toThrow('TIMEOUT');
    await vi.advanceTimersByTimeAsync(2000);

    await assertion;
    expect(action).toHaveBeenCalledTimes(3);
  });

  it('не робить наступну спробу раніше, ніж мине затримка', async () => {
    vi.useFakeTimers();
    const action = vi
      .fn()
      .mockRejectedValueOnce(new Error('TIMEOUT'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(action, 3, 1000);
    await vi.advanceTimersByTimeAsync(999);
    expect(action).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toBe('ok');
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('за замовчуванням робить 3 спроби із затримкою 1000 мс', async () => {
    vi.useFakeTimers();
    const action = vi.fn().mockRejectedValue(new Error('TIMEOUT'));

    const promise = withRetry(action);
    const assertion = expect(promise).rejects.toThrow('TIMEOUT');
    await vi.advanceTimersByTimeAsync(2000);

    await assertion;
    expect(action).toHaveBeenCalledTimes(3);
  });
});
