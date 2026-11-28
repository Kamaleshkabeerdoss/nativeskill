// Zero-dependency reader for TypeScript and JavaScript dictionaries.
//
// Reads `export const ms: Dict = { ... }`, `export default { ... }` and `module.exports = { ... }`,
// including arrow functions, template literals, ternaries, spreads, `en.section` aliases,
// imports of other locale files, `as const` and `satisfies`. Nothing is executed. Functions are
// evaluated symbolically: every parameter becomes a `{name}` placeholder taken from the source
// text, so no bundler can rename it, and every branch of a ternary, `if` or `switch` is kept.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export class DictionaryError extends Error {}

const PUNCTUATORS = ['...', '===', '!==', '**', '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--',
  '+=', '-=', '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~',
  '?', ':', '=', '.', '@', '#'];
const STATEMENT_WORDS = new Set(['export', 'import', 'const', 'let', 'var', 'type', 'interface', 'function', 'class',
  'declare', 'enum', 'namespace', 'module', 'abstract']);
const MAX_VARIANTS = 32;

function locate(source, index) {
  return source.slice(0, index).split('\n').length;
}

function readEscape(source, index) {
  const next = source[index + 1];
  const simple = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  if (next in simple && !(next === '0' && /\d/.test(source[index + 2] ?? ''))) return [simple[next], index + 2];
  if (next === 'x') return [String.fromCharCode(parseInt(source.slice(index + 2, index + 4), 16)), index + 4];
  if (next === 'u' && source[index + 2] === '{') {
    const end = source.indexOf('}', index);
    return [String.fromCodePoint(parseInt(source.slice(index + 3, end), 16)), end + 1];
  }
  if (next === 'u') return [String.fromCharCode(parseInt(source.slice(index + 2, index + 6), 16)), index + 6];
  if (next === '\r' && source[index + 2] === '\n') return ['', index + 3];
  if (next === '\n' || next === '\r') return ['', index + 2];
  return [next, index + 2];
}

function readString(source, start, fail) {
  const quote = source[start];
  let value = '';
  let index = start + 1;
  while (index < source.length && source[index] !== quote) {
    if (source[index] === '\n') fail('Unclosed string', start);
    if (source[index] === '\\') {
      const [text, next] = readEscape(source, index);
      value += text;
      index = next;
    } else {
      value += source[index];
      index += 1;
    }
  }
  if (index >= source.length) fail('Unclosed string', start);
  return [value, index + 1];
}

// Returns the index just after the closing brace that matches the `{` before `start`.
function skipBalanced(source, start, fail) {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const char = source[index];
    if (char === '"' || char === "'") { index = readString(source, index, fail)[1]; continue; }
    if (char === '`') { index = readTemplate(source, index, fail)[1]; continue; }
    if (source.startsWith('//', index)) { const end = source.indexOf('\n', index); index = end < 0 ? source.length : end; continue; }
    if (source.startsWith('/*', index)) { index = source.indexOf('*/', index + 2) + 2; if (index < 2) fail('Unclosed comment', start); continue; }
    if (char === '{') depth += 1;
    if (char === '}') { depth -= 1; if (!depth) return index + 1; }
    index += 1;
  }
  fail('Unclosed ${ in a template literal', start);
}

function readTemplate(source, start, fail) {
  const quasis = [];
  const expressions = [];
  let text = '';
  let index = start + 1;
  while (index < source.length && source[index] !== '`') {
    if (source[index] === '\\') {
      const [escaped, next] = readEscape(source, index);
      text += escaped;
      index = next;
    } else if (source.startsWith('${', index)) {
      quasis.push(text);
      text = '';
      const end = skipBalanced(source, index + 2, fail);
      expressions.push({ text: source.slice(index + 2, end - 1), offset: index + 2 });
      index = end;
    } else {
      text += source[index];
      index += 1;
    }
  }
  if (index >= source.length) fail('Unclosed template literal', start);
  quasis.push(text);
  return [{ quasis, expressions }, index + 1];
}

function tokenize(source, fail, base = 0) {
  const tokens = [];
  let index = 0;
  let newline = true;
  const push = (token, end) => { tokens.push({ ...token, pos: base + index, end: base + end, newline }); newline = false; };
  while (index < source.length) {
    const char = source[index];
    if (char === '\n') { newline = true; index += 1; continue; }
    if (/\s/.test(char)) { index += 1; continue; }
    if (source.startsWith('//', index)) { const end = source.indexOf('\n', index); index = end < 0 ? source.length : end; continue; }
    if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) fail('Unclosed comment', base + index);
      if (source.slice(index, end).includes('\n')) newline = true;
      index = end + 2;
      continue;
    }
    if (char === '"' || char === "'") {
      const [value, end] = readString(source, index, (message, at) => fail(message, base + at));
      push({ type: 'string', value }, end);
      index = end;
      continue;
    }
    if (char === '`') {
      const [value, end] = readTemplate(source, index, (message, at) => fail(message, base + at));
      value.expressions = value.expressions.map((item) => ({ ...item, offset: base + item.offset }));
      push({ type: 'template', value }, end);
      index = end;
      continue;
    }
    const number = source.slice(index).match(/^(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?|\.\d[\d_]*(?:[eE][+-]?\d+)?)n?/);
    if (number) {
      push({ type: 'number', value: Number(number[0].replace(/_|n$/g, '')) }, index + number[0].length);
      index += number[0].length;
      continue;
    }
    const word = source.slice(index).match(/^[\p{L}\p{Nl}$_][\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}$\u200c\u200d]*/u);
    if (word) {
      push({ type: 'name', value: word[0] }, index + word[0].length);
      index += word[0].length;
      continue;
    }
    if (char === '/') {
      const previous = tokens.at(-1);
      const regexAllowed = !previous || (previous.type === 'punct' && !')]}'.includes(previous.value)) ||
        (previous.type === 'name' && ['return', 'typeof', 'case', 'in', 'of', 'void'].includes(previous.value));
      if (regexAllowed) {
        let end = index + 1;
        let inClass = false;
        while (end < source.length && (inClass || source[end] !== '/')) {
          if (source[end] === '\\') end += 1;
          else if (source[end] === '[') inClass = true;
          else if (source[end] === ']') inClass = false;
          else if (source[end] === '\n') fail('Unclosed regular expression', base + index);
          end += 1;
        }
        end += 1;
        while (/[a-z]/i.test(source[end] ?? '')) end += 1;
        push({ type: 'regex', value: source.slice(index, end) }, end);
        index = end;
        continue;
      }
    }
    const punct = PUNCTUATORS.find((item) => source.startsWith(item, index));
    if (!punct) fail('Unexpected character ' + JSON.stringify(char), base + index);
    push({ type: 'punct', value: punct }, index + punct.length);
    index += punct.length;
  }
  tokens.push({ type: 'eof', pos: base + source.length, newline: true });
  return tokens;
}

const BINARY = {
  '??': 1, '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '===': 6, '!==': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7, instanceof: 7, in: 7, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10, '**': 11
};

class Parser {
  constructor(tokens, source, file, fail) {
    this.tokens = tokens;
    this.index = 0;
    this.source = source;
    this.file = file;
    this.fail = fail;
  }

  peek(offset = 0) { return this.tokens[Math.min(this.index + offset, this.tokens.length - 1)]; }
  next() { const token = this.peek(); if (token.type !== 'eof') this.index += 1; return token; }
  is(value, offset = 0) { const token = this.peek(offset); return (token.type === 'punct' || token.type === 'name') && token.value === value; }
  eat(value) { if (this.is(value)) { this.next(); return true; } return false; }
  expect(value) {
    if (!this.eat(value)) this.fail('Expected ' + value + ' but found ' + (this.peek().value ?? this.peek().type), this.peek().pos);
  }

  // Index of the token that closes the bracket at `start`.
  matching(start) {
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const stack = [];
    for (let index = start; index < this.tokens.length; index += 1) {
      const token = this.tokens[index];
      if (token.type !== 'punct') continue;
      if (pairs[token.value]) stack.push(pairs[token.value]);
      else if (token.value === stack.at(-1)) { stack.pop(); if (!stack.length) return index; }
    }
    this.fail('Unclosed bracket', this.tokens[start].pos);
  }

  // Skips a type annotation. Stops at a depth-0 token in `stops`.
  skipType(stops) {
    let depth = 0;
    const start = this.index;
    while (this.peek().type !== 'eof') {
      const token = this.peek();
      if (!depth && this.index > start && token.newline && token.type === 'name' && STATEMENT_WORDS.has(token.value)) return;
      if (token.type === 'punct') {
        if (!depth && stops.has(token.value)) return;
        if ('([{<'.includes(token.value)) depth += 1;
        if (')]}>'.includes(token.value)) { if (!depth) return; depth -= 1; }
      }
      this.next();
    }
  }

  skipStatement() {
    let depth = 0;
    const start = this.index;
    while (this.peek().type !== 'eof') {
      const token = this.peek();
      if (this.index > start && !depth && token.newline && token.type === 'name' && STATEMENT_WORDS.has(token.value)) return;
      if (token.type === 'punct') {
        if (!depth && token.value === ';') { this.next(); return; }
        if ('([{'.includes(token.value)) depth += 1;
        if (')]}'.includes(token.value)) {
          depth -= 1;
          if (!depth && token.value === '}' && this.peek(1).newline) { this.next(); return; }
        }
      }
      this.next();
    }
  }

  program() {
    const module = { bindings: new Map(), imports: new Map(), exports: new Map(), reexports: new Map(), assignments: [] };
    while (this.peek().type !== 'eof') {
      if (this.eat(';')) continue;
      if (this.functionDeclaration(module, false)) continue;
      if (this.is('import') && !this.is('(', 1) && !this.is('.', 1)) { this.importStatement(module); continue; }
      if (this.is('export')) { this.exportStatement(module); continue; }
      if (this.is('const') || this.is('let') || this.is('var')) { this.declaration(module, false); continue; }
      if (this.is('module') && this.is('.', 1) && this.peek(2).value === 'exports' && this.is('=', 3)) {
        this.index += 4;
        module.exports.set('default', this.expression());
        continue;
      }
      if (this.is('exports') && this.is('.', 1) && this.is('=', 3)) {
        const name = this.peek(2).value;
        this.index += 4;
        module.exports.set(name, this.expression());
        continue;
      }
      if (this.is('interface') || (this.is('declare'))) { this.skipDeclarationBlock(); continue; }
      if (this.peek().type === 'name' && (this.is('[', 1) || this.is('.', 1)) && this.assignment(module)) continue;
      if (this.is('type') && this.peek(1).type === 'name' && !this.peek(1).newline) { this.skipStatement(); continue; }
      this.skipStatement();
    }
    // `TABLE['ar-SA'] = TABLE['ar-AE']` and `TABLE.extra = {...}` after a declaration extend that object.
    for (const { target, value } of module.assignments) {
      if (target.object.type !== 'id') continue;
      const object = module.bindings.get(target.object.name);
      const key = target.property ?? (['string', 'number'].includes(target.computed?.type) ? String(target.computed.value) : null);
      if (object?.type === 'object' && key !== null) object.properties.push({ key, computed: null, value });
    }
    return module;
  }

  // `function name(...) {...}` and `async function`. Returns false when the next tokens are not one.
  functionDeclaration(module, exported) {
    const offset = this.is('async') && this.is('function', 1) ? 1 : 0;
    if (!this.is('function', offset) || this.peek(offset + 1).type !== 'name' || this.peek(offset + 1).value === '(') return false;
    const name = this.peek(offset + 1).value;
    const node = this.primary();
    module.bindings.set(name, node);
    if (exported) module.exports.set(name, node);
    return true;
  }

  // A top-level `NAME[...] = value` or `NAME.key = value`. Anything else is skipped as before.
  assignment(module) {
    const start = this.index;
    try {
      const target = this.postfix(this.primary());
      if (target.type === 'member' && this.is('=') ) {
        this.next();
        module.assignments.push({ target, value: this.expression() });
        this.eat(';');
        return true;
      }
    } catch { /* not an assignment we understand */ }
    this.index = start;
    return false;
  }

  skipDeclarationBlock() {
    while (this.peek().type !== 'eof' && !this.is('{') && !this.is(';')) this.next();
    if (this.is('{')) this.index = this.matching(this.index) + 1;
    else this.eat(';');
  }

  importStatement(module) {
    this.expect('import');
    if (this.is('type') && !this.is(',', 1) && !this.is('from', 1)) { this.skipStatement(); return; }
    if (this.peek().type === 'string') { this.next(); this.eat(';'); return; }
    const names = [];
    if (this.peek().type === 'name' && !this.is('from')) {
      names.push({ local: this.next().value, imported: 'default' });
      this.eat(',');
    }
    if (this.eat('*')) { this.expect('as'); names.push({ local: this.next().value, imported: '*' }); }
    if (this.eat('{')) {
      while (!this.eat('}')) {
        const typeOnly = this.is('type') && this.peek(1).type === 'name' && !this.is(',', 1) && !this.is('}', 1);
        if (typeOnly) this.next();
        const imported = this.next().value;
        const local = this.eat('as') ? this.next().value : imported;
        if (!typeOnly) names.push({ local, imported });
        this.eat(',');
      }
    }
    this.expect('from');
    const specifier = this.next().value;
    this.eat(';');
    for (const name of names) module.imports.set(name.local, { specifier, imported: name.imported });
  }

  exportStatement(module) {
    this.expect('export');
    if (this.eat('default')) {
      if (this.is('interface')) { this.skipDeclarationBlock(); return; }
      module.exports.set('default', this.expression());
      this.eat(';');
      return;
    }
    if (this.is('const') || this.is('let') || this.is('var')) { this.declaration(module, true); return; }
    if (this.functionDeclaration(module, true)) return;
    if (this.is('type') && this.is('{', 1)) { this.skipStatement(); return; }
    if (this.is('*')) { this.skipStatement(); return; }
    if (this.eat('{')) {
      const names = [];
      while (!this.eat('}')) {
        if (this.is('type') && this.peek(1).type === 'name' && !this.is(',', 1) && !this.is('}', 1)) { this.next(); this.next(); if (this.eat('as')) this.next(); this.eat(','); continue; }
        const local = this.next().value;
        const exported = this.eat('as') ? this.next().value : local;
        names.push({ local, exported });
        this.eat(',');
      }
      if (this.eat('from')) {
        const specifier = this.next().value;
        for (const { local, exported } of names) module.reexports.set(exported, { specifier, imported: local });
      } else {
        for (const { local, exported } of names) module.exports.set(exported, { type: 'id', name: local });
      }
      this.eat(';');
      return;
    }
    this.skipDeclarationBlock();
  }

  declaration(module, exported) {
    this.next();
    do {
      if (this.is('{') || this.is('[')) { this.skipStatement(); return; }
      const name = this.next().value;
      if (this.eat('!')) { /* definite assignment */ }
      if (this.eat(':')) this.skipType(new Set(['=', ',', ';']));
      if (!this.eat('=')) continue;
      const value = this.expression();
      module.bindings.set(name, value);
      if (exported) module.exports.set(name, value);
    } while (this.eat(','));
    this.eat(';');
  }

  expression() {
    return this.conditional();
  }

  conditional() {
    const test = this.binary(0);
    if (!this.eat('?')) return test;
    const consequent = this.expression();
    this.expect(':');
    const alternate = this.expression();
    return { type: 'cond', test, consequent, alternate };
  }

  binary(minimum) {
    let left = this.unary();
    for (;;) {
      const token = this.peek();
      const operator = token.value;
      if (!(token.type === 'punct' || token.type === 'name') || !(operator in BINARY) || BINARY[operator] <= minimum - 1 || BINARY[operator] < minimum) break;
      if (token.type === 'name' && !['instanceof', 'in'].includes(operator)) break;
      this.next();
      const right = this.binary(BINARY[operator] + (operator === '**' ? 0 : 1));
      left = { type: 'binary', operator, left, right };
    }
    return left;
  }

  unary() {
    const token = this.peek();
    if (token.type === 'punct' && ['!', '-', '+', '~'].includes(token.value)) {
      this.next();
      return { type: 'unary', operator: token.value, argument: this.unary() };
    }
    if (token.type === 'name' && ['typeof', 'void', 'await', 'delete'].includes(token.value) && !this.is(':', 1) && !this.is(',', 1)) {
      this.next();
      return { type: 'unary', operator: token.value, argument: this.unary() };
    }
    if (token.type === 'punct' && token.value === '<' ) {
      // <Type>value assertion
      this.next();
      this.skipType(new Set(['>']));
      this.expect('>');
      return this.unary();
    }
    return this.postfix(this.primary());
  }

  postfix(node) {
    for (;;) {
      if (this.is('.') || (this.is('?.') && this.peek(1).type === 'name')) {
        this.next();
        node = { type: 'member', object: node, property: this.next().value };
      } else if (this.is('?.') && this.is('[', 1)) {
        this.next();
        this.next();
        const property = this.expression();
        this.expect(']');
        node = { type: 'member', object: node, computed: property };
      } else if (this.is('[') && !this.peek().newline) {
        this.next();
        const property = this.expression();
        this.expect(']');
        node = { type: 'member', object: node, computed: property };
      } else if (this.is('(') || (this.is('?.') && this.is('(', 1))) {
        this.eat('?.');
        node = { type: 'call', callee: node, args: this.arguments() };
      } else if (this.is('!') && !this.is('=', 1)) {
        this.next();
      } else if (this.peek().type === 'template') {
        this.next();
        node = { type: 'call', callee: node, args: [] };
      } else if ((this.is('as') || this.is('satisfies')) && !this.peek().newline) {
        this.next();
        this.skipType(new Set([',', ')', ']', '}', ';', '?', ':', '=', '||', '&&', '??', '+', '-', '*', '/', '===', '!==', '==', '!=']));
      } else {
        return node;
      }
    }
  }

  arguments() {
    this.expect('(');
    const args = [];
    while (!this.eat(')')) {
      if (this.eat('...')) args.push({ type: 'spread', argument: this.expression() });
      else args.push(this.expression());
      this.eat(',');
    }
    return args;
  }

  arrowAhead() {
    if (!this.is('(')) return false;
    const close = this.matching(this.index);
    const after = this.tokens[close + 1];
    if (after?.type === 'punct' && after.value === '=>') return true;
    if (after?.type === 'punct' && after.value === ':') {
      let depth = 0;
      for (let index = close + 2; index < this.tokens.length; index += 1) {
        const token = this.tokens[index];
        if (token.type !== 'punct') continue;
        if (!depth && token.value === '=>') return true;
        if ('([{<'.includes(token.value)) depth += 1;
        else if (')]}>'.includes(token.value)) { if (!depth) return false; depth -= 1; }
        else if (!depth && [',', ';', '='].includes(token.value)) return false;
      }
    }
    return false;
  }

  parameters() {
    const close = this.matching(this.index);
    const names = [];
    let depth = 0;
    let expectName = true;
    let inDefault = false;
    for (let index = this.index + 1; index < close; index += 1) {
      const token = this.tokens[index];
      if (token.type === 'punct') {
        if ('([{<'.includes(token.value)) { depth += 1; if (token.value === '{' || token.value === '[') expectName = depth === 1 && !inDefault ? true : expectName; continue; }
        if (')]}>'.includes(token.value)) { depth -= 1; continue; }
        if (token.value === ',' && depth <= 1) { expectName = true; if (!depth) inDefault = false; continue; }
        if (token.value === ':' ) { expectName = depth === 1 && !inDefault && this.tokens[index - 1].type === 'name' ? 'rename' : false; continue; }
        if (token.value === '=' && !depth) { inDefault = true; expectName = false; continue; }
        if (token.value === '=' ) { expectName = false; continue; }
        if (token.value === '...') continue;
        continue;
      }
      if (token.type === 'name' && expectName && !inDefault) {
        if (expectName === 'rename' && names.length) names.pop();
        names.push(token.value);
        expectName = false;
      }
    }
    this.index = close + 1;
    if (this.eat(':')) this.skipType(new Set(['=>', '{']));
    return names;
  }

  functionBody(params, start) {
    let body;
    if (this.is('{')) {
      const open = this.index;
      const close = this.matching(open);
      body = this.block(open + 1, close);
      this.index = close + 1;
    } else {
      body = this.expression();
    }
    const end = this.tokens[this.index - 1].end;
    return { type: 'function', params, body, text: this.source.slice(start, end) };
  }

  // Collects `return` expressions and simple local constants from a block body.
  block(from, to) {
    const saved = this.index;
    const returns = [];
    const locals = new Map();
    this.index = from;
    while (this.index < to) {
      if (this.is('return')) {
        this.next();
        if (this.is(';') || this.is('}') || this.peek().newline) { returns.push({ type: 'string', value: '' }); continue; }
        returns.push(this.expression());
        continue;
      }
      if ((this.is('const') || this.is('let') || this.is('var')) && this.peek(1).type === 'name') {
        this.next();
        const name = this.next().value;
        if (this.eat(':')) this.skipType(new Set(['=', ';']));
        if (this.eat('=')) locals.set(name, this.expression());
        continue;
      }
      if (this.is('=>') || this.is('function')) {
        // A nested function: skip its body so its returns are not ours.
        this.next();
        if (this.is('(')) this.index = this.matching(this.index) + 1;
        if (this.is('{')) this.index = this.matching(this.index) + 1;
        continue;
      }
      this.next();
    }
    this.index = saved;
    return { type: 'block', returns, locals };
  }

  primary() {
    const token = this.peek();
    if (token.type === 'string') { this.next(); return { type: 'string', value: token.value }; }
    if (token.type === 'number') { this.next(); return { type: 'number', value: token.value }; }
    if (token.type === 'regex') { this.next(); return { type: 'unknown', text: token.value }; }
    if (token.type === 'template') {
      this.next();
      const expressions = token.value.expressions.map(({ text, offset }) => {
        const tokens = tokenize(text, this.fail, offset);
        const parser = new Parser(tokens, this.source, this.file, this.fail);
        return parser.expression();
      });
      return { type: 'template', quasis: token.value.quasis, expressions };
    }
    if (token.type === 'name') {
      if (token.value === 'async' && (this.is('(', 1) || this.peek(1).type === 'name') && !this.peek(1).newline) this.next();
      const current = this.peek();
      if (current.value === 'function') {
        const start = current.pos;
        this.next();
        this.eat('*');
        if (this.peek().type === 'name') this.next();
        if (this.is('<')) { this.next(); this.skipType(new Set(['>'])); this.expect('>'); }
        const params = this.parameters();
        return this.functionBody(params, start);
      }
      if (this.peek(1).type === 'punct' && this.peek(1).value === '=>' && !['true', 'false', 'null'].includes(current.value)) {
        const start = current.pos;
        this.next();
        this.next();
        return this.functionBody([current.value], start);
      }
      if (current.value === 'new') {
        this.next();
        const callee = this.postfixNoCall(this.primary());
        const args = this.is('(') ? this.arguments() : [];
        return { type: 'new', callee, args };
      }
      this.next();
      if (current.value === 'true' || current.value === 'false') return { type: 'boolean', value: current.value === 'true' };
      if (current.value === 'null' || current.value === 'undefined') return { type: 'null' };
      return { type: 'id', name: current.value };
    }
    if (token.type === 'punct') {
      if (token.value === '(' || token.value === '<') {
        if (token.value === '<') { this.next(); this.skipType(new Set(['>'])); this.expect('>'); }
        if (this.arrowAhead()) {
          const start = this.peek().pos;
          const params = this.parameters();
          this.expect('=>');
          return this.functionBody(params, start);
        }
        this.next();
        let node = this.expression();
        while (this.eat(',')) node = this.expression();
        this.expect(')');
        return node;
      }
      if (token.value === '{') return this.object();
      if (token.value === '[') return this.array();
    }
    this.fail('Unexpected ' + (token.value ?? token.type), token.pos);
  }

  postfixNoCall(node) {
    while (this.is('.')) { this.next(); node = { type: 'member', object: node, property: this.next().value }; }
    return node;
  }

  object() {
    this.expect('{');
    const properties = [];
    while (!this.eat('}')) {
      if (this.eat('...')) {
        properties.push({ spread: this.expression() });
      } else {
        const token = this.peek();
        let key;
        let computed = null;
        if (this.eat('[')) { computed = this.expression(); this.expect(']'); }
        else if (token.type === 'name' || token.type === 'string' || token.type === 'number') { this.next(); key = String(token.value); }
        else this.fail('Unexpected ' + (token.value ?? token.type) + ' in an object', token.pos);
        if ((key === 'get' || key === 'set' || key === 'async') && !this.is(':') && !this.is('(') && !this.is(',') && !this.is('}')) {
          const name = this.next();
          key = String(name.value);
        }
        if (this.is('(') || this.is('<')) {
          const start = token.pos;
          if (this.is('<')) { this.next(); this.skipType(new Set(['>'])); this.expect('>'); }
          const params = this.parameters();
          properties.push({ key, computed, value: this.functionBody(params, start) });
        } else if (this.eat(':')) {
          properties.push({ key, computed, value: this.expression() });
        } else {
          if (this.eat('=')) this.expression();
          properties.push({ key, computed, value: { type: 'id', name: key } });
        }
      }
      if (!this.eat(',')) { this.expect('}'); break; }
    }
    return { type: 'object', properties };
  }

  array() {
    this.expect('[');
    const elements = [];
    while (!this.eat(']')) {
      if (this.is(',')) { this.next(); elements.push({ type: 'null' }); continue; }
      if (this.eat('...')) elements.push({ type: 'spread', argument: this.expression() });
      else elements.push(this.expression());
      if (!this.eat(',')) { this.expect(']'); break; }
    }
    return { type: 'array', elements };
  }
}

const moduleCache = new Map();

function parseModule(file) {
  const path = realpathSync(file);
  if (moduleCache.has(path)) return moduleCache.get(path);
  const source = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const fail = (message, at = 0) => { throw new DictionaryError(path + ':' + locate(source, at) + ': ' + message); };
  let module;
  if (extname(path) === '.json') {
    module = { json: JSON.parse(source), path };
  } else {
    const tokens = tokenize(source, fail);
    module = new Parser(tokens, source, path, fail).program();
    module.path = path;
  }
  moduleCache.set(path, module);
  return module;
}

function resolveSpecifier(from, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;
  const base = resolve(dirname(from), specifier);
  const extensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.jsx', '.json'];
  const candidates = [base, ...extensions.map((extension) => base + extension), ...extensions.map((extension) => base + '/index' + extension)];
  if (/\.(m|c)?js$/.test(base)) candidates.push(base.replace(/\.(m|c)?js$/, '.ts'), base.replace(/\.(m|c)?js$/, '.tsx'), base.replace(/\.(m|c)?js$/, '.mts'));
  return candidates.find((candidate) => existsSync(candidate) && !candidate.endsWith('/')) ?? null;
}

function jsonToNode(value) {
  if (typeof value === 'string') return { type: 'string', value };
  if (typeof value === 'number') return { type: 'number', value };
  if (typeof value === 'boolean') return { type: 'boolean', value };
  if (Array.isArray(value)) return { type: 'array', elements: value.map(jsonToNode) };
  if (value && typeof value === 'object') return { type: 'object', properties: Object.entries(value).map(([key, item]) => ({ key, value: jsonToNode(item) })) };
  return { type: 'null' };
}

// A scope resolves names: function parameters first, then block locals, then module bindings and imports.
function scopeFor(module, params = new Set(), locals = new Map(), parent = null, bound = null) {
  return { module, params, locals, parent, bound };
}

function lookupName(scope, name, seen = new Set()) {
  for (let current = scope; current; current = current.parent) {
    if (current.bound?.has(name)) return current.bound.get(name);
    if (current.params.has(name)) return { param: name };
    if (current.locals.has(name)) return { node: current.locals.get(name), scope: current };
  }
  const { module } = scope;
  if (module.json) return null;
  if (module.bindings.has(name)) return { node: module.bindings.get(name), scope: scopeFor(module) };
  if (module.imports.has(name)) {
    const { specifier, imported } = module.imports.get(name);
    const target = resolveSpecifier(module.path, specifier);
    if (!target) return { external: specifier };
    const key = target + '\0' + imported;
    if (seen.has(key)) throw new DictionaryError('Circular import of ' + imported + ' from ' + specifier);
    seen.add(key);
    const exported = exportNode(parseModule(target), imported, seen);
    return exported ? { ...exported, imported: true, label: name } : { external: specifier };
  }
  return null;
}

function exportNode(module, name, seen = new Set()) {
  if (module.json) return name === 'default' || name === '*' ? { node: jsonToNode(module.json), scope: scopeFor(module) } : null;
  if (name === '*') {
    const properties = [...module.exports.keys()].map((key) => ({ key, value: { type: 'id', name: key, exportOf: module } }));
    return { node: { type: 'object', properties }, scope: scopeFor(module) };
  }
  if (module.exports.has(name)) {
    const node = module.exports.get(name);
    return { node, scope: scopeFor(module) };
  }
  if (module.reexports.has(name)) {
    const { specifier, imported } = module.reexports.get(name);
    const target = resolveSpecifier(module.path, specifier);
    if (!target) return null;
    return exportNode(parseModule(target), imported, seen);
  }
  return null;
}

// ---------- symbolic text evaluation

function placeholderName(text) {
  return text.replace(/[^\p{L}\p{N}_$-]+/gu, '_').replace(/^_+|_+$/g, '') || 'value';
}

function paramsIn(node, scope, found = new Set()) {
  if (!node || typeof node !== 'object') return found;
  if (node.type === 'id') {
    const hit = lookupNameSafe(scope, node.name);
    if (hit?.param) found.add(hit.param);
    return found;
  }
  if (node.type === 'function') return found;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => paramsIn(item, scope, found));
    else if (value && typeof value === 'object' && value.type) paramsIn(value, scope, found);
  }
  return found;
}

function lookupNameSafe(scope, name) {
  try { return lookupName(scope, name); } catch { return null; }
}

function rootName(node) {
  while (node.type === 'member' || node.type === 'call') node = node.type === 'member' ? node.object : node.callee;
  return node.type === 'id' ? node.name : null;
}

function dotted(node) {
  if (node.type === 'id') return node.name;
  if (node.type === 'member' && node.property) return dotted(node.object) + '.' + node.property;
  return null;
}

function combine(parts) {
  let all = [''];
  let primary = '';
  for (const part of parts) {
    primary += part.primary;
    const next = [];
    for (const left of all) for (const right of part.all) {
      if (next.length >= MAX_VARIANTS) break;
      next.push(left + right);
    }
    all = next;
  }
  if (!all.includes(primary)) all = [primary, ...all.slice(0, MAX_VARIANTS - 1)];
  const dynamic = parts.find((part) => part.dynamic)?.dynamic;
  return dynamic ? { primary, all: [...new Set(all)], dynamic } : { primary, all: [...new Set(all)] };
}

function union(primary, ...groups) {
  const all = [];
  for (const group of groups) for (const item of group.all) if (!all.includes(item) && all.length < MAX_VARIANTS) all.push(item);
  if (!all.includes(primary)) all.unshift(primary);
  const dynamic = groups.find((group) => group.dynamic)?.dynamic;
  return dynamic ? { primary, all, dynamic } : { primary, all };
}

const single = (text) => ({ primary: text, all: [text] });

// The primary branch models a typical count such as 5 and non-empty strings.
function guess(node, scope) {
  if (!node) return null;
  if (node.type === 'id') {
    const hit = lookupNameSafe(scope, node.name);
    return hit?.param ? true : null;
  }
  if (node.type === 'member' && node.property === 'length') return true;
  if (node.type === 'unary' && node.operator === '!') { const value = guess(node.argument, scope); return value === null ? null : !value; }
  if (node.type === 'binary') {
    if (node.operator === '&&' || node.operator === '||') {
      const left = guess(node.left, scope);
      const right = guess(node.right, scope);
      if (left === null || right === null) return null;
      return node.operator === '&&' ? left && right : left || right;
    }
    const numericSide = (side) => side.type === 'number' ? side.value : null;
    const paramSide = (side) => (side.type === 'id' && lookupNameSafe(scope, side.name)?.param) || (side.type === 'member' && side.property === 'length');
    let value = null;
    let flipped = false;
    if (paramSide(node.left) && numericSide(node.right) !== null) value = numericSide(node.right);
    else if (paramSide(node.right) && numericSide(node.left) !== null) { value = numericSide(node.left); flipped = true; }
    if (value === null) {
      const left = staticKey(node.left, scope);
      const right = staticKey(node.right, scope);
      if (left !== null && right !== null && ['===', '==', '!==', '!='].includes(node.operator)) {
        return node.operator.startsWith('!') ? left !== right : left === right;
      }
      if (['===', '==', '!==', '!='].includes(node.operator) && (node.left.type === 'string' || node.right.type === 'string')) {
        return node.operator.startsWith('!');
      }
      return null;
    }
    const sample = 5;
    const [a, b] = flipped ? [value, sample] : [sample, value];
    switch (node.operator) {
      case '===': case '==': return a === b;
      case '!==': case '!=': return a !== b;
      case '>': return a > b;
      case '>=': return a >= b;
      case '<': return a < b;
      case '<=': return a <= b;
      default: return null;
    }
  }
  return null;
}

function textOf(node, scope, depth = 0) {
  if (depth > 40) return single('');
  switch (node?.type) {
    case 'string': return single(node.value);
    case 'number': return single(String(node.value));
    case 'boolean': return single(String(node.value));
    case 'null': return single('');
    case 'template': {
      const parts = [];
      node.quasis.forEach((quasi, index) => {
        parts.push(single(quasi));
        if (index < node.expressions.length) parts.push(textOf(node.expressions[index], scope, depth + 1));
      });
      return combine(parts);
    }
    case 'id': {
      const hit = lookupNameSafe(scope, node.name);
      if (hit?.param) return single('{' + hit.param + '}');
      if (hit?.node && ['string', 'template', 'binary', 'cond', 'number'].includes(hit.node.type)) return textOf(hit.node, hit.scope, depth + 1);
      if (hit?.node && ['member', 'call', 'resolved'].includes(hit.node.type)) {
        const value = safeValue(hit.node, hit.scope);
        if (value?.kind === 'text') return { primary: value.text, all: value.variants ?? [value.text] };
      }
      return single('{' + placeholderName(node.name) + '}');
    }
    case 'cond': {
      const consequent = textOf(node.consequent, scope, depth + 1);
      const alternate = textOf(node.alternate, scope, depth + 1);
      const pick = guess(node.test, scope);
      return union(pick === false ? alternate.primary : consequent.primary, consequent, alternate);
    }
    case 'binary': {
      if (node.operator === '+') {
        const left = textOf(node.left, scope, depth + 1);
        const right = textOf(node.right, scope, depth + 1);
        const numeric = (side) => side.type === 'number';
        if (numeric(node.left) || numeric(node.right)) {
          const names = [...paramsIn(node, scope)];
          if (names.length === 1) return single('{' + names[0] + '}');
        }
        return combine([left, right]);
      }
      if (['||', '??'].includes(node.operator)) {
        const left = textOf(node.left, scope, depth + 1);
        const right = textOf(node.right, scope, depth + 1);
        return union(left.primary, left, right);
      }
      if (node.operator === '&&') {
        const right = textOf(node.right, scope, depth + 1);
        return union(right.primary, right, single(''));
      }
      break;
    }
    case 'member': {
      if (node.computed && node.object.type === 'object') {
        const values = node.object.properties.filter((item) => item.value).map((item) => ({ key: item.key, text: textOf(item.value, scope, depth + 1) }));
        if (values.length) {
          const primary = (values.find((item) => item.key === 'other') ?? values.at(-1)).text.primary;
          return union(primary, ...values.map((item) => item.text));
        }
      }
      const path = dotted(node);
      const root = rootName(node);
      const hit = root ? lookupNameSafe(scope, root) : null;
      if (hit?.param) return single('{' + placeholderName(path ?? hit.param) + '}');
      if ((path && hit?.node) || node.computed) {
        try {
          const value = valueOf(node, scope);
          if (value.kind === 'text') return { primary: value.text, all: value.variants ?? [value.text] };
        } catch { /* fall through */ }
      }
      return single('{' + placeholderName(path ?? 'value') + '}');
    }
    case 'call': {
      const names = [...paramsIn(node, scope)];
      const callee = node.callee;
      if (callee.type === 'member' && ['toLocaleString', 'toString', 'toFixed', 'trim', 'toUpperCase', 'toLowerCase'].includes(callee.property)) {
        return textOf(callee.object, scope, depth + 1);
      }
      if (callee.type === 'member' && callee.property === 'join' && callee.object.type === 'array') {
        return combine(callee.object.elements.map((item) => textOf(item, scope, depth + 1)));
      }
      if (!names.length) {
        const value = safeValue(node, scope);
        if (value?.kind === 'text') return { primary: value.text, all: value.variants ?? [value.text] };
      }
      // A local helper such as plural(n, 'file', 'files') picks words at run time.
      const helper = callee.type === 'id' ? lookupNameSafe(scope, callee.name) : null;
      const wordArgs = node.args.filter((arg) => (arg.type === 'string' || arg.type === 'template') && /\p{L}/u.test(textOf(arg, scope, depth + 1).primary));
      if (callee.type === 'id' && wordArgs.length && (helper?.node?.type === 'function' || helper?.external || !helper)) {
        const where = helper?.external ? ' from ' + helper.external : '';
        const text = single('{' + placeholderName(callee.name) + '}');
        text.dynamic = 'calls the helper ' + callee.name + '()' + where + ' with words in its arguments (' +
          wordArgs.map((arg) => JSON.stringify(textOf(arg, scope, depth + 1).primary)).join(', ') +
          '), so the words it returns cannot be read statically. Check this entry by hand, or use Intl.PluralRules or ICU plural syntax';
        return text;
      }
      if (names.length === 1) return single('{' + names[0] + '}');
      return single('{' + placeholderName(dotted(callee) ?? 'value') + '}');
    }
    default: break;
  }
  const names = [...paramsIn(node, scope)];
  return single(names.length === 1 ? '{' + names[0] + '}' : '');
}

function functionText(node, scope) {
  const inner = scopeFor(scope.module, new Set(node.params), node.body.type === 'block' ? node.body.locals : new Map(), scope);
  let result;
  if (node.body.type === 'block') {
    const returns = node.body.returns.map((item) => textOf(item, inner));
    if (!returns.length) result = single('');
    else result = union(returns.at(-1).primary, ...returns);
  } else {
    result = textOf(node.body, inner);
  }
  if (result.dynamic) return { kind: 'dynamic', reason: result.dynamic };
  const numericBranch = /(?:[=!]==?|[<>]=?)\s*[0-2]\b|\b[0-2]\s*(?:[=!]==?|[<>]=?)/.test(node.text) &&
    /\?|\bif\b|\bswitch\b/.test(node.text);
  return {
    kind: 'text', text: result.primary, variants: result.all.length > 1 ? result.all : undefined,
    fn: { params: node.params, numericBranch, pluralRules: /PluralRules|\bplural\s*\(/.test(node.text), source: node.text }
  };
}

function safeValue(node, scope) {
  try { return valueOf(node, scope); } catch { return null; }
}

// The literal value of a key expression such as 'ar-AE', 3, a bound argument or a constant. Null when unknown.
function staticKey(node, scope, depth = 0) {
  if (!node || depth > 20) return null;
  switch (node.type) {
    case 'string': case 'number': return node.value;
    case 'template': {
      let out = node.quasis[0];
      for (let index = 0; index < node.expressions.length; index += 1) {
        const part = staticKey(node.expressions[index], scope, depth + 1);
        if (part === null) return null;
        out += part + node.quasis[index + 1];
      }
      return out;
    }
    case 'id': {
      const hit = lookupNameSafe(scope, node.name);
      return hit?.node ? staticKey(hit.node, hit.scope, depth + 1) : null;
    }
    case 'resolved': return node.value?.kind === 'text' ? node.value.text : null;
    case 'binary': {
      if (node.operator !== '??' && node.operator !== '||') return null;
      return staticKey(node.left, scope, depth + 1) ?? staticKey(node.right, scope, depth + 1);
    }
    case 'member': {
      const value = safeValue(node, scope);
      return value?.kind === 'text' ? value.text : null;
    }
    default: return null;
  }
}

// Evaluates a local helper with its arguments bound, e.g. `labels(['Inbox', 'Bots'])`.
function callFunction(fn, fnScope, args, depth) {
  const bound = new Map();
  fn.params.forEach((param, index) => bound.set(param, args[index] ?? { node: { type: 'undefined' }, scope: fnScope }));
  const locals = fn.body.type === 'block' ? fn.body.locals : new Map();
  const inner = scopeFor(fnScope.module, new Set(), locals, fnScope, bound);
  const body = fn.body.type === 'block' ? fn.body.returns.at(-1) : fn.body;
  if (!body) return { kind: 'missing' };
  return valueOf(body, inner, depth + 1);
}

function functionAt(node, scope) {
  if (node?.type === 'function') return { node, scope };
  if (node?.type === 'id') {
    const hit = lookupNameSafe(scope, node.name);
    if (hit?.node?.type === 'function') return hit;
  }
  return null;
}

function propertyOf(base, key, depth) {
  const property = [...base.node.properties].reverse()
    .find((item) => item.value && (item.key === key || (item.computed && String(staticKey(item.computed, base.scope)) === key)));
  if (property) {
    const value = valueOf(property.value, base.scope, depth + 1);
    return base.alias ? { ...value, alias: (value.alias && value.alias !== base.alias ? value.alias : base.alias + '.' + key) } : value;
  }
  // The property may come from a spread inside the base object.
  for (const item of [...base.node.properties].reverse()) {
    if (!item.spread) continue;
    const spread = valueOf(item.spread, base.scope, depth + 1);
    if (spread.kind !== 'object' && spread.kind !== 'merge') continue;
    const inner = memberOf(spread, key, depth + 1);
    if (inner.kind !== 'missing') return base.alias ? { ...inner, alias: inner.alias ?? base.alias + '.' + key } : inner;
  }
  return { kind: 'missing' };
}

// The elements of an array value with `...spread` arrays expanded. Null when a spread is not a static array.
function arrayItems(value, depth = 0) {
  const items = [];
  for (const element of value.node.elements) {
    if (element.type !== 'spread') { items.push({ node: element, scope: value.scope }); continue; }
    const inner = valueOf(element.argument, value.scope, depth + 1);
    if (inner.kind !== 'array') return null;
    const nested = arrayItems(inner, depth + 1);
    if (!nested) return null;
    items.push(...nested);
  }
  return items;
}

function memberOf(base, key, depth) {
  if (base.kind === 'missing' || base.nullish) return { kind: 'missing' };
  if (base.kind === 'array') {
    const items = arrayItems(base, depth);
    if (!items) return { kind: 'dynamic', reason: 'spread of an array the checker cannot read' };
    if (key === 'length') return { kind: 'nontext', number: items.length };
    const item = /^\d+$/.test(key) ? items[Number(key)] : undefined;
    return item ? valueOf(item.node, item.scope, depth + 1) : { kind: 'missing' };
  }
  if (base.kind === 'merge') {
    for (const part of [...base.parts].reverse()) {
      const inner = memberOf(part, key, depth + 1);
      if (inner.kind !== 'missing') return inner;
    }
    return { kind: 'missing' };
  }
  if (base.kind !== 'object') return { kind: 'dynamic', reason: 'computed value' };
  return propertyOf(base, key, depth);
}

function valueOf(node, scope, depth = 0) {
  if (depth > 60) throw new DictionaryError('Dictionary nesting is too deep or circular');
  switch (node?.type) {
    case 'object': return { kind: 'object', node, scope };
    case 'array': return { kind: 'array', node, scope };
    case 'string': case 'template': {
      const text = textOf(node, scope);
      if (text.dynamic) return { kind: 'dynamic', reason: text.dynamic };
      return { kind: 'text', text: text.primary, variants: undefined };
    }
    case 'number': return { kind: 'nontext', number: Number(node.value) };
    case 'boolean': return { kind: 'nontext' };
    case 'null': return { kind: 'nontext', nullish: true };
    case 'undefined': return { kind: 'missing' };
    case 'function': {
      const body = node.body.type === 'block' ? node.body.returns.at(-1) : node.body;
      if (body && (body.type === 'array' || body.type === 'object')) {
        const inner = scopeFor(scope.module, new Set(node.params), node.body.type === 'block' ? node.body.locals : new Map(), scope);
        return { kind: body.type, node: body, scope: inner };
      }
      return functionText(node, scope);
    }
    case 'cond': case 'binary': {
      if (node.type === 'binary' && (node.operator === '??' || node.operator === '||') && !paramsIn(node.left, scope).size) {
        // A static left side: `LOCALES[lang] ?? LOCALES['en-IN']`, `l[i] ?? 'WhatsApp'`.
        const left = valueOf(node.left, scope, depth + 1);
        const empty = left.kind === 'missing' || left.nullish || (node.operator === '||' && left.kind === 'text' && left.text === '');
        if (empty) return valueOf(node.right, scope, depth + 1);
        if (left.kind !== 'dynamic') return left;
      }
      if (node.type === 'cond') {
        const pick = guess(node.test, scope);
        if (pick !== null) {
          const chosen = valueOf(pick ? node.consequent : node.alternate, scope, depth + 1);
          if (chosen.kind === 'object' || chosen.kind === 'array' || chosen.kind === 'merge') return chosen;
        }
      }
      const text = textOf(node, scope);
      if (text.dynamic) return { kind: 'dynamic', reason: text.dynamic };
      return { kind: 'text', text: text.primary, variants: text.all.length > 1 ? text.all : undefined };
    }
    case 'id': {
      if (node.exportOf) {
        const exported = exportNode(node.exportOf, node.name);
        if (!exported) return { kind: 'dynamic', reason: 'export ' + node.name + ' not found' };
        return { ...valueOf(exported.node, exported.scope, depth + 1), via: node.name };
      }
      const hit = lookupName(scope, node.name);
      if (!hit) return { kind: 'dynamic', reason: node.name + ' is not defined in this file' };
      if (hit.param) return { kind: 'dynamic', reason: 'parameter ' + hit.param };
      if (hit.external) return { kind: 'dynamic', reason: node.name + ' comes from the package ' + hit.external };
      const value = valueOf(hit.node, hit.scope, depth + 1);
      return hit.imported ? { ...value, alias: value.alias ?? node.name } : value;
    }
    case 'member': {
      let key = node.property;
      if (node.computed) {
        key = staticKey(node.computed, scope);
        if (key === null) return { kind: 'dynamic', reason: 'computed value' };
        key = String(key);
      }
      return memberOf(valueOf(node.object, scope, depth + 1), key, depth);
    }
    case 'resolved': return node.value;
    case 'call': {
      const callee = dotted(node.callee) ?? '';
      if (/^Object\.freeze$|^defineMessages$|^defineDictionary$|^satisfies$/i.test(callee) && node.args.length === 1) return valueOf(node.args[0], scope, depth + 1);
      if (/^Object\.assign$|merge/i.test(callee)) {
        return { kind: 'merge', parts: node.args.map((arg) => valueOf(arg, scope, depth + 1)), deep: /merge/i.test(callee) };
      }
      if (callee === 'Object.fromEntries' && node.args.length === 1) {
        const list = valueOf(node.args[0], scope, depth + 1);
        if (list.kind !== 'array') return { kind: 'dynamic', reason: 'Object.fromEntries of ' + (list.reason ?? 'a non-array') };
        const properties = [];
        for (const element of list.node.elements) {
          const pair = valueOf(element, list.scope, depth + 1);
          const key = pair.kind === 'array' ? staticKey(pair.node.elements[0], pair.scope) : null;
          if (key === null) return { kind: 'dynamic', reason: 'Object.fromEntries with keys that are not static' };
          properties.push({ key: String(key), computed: null, value: { type: 'resolved', value: valueOf(pair.node.elements[1] ?? { type: 'undefined' }, pair.scope, depth + 1) } });
        }
        return { kind: 'object', node: { type: 'object', properties }, scope };
      }
      if (node.callee.type === 'member' && ['map', 'slice', 'join'].includes(node.callee.property)) {
        const base = valueOf(node.callee.object, scope, depth + 1);
        const items = base.kind === 'array' ? arrayItems(base, depth) : null;
        if (items) {
          const elements = items.map((item) => ({ type: 'resolved', value: valueOf(item.node, item.scope, depth + 1) }));
          if (node.callee.property === 'slice') {
            const from = node.args[0] ? staticKey(node.args[0], scope) : 0;
            const to = node.args[1] ? staticKey(node.args[1], scope) : undefined;
            if (from !== null && to !== null) return { kind: 'array', node: { type: 'array', elements: elements.slice(Number(from), to === undefined ? undefined : Number(to)) }, scope };
          }
          if (node.callee.property === 'join') {
            const separator = node.args[0] ? staticKey(node.args[0], scope) : ',';
            const texts = elements.map((element) => element.value);
            if (separator !== null && texts.every((item) => item.kind === 'text')) return { kind: 'text', text: texts.map((item) => item.text).join(separator) };
          }
          const fn = node.callee.property === 'map' && functionAt(node.args[0], scope);
          if (fn) {
            const mapped = elements.map((element, index) => ({
              type: 'resolved',
              value: callFunction(fn.node, fn.scope, [{ node: element, scope }, { node: { type: 'number', value: index }, scope }], depth + 1)
            }));
            return { kind: 'array', node: { type: 'array', elements: mapped }, scope };
          }
        }
      }
      const helper = node.callee.type === 'id' && functionAt(node.callee, scope);
      if (helper) {
        if (node.args.some((arg) => arg.type === 'spread')) return { kind: 'dynamic', reason: 'calls ' + callee + ' with a spread argument' };
        const value = callFunction(helper.node, helper.scope, node.args.map((arg) => ({ node: arg, scope })), depth + 1);
        if (value.kind !== 'dynamic') return value;
        return { kind: 'dynamic', reason: 'calls ' + callee + '(): ' + value.reason };
      }
      return { kind: 'dynamic', reason: 'calls ' + (callee || 'a function') };
    }
    default: return { kind: 'dynamic', reason: 'expression of type ' + (node?.type ?? 'unknown') };
  }
}

function setEntry(entries, key, value) {
  for (const existing of [...entries.keys()]) if (existing === key || existing.startsWith(key + '.')) entries.delete(existing);
  entries.set(key, value);
}

function walk(value, path, entries, alias, depth = 0) {
  if (depth > 60) throw new DictionaryError('Dictionary nesting is too deep or circular');
  const here = path.join('.');
  const label = value.alias ?? alias;
  if (value.kind === 'object') {
    for (const property of value.node.properties) {
      if (property.spread) {
        const spread = valueOf(property.spread, value.scope);
        if (spread.kind === 'object' || spread.kind === 'merge') walk(spread, path, entries, spread.alias ?? label, depth + 1);
        else if (spread.kind === 'missing' || spread.nullish) continue;
        else entries.set(here + (here ? '.' : '') + '…', { dynamic: true, reason: 'spread of ' + (spread.reason ?? 'a non-object') });
        continue;
      }
      if (property.computed && staticKey(property.computed, value.scope) !== null) {
        const key = String(staticKey(property.computed, value.scope));
        const child = valueOf(property.value, value.scope);
        walk(child, [...path, key], entries, child.alias ?? label, depth + 1);
        continue;
      }
      if (property.computed) {
        entries.set([...path, '[computed]'].join('.'), { dynamic: true, reason: 'computed key' });
        continue;
      }
      const child = valueOf(property.value, value.scope);
      const key = [...path, property.key].join('.');
      for (const existing of [...entries.keys()]) if (existing === key || existing.startsWith(key + '.')) entries.delete(existing);
      walk(child, [...path, property.key], entries, child.alias ?? label, depth + 1);
    }
  } else if (value.kind === 'merge') {
    for (const part of value.parts) walk(part, path, entries, part.alias ?? label, depth + 1);
  } else if (value.kind === 'array') {
    const items = arrayItems(value, depth);
    if (!items) entries.set(here + (here ? '.' : '') + '…', { dynamic: true, reason: 'spread of an array the checker cannot read' });
    else items.forEach((item, index) => walk(valueOf(item.node, item.scope), [...path, String(index)], entries, label, depth + 1));
  } else if (value.kind === 'text') {
    const entry = { text: value.text };
    if (value.variants) entry.variants = value.variants;
    if (value.fn) entry.fn = value.fn;
    if (label) entry.alias = label;
    setEntry(entries, here, entry);
  } else if (value.kind === 'nontext' || value.kind === 'missing') {
    // Numbers and booleans are configuration, not copy.
  } else {
    setEntry(entries, here, { dynamic: true, reason: value.reason ?? 'unknown value' });
  }
}

function pickExport(module, file, exportName, locale, flags = DEFAULT_FLAGS) {
  if (module.json) return { node: jsonToNode(module.json), scope: scopeFor(module) };
  const names = [...module.exports.keys(), ...module.reexports.keys()];
  if (exportName) {
    const found = topLevel(module, exportName);
    if (!found) {
      throw new DictionaryError(file + ': no export or top-level constant named ' + exportName + '. Exports: ' + (names.join(', ') || 'none') +
        '. Top-level constants: ' + ([...module.bindings.keys()].join(', ') || 'none') + '.');
    }
    return { ...found, name: exportName };
  }
  if (module.exports.has('default')) return { ...exportNode(module, 'default'), name: 'default' };
  const isObject = (name, find = exportNode) => {
    try {
      const found = find(module, name);
      const value = found && valueOf(found.node, found.scope);
      return value && (value.kind === 'object' || value.kind === 'merge');
    } catch { return false; }
  };
  const objects = names.filter((name) => isObject(name));
  if (objects.length === 1) return { ...exportNode(module, objects[0]), name: objects[0] };
  const stem = basename(file).replace(/\.[^.]+$/, '');
  const wanted = [stem, locale, locale && knownLocale(locale) && new Intl.Locale(knownLocale(locale)).language].filter(Boolean)
    .map((name) => name.replace(/[^A-Za-z0-9_$]/g, '_'));
  for (const name of wanted) {
    const match = objects.find((item) => item.toLowerCase() === name.toLowerCase());
    if (match) return { ...exportNode(module, match), name: match };
  }
  if (!objects.length) {
    const local = [...module.bindings.keys()].filter((name) => !module.exports.has(name) && isObject(name, (m, n) => topLevel(m, n)));
    const functions = [...module.exports.keys()].filter((name) => module.exports.get(name)?.type === 'function');
    let hint = 'Export the dictionary as a plain object';
    if (local.length) hint += ', or pass ' + flags.export + ' <name> to read a top-level constant (' + local.join(', ') + ')';
    if (functions.length) hint += ', or pass ' + flags.resolve + ' <function> to evaluate one of ' + functions.join(', ') + ' for a locale';
    throw new DictionaryError(file + ': found no exported object literal. ' + hint + '.');
  }
  throw new DictionaryError(file + ': several exported objects (' + objects.join(', ') + '). Pass ' + flags.export + ' <name> to pick one' +
    (locale ? '' : ', or ' + flags.locale + ' <tag> when one is named after the locale') + '.');
}

const DEFAULT_FLAGS = { export: '--export', key: '--key', resolve: '--resolve', locale: '--locale' };

// The canonical form of a BCP 47 tag whose language Intl knows ('en-IN', 'fil'), or null ('xx', 'hello').
export function knownLocale(tag) {
  if (typeof tag !== 'string' || !/^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/.test(tag)) return null;
  try {
    const [canonical] = Intl.getCanonicalLocales(tag.replace(/_/g, '-'));
    const { language } = new Intl.Locale(canonical);
    const name = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(language);
    return name ? canonical : null;
  } catch {
    return null;
  }
}

// `{ en: {...}, ja: {...} }`, `Record<Locale, Dict>`: at least two keys, every key a locale, values objects.
function localeRecordKeys(value) {
  if (value?.kind !== 'object') return null;
  const keys = [];
  for (const property of value.node.properties) {
    if (property.spread) continue;
    const key = property.computed ? staticKey(property.computed, value.scope) : property.key;
    if (key === null || !knownLocale(String(key))) return null;
    if (!keys.includes(String(key))) keys.push(String(key));
  }
  if (keys.length < 2) return null;
  const first = safeValue(value.node.properties.find((property) => !property.spread).value, value.scope);
  return first && (first.kind === 'object' || first.kind === 'merge') ? keys : null;
}

function chooseKey(keys, locale, file, what, flags) {
  const list = keys.join(', ');
  if (!locale) throw new DictionaryError(file + ': ' + what + ' is keyed by locale (' + list + '). Pass ' + flags.key + ' <key> or ' + flags.locale + ' <tag> to pick one.');
  const want = (knownLocale(locale) ?? locale).toLowerCase();
  const exact = keys.find((key) => (knownLocale(key) ?? key).toLowerCase() === want);
  if (exact) return exact;
  const language = want.split('-')[0];
  const same = keys.filter((key) => (knownLocale(key) ?? key).toLowerCase().split('-')[0] === language);
  if (same.length === 1) return same[0];
  if (same.length > 1) throw new DictionaryError(file + ': ' + what + ' has several keys for ' + locale + ' (' + same.join(', ') + '). Pass ' + flags.key + ' <key> to pick one.');
  throw new DictionaryError(file + ': ' + what + ' has no key for ' + locale + '. Keys: ' + list + '. Pass ' + flags.key + ' <key> to pick one.');
}

function topLevel(module, name) {
  const exported = exportNode(module, name);
  if (exported) return exported;
  if (module.bindings?.has(name)) return { node: module.bindings.get(name), scope: scopeFor(module) };
  return null;
}

// Every locale key used by the module's locale tables, imported ones included.
function moduleLocaleKeys(module) {
  const keys = [];
  for (const name of [...(module.bindings?.keys() ?? []), ...(module.imports?.keys() ?? [])]) {
    const found = localeRecordKeys(safeValue({ type: 'id', name }, scopeFor(module)));
    for (const key of found ?? []) if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

// An exported function such as `resolveStrings(language)` that indexes locale tables and returns an object.
function autoResolver(module) {
  if (!module.exports?.size) return null;
  const candidates = [];
  for (const [name, node] of module.exports) {
    if (node.type !== 'function' || !node.params.length) continue;
    const body = node.body.type === 'block' ? node.body.returns.at(-1) : node.body;
    if (body?.type !== 'object' || !/\[\s*[A-Za-z_$][\w$]*\s*\]/.test(node.text)) continue;
    candidates.push(name);
  }
  if (candidates.length !== 1 || !moduleLocaleKeys(module).length) return null;
  return candidates[0];
}

// Returns Map<key, { text, variants?, fn?, alias? } | { dynamic, reason }>. The map's `selected` property says
// what was read, e.g. `EXTRA["ja"]` or `resolveStrings("ta-IN")`.
export function readDictionary(file, options = {}) {
  const { exportName, locale, localeKey } = options;
  const flags = { ...DEFAULT_FLAGS, ...options.flags };
  const path = resolve(file);
  const module = parseModule(path);
  let value;
  let selected;
  const resolver = options.resolve ?? (!exportName && !module.json ? autoResolver(module) : null);
  if (resolver) {
    const fn = topLevel(module, resolver);
    if (!fn || fn.node.type !== 'function') {
      throw new DictionaryError(path + ': ' + flags.resolve + ' ' + resolver + ' names no top-level function in this file.');
    }
    const keys = moduleLocaleKeys(module);
    if (!keys.length && !localeKey) throw new DictionaryError(path + ': ' + resolver + '() reads no table keyed by locale that the checker can see. Pass ' + flags.key + ' <key> with the value to call it with.');
    const key = localeKey ?? chooseKey(keys, locale, path, 'the tables read by ' + resolver + '()', flags);
    value = callFunction(fn.node, fn.scope, [{ node: { type: 'string', value: key }, scope: fn.scope }], 0);
    selected = resolver + '(' + JSON.stringify(key) + ')';
    if (value.kind === 'dynamic') throw new DictionaryError(path + ': cannot evaluate ' + selected + ': ' + value.reason + '. Point ' + flags.export + ' at the tables instead.');
  } else {
    const root = pickExport(module, path, exportName, locale, flags);
    value = valueOf(root.node, root.scope);
    selected = root.name;
    const keys = localeRecordKeys(value);
    if (keys) {
      const key = localeKey ?? chooseKey(keys, locale, path, root.name ?? 'the export', flags);
      if (!keys.includes(key)) throw new DictionaryError(path + ': ' + (root.name ?? 'the export') + ' has no key ' + key + '. Keys: ' + keys.join(', ') + '.');
      value = memberOf(value, key, 0);
      selected = (root.name ?? 'default') + '[' + JSON.stringify(key) + ']';
    } else if (localeKey) {
      throw new DictionaryError(path + ': ' + flags.key + ' ' + localeKey + ' was given, but ' + (root.name ?? 'the export') + ' is not keyed by locale.');
    }
  }
  if (value.kind !== 'object' && value.kind !== 'merge') {
    throw new DictionaryError(path + ': ' + (selected ?? 'the export') + ' is not an object' + (value.reason ? ' (' + value.reason + ')' : '') + '.');
  }
  const entries = new Map();
  walk(value, [], entries, null);
  Object.defineProperty(entries, 'selected', { value: selected, enumerable: false });
  return entries;
}

// True for a file of strings: one dictionary, a file with one dictionary per locale export, or a locale table.
export function looksLikeDictionary(file) {
  const textual = (entries) => {
    const texts = [...entries.values()].filter((entry) => !entry.dynamic && /\p{L}/u.test(entry.text));
    return texts.length >= 3 && texts.length >= entries.size * 0.6;
  };
  try {
    return textual(readDictionary(file));
  } catch {
    try {
      const module = parseModule(resolve(file));
      for (const name of module.exports.keys()) {
        try { if (textual(readDictionary(file, { exportName: name, localeKey: undefined, locale: 'en' }))) return true; } catch { /* next */ }
      }
    } catch { /* not readable */ }
    return false;
  }
}

export function flatten(file, options = {}) {
  const out = {};
  for (const [key, entry] of readDictionary(file, options)) {
    if (entry.dynamic) continue;
    out[key] = entry.text;
    if (options.branches && entry.variants) entry.variants.forEach((text, index) => { if (text !== entry.text) out[key + '#' + index] = text; });
  }
  return out;
}

function invokedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

export const DICT_USAGE = 'Usage: node dict.mjs <dictionary.ts|.js> [--export <name>] [--locale <tag>] [--key <key>] [--resolve <function>] [--branches]';
export const DICT_OPTIONS = { '--export': 'exportName', '--locale': 'locale', '--key': 'localeKey', '--resolve': 'resolve' };

if (invokedDirectly()) {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    console.log(DICT_USAGE + '\n\nPrints the dictionary as flat JSON. Function parameters become {name} placeholders. --branches adds every other branch as key#n.\n' +
      '--export picks an export or top-level constant, --key an entry of a table keyed by locale ({ en: {...}, ms: {...} }; --locale picks it too),\n' +
      '--resolve evaluates a function such as resolveStrings(locale) that merges locale tables.');
    process.exitCode = args.length ? 0 : 2;
  } else {
    try {
      const options = { branches: false };
      const files = [];
      for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === '--branches') { options.branches = true; continue; }
        if (DICT_OPTIONS[arg]) {
          const value = args[++index];
          if (value === undefined || value.startsWith('--')) throw new Error('Missing value for ' + arg);
          options[DICT_OPTIONS[arg]] = value;
          continue;
        }
        if (arg.startsWith('-')) throw new Error('Unknown option ' + arg + '. ' + DICT_USAGE);
        files.push(arg);
      }
      if (files.length !== 1) throw new Error(DICT_USAGE);
      console.log(JSON.stringify(flatten(files[0], options), null, 2));
    } catch (error) {
      console.error('nativeskill: ' + error.message);
      process.exitCode = error instanceof DictionaryError ? 3 : 2;
    }
  }
}
