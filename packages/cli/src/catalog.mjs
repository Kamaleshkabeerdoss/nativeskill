import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import ts from 'typescript';

const unwrap = (node) => {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
         ts.isSatisfiesExpression(node) || ts.isTypeAssertionExpression(node) ||
         ts.isNonNullExpression(node)) {
    node = node.expression;
  }
  return node;
};

function add(entries, path, kind, value) {
  entries.set(JSON.stringify(path), { path, kind, value });
}

function readJson(entries, input, path = []) {
  if (typeof input === 'string') {
    add(entries, path, 'text', input);
  } else if (input && typeof input === 'object') {
    for (const [name, value] of Object.entries(input)) readJson(entries, value, [...path, name]);
  } else {
    add(entries, path, 'nontext', input);
  }
}

function readLiteral(entries, expression, path = []) {
  const node = unwrap(expression);
  if (ts.isObjectLiteralExpression(node)) {
    const keys = new Set();
    for (const property of node.properties) {
      const name = property.name;
      if (!name || (!ts.isIdentifier(name) && !ts.isStringLiteral(name) && !ts.isNumericLiteral(name))) {
        throw new Error('Dictionary spreads and computed keys need a resolved catalog at ' + (path.join('.') || 'the root'));
      }
      if (keys.has(name.text)) throw new Error('Duplicate dictionary key: ' + [...path, name.text].join('.'));
      keys.add(name.text);
      const child = [...path, name.text];
      if (ts.isPropertyAssignment(property)) readLiteral(entries, property.initializer, child);
      else add(entries, child, 'dynamic');
    }
  } else if (ts.isArrayLiteralExpression(node)) {
    if (node.elements.some(ts.isSpreadElement)) throw new Error('Dictionary arrays with spreads need a resolved catalog');
    node.elements.forEach((element, position) => readLiteral(entries, element, [...path, String(position)]));
  } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    add(entries, path, 'text', node.text);
  } else if (ts.isNumericLiteral(node) || [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)) {
    add(entries, path, 'nontext');
  } else {
    add(entries, path, 'dynamic');
  }
}

function selectExport(source, exportName) {
  const constants = new Map();
  const exported = new Map();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      constants.set(declaration.name.text, declaration.initializer);
      if (statement.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)) {
        exported.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      exported.set('default', statement.expression);
    } else if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause &&
        ts.isNamedExports(statement.exportClause) && !statement.isTypeOnly) {
      for (const element of statement.exportClause.elements) {
        const initializer = constants.get((element.propertyName ?? element.name).text);
        if (initializer && !element.isTypeOnly) exported.set(element.name.text, initializer);
      }
    } else if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
      const { left, operatorToken, right } = statement.expression;
      if (operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(left) &&
        ts.isIdentifier(left.expression) && left.expression.text === 'module' && left.name.text === 'exports') {
        exported.set('default', right);
      }
    }
  }

  let node = exportName ? exported.get(exportName) : exported.get('default');
  if (!node && !exportName && exported.size === 1) node = exported.values().next().value;
  const seen = new Set();
  while (node && ts.isIdentifier(unwrap(node))) {
    const { text } = unwrap(node);
    if (seen.has(text)) throw new Error('Circular dictionary export: ' + text);
    seen.add(text);
    node = constants.get(text);
  }
  if (!node || !ts.isObjectLiteralExpression(unwrap(node))) {
    throw new Error('Expected a static object export. Specify its name when the file has multiple exports.');
  }
  return node;
}

export function readCatalog(file, exportName) {
  const input = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const entries = new Map();
  try {
    const extension = extname(file).toLowerCase();
    if (extension === '.json') {
      const value = JSON.parse(input);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object at the catalog root');
      readJson(entries, value);
    } else if (['.ts', '.js', '.mts', '.cts', '.mjs', '.cjs'].includes(extension)) {
      const language = ['.js', '.mjs', '.cjs'].includes(extension) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
      const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, language);
      const diagnostic = source.parseDiagnostics[0];
      if (diagnostic) throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      readLiteral(entries, selectExport(source, exportName));
    } else {
      throw new Error('Catalog must be JSON or a static JavaScript or TypeScript dictionary');
    }
  } catch (error) {
    throw new Error(file + ': ' + error.message, { cause: error });
  }
  return entries;
}
