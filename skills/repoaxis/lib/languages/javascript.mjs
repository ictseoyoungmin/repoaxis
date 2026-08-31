import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const acornCompressed = fs.readFileSync(new URL("../vendor/acorn-8.15.0.mjs.gz", import.meta.url));
const acornSource = zlib.gunzipSync(acornCompressed).toString("utf8");
const acornModuleUrl = `data:text/javascript;base64,${Buffer.from(acornSource).toString("base64")}`;
const { parse } = await import(acornModuleUrl);

export const JAVASCRIPT_PARSER = Object.freeze({ name: "acorn", version: "8.15.0" });

const SUPPORTED_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);

export function supportsJavaScript(repoPath) {
  return SUPPORTED_EXTENSIONS.has(path.posix.extname(repoPath).toLowerCase());
}

function compactSource(text) {
  return text.replace(/\s+/g, " ").trim();
}

function sourceSlice(source, start, end) {
  return compactSource(source.slice(start, end));
}

function parseJavaScript(source, repoPath) {
  const ext = path.posix.extname(repoPath).toLowerCase();
  const common = {
    ecmaVersion: "latest",
    locations: true,
    allowHashBang: true,
  };
  const sourceTypes = ext === ".mjs" ? ["module"] : ext === ".cjs" ? ["script"] : ["module", "script"];
  const errors = [];
  for (const sourceType of sourceTypes) {
    try {
      return parse(source, {
        ...common,
        sourceType,
        allowReturnOutsideFunction: sourceType === "script",
      });
    } catch (error) {
      errors.push(error);
    }
  }
  errors.sort((a, b) => (b?.pos ?? -1) - (a?.pos ?? -1));
  throw errors[0];
}

function propertyName(key, computed, source) {
  if (!key) return null;
  if (computed) return `[${sourceSlice(source, key.start, key.end)}]`;
  if (key.type === "Identifier") return key.name;
  if (key.type === "PrivateIdentifier") return `#${key.name}`;
  if (key.type === "Literal") return String(key.value);
  return sourceSlice(source, key.start, key.end) || null;
}

function functionFlags(node) {
  return {
    async: Boolean(node.async),
    generator: Boolean(node.generator),
  };
}

function rangeFor(node) {
  return {
    start_line: node.loc.start.line,
    start_column: node.loc.start.column,
    end_line: node.loc.end.line,
    end_column: node.loc.end.column,
  };
}

function classSignature(node, source) {
  return sourceSlice(source, node.start, node.body.start);
}

function functionSignature(node, source, owner = node) {
  const bodyStart = node.body?.start ?? node.end;
  return sourceSlice(source, owner.start, bodyStart);
}

function childNodes(node) {
  const children = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") continue;
    if (Array.isArray(value)) {
      for (const item of value) if (item && typeof item.type === "string") children.push(item);
    } else if (value && typeof value.type === "string") {
      children.push(value);
    }
  }
  return children;
}

function methodQualifiedName(classQn, element, source) {
  const base = propertyName(element.key, Boolean(element.computed), source);
  if (!base) return null;
  let suffix = "";
  if (element.kind === "get") suffix += "#get";
  if (element.kind === "set") suffix += "#set";
  if (element.static) suffix += "#static";
  return `${classQn}.${base}${suffix}`;
}

function classFieldQualifiedName(classQn, element, source) {
  const base = propertyName(element.key, Boolean(element.computed), source);
  if (!base) return null;
  return `${classQn}.${base}${element.static ? "#static" : ""}`;
}

export function extractJavaScriptSymbols(source, repoPath) {
  let ast;
  try {
    ast = parseJavaScript(source, repoPath);
  } catch (error) {
    return {
      symbols: [],
      diagnostic: {
        status: "error",
        message: String(error?.message ?? error),
        line: error?.loc?.line ?? null,
        column: error?.loc?.column ?? null,
      },
    };
  }

  const symbols = [];
  let keyCounter = 0;

  function addSymbol({ type, name, qualifiedName, parentKey, node, signature, meta = {} }) {
    const key = `symbol:${keyCounter++}`;
    symbols.push({
      key,
      type,
      name,
      qualified_name: qualifiedName,
      parent_key: parentKey,
      source: {
        ...rangeFor(node),
        signature,
      },
      meta,
    });
    return key;
  }

  function visit(node, scope, options = {}) {
    if (!node || typeof node.type !== "string") return;

    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) visit(node.declaration, scope, options);
      return;
    }

    if (node.type === "ExportDefaultDeclaration") {
      if (node.declaration) visit(node.declaration, scope, { ...options, defaultExport: true });
      return;
    }

    if (node.type === "FunctionDeclaration") {
      const name = node.id?.name ?? (options.defaultExport ? "default" : null);
      if (!name) return;
      const qn = scope.qualifiedName ? `${scope.qualifiedName}.${name}` : name;
      const key = addSymbol({
        type: "function",
        name,
        qualifiedName: qn,
        parentKey: scope.symbolKey,
        node,
        signature: functionSignature(node, source),
        meta: {
          language: "javascript",
          declaration_kind: "function",
          export_default: Boolean(options.defaultExport),
          ...functionFlags(node),
        },
      });
      visit(node.body, { symbolKey: key, qualifiedName: qn });
      return;
    }

    if (node.type === "ClassDeclaration") {
      const name = node.id?.name ?? (options.defaultExport ? "default" : null);
      if (!name) return;
      const qn = scope.qualifiedName ? `${scope.qualifiedName}.${name}` : name;
      const key = addSymbol({
        type: "class",
        name,
        qualifiedName: qn,
        parentKey: scope.symbolKey,
        node,
        signature: classSignature(node, source),
        meta: {
          language: "javascript",
          declaration_kind: "class",
          export_default: Boolean(options.defaultExport),
        },
      });
      visitClassBody(node.body, { symbolKey: key, qualifiedName: qn });
      return;
    }

    if (node.type === "VariableDeclaration") {
      for (const declarator of node.declarations) visitVariableDeclarator(declarator, scope);
      return;
    }

    if (node.type === "FunctionExpression") {
      if (node.id?.name) {
        const name = node.id.name;
        const qn = scope.qualifiedName ? `${scope.qualifiedName}.${name}` : name;
        const key = addSymbol({
          type: "function",
          name,
          qualifiedName: qn,
          parentKey: scope.symbolKey,
          node,
          signature: functionSignature(node, source),
          meta: { language: "javascript", declaration_kind: "function-expression", ...functionFlags(node) },
        });
        visit(node.body, { symbolKey: key, qualifiedName: qn });
      }
      return;
    }

    if (node.type === "ClassExpression") {
      if (node.id?.name) {
        const name = node.id.name;
        const qn = scope.qualifiedName ? `${scope.qualifiedName}.${name}` : name;
        const key = addSymbol({
          type: "class",
          name,
          qualifiedName: qn,
          parentKey: scope.symbolKey,
          node,
          signature: classSignature(node, source),
          meta: { language: "javascript", declaration_kind: "class-expression" },
        });
        visitClassBody(node.body, { symbolKey: key, qualifiedName: qn });
      }
      return;
    }

    for (const child of childNodes(node)) visit(child, scope);
  }

  function visitVariableDeclarator(declarator, scope) {
    const name = declarator.id?.type === "Identifier" ? declarator.id.name : null;
    const init = declarator.init;
    if (!name || !init) {
      if (init) visit(init, scope);
      return;
    }
    const qn = scope.qualifiedName ? `${scope.qualifiedName}.${name}` : name;

    if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
      const key = addSymbol({
        type: "function",
        name,
        qualifiedName: qn,
        parentKey: scope.symbolKey,
        node: declarator,
        signature: functionSignature(init, source, declarator),
        meta: {
          language: "javascript",
          declaration_kind: init.type === "ArrowFunctionExpression" ? "arrow" : "function-expression",
          ...functionFlags(init),
        },
      });
      if (init.body?.type === "BlockStatement") visit(init.body, { symbolKey: key, qualifiedName: qn });
      return;
    }

    if (init.type === "ClassExpression") {
      const key = addSymbol({
        type: "class",
        name,
        qualifiedName: qn,
        parentKey: scope.symbolKey,
        node: declarator,
        signature: sourceSlice(source, declarator.start, init.body.start),
        meta: { language: "javascript", declaration_kind: "class-expression" },
      });
      visitClassBody(init.body, { symbolKey: key, qualifiedName: qn });
      return;
    }

    visit(init, scope);
  }

  function visitClassBody(classBody, classScope) {
    for (const element of classBody.body) {
      if (element.type === "MethodDefinition") {
        const qn = methodQualifiedName(classScope.qualifiedName, element, source);
        if (!qn) continue;
        const name = propertyName(element.key, Boolean(element.computed), source);
        const key = addSymbol({
          type: "function",
          name,
          qualifiedName: qn,
          parentKey: classScope.symbolKey,
          node: element,
          signature: functionSignature(element.value, source, element),
          meta: {
            language: "javascript",
            declaration_kind: "method",
            method_kind: element.kind,
            static: Boolean(element.static),
            computed: Boolean(element.computed),
            ...functionFlags(element.value),
          },
        });
        visit(element.value.body, { symbolKey: key, qualifiedName: qn });
        continue;
      }

      if (element.type === "PropertyDefinition" && (element.value?.type === "ArrowFunctionExpression" || element.value?.type === "FunctionExpression")) {
        const qn = classFieldQualifiedName(classScope.qualifiedName, element, source);
        if (!qn) continue;
        const name = propertyName(element.key, Boolean(element.computed), source);
        const key = addSymbol({
          type: "function",
          name,
          qualifiedName: qn,
          parentKey: classScope.symbolKey,
          node: element,
          signature: functionSignature(element.value, source, element),
          meta: {
            language: "javascript",
            declaration_kind: "class-field-function",
            static: Boolean(element.static),
            computed: Boolean(element.computed),
            ...functionFlags(element.value),
          },
        });
        if (element.value.body?.type === "BlockStatement") visit(element.value.body, { symbolKey: key, qualifiedName: qn });
        continue;
      }

      if (element.type === "StaticBlock") {
        visit(element, classScope);
      }
    }
  }

  visit(ast, { symbolKey: null, qualifiedName: null });
  return { symbols, diagnostic: { status: "ok" } };
}

function importRecord(node, specifier, kind) {
  return {
    specifier,
    kind,
    line: node.loc?.start?.line ?? null,
    column: node.loc?.start?.column ?? null,
  };
}

function literalString(node) {
  if (node?.type === "Literal" && typeof node.value === "string") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions?.length === 0 && node.quasis?.length === 1) {
    return node.quasis[0].value.cooked ?? node.quasis[0].value.raw ?? null;
  }
  return null;
}

export function extractJavaScriptImports(source, repoPath) {
  let ast;
  try {
    ast = parseJavaScript(source, repoPath);
  } catch (error) {
    return {
      imports: [],
      diagnostic: {
        status: "error",
        message: String(error?.message ?? error),
        line: error?.loc?.line ?? null,
        column: error?.loc?.column ?? null,
      },
    };
  }

  const imports = [];
  function visit(node) {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "ImportDeclaration") {
      const specifier = literalString(node.source);
      if (specifier != null) imports.push(importRecord(node, specifier, "import"));
      return;
    }
    if (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
      const specifier = literalString(node.source);
      if (specifier != null) imports.push(importRecord(node, specifier, "re-export"));
      if (node.declaration) visit(node.declaration);
      return;
    }
    if (node.type === "ImportExpression") {
      const specifier = literalString(node.source);
      if (specifier != null) imports.push(importRecord(node, specifier, "dynamic-import"));
      return;
    }
    if (node.type === "CallExpression" && node.callee?.type === "Identifier" && node.callee.name === "require") {
      const specifier = node.arguments?.length === 1 ? literalString(node.arguments[0]) : null;
      if (specifier != null) imports.push(importRecord(node, specifier, "require"));
      return;
    }
    for (const child of childNodes(node)) visit(child);
  }

  visit(ast);
  imports.sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0) || a.specifier.localeCompare(b.specifier) || a.kind.localeCompare(b.kind));
  return { imports, diagnostic: { status: "ok" } };
}
