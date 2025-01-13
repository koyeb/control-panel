import { last } from 'lodash-es';
import { useState, useEffect } from 'react';

import { type CodeEditorLanguage } from './code-editor';

// eslint-disable-next-line react-refresh/only-export-components
export function useCodeEditorLanguage(fileName?: string) {
  const [language, setLanguage] = useState<CodeEditorLanguage>(() => detectLanguage(fileName) ?? 'plaintext');

  useEffect(() => {
    const detected = detectLanguage(fileName);

    if (detected) {
      setLanguage(detected);
    }
  }, [fileName]);

  return [language, setLanguage] as const;
}

function detectLanguage(fileName?: string): CodeEditorLanguage | undefined {
  const extension = last(fileName?.split('.') ?? []);

  if (extension) {
    return extensionMap[extension];
  }
}

const extensionMap: Record<string, CodeEditorLanguage> = {
  apl: 'apl',
  asc: 'asciiArmor',
  asterisk: 'asterisk',
  b: 'brainfuck',
  c: 'c',
  ceylon: 'ceylon',
  clj: 'clojure',
  cmake: 'cmake',
  cob: 'cobol',
  coffee: 'coffeescript',
  cr: 'crystal',
  cs: 'csharp',
  css: 'css',
  cypher: 'cypher',
  d: 'd',
  dart: 'dart',
  diff: 'diff',
  dockerfile: 'dockerfile',
  dtd: 'dtd',
  dylan: 'dylan',
  e: 'eiffel',
  ebnf: 'ebnf',
  ecl: 'ecl',
  elm: 'elm',
  erl: 'erlang',
  f90: 'fortran',
  factor: 'factor',
  fcl: 'fcl',
  feature: 'gherkin',
  forth: 'forth',
  go: 'go',
  groovy: 'groovy',
  hs: 'haskell',
  http: 'http',
  hx: 'haxe',
  idl: 'idl',
  jinja: 'jinja2',
  jl: 'julia',
  jsx: 'jsx',
  kt: 'kotlin',
  less: 'less',
  liquid: 'liquid',
  lisp: 'commonLisp',
  ls: 'livescript',
  lua: 'lua',
  m: 'objectiveC',
  man: 'troff',
  mbox: 'mbox',
  md: 'markdown',
  mm: 'objectiveCpp',
  mmd: 'mermaid',
  mo: 'modelica',
  mps: 'mumps',
  mrc: 'mirc',
  mscgen: 'mscgen',
  nb: 'mathematica',
  nc: 'nesC',
  ng: 'angular',
  nginx: 'nginx',
  nix: 'nix',
  nsi: 'nsis',
  nt: 'ntriples',
  nut: 'squirrel',
  oz: 'oz',
  pas: 'pascal',
  pgsql: 'pgsql',
  pig: 'pig',
  pl: 'perl',
  pp: 'puppet',
  properties: 'properties',
  proto: 'protobuf',
  ps1: 'powershell',
  q: 'q',
  r: 'r',
  rb: 'ruby',
  rq: 'sparql',
  s: 'gas',
  sas: 'sas',
  scala: 'scala',
  scm: 'scheme',
  scss: 'sass',
  sh: 'shell',
  shader: 'shader',
  sieve: 'sieve',
  sol: 'solidity',
  solr: 'solr',
  sql: 'mysql',
  st: 'smalltalk',
  styl: 'stylus',
  svelte: 'svelte',
  swift: 'swift',
  sxt: 'stex',
  tcl: 'tcl',
  textile: 'textile',
  tid: 'tiddlyWiki',
  tiki: 'tiki',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  ttcn: 'ttcn',
  ttl: 'turtle',
  v: 'verilog',
  vb: 'vb',
  vbs: 'vbscript',
  vhd: 'vhdl',
  vm: 'velocity',
  vue: 'vue',
  webidl: 'webIDL',
  xls: 'spreadsheet',
  xq: 'xQuery',
  yaml: 'yaml',
  ys: 'yacas',
  z80: 'z80',
};
