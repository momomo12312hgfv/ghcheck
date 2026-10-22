var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS(function(exports2) {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports2.ALIAS = ALIAS;
  exports2.DOC = DOC;
  exports2.MAP = MAP;
  exports2.NODE_TYPE = NODE_TYPE;
  exports2.PAIR = PAIR;
  exports2.SCALAR = SCALAR;
  exports2.SEQ = SEQ;
  exports2.hasAnchor = hasAnchor;
  exports2.isAlias = isAlias;
  exports2.isCollection = isCollection;
  exports2.isDocument = isDocument;
  exports2.isMap = isMap;
  exports2.isNode = isNode;
  exports2.isPair = isPair;
  exports2.isScalar = isScalar;
  exports2.isSeq = isSeq;
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS(function(exports2) {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function")
      return visitor(key, node, path);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path);
    return;
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports2.visit = visit;
  exports2.visitAsync = visitAsync;
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS(function(exports2) {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports2.Directives = Directives;
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS(function(exports2) {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports2.anchorIsValid = anchorIsValid;
  exports2.anchorNames = anchorNames;
  exports2.createNodeAnchors = createNodeAnchors;
  exports2.findNewAnchor = findNewAnchor;
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS(function(exports2) {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k of Array.from(val.keys())) {
          const v0 = val.get(k);
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            val.delete(k);
          else if (v1 !== v0)
            val.set(k, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            delete val[k];
          else if (v1 !== v0)
            val[k] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports2.applyReviver = applyReviver;
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS(function(exports2) {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res) => {
        data.res = res;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports2.toJS = toJS;
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS(function(exports2) {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values())
          onAnchor(res, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports2.NodeBase = NodeBase;
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS(function(exports2) {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      if (ctx?.maxAliasCount === 0)
        throw new ReferenceError("Alias resolution is disabled");
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      if (found && ctx) {
        const { anchors, doc, maxAliasCount } = ctx;
        let data = anchors.get(found);
        if (!data) {
          toJS.toJS(found, null, ctx);
          data = anchors.get(found);
        }
        if (data?.res === undefined) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, found, anchors);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const source = this.resolve(ctx.doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      return ctx.anchors.get(source).res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors && source && anchors.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors);
        if (c > count)
          count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors);
      const vc = getAliasCount(doc, node.value, anchors);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports2.Alias = Alias;
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS(function(exports2) {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports2.Scalar = Scalar;
  exports2.isScalarValue = isScalarValue;
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS(function(exports2) {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node = new Scalar.Scalar(value);
        if (ref)
          ref.node = node;
        return node;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports2.createNode = createNode;
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS(function(exports2) {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1;i >= 0; --i) {
      const k = path[i];
      if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
        const a = [];
        a[k] = v;
        v = a;
      } else {
        v = new Map([[k, v]]);
      }
    }
    return createNode.createNode(v, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path, value) {
      if (isEmptyPath(path))
        this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports2.Collection = Collection;
  exports2.collectionFromPath = collectionFromPath;
  exports2.isEmptyPath = isEmptyPath;
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS(function(exports2) {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports2.indentComment = indentComment;
  exports2.lineComment = lineComment;
  exports2.stringifyComment = stringifyComment;
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS(function(exports2) {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j])
              return text;
            folds.push(j);
            escapedFolds[j] = true;
            end = j + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i = 0;i < folds.length; ++i) {
      const fold = folds[i];
      const end = folds[i + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports2.FOLD_BLOCK = FOLD_BLOCK;
  exports2.FOLD_FLOW = FOLD_FLOW;
  exports2.FOLD_QUOTED = FOLD_QUOTED;
  exports2.foldFlowLines = foldFlowLines;
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
      qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs = doubleQuotedString;
      else
        qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t);
      if (res === null)
        throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports2.stringifyString = stringifyString;
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS(function(exports2) {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trailingComma: false,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0)
        return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports2.createStringifyContext = createStringifyContext;
  exports2.stringify = stringify;
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS(function(exports2) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? `
` : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === `
` && valueComment)
          ws = `

`;
      } else {
        ws += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws = "";
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports2.stringifyPair = stringifyPair;
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS(function(exports2) {
  var node_process = require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports2.debug = debug;
  exports2.warn = warn;
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS(function(exports2) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
      for (const it of source.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(source))
      for (const it of source)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  exports2.addMergeToJSMap = addMergeToJSMap;
  exports2.isMergeKey = isMergeKey;
  exports2.merge = merge;
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS(function(exports2) {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports2.addPairToJSMap = addPairToJSMap;
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS(function(exports2) {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k = createNode.createNode(key, undefined, ctx);
    const v = createNode.createNode(value, undefined, ctx);
    return new Pair(k, v);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports2.Pair = Pair;
  exports2.createPair = createPair;
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS(function(exports2) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str = stringify.stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      if (chompKeep && comment)
        chompKeep = false;
      lines.push(blockItemPrefix + str);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
      if (i < items.length - 1) {
        str += ",";
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
        }
        if (reqNewline) {
          str += ",";
        }
      }
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports2.stringifyCollection = stringifyCollection;
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS(function(exports2) {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports2.YAMLMap = YAMLMap;
  exports2.findPair = findPair;
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS(function(exports2) {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map, onError) {
      if (!identity.isMap(map))
        onError("Expected a mapping for this tag");
      return map;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports2.map = map;
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS(function(exports2) {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports2.YAMLSeq = YAMLSeq;
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS(function(exports2) {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq, onError) {
      if (!identity.isSeq(seq))
        onError("Expected a sequence for this tag");
      return seq;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports2.seq = seq;
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS(function(exports2) {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports2.string = string;
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports2.nullTag = nullTag;
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports2.boolTag = boolTag;
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS(function(exports2) {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d = minFractionDigits - (n.length - i - 1);
      while (d-- > 0)
        n += "0";
    }
    return n;
  }
  exports2.stringifyNumber = stringifyNumber;
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports2.float = float;
  exports2.floatExp = floatExp;
  exports2.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS(function(exports2) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports2.int = int;
  exports2.intHex = intHex;
  exports2.intOct = intOct;
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS(function(exports2) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports2.schema = schema;
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports2.schema = schema;
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS(function(exports2) {
  var node_buffer = require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o = 0;i < n; ++i, o += lineWidth) {
          lines[i] = str.substr(o, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports2.binary = binary;
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS(function(exports2) {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs = new YAMLSeq.YAMLSeq(schema);
    pairs.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports2.createPairs = createPairs;
  exports2.pairs = pairs;
  exports2.resolvePairs = resolvePairs;
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS(function(exports2) {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_, ctx) {
      if (!ctx)
        return super.toJSON(_);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap = new this;
      omap.items = pairs$1.items;
      return omap;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports2.YAMLOMap = YAMLOMap;
  exports2.omap = omap;
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports2.falseTag = falseTag;
  exports2.trueTag = trueTag;
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0")
          node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports2.float = float;
  exports2.floatExp = floatExp;
  exports2.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS(function(exports2) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n = BigInt(str);
      return sign === "-" ? BigInt(-1) * n : n;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports2.int = int;
  exports2.intBin = intBin;
  exports2.intHex = intHex;
  exports2.intOct = intOct;
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS(function(exports2) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_, ctx) {
      return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set.items.push(Pair.createPair(value, null, ctx));
        }
      return set;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports2.YAMLSet = YAMLSet;
  exports2.set = set;
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS(function(exports2) {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d = parseSexagesimal(tz, false);
        if (Math.abs(d) < 30)
          d *= 60;
        date -= 60000 * d;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports2.floatTime = floatTime;
  exports2.intTime = intTime;
  exports2.timestamp = timestamp;
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS(function(exports2) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports2.schema = schema;
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS(function(exports2) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags.includes(tagObj))
        tags.push(tagObj);
      return tags;
    }, []);
  }
  exports2.coreKnownTags = coreKnownTags;
  exports2.getTags = getTags;
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS(function(exports2) {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports2.Schema = Schema;
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS(function(exports2) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else {
          lines.push(`... ${cs}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports2.stringifyDocument = stringifyDocument;
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS(function(exports2) {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k = this.createNode(key, null, options);
      const v = this.createNode(value, null, options);
      return new Pair.Pair(k, v);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path) {
      if (Collection.isEmptyPath(path))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values())
          onAnchor(res, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports2.Document = Document;
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS(function(exports2) {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "…" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "…";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `…
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports2.YAMLError = YAMLError;
  exports2.YAMLParseError = YAMLParseError;
  exports2.YAMLWarning = YAMLWarning;
  exports2.prettifyError = prettifyError;
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS(function(exports2) {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports2.resolveProps = resolveProps;
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS(function(exports2) {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st of key.end)
            if (st.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start)
            if (st.type === "newline")
              return true;
          if (it.sep) {
            for (const st of it.sep)
              if (st.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports2.containsNewline = containsNewline;
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS(function(exports2) {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports2.flowIndentCheck = flowIndentCheck;
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS(function(exports2) {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports2.mapIncludes = mapIncludes;
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS(function(exports2) {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports2.resolveBlockMap = resolveBlockMap;
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS(function(exports2) {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports2.resolveBlockSeq = resolveBlockSeq;
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS(function(exports2) {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports2.resolveEnd = resolveEnd;
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS(function(exports2) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found)
                  break;
                if (st.type === "newline") {
                  onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce?.source === expectedEnd)
      cePos = ce.offset + ce.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce && ce.source.length !== 1)
        ee.unshift(ce);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports2.resolveFlowCollection = resolveFlowCollection;
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS(function(exports2) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports2.composeCollection = composeCollection;
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end = start + header.length;
      if (scalar.source)
        end += scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts = token.source;
          if (ts && typeof ts === "string")
            length += ts.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports2.resolveBlockScalar = resolveBlockScalar;
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS(function(exports2) {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return unfoldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function unfoldLines(source) {
    const line = /(.*?)\r?\n/sy;
    let match = line.exec(source);
    if (!match)
      return source;
    let trimEnd, trimBoth;
    try {
      trimEnd = new RegExp("(?<![ \t])[ \t]+$");
      trimBoth = new RegExp("^[ \t]+|(?<![ \t])[ \t]+$", "g");
    } catch {
      trimEnd = /[ \t]+$/;
      trimBoth = /^[ \t]+|[ \t]+$/g;
    }
    let res = match[1].replace(trimEnd, "");
    let sep = " ";
    let pos = line.lastIndex;
    while (match = line.exec(source)) {
      const lm = match[1].replace(trimBoth, "");
      if (lm === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + lm;
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = next === "x" ? 2 : next === "u" ? 4 : 8;
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "",
    _: " ",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
      return String.fromCodePoint(code);
    } catch {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
  }
  exports2.resolveFlowScalar = resolveFlowScalar;
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS(function(exports2) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
      return kt;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag) => (tag.default === true || atKey && tag.default === "key") && tag.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag) => tag.default && tag.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts = directives.tagString(tag.tag);
        const cs = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts} or ${cs}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports2.composeScalar = composeScalar;
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS(function(exports2) {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports2.emptyScalarPosition = emptyScalarPosition;
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS(function(exports2) {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          onError(token, "RESOURCE_EXHAUSTION", message);
        }
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        isSrcToken = false;
      }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
      alias.comment = re.comment;
    return alias;
  }
  exports2.composeEmptyNode = composeEmptyNode;
  exports2.composeNode = composeNode;
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS(function(exports2) {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
      doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports2.composeDoc = composeDoc;
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS(function(exports2) {
  var node_process = require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        for (let i = 0;i < this.errors.length; ++i)
          doc.errors.push(this.errors[i]);
        for (let i = 0;i < this.warnings.length; ++i)
          doc.warnings.push(this.warnings[i]);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports2.Composer = Composer;
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS(function(exports2) {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he = source.indexOf(`
`);
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he = source.indexOf(`
`);
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports2.createScalarToken = createScalarToken;
  exports2.resolveAsScalar = resolveAsScalar;
  exports2.setScalarValue = setScalarValue;
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS(function(exports2) {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st of token.end)
          res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start)
      res += st.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st of sep)
        res += st.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports2.stringify = stringify;
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS(function(exports2) {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports2.visit = visit;
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS(function(exports2) {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports2.createScalarToken = cstScalar.createScalarToken;
  exports2.resolveAsScalar = cstScalar.resolveAsScalar;
  exports2.setScalarValue = cstScalar.setScalarValue;
  exports2.stringify = cstStringify.stringify;
  exports2.visit = cstVisit.visit;
  exports2.BOM = BOM;
  exports2.DOCUMENT = DOCUMENT;
  exports2.FLOW_END = FLOW_END;
  exports2.SCALAR = SCALAR;
  exports2.isCollection = isCollection;
  exports2.isScalar = isScalar;
  exports2.prettyToken = prettyToken;
  exports2.tokenType = tokenType;
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS(function(exports2) {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs - 1;
            break;
          } else {
            cs = line.indexOf("#", cs + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return "block-start";
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = qb.indexOf(`
`, cs);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i = this.pos;ch = this.buffer[i]; ++i) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i = nl - 1;
          let ch = this.buffer[i];
          if (ch === "\r")
            ch = this.buffer[--i];
          const lastChar = i;
          while (ch === " ")
            ch = this.buffer[--i];
          if (ch === `
` && i >= this.pos && i + 1 + indent > lastChar)
            nl = i;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs = this.continueScalar(i + 1);
            if (cs === -1)
              break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      let n = 0;
      loop:
        while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            case "?":
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
      return n;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports2.Lexer = Lexer;
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS(function(exports2) {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports2.LineCounter = LineCounter;
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS(function(exports2) {
  var node_process = require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function arrayPushArray(target, source) {
    if (source.length < 1e5)
      Array.prototype.push.apply(target, source);
    else
      for (let i = 0;i < source.length; ++i)
        target.push(source[i]);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              arrayPushArray(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            arrayPushArray(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs);
            } else {
              Object.assign(it, { key: fs, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs, sep: [] });
            else if (it.sep)
              this.stack.push(fs);
            else
              Object.assign(it, { key: fs, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports2.Parser = Parser;
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS(function(exports2) {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports2.parse = parse;
  exports2.parseAllDocuments = parseAllDocuments;
  exports2.parseDocument = parseDocument;
  exports2.stringify = stringify;
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS(function(exports2) {
  var composer = require_composer();
  var Document = require_Document();
  var Schema = require_Schema();
  var errors = require_errors();
  var Alias = require_Alias();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var cst = require_cst();
  var lexer = require_lexer();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  var publicApi = require_public_api();
  var visit = require_visit();
  exports2.Composer = composer.Composer;
  exports2.Document = Document.Document;
  exports2.Schema = Schema.Schema;
  exports2.YAMLError = errors.YAMLError;
  exports2.YAMLParseError = errors.YAMLParseError;
  exports2.YAMLWarning = errors.YAMLWarning;
  exports2.Alias = Alias.Alias;
  exports2.isAlias = identity.isAlias;
  exports2.isCollection = identity.isCollection;
  exports2.isDocument = identity.isDocument;
  exports2.isMap = identity.isMap;
  exports2.isNode = identity.isNode;
  exports2.isPair = identity.isPair;
  exports2.isScalar = identity.isScalar;
  exports2.isSeq = identity.isSeq;
  exports2.Pair = Pair.Pair;
  exports2.Scalar = Scalar.Scalar;
  exports2.YAMLMap = YAMLMap.YAMLMap;
  exports2.YAMLSeq = YAMLSeq.YAMLSeq;
  exports2.CST = cst;
  exports2.Lexer = lexer.Lexer;
  exports2.LineCounter = lineCounter.LineCounter;
  exports2.Parser = parser.Parser;
  exports2.parse = publicApi.parse;
  exports2.parseAllDocuments = publicApi.parseAllDocuments;
  exports2.parseDocument = publicApi.parseDocument;
  exports2.stringify = publicApi.stringify;
  exports2.visit = visit.visit;
  exports2.visitAsync = visit.visitAsync;
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS(function(exports2, module2) {
  var p = process || {};
  var argv = p.argv || [];
  var env = p.env || {};
  var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module2.exports = createColors();
  module2.exports.createColors = createColors;
});

// src/action.ts
var import_node_fs = require("node:fs");
var import_promises3 = require("node:fs/promises");

// src/core/agent-files.ts
var MCP_CONFIG_BASENAMES = new Set([
  ".mcp.json",
  "mcp.json",
  "mcp_config.json",
  "claude_desktop_config.json"
]);
var INSTRUCTION_BASENAMES = new Set([
  "agents.md",
  "claude.md",
  "gemini.md",
  "conventions.md",
  ".cursorrules",
  ".windsurfrules",
  ".clinerules",
  "copilot-instructions.md",
  "opencode.md"
]);
var INSTRUCTION_PATH_MARKERS = [
  "/.claude/skills/",
  "/.claude/commands/",
  "/.claude/agents/"
];
function classifyAgentFile(file) {
  const normalized = file.replace(/\\/g, "/");
  const base = normalized.slice(normalized.lastIndexOf("/") + 1).toLowerCase();
  const markerPath = `/${normalized}`;
  if (MCP_CONFIG_BASENAMES.has(base))
    return "mcp-config";
  if (INSTRUCTION_BASENAMES.has(base))
    return "instruction";
  if (base.endsWith(".skill.md"))
    return "instruction";
  if (markerPath.includes("/.github/copilot-instructions.md"))
    return "instruction";
  if (INSTRUCTION_PATH_MARKERS.some((marker) => markerPath.includes(marker)))
    return "instruction";
  return null;
}

// src/core/lines.ts
function buildLineOffsets(content) {
  const offsets = [0];
  for (let index = 0;index < content.length; index += 1) {
    if (content.charCodeAt(index) === 10)
      offsets.push(index + 1);
  }
  return offsets;
}
function lineAt(offsets, index) {
  let low = 0;
  let high = offsets.length - 1;
  let result = 0;
  while (low <= high) {
    const mid = low + high >> 1;
    const offset = offsets[mid] ?? 0;
    if (offset <= index) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return result + 1;
}
function lineText(content, line) {
  const lines = content.split(/\r?\n/);
  return lines[line - 1] ?? "";
}

// src/core/jsonc.ts
function parseJsonc(source) {
  try {
    return { value: JSON.parse(stripTrailingCommas(stripComments(source))) };
  } catch (error) {
    return {
      value: undefined,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function stripComments(source) {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;
  while (index < source.length) {
    const char = source[index] ?? "";
    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      index += 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== `
`)
        index += 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}
function stripTrailingCommas(source) {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;
  while (index < source.length) {
    const char = source[index] ?? "";
    if (inString) {
      output += char;
      if (escaped)
        escaped = false;
      else if (char === "\\")
        escaped = true;
      else if (char === '"')
        inString = false;
      index += 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      index += 1;
      continue;
    }
    if (char === ",") {
      let lookahead = index + 1;
      while (lookahead < source.length && /\s/.test(source[lookahead] ?? ""))
        lookahead += 1;
      const next = source[lookahead];
      if (next === "}" || next === "]") {
        index += 1;
        continue;
      }
    }
    output += char;
    index += 1;
  }
  return output;
}

// src/core/redact.ts
var TOKEN_PREFIXES = ["github_pat_", "ghp_", "gho_", "ghu_", "ghs_", "ghr_"];
function redactMatch(match) {
  const trimmed = match.trim();
  const prefix = TOKEN_PREFIXES.find((candidate) => trimmed.startsWith(candidate));
  if (prefix)
    return `${prefix}****...redacted`;
  if (trimmed.startsWith("-----BEGIN")) {
    const kind = trimmed.split(`
`)[0]?.replace("-----BEGIN ", "").replace("-----", "").trim();
    return `-----BEGIN ${kind ?? "PRIVATE KEY"}-----****...redacted`;
  }
  return `****...redacted (${trimmed.length} chars)`;
}
var GITHUB_TOKEN_PATTERN = /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/g;
var AWS_SECRET_PATTERN = /\b(?:aws_secret_access_key|aws_secret_key)["'\s]*[:=]["'\s]*([A-Za-z0-9/+=]{40})\b/gi;
function redactSecrets(text) {
  let output = text.replace(GITHUB_TOKEN_PATTERN, (match) => redactMatch(match));
  output = output.replace(AWS_SECRET_PATTERN, (match) => {
    const key = match.match(/([A-Za-z0-9/+=]{40})/)?.[1];
    return key ? match.replace(key, redactMatch(key)) : match;
  });
  return output;
}

// src/analyzers/secret/rules.ts
var PLACEHOLDER_MARKERS = [
  "example",
  "your-",
  "your_",
  "yours",
  "placeholder",
  "changeme",
  "change_me",
  "change-me",
  "dummy",
  "sample",
  "fake",
  "xxxx",
  "todo",
  "redacted",
  "notreal",
  "insert",
  "replace",
  "somepassword",
  "some_secret",
  "mypassword",
  "hunter2",
  "abcdefgh",
  "12345678"
];
var ENVIRONMENT_MARKERS = [
  "process.env",
  "os.environ",
  "getenv(",
  "doppler",
  "vault:",
  "secrets.",
  "${{",
  "{{",
  "<%",
  "os::"
];
var SEQUENCES = [
  "0123456789",
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop",
  "asdfghjkl",
  "zyxwvutsrq"
];
function hasSequentialRun(value, minRun = 6) {
  const lowered = value.toLowerCase();
  for (const sequence of SEQUENCES) {
    for (let index = 0;index + minRun <= sequence.length; index += 1) {
      if (lowered.includes(sequence.slice(index, index + minRun)))
        return true;
    }
  }
  return false;
}
function looksLikePlaceholder(value) {
  const lowered = value.toLowerCase();
  if (value.length < 8)
    return true;
  if (PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker)))
    return true;
  if (/(^|[^a-z])test([^a-z]|$)/i.test(value))
    return true;
  if (/^([*.\-_xX#])\1+$/.test(value))
    return true;
  if (/^<.*>$/.test(value))
    return true;
  if (/^\$\{.*\}$/.test(value))
    return true;
  if (hasSequentialRun(value))
    return true;
  return false;
}
function looksLikeEnvironmentReference(line) {
  return ENVIRONMENT_MARKERS.some((marker) => line.includes(marker));
}
function shannonEntropy(value) {
  if (value.length === 0)
    return 0;
  const counts = new Map;
  for (const char of value) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}
function isNoise(credential, line) {
  return looksLikePlaceholder(credential) || looksLikeEnvironmentReference(line);
}
var SECRET_RULES = [
  {
    id: "secret.github-fine-grained-token",
    title: "Hardcoded fine-grained GitHub token",
    severity: "critical",
    description: "A fine-grained personal access token is committed in this file. Anyone who can read the repository can act as its owner until it is revoked.",
    remediation: "Revoke the token in GitHub Settings > Developer settings, then read it from the environment or a secret store instead.",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.github-token",
    title: "Hardcoded GitHub token",
    severity: "critical",
    description: "A classic PAT, OAuth or GitHub App token is committed in this file. Its blast radius depends on the scopes it carries.",
    remediation: "Revoke the token, then read it from the environment or a secret store instead.",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.aws-access-key-id",
    title: "Hardcoded AWS access key id",
    severity: "critical",
    description: "An AWS access key id is committed in this file. Paired with a secret key it grants full access to the account.",
    remediation: "Deactivate the key in the AWS console, then read it from the environment or a secret store instead.",
    pattern: /\b(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.aws-secret-access-key",
    title: "Hardcoded AWS secret access key",
    severity: "critical",
    description: "An AWS secret access key is committed in this file. It is enough to sign requests as the owning IAM user.",
    remediation: "Rotate the key in the AWS console, then read it from the environment or a secret store instead.",
    pattern: /\baws_secret_access_key\b\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})/gi,
    isFalsePositive: isNoise
  },
  {
    id: "secret.private-key",
    title: "Private key committed",
    severity: "critical",
    description: "A private key block is committed in this file. It may grant access to a server, a code-signing identity or a certificate.",
    remediation: "Remove the key from the repository, rotate it, and use a secret store or an encrypted vault instead.",
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g
  },
  {
    id: "secret.slack-token",
    title: "Hardcoded Slack token",
    severity: "high",
    description: "A Slack API token is committed in this file.",
    remediation: "Revoke the token in the Slack app admin page, then load it from the environment.",
    pattern: /\bxox[abporsu]-[A-Za-z0-9-]{10,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.slack-webhook",
    title: "Hardcoded Slack webhook URL",
    severity: "high",
    description: "A Slack incoming webhook URL is committed in this file. Anyone holding it can post into the channel.",
    remediation: "Recreate the webhook in the Slack app admin page, then load it from the environment.",
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9+/]{20,}/g
  },
  {
    id: "secret.stripe-key",
    title: "Hardcoded Stripe secret key",
    severity: "high",
    description: "A Stripe live or test secret key is committed in this file. Live keys can move money and read customer data.",
    remediation: "Roll the key in the Stripe dashboard, then load it from the environment.",
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.anthropic-key",
    title: "Hardcoded Anthropic API key",
    severity: "high",
    description: "An Anthropic API key is committed in this file.",
    remediation: "Revoke the key in the Anthropic console, then load it from the environment.",
    pattern: /\bsk-ant-[A-Za-z0-9_-]{24,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.openai-key",
    title: "Hardcoded OpenAI API key",
    severity: "high",
    description: "An OpenAI API key is committed in this file.",
    remediation: "Revoke the key in the OpenAI dashboard, then load it from the environment.",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.google-api-key",
    title: "Hardcoded Google API key",
    severity: "high",
    description: "A Google API key is committed in this file.",
    remediation: "Delete the key in the Google Cloud console, then load it from the environment.",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g
  },
  {
    id: "secret.npm-token",
    title: "Hardcoded npm access token",
    severity: "high",
    description: "An npm access token is committed in this file. It can publish packages under your account.",
    remediation: "Revoke the token in npm settings, then load it from the environment.",
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.pypi-token",
    title: "Hardcoded PyPI upload token",
    severity: "high",
    description: "A PyPI API token is committed in this file. It can publish packages to your account.",
    remediation: "Revoke the token in PyPI settings, then load it from the environment.",
    pattern: /\bpypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]{50,}\b/g,
    isFalsePositive: isNoise
  },
  {
    id: "secret.database-url",
    title: "Hardcoded database connection string",
    severity: "high",
    description: "A database URL with an inline password is committed in this file. It usually points straight at production.",
    remediation: "Rotate the database password, then read the URL from the environment.",
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp|mssql):\/\/[^\s:@/]+:[^\s:@/]+@/g
  },
  {
    id: "secret.basic-auth-url",
    title: "Credentials embedded in a URL",
    severity: "medium",
    description: "A URL carries an inline user:password pair. It leaks through logs, referrers and shell history.",
    remediation: "Move the credentials into a secret store and reference them from the environment.",
    pattern: /https?:\/\/[^\s:/@]+:[^\s:/@]+@[^\s"']+/g
  },
  {
    id: "secret.generic-credential",
    title: "Hardcoded credential assignment",
    severity: "medium",
    description: "A value assigned to a password, secret or token-looking name is committed in this file.",
    remediation: "Move the value into a secret store and read it from the environment.",
    pattern: /\b(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key)\b\s*[:=]\s*["']([^"'\s]{10,})["']/gi,
    isFalsePositive: isNoise
  },
  {
    id: "secret.high-entropy-value",
    title: "High-entropy value assigned in source",
    severity: "low",
    description: "A long, high-entropy string is assigned to a variable. It is not proof of a secret, but it is the shape of one.",
    remediation: "Confirm the value is not a credential; if it is, move it into a secret store.",
    pattern: /\b[A-Za-z_][A-Za-z0-9_]{3,}\s*[:=]\s*["']([A-Za-z0-9+/=_\-]{32,})["']/g,
    isFalsePositive: (credential, line) => {
      if (isNoise(credential, line))
        return true;
      return shannonEntropy(credential) < 4.2;
    }
  }
];

// src/analyzers/agent/rules.ts
var AGENT_RULES = [
  {
    id: "agent.mcp-invalid-json",
    title: "Agent configuration is not valid JSON",
    severity: "medium",
    description: "The MCP configuration could not be parsed, so none of the agent checks could run against it. Editors accept comments and trailing commas, which is why this file may still work in the editor.",
    remediation: "Fix the JSON syntax, or keep the file valid for every tool that reads it."
  },
  {
    id: "agent.mcp-embedded-credential",
    title: "MCP endpoint carries a credential",
    severity: "critical",
    description: "The MCP endpoint embeds a credential in the URL or in a header. The value is part of the configuration file, so it ends up in git history, in the agent transcript and in every log that prints the configuration.",
    remediation: "Move the credential into an environment variable and reference it (`${TOKEN}`), and rotate the value that was committed."
  },
  {
    id: "agent.mcp-secret-in-env",
    title: "MCP server receives a secret as a literal value",
    severity: "high",
    description: "The server configuration passes a secret to the MCP server as a literal string. Every process that can read the configuration file can read the secret with it.",
    remediation: "Reference the environment variable instead (`${TOKEN}`) and keep the value in the shell or the secret store."
  },
  {
    id: "agent.mcp-unpinned-runner",
    title: "MCP server runs an unpinned package",
    severity: "high",
    description: "The server is started with a package runner that resolves the package at install time. Whoever controls that package name, or the account that owns it, decides what runs on the machine next.",
    remediation: "Pin the exact version (`pkg@1.2.3`) or the commit of the package you trust."
  },
  {
    id: "agent.mcp-insecure-endpoint",
    title: "MCP endpoint uses plain HTTP",
    severity: "high",
    description: "The remote MCP endpoint is reached over plain HTTP. Everything the agent sends and everything the server answers travels in clear text, including the credentials the agent hands over.",
    remediation: "Use `https://` and terminate TLS at the endpoint."
  },
  {
    id: "agent.mcp-broad-filesystem",
    title: "MCP filesystem server is scoped to the whole home directory",
    severity: "high",
    confidence: "likely",
    description: "The filesystem server is allowed to read the entire home directory, which normally holds SSH keys, tokens, shell history and every other project on the machine.",
    remediation: "Scope the server to the one directory the agent actually needs."
  },
  {
    id: "agent.mcp-permission-bypass",
    title: "MCP server is started with a permission bypass",
    severity: "high",
    description: "The server is started with a flag that turns the permission prompts off. The agent then runs whatever the server asks for, with the permissions of the user who started it.",
    remediation: "Drop the flag and let the agent ask before it acts."
  },
  {
    id: "agent.instruction-unsafe-command",
    title: "Agent instructions ask for an unsafe command",
    severity: "high",
    description: "The instruction file tells the agent to run a command that pipes a download into a shell, makes a file world writable, or deletes a home directory. Instructions like this run every time the agent reads the file.",
    remediation: "Remove the command, or state the steps the agent should follow instead of a shell one-liner."
  },
  {
    id: "agent.mcp-shell-command",
    title: "MCP server is started through a shell",
    severity: "medium",
    confidence: "likely",
    description: "The server is launched through a shell interpreter, so the real command is hidden inside a string argument and cannot be reviewed by reading the configuration.",
    remediation: "Run the server binary directly instead of wrapping it in `sh -c`."
  },
  {
    id: "agent.instruction-prompt-injection",
    title: "Agent instructions contain an instruction override",
    severity: "medium",
    confidence: "likely",
    description: "The instruction file tells the agent to ignore previous instructions or to turn off its safety rules. A file like that can turn any later request into an unguarded one.",
    remediation: "Remove the override wording and keep the file to instructions about the project itself."
  },
  {
    id: "agent.instruction-exfiltration",
    title: "Agent instructions send data to an external endpoint",
    severity: "medium",
    confidence: "likely",
    description: "The instruction file asks the agent to upload or post something to an external address. Combined with the access an agent usually has, that turns a routine task into a leak.",
    remediation: "Say what should happen locally, and keep the outbound call explicit and reviewable."
  },
  {
    id: "agent.instruction-credential-request",
    title: "Agent instructions ask for credentials",
    severity: "medium",
    confidence: "likely",
    description: "The instruction file asks the agent to read, print or show a credential. An agent that answers that request hands the value to the model, and from there to whoever is on the other end of the conversation.",
    remediation: "Ask for the path or the name of the secret, never for the value."
  }
];

// src/analyzers/agent/index.ts
class Locator {
  content;
  offsets;
  claimed = [];
  constructor(content) {
    this.content = content;
    this.offsets = buildLineOffsets(content);
  }
  lineOf(needle) {
    if (!needle)
      return null;
    const quoted = this.find(`"${needle}"`);
    if (quoted !== null)
      return quoted;
    return this.find(needle);
  }
  find(needle) {
    let from = 0;
    while (from <= this.content.length) {
      const index = this.content.indexOf(needle, from);
      if (index === -1)
        return null;
      const end = index + needle.length;
      if (!this.claimed.some((claim) => index < claim.end && end > claim.start)) {
        this.claimed.push({ start: index, end });
        return lineAt(this.offsets, index);
      }
      from = index + 1;
    }
    return null;
  }
}
function asString(value) {
  return typeof value === "string" ? value : undefined;
}
function asEntries(value) {
  if (!value || typeof value !== "object")
    return [];
  return Object.entries(value).map(([key, entry]) => [key, asString(entry) ?? ""]).filter(([, entry]) => entry.length > 0);
}
function asArgs(value) {
  if (!Array.isArray(value))
    return [];
  return value.map((entry) => typeof entry === "string" ? entry : "");
}
function normalizeServer(name, raw) {
  return {
    name,
    command: asString(raw.command),
    args: asArgs(raw.args),
    env: asEntries(raw.env),
    headers: asEntries(raw.headers),
    url: asString(raw.url)
  };
}
function extractServers(value) {
  if (!value || typeof value !== "object")
    return [];
  const root = value;
  const servers = [];
  for (const section of ["mcpServers", "servers", "mcp"]) {
    const entries = root[section];
    if (!entries || typeof entries !== "object")
      continue;
    for (const [name, entry] of Object.entries(entries)) {
      if (!entry || typeof entry !== "object")
        continue;
      servers.push(normalizeServer(name, entry));
    }
  }
  return servers;
}
var RUNNER_COMMANDS = new Set(["npx", "bunx", "uvx", "pnpx"]);
var SHELL_COMMANDS = new Set([
  "sh",
  "bash",
  "zsh",
  "dash",
  "cmd",
  "cmd.exe",
  "powershell",
  "pwsh"
]);
var BYPASS_FLAGS = [
  "--dangerously-skip-permissions",
  "--yolo",
  "--allow-all",
  "--no-sandbox",
  "--unsafe-permissions",
  "--full-auto"
];
var SECRET_NAME_PATTERN = /(TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|PRIVATE_?KEY|CREDENTIAL|ACCESS_?KEY|AUTH)/i;
var URL_USERINFO_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/([^/\s:@]+):([^/\s@]+)@/i;
var URL_SECRET_QUERY_PATTERN = /[?&](token|access_token|api_key|apikey|key|secret|password|pwd)=([^&\s]+)/i;
var BROAD_PATHS = new Set(["/", "~", "$HOME", "${HOME}", "%USERPROFILE%", "$USERPROFILE"]);
function alreadyReportedAsSecret(value) {
  for (const rule of SECRET_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.replace("g", ""));
    const match = pattern.exec(value);
    if (match && !rule.isFalsePositive?.(match[1] ?? match[0], value))
      return true;
  }
  return false;
}
function isEnvironmentReference(value) {
  return value.startsWith("${") || value.startsWith("$") || value.startsWith("env:") || value.startsWith("%") || value === "";
}
function findRule(id) {
  const rule = AGENT_RULES.find((candidate) => candidate.id === id);
  if (!rule)
    throw new Error(`Unknown agent rule: ${id}`);
  return rule;
}
function report(context, ruleId, options) {
  const rule = findRule(ruleId);
  const finding = {
    id: rule.id,
    analyzer: "agent",
    severity: rule.severity,
    title: rule.title,
    description: options.description ?? rule.description,
    location: { file: context.file, line: options.line ?? 1 },
    remediation: rule.remediation
  };
  if (options.evidence)
    finding.evidence = options.evidence;
  if (rule.confidence)
    finding.confidence = rule.confidence;
  context.push(finding);
}
function runnerPackage(command, args) {
  if (!command)
    return null;
  const base = command.toLowerCase();
  if (RUNNER_COMMANDS.has(base)) {
    const spec = args.find((arg) => !arg.startsWith("-"));
    if (!spec)
      return null;
    const ecosystem = base === "uvx" ? "uv" : "npm";
    return { spec, pinned: isPinnedSpec(spec, ecosystem) };
  }
  if (base === "pnpm" && args[0] === "dlx") {
    const spec = args.slice(1).find((arg) => !arg.startsWith("-"));
    if (!spec)
      return null;
    return { spec, pinned: isPinnedSpec(spec, "npm") };
  }
  if (base === "pipx" && args[0] === "run") {
    const spec = args.slice(1).find((arg) => !arg.startsWith("-"));
    if (!spec)
      return null;
    return { spec, pinned: isPinnedSpec(spec, "pip") };
  }
  if (base === "docker" && args[0] === "run") {
    const spec = args.slice(1).find((arg) => !arg.startsWith("-"));
    if (!spec)
      return null;
    return { spec, pinned: isPinnedImage(spec) };
  }
  return null;
}
function isPinnedSpec(spec, ecosystem) {
  if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("file:"))
    return true;
  if (spec.includes("git+") || spec.startsWith("http"))
    return true;
  if (ecosystem === "pip") {
    if (spec.includes("=="))
      return true;
    return spec.includes("@");
  }
  if (ecosystem === "uv") {
    if (spec.includes("=="))
      return true;
    return isPinnedSpec(spec, "npm");
  }
  const at = spec.lastIndexOf("@");
  if (at <= 0)
    return false;
  const version = spec.slice(at + 1);
  if (!version || version === "latest" || version === "next" || version === "master")
    return false;
  return /^\d/.test(version);
}
function isPinnedImage(spec) {
  if (spec.includes("@sha256:"))
    return true;
  const withoutName = spec.split("/").pop() ?? spec;
  const colon = withoutName.lastIndexOf(":");
  if (colon === -1)
    return false;
  const tag = withoutName.slice(colon + 1);
  return Boolean(tag) && tag !== "latest";
}
function redactUrl(url) {
  return url.replace(URL_USERINFO_PATTERN, (_match, user) => `${user}:****...redacted@`);
}
function analyzeMcpConfig(context, sink) {
  const parsed = parseJsonc(context.content);
  if (parsed.error) {
    report(sink, "agent.mcp-invalid-json", { line: null });
    return;
  }
  for (const server of extractServers(parsed.value)) {
    analyzeServer(server, context, sink);
  }
}
function analyzeServer(server, context, sink) {
  const label = `mcp server "${server.name}"`;
  if (server.url) {
    const url = server.url;
    if (URL_USERINFO_PATTERN.test(url)) {
      const match = url.match(URL_USERINFO_PATTERN);
      const user = match?.[1] ?? "";
      report(sink, "agent.mcp-embedded-credential", {
        line: sink.locator("agent.mcp-embedded-credential").lineOf(url),
        evidence: `${label} ${redactUrl(url)}`,
        description: `${label} embeds a password in its endpoint URL. The value sits in the configuration file, in git history and in every log that prints it.`
      });
    } else if (URL_SECRET_QUERY_PATTERN.test(url)) {
      report(sink, "agent.mcp-embedded-credential", {
        line: sink.locator("agent.mcp-embedded-credential").lineOf(url),
        evidence: `${label} ${redactUrl(url)}`,
        description: `${label} passes a credential in the endpoint query string, where it lands in access logs and proxies.`
      });
    }
    if (/^http:\/\//i.test(url)) {
      report(sink, "agent.mcp-insecure-endpoint", {
        line: sink.locator("agent.mcp-insecure-endpoint").lineOf(url),
        evidence: `${label} ${url}`
      });
    }
  }
  for (const [header, value] of server.headers) {
    if (!looksLikeCredentialValue(value))
      continue;
    report(sink, "agent.mcp-embedded-credential", {
      line: sink.locator("agent.mcp-embedded-credential").lineOf(value),
      evidence: `${label} header ${header}: ${redactMatch(value)}`,
      description: `${label} sends a credential in the "${header}" header. The value is stored in plain text in the configuration file.`
    });
  }
  for (const [name, value] of server.env) {
    if (!SECRET_NAME_PATTERN.test(name))
      continue;
    if (isEnvironmentReference(value))
      continue;
    if (looksLikePlaceholder(value))
      continue;
    if (alreadyReportedAsSecret(value))
      continue;
    report(sink, "agent.mcp-secret-in-env", {
      line: sink.locator("agent.mcp-secret-in-env").lineOf(value),
      evidence: `${label} env ${name}: ${redactMatch(value)}`
    });
  }
  const runner = runnerPackage(server.command, server.args);
  if (runner && !runner.pinned) {
    report(sink, "agent.mcp-unpinned-runner", {
      line: sink.locator("agent.mcp-unpinned-runner").lineOf(runner.spec),
      evidence: `${label} ${runner.spec}`,
      description: `${label} resolves "${runner.spec}" at install time, so whoever controls that package decides what runs on the machine next.`
    });
  }
  for (const flag of BYPASS_FLAGS) {
    if (!server.args.includes(flag))
      continue;
    report(sink, "agent.mcp-permission-bypass", {
      line: sink.locator("agent.mcp-permission-bypass").lineOf(flag),
      evidence: `${label} ${flag}`
    });
  }
  const command = server.command?.toLowerCase();
  if (command && SHELL_COMMANDS.has(command)) {
    report(sink, "agent.mcp-shell-command", {
      line: sink.locator("agent.mcp-shell-command").lineOf(server.command ?? command),
      evidence: `${label} ${server.command}`
    });
  }
  const filesystemServer = runner && /filesystem|(^|[-_/])fs([-_@]|$)/i.test(runner.spec);
  if (filesystemServer) {
    for (const arg of server.args) {
      if (!BROAD_PATHS.has(arg))
        continue;
      report(sink, "agent.mcp-broad-filesystem", {
        line: sink.locator("agent.mcp-broad-filesystem").lineOf(arg),
        evidence: `${label} ${arg}`
      });
    }
  }
}
function looksLikeCredentialValue(value) {
  if (value.length < 12)
    return false;
  if (/^(bearer|basic)\s+\S+/i.test(value))
    return true;
  return /(?:^|[^A-Za-z0-9])(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16})/.test(value);
}
var UNSAFE_COMMAND_PATTERNS = [
  {
    pattern: /(?:curl|wget)\s+[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z|k)?sh\b/i,
    description: "downloads a script from the network and pipes it straight into a shell"
  },
  {
    pattern: /\bchmod\s+(?:-R\s+)?777\b/i,
    description: "makes a file world writable"
  },
  {
    pattern: /\brm\s+-[rRf]{1,2}\s+(?:\/|~|\$HOME)\b/i,
    description: "deletes the home directory or the filesystem root"
  },
  {
    pattern: /\b(?:iex|Invoke-Expression)\s*\(/i,
    description: "runs a string as code"
  }
];
var PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above|earlier|preceding)\s+(?:instructions?|rules?|prompts?|messages?|directions?)/i,
  /disregard\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|rules?|prompts?)/i,
  /forget\s+(?:everything|all)\s+(?:you\s+)?(?:were\s+)?(?:told|above|before)/i,
  /忽略(?:掉)?(?:所有)?(?:以上|之前|先前|上面|上述)(?:的)?(?:所有)?(?:指令|规则|提示|要求)/,
  /(?:bypass|disable|turn\s+off)\s+(?:your\s+|the\s+)?(?:safety|guardrails?|security\s+(?:rules?|checks?))/i
];
var EXFILTRATION_VERBS = /(?:upload|post|send|exfiltrat\w*|publish|push)\s+(?:the\s+|your\s+|this\s+|it\s+|these\s+|those\s+)?(?:code|source|repo(?:sitory)?|data|file|files|token|secret|password|key|diff|patch)/i;
var EXFILTRATION_VERBS_ZH = /(?:上传|发送|推送|上报|回传|提交)(?:代码|源码|仓库|数据|文件|令牌|密钥|密码|补丁)/;
var CREDENTIAL_REQUEST_PATTERNS = [
  /(?:print|show|output|reveal|display|dump|echo|cat|type)\s+[^\n]{0,40}(?:\.env\b|id_rsa|id_ed25519|credential|api[ _-]?key|access[ _-]?token|password|secret)/i,
  /\benv\s*\|\s*grep\b/i,
  /(?:读取|输出|打印|显示|回显|导出)[^\n]{0,20}(?:\.env\b|密钥|凭据|令牌|密码|私钥)/
];
function analyzeInstructionFile(context, sink) {
  const lines = context.content.split(/\r?\n/);
  for (let index = 0;index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const lineNumber = index + 1;
    for (const entry of UNSAFE_COMMAND_PATTERNS) {
      if (!entry.pattern.test(line))
        continue;
      report(sink, "agent.instruction-unsafe-command", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120),
        description: `The instruction file asks the agent to run a command that ${entry.description}.`
      });
    }
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (!pattern.test(line))
        continue;
      report(sink, "agent.instruction-prompt-injection", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120)
      });
    }
    const hasUrl = /https?:\/\//i.test(line);
    if (hasUrl && (EXFILTRATION_VERBS.test(line) || EXFILTRATION_VERBS_ZH.test(line))) {
      report(sink, "agent.instruction-exfiltration", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120)
      });
    }
    for (const pattern of CREDENTIAL_REQUEST_PATTERNS) {
      if (!pattern.test(line))
        continue;
      report(sink, "agent.instruction-credential-request", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120)
      });
    }
  }
}
function analyzeAgentContent(context) {
  const kind = classifyAgentFile(context.file);
  if (!kind)
    return [];
  const findings = [];
  const locators = new Map;
  const sink = {
    file: context.file,
    content: context.content,
    locator: (ruleId) => {
      let locator = locators.get(ruleId);
      if (!locator) {
        locator = new Locator(context.content);
        locators.set(ruleId, locator);
      }
      return locator;
    },
    push: (finding) => findings.push(finding)
  };
  if (kind === "mcp-config") {
    analyzeMcpConfig(context, sink);
  } else {
    analyzeInstructionFile(context, sink);
  }
  return findings;
}
var agentAnalyzer = {
  id: "agent",
  name: "Agent",
  description: "What the repository declares about its AI agents: MCP servers, the packages they pull and the instruction files that steer them.",
  rules: AGENT_RULES,
  acceptsExternalFiles: true,
  analyze: analyzeAgentContent
};

// src/analyzers/secret/index.ts
function toRuleDefinition(rule) {
  return {
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    description: rule.description,
    remediation: rule.remediation
  };
}
function overlaps(claims, start, end) {
  return claims.some((claim) => start < claim.end && end > claim.start);
}
function analyzeSecretContent(context) {
  const { content, file } = context;
  const offsets = buildLineOffsets(content);
  const findings = [];
  const claims = [];
  const deferUrlCredentials = classifyAgentFile(file) === "mcp-config";
  for (const rule of SECRET_RULES) {
    if (deferUrlCredentials && rule.id === "secret.basic-auth-url")
      continue;
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const matched = match[0];
      const credential = match[1] ?? matched;
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      const line = lineAt(offsets, start);
      if (overlaps(claims, start, end))
        continue;
      const lineSource = lineText(content, line);
      if (rule.isFalsePositive?.(credential, lineSource))
        continue;
      claims.push({ start, end });
      findings.push({
        id: rule.id,
        analyzer: "secret",
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        location: { file, line },
        evidence: redactSecrets(redactMatch(credential)),
        remediation: rule.remediation
      });
    }
  }
  return findings;
}
var secretAnalyzer = {
  id: "secret",
  name: "Secret scanner",
  description: "Finds committed credentials: GitHub, AWS, private keys, Slack, Stripe, LLM API keys, database URLs and high-entropy values.",
  rules: SECRET_RULES.map(toRuleDefinition),
  analyze: analyzeSecretContent
};

// src/core/yaml.ts
var import_yaml = __toESM(require_dist(), 1);
function parseYamlDocument(source) {
  return import_yaml.parseDocument(source, { keepSourceTokens: false });
}
function mapEntries(node) {
  if (!node || !import_yaml.isMap(node))
    return [];
  return node.items.map((pair) => ({
    key: pair.key ? String(pair.key.value ?? "") : "",
    keyNode: pair.key ?? null,
    value: pair.value ?? null
  }));
}
function seqItems(node) {
  if (!node || !import_yaml.isSeq(node))
    return [];
  return node.items;
}
function scalarText(node) {
  if (!node || !import_yaml.isScalar(node))
    return null;
  const value = node.value;
  if (value === null || value === undefined)
    return null;
  return String(value);
}
function nodeOffset(node) {
  if (!node)
    return null;
  const range = node.range;
  return range ? range[0] : null;
}
function nodeEnd(node) {
  if (!node)
    return null;
  const range = node.range;
  return range ? range[1] : null;
}
function lineOfOffset(source, offset) {
  let line = 1;
  for (let index = 0;index < offset && index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10)
      line += 1;
  }
  return line;
}

// src/analyzers/token/permissions.ts
function definePermission(name, title, description, category, access, readCapabilities, writeCapabilities) {
  return { name, title, description, category, access, readCapabilities, writeCapabilities };
}
var PERMISSION_DEFINITIONS = {
  "repo.contents": definePermission("repo.contents", "Contents", "Repository contents, commits, branches, tags and releases.", "repository", ["read", "write"], ["code:read"], ["code:read", "code:write"]),
  "repo.workflows": definePermission("repo.workflows", "Workflows", "GitHub Actions workflow files.", "repository", ["read", "write"], [], ["workflow:write"]),
  "repo.actions": definePermission("repo.actions", "Actions", "Actions runs, artifacts and caches.", "repository", ["read", "write"], [], ["actions:manage"]),
  "repo.administration": definePermission("repo.administration", "Administration", "Repository settings, collaborators, deploy keys and branch protection.", "repository", ["read", "write"], [], ["repo:admin"]),
  "repo.secrets": definePermission("repo.secrets", "Secrets", "Repository Actions secrets.", "repository", ["read", "write"], [], ["secrets:manage"]),
  "repo.environments": definePermission("repo.environments", "Environments", "Deployment environments and their protection rules.", "repository", ["read", "write"], [], ["repo:admin"]),
  "repo.packages": definePermission("repo.packages", "Packages", "GitHub Packages published from the repository.", "repository", ["read", "write"], ["packages:read"], ["packages:write"]),
  "repo.pages": definePermission("repo.pages", "Pages", "GitHub Pages sites.", "repository", ["read", "write"], [], ["pages:write"]),
  "repo.pull_requests": definePermission("repo.pull_requests", "Pull requests", "Pull requests, reviews and merges.", "repository", ["read", "write"], ["code:read"], ["code:write"]),
  "repo.issues": definePermission("repo.issues", "Issues", "Issues and issue comments.", "repository", ["read", "write"], ["code:read"], ["issues:write"]),
  "repo.checks": definePermission("repo.checks", "Checks", "Check runs and check suites.", "repository", ["read", "write"], [], ["checks:write"]),
  "repo.statuses": definePermission("repo.statuses", "Commit statuses", "Commit statuses.", "repository", ["read", "write"], [], ["status:write"]),
  "repo.deployments": definePermission("repo.deployments", "Deployments", "Deployments and deployment statuses.", "repository", ["read", "write"], [], ["deployments:write"]),
  "repo.discussions": definePermission("repo.discussions", "Discussions", "Repository discussions.", "repository", ["read", "write"], [], ["discussions:write"]),
  "repo.repository_hooks": definePermission("repo.repository_hooks", "Webhooks", "Repository webhooks.", "repository", ["read", "write"], ["webhooks:read"], ["webhooks:write"]),
  "repo.security_events": definePermission("repo.security_events", "Security events", "Security events and code scanning data.", "repository", ["read", "write"], ["security:read"], ["security:write"]),
  "repo.secret_scanning_alerts": definePermission("repo.secret_scanning_alerts", "Secret scanning alerts", "Secret scanning alerts.", "repository", ["read", "write"], ["security:read"], ["security:write"]),
  "repo.dependabot_alerts": definePermission("repo.dependabot_alerts", "Dependabot alerts", "Dependabot alerts.", "repository", ["read", "write"], ["security:read"], ["security:write"]),
  "repo.code_scanning_alerts": definePermission("repo.code_scanning_alerts", "Code scanning alerts", "Code scanning alerts.", "repository", ["read", "write"], ["security:read"], ["security:write"]),
  "repo.repository_advisories": definePermission("repo.repository_advisories", "Repository advisories", "Security advisories.", "repository", ["read", "write"], ["security:read"], ["security:write"]),
  "repo.attestations": definePermission("repo.attestations", "Attestations", "Artifact attestations used for supply-chain verification.", "repository", ["read", "write"], [], ["attestations:write"]),
  "repo.variables": definePermission("repo.variables", "Variables", "Repository Actions variables.", "repository", ["read", "write"], [], ["variables:manage"]),
  "repo.custom_properties": definePermission("repo.custom_properties", "Custom properties", "Repository custom property values.", "repository", ["read", "write"], [], ["repo:admin"]),
  "repo.merge_queues": definePermission("repo.merge_queues", "Merge queues", "Merge queue configuration.", "repository", ["read", "write"], [], ["repo:admin"]),
  "repo.codespaces": definePermission("repo.codespaces", "Codespaces", "Codespaces for the repository.", "repository", ["read", "write"], [], ["codespaces:write"]),
  "repo.metadata": definePermission("repo.metadata", "Metadata", "Mandatory read-only repository metadata.", "repository", ["read"], [], []),
  "org.administration": definePermission("org.administration", "Organization administration", "Organization settings, members, teams and custom roles.", "organization", ["read", "write"], ["org:read"], ["org:admin"]),
  "org.members": definePermission("org.members", "Members", "Organization members and membership.", "organization", ["read", "write"], ["org:read"], ["org:write"]),
  "org.organization_secrets": definePermission("org.organization_secrets", "Organization secrets", "Organization-wide Actions secrets.", "organization", ["read", "write"], [], ["secrets:manage"]),
  "org.organization_variables": definePermission("org.organization_variables", "Organization variables", "Organization-wide Actions variables.", "organization", ["read", "write"], [], ["variables:manage"]),
  "org.organization_self_hosted_runners": definePermission("org.organization_self_hosted_runners", "Self-hosted runners", "Organization self-hosted runners.", "organization", ["read", "write"], [], ["runners:manage"]),
  "org.organization_webhooks": definePermission("org.organization_webhooks", "Organization webhooks", "Organization webhooks.", "organization", ["read", "write"], ["webhooks:read"], ["org_webhooks:write"]),
  "org.organization_projects": definePermission("org.organization_projects", "Organization projects", "Organization projects.", "organization", ["read", "write"], ["projects:read"], ["projects:write"]),
  "org.organization_packages": definePermission("org.organization_packages", "Organization packages", "Organization packages.", "organization", ["read", "write"], ["packages:read"], ["packages:write"]),
  "org.organization_copilot": definePermission("org.organization_copilot", "Copilot", "Copilot seats and policies.", "organization", ["read", "write"], [], ["copilot:manage"]),
  "org.organization_codespaces": definePermission("org.organization_codespaces", "Organization Codespaces", "Organization Codespaces.", "organization", ["read", "write"], [], ["codespaces:write"]),
  "org.organization_user_blocking": definePermission("org.organization_user_blocking", "User blocking", "Block or unblock organization users.", "organization", ["read", "write"], [], ["org:write"]),
  "org.organization_custom_roles": definePermission("org.organization_custom_roles", "Custom organization roles", "Custom organization roles.", "organization", ["read", "write"], [], ["org:admin"]),
  "org.organization_custom_repository_roles": definePermission("org.organization_custom_repository_roles", "Custom repository roles", "Custom repository roles.", "organization", ["read", "write"], [], ["org:admin"]),
  "org.organization_plan": definePermission("org.organization_plan", "Plan", "Organization plan information.", "organization", ["read"], ["enterprise:read"], []),
  "org.organization_events": definePermission("org.organization_events", "Events", "Organization audit events.", "organization", ["read"], ["audit:read"], []),
  "org.organization_dependabot_secrets": definePermission("org.organization_dependabot_secrets", "Dependabot secrets", "Organization Dependabot secrets.", "organization", ["read", "write"], [], ["secrets:manage"]),
  "org.organization_codespaces_secrets": definePermission("org.organization_codespaces_secrets", "Codespaces secrets", "Organization Codespaces secrets.", "organization", ["read", "write"], [], ["secrets:manage"]),
  "org.organization_codespaces_settings": definePermission("org.organization_codespaces_settings", "Codespaces settings", "Organization Codespaces settings.", "organization", ["read", "write"], [], ["codespaces:write"]),
  "org.personal_access_tokens": definePermission("org.personal_access_tokens", "Personal access tokens", "Fine-grained personal access tokens for the organization.", "organization", ["read", "write"], [], ["tokens:manage"]),
  "user.gists": definePermission("user.gists", "Gists", "Gists owned by the user.", "user", ["read", "write"], [], ["gists:write"]),
  "user.git_ssh_keys": definePermission("user.git_ssh_keys", "Git SSH keys", "SSH keys used for Git access.", "user", ["read", "write"], ["keys:read"], ["keys:write"]),
  "user.gpg_keys": definePermission("user.gpg_keys", "GPG keys", "GPG keys used for commit signing.", "user", ["read", "write"], ["keys:read"], ["keys:write"]),
  "user.ssh_signing_keys": definePermission("user.ssh_signing_keys", "SSH signing keys", "SSH keys used for commit signing.", "user", ["read", "write"], ["keys:read"], ["keys:write"]),
  "user.emails": definePermission("user.emails", "Email addresses", "Email addresses associated with the account.", "user", ["read"], ["email:read"], []),
  "user.followers": definePermission("user.followers", "Followers", "Follow and unfollow users.", "user", ["read", "write"], [], ["follow:write"]),
  "user.notifications": definePermission("user.notifications", "Notifications", "Notification settings and threads.", "user", ["read", "write"], [], ["notifications:write"]),
  "user.codespaces": definePermission("user.codespaces", "User Codespaces", "Codespaces owned by the user.", "user", ["read", "write"], [], ["codespaces:write"])
};
function permissionGrantLabel(grant) {
  return `${grant.permission}=${grant.access}`;
}

// src/analyzers/token/scopes.ts
function defineScope(name, description, severity, category, capabilities) {
  return { name, description, severity, category, capabilities };
}
var SCOPE_DEFINITIONS = {
  repo: defineScope("repo", "Full control of private repositories: code, issues, pull requests, releases, collaborators and settings.", "high", "repository", ["code:read", "code:write", "repo:admin", "secrets:manage"]),
  "repo:status": defineScope("repo:status", "Read and write commit statuses.", "low", "repository", ["status:write"]),
  repo_deployment: defineScope("repo_deployment", "Read and write deployment statuses.", "low", "repository", ["deployments:write"]),
  public_repo: defineScope("public_repo", "Read and write public repositories only.", "medium", "repository", ["public:write"]),
  "repo:invite": defineScope("repo:invite", "Accept or decline repository invitations.", "low", "repository", ["invitations:write"]),
  security_events: defineScope("security_events", "Read and write security events such as code scanning alerts.", "medium", "repository", ["security:read"]),
  workflow: defineScope("workflow", "Add or update GitHub Actions workflow files.", "high", "actions", ["workflow:write"]),
  "write:packages": defineScope("write:packages", "Upload and publish packages.", "high", "packages", ["packages:write"]),
  "read:packages": defineScope("read:packages", "Download packages.", "low", "packages", ["packages:read"]),
  "delete:packages": defineScope("delete:packages", "Delete packages.", "critical", "packages", ["packages:delete"]),
  "admin:org": defineScope("admin:org", "Full control of organizations and teams, including members and organization secrets.", "critical", "organization", ["org:admin", "org:read", "secrets:manage"]),
  "write:org": defineScope("write:org", "Read and write organization membership, projects and team membership.", "high", "organization", ["org:write"]),
  "read:org": defineScope("read:org", "Read organization membership and teams.", "low", "organization", ["org:read"]),
  "manage_runners:org": defineScope("manage_runners:org", "Manage organization-level self-hosted runners.", "high", "organization", ["runners:manage"]),
  "admin:public_key": defineScope("admin:public_key", "Full control of public SSH keys.", "high", "identity", ["keys:write"]),
  "write:public_key": defineScope("write:public_key", "Create and update public SSH keys.", "high", "identity", ["keys:write"]),
  "read:public_key": defineScope("read:public_key", "Read public SSH keys.", "low", "identity", ["keys:read"]),
  "admin:repo_hook": defineScope("admin:repo_hook", "Full control of repository webhooks.", "medium", "hooks", ["webhooks:write"]),
  "write:repo_hook": defineScope("write:repo_hook", "Create and update repository webhooks.", "medium", "hooks", ["webhooks:write"]),
  "read:repo_hook": defineScope("read:repo_hook", "Read repository webhooks.", "low", "hooks", ["webhooks:read"]),
  "admin:org_hook": defineScope("admin:org_hook", "Full control of organization webhooks.", "high", "hooks", ["org_webhooks:write"]),
  gist: defineScope("gist", "Create and update gists.", "low", "account", ["gists:write"]),
  notifications: defineScope("notifications", "Read and manage notifications.", "low", "account", ["notifications:write"]),
  user: defineScope("user", "Read and write profile data, including name, email and bio.", "medium", "account", ["profile:write"]),
  "read:user": defineScope("read:user", "Read profile data.", "low", "account", ["profile:read"]),
  "user:email": defineScope("user:email", "Read email addresses.", "low", "account", ["email:read"]),
  "user:follow": defineScope("user:follow", "Follow and unfollow users.", "low", "account", ["follow:write"]),
  project: defineScope("project", "Read and write projects.", "medium", "projects", ["projects:write"]),
  "read:project": defineScope("read:project", "Read projects.", "low", "projects", ["projects:read"]),
  delete_repo: defineScope("delete_repo", "Delete repositories.", "critical", "repository", ["repo:delete"]),
  "write:discussion": defineScope("write:discussion", "Read and write team discussions.", "medium", "organization", ["discussions:write"]),
  "read:discussion": defineScope("read:discussion", "Read team discussions.", "low", "organization", ["discussions:read"]),
  "admin:enterprise": defineScope("admin:enterprise", "Full control of enterprises, including policies, members and audit data.", "critical", "enterprise", ["enterprise:admin", "enterprise:read"]),
  "manage_runners:enterprise": defineScope("manage_runners:enterprise", "Manage enterprise-level self-hosted runners.", "high", "enterprise", ["runners:manage"]),
  "manage_billing:enterprise": defineScope("manage_billing:enterprise", "Read and write enterprise billing data.", "high", "enterprise", ["billing:manage"]),
  "read:enterprise": defineScope("read:enterprise", "Read enterprise data.", "medium", "enterprise", ["enterprise:read"]),
  audit_log: defineScope("audit_log", "Read the enterprise audit log.", "medium", "enterprise", ["audit:read"]),
  codespace: defineScope("codespace", "Create, read, update and delete Codespaces.", "medium", "codespaces", ["codespaces:write"]),
  copilot: defineScope("copilot", "Manage GitHub Copilot settings and seats.", "high", "copilot", ["copilot:manage"]),
  "write:network_configurations": defineScope("write:network_configurations", "Read and write network configurations.", "high", "enterprise", ["network:write"]),
  "read:network_configurations": defineScope("read:network_configurations", "Read network configurations.", "low", "enterprise", ["network:read"]),
  "admin:gpg_key": defineScope("admin:gpg_key", "Full control of GPG keys.", "high", "identity", ["keys:write"]),
  "write:gpg_key": defineScope("write:gpg_key", "Create and update GPG keys.", "high", "identity", ["keys:write"]),
  "read:gpg_key": defineScope("read:gpg_key", "Read GPG keys.", "low", "identity", ["keys:read"]),
  "admin:ssh_signing_key": defineScope("admin:ssh_signing_key", "Full control of SSH signing keys.", "high", "identity", ["keys:write"]),
  "write:ssh_signing_key": defineScope("write:ssh_signing_key", "Create and update SSH signing keys.", "high", "identity", ["keys:write"]),
  "read:ssh_signing_key": defineScope("read:ssh_signing_key", "Read SSH signing keys.", "low", "identity", ["keys:read"])
};

// src/analyzers/token/capabilities.ts
var CAPABILITY_META = [
  {
    id: "code:read",
    title: "Read repository contents",
    description: "Read source code, commits, branches, issues and pull requests in accessible repositories.",
    severity: "low",
    category: "repository"
  },
  {
    id: "code:write",
    title: "Write repository contents",
    description: "Push commits, rewrite branches, edit issues and pull requests, and publish releases.",
    severity: "high",
    category: "repository"
  },
  {
    id: "repo:admin",
    title: "Change repository settings",
    description: "Manage collaborators, deploy keys, branch protection, repository secrets and other settings.",
    severity: "high",
    category: "repository"
  },
  {
    id: "repo:delete",
    title: "Delete repositories",
    description: "Permanently delete repositories, including all code, issues and releases.",
    severity: "critical",
    category: "repository"
  },
  {
    id: "secrets:manage",
    title: "Manage CI/CD secrets",
    description: "Create, overwrite or remove repository and organization secrets used by workflows.",
    severity: "high",
    category: "actions"
  },
  {
    id: "workflow:write",
    title: "Modify GitHub Actions workflows",
    description: "Add or change workflow files, which can execute code and expose repository secrets.",
    severity: "high",
    category: "actions"
  },
  {
    id: "actions:manage",
    title: "Manage Actions runs",
    description: "Cancel or rerun workflows, delete artifacts and caches, and disrupt or extract CI data.",
    severity: "high",
    category: "actions"
  },
  {
    id: "checks:write",
    title: "Write check results",
    description: "Create or update check runs, which can fake CI results and bypass required checks.",
    severity: "high",
    category: "actions"
  },
  {
    id: "variables:manage",
    title: "Manage Actions variables",
    description: "Change repository or organization variables used by workflows.",
    severity: "medium",
    category: "actions"
  },
  {
    id: "runners:manage",
    title: "Manage self-hosted runners",
    description: "Register or remove self-hosted runners, potentially redirecting CI jobs to attacker-controlled machines.",
    severity: "high",
    category: "actions"
  },
  {
    id: "org:admin",
    title: "Manage organization",
    description: "Add or remove members, change roles, manage teams, settings and organization secrets.",
    severity: "critical",
    category: "organization"
  },
  {
    id: "org:write",
    title: "Manage teams and projects",
    description: "Change organization membership, teams and projects.",
    severity: "high",
    category: "organization"
  },
  {
    id: "org:read",
    title: "Read organization membership",
    description: "Enumerate organization members, teams and roles.",
    severity: "low",
    category: "organization"
  },
  {
    id: "enterprise:admin",
    title: "Manage enterprise",
    description: "Change enterprise policies, members, organizations and security settings.",
    severity: "critical",
    category: "enterprise"
  },
  {
    id: "enterprise:read",
    title: "Read enterprise data",
    description: "Read enterprise policies, organizations and member information.",
    severity: "medium",
    category: "enterprise"
  },
  {
    id: "billing:manage",
    title: "Manage billing",
    description: "Read and change billing settings and spending limits.",
    severity: "high",
    category: "enterprise"
  },
  {
    id: "audit:read",
    title: "Read audit log",
    description: "Read enterprise audit events, which may contain sensitive operational data.",
    severity: "medium",
    category: "enterprise"
  },
  {
    id: "network:write",
    title: "Manage network configurations",
    description: "Change enterprise network configurations and private networking settings.",
    severity: "high",
    category: "enterprise"
  },
  {
    id: "network:read",
    title: "Read network configurations",
    description: "Read enterprise network configurations.",
    severity: "low",
    category: "enterprise"
  },
  {
    id: "packages:write",
    title: "Publish packages",
    description: "Publish or overwrite packages that downstream users may install.",
    severity: "high",
    category: "packages"
  },
  {
    id: "packages:read",
    title: "Read packages",
    description: "Download private packages.",
    severity: "low",
    category: "packages"
  },
  {
    id: "packages:delete",
    title: "Delete packages",
    description: "Delete packages, breaking downstream installs and potentially enabling supply-chain attacks.",
    severity: "critical",
    category: "packages"
  },
  {
    id: "keys:write",
    title: "Manage SSH and GPG keys",
    description: "Add, replace or remove keys, enabling persistent access or commit impersonation.",
    severity: "high",
    category: "identity"
  },
  {
    id: "keys:read",
    title: "Read SSH and GPG keys",
    description: "Enumerate public keys associated with the account.",
    severity: "low",
    category: "identity"
  },
  {
    id: "tokens:manage",
    title: "Manage personal access tokens",
    description: "Create, approve or revoke fine-grained personal access tokens for the organization.",
    severity: "critical",
    category: "identity"
  },
  {
    id: "webhooks:write",
    title: "Manage repository webhooks",
    description: "Create webhooks that exfiltrate repository events to an external endpoint.",
    severity: "medium",
    category: "hooks"
  },
  {
    id: "webhooks:read",
    title: "Read repository webhooks",
    description: "Read webhook configurations and target URLs.",
    severity: "low",
    category: "hooks"
  },
  {
    id: "org_webhooks:write",
    title: "Manage organization webhooks",
    description: "Create organization webhooks that exfiltrate events across all repositories.",
    severity: "high",
    category: "hooks"
  },
  {
    id: "gists:write",
    title: "Create or update gists",
    description: "Publish or modify gists, including secret gists.",
    severity: "low",
    category: "account"
  },
  {
    id: "notifications:write",
    title: "Manage notifications",
    description: "Mark notifications as read and change notification settings.",
    severity: "low",
    category: "account"
  },
  {
    id: "profile:write",
    title: "Modify profile",
    description: "Change the account's name, bio, email, company and other public profile fields.",
    severity: "medium",
    category: "account"
  },
  {
    id: "profile:read",
    title: "Read profile",
    description: "Read public and private profile fields.",
    severity: "low",
    category: "account"
  },
  {
    id: "email:read",
    title: "Read email addresses",
    description: "Read the account's email addresses, including private ones.",
    severity: "low",
    category: "account"
  },
  {
    id: "follow:write",
    title: "Follow or unfollow users",
    description: "Change the account's social graph.",
    severity: "low",
    category: "account"
  },
  {
    id: "projects:write",
    title: "Manage projects",
    description: "Create and modify projects, including items and fields.",
    severity: "medium",
    category: "projects"
  },
  {
    id: "projects:read",
    title: "Read projects",
    description: "Read project data.",
    severity: "low",
    category: "projects"
  },
  {
    id: "discussions:write",
    title: "Manage team discussions",
    description: "Create and modify team discussions.",
    severity: "medium",
    category: "organization"
  },
  {
    id: "discussions:read",
    title: "Read team discussions",
    description: "Read team discussions.",
    severity: "low",
    category: "organization"
  },
  {
    id: "codespaces:write",
    title: "Manage Codespaces",
    description: "Create, access and delete Codespaces, which may contain repository credentials.",
    severity: "medium",
    category: "codespaces"
  },
  {
    id: "copilot:manage",
    title: "Manage Copilot",
    description: "Manage Copilot seats, policies and settings.",
    severity: "high",
    category: "copilot"
  },
  {
    id: "status:write",
    title: "Write commit statuses",
    description: "Set commit statuses, which can influence merge decisions.",
    severity: "low",
    category: "repository"
  },
  {
    id: "deployments:write",
    title: "Write deployments",
    description: "Create and update deployments.",
    severity: "low",
    category: "repository"
  },
  {
    id: "public:write",
    title: "Write public repositories",
    description: "Push commits and edit issues or pull requests in public repositories.",
    severity: "medium",
    category: "repository"
  },
  {
    id: "issues:write",
    title: "Manage issues",
    description: "Create, edit or close issues and comments, which can be used for social engineering.",
    severity: "medium",
    category: "repository"
  },
  {
    id: "pages:write",
    title: "Publish GitHub Pages",
    description: "Deploy content to a GitHub Pages site, potentially impersonating the project.",
    severity: "medium",
    category: "repository"
  },
  {
    id: "security:write",
    title: "Dismiss security findings",
    description: "Dismiss or hide code scanning, secret scanning and Dependabot alerts.",
    severity: "high",
    category: "repository"
  },
  {
    id: "attestations:write",
    title: "Write artifact attestations",
    description: "Publish supply-chain attestations that downstream users may trust.",
    severity: "high",
    category: "packages"
  },
  {
    id: "invitations:write",
    title: "Manage repository invitations",
    description: "Accept or decline repository invitations.",
    severity: "low",
    category: "repository"
  },
  {
    id: "security:read",
    title: "Read security events",
    description: "Read code scanning and security alert data.",
    severity: "medium",
    category: "repository"
  }
];
var CAPABILITY_DEFINITIONS = CAPABILITY_META.map((capability) => ({
  ...capability,
  scopes: Object.values(SCOPE_DEFINITIONS).filter((scope) => scope.capabilities.includes(capability.id)).map((scope) => scope.name).sort(),
  permissions: Object.values(PERMISSION_DEFINITIONS).flatMap((permission) => {
    const grants = [];
    if (permission.readCapabilities.includes(capability.id)) {
      grants.push(`${permission.name}=read`);
    }
    if (permission.writeCapabilities.includes(capability.id)) {
      grants.push(`${permission.name}=write`);
    }
    return grants;
  }).sort()
})).sort((a, b) => a.id.localeCompare(b.id));
var CAPABILITY_BY_ID = Object.fromEntries(CAPABILITY_DEFINITIONS.map((capability) => [capability.id, capability]));
var SEVERITY_RANK = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};
function compareSeverity(a, b) {
  return SEVERITY_RANK[b] - SEVERITY_RANK[a];
}
function buildCapabilities(matched) {
  return [...matched.entries()].map(([capabilityId, matchedBy]) => {
    const definition = CAPABILITY_BY_ID[capabilityId];
    if (!definition) {
      throw new Error(`Unknown capability "${capabilityId}" in the capability matrix.`);
    }
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      severity: definition.severity,
      category: definition.category,
      matchedScopes: [...matchedBy].sort()
    };
  }).sort((a, b) => compareSeverity(a.severity, b.severity) || a.title.localeCompare(b.title));
}
function resolveCapabilities(scopes) {
  const matched = new Map;
  for (const scopeName of scopes) {
    const scope = SCOPE_DEFINITIONS[scopeName];
    if (!scope)
      continue;
    for (const capabilityId of scope.capabilities) {
      const set = matched.get(capabilityId) ?? new Set;
      set.add(scopeName);
      matched.set(capabilityId, set);
    }
  }
  return buildCapabilities(matched);
}
function resolveCapabilitiesFromPermissions(grants) {
  const matched = new Map;
  for (const grant of grants) {
    const permission = PERMISSION_DEFINITIONS[grant.permission];
    if (!permission)
      continue;
    const capabilityIds = grant.access === "read" ? permission.readCapabilities : permission.writeCapabilities;
    for (const capabilityId of capabilityIds) {
      const set = matched.get(capabilityId) ?? new Set;
      set.add(permissionGrantLabel(grant));
      matched.set(capabilityId, set);
    }
  }
  return buildCapabilities(matched);
}
function mergeCapabilities(...groups) {
  const matched = new Map;
  for (const group of groups) {
    for (const capability of group) {
      const set = matched.get(capability.id) ?? new Set;
      for (const source of capability.matchedScopes) {
        set.add(source);
      }
      matched.set(capability.id, set);
    }
  }
  return buildCapabilities(matched);
}

// src/analyzers/token/capability-findings.ts
function capabilityFindingId(capabilityId) {
  return `token.capability.${capabilityId.replace(/[:.]/g, ".")}`;
}
var REMEDIATION = {
  repository: "Drop the scope or permission that grants this and use a token that only covers the repositories you work on.",
  actions: "Drop the scope or permission that grants this. Workflow and runner access turns a leaked token into code execution.",
  organization: "Drop the scope or permission that grants this. Organization access reaches repositories you cannot see from this repository.",
  enterprise: "Drop the scope or permission that grants this. Enterprise access reaches every organization in the enterprise.",
  packages: "Drop the scope or permission that grants this. Package write access is a supply chain risk.",
  identity: "Drop the scope or permission that grants this. Key and token management is persistent access.",
  hooks: "Drop the scope or permission that grants this. Webhooks can exfiltrate repository events to an external endpoint.",
  account: "Drop the scope or permission that grants this. It is not needed for most day to day work.",
  projects: "Drop the scope or permission that grants this.",
  codespaces: "Drop the scope or permission that grants this. Codespaces can contain repository credentials.",
  copilot: "Drop the scope or permission that grants this."
};
function capabilitiesToFindings(capabilities) {
  return capabilities.map((capability) => ({
    id: capabilityFindingId(capability.id),
    analyzer: "token",
    severity: capability.severity,
    title: capability.title,
    description: capability.description,
    grantedBy: capability.matchedScopes,
    remediation: REMEDIATION[capability.category] ?? "Drop the scope or permission that grants this capability."
  }));
}
// package.json
var package_default = {
  name: "ghcheck",
  version: "0.3.0",
  description: "One scan, one report: token blast radius, workflow holes, leaked secrets and agent configuration.",
  type: "module",
  bin: {
    ghcheck: "dist/ghcheck"
  },
  files: [
    "dist",
    "action-dist",
    "action.yml",
    "README.md",
    "LICENSE"
  ],
  scripts: {
    dev: "bun run src/cli.ts",
    build: "bun run scripts/build.ts",
    "build:all": "bun run scripts/build-all.ts",
    "build:action": "bun run scripts/build-action.ts",
    "build:mcp": "bun run scripts/build-mcp.ts",
    docs: "bun run scripts/generate-docs.ts",
    test: "bun test",
    typecheck: "tsc --noEmit",
    check: "bun run typecheck && bun test"
  },
  keywords: [
    "github",
    "security",
    "secret-scanning",
    "workflow-audit",
    "least-privilege",
    "agent",
    "mcp",
    "cli",
    "sarif"
  ],
  license: "MIT",
  engines: {
    bun: ">=1.2.0"
  },
  dependencies: {
    "@modelcontextprotocol/server": "2.3.1",
    commander: "^15.0.0",
    picocolors: "^1.1.1",
    yaml: "^2.8.1",
    zod: "^4.2.0"
  },
  devDependencies: {
    "@modelcontextprotocol/client": "2.3.1",
    "@types/bun": "^1.4.3",
    typescript: "^7.0.2"
  }
};

// src/analyzers/token/github.ts
var API_BASE = "https://api.github.com";
var USER_AGENT = `ghcheck/${package_default.version}`;
function errorMessage(data, status) {
  if (data && typeof data === "object" && "message" in data) {
    return String(data.message);
  }
  return `GitHub API returned HTTP ${status}`;
}

class GitHubClient {
  token;
  constructor(token) {
    this.token = token;
  }
  async request(path, init = {}) {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(15000),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": USER_AGENT,
          ...init.headers ?? {}
        }
      });
      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      return {
        ok: response.ok,
        status: response.status,
        headers: response.headers,
        data,
        error: response.ok ? null : errorMessage(data, response.status)
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        status: 0,
        headers: new Headers,
        data: null,
        error: `Could not reach api.github.com: ${message}`
      };
    }
  }
  getUser() {
    return this.request("/user");
  }
  getOrgs() {
    return this.request("/user/orgs?per_page=100");
  }
  getInstallationRepositories() {
    return this.request("/installation/repositories?per_page=1");
  }
  getRepo(fullName) {
    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) {
      return Promise.resolve({
        ok: false,
        status: 400,
        headers: new Headers,
        data: null,
        error: "Invalid repository name. Expected owner/repo."
      });
    }
    return this.request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }
}

// src/analyzers/token/token.ts
var TOKEN_PREFIXES2 = [
  ["github_pat_", "fine-grained-pat"],
  ["ghp_", "classic-pat"],
  ["gho_", "oauth"],
  ["ghu_", "github-app-user"],
  ["ghs_", "github-app-server"],
  ["ghr_", "github-app-refresh"]
];
var TOKEN_TYPE_LABELS = {
  "classic-pat": "classic PAT",
  "fine-grained-pat": "fine-grained PAT",
  oauth: "OAuth access token",
  "github-app-user": "GitHub App user token",
  "github-app-server": "GitHub App server token",
  "github-app-refresh": "GitHub App refresh token",
  unknown: "unknown token type"
};
function detectTokenType(token) {
  for (const [prefix, type] of TOKEN_PREFIXES2) {
    if (token.startsWith(prefix))
      return type;
  }
  return "unknown";
}
function tokenTypeLabel(type) {
  return TOKEN_TYPE_LABELS[type];
}
function redactToken(token) {
  const prefix = TOKEN_PREFIXES2.find(([candidate]) => token.startsWith(candidate))?.[0];
  return prefix ? `${prefix}****...redacted` : "****...redacted";
}
function normalizeScopes(raw) {
  if (!raw)
    return [];
  return [...new Set(raw.split(",").map((scope) => scope.trim()).filter(Boolean))].sort();
}

// src/analyzers/token/scan.ts
function splitGrants(grants) {
  const valid = [];
  const unknown = [];
  for (const grant of grants) {
    if (PERMISSION_DEFINITIONS[grant.permission])
      valid.push(grant);
    else
      unknown.push(grant);
  }
  return { valid, unknown };
}
async function scanTokenContext(context) {
  const warnings = [];
  let identity = null;
  let apiScopes = [];
  let tokenType = context.tokenType ?? "unknown";
  if (context.token) {
    const token = context.token.trim();
    tokenType = context.tokenType ?? detectTokenType(token);
    if (tokenType === "github-app-refresh") {
      throw new Error("Refresh tokens cannot be scanned. Use the corresponding access token instead.");
    }
    const client = new GitHubClient(token);
    const user = await client.getUser();
    if (user.status === 401) {
      throw new Error("GitHub rejected the token (401). It may be expired, revoked or mistyped.");
    }
    if (!user.ok) {
      throw new Error(user.error ?? "GitHub rejected the token.");
    }
    identity = { login: user.data?.login ?? context.login ?? "unknown" };
    apiScopes = normalizeScopes(user.headers.get("x-oauth-scopes"));
    if (tokenType === "fine-grained-pat") {
      apiScopes = [];
      warnings.push("Fine-grained PAT permissions are not exposed by the GitHub API. Use --permissions to provide them; without them the score is marked unknown.");
    } else if (apiScopes.length === 0) {
      warnings.push("GitHub returned no OAuth scopes. The token may have no scopes, or this may be a fine-grained or app token.");
    }
  }
  const suppliedScopes = context.scopes ?? [];
  const scopes = [...new Set([...apiScopes, ...suppliedScopes])].sort();
  if (suppliedScopes.length > 0 && context.token) {
    warnings.push(`Additional scopes were supplied with --scopes: ${suppliedScopes.join(", ")}. The report combines them with the scopes GitHub returned.`);
  }
  const { valid: permissions, unknown: unknownPermissions } = splitGrants(context.permissions ?? []);
  if (unknownPermissions.length > 0) {
    warnings.push(`Unknown permissions were ignored: ${unknownPermissions.map((grant) => `${grant.permission}=${grant.access}`).join(", ")}.`);
  }
  const unknownScopes = scopes.filter((scope) => !SCOPE_DEFINITIONS[scope]);
  if (unknownScopes.length > 0) {
    warnings.push(`Unknown scopes were ignored: ${unknownScopes.join(", ")}.`);
  }
  if (tokenType === "fine-grained-pat" && permissions.length > 0) {
    warnings.push("Fine-grained PAT permissions are self-reported via --permissions and cannot be verified through the GitHub API.");
  }
  const capabilities = mergeCapabilities(resolveCapabilities(scopes), resolveCapabilitiesFromPermissions(permissions));
  const scoreKnown = scopes.length > 0 || permissions.length > 0;
  if (!scoreKnown) {
    warnings.push("No scopes or permissions were available, so no capability could be evaluated. Use --scopes or --permissions to describe the token.");
  }
  return {
    findings: capabilitiesToFindings(capabilities),
    warnings,
    identity,
    tokenType,
    tokenTypeLabel: tokenTypeLabel(tokenType),
    scopes,
    permissions,
    scoreKnown,
    redacted: context.token ? redactToken(context.token) : "(not provided)"
  };
}

// src/analyzers/token/index.ts
var PERMISSION_CAPABILITIES = {
  administration: {
    title: "change repository settings",
    severity: "critical",
    description: "Can rename the repository, change its visibility, delete it and manage every other setting."
  },
  contents: {
    title: "read and write repository contents",
    severity: "high",
    description: "Can push commits, rewrite branches, publish releases and edit the code the workflow protects."
  },
  workflows: {
    title: "modify CI workflows",
    severity: "high",
    description: "Can add or change workflow files, which is code execution on every future run of this repository."
  },
  actions: {
    title: "manage actions, runners and workflow runs",
    severity: "high",
    description: "Can rerun or cancel runs and register new runners for the repository."
  },
  id_token: {
    title: "mint OIDC tokens for cloud providers",
    severity: "high",
    description: "Can request a signed identity token that cloud providers accept as a login, which is a path to the deployment account."
  },
  packages: {
    title: "publish and delete packages",
    severity: "medium",
    description: "Can publish packages under the repository's namespace and remove existing ones."
  },
  security_events: {
    title: "upload code scanning results",
    severity: "medium",
    description: "Can publish code scanning results, so alerts can be silenced."
  },
  attestations: {
    title: "write artifact attestations",
    severity: "medium",
    description: "Can sign build provenance statements for this repository."
  },
  pages: {
    title: "publish GitHub Pages",
    severity: "medium",
    description: "Can deploy a new version of the site."
  },
  pull_requests: {
    title: "write pull requests",
    severity: "low",
    description: "Can open and edit pull requests, including on protected branches."
  },
  issues: {
    title: "write issues",
    severity: "low",
    description: "Can create and edit issues."
  },
  deployments: {
    title: "create deployments",
    severity: "low",
    description: "Can create deployments and move the repository's production environment."
  },
  repository_projects: {
    title: "write project boards",
    severity: "low",
    description: "Can edit the project boards of this repository."
  }
};
var RULES = [
  {
    id: "token.write-all-permissions",
    title: "GITHUB_TOKEN is granted every permission",
    severity: "critical",
    description: "`permissions: write-all` gives the job a token that can change anything the repository can change.",
    remediation: "List the permissions the job actually needs instead of `write-all`."
  },
  {
    id: "token.permissions-not-declared",
    title: "GITHUB_TOKEN permissions are not declared",
    severity: "medium",
    description: "The job does not declare `permissions:`, so the token gets whatever the repository default is. On older repositories that default still includes write access.",
    remediation: "Declare `permissions:` explicitly on the workflow or on every job."
  },
  {
    id: "token.write-permission",
    title: "GITHUB_TOKEN has a write permission",
    severity: "high",
    description: "A write permission on GITHUB_TOKEN turns a compromised step into repository access.",
    remediation: "Drop the permission, or split the job so that the write step runs separately."
  }
];
var CAPABILITY_RULES = CAPABILITY_DEFINITIONS.map((capability) => ({
  id: capabilityFindingId(capability.id),
  title: capability.title,
  severity: capability.severity,
  description: capability.description,
  remediation: "Drop the scope or permission that grants this capability."
}));
function isWorkflowPath(file) {
  const normalized = file.replace(/\\/g, "/");
  return /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized);
}
function readPermissions(node) {
  const text = scalarText(node);
  if (text === "write-all") {
    return { kind: "write-all", entries: [], offset: nodeOffset(node) ?? 0 };
  }
  if (text === "read-all") {
    return { kind: "read-all", entries: [], offset: nodeOffset(node) ?? 0 };
  }
  if (text !== null) {
    return { kind: "none", entries: [], offset: nodeOffset(node) ?? 0 };
  }
  const entries = mapEntries(node).map((entry) => ({
    name: entry.key,
    access: (scalarText(entry.value) ?? "read").toLowerCase(),
    offset: nodeOffset(entry.keyNode) ?? 0
  }));
  return { kind: "map", entries, offset: nodeOffset(node) ?? 0 };
}
function analyzeToken(context) {
  const { content, file } = context;
  const findings = [];
  if (!isWorkflowPath(file))
    return findings;
  const doc = parseYamlDocument(content);
  if (doc.errors.length > 0)
    return findings;
  const root = doc.contents;
  const rootEntries = mapEntries(root);
  const workflowPermissionsEntry = rootEntries.find((entry) => entry.key === "permissions");
  const workflowPermissions = workflowPermissionsEntry ? readPermissions(workflowPermissionsEntry.value) : { kind: "none", entries: [], offset: 0 };
  const jobsEntry = rootEntries.find((entry) => entry.key === "jobs");
  const jobEntries = mapEntries(jobsEntry?.value);
  const reportWriteAll = (offset, scope) => {
    findings.push({
      id: "token.write-all-permissions",
      analyzer: "token",
      severity: "critical",
      title: `${scope} grants GITHUB_TOKEN every permission`,
      description: "`permissions: write-all` gives the job a token that can change anything the repository can change.",
      location: { file, line: lineOfOffset(content, offset) },
      evidence: "permissions: write-all",
      remediation: "List the permissions the job actually needs instead of `write-all`."
    });
  };
  const reportWritePermission = (name, access, offset, scope) => {
    const capability = PERMISSION_CAPABILITIES[name];
    if (!capability)
      return;
    findings.push({
      id: `token.write-permission-${name.replace(/_/g, "-")}`,
      analyzer: "token",
      severity: capability.severity,
      title: `${scope} can ${capability.title}`,
      description: capability.description,
      location: { file, line: lineOfOffset(content, offset) },
      evidence: `${name}: ${access}`,
      grantedBy: [`GITHUB_TOKEN ${name}=${access}`],
      remediation: "Drop the permission, or split the job so that the write step runs separately."
    });
  };
  if (workflowPermissions.kind === "write-all") {
    reportWriteAll(workflowPermissions.offset, "This workflow");
  }
  for (const job of jobEntries) {
    const jobMap = mapEntries(job.value);
    const jobPermissionsEntry = jobMap.find((entry) => entry.key === "permissions");
    const jobOffset = nodeOffset(job.keyNode) ?? 0;
    const jobLabel = `Job "${job.key}"`;
    if (!jobPermissionsEntry) {
      if (workflowPermissions.kind === "none") {
        findings.push({
          id: "token.permissions-not-declared",
          analyzer: "token",
          severity: "medium",
          title: `${jobLabel} does not declare GITHUB_TOKEN permissions`,
          description: "The job does not declare `permissions:`, so the token gets whatever the repository default is. On older repositories that default still includes write access.",
          location: { file, line: lineOfOffset(content, jobOffset) },
          remediation: "Declare `permissions:` explicitly on the workflow or on every job."
        });
        continue;
      }
      if (workflowPermissions.kind === "write-all")
        continue;
      for (const entry of workflowPermissions.entries) {
        if (entry.access !== "write")
          continue;
        reportWritePermission(entry.name, entry.access, entry.offset, jobLabel);
      }
      continue;
    }
    const jobPermissions = readPermissions(jobPermissionsEntry.value);
    const scope = jobLabel;
    if (jobPermissions.kind === "write-all") {
      reportWriteAll(jobPermissions.offset, scope);
      continue;
    }
    for (const entry of jobPermissions.entries) {
      if (entry.access !== "write")
        continue;
      reportWritePermission(entry.name, entry.access, entry.offset, scope);
    }
  }
  return findings;
}
var tokenAnalyzer = {
  id: "token",
  name: "Token capability analyzer",
  description: "Works out what the GITHUB_TOKEN of each job can do, what a personal access token can do, and reports every write permission it is granted.",
  rules: [...RULES, ...CAPABILITY_RULES],
  analyze: analyzeToken,
  async analyzeRepository(context) {
    if (!context.token && !context.scopes?.length && !context.permissions?.length) {
      return { findings: [], warnings: [] };
    }
    const result = await scanTokenContext(context);
    return {
      findings: result.findings,
      warnings: result.warnings,
      token: {
        type: result.tokenType,
        typeLabel: result.tokenTypeLabel,
        redacted: result.redacted,
        identity: result.identity?.login ?? null,
        scopes: result.scopes,
        permissions: result.permissions,
        scoreKnown: result.scoreKnown
      }
    };
  }
};

// src/analyzers/workflow/rules.ts
var UNTRUSTED_INPUTS = [
  { pattern: /github\.event\.pull_request\.title/, label: "pull request title", severity: "critical" },
  { pattern: /github\.event\.pull_request\.body/, label: "pull request body", severity: "critical" },
  { pattern: /github\.event\.pull_request\.head\.ref/, label: "pull request head branch", severity: "critical" },
  { pattern: /github\.event\.pull_request\.head\.label/, label: "pull request head label", severity: "critical" },
  { pattern: /github\.event\.pull_request\.head\.repo\./, label: "pull request head repository", severity: "high" },
  { pattern: /github\.event\.issue\.title/, label: "issue title", severity: "critical" },
  { pattern: /github\.event\.issue\.body/, label: "issue body", severity: "critical" },
  { pattern: /github\.event\.comment\.body/, label: "comment body", severity: "critical" },
  { pattern: /github\.event\.review\.body/, label: "review body", severity: "critical" },
  { pattern: /github\.event\.review_comment\.body/, label: "review comment body", severity: "critical" },
  { pattern: /github\.event\.discussion\.(title|body)/, label: "discussion text", severity: "critical" },
  { pattern: /github\.event\.pages\..*page_name/, label: "Pages page name", severity: "high" },
  { pattern: /github\.event\.head_commit\.(message|author\.email|author\.name)/, label: "head commit text", severity: "critical" },
  { pattern: /github\.event\.commits\..*\.(message|author\.email|author\.name)/, label: "commit text", severity: "critical" },
  { pattern: /github\.event\.workflow_run\.(head_branch|head_commit\.message)/, label: "triggering workflow text", severity: "critical" },
  { pattern: /github\.head_ref/, label: "head branch name", severity: "critical" },
  { pattern: /github\.event\.inputs\./, label: "workflow input", severity: "medium" }
];
var INDIRECT_INPUTS = [
  { pattern: /steps\.[A-Za-z0-9_-]+\.outputs\./, label: "step output", severity: "medium" },
  { pattern: /needs\.[A-Za-z0-9_-]+\.outputs\./, label: "job output", severity: "medium" },
  { pattern: /matrix\./, label: "matrix value", severity: "medium" },
  { pattern: /inputs\.[A-Za-z0-9_-]+/, label: "workflow input", severity: "medium" },
  { pattern: /github\.event\.workflow_run\./, label: "triggering workflow payload", severity: "high" }
];
var DEPRECATED_ACTIONS = [
  {
    pattern: /^actions\/set-output@v[12]$/,
    severity: "high",
    note: "set-output was removed by GitHub and was also a known command injection vector."
  },
  {
    pattern: /^actions\/save-state@v[12]$/,
    severity: "high",
    note: "save-state was removed by GitHub."
  },
  {
    pattern: /^actions\/(?:upload|download)-artifact@v[123]$/,
    severity: "medium",
    note: "artifact v1 to v3 are shut down; v4 or newer is required."
  },
  {
    pattern: /^actions\/checkout@v[123]$/,
    severity: "medium",
    note: "checkout v1 to v3 run on end-of-life Node versions."
  },
  {
    pattern: /^actions\/cache@v[123]$/,
    severity: "low",
    note: "cache v1 to v3 run on end-of-life Node versions."
  },
  {
    pattern: /^actions\/setup-node@v[123]$/,
    severity: "low",
    note: "setup-node v1 to v3 run on end-of-life Node versions."
  },
  {
    pattern: /^actions\/upload-pages-artifact@v1$/,
    severity: "medium",
    note: "upload-pages-artifact v1 is retired; v2 or newer is required."
  },
  {
    pattern: /^github\/codeql-action@v[12]$/,
    severity: "medium",
    note: "codeql-action v1 and v2 are retired."
  }
];
var DANGEROUS_TRIGGERS = {
  pull_request_target: {
    severity: "high",
    note: "Runs in the base repository context with access to secrets and a writable GITHUB_TOKEN."
  },
  workflow_run: {
    severity: "high",
    note: "Runs after another workflow finished and inherits its secrets and a writable GITHUB_TOKEN."
  },
  issue_comment: {
    severity: "medium",
    note: "Runs in the base repository context with access to secrets when triggered by a comment."
  }
};

// src/analyzers/workflow/index.ts
var SHA_PATTERN = /^[0-9a-f]{40}$/i;
var EXPRESSION_PATTERN = /\$\{\{([^}]*)\}\}/g;
var MAX_INJECTION_FINDINGS_PER_STEP = 3;
var RULES2 = [
  {
    id: "workflow.invalid-yaml",
    title: "Workflow file is not valid YAML",
    severity: "medium",
    description: "The workflow could not be parsed, so none of the workflow checks could run against it.",
    remediation: "Fix the YAML syntax. `actionlint` reports the exact line."
  },
  {
    id: "workflow.script-injection",
    title: "Untrusted input is interpolated into a shell command",
    severity: "critical",
    description: "A `run:` step interpolates attacker-controlled text through `${{ }}`. Anyone who can open a pull request or an issue can run code in this job.",
    remediation: 'Pass the value through an environment variable and quote it: set `env: TITLE: ${{ github.event.pull_request.title }}` and use `"$TITLE"` in the script.'
  },
  {
    id: "workflow.indirect-interpolation",
    title: "A value produced elsewhere is interpolated into a shell command",
    severity: "medium",
    description: "A step output, a matrix value or a workflow input is inserted into a shell command. The value is not attacker-controlled by itself, but if the step that produced it handled attacker data, this is code execution.",
    remediation: 'Pass the value through an environment variable and quote it, for example `env: VALUE: ${{ steps.build.outputs.value }}` and use `"$VALUE"` in the script.'
  },
  {
    id: "workflow.privileged-checkout",
    title: "Privileged trigger checks out attacker-controlled code",
    severity: "critical",
    description: "This workflow runs on a privileged trigger and then checks out code the attacker controls, so that code executes with the job's secrets and token.",
    remediation: "Do not check out the pull request head in a privileged workflow, or drop the job's privileges before checking out."
  },
  {
    id: "workflow.dangerous-trigger",
    title: "Workflow uses a privileged trigger",
    severity: "high",
    description: "This trigger runs the workflow with repository secrets and a writable GITHUB_TOKEN.",
    remediation: "Use `pull_request` for untrusted code, and keep `pull_request_target` for workflows that never check out the pull request head."
  },
  {
    id: "workflow.unpinned-action",
    title: "Action is not pinned to a commit SHA",
    severity: "medium",
    description: "The action is referenced by tag or branch, so the code that runs can change without any commit to this repository.",
    remediation: "Pin the action to a full commit SHA and keep the version in a trailing comment."
  },
  {
    id: "workflow.deprecated-action",
    title: "Action version is retired",
    severity: "medium",
    description: "This action version no longer runs on current GitHub infrastructure.",
    remediation: "Upgrade the action to its current major version."
  },
  {
    id: "workflow.secrets-inherit",
    title: "Reusable workflow inherits every secret",
    severity: "high",
    description: "`secrets: inherit` hands the called workflow every secret of the caller, including the ones it does not need.",
    remediation: "Pass only the secrets the called workflow needs."
  },
  {
    id: "workflow.self-hosted-runner",
    title: "Job runs on a self-hosted runner",
    severity: "medium",
    description: "Self-hosted runners are not ephemeral, so code from a pull request can leave files and processes behind.",
    remediation: "Use GitHub-hosted runners for untrusted workflows, or isolate the runner between jobs."
  },
  {
    id: "workflow.docker-unpinned",
    title: "Container image is not pinned",
    severity: "low",
    description: "The container image can change between runs, so the same workflow can behave differently tomorrow.",
    remediation: "Pin the image to a digest."
  }
];
function isWorkflowPath2(file) {
  const normalized = file.replace(/\\/g, "/");
  return /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized);
}
function collectTriggers(onNode) {
  const triggers = [];
  const single = scalarText(onNode);
  if (single) {
    triggers.push({ name: single, offset: nodeOffset(onNode) ?? 0 });
    return triggers;
  }
  for (const entry of mapEntries(onNode)) {
    triggers.push({ name: entry.key, offset: nodeOffset(entry.keyNode) ?? 0 });
  }
  for (const item of seqItems(onNode)) {
    const text = scalarText(item);
    if (text)
      triggers.push({ name: text, offset: nodeOffset(item) ?? 0 });
  }
  return triggers;
}
function analyzeWorkflow(context) {
  const { content, file } = context;
  const findings = [];
  if (!isWorkflowPath2(file))
    return findings;
  const doc = parseYamlDocument(content);
  if (doc.errors.length > 0) {
    const first = doc.errors[0];
    findings.push({
      id: "workflow.invalid-yaml",
      analyzer: "workflow",
      severity: "medium",
      title: "Workflow file is not valid YAML",
      description: `The workflow could not be parsed, so no workflow check ran against it. ${first?.message ?? ""}`.trim(),
      location: { file, line: 1 },
      remediation: "Fix the YAML syntax. `actionlint` reports the exact line."
    });
    return findings;
  }
  const root = doc.contents;
  const rootEntries = mapEntries(root);
  const onEntry = rootEntries.find((entry) => entry.key === "on");
  const triggers = collectTriggers(onEntry?.value);
  const triggerNames = triggers.map((trigger) => trigger.name);
  for (const trigger of triggers) {
    const info = DANGEROUS_TRIGGERS[trigger.name];
    if (!info)
      continue;
    findings.push({
      id: "workflow.dangerous-trigger",
      analyzer: "workflow",
      severity: info.severity,
      title: `Workflow uses the privileged trigger "${trigger.name}"`,
      description: info.note,
      location: { file, line: lineOfOffset(content, trigger.offset) },
      evidence: `on: ${trigger.name}`,
      remediation: "Use `pull_request` for untrusted code, and keep `pull_request_target` for workflows that never check out the pull request head."
    });
  }
  const privileged = triggerNames.some((name) => name === "pull_request_target" || name === "workflow_run");
  const jobsEntry = rootEntries.find((entry) => entry.key === "jobs");
  const jobEntries = mapEntries(jobsEntry?.value);
  for (const job of jobEntries) {
    const jobMap = mapEntries(job.value);
    const runsOnEntry = jobMap.find((entry) => entry.key === "runs-on");
    const runsOnText = scalarText(runsOnEntry?.value) ?? "";
    const runsOnList = seqItems(runsOnEntry?.value).map((item) => scalarText(item) ?? "");
    const selfHosted = [runsOnText, ...runsOnList].some((value) => value.includes("self-hosted"));
    if (selfHosted) {
      findings.push({
        id: "workflow.self-hosted-runner",
        analyzer: "workflow",
        severity: "medium",
        title: `Job "${job.key}" runs on a self-hosted runner`,
        description: "Self-hosted runners are not ephemeral, so code from a pull request can leave files and processes behind.",
        location: { file, line: lineOfOffset(content, nodeOffset(runsOnEntry?.keyNode) ?? 0) },
        evidence: `runs-on: ${runsOnText || runsOnList.join(", ")}`,
        remediation: "Use GitHub-hosted runners for untrusted workflows, or isolate the runner between jobs."
      });
    }
    const jobUsesEntry = jobMap.find((entry) => entry.key === "uses");
    const secretsEntry = jobMap.find((entry) => entry.key === "secrets");
    if (jobUsesEntry && secretsEntry) {
      const inherits = scalarText(secretsEntry.value) === "inherit" || mapEntries(secretsEntry.value).some((entry) => entry.key === "inherit");
      if (inherits) {
        findings.push({
          id: "workflow.secrets-inherit",
          analyzer: "workflow",
          severity: "high",
          title: `Job "${job.key}" passes every secret to a reusable workflow`,
          description: "`secrets: inherit` hands the called workflow every secret of the caller, including the ones it does not need.",
          location: { file, line: lineOfOffset(content, nodeOffset(secretsEntry.keyNode) ?? 0) },
          evidence: "secrets: inherit",
          remediation: "Pass only the secrets the called workflow needs."
        });
      }
    }
    const stepsEntry = jobMap.find((entry) => entry.key === "steps");
    for (const step of seqItems(stepsEntry?.value)) {
      const stepMap = mapEntries(step);
      const usesEntry = stepMap.find((entry) => entry.key === "uses");
      const runEntry = stepMap.find((entry) => entry.key === "run");
      const withEntry = stepMap.find((entry) => entry.key === "with");
      if (usesEntry) {
        const uses = scalarText(usesEntry.value) ?? "";
        const usesOffset = nodeOffset(usesEntry.value) ?? nodeOffset(usesEntry.keyNode) ?? 0;
        const usesLine = lineOfOffset(content, usesOffset);
        if (uses.startsWith("docker://")) {
          const image = uses.slice("docker://".length);
          const pinned = image.includes("@sha256:");
          if (!pinned) {
            findings.push({
              id: "workflow.docker-unpinned",
              analyzer: "workflow",
              severity: "low",
              title: "Container image is not pinned",
              description: "The container image can change between runs, so the same workflow can behave differently tomorrow.",
              location: { file, line: usesLine },
              evidence: uses,
              remediation: "Pin the image to a digest."
            });
          }
        } else if (!uses.startsWith("./")) {
          const atIndex = uses.lastIndexOf("@");
          const ref = atIndex === -1 ? null : uses.slice(atIndex + 1);
          if (ref === null || !SHA_PATTERN.test(ref)) {
            findings.push({
              id: "workflow.unpinned-action",
              analyzer: "workflow",
              severity: "medium",
              title: "Action is not pinned to a commit SHA",
              description: "The action is referenced by tag or branch, so the code that runs can change without any commit to this repository.",
              location: { file, line: usesLine },
              evidence: uses,
              remediation: "Pin the action to a full commit SHA and keep the version in a trailing comment."
            });
          }
          const deprecated = DEPRECATED_ACTIONS.find((entry) => entry.pattern.test(uses));
          if (deprecated) {
            findings.push({
              id: "workflow.deprecated-action",
              analyzer: "workflow",
              severity: deprecated.severity,
              title: `Action "${uses}" is retired`,
              description: deprecated.note,
              location: { file, line: usesLine },
              evidence: uses,
              remediation: "Upgrade the action to its current major version."
            });
          }
        }
      }
      if (runEntry) {
        const start = nodeOffset(runEntry.value);
        const end = nodeEnd(runEntry.value);
        if (start !== null && end !== null) {
          const slice = content.slice(start, end);
          let reported = 0;
          EXPRESSION_PATTERN.lastIndex = 0;
          let match;
          while ((match = EXPRESSION_PATTERN.exec(slice)) !== null) {
            const expression = match[1] ?? "";
            const absolute = start + match.index;
            const direct = UNTRUSTED_INPUTS.find((input) => input.pattern.test(expression));
            const indirect = direct ? undefined : INDIRECT_INPUTS.find((input) => input.pattern.test(expression));
            const source = direct ?? indirect;
            if (!source)
              continue;
            reported += 1;
            if (reported > MAX_INJECTION_FINDINGS_PER_STEP)
              break;
            const isDirect = direct !== undefined;
            findings.push({
              id: isDirect ? "workflow.script-injection" : "workflow.indirect-interpolation",
              analyzer: "workflow",
              severity: source.severity,
              title: isDirect ? "Untrusted input is interpolated into a shell command" : "A value produced elsewhere is interpolated into a shell command",
              description: isDirect ? `The ${source.label} is attacker-controlled and is inserted into a shell command without quoting.` : `The ${source.label} is inserted into a shell command without quoting. It becomes code execution if the step that produced it handled attacker data.`,
              location: { file, line: lineOfOffset(content, absolute) },
              evidence: "${{ " + expression.trim() + " }}",
              remediation: isDirect ? 'Pass the value through an environment variable and quote it: set `env: TITLE: ${{ github.event.pull_request.title }}` and use `"$TITLE"` in the script.' : 'Pass the value through an environment variable and quote it: set `env: VALUE: ${{ steps.build.outputs.value }}` and use `"$VALUE"` in the script.'
            });
          }
        }
      }
      if (privileged && usesEntry) {
        const uses = scalarText(usesEntry.value) ?? "";
        if (uses.startsWith("actions/checkout")) {
          const refEntry = mapEntries(withEntry?.value).find((entry) => entry.key === "ref");
          const ref = scalarText(refEntry?.value) ?? "";
          const attackerControlled = /github\.event\.pull_request\.head/.test(ref) || /github\.head_ref/.test(ref);
          if (attackerControlled) {
            findings.push({
              id: "workflow.privileged-checkout",
              analyzer: "workflow",
              severity: "critical",
              title: "Privileged trigger checks out attacker-controlled code",
              description: "This workflow runs on a privileged trigger and checks out the pull request head, so attacker code executes with the job's secrets and token.",
              location: {
                file,
                line: lineOfOffset(content, nodeOffset(refEntry?.value) ?? nodeOffset(usesEntry.value) ?? 0)
              },
              evidence: ref,
              remediation: "Do not check out the pull request head in a privileged workflow, or drop the job's privileges before checking out."
            });
          }
        }
      }
    }
  }
  return findings;
}
var workflowAnalyzer = {
  id: "workflow",
  name: "Workflow auditor",
  description: "Audits GitHub Actions workflows for script injection, privileged triggers, unpinned and retired actions, and secret inheritance.",
  rules: RULES2,
  analyze: analyzeWorkflow
};

// src/analyzers/index.ts
var ANALYZER_LIST = [
  tokenAnalyzer,
  workflowAnalyzer,
  secretAnalyzer,
  agentAnalyzer
];
function getAnalyzers(ids) {
  if (!ids || ids.length === 0)
    return ANALYZER_LIST;
  return ANALYZER_LIST.filter((analyzer) => ids.includes(analyzer.id));
}
function isAnalyzerId(value) {
  return ANALYZER_LIST.some((analyzer) => analyzer.id === value);
}

// src/core/types.ts
var SEVERITIES = ["low", "medium", "high", "critical"];

// src/core/severity.ts
var ORDER = ["low", "medium", "high", "critical"];
function severityRank(severity) {
  return ORDER.indexOf(severity);
}
function severityAtLeast(value, threshold) {
  return severityRank(value) >= severityRank(threshold);
}
function highestSeverity(findings) {
  let highest = null;
  for (const finding of findings) {
    if (highest === null || severityRank(finding.severity) > severityRank(highest)) {
      highest = finding.severity;
    }
  }
  return highest;
}
function emptySummary() {
  const bySeverity = {};
  for (const severity of SEVERITIES)
    bySeverity[severity] = 0;
  return {
    token: { total: 0, bySeverity: { ...bySeverity } },
    workflow: { total: 0, bySeverity: { ...bySeverity } },
    secret: { total: 0, bySeverity: { ...bySeverity } },
    agent: { total: 0, bySeverity: { ...bySeverity } }
  };
}

// src/core/score.ts
var SEVERITY_WEIGHTS = {
  critical: 50,
  high: 20,
  medium: 8,
  low: 2
};
var SEVERITY_FLOORS = {
  critical: 70,
  high: 45,
  medium: 20,
  low: 0
};
var LEVEL_THRESHOLDS = [
  { minimum: 70, level: "critical" },
  { minimum: 45, level: "high" },
  { minimum: 20, level: "medium" },
  { minimum: 0, level: "low" }
];
function scoreLevel(value) {
  return LEVEL_THRESHOLDS.find((threshold) => value >= threshold.minimum)?.level ?? "low";
}
function collapseByRule(findings) {
  const grouped = new Map;
  for (const finding of findings) {
    const bucket = grouped.get(finding.id);
    if (bucket) {
      bucket.push(finding);
    } else {
      grouped.set(finding.id, [finding]);
    }
  }
  return grouped;
}
function evaluateFindings(findings) {
  const grouped = collapseByRule(findings);
  const breakdown = [];
  for (const [id, bucket] of grouped) {
    const first = bucket[0];
    if (!first)
      continue;
    const severity = bucket.reduce((acc, item) => severityRankOf(item.severity) > severityRankOf(acc) ? item.severity : acc, "low");
    breakdown.push({
      id,
      analyzer: first.analyzer,
      title: first.title,
      severity,
      weight: SEVERITY_WEIGHTS[severity],
      count: bucket.length
    });
  }
  breakdown.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
  const rawValue = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const highest = highestSeverity(findings);
  const floor = highest ? SEVERITY_FLOORS[highest] : 0;
  const value = Math.min(100, Math.max(rawValue, floor));
  const floorApplied = floor > rawValue;
  return {
    value,
    rawValue,
    level: scoreLevel(value),
    highestSeverity: highest,
    floorApplied,
    breakdown
  };
}
function severityRankOf(severity) {
  return ["low", "medium", "high", "critical"].indexOf(severity);
}

// src/core/suppression.ts
var MARKER = "(?:#|//|/\\*|--)";
var RULE_IDS = "([A-Za-z0-9_.\\-]+(?:\\s*,\\s*[A-Za-z0-9_.\\-]+)*)";
var LINE_RULE_PATTERN = new RegExp(`${MARKER}\\s*ghcheck:\\s*ignore\\s+${RULE_IDS}`, "g");
var LINE_ALL_PATTERN = new RegExp(`${MARKER}\\s*ghcheck:\\s*ignore-all\\b`, "g");
var FILE_ALL_PATTERN = new RegExp(`${MARKER}\\s*ghcheck:\\s*ignore-file\\b`, "g");
function collectSuppressions(content) {
  const lineRules = new Map;
  const lineAll = new Set;
  let fileAll = false;
  const lines = content.split(/\r?\n/);
  for (let index = 0;index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const lineNumber = index + 1;
    if (FILE_ALL_PATTERN.test(line)) {
      fileAll = true;
      FILE_ALL_PATTERN.lastIndex = 0;
      continue;
    }
    FILE_ALL_PATTERN.lastIndex = 0;
    if (LINE_ALL_PATTERN.test(line)) {
      lineAll.add(lineNumber);
      LINE_ALL_PATTERN.lastIndex = 0;
    } else {
      LINE_ALL_PATTERN.lastIndex = 0;
    }
    LINE_RULE_PATTERN.lastIndex = 0;
    let match;
    while ((match = LINE_RULE_PATTERN.exec(line)) !== null) {
      const raw = match[1] ?? "";
      const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
      const bucket = lineRules.get(lineNumber) ?? new Set;
      for (const id of ids)
        bucket.add(id);
      lineRules.set(lineNumber, bucket);
    }
  }
  return { lineRules, lineAll, fileAll };
}
function isSuppressed(suppression, ruleId, line) {
  if (suppression.fileAll)
    return true;
  if (line === undefined)
    return false;
  if (suppression.lineAll.has(line))
    return true;
  return suppression.lineRules.get(line)?.has(ruleId) ?? false;
}

// src/engine/home.ts
var import_promises = require("node:fs/promises");
var import_node_os = require("node:os");
var import_node_path = require("node:path");
function candidates() {
  const home = import_node_os.homedir();
  const list = [
    { absolute: import_node_path.join(home, ".claude.json"), relativePath: "~/.claude.json" },
    { absolute: import_node_path.join(home, ".cursor", "mcp.json"), relativePath: "~/.cursor/mcp.json" },
    { absolute: import_node_path.join(home, ".codeium", "mcp.json"), relativePath: "~/.codeium/mcp.json" },
    {
      absolute: import_node_path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
      relativePath: "~/Library/Application Support/Claude/claude_desktop_config.json"
    },
    {
      absolute: import_node_path.join(home, ".config", "Claude", "claude_desktop_config.json"),
      relativePath: "~/.config/Claude/claude_desktop_config.json"
    }
  ];
  const appData = process.env.APPDATA;
  if (appData) {
    list.push({
      absolute: import_node_path.join(appData, "Claude", "claude_desktop_config.json"),
      relativePath: "%APPDATA%/Claude/claude_desktop_config.json"
    });
  }
  return list;
}
var MAX_FILE_SIZE = 2 * 1024 * 1024;
async function collectAgentHomeFiles() {
  const files = [];
  for (const candidate of candidates()) {
    try {
      const info = await import_promises.stat(candidate.absolute);
      if (!info.isFile() || info.size > MAX_FILE_SIZE)
        continue;
      const content = await import_promises.readFile(candidate.absolute, "utf8");
      files.push({ relativePath: candidate.relativePath, content, bytes: info.size });
    } catch {
      continue;
    }
  }
  return files;
}

// src/engine/walk.ts
var import_promises2 = require("node:fs/promises");
var import_node_path2 = require("node:path");

// src/engine/gitignore.ts
function escapeRegex(value) {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}
function patternToRegex(pattern) {
  const directoryOnly = pattern.endsWith("/");
  let source = pattern.replace(/\/$/, "");
  const anchored = source.startsWith("/") || source.includes("/");
  source = source.replace(/^\//, "");
  let regex = "";
  for (let index = 0;index < source.length; index += 1) {
    const char = source[index];
    if (char === "*") {
      if (source[index + 1] === "*") {
        index += 1;
        if (source[index + 1] === "/") {
          index += 1;
          regex += "(?:.*/)?";
        } else {
          regex += ".*";
        }
      } else {
        regex += "[^/]*";
      }
      continue;
    }
    if (char === "?") {
      regex += "[^/]";
      continue;
    }
    regex += escapeRegex(char ?? "");
  }
  const prefix = anchored ? "^" : "(?:^|.*/)";
  return {
    regex: new RegExp(`${prefix}${regex}(?:/.*)?$`),
    directoryOnly
  };
}
function parseGitignore(content) {
  const rules = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#"))
      continue;
    const negated = line.startsWith("!");
    const pattern = negated ? line.slice(1).trim() : line;
    if (!pattern)
      continue;
    const { regex, directoryOnly } = patternToRegex(pattern);
    rules.push({ pattern: regex, negated, directoryOnly });
  }
  return rules;
}
function isIgnored(rules, relativePath) {
  if (rules.length === 0)
    return false;
  let ignored = false;
  for (const rule of rules) {
    if (rule.pattern.test(relativePath)) {
      ignored = !rule.negated;
    }
  }
  return ignored;
}

// src/engine/walk.ts
var EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  "vendor",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  ".idea",
  ".vscode",
  ".cache",
  ".bun-cache",
  ".gradle",
  ".terraform",
  "site-packages"
]);
var EXCLUDED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".bmp",
  ".tiff",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".tgz",
  ".7z",
  ".rar",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".mp3",
  ".mp4",
  ".mov",
  ".avi",
  ".webm",
  ".wav",
  ".bin",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".class",
  ".jar",
  ".wasm",
  ".sqlite",
  ".sqlite3",
  ".db",
  ".pyc",
  ".pyd",
  ".o",
  ".a"
]);
var EXCLUDED_FILENAMES = new Set(["bun.lockb", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
var EXCLUDED_DIRECTORY_ALLOWLIST = {
  ".vscode": ["mcp.json"],
  ".cursor": ["mcp.json"]
};
var DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024;
function toPosix(value) {
  return value.split(import_node_path2.sep).join("/");
}
function isExcluded(relativePath, excludes) {
  const lowered = relativePath.toLowerCase();
  return excludes.some((exclude) => lowered.includes(exclude.toLowerCase()));
}
function looksBinary(buffer) {
  const limit = Math.min(buffer.length, 8000);
  for (let index = 0;index < limit; index += 1) {
    if (buffer[index] === 0)
      return true;
  }
  return false;
}
async function collectFiles(options) {
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const files = [];
  const warnings = [];
  let skipped = 0;
  const rootStat = await import_promises2.stat(options.root);
  if (!rootStat.isDirectory()) {
    throw new Error(`Scan path is not a directory: ${options.root}`);
  }
  let gitignoreRules = [];
  if (options.respectGitignore !== false) {
    try {
      gitignoreRules = parseGitignore(await import_promises2.readFile(import_node_path2.join(options.root, ".gitignore"), "utf8"));
    } catch {
      gitignoreRules = [];
    }
  }
  async function walk(directory, allowedFiles) {
    const entries = await import_promises2.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = import_node_path2.join(directory, entry.name);
      const relativePath = toPosix(import_node_path2.relative(options.root, absolute));
      if (entry.isSymbolicLink()) {
        skipped += 1;
        continue;
      }
      if (entry.isDirectory()) {
        if (allowedFiles)
          continue;
        if (EXCLUDED_DIRECTORIES.has(entry.name)) {
          const allowed = EXCLUDED_DIRECTORY_ALLOWLIST[entry.name];
          if (!allowed)
            continue;
          await walk(absolute, new Set(allowed));
          continue;
        }
        if (isExcluded(relativePath, options.excludes))
          continue;
        if (isIgnored(gitignoreRules, relativePath)) {
          skipped += 1;
          continue;
        }
        await walk(absolute);
        continue;
      }
      if (!entry.isFile())
        continue;
      if (allowedFiles && !allowedFiles.has(entry.name))
        continue;
      const extension = entry.name.includes(".") ? `.${entry.name.slice(entry.name.lastIndexOf(".") + 1).toLowerCase()}` : "";
      if (EXCLUDED_EXTENSIONS.has(extension) || EXCLUDED_FILENAMES.has(entry.name)) {
        skipped += 1;
        continue;
      }
      if (isExcluded(relativePath, options.excludes)) {
        skipped += 1;
        continue;
      }
      if (isIgnored(gitignoreRules, relativePath)) {
        skipped += 1;
        continue;
      }
      const fileStat = await import_promises2.stat(absolute);
      if (fileStat.size > maxFileSize) {
        skipped += 1;
        continue;
      }
      const buffer = await import_promises2.readFile(absolute);
      if (looksBinary(buffer)) {
        skipped += 1;
        continue;
      }
      files.push({
        relativePath,
        content: buffer.toString("utf8"),
        bytes: fileStat.size
      });
    }
  }
  await walk(options.root);
  return { files, skipped, warnings };
}

// src/engine/run.ts
function findingKey(finding) {
  const location = finding.location;
  return `${finding.id}\x00${location?.file ?? ""}\x00${location?.line ?? 0}`;
}
async function runScan(options) {
  const startedAt = Date.now();
  const warnings = [];
  const globallyIgnored = new Set(options.ignore ?? []);
  const analyzers = getAnalyzers(options.analyzers);
  const walk = options.filesOnly ? { files: [], skipped: 0, warnings: [] } : await collectFiles({
    root: options.root,
    excludes: [...options.excludes ?? []],
    maxFileSize: options.maxFileSize
  });
  warnings.push(...walk.warnings);
  const externalFiles = options.agentHome ? await collectAgentHomeFiles() : [];
  const findings = [];
  const seen = new Set;
  let bytesScanned = 0;
  let tokenInfo = null;
  for (const analyzer of analyzers) {
    if (!analyzer.analyzeRepository)
      continue;
    const result = await analyzer.analyzeRepository({
      token: options.token,
      tokenType: options.tokenType,
      scopes: options.scopes ? [...options.scopes] : undefined,
      permissions: options.permissions ? [...options.permissions] : undefined,
      login: options.login
    });
    warnings.push(...result.warnings);
    if (result.token)
      tokenInfo = result.token;
    for (const finding of result.findings) {
      if (globallyIgnored.has(finding.id))
        continue;
      const key = findingKey(finding);
      if (seen.has(key))
        continue;
      seen.add(key);
      findings.push({
        ...finding,
        evidence: finding.evidence ? redactSecrets(finding.evidence) : undefined
      });
    }
  }
  function collect(produced, suppression) {
    for (const finding of produced) {
      if (globallyIgnored.has(finding.id))
        continue;
      if (isSuppressed(suppression, finding.id, finding.location?.line))
        continue;
      const enriched = {
        ...finding,
        evidence: finding.evidence ? redactSecrets(finding.evidence) : undefined
      };
      const key = findingKey(enriched);
      if (seen.has(key))
        continue;
      seen.add(key);
      findings.push(enriched);
    }
  }
  for (const file of walk.files) {
    bytesScanned += file.bytes;
    const suppression = collectSuppressions(file.content);
    for (const analyzer of analyzers) {
      const produced = await analyzer.analyze({ file: file.relativePath, content: file.content });
      collect(produced, suppression);
    }
  }
  for (const file of externalFiles) {
    bytesScanned += file.bytes;
    const suppression = collectSuppressions(file.content);
    for (const analyzer of analyzers) {
      if (!analyzer.acceptsExternalFiles)
        continue;
      const produced = await analyzer.analyze({ file: file.relativePath, content: file.content });
      collect(produced, suppression);
    }
  }
  findings.sort((a, b) => (a.location?.file ?? "").localeCompare(b.location?.file ?? "") || (a.location?.line ?? 0) - (b.location?.line ?? 0) || a.id.localeCompare(b.id));
  const summary = emptySummary();
  for (const finding of findings) {
    const bucket = summary[finding.analyzer];
    bucket.total += 1;
    bucket.bySeverity[finding.severity] += 1;
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tool: { name: "ghcheck", version: package_default.version },
    findings,
    score: evaluateFindings(findings),
    summary,
    stats: {
      filesScanned: walk.files.length + externalFiles.length,
      bytesScanned,
      durationMs: Date.now() - startedAt,
      skippedFiles: walk.skipped
    },
    warnings,
    token: tokenInfo
  };
}

// src/report/json.ts
function renderJson(report) {
  return JSON.stringify(report, null, 2);
}

// src/report/markdown.ts
function cell(value) {
  return String(value ?? "—").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function renderMarkdown(report) {
  const lines = [];
  lines.push("# ghcheck report");
  lines.push("");
  lines.push(`Generated by [ghcheck](https://github.com/momomo12312hgfv/ghcheck) v${package_default.version} at ${report.generatedAt}.`);
  lines.push("");
  lines.push("## Blast radius");
  lines.push("");
  lines.push(`**${report.score.level.toUpperCase()}** — ${report.score.value}/100`);
  if (report.score.rawValue !== report.score.value) {
    lines.push("");
    lines.push(`Raw weighted score: ${report.score.rawValue}. The score was raised to the minimum floor for the highest severity found.`);
  }
  lines.push("");
  if (report.token) {
    lines.push("## Token");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("| --- | --- |");
    lines.push(`| Identity | ${cell(report.token.identity ?? "—")} |`);
    lines.push(`| Token | \`${cell(report.token.redacted)}\` (${cell(report.token.typeLabel)}) |`);
    lines.push(`| Scopes | ${report.token.scopes.length > 0 ? report.token.scopes.map((scope) => `\`${scope}\``).join(", ") : "none"} |`);
    if (report.token.permissions.length > 0) {
      lines.push(`| Permissions (self-reported) | ${report.token.permissions.map((permission) => `\`${permission.permission}=${permission.access}\``).join(", ")} |`);
    }
    lines.push("");
  }
  lines.push("## Summary");
  lines.push("");
  lines.push("| Analyzer | Findings | Critical | High | Medium | Low |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const [analyzer, bucket] of Object.entries(report.summary)) {
    lines.push(`| ${cell(analyzer)} | ${bucket.total} | ${bucket.bySeverity.critical} | ${bucket.bySeverity.high} | ${bucket.bySeverity.medium} | ${bucket.bySeverity.low} |`);
  }
  lines.push("");
  if (report.findings.length > 0) {
    lines.push("## Findings");
    lines.push("");
    lines.push("| Severity | Rule | Location | Finding |");
    lines.push("| --- | --- | --- | --- |");
    for (const finding of report.findings) {
      const location = finding.location ? `\`${cell(finding.location.file)}:${finding.location.line}\`` : "—";
      lines.push(`| ${finding.severity} | \`${cell(finding.id)}\` | ${location} | ${cell(finding.title)} |`);
    }
    lines.push("");
    lines.push("## Details");
    lines.push("");
    for (const finding of report.findings) {
      const location = finding.location ? `\`${cell(finding.location.file)}:${finding.location.line}\`` : "—";
      lines.push(`### ${finding.title}`);
      lines.push("");
      lines.push(`- **Rule**: \`${finding.id}\``);
      lines.push(`- **Severity**: ${finding.severity}`);
      if (finding.confidence)
        lines.push(`- **Confidence**: ${finding.confidence}`);
      lines.push(`- **Location**: ${location}`);
      if (finding.evidence)
        lines.push(`- **Evidence**: \`${cell(finding.evidence)}\``);
      if (finding.grantedBy?.length) {
        lines.push(`- **Granted by**: ${finding.grantedBy.map((item) => `\`${cell(item)}\``).join(", ")}`);
      }
      lines.push("");
      lines.push(finding.description);
      lines.push("");
      lines.push(`**Fix**: ${finding.remediation}`);
      lines.push("");
    }
  } else {
    lines.push("## Findings");
    lines.push("");
    lines.push("No findings. The known rule sets did not match this repository.");
    lines.push("");
  }
  if (report.warnings.length > 0) {
    lines.push("## Warnings");
    lines.push("");
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push(`Scanned ${report.stats.filesScanned} files (${report.stats.bytesScanned} bytes) in ${report.stats.durationMs}ms. Local-only scan: no network requests were made and no file was modified.`);
  lines.push("");
  return lines.join(`
`);
}

// src/report/sarif.ts
var DOCS_URL = "https://github.com/momomo12312hgfv/ghcheck/blob/main/docs/rules.md";
function sarifLevel(severity) {
  if (severity === "critical" || severity === "high")
    return "error";
  if (severity === "medium")
    return "warning";
  return "note";
}
function ruleMetadata(id) {
  for (const analyzer of ANALYZER_LIST) {
    const rule = analyzer.rules.find((candidate) => candidate.id === id);
    if (rule) {
      return {
        title: rule.title,
        description: rule.description,
        remediation: rule.remediation,
        confidence: rule.confidence
      };
    }
  }
  return {
    title: id,
    description: id,
    remediation: "See the documentation for this rule."
  };
}
function buildRules(report) {
  const ids = [...new Set(report.findings.map((finding) => finding.id))].sort();
  return ids.map((id) => {
    const meta = ruleMetadata(id);
    const worst = report.findings.filter((finding) => finding.id === id).reduce((acc, finding) => ["low", "medium", "high", "critical"].indexOf(finding.severity) > ["low", "medium", "high", "critical"].indexOf(acc) ? finding.severity : acc, "low");
    return {
      id: `ghcheck/${id}`,
      name: id.replace(/[^A-Za-z0-9]+/g, ""),
      shortDescription: { text: meta.title },
      fullDescription: { text: meta.description },
      help: { text: meta.remediation },
      helpUri: DOCS_URL,
      properties: {
        tags: ["security", "github", id.split(".")[0] ?? "ghcheck"],
        severity: worst,
        ...meta.confidence ? { confidence: meta.confidence } : {}
      }
    };
  });
}
function buildResult(finding, index) {
  const location = finding.location;
  const messageParts = [finding.title, finding.description];
  if (finding.evidence)
    messageParts.push(`Evidence: ${finding.evidence}`);
  if (finding.grantedBy?.length)
    messageParts.push(`Granted by: ${finding.grantedBy.join(", ")}`);
  return {
    ruleId: `ghcheck/${finding.id}`,
    level: sarifLevel(finding.severity),
    message: { text: messageParts.join(" ") },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: (location?.file ?? "repository").replace(/\\/g, "/") },
          region: { startLine: location?.line ?? 1, startColumn: location?.column ?? 1 }
        },
        logicalLocations: [
          {
            name: finding.analyzer,
            fullyQualifiedName: `ghcheck.${finding.id}`,
            kind: "rule"
          }
        ]
      }
    ],
    partialFingerprints: { "ghcheck/v1": `${finding.id}:${index}` },
    properties: {
      severity: finding.severity,
      analyzer: finding.analyzer,
      ...finding.confidence ? { confidence: finding.confidence } : {},
      ...finding.grantedBy?.length ? { grantedBy: finding.grantedBy } : {}
    }
  };
}
function renderSarif(report, options = {}) {
  const properties = {
    score: report.score.value,
    level: report.score.level,
    filesScanned: report.stats.filesScanned
  };
  if (options.locationUri) {
    properties.markdownReport = options.locationUri.replace(/\\/g, "/");
  }
  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "ghcheck",
            informationUri: "https://github.com/momomo12312hgfv/ghcheck",
            version: package_default.version,
            rules: buildRules(report)
          }
        },
        invocations: [
          {
            executionSuccessful: true,
            startTimeUtc: report.generatedAt,
            toolExecutionNotifications: report.warnings.map((warning) => ({
              level: "note",
              message: { text: warning }
            }))
          }
        ],
        properties,
        results: report.findings.map((finding, index) => buildResult(finding, index))
      }
    ]
  };
  return JSON.stringify(sarif, null, 2);
}

// src/report/terminal.ts
var import_picocolors = __toESM(require_picocolors(), 1);
var ANALYZER_LABELS = {
  token: "token",
  workflow: "workflow",
  secret: "secret",
  agent: "agent"
};
function severityColor(colors, severity, text) {
  switch (severity) {
    case "critical":
      return colors.red(colors.bold(text));
    case "high":
      return colors.magenta(text);
    case "medium":
      return colors.yellow(text);
    case "low":
      return colors.blue(text);
  }
}
function severityLabel(severity) {
  return severity.toUpperCase();
}
function truncate(value, length) {
  if (value.length <= length)
    return value;
  return `${value.slice(0, Math.max(0, length - 3))}...`;
}
var SEVERITY_ORDER = ["low", "medium", "high", "critical"];
function bySeverity(a, b) {
  return SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity);
}
function scoreBar(value) {
  const filled = Math.max(0, Math.min(20, Math.round(value / 5)));
  return `${"█".repeat(filled)}${"░".repeat(20 - filled)}`;
}
function countBySeverity(report) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of report.findings)
    counts[finding.severity] += 1;
  const parts = [];
  if (counts.critical > 0)
    parts.push(`${counts.critical} critical`);
  if (counts.high > 0)
    parts.push(`${counts.high} high`);
  if (counts.medium > 0)
    parts.push(`${counts.medium} medium`);
  if (counts.low > 0)
    parts.push(`${counts.low} low`);
  return parts.length > 0 ? parts.join(", ") : "none";
}
function locationOf(finding) {
  const location = finding.location;
  if (!location)
    return "";
  return `${location.file}:${location.line}`;
}
function renderTerminal(report, color) {
  const c = import_picocolors.default.createColors(color);
  const lines = [];
  const label = (value) => c.dim(value.padEnd(10));
  lines.push(`${c.bold("ghcheck")} ${package_default.version}`);
  if (report.token) {
    const token = report.token;
    lines.push(`${label("identity")} ${token.identity ?? "(unavailable)"}`);
    lines.push(`${label("token")} ${token.redacted} ${c.dim(`(${token.typeLabel})`)}`);
    lines.push(`${label("scopes")} ${token.scopes.length > 0 ? token.scopes.join(", ") : "none"}`);
    if (token.permissions.length > 0) {
      lines.push(`${label("permissions")} ${token.permissions.length} ${c.dim("(self-reported)")}`);
    }
  }
  lines.push(`${label("findings")} ${report.findings.length} ${c.dim(`(${countBySeverity(report)})`)}`);
  lines.push(`${label("files")} ${report.stats.filesScanned} scanned${report.stats.skippedFiles > 0 ? c.dim(`, ${report.stats.skippedFiles} skipped`) : ""}`);
  lines.push(`${label("took")} ${report.stats.durationMs}ms`);
  lines.push("");
  if (report.findings.length === 0) {
    lines.push(c.green("No findings. The known rule sets did not match this repository."));
  } else {
    const level = severityLabel(report.score.level);
    const badge = severityColor(c, report.score.level, level.padEnd(8));
    const raw = report.score.rawValue !== report.score.value ? c.dim(` (raw ${report.score.rawValue})`) : "";
    lines.push(`${c.bold("Blast radius")}  ${badge} ${scoreBar(report.score.value)} ${report.score.value}/100${raw}`);
  }
  if (report.findings.length > 0) {
    lines.push("");
    lines.push(c.bold("Top risks"));
    const top = [...report.findings].sort(bySeverity).slice(0, 5);
    for (const finding of top) {
      lines.push(`  ${severityColor(c, finding.severity, "!")} ${c.bold(finding.title)} ${c.dim(`[${finding.id}]`)}`);
      const where = locationOf(finding);
      if (where) {
        lines.push(`    ${c.dim(where)}`);
      } else if (finding.grantedBy?.length) {
        lines.push(`    ${c.dim("granted by")} ${finding.grantedBy.join(", ")}`);
      }
      lines.push(`    ${c.dim(truncate(finding.description, 110))}`);
      if (finding.evidence) {
        lines.push(`    ${c.dim("evidence")} ${c.dim(finding.evidence)}`);
      }
      if (finding.confidence === "likely") {
        lines.push(`    ${c.dim("confidence")} ${c.dim("likely")}`);
      }
      lines.push(`    ${c.dim("fix")} ${c.dim(truncate(finding.remediation, 110))}`);
    }
    lines.push("");
    lines.push(c.bold("Findings"));
    lines.push(`  ${c.dim("SEVERITY".padEnd(9))}${c.dim("RULE".padEnd(38))}${c.dim("LOCATION")}`);
    for (const finding of report.findings) {
      const rule = truncate(finding.id, finding.confidence === "likely" ? 35 : 37);
      const marker = finding.confidence === "likely" ? " *" : "";
      lines.push(`  ${severityColor(c, finding.severity, severityLabel(finding.severity).padEnd(9))}${(rule + marker).padEnd(38)}${locationOf(finding)}`);
    }
    if (report.findings.some((finding) => finding.confidence === "likely")) {
      lines.push("");
      lines.push(c.dim("  * the pattern is suspicious; the runtime behaviour is out of scope"));
    }
    lines.push("");
    lines.push(c.bold("By analyzer"));
    for (const [analyzer, bucket] of Object.entries(report.summary)) {
      const label2 = ANALYZER_LABELS[analyzer];
      const parts = [];
      for (const severity of ["critical", "high", "medium", "low"]) {
        const count = bucket.bySeverity[severity];
        if (count > 0)
          parts.push(`${count} ${severity}`);
      }
      lines.push(`  ${c.dim(label2.padEnd(10))} ${String(bucket.total).padEnd(4)} ${c.dim(parts.join(", ") || "none")}`);
    }
  }
  if (report.warnings.length > 0) {
    lines.push("");
    lines.push(c.bold("Warnings"));
    for (const warning of report.warnings) {
      lines.push(`  ${c.yellow("!")} ${warning}`);
    }
  }
  lines.push("");
  lines.push(c.dim("Local-only scan. No network requests were made and no file was modified."));
  return lines.join(`
`);
}

// src/report/index.ts
function renderReport(report, format, color, options = {}) {
  switch (format) {
    case "terminal":
      return renderTerminal(report, color);
    case "markdown":
      return renderMarkdown(report);
    case "json":
      return renderJson(report);
    case "sarif":
      return renderSarif(report, { locationUri: options.sarifLocation });
    default:
      throw new Error(`Unsupported report format: ${String(format)}`);
  }
}
function isReportFormat(value) {
  return value === "terminal" || value === "markdown" || value === "json" || value === "sarif";
}

// src/action.ts
function input(name, fallback = "") {
  return (process.env[`INPUT_${name.toUpperCase()}`] ?? fallback).trim();
}
function parseSeverity(raw) {
  const value = raw.trim().toLowerCase();
  if (!SEVERITIES.includes(value)) {
    throw new Error(`Invalid fail-on value "${raw}". Expected one of: ${SEVERITIES.join(", ")}.`);
  }
  return value;
}
function parseActionFormat(raw) {
  const value = raw.trim().toLowerCase();
  if (!isReportFormat(value) || value === "terminal") {
    throw new Error(`Invalid format "${raw}". Expected markdown, json or sarif.`);
  }
  return value;
}
function splitList(raw) {
  return raw.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean);
}
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile)
    return;
  import_node_fs.appendFileSync(outputFile, `${name}=${value}
`, "utf8");
}
async function appendSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile)
    return;
  await import_promises3.appendFile(summaryFile, `${markdown}
`, "utf8");
}
async function runAction(options = {}) {
  const path = input("path", ".");
  const failOn = parseSeverity(input("fail-on", "high"));
  const format = parseActionFormat(input("format", "markdown"));
  const outputFile = input("output-file") || (format === "sarif" ? "ghcheck-report.sarif" : "ghcheck-report.md");
  const analyzers = [];
  for (const id of splitList(input("analyzer"))) {
    if (!isAnalyzerId(id)) {
      throw new Error(`Unknown analyzer "${id}". Expected one of: token, workflow, secret, agent.`);
    }
    analyzers.push(id);
  }
  try {
    const report = await runScan({
      root: path,
      analyzers: analyzers.length > 0 ? analyzers : undefined,
      excludes: splitList(input("exclude")),
      ignore: splitList(input("ignore"))
    });
    const markdown = renderReport(report, "markdown", false);
    let output;
    if (format === "sarif") {
      const markdownPath = /\.sarif$/i.test(outputFile) ? outputFile.replace(/\.sarif$/i, ".md") : `${outputFile}.md`;
      await import_promises3.writeFile(markdownPath, `${markdown}
`, "utf8");
      output = renderReport(report, "sarif", false, { sarifLocation: markdownPath });
    } else {
      output = renderReport(report, format, false);
    }
    await import_promises3.writeFile(outputFile, `${output}
`, "utf8");
    await appendSummary(markdown);
    if (!options.silent) {
      process.stdout.write(`${markdown}
`);
    }
    setOutput("score", String(report.score.value));
    setOutput("level", report.score.level);
    setOutput("report", outputFile);
    setOutput("findings", String(report.findings.length));
    if (severityAtLeast(report.score.level, failOn)) {
      if (!options.silent) {
        process.stderr.write(`ghcheck: highest severity ${report.score.level} meets or exceeds fail-on=${failOn}
`);
      }
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redactSecrets(message));
  }
}

// src/action-entry.ts
runAction().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`ghcheck: ${message}
`);
  process.exitCode = 1;
});
