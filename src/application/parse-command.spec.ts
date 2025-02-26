import { describe, expect, test } from 'vitest';

import { formatCommand, parseCommand } from './parse-command';

describe('parseCommand', () => {
  test('empty string', () => {
    expect(parseCommand('')).toEqual([]);
  });

  test('simple command', () => {
    expect(parseCommand('ls')).toEqual(['ls']);
  });

  test('command with args', () => {
    expect(parseCommand('echo hello world')).toEqual(['echo', 'hello', 'world']);
  });

  test('command with multiple consecutive spaces', () => {
    expect(parseCommand('echo hello  world')).toEqual(['echo', 'hello', 'world']);
  });

  test('simple quotes', () => {
    expect(parseCommand("echo 'hello world'")).toEqual(['echo', 'hello world']);
  });

  test('double quotes', () => {
    expect(parseCommand('echo "hello world"')).toEqual(['echo', 'hello world']);
  });

  test('multiple quotes', () => {
    expect(parseCommand('echo "hello world" "foo bar"')).toEqual(['echo', 'hello world', 'foo bar']);
  });

  test('quoted empty string', () => {
    expect(parseCommand('echo "" hello')).toEqual(['echo', '', 'hello']);
  });

  test('quoted empty string at end of input', () => {
    expect(parseCommand('echo ""')).toEqual(['echo', '']);
  });

  test('unterminated quotes', () => {
    expect(parseCommand('echo "hello world')).toEqual(['echo', '"hello world']);
  });

  test('unterminated quotes at end of input', () => {
    expect(parseCommand('echo hello world"')).toEqual(['echo', 'hello', 'world"']);
  });

  test('first quote within text', () => {
    expect(parseCommand('echo hello"world"')).toEqual(['echo', 'helloworld']);
  });

  test('second quote within text', () => {
    expect(parseCommand('echo "hello"world')).toEqual(['echo', 'helloworld']);
  });
});

describe('formatCommand', () => {
  test('empty command', () => {
    expect(formatCommand([])).toEqual('');
  });

  test('command without args', () => {
    expect(formatCommand(['ls'])).toEqual('ls');
  });

  test('command with args', () => {
    expect(formatCommand(['ls', '-l', '-h'])).toEqual('ls -l -h');
  });

  test('args with spaces', () => {
    expect(formatCommand(['echo', 'hello world'])).toEqual('echo "hello world"');
  });

  test('args with spaces and simple quotes', () => {
    expect(formatCommand(['echo', "hello 'world'"])).toEqual('echo "hello \'world\'"');
  });

  test('args with spaces and double quotes', () => {
    expect(formatCommand(['echo', 'hello "world"'])).toEqual('echo \'hello "world"\'');
  });

  test('args with empty string', () => {
    expect(formatCommand(['echo', ''])).toEqual("echo ''");
  });

  test.each([
    [['ls']],
    [['ls', '-l', '-h']],
    [['echo', '', 'hello "world"', "hello 'world'"]],
    [['nginx', '-g', 'daemon off;']],
  ])('format and parse %o', (command) => {
    expect(parseCommand(formatCommand(command))).toEqual(command);
  });
});
