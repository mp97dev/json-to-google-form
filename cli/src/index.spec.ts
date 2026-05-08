import fs from 'node:fs/promises';
import { parseArgs, run } from './index';

function makeArgv(extra: string[] = []): string[] {
  return ['node', 'index.js', ...extra];
}

function mockFetch(responses: { ok: boolean; body: unknown }[]) {
  let call = 0;
  return jest.spyOn(global, 'fetch').mockImplementation(async () => {
    const r = responses[call++] ?? { ok: true, body: {} };
    return {
      ok: r.ok,
      statusText: r.ok ? 'OK' : 'Bad Request',
      json: async () => r.body,
    } as Response;
  });
}

describe('parseArgs', () => {
  it('sets help=true when no args given', () => {
    expect(parseArgs(['node', 'index.js']).help).toBe(true);
  });

  it('sets help=true for --help flag', () => {
    expect(parseArgs(makeArgv(['--help'])).help).toBe(true);
  });

  it('parses filePath from positional arg', () => {
    expect(parseArgs(makeArgv(['form.json'])).filePath).toBe('form.json');
  });

  it('parses --token flag', () => {
    expect(parseArgs(makeArgv(['form.json', '--token', 'abc'])).token).toBe('abc');
  });

  it('parses --backend-url flag', () => {
    expect(parseArgs(makeArgv(['form.json', '--backend-url', 'http://api'])).backendUrl).toBe('http://api');
  });

  it('parses --dry-run flag', () => {
    expect(parseArgs(makeArgv(['form.json', '--dry-run'])).dryRun).toBe(true);
  });

  it('falls back to GOOGLE_ACCESS_TOKEN env var', () => {
    process.env.GOOGLE_ACCESS_TOKEN = 'env-tok';
    const flags = parseArgs(makeArgv(['form.json']));
    delete process.env.GOOGLE_ACCESS_TOKEN;
    expect(flags.token).toBe('env-tok');
  });
});

describe('run', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = 0;
    delete process.env.GOOGLE_ACCESS_TOKEN;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints help and exitCode stays 0 when no args', async () => {
    await run(makeArgv());
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    expect(process.exitCode).toBe(0);
  });

  it('sets exitCode=1 when file cannot be read', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT'));
    await run(makeArgv(['missing.json', '--token', 'tok']));
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('cannot read file'));
  });

  it('sets exitCode=1 when file is not valid JSON', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('not-json' as never);
    await run(makeArgv(['form.json', '--token', 'tok']));
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not valid JSON'));
  });

  it('sets exitCode=1 when validation fails', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('{}' as never);
    mockFetch([{ ok: true, body: { valid: false, errors: ['missing field'] } }]);
    await run(makeArgv(['form.json', '--token', 'tok']));
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
  });

  it('exits 0 and does not call create with --dry-run', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('{}' as never);
    const fetchSpy = mockFetch([{ ok: true, body: { valid: true, errors: [] } }]);
    await run(makeArgv(['form.json', '--dry-run', '--token', 'tok']));
    expect(process.exitCode).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('sets exitCode=1 when no token and not dry-run', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('{}' as never);
    mockFetch([{ ok: true, body: { valid: true, errors: [] } }]);
    await run(makeArgv(['form.json']));
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--token'));
  });

  it('prints formUrl on happy path', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('{}' as never);
    mockFetch([
      { ok: true, body: { valid: true, errors: [] } },
      { ok: true, body: { formUrl: 'https://docs.google.com/forms/d/abc/viewform' } },
    ]);
    await run(makeArgv(['form.json', '--token', 'tok']));
    expect(process.exitCode).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith('https://docs.google.com/forms/d/abc/viewform');
  });

  it('sets exitCode=1 when create returns non-ok response', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('{}' as never);
    mockFetch([
      { ok: true, body: { valid: true, errors: [] } },
      { ok: false, body: { message: 'Unauthorized' } },
    ]);
    await run(makeArgv(['form.json', '--token', 'bad-tok']));
    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'));
  });
});
