if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  /*!
    * @intlify/shared v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  var _a;
  const inBrowser = typeof window !== "undefined";
  let mark;
  let measure;
  {
    const perf2 = inBrowser && window.performance;
    if (perf2 && perf2.mark && perf2.measure && perf2.clearMarks && perf2.clearMeasures) {
      mark = (tag) => perf2.mark(tag);
      measure = (name, startTag, endTag) => {
        perf2.measure(name, startTag, endTag);
        perf2.clearMarks(startTag);
        perf2.clearMarks(endTag);
      };
    }
  }
  const RE_ARGS = /\{([0-9a-zA-Z]+)\}/g;
  function format(message, ...args) {
    if (args.length === 1 && isObject$1(args[0])) {
      args = args[0];
    }
    if (!args || !args.hasOwnProperty) {
      args = {};
    }
    return message.replace(RE_ARGS, (match, identifier) => {
      return args.hasOwnProperty(identifier) ? args[identifier] : "";
    });
  }
  const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
  const makeSymbol = (name) => hasSymbol ? Symbol(name) : name;
  const generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({ l: locale, k: key, s: source });
  const friendlyJSONstringify = (json) => JSON.stringify(json).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\u0027/g, "\\u0027");
  const isNumber = (val) => typeof val === "number" && isFinite(val);
  const isDate = (val) => toTypeString(val) === "[object Date]";
  const isRegExp = (val) => toTypeString(val) === "[object RegExp]";
  const isEmptyObject = (val) => isPlainObject$1(val) && Object.keys(val).length === 0;
  function warn(msg, err) {
    if (typeof console !== "undefined") {
      console.warn(`[intlify] ` + msg);
      if (err) {
        console.warn(err.stack);
      }
    }
  }
  const assign$2 = Object.assign;
  let _globalThis;
  const getGlobalThis = () => {
    return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
  };
  function escapeHtml(rawText) {
    return rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  function hasOwn$1(obj, key) {
    return hasOwnProperty$1.call(obj, key);
  }
  const isArray = Array.isArray;
  const isFunction = (val) => typeof val === "function";
  const isString = (val) => typeof val === "string";
  const isBoolean = (val) => typeof val === "boolean";
  const isObject$1 = (val) => (
    // eslint-disable-line
    val !== null && typeof val === "object"
  );
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const isPlainObject$1 = (val) => toTypeString(val) === "[object Object]";
  const toDisplayString = (val) => {
    return val == null ? "" : isArray(val) || isPlainObject$1(val) && val.toString === objectToString ? JSON.stringify(val, null, 2) : String(val);
  };
  const RANGE = 2;
  function generateCodeFrame(source, start = 0, end = source.length) {
    const lines = source.split(/\r?\n/);
    let count = 0;
    const res = [];
    for (let i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count >= start) {
        for (let j = i - RANGE; j <= i + RANGE || end > count; j++) {
          if (j < 0 || j >= lines.length)
            continue;
          const line = j + 1;
          res.push(`${line}${" ".repeat(3 - String(line).length)}|  ${lines[j]}`);
          const lineLength = lines[j].length;
          if (j === i) {
            const pad = start - (count - lineLength) + 1;
            const length = Math.max(1, end > count ? lineLength - pad : end - start);
            res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
          } else if (j > i) {
            if (end > count) {
              const length = Math.max(Math.min(end - count, lineLength), 1);
              res.push(`   |  ` + "^".repeat(length));
            }
            count += lineLength + 1;
          }
        }
        break;
      }
    }
    return res.join("\n");
  }
  function createEmitter() {
    const events = /* @__PURE__ */ new Map();
    const emitter = {
      events,
      on(event, handler) {
        const handlers = events.get(event);
        const added = handlers && handlers.push(handler);
        if (!added) {
          events.set(event, [handler]);
        }
      },
      off(event, handler) {
        const handlers = events.get(event);
        if (handlers) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        }
      },
      emit(event, payload) {
        (events.get(event) || []).slice().map((handler) => handler(payload));
        (events.get("*") || []).slice().map((handler) => handler(event, payload));
      }
    };
    return emitter;
  }
  /*!
    * @intlify/message-resolver v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
  }
  const isObject = (val) => (
    // eslint-disable-line
    val !== null && typeof val === "object"
  );
  const pathStateMachine = [];
  pathStateMachine[
    0
    /* BEFORE_PATH */
  ] = {
    [
      "w"
      /* WORKSPACE */
    ]: [
      0
      /* BEFORE_PATH */
    ],
    [
      "i"
      /* IDENT */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4
      /* IN_SUB_PATH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: [
      7
      /* AFTER_PATH */
    ]
  };
  pathStateMachine[
    1
    /* IN_PATH */
  ] = {
    [
      "w"
      /* WORKSPACE */
    ]: [
      1
      /* IN_PATH */
    ],
    [
      "."
      /* DOT */
    ]: [
      2
      /* BEFORE_IDENT */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4
      /* IN_SUB_PATH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: [
      7
      /* AFTER_PATH */
    ]
  };
  pathStateMachine[
    2
    /* BEFORE_IDENT */
  ] = {
    [
      "w"
      /* WORKSPACE */
    ]: [
      2
      /* BEFORE_IDENT */
    ],
    [
      "i"
      /* IDENT */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "0"
      /* ZERO */
    ]: [
      3,
      0
      /* APPEND */
    ]
  };
  pathStateMachine[
    3
    /* IN_IDENT */
  ] = {
    [
      "i"
      /* IDENT */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "0"
      /* ZERO */
    ]: [
      3,
      0
      /* APPEND */
    ],
    [
      "w"
      /* WORKSPACE */
    ]: [
      1,
      1
      /* PUSH */
    ],
    [
      "."
      /* DOT */
    ]: [
      2,
      1
      /* PUSH */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4,
      1
      /* PUSH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: [
      7,
      1
      /* PUSH */
    ]
  };
  pathStateMachine[
    4
    /* IN_SUB_PATH */
  ] = {
    [
      "'"
      /* SINGLE_QUOTE */
    ]: [
      5,
      0
      /* APPEND */
    ],
    [
      '"'
      /* DOUBLE_QUOTE */
    ]: [
      6,
      0
      /* APPEND */
    ],
    [
      "["
      /* LEFT_BRACKET */
    ]: [
      4,
      2
      /* INC_SUB_PATH_DEPTH */
    ],
    [
      "]"
      /* RIGHT_BRACKET */
    ]: [
      1,
      3
      /* PUSH_SUB_PATH */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: 8,
    [
      "l"
      /* ELSE */
    ]: [
      4,
      0
      /* APPEND */
    ]
  };
  pathStateMachine[
    5
    /* IN_SINGLE_QUOTE */
  ] = {
    [
      "'"
      /* SINGLE_QUOTE */
    ]: [
      4,
      0
      /* APPEND */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: 8,
    [
      "l"
      /* ELSE */
    ]: [
      5,
      0
      /* APPEND */
    ]
  };
  pathStateMachine[
    6
    /* IN_DOUBLE_QUOTE */
  ] = {
    [
      '"'
      /* DOUBLE_QUOTE */
    ]: [
      4,
      0
      /* APPEND */
    ],
    [
      "o"
      /* END_OF_FAIL */
    ]: 8,
    [
      "l"
      /* ELSE */
    ]: [
      6,
      0
      /* APPEND */
    ]
  };
  const literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
  function isLiteral(exp) {
    return literalValueRE.test(exp);
  }
  function stripQuotes(str) {
    const a = str.charCodeAt(0);
    const b = str.charCodeAt(str.length - 1);
    return a === b && (a === 34 || a === 39) ? str.slice(1, -1) : str;
  }
  function getPathCharType(ch) {
    if (ch === void 0 || ch === null) {
      return "o";
    }
    const code = ch.charCodeAt(0);
    switch (code) {
      case 91:
      case 93:
      case 46:
      case 34:
      case 39:
        return ch;
      case 95:
      case 36:
      case 45:
        return "i";
      case 9:
      case 10:
      case 13:
      case 160:
      case 65279:
      case 8232:
      case 8233:
        return "w";
    }
    return "i";
  }
  function formatSubPath(path) {
    const trimmed = path.trim();
    if (path.charAt(0) === "0" && isNaN(parseInt(path))) {
      return false;
    }
    return isLiteral(trimmed) ? stripQuotes(trimmed) : "*" + trimmed;
  }
  function parse(path) {
    const keys = [];
    let index = -1;
    let mode = 0;
    let subPathDepth = 0;
    let c;
    let key;
    let newChar;
    let type;
    let transition;
    let action;
    let typeMap;
    const actions = [];
    actions[
      0
      /* APPEND */
    ] = () => {
      if (key === void 0) {
        key = newChar;
      } else {
        key += newChar;
      }
    };
    actions[
      1
      /* PUSH */
    ] = () => {
      if (key !== void 0) {
        keys.push(key);
        key = void 0;
      }
    };
    actions[
      2
      /* INC_SUB_PATH_DEPTH */
    ] = () => {
      actions[
        0
        /* APPEND */
      ]();
      subPathDepth++;
    };
    actions[
      3
      /* PUSH_SUB_PATH */
    ] = () => {
      if (subPathDepth > 0) {
        subPathDepth--;
        mode = 4;
        actions[
          0
          /* APPEND */
        ]();
      } else {
        subPathDepth = 0;
        if (key === void 0) {
          return false;
        }
        key = formatSubPath(key);
        if (key === false) {
          return false;
        } else {
          actions[
            1
            /* PUSH */
          ]();
        }
      }
    };
    function maybeUnescapeQuote() {
      const nextChar = path[index + 1];
      if (mode === 5 && nextChar === "'" || mode === 6 && nextChar === '"') {
        index++;
        newChar = "\\" + nextChar;
        actions[
          0
          /* APPEND */
        ]();
        return true;
      }
    }
    while (mode !== null) {
      index++;
      c = path[index];
      if (c === "\\" && maybeUnescapeQuote()) {
        continue;
      }
      type = getPathCharType(c);
      typeMap = pathStateMachine[mode];
      transition = typeMap[type] || typeMap[
        "l"
        /* ELSE */
      ] || 8;
      if (transition === 8) {
        return;
      }
      mode = transition[0];
      if (transition[1] !== void 0) {
        action = actions[transition[1]];
        if (action) {
          newChar = c;
          if (action() === false) {
            return;
          }
        }
      }
      if (mode === 7) {
        return keys;
      }
    }
  }
  const cache$1 = /* @__PURE__ */ new Map();
  function resolveValue(obj, path) {
    if (!isObject(obj)) {
      return null;
    }
    let hit = cache$1.get(path);
    if (!hit) {
      hit = parse(path);
      if (hit) {
        cache$1.set(path, hit);
      }
    }
    if (!hit) {
      return null;
    }
    const len = hit.length;
    let last = obj;
    let i = 0;
    while (i < len) {
      const val = last[hit[i]];
      if (val === void 0) {
        return null;
      }
      last = val;
      i++;
    }
    return last;
  }
  function handleFlatJson(obj) {
    if (!isObject(obj)) {
      return obj;
    }
    for (const key in obj) {
      if (!hasOwn(obj, key)) {
        continue;
      }
      if (!key.includes(
        "."
        /* DOT */
      )) {
        if (isObject(obj[key])) {
          handleFlatJson(obj[key]);
        }
      } else {
        const subKeys = key.split(
          "."
          /* DOT */
        );
        const lastIndex = subKeys.length - 1;
        let currentObj = obj;
        for (let i = 0; i < lastIndex; i++) {
          if (!(subKeys[i] in currentObj)) {
            currentObj[subKeys[i]] = {};
          }
          currentObj = currentObj[subKeys[i]];
        }
        currentObj[subKeys[lastIndex]] = obj[key];
        delete obj[key];
        if (isObject(currentObj[subKeys[lastIndex]])) {
          handleFlatJson(currentObj[subKeys[lastIndex]]);
        }
      }
    }
    return obj;
  }
  /*!
    * @intlify/runtime v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const DEFAULT_MODIFIER = (str) => str;
  const DEFAULT_MESSAGE = (ctx) => "";
  const DEFAULT_MESSAGE_DATA_TYPE = "text";
  const DEFAULT_NORMALIZE = (values) => values.length === 0 ? "" : values.join("");
  const DEFAULT_INTERPOLATE = toDisplayString;
  function pluralDefault(choice, choicesLength) {
    choice = Math.abs(choice);
    if (choicesLength === 2) {
      return choice ? choice > 1 ? 1 : 0 : 1;
    }
    return choice ? Math.min(choice, 2) : 0;
  }
  function getPluralIndex(options) {
    const index = isNumber(options.pluralIndex) ? options.pluralIndex : -1;
    return options.named && (isNumber(options.named.count) || isNumber(options.named.n)) ? isNumber(options.named.count) ? options.named.count : isNumber(options.named.n) ? options.named.n : index : index;
  }
  function normalizeNamed(pluralIndex, props) {
    if (!props.count) {
      props.count = pluralIndex;
    }
    if (!props.n) {
      props.n = pluralIndex;
    }
  }
  function createMessageContext(options = {}) {
    const locale = options.locale;
    const pluralIndex = getPluralIndex(options);
    const pluralRule = isObject$1(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? options.pluralRules[locale] : pluralDefault;
    const orgPluralRule = isObject$1(options.pluralRules) && isString(locale) && isFunction(options.pluralRules[locale]) ? pluralDefault : void 0;
    const plural = (messages2) => messages2[pluralRule(pluralIndex, messages2.length, orgPluralRule)];
    const _list = options.list || [];
    const list = (index) => _list[index];
    const _named = options.named || {};
    isNumber(options.pluralIndex) && normalizeNamed(pluralIndex, _named);
    const named = (key) => _named[key];
    function message(key) {
      const msg = isFunction(options.messages) ? options.messages(key) : isObject$1(options.messages) ? options.messages[key] : false;
      return !msg ? options.parent ? options.parent.message(key) : DEFAULT_MESSAGE : msg;
    }
    const _modifier = (name) => options.modifiers ? options.modifiers[name] : DEFAULT_MODIFIER;
    const normalize = isPlainObject$1(options.processor) && isFunction(options.processor.normalize) ? options.processor.normalize : DEFAULT_NORMALIZE;
    const interpolate = isPlainObject$1(options.processor) && isFunction(options.processor.interpolate) ? options.processor.interpolate : DEFAULT_INTERPOLATE;
    const type = isPlainObject$1(options.processor) && isString(options.processor.type) ? options.processor.type : DEFAULT_MESSAGE_DATA_TYPE;
    const ctx = {
      [
        "list"
        /* LIST */
      ]: list,
      [
        "named"
        /* NAMED */
      ]: named,
      [
        "plural"
        /* PLURAL */
      ]: plural,
      [
        "linked"
        /* LINKED */
      ]: (key, modifier) => {
        const msg = message(key)(ctx);
        return isString(modifier) ? _modifier(modifier)(msg) : msg;
      },
      [
        "message"
        /* MESSAGE */
      ]: message,
      [
        "type"
        /* TYPE */
      ]: type,
      [
        "interpolate"
        /* INTERPOLATE */
      ]: interpolate,
      [
        "normalize"
        /* NORMALIZE */
      ]: normalize
    };
    return ctx;
  }
  /*!
    * @intlify/message-compiler v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const errorMessages$2 = {
    // tokenizer error messages
    [
      0
      /* EXPECTED_TOKEN */
    ]: `Expected token: '{0}'`,
    [
      1
      /* INVALID_TOKEN_IN_PLACEHOLDER */
    ]: `Invalid token in placeholder: '{0}'`,
    [
      2
      /* UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER */
    ]: `Unterminated single quote in placeholder`,
    [
      3
      /* UNKNOWN_ESCAPE_SEQUENCE */
    ]: `Unknown escape sequence: \\{0}`,
    [
      4
      /* INVALID_UNICODE_ESCAPE_SEQUENCE */
    ]: `Invalid unicode escape sequence: {0}`,
    [
      5
      /* UNBALANCED_CLOSING_BRACE */
    ]: `Unbalanced closing brace`,
    [
      6
      /* UNTERMINATED_CLOSING_BRACE */
    ]: `Unterminated closing brace`,
    [
      7
      /* EMPTY_PLACEHOLDER */
    ]: `Empty placeholder`,
    [
      8
      /* NOT_ALLOW_NEST_PLACEHOLDER */
    ]: `Not allowed nest placeholder`,
    [
      9
      /* INVALID_LINKED_FORMAT */
    ]: `Invalid linked format`,
    // parser error messages
    [
      10
      /* MUST_HAVE_MESSAGES_IN_PLURAL */
    ]: `Plural must have messages`,
    [
      11
      /* UNEXPECTED_EMPTY_LINKED_MODIFIER */
    ]: `Unexpected empty linked modifier`,
    [
      12
      /* UNEXPECTED_EMPTY_LINKED_KEY */
    ]: `Unexpected empty linked key`,
    [
      13
      /* UNEXPECTED_LEXICAL_ANALYSIS */
    ]: `Unexpected lexical analysis in token: '{0}'`
  };
  function createCompileError(code, loc, options = {}) {
    const { domain, messages: messages2, args } = options;
    const msg = format((messages2 || errorMessages$2)[code] || "", ...args || []);
    const error = new SyntaxError(String(msg));
    error.code = code;
    if (loc) {
      error.location = loc;
    }
    error.domain = domain;
    return error;
  }
  /*!
    * @intlify/devtools-if v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const IntlifyDevToolsHooks = {
    I18nInit: "i18n:init",
    FunctionTranslate: "function:translate"
  };
  /*!
    * @intlify/core-base v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  let devtools = null;
  function setDevToolsHook(hook) {
    devtools = hook;
  }
  function initI18nDevTools(i18n2, version, meta) {
    devtools && devtools.emit(IntlifyDevToolsHooks.I18nInit, {
      timestamp: Date.now(),
      i18n: i18n2,
      version,
      meta
    });
  }
  const translateDevTools = /* @__PURE__ */ createDevToolsHook(IntlifyDevToolsHooks.FunctionTranslate);
  function createDevToolsHook(hook) {
    return (payloads) => devtools && devtools.emit(hook, payloads);
  }
  const warnMessages$1 = {
    [
      0
      /* NOT_FOUND_KEY */
    ]: `Not found '{key}' key in '{locale}' locale messages.`,
    [
      1
      /* FALLBACK_TO_TRANSLATE */
    ]: `Fall back to translate '{key}' key with '{target}' locale.`,
    [
      2
      /* CANNOT_FORMAT_NUMBER */
    ]: `Cannot format a number value due to not supported Intl.NumberFormat.`,
    [
      3
      /* FALLBACK_TO_NUMBER_FORMAT */
    ]: `Fall back to number format '{key}' key with '{target}' locale.`,
    [
      4
      /* CANNOT_FORMAT_DATE */
    ]: `Cannot format a date value due to not supported Intl.DateTimeFormat.`,
    [
      5
      /* FALLBACK_TO_DATE_FORMAT */
    ]: `Fall back to datetime format '{key}' key with '{target}' locale.`
  };
  function getWarnMessage$1(code, ...args) {
    return format(warnMessages$1[code], ...args);
  }
  const VERSION$1 = "9.1.9";
  const NOT_REOSLVED = -1;
  const MISSING_RESOLVE_VALUE = "";
  function getDefaultLinkedModifiers() {
    return {
      upper: (val) => isString(val) ? val.toUpperCase() : val,
      lower: (val) => isString(val) ? val.toLowerCase() : val,
      // prettier-ignore
      capitalize: (val) => isString(val) ? `${val.charAt(0).toLocaleUpperCase()}${val.substr(1)}` : val
    };
  }
  let _compiler;
  let _additionalMeta = null;
  const setAdditionalMeta = (meta) => {
    _additionalMeta = meta;
  };
  const getAdditionalMeta = () => _additionalMeta;
  let _cid = 0;
  function createCoreContext(options = {}) {
    const version = isString(options.version) ? options.version : VERSION$1;
    const locale = isString(options.locale) ? options.locale : "en-US";
    const fallbackLocale = isArray(options.fallbackLocale) || isPlainObject$1(options.fallbackLocale) || isString(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
    const messages2 = isPlainObject$1(options.messages) ? options.messages : { [locale]: {} };
    const datetimeFormats = isPlainObject$1(options.datetimeFormats) ? options.datetimeFormats : { [locale]: {} };
    const numberFormats = isPlainObject$1(options.numberFormats) ? options.numberFormats : { [locale]: {} };
    const modifiers = assign$2({}, options.modifiers || {}, getDefaultLinkedModifiers());
    const pluralRules = options.pluralRules || {};
    const missing = isFunction(options.missing) ? options.missing : null;
    const missingWarn = isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
    const fallbackWarn = isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
    const fallbackFormat = !!options.fallbackFormat;
    const unresolving = !!options.unresolving;
    const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
    const processor = isPlainObject$1(options.processor) ? options.processor : null;
    const warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
    const escapeParameter = !!options.escapeParameter;
    const messageCompiler = isFunction(options.messageCompiler) ? options.messageCompiler : _compiler;
    const onWarn = isFunction(options.onWarn) ? options.onWarn : warn;
    const internalOptions = options;
    const __datetimeFormatters = isObject$1(internalOptions.__datetimeFormatters) ? internalOptions.__datetimeFormatters : /* @__PURE__ */ new Map();
    const __numberFormatters = isObject$1(internalOptions.__numberFormatters) ? internalOptions.__numberFormatters : /* @__PURE__ */ new Map();
    const __meta = isObject$1(internalOptions.__meta) ? internalOptions.__meta : {};
    _cid++;
    const context = {
      version,
      cid: _cid,
      locale,
      fallbackLocale,
      messages: messages2,
      datetimeFormats,
      numberFormats,
      modifiers,
      pluralRules,
      missing,
      missingWarn,
      fallbackWarn,
      fallbackFormat,
      unresolving,
      postTranslation,
      processor,
      warnHtmlMessage,
      escapeParameter,
      messageCompiler,
      onWarn,
      __datetimeFormatters,
      __numberFormatters,
      __meta
    };
    {
      context.__v_emitter = internalOptions.__v_emitter != null ? internalOptions.__v_emitter : void 0;
    }
    {
      initI18nDevTools(context, version, __meta);
    }
    return context;
  }
  function isTranslateFallbackWarn(fallback, key) {
    return fallback instanceof RegExp ? fallback.test(key) : fallback;
  }
  function isTranslateMissingWarn(missing, key) {
    return missing instanceof RegExp ? missing.test(key) : missing;
  }
  function handleMissing(context, key, locale, missingWarn, type) {
    const { missing, onWarn } = context;
    {
      const emitter = context.__v_emitter;
      if (emitter) {
        emitter.emit("missing", {
          locale,
          key,
          type,
          groupId: `${type}:${key}`
        });
      }
    }
    if (missing !== null) {
      const ret = missing(context, locale, key, type);
      return isString(ret) ? ret : key;
    } else {
      if (isTranslateMissingWarn(missingWarn, key)) {
        onWarn(getWarnMessage$1(0, { key, locale }));
      }
      return key;
    }
  }
  function getLocaleChain(ctx, fallback, start) {
    const context = ctx;
    if (!context.__localeChainCache) {
      context.__localeChainCache = /* @__PURE__ */ new Map();
    }
    let chain = context.__localeChainCache.get(start);
    if (!chain) {
      chain = [];
      let block = [start];
      while (isArray(block)) {
        block = appendBlockToChain(chain, block, fallback);
      }
      const defaults = isArray(fallback) ? fallback : isPlainObject$1(fallback) ? fallback["default"] ? fallback["default"] : null : fallback;
      block = isString(defaults) ? [defaults] : defaults;
      if (isArray(block)) {
        appendBlockToChain(chain, block, false);
      }
      context.__localeChainCache.set(start, chain);
    }
    return chain;
  }
  function appendBlockToChain(chain, block, blocks) {
    let follow = true;
    for (let i = 0; i < block.length && isBoolean(follow); i++) {
      const locale = block[i];
      if (isString(locale)) {
        follow = appendLocaleToChain(chain, block[i], blocks);
      }
    }
    return follow;
  }
  function appendLocaleToChain(chain, locale, blocks) {
    let follow;
    const tokens = locale.split("-");
    do {
      const target = tokens.join("-");
      follow = appendItemToChain(chain, target, blocks);
      tokens.splice(-1, 1);
    } while (tokens.length && follow === true);
    return follow;
  }
  function appendItemToChain(chain, target, blocks) {
    let follow = false;
    if (!chain.includes(target)) {
      follow = true;
      if (target) {
        follow = target[target.length - 1] !== "!";
        const locale = target.replace(/!/g, "");
        chain.push(locale);
        if ((isArray(blocks) || isPlainObject$1(blocks)) && blocks[locale]) {
          follow = blocks[locale];
        }
      }
    }
    return follow;
  }
  function updateFallbackLocale(ctx, locale, fallback) {
    const context = ctx;
    context.__localeChainCache = /* @__PURE__ */ new Map();
    getLocaleChain(ctx, fallback, locale);
  }
  function createCoreError(code) {
    return createCompileError(code, null, { messages: errorMessages$1 });
  }
  const errorMessages$1 = {
    [
      14
      /* INVALID_ARGUMENT */
    ]: "Invalid arguments",
    [
      15
      /* INVALID_DATE_ARGUMENT */
    ]: "The date provided is an invalid Date object.Make sure your Date represents a valid date.",
    [
      16
      /* INVALID_ISO_DATE_ARGUMENT */
    ]: "The argument provided is not a valid ISO date string"
  };
  const NOOP_MESSAGE_FUNCTION = () => "";
  const isMessageFunction = (val) => isFunction(val);
  function translate(context, ...args) {
    const { fallbackFormat, postTranslation, unresolving, fallbackLocale, messages: messages2 } = context;
    const [key, options] = parseTranslateArgs(...args);
    const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
    const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
    const escapeParameter = isBoolean(options.escapeParameter) ? options.escapeParameter : context.escapeParameter;
    const resolvedMessage = !!options.resolvedMessage;
    const defaultMsgOrKey = isString(options.default) || isBoolean(options.default) ? !isBoolean(options.default) ? options.default : key : fallbackFormat ? key : "";
    const enableDefaultMsg = fallbackFormat || defaultMsgOrKey !== "";
    const locale = isString(options.locale) ? options.locale : context.locale;
    escapeParameter && escapeParams(options);
    let [format2, targetLocale, message] = !resolvedMessage ? resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) : [
      key,
      locale,
      messages2[locale] || {}
    ];
    let cacheBaseKey = key;
    if (!resolvedMessage && !(isString(format2) || isMessageFunction(format2))) {
      if (enableDefaultMsg) {
        format2 = defaultMsgOrKey;
        cacheBaseKey = format2;
      }
    }
    if (!resolvedMessage && (!(isString(format2) || isMessageFunction(format2)) || !isString(targetLocale))) {
      return unresolving ? NOT_REOSLVED : key;
    }
    if (isString(format2) && context.messageCompiler == null) {
      warn(`The message format compilation is not supported in this build. Because message compiler isn't included. You need to pre-compilation all message format. So translate function return '${key}'.`);
      return key;
    }
    let occurred = false;
    const errorDetector = () => {
      occurred = true;
    };
    const msg = !isMessageFunction(format2) ? compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, errorDetector) : format2;
    if (occurred) {
      return format2;
    }
    const ctxOptions = getMessageContextOptions(context, targetLocale, message, options);
    const msgContext = createMessageContext(ctxOptions);
    const messaged = evaluateMessage(context, msg, msgContext);
    const ret = postTranslation ? postTranslation(messaged) : messaged;
    {
      const payloads = {
        timestamp: Date.now(),
        key: isString(key) ? key : isMessageFunction(format2) ? format2.key : "",
        locale: targetLocale || (isMessageFunction(format2) ? format2.locale : ""),
        format: isString(format2) ? format2 : isMessageFunction(format2) ? format2.source : "",
        message: ret
      };
      payloads.meta = assign$2({}, context.__meta, getAdditionalMeta() || {});
      translateDevTools(payloads);
    }
    return ret;
  }
  function escapeParams(options) {
    if (isArray(options.list)) {
      options.list = options.list.map((item) => isString(item) ? escapeHtml(item) : item);
    } else if (isObject$1(options.named)) {
      Object.keys(options.named).forEach((key) => {
        if (isString(options.named[key])) {
          options.named[key] = escapeHtml(options.named[key]);
        }
      });
    }
  }
  function resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) {
    const { messages: messages2, onWarn } = context;
    const locales = getLocaleChain(context, fallbackLocale, locale);
    let message = {};
    let targetLocale;
    let format2 = null;
    let from = locale;
    let to = null;
    const type = "translate";
    for (let i = 0; i < locales.length; i++) {
      targetLocale = to = locales[i];
      if (locale !== targetLocale && isTranslateFallbackWarn(fallbackWarn, key)) {
        onWarn(getWarnMessage$1(1, {
          key,
          target: targetLocale
        }));
      }
      if (locale !== targetLocale) {
        const emitter = context.__v_emitter;
        if (emitter) {
          emitter.emit("fallback", {
            type,
            key,
            from,
            to,
            groupId: `${type}:${key}`
          });
        }
      }
      message = messages2[targetLocale] || {};
      let start = null;
      let startTag;
      let endTag;
      if (inBrowser) {
        start = window.performance.now();
        startTag = "intlify-message-resolve-start";
        endTag = "intlify-message-resolve-end";
        mark && mark(startTag);
      }
      if ((format2 = resolveValue(message, key)) === null) {
        format2 = message[key];
      }
      if (inBrowser) {
        const end = window.performance.now();
        const emitter = context.__v_emitter;
        if (emitter && start && format2) {
          emitter.emit("message-resolve", {
            type: "message-resolve",
            key,
            message: format2,
            time: end - start,
            groupId: `${type}:${key}`
          });
        }
        if (startTag && endTag && mark && measure) {
          mark(endTag);
          measure("intlify message resolve", startTag, endTag);
        }
      }
      if (isString(format2) || isFunction(format2))
        break;
      const missingRet = handleMissing(context, key, targetLocale, missingWarn, type);
      if (missingRet !== key) {
        format2 = missingRet;
      }
      from = to;
    }
    return [format2, targetLocale, message];
  }
  function compileMessageFormat(context, key, targetLocale, format2, cacheBaseKey, errorDetector) {
    const { messageCompiler, warnHtmlMessage } = context;
    if (isMessageFunction(format2)) {
      const msg2 = format2;
      msg2.locale = msg2.locale || targetLocale;
      msg2.key = msg2.key || key;
      return msg2;
    }
    let start = null;
    let startTag;
    let endTag;
    if (inBrowser) {
      start = window.performance.now();
      startTag = "intlify-message-compilation-start";
      endTag = "intlify-message-compilation-end";
      mark && mark(startTag);
    }
    const msg = messageCompiler(format2, getCompileOptions(context, targetLocale, cacheBaseKey, format2, warnHtmlMessage, errorDetector));
    if (inBrowser) {
      const end = window.performance.now();
      const emitter = context.__v_emitter;
      if (emitter && start) {
        emitter.emit("message-compilation", {
          type: "message-compilation",
          message: format2,
          time: end - start,
          groupId: `${"translate"}:${key}`
        });
      }
      if (startTag && endTag && mark && measure) {
        mark(endTag);
        measure("intlify message compilation", startTag, endTag);
      }
    }
    msg.locale = targetLocale;
    msg.key = key;
    msg.source = format2;
    return msg;
  }
  function evaluateMessage(context, msg, msgCtx) {
    let start = null;
    let startTag;
    let endTag;
    if (inBrowser) {
      start = window.performance.now();
      startTag = "intlify-message-evaluation-start";
      endTag = "intlify-message-evaluation-end";
      mark && mark(startTag);
    }
    const messaged = msg(msgCtx);
    if (inBrowser) {
      const end = window.performance.now();
      const emitter = context.__v_emitter;
      if (emitter && start) {
        emitter.emit("message-evaluation", {
          type: "message-evaluation",
          value: messaged,
          time: end - start,
          groupId: `${"translate"}:${msg.key}`
        });
      }
      if (startTag && endTag && mark && measure) {
        mark(endTag);
        measure("intlify message evaluation", startTag, endTag);
      }
    }
    return messaged;
  }
  function parseTranslateArgs(...args) {
    const [arg1, arg2, arg3] = args;
    const options = {};
    if (!isString(arg1) && !isNumber(arg1) && !isMessageFunction(arg1)) {
      throw createCoreError(
        14
        /* INVALID_ARGUMENT */
      );
    }
    const key = isNumber(arg1) ? String(arg1) : isMessageFunction(arg1) ? arg1 : arg1;
    if (isNumber(arg2)) {
      options.plural = arg2;
    } else if (isString(arg2)) {
      options.default = arg2;
    } else if (isPlainObject$1(arg2) && !isEmptyObject(arg2)) {
      options.named = arg2;
    } else if (isArray(arg2)) {
      options.list = arg2;
    }
    if (isNumber(arg3)) {
      options.plural = arg3;
    } else if (isString(arg3)) {
      options.default = arg3;
    } else if (isPlainObject$1(arg3)) {
      assign$2(options, arg3);
    }
    return [key, options];
  }
  function getCompileOptions(context, locale, key, source, warnHtmlMessage, errorDetector) {
    return {
      warnHtmlMessage,
      onError: (err) => {
        errorDetector && errorDetector(err);
        {
          const message = `Message compilation error: ${err.message}`;
          const codeFrame = err.location && generateCodeFrame(source, err.location.start.offset, err.location.end.offset);
          const emitter = context.__v_emitter;
          if (emitter) {
            emitter.emit("compile-error", {
              message: source,
              error: err.message,
              start: err.location && err.location.start.offset,
              end: err.location && err.location.end.offset,
              groupId: `${"translate"}:${key}`
            });
          }
          console.error(codeFrame ? `${message}
${codeFrame}` : message);
        }
      },
      onCacheKey: (source2) => generateFormatCacheKey(locale, key, source2)
    };
  }
  function getMessageContextOptions(context, locale, message, options) {
    const { modifiers, pluralRules } = context;
    const resolveMessage = (key) => {
      const val = resolveValue(message, key);
      if (isString(val)) {
        let occurred = false;
        const errorDetector = () => {
          occurred = true;
        };
        const msg = compileMessageFormat(context, key, locale, val, key, errorDetector);
        return !occurred ? msg : NOOP_MESSAGE_FUNCTION;
      } else if (isMessageFunction(val)) {
        return val;
      } else {
        return NOOP_MESSAGE_FUNCTION;
      }
    };
    const ctxOptions = {
      locale,
      modifiers,
      pluralRules,
      messages: resolveMessage
    };
    if (context.processor) {
      ctxOptions.processor = context.processor;
    }
    if (options.list) {
      ctxOptions.list = options.list;
    }
    if (options.named) {
      ctxOptions.named = options.named;
    }
    if (isNumber(options.plural)) {
      ctxOptions.pluralIndex = options.plural;
    }
    return ctxOptions;
  }
  const intlDefined = typeof Intl !== "undefined";
  const Availabilities = {
    dateTimeFormat: intlDefined && typeof Intl.DateTimeFormat !== "undefined",
    numberFormat: intlDefined && typeof Intl.NumberFormat !== "undefined"
  };
  function datetime(context, ...args) {
    const { datetimeFormats, unresolving, fallbackLocale, onWarn } = context;
    const { __datetimeFormatters } = context;
    if (!Availabilities.dateTimeFormat) {
      onWarn(getWarnMessage$1(
        4
        /* CANNOT_FORMAT_DATE */
      ));
      return MISSING_RESOLVE_VALUE;
    }
    const [key, value, options, overrides] = parseDateTimeArgs(...args);
    const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
    const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
    const part = !!options.part;
    const locale = isString(options.locale) ? options.locale : context.locale;
    const locales = getLocaleChain(context, fallbackLocale, locale);
    if (!isString(key) || key === "") {
      return new Intl.DateTimeFormat(locale).format(value);
    }
    let datetimeFormat = {};
    let targetLocale;
    let format2 = null;
    let from = locale;
    let to = null;
    const type = "datetime format";
    for (let i = 0; i < locales.length; i++) {
      targetLocale = to = locales[i];
      if (locale !== targetLocale && isTranslateFallbackWarn(fallbackWarn, key)) {
        onWarn(getWarnMessage$1(5, {
          key,
          target: targetLocale
        }));
      }
      if (locale !== targetLocale) {
        const emitter = context.__v_emitter;
        if (emitter) {
          emitter.emit("fallback", {
            type,
            key,
            from,
            to,
            groupId: `${type}:${key}`
          });
        }
      }
      datetimeFormat = datetimeFormats[targetLocale] || {};
      format2 = datetimeFormat[key];
      if (isPlainObject$1(format2))
        break;
      handleMissing(context, key, targetLocale, missingWarn, type);
      from = to;
    }
    if (!isPlainObject$1(format2) || !isString(targetLocale)) {
      return unresolving ? NOT_REOSLVED : key;
    }
    let id2 = `${targetLocale}__${key}`;
    if (!isEmptyObject(overrides)) {
      id2 = `${id2}__${JSON.stringify(overrides)}`;
    }
    let formatter = __datetimeFormatters.get(id2);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(targetLocale, assign$2({}, format2, overrides));
      __datetimeFormatters.set(id2, formatter);
    }
    return !part ? formatter.format(value) : formatter.formatToParts(value);
  }
  function parseDateTimeArgs(...args) {
    const [arg1, arg2, arg3, arg4] = args;
    let options = {};
    let overrides = {};
    let value;
    if (isString(arg1)) {
      if (!/\d{4}-\d{2}-\d{2}(T.*)?/.test(arg1)) {
        throw createCoreError(
          16
          /* INVALID_ISO_DATE_ARGUMENT */
        );
      }
      value = new Date(arg1);
      try {
        value.toISOString();
      } catch (e) {
        throw createCoreError(
          16
          /* INVALID_ISO_DATE_ARGUMENT */
        );
      }
    } else if (isDate(arg1)) {
      if (isNaN(arg1.getTime())) {
        throw createCoreError(
          15
          /* INVALID_DATE_ARGUMENT */
        );
      }
      value = arg1;
    } else if (isNumber(arg1)) {
      value = arg1;
    } else {
      throw createCoreError(
        14
        /* INVALID_ARGUMENT */
      );
    }
    if (isString(arg2)) {
      options.key = arg2;
    } else if (isPlainObject$1(arg2)) {
      options = arg2;
    }
    if (isString(arg3)) {
      options.locale = arg3;
    } else if (isPlainObject$1(arg3)) {
      overrides = arg3;
    }
    if (isPlainObject$1(arg4)) {
      overrides = arg4;
    }
    return [options.key || "", value, options, overrides];
  }
  function clearDateTimeFormat(ctx, locale, format2) {
    const context = ctx;
    for (const key in format2) {
      const id2 = `${locale}__${key}`;
      if (!context.__datetimeFormatters.has(id2)) {
        continue;
      }
      context.__datetimeFormatters.delete(id2);
    }
  }
  function number(context, ...args) {
    const { numberFormats, unresolving, fallbackLocale, onWarn } = context;
    const { __numberFormatters } = context;
    if (!Availabilities.numberFormat) {
      onWarn(getWarnMessage$1(
        2
        /* CANNOT_FORMAT_NUMBER */
      ));
      return MISSING_RESOLVE_VALUE;
    }
    const [key, value, options, overrides] = parseNumberArgs(...args);
    const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
    const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
    const part = !!options.part;
    const locale = isString(options.locale) ? options.locale : context.locale;
    const locales = getLocaleChain(context, fallbackLocale, locale);
    if (!isString(key) || key === "") {
      return new Intl.NumberFormat(locale).format(value);
    }
    let numberFormat = {};
    let targetLocale;
    let format2 = null;
    let from = locale;
    let to = null;
    const type = "number format";
    for (let i = 0; i < locales.length; i++) {
      targetLocale = to = locales[i];
      if (locale !== targetLocale && isTranslateFallbackWarn(fallbackWarn, key)) {
        onWarn(getWarnMessage$1(3, {
          key,
          target: targetLocale
        }));
      }
      if (locale !== targetLocale) {
        const emitter = context.__v_emitter;
        if (emitter) {
          emitter.emit("fallback", {
            type,
            key,
            from,
            to,
            groupId: `${type}:${key}`
          });
        }
      }
      numberFormat = numberFormats[targetLocale] || {};
      format2 = numberFormat[key];
      if (isPlainObject$1(format2))
        break;
      handleMissing(context, key, targetLocale, missingWarn, type);
      from = to;
    }
    if (!isPlainObject$1(format2) || !isString(targetLocale)) {
      return unresolving ? NOT_REOSLVED : key;
    }
    let id2 = `${targetLocale}__${key}`;
    if (!isEmptyObject(overrides)) {
      id2 = `${id2}__${JSON.stringify(overrides)}`;
    }
    let formatter = __numberFormatters.get(id2);
    if (!formatter) {
      formatter = new Intl.NumberFormat(targetLocale, assign$2({}, format2, overrides));
      __numberFormatters.set(id2, formatter);
    }
    return !part ? formatter.format(value) : formatter.formatToParts(value);
  }
  function parseNumberArgs(...args) {
    const [arg1, arg2, arg3, arg4] = args;
    let options = {};
    let overrides = {};
    if (!isNumber(arg1)) {
      throw createCoreError(
        14
        /* INVALID_ARGUMENT */
      );
    }
    const value = arg1;
    if (isString(arg2)) {
      options.key = arg2;
    } else if (isPlainObject$1(arg2)) {
      options = arg2;
    }
    if (isString(arg3)) {
      options.locale = arg3;
    } else if (isPlainObject$1(arg3)) {
      overrides = arg3;
    }
    if (isPlainObject$1(arg4)) {
      overrides = arg4;
    }
    return [options.key || "", value, options, overrides];
  }
  function clearNumberFormat(ctx, locale, format2) {
    const context = ctx;
    for (const key in format2) {
      const id2 = `${locale}__${key}`;
      if (!context.__numberFormatters.has(id2)) {
        continue;
      }
      context.__numberFormatters.delete(id2);
    }
  }
  function getDevtoolsGlobalHook$1() {
    return getTarget$1().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget$1() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable$1 = typeof Proxy === "function";
  const HOOK_SETUP$1 = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET$1 = "plugin:settings:set";
  let ApiProxy$1 = class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id2 in plugin.settings) {
          const item = plugin.settings[id2];
          defaultSettings[id2] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = { ...defaultSettings };
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET$1, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  };
  function setupDevtoolsPlugin$1(pluginDescriptor, setupFn) {
    const target = getTarget$1();
    const hook = getDevtoolsGlobalHook$1();
    const enableProxy = isProxyAvailable$1 && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP$1, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy$1(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
    * @intlify/vue-devtools v9.1.9
    * (c) 2021 kazuya kawaguchi
    * Released under the MIT License.
    */
  const VueDevToolsLabels = {
    [
      "vue-devtools-plugin-vue-i18n"
      /* PLUGIN */
    ]: "Vue I18n devtools",
    [
      "vue-i18n-resource-inspector"
      /* CUSTOM_INSPECTOR */
    ]: "I18n Resources",
    [
      "vue-i18n-timeline"
      /* TIMELINE */
    ]: "Vue I18n"
  };
  const VueDevToolsPlaceholders = {
    [
      "vue-i18n-resource-inspector"
      /* CUSTOM_INSPECTOR */
    ]: "Search for scopes ..."
  };
  const VueDevToolsTimelineColors = {
    [
      "vue-i18n-timeline"
      /* TIMELINE */
    ]: 16764185
  };
  /*!
    * vue-i18n v9.1.9
    * (c) 2022 kazuya kawaguchi
    * Released under the MIT License.
    */
  const VERSION = "9.1.9";
  function initFeatureFlags() {
    let needWarn = false;
    {
      needWarn = true;
    }
    if (needWarn) {
      console.warn(`You are running the esm-bundler build of vue-i18n. It is recommended to configure your bundler to explicitly replace feature flag globals with boolean literals to get proper tree-shaking in the final bundle.`);
    }
  }
  const warnMessages = {
    [
      6
      /* FALLBACK_TO_ROOT */
    ]: `Fall back to {type} '{key}' with root locale.`,
    [
      7
      /* NOT_SUPPORTED_PRESERVE */
    ]: `Not supported 'preserve'.`,
    [
      8
      /* NOT_SUPPORTED_FORMATTER */
    ]: `Not supported 'formatter'.`,
    [
      9
      /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
    ]: `Not supported 'preserveDirectiveContent'.`,
    [
      10
      /* NOT_SUPPORTED_GET_CHOICE_INDEX */
    ]: `Not supported 'getChoiceIndex'.`,
    [
      11
      /* COMPONENT_NAME_LEGACY_COMPATIBLE */
    ]: `Component name legacy compatible: '{name}' -> 'i18n'`,
    [
      12
      /* NOT_FOUND_PARENT_SCOPE */
    ]: `Not found parent scope. use the global scope.`
  };
  function getWarnMessage(code, ...args) {
    return format(warnMessages[code], ...args);
  }
  function createI18nError(code, ...args) {
    return createCompileError(code, null, { messages: errorMessages, args });
  }
  const errorMessages = {
    [
      14
      /* UNEXPECTED_RETURN_TYPE */
    ]: "Unexpected return type in composer",
    [
      15
      /* INVALID_ARGUMENT */
    ]: "Invalid argument",
    [
      16
      /* MUST_BE_CALL_SETUP_TOP */
    ]: "Must be called at the top of a `setup` function",
    [
      17
      /* NOT_INSLALLED */
    ]: "Need to install with `app.use` function",
    [
      22
      /* UNEXPECTED_ERROR */
    ]: "Unexpected error",
    [
      18
      /* NOT_AVAILABLE_IN_LEGACY_MODE */
    ]: "Not available in legacy mode",
    [
      19
      /* REQUIRED_VALUE */
    ]: `Required in value: {0}`,
    [
      20
      /* INVALID_VALUE */
    ]: `Invalid value`,
    [
      21
      /* CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN */
    ]: `Cannot setup vue-devtools plugin`
  };
  const DEVTOOLS_META = "__INTLIFY_META__";
  const TransrateVNodeSymbol = makeSymbol("__transrateVNode");
  const DatetimePartsSymbol = makeSymbol("__datetimeParts");
  const NumberPartsSymbol = makeSymbol("__numberParts");
  const EnableEmitter = makeSymbol("__enableEmitter");
  const DisableEmitter = makeSymbol("__disableEmitter");
  const SetPluralRulesSymbol = makeSymbol("__setPluralRules");
  const InejctWithOption = makeSymbol("__injectWithOption");
  let composerID = 0;
  function defineCoreMissingHandler(missing) {
    return (ctx, locale, key, type) => {
      return missing(locale, key, vue.getCurrentInstance() || void 0, type);
    };
  }
  function getLocaleMessages(locale, options) {
    const { messages: messages2, __i18n } = options;
    const ret = isPlainObject$1(messages2) ? messages2 : isArray(__i18n) ? {} : { [locale]: {} };
    if (isArray(__i18n)) {
      __i18n.forEach(({ locale: locale2, resource }) => {
        if (locale2) {
          ret[locale2] = ret[locale2] || {};
          deepCopy(resource, ret[locale2]);
        } else {
          deepCopy(resource, ret);
        }
      });
    }
    if (options.flatJson) {
      for (const key in ret) {
        if (hasOwn$1(ret, key)) {
          handleFlatJson(ret[key]);
        }
      }
    }
    return ret;
  }
  const isNotObjectOrIsArray = (val) => !isObject$1(val) || isArray(val);
  function deepCopy(src, des) {
    if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) {
      throw createI18nError(
        20
        /* INVALID_VALUE */
      );
    }
    for (const key in src) {
      if (hasOwn$1(src, key)) {
        if (isNotObjectOrIsArray(src[key]) || isNotObjectOrIsArray(des[key])) {
          des[key] = src[key];
        } else {
          deepCopy(src[key], des[key]);
        }
      }
    }
  }
  const getMetaInfo = () => {
    const instance = vue.getCurrentInstance();
    return instance && instance.type[DEVTOOLS_META] ? { [DEVTOOLS_META]: instance.type[DEVTOOLS_META] } : null;
  };
  function createComposer(options = {}) {
    const { __root } = options;
    const _isGlobal = __root === void 0;
    let _inheritLocale = isBoolean(options.inheritLocale) ? options.inheritLocale : true;
    const _locale = vue.ref(
      // prettier-ignore
      __root && _inheritLocale ? __root.locale.value : isString(options.locale) ? options.locale : "en-US"
    );
    const _fallbackLocale = vue.ref(
      // prettier-ignore
      __root && _inheritLocale ? __root.fallbackLocale.value : isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject$1(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale.value
    );
    const _messages = vue.ref(getLocaleMessages(_locale.value, options));
    const _datetimeFormats = vue.ref(isPlainObject$1(options.datetimeFormats) ? options.datetimeFormats : { [_locale.value]: {} });
    const _numberFormats = vue.ref(isPlainObject$1(options.numberFormats) ? options.numberFormats : { [_locale.value]: {} });
    let _missingWarn = __root ? __root.missingWarn : isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
    let _fallbackWarn = __root ? __root.fallbackWarn : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
    let _fallbackRoot = __root ? __root.fallbackRoot : isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
    let _fallbackFormat = !!options.fallbackFormat;
    let _missing = isFunction(options.missing) ? options.missing : null;
    let _runtimeMissing = isFunction(options.missing) ? defineCoreMissingHandler(options.missing) : null;
    let _postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
    let _warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
    let _escapeParameter = !!options.escapeParameter;
    const _modifiers = __root ? __root.modifiers : isPlainObject$1(options.modifiers) ? options.modifiers : {};
    let _pluralRules = options.pluralRules || __root && __root.pluralRules;
    let _context;
    function getCoreContext() {
      return createCoreContext({
        version: VERSION,
        locale: _locale.value,
        fallbackLocale: _fallbackLocale.value,
        messages: _messages.value,
        messageCompiler: function compileToFunction(source) {
          return (ctx) => {
            return ctx.normalize([source]);
          };
        },
        datetimeFormats: _datetimeFormats.value,
        numberFormats: _numberFormats.value,
        modifiers: _modifiers,
        pluralRules: _pluralRules,
        missing: _runtimeMissing === null ? void 0 : _runtimeMissing,
        missingWarn: _missingWarn,
        fallbackWarn: _fallbackWarn,
        fallbackFormat: _fallbackFormat,
        unresolving: true,
        postTranslation: _postTranslation === null ? void 0 : _postTranslation,
        warnHtmlMessage: _warnHtmlMessage,
        escapeParameter: _escapeParameter,
        __datetimeFormatters: isPlainObject$1(_context) ? _context.__datetimeFormatters : void 0,
        __numberFormatters: isPlainObject$1(_context) ? _context.__numberFormatters : void 0,
        __v_emitter: isPlainObject$1(_context) ? _context.__v_emitter : void 0,
        __meta: { framework: "vue" }
      });
    }
    _context = getCoreContext();
    updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
    function trackReactivityValues() {
      return [
        _locale.value,
        _fallbackLocale.value,
        _messages.value,
        _datetimeFormats.value,
        _numberFormats.value
      ];
    }
    const locale = vue.computed({
      get: () => _locale.value,
      set: (val) => {
        _locale.value = val;
        _context.locale = _locale.value;
      }
    });
    const fallbackLocale = vue.computed({
      get: () => _fallbackLocale.value,
      set: (val) => {
        _fallbackLocale.value = val;
        _context.fallbackLocale = _fallbackLocale.value;
        updateFallbackLocale(_context, _locale.value, val);
      }
    });
    const messages2 = vue.computed(() => _messages.value);
    const datetimeFormats = vue.computed(() => _datetimeFormats.value);
    const numberFormats = vue.computed(() => _numberFormats.value);
    function getPostTranslationHandler() {
      return isFunction(_postTranslation) ? _postTranslation : null;
    }
    function setPostTranslationHandler(handler) {
      _postTranslation = handler;
      _context.postTranslation = handler;
    }
    function getMissingHandler() {
      return _missing;
    }
    function setMissingHandler(handler) {
      if (handler !== null) {
        _runtimeMissing = defineCoreMissingHandler(handler);
      }
      _missing = handler;
      _context.missing = _runtimeMissing;
    }
    function isResolvedTranslateMessage(type, arg) {
      return type !== "translate" || !!arg.resolvedMessage === false;
    }
    function wrapWithDeps(fn, argumentParser, warnType, fallbackSuccess, fallbackFail, successCondition) {
      trackReactivityValues();
      let ret;
      {
        try {
          setAdditionalMeta(getMetaInfo());
          ret = fn(_context);
        } finally {
          setAdditionalMeta(null);
        }
      }
      if (isNumber(ret) && ret === NOT_REOSLVED) {
        const [key, arg2] = argumentParser();
        if (__root && isString(key) && isResolvedTranslateMessage(warnType, arg2)) {
          if (_fallbackRoot && (isTranslateFallbackWarn(_fallbackWarn, key) || isTranslateMissingWarn(_missingWarn, key))) {
            warn(getWarnMessage(6, {
              key,
              type: warnType
            }));
          }
          {
            const { __v_emitter: emitter } = _context;
            if (emitter && _fallbackRoot) {
              emitter.emit("fallback", {
                type: warnType,
                key,
                to: "global",
                groupId: `${warnType}:${key}`
              });
            }
          }
        }
        return __root && _fallbackRoot ? fallbackSuccess(__root) : fallbackFail(key);
      } else if (successCondition(ret)) {
        return ret;
      } else {
        throw createI18nError(
          14
          /* UNEXPECTED_RETURN_TYPE */
        );
      }
    }
    function t(...args) {
      return wrapWithDeps((context) => translate(context, ...args), () => parseTranslateArgs(...args), "translate", (root) => root.t(...args), (key) => key, (val) => isString(val));
    }
    function rt(...args) {
      const [arg1, arg2, arg3] = args;
      if (arg3 && !isObject$1(arg3)) {
        throw createI18nError(
          15
          /* INVALID_ARGUMENT */
        );
      }
      return t(...[arg1, arg2, assign$2({ resolvedMessage: true }, arg3 || {})]);
    }
    function d(...args) {
      return wrapWithDeps((context) => datetime(context, ...args), () => parseDateTimeArgs(...args), "datetime format", (root) => root.d(...args), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
    }
    function n(...args) {
      return wrapWithDeps((context) => number(context, ...args), () => parseNumberArgs(...args), "number format", (root) => root.n(...args), () => MISSING_RESOLVE_VALUE, (val) => isString(val));
    }
    function normalize(values) {
      return values.map((val) => isString(val) ? vue.createVNode(vue.Text, null, val, 0) : val);
    }
    const interpolate = (val) => val;
    const processor = {
      normalize,
      interpolate,
      type: "vnode"
    };
    function transrateVNode(...args) {
      return wrapWithDeps(
        (context) => {
          let ret;
          const _context2 = context;
          try {
            _context2.processor = processor;
            ret = translate(_context2, ...args);
          } finally {
            _context2.processor = null;
          }
          return ret;
        },
        () => parseTranslateArgs(...args),
        "translate",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root) => root[TransrateVNodeSymbol](...args),
        (key) => [vue.createVNode(vue.Text, null, key, 0)],
        (val) => isArray(val)
      );
    }
    function numberParts(...args) {
      return wrapWithDeps(
        (context) => number(context, ...args),
        () => parseNumberArgs(...args),
        "number format",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root) => root[NumberPartsSymbol](...args),
        () => [],
        (val) => isString(val) || isArray(val)
      );
    }
    function datetimeParts(...args) {
      return wrapWithDeps(
        (context) => datetime(context, ...args),
        () => parseDateTimeArgs(...args),
        "datetime format",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root) => root[DatetimePartsSymbol](...args),
        () => [],
        (val) => isString(val) || isArray(val)
      );
    }
    function setPluralRules(rules) {
      _pluralRules = rules;
      _context.pluralRules = _pluralRules;
    }
    function te(key, locale2) {
      const targetLocale = isString(locale2) ? locale2 : _locale.value;
      const message = getLocaleMessage(targetLocale);
      return resolveValue(message, key) !== null;
    }
    function resolveMessages(key) {
      let messages22 = null;
      const locales = getLocaleChain(_context, _fallbackLocale.value, _locale.value);
      for (let i = 0; i < locales.length; i++) {
        const targetLocaleMessages = _messages.value[locales[i]] || {};
        const messageValue = resolveValue(targetLocaleMessages, key);
        if (messageValue != null) {
          messages22 = messageValue;
          break;
        }
      }
      return messages22;
    }
    function tm(key) {
      const messages22 = resolveMessages(key);
      return messages22 != null ? messages22 : __root ? __root.tm(key) || {} : {};
    }
    function getLocaleMessage(locale2) {
      return _messages.value[locale2] || {};
    }
    function setLocaleMessage(locale2, message) {
      _messages.value[locale2] = message;
      _context.messages = _messages.value;
    }
    function mergeLocaleMessage(locale2, message) {
      _messages.value[locale2] = _messages.value[locale2] || {};
      deepCopy(message, _messages.value[locale2]);
      _context.messages = _messages.value;
    }
    function getDateTimeFormat(locale2) {
      return _datetimeFormats.value[locale2] || {};
    }
    function setDateTimeFormat(locale2, format2) {
      _datetimeFormats.value[locale2] = format2;
      _context.datetimeFormats = _datetimeFormats.value;
      clearDateTimeFormat(_context, locale2, format2);
    }
    function mergeDateTimeFormat(locale2, format2) {
      _datetimeFormats.value[locale2] = assign$2(_datetimeFormats.value[locale2] || {}, format2);
      _context.datetimeFormats = _datetimeFormats.value;
      clearDateTimeFormat(_context, locale2, format2);
    }
    function getNumberFormat(locale2) {
      return _numberFormats.value[locale2] || {};
    }
    function setNumberFormat(locale2, format2) {
      _numberFormats.value[locale2] = format2;
      _context.numberFormats = _numberFormats.value;
      clearNumberFormat(_context, locale2, format2);
    }
    function mergeNumberFormat(locale2, format2) {
      _numberFormats.value[locale2] = assign$2(_numberFormats.value[locale2] || {}, format2);
      _context.numberFormats = _numberFormats.value;
      clearNumberFormat(_context, locale2, format2);
    }
    composerID++;
    if (__root) {
      vue.watch(__root.locale, (val) => {
        if (_inheritLocale) {
          _locale.value = val;
          _context.locale = val;
          updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
        }
      });
      vue.watch(__root.fallbackLocale, (val) => {
        if (_inheritLocale) {
          _fallbackLocale.value = val;
          _context.fallbackLocale = val;
          updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
        }
      });
    }
    const composer = {
      id: composerID,
      locale,
      fallbackLocale,
      get inheritLocale() {
        return _inheritLocale;
      },
      set inheritLocale(val) {
        _inheritLocale = val;
        if (val && __root) {
          _locale.value = __root.locale.value;
          _fallbackLocale.value = __root.fallbackLocale.value;
          updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
        }
      },
      get availableLocales() {
        return Object.keys(_messages.value).sort();
      },
      messages: messages2,
      datetimeFormats,
      numberFormats,
      get modifiers() {
        return _modifiers;
      },
      get pluralRules() {
        return _pluralRules || {};
      },
      get isGlobal() {
        return _isGlobal;
      },
      get missingWarn() {
        return _missingWarn;
      },
      set missingWarn(val) {
        _missingWarn = val;
        _context.missingWarn = _missingWarn;
      },
      get fallbackWarn() {
        return _fallbackWarn;
      },
      set fallbackWarn(val) {
        _fallbackWarn = val;
        _context.fallbackWarn = _fallbackWarn;
      },
      get fallbackRoot() {
        return _fallbackRoot;
      },
      set fallbackRoot(val) {
        _fallbackRoot = val;
      },
      get fallbackFormat() {
        return _fallbackFormat;
      },
      set fallbackFormat(val) {
        _fallbackFormat = val;
        _context.fallbackFormat = _fallbackFormat;
      },
      get warnHtmlMessage() {
        return _warnHtmlMessage;
      },
      set warnHtmlMessage(val) {
        _warnHtmlMessage = val;
        _context.warnHtmlMessage = val;
      },
      get escapeParameter() {
        return _escapeParameter;
      },
      set escapeParameter(val) {
        _escapeParameter = val;
        _context.escapeParameter = val;
      },
      t,
      rt,
      d,
      n,
      te,
      tm,
      getLocaleMessage,
      setLocaleMessage,
      mergeLocaleMessage,
      getDateTimeFormat,
      setDateTimeFormat,
      mergeDateTimeFormat,
      getNumberFormat,
      setNumberFormat,
      mergeNumberFormat,
      getPostTranslationHandler,
      setPostTranslationHandler,
      getMissingHandler,
      setMissingHandler,
      [TransrateVNodeSymbol]: transrateVNode,
      [NumberPartsSymbol]: numberParts,
      [DatetimePartsSymbol]: datetimeParts,
      [SetPluralRulesSymbol]: setPluralRules,
      [InejctWithOption]: options.__injectWithOption
      // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    {
      composer[EnableEmitter] = (emitter) => {
        _context.__v_emitter = emitter;
      };
      composer[DisableEmitter] = () => {
        _context.__v_emitter = void 0;
      };
    }
    return composer;
  }
  function convertComposerOptions(options) {
    const locale = isString(options.locale) ? options.locale : "en-US";
    const fallbackLocale = isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject$1(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
    const missing = isFunction(options.missing) ? options.missing : void 0;
    const missingWarn = isBoolean(options.silentTranslationWarn) || isRegExp(options.silentTranslationWarn) ? !options.silentTranslationWarn : true;
    const fallbackWarn = isBoolean(options.silentFallbackWarn) || isRegExp(options.silentFallbackWarn) ? !options.silentFallbackWarn : true;
    const fallbackRoot = isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
    const fallbackFormat = !!options.formatFallbackMessages;
    const modifiers = isPlainObject$1(options.modifiers) ? options.modifiers : {};
    const pluralizationRules = options.pluralizationRules;
    const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : void 0;
    const warnHtmlMessage = isString(options.warnHtmlInMessage) ? options.warnHtmlInMessage !== "off" : true;
    const escapeParameter = !!options.escapeParameterHtml;
    const inheritLocale = isBoolean(options.sync) ? options.sync : true;
    if (options.formatter) {
      warn(getWarnMessage(
        8
        /* NOT_SUPPORTED_FORMATTER */
      ));
    }
    if (options.preserveDirectiveContent) {
      warn(getWarnMessage(
        9
        /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
      ));
    }
    let messages2 = options.messages;
    if (isPlainObject$1(options.sharedMessages)) {
      const sharedMessages = options.sharedMessages;
      const locales = Object.keys(sharedMessages);
      messages2 = locales.reduce((messages22, locale2) => {
        const message = messages22[locale2] || (messages22[locale2] = {});
        assign$2(message, sharedMessages[locale2]);
        return messages22;
      }, messages2 || {});
    }
    const { __i18n, __root, __injectWithOption } = options;
    const datetimeFormats = options.datetimeFormats;
    const numberFormats = options.numberFormats;
    const flatJson = options.flatJson;
    return {
      locale,
      fallbackLocale,
      messages: messages2,
      flatJson,
      datetimeFormats,
      numberFormats,
      missing,
      missingWarn,
      fallbackWarn,
      fallbackRoot,
      fallbackFormat,
      modifiers,
      pluralRules: pluralizationRules,
      postTranslation,
      warnHtmlMessage,
      escapeParameter,
      inheritLocale,
      __i18n,
      __root,
      __injectWithOption
    };
  }
  function createVueI18n(options = {}) {
    const composer = createComposer(convertComposerOptions(options));
    const vueI18n = {
      // id
      id: composer.id,
      // locale
      get locale() {
        return composer.locale.value;
      },
      set locale(val) {
        composer.locale.value = val;
      },
      // fallbackLocale
      get fallbackLocale() {
        return composer.fallbackLocale.value;
      },
      set fallbackLocale(val) {
        composer.fallbackLocale.value = val;
      },
      // messages
      get messages() {
        return composer.messages.value;
      },
      // datetimeFormats
      get datetimeFormats() {
        return composer.datetimeFormats.value;
      },
      // numberFormats
      get numberFormats() {
        return composer.numberFormats.value;
      },
      // availableLocales
      get availableLocales() {
        return composer.availableLocales;
      },
      // formatter
      get formatter() {
        warn(getWarnMessage(
          8
          /* NOT_SUPPORTED_FORMATTER */
        ));
        return {
          interpolate() {
            return [];
          }
        };
      },
      set formatter(val) {
        warn(getWarnMessage(
          8
          /* NOT_SUPPORTED_FORMATTER */
        ));
      },
      // missing
      get missing() {
        return composer.getMissingHandler();
      },
      set missing(handler) {
        composer.setMissingHandler(handler);
      },
      // silentTranslationWarn
      get silentTranslationWarn() {
        return isBoolean(composer.missingWarn) ? !composer.missingWarn : composer.missingWarn;
      },
      set silentTranslationWarn(val) {
        composer.missingWarn = isBoolean(val) ? !val : val;
      },
      // silentFallbackWarn
      get silentFallbackWarn() {
        return isBoolean(composer.fallbackWarn) ? !composer.fallbackWarn : composer.fallbackWarn;
      },
      set silentFallbackWarn(val) {
        composer.fallbackWarn = isBoolean(val) ? !val : val;
      },
      // modifiers
      get modifiers() {
        return composer.modifiers;
      },
      // formatFallbackMessages
      get formatFallbackMessages() {
        return composer.fallbackFormat;
      },
      set formatFallbackMessages(val) {
        composer.fallbackFormat = val;
      },
      // postTranslation
      get postTranslation() {
        return composer.getPostTranslationHandler();
      },
      set postTranslation(handler) {
        composer.setPostTranslationHandler(handler);
      },
      // sync
      get sync() {
        return composer.inheritLocale;
      },
      set sync(val) {
        composer.inheritLocale = val;
      },
      // warnInHtmlMessage
      get warnHtmlInMessage() {
        return composer.warnHtmlMessage ? "warn" : "off";
      },
      set warnHtmlInMessage(val) {
        composer.warnHtmlMessage = val !== "off";
      },
      // escapeParameterHtml
      get escapeParameterHtml() {
        return composer.escapeParameter;
      },
      set escapeParameterHtml(val) {
        composer.escapeParameter = val;
      },
      // preserveDirectiveContent
      get preserveDirectiveContent() {
        warn(getWarnMessage(
          9
          /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
        ));
        return true;
      },
      set preserveDirectiveContent(val) {
        warn(getWarnMessage(
          9
          /* NOT_SUPPORTED_PRESERVE_DIRECTIVE */
        ));
      },
      // pluralizationRules
      get pluralizationRules() {
        return composer.pluralRules || {};
      },
      // for internal
      __composer: composer,
      // t
      t(...args) {
        const [arg1, arg2, arg3] = args;
        const options2 = {};
        let list = null;
        let named = null;
        if (!isString(arg1)) {
          throw createI18nError(
            15
            /* INVALID_ARGUMENT */
          );
        }
        const key = arg1;
        if (isString(arg2)) {
          options2.locale = arg2;
        } else if (isArray(arg2)) {
          list = arg2;
        } else if (isPlainObject$1(arg2)) {
          named = arg2;
        }
        if (isArray(arg3)) {
          list = arg3;
        } else if (isPlainObject$1(arg3)) {
          named = arg3;
        }
        return composer.t(key, list || named || {}, options2);
      },
      rt(...args) {
        return composer.rt(...args);
      },
      // tc
      tc(...args) {
        const [arg1, arg2, arg3] = args;
        const options2 = { plural: 1 };
        let list = null;
        let named = null;
        if (!isString(arg1)) {
          throw createI18nError(
            15
            /* INVALID_ARGUMENT */
          );
        }
        const key = arg1;
        if (isString(arg2)) {
          options2.locale = arg2;
        } else if (isNumber(arg2)) {
          options2.plural = arg2;
        } else if (isArray(arg2)) {
          list = arg2;
        } else if (isPlainObject$1(arg2)) {
          named = arg2;
        }
        if (isString(arg3)) {
          options2.locale = arg3;
        } else if (isArray(arg3)) {
          list = arg3;
        } else if (isPlainObject$1(arg3)) {
          named = arg3;
        }
        return composer.t(key, list || named || {}, options2);
      },
      // te
      te(key, locale) {
        return composer.te(key, locale);
      },
      // tm
      tm(key) {
        return composer.tm(key);
      },
      // getLocaleMessage
      getLocaleMessage(locale) {
        return composer.getLocaleMessage(locale);
      },
      // setLocaleMessage
      setLocaleMessage(locale, message) {
        composer.setLocaleMessage(locale, message);
      },
      // mergeLocaleMessage
      mergeLocaleMessage(locale, message) {
        composer.mergeLocaleMessage(locale, message);
      },
      // d
      d(...args) {
        return composer.d(...args);
      },
      // getDateTimeFormat
      getDateTimeFormat(locale) {
        return composer.getDateTimeFormat(locale);
      },
      // setDateTimeFormat
      setDateTimeFormat(locale, format2) {
        composer.setDateTimeFormat(locale, format2);
      },
      // mergeDateTimeFormat
      mergeDateTimeFormat(locale, format2) {
        composer.mergeDateTimeFormat(locale, format2);
      },
      // n
      n(...args) {
        return composer.n(...args);
      },
      // getNumberFormat
      getNumberFormat(locale) {
        return composer.getNumberFormat(locale);
      },
      // setNumberFormat
      setNumberFormat(locale, format2) {
        composer.setNumberFormat(locale, format2);
      },
      // mergeNumberFormat
      mergeNumberFormat(locale, format2) {
        composer.mergeNumberFormat(locale, format2);
      },
      // getChoiceIndex
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getChoiceIndex(choice, choicesLength) {
        warn(getWarnMessage(
          10
          /* NOT_SUPPORTED_GET_CHOICE_INDEX */
        ));
        return -1;
      },
      // for internal
      __onComponentInstanceCreated(target) {
        const { componentInstanceCreatedListener } = options;
        if (componentInstanceCreatedListener) {
          componentInstanceCreatedListener(target, vueI18n);
        }
      }
    };
    {
      vueI18n.__enableEmitter = (emitter) => {
        const __composer = composer;
        __composer[EnableEmitter] && __composer[EnableEmitter](emitter);
      };
      vueI18n.__disableEmitter = () => {
        const __composer = composer;
        __composer[DisableEmitter] && __composer[DisableEmitter]();
      };
    }
    return vueI18n;
  }
  const baseFormatProps = {
    tag: {
      type: [String, Object]
    },
    locale: {
      type: String
    },
    scope: {
      type: String,
      validator: (val) => val === "parent" || val === "global",
      default: "parent"
    },
    i18n: {
      type: Object
    }
  };
  const Translation = {
    /* eslint-disable */
    name: "i18n-t",
    props: assign$2({
      keypath: {
        type: String,
        required: true
      },
      plural: {
        type: [Number, String],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: (val) => isNumber(val) || !isNaN(val)
      }
    }, baseFormatProps),
    /* eslint-enable */
    setup(props, context) {
      const { slots, attrs } = context;
      const i18n2 = props.i18n || useI18n({
        useScope: props.scope,
        __useComponent: true
      });
      const keys = Object.keys(slots).filter((key) => key !== "_");
      return () => {
        const options = {};
        if (props.locale) {
          options.locale = props.locale;
        }
        if (props.plural !== void 0) {
          options.plural = isString(props.plural) ? +props.plural : props.plural;
        }
        const arg = getInterpolateArg(context, keys);
        const children = i18n2[TransrateVNodeSymbol](props.keypath, arg, options);
        const assignedAttrs = assign$2({}, attrs);
        return isString(props.tag) ? vue.h(props.tag, assignedAttrs, children) : isObject$1(props.tag) ? vue.h(props.tag, assignedAttrs, children) : vue.h(vue.Fragment, assignedAttrs, children);
      };
    }
  };
  function getInterpolateArg({ slots }, keys) {
    if (keys.length === 1 && keys[0] === "default") {
      return slots.default ? slots.default() : [];
    } else {
      return keys.reduce((arg, key) => {
        const slot = slots[key];
        if (slot) {
          arg[key] = slot();
        }
        return arg;
      }, {});
    }
  }
  function renderFormatter(props, context, slotKeys, partFormatter) {
    const { slots, attrs } = context;
    return () => {
      const options = { part: true };
      let overrides = {};
      if (props.locale) {
        options.locale = props.locale;
      }
      if (isString(props.format)) {
        options.key = props.format;
      } else if (isObject$1(props.format)) {
        if (isString(props.format.key)) {
          options.key = props.format.key;
        }
        overrides = Object.keys(props.format).reduce((options2, prop) => {
          return slotKeys.includes(prop) ? assign$2({}, options2, { [prop]: props.format[prop] }) : options2;
        }, {});
      }
      const parts = partFormatter(...[props.value, options, overrides]);
      let children = [options.key];
      if (isArray(parts)) {
        children = parts.map((part, index) => {
          const slot = slots[part.type];
          return slot ? slot({ [part.type]: part.value, index, parts }) : [part.value];
        });
      } else if (isString(parts)) {
        children = [parts];
      }
      const assignedAttrs = assign$2({}, attrs);
      return isString(props.tag) ? vue.h(props.tag, assignedAttrs, children) : isObject$1(props.tag) ? vue.h(props.tag, assignedAttrs, children) : vue.h(vue.Fragment, assignedAttrs, children);
    };
  }
  const NUMBER_FORMAT_KEYS = [
    "localeMatcher",
    "style",
    "unit",
    "unitDisplay",
    "currency",
    "currencyDisplay",
    "useGrouping",
    "numberingSystem",
    "minimumIntegerDigits",
    "minimumFractionDigits",
    "maximumFractionDigits",
    "minimumSignificantDigits",
    "maximumSignificantDigits",
    "notation",
    "formatMatcher"
  ];
  const NumberFormat = {
    /* eslint-disable */
    name: "i18n-n",
    props: assign$2({
      value: {
        type: Number,
        required: true
      },
      format: {
        type: [String, Object]
      }
    }, baseFormatProps),
    /* eslint-enable */
    setup(props, context) {
      const i18n2 = props.i18n || useI18n({ useScope: "parent", __useComponent: true });
      return renderFormatter(props, context, NUMBER_FORMAT_KEYS, (...args) => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        i18n2[NumberPartsSymbol](...args)
      ));
    }
  };
  const DATETIME_FORMAT_KEYS = [
    "dateStyle",
    "timeStyle",
    "fractionalSecondDigits",
    "calendar",
    "dayPeriod",
    "numberingSystem",
    "localeMatcher",
    "timeZone",
    "hour12",
    "hourCycle",
    "formatMatcher",
    "weekday",
    "era",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "timeZoneName"
  ];
  const DatetimeFormat = {
    /* eslint-disable */
    name: "i18n-d",
    props: assign$2({
      value: {
        type: [Number, Date],
        required: true
      },
      format: {
        type: [String, Object]
      }
    }, baseFormatProps),
    /* eslint-enable */
    setup(props, context) {
      const i18n2 = props.i18n || useI18n({ useScope: "parent", __useComponent: true });
      return renderFormatter(props, context, DATETIME_FORMAT_KEYS, (...args) => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        i18n2[DatetimePartsSymbol](...args)
      ));
    }
  };
  function getComposer$2(i18n2, instance) {
    const i18nInternal = i18n2;
    if (i18n2.mode === "composition") {
      return i18nInternal.__getInstance(instance) || i18n2.global;
    } else {
      const vueI18n = i18nInternal.__getInstance(instance);
      return vueI18n != null ? vueI18n.__composer : i18n2.global.__composer;
    }
  }
  function vTDirective(i18n2) {
    const bind = (el, { instance, value, modifiers }) => {
      if (!instance || !instance.$) {
        throw createI18nError(
          22
          /* UNEXPECTED_ERROR */
        );
      }
      const composer = getComposer$2(i18n2, instance.$);
      if (modifiers.preserve) {
        warn(getWarnMessage(
          7
          /* NOT_SUPPORTED_PRESERVE */
        ));
      }
      const parsedValue = parseValue(value);
      el.textContent = composer.t(...makeParams(parsedValue));
    };
    return {
      beforeMount: bind,
      beforeUpdate: bind
    };
  }
  function parseValue(value) {
    if (isString(value)) {
      return { path: value };
    } else if (isPlainObject$1(value)) {
      if (!("path" in value)) {
        throw createI18nError(19, "path");
      }
      return value;
    } else {
      throw createI18nError(
        20
        /* INVALID_VALUE */
      );
    }
  }
  function makeParams(value) {
    const { path, locale, args, choice, plural } = value;
    const options = {};
    const named = args || {};
    if (isString(locale)) {
      options.locale = locale;
    }
    if (isNumber(choice)) {
      options.plural = choice;
    }
    if (isNumber(plural)) {
      options.plural = plural;
    }
    return [path, named, options];
  }
  function apply(app, i18n2, ...options) {
    const pluginOptions = isPlainObject$1(options[0]) ? options[0] : {};
    const useI18nComponentName = !!pluginOptions.useI18nComponentName;
    const globalInstall = isBoolean(pluginOptions.globalInstall) ? pluginOptions.globalInstall : true;
    if (globalInstall && useI18nComponentName) {
      warn(getWarnMessage(11, {
        name: Translation.name
      }));
    }
    if (globalInstall) {
      app.component(!useI18nComponentName ? Translation.name : "i18n", Translation);
      app.component(NumberFormat.name, NumberFormat);
      app.component(DatetimeFormat.name, DatetimeFormat);
    }
    app.directive("t", vTDirective(i18n2));
  }
  const VUE_I18N_COMPONENT_TYPES = "vue-i18n: composer properties";
  let devtoolsApi;
  async function enableDevTools(app, i18n2) {
    return new Promise((resolve, reject) => {
      try {
        setupDevtoolsPlugin$1({
          id: "vue-devtools-plugin-vue-i18n",
          label: VueDevToolsLabels[
            "vue-devtools-plugin-vue-i18n"
            /* PLUGIN */
          ],
          packageName: "vue-i18n",
          homepage: "https://vue-i18n.intlify.dev",
          logo: "https://vue-i18n.intlify.dev/vue-i18n-devtools-logo.png",
          componentStateTypes: [VUE_I18N_COMPONENT_TYPES],
          app
        }, (api2) => {
          devtoolsApi = api2;
          api2.on.visitComponentTree(({ componentInstance, treeNode }) => {
            updateComponentTreeTags(componentInstance, treeNode, i18n2);
          });
          api2.on.inspectComponent(({ componentInstance, instanceData }) => {
            if (componentInstance.vnode.el.__VUE_I18N__ && instanceData) {
              if (i18n2.mode === "legacy") {
                if (componentInstance.vnode.el.__VUE_I18N__ !== i18n2.global.__composer) {
                  inspectComposer(instanceData, componentInstance.vnode.el.__VUE_I18N__);
                }
              } else {
                inspectComposer(instanceData, componentInstance.vnode.el.__VUE_I18N__);
              }
            }
          });
          api2.addInspector({
            id: "vue-i18n-resource-inspector",
            label: VueDevToolsLabels[
              "vue-i18n-resource-inspector"
              /* CUSTOM_INSPECTOR */
            ],
            icon: "language",
            treeFilterPlaceholder: VueDevToolsPlaceholders[
              "vue-i18n-resource-inspector"
              /* CUSTOM_INSPECTOR */
            ]
          });
          api2.on.getInspectorTree((payload) => {
            if (payload.app === app && payload.inspectorId === "vue-i18n-resource-inspector") {
              registerScope(payload, i18n2);
            }
          });
          api2.on.getInspectorState((payload) => {
            if (payload.app === app && payload.inspectorId === "vue-i18n-resource-inspector") {
              inspectScope(payload, i18n2);
            }
          });
          api2.on.editInspectorState((payload) => {
            if (payload.app === app && payload.inspectorId === "vue-i18n-resource-inspector") {
              editScope(payload, i18n2);
            }
          });
          api2.addTimelineLayer({
            id: "vue-i18n-timeline",
            label: VueDevToolsLabels[
              "vue-i18n-timeline"
              /* TIMELINE */
            ],
            color: VueDevToolsTimelineColors[
              "vue-i18n-timeline"
              /* TIMELINE */
            ]
          });
          resolve(true);
        });
      } catch (e) {
        console.error(e);
        reject(false);
      }
    });
  }
  function updateComponentTreeTags(instance, treeNode, i18n2) {
    const global2 = i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    if (instance && instance.vnode.el.__VUE_I18N__) {
      if (instance.vnode.el.__VUE_I18N__ !== global2) {
        const label = instance.type.name || instance.type.displayName || instance.type.__file;
        const tag = {
          label: `i18n (${label} Scope)`,
          textColor: 0,
          backgroundColor: 16764185
        };
        treeNode.tags.push(tag);
      }
    }
  }
  function inspectComposer(instanceData, composer) {
    const type = VUE_I18N_COMPONENT_TYPES;
    instanceData.state.push({
      type,
      key: "locale",
      editable: true,
      value: composer.locale.value
    });
    instanceData.state.push({
      type,
      key: "availableLocales",
      editable: false,
      value: composer.availableLocales
    });
    instanceData.state.push({
      type,
      key: "fallbackLocale",
      editable: true,
      value: composer.fallbackLocale.value
    });
    instanceData.state.push({
      type,
      key: "inheritLocale",
      editable: true,
      value: composer.inheritLocale
    });
    instanceData.state.push({
      type,
      key: "messages",
      editable: false,
      value: getLocaleMessageValue(composer.messages.value)
    });
    instanceData.state.push({
      type,
      key: "datetimeFormats",
      editable: false,
      value: composer.datetimeFormats.value
    });
    instanceData.state.push({
      type,
      key: "numberFormats",
      editable: false,
      value: composer.numberFormats.value
    });
  }
  function getLocaleMessageValue(messages2) {
    const value = {};
    Object.keys(messages2).forEach((key) => {
      const v = messages2[key];
      if (isFunction(v) && "source" in v) {
        value[key] = getMessageFunctionDetails(v);
      } else if (isObject$1(v)) {
        value[key] = getLocaleMessageValue(v);
      } else {
        value[key] = v;
      }
    });
    return value;
  }
  const ESC = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "&": "&amp;"
  };
  function escape(s) {
    return s.replace(/[<>"&]/g, escapeChar);
  }
  function escapeChar(a) {
    return ESC[a] || a;
  }
  function getMessageFunctionDetails(func) {
    const argString = func.source ? `("${escape(func.source)}")` : `(?)`;
    return {
      _custom: {
        type: "function",
        display: `<span>ƒ</span> ${argString}`
      }
    };
  }
  function registerScope(payload, i18n2) {
    payload.rootNodes.push({
      id: "global",
      label: "Global Scope"
    });
    const global2 = i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    for (const [keyInstance, instance] of i18n2.__instances) {
      const composer = i18n2.mode === "composition" ? instance : instance.__composer;
      if (global2 === composer) {
        continue;
      }
      const label = keyInstance.type.name || keyInstance.type.displayName || keyInstance.type.__file;
      payload.rootNodes.push({
        id: composer.id.toString(),
        label: `${label} Scope`
      });
    }
  }
  function getComposer$1(nodeId, i18n2) {
    if (nodeId === "global") {
      return i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    } else {
      const instance = Array.from(i18n2.__instances.values()).find((item) => item.id.toString() === nodeId);
      if (instance) {
        return i18n2.mode === "composition" ? instance : instance.__composer;
      } else {
        return null;
      }
    }
  }
  function inspectScope(payload, i18n2) {
    const composer = getComposer$1(payload.nodeId, i18n2);
    if (composer) {
      payload.state = makeScopeInspectState(composer);
    }
  }
  function makeScopeInspectState(composer) {
    const state = {};
    const localeType = "Locale related info";
    const localeStates = [
      {
        type: localeType,
        key: "locale",
        editable: true,
        value: composer.locale.value
      },
      {
        type: localeType,
        key: "fallbackLocale",
        editable: true,
        value: composer.fallbackLocale.value
      },
      {
        type: localeType,
        key: "availableLocales",
        editable: false,
        value: composer.availableLocales
      },
      {
        type: localeType,
        key: "inheritLocale",
        editable: true,
        value: composer.inheritLocale
      }
    ];
    state[localeType] = localeStates;
    const localeMessagesType = "Locale messages info";
    const localeMessagesStates = [
      {
        type: localeMessagesType,
        key: "messages",
        editable: false,
        value: getLocaleMessageValue(composer.messages.value)
      }
    ];
    state[localeMessagesType] = localeMessagesStates;
    const datetimeFormatsType = "Datetime formats info";
    const datetimeFormatsStates = [
      {
        type: datetimeFormatsType,
        key: "datetimeFormats",
        editable: false,
        value: composer.datetimeFormats.value
      }
    ];
    state[datetimeFormatsType] = datetimeFormatsStates;
    const numberFormatsType = "Datetime formats info";
    const numberFormatsStates = [
      {
        type: numberFormatsType,
        key: "numberFormats",
        editable: false,
        value: composer.numberFormats.value
      }
    ];
    state[numberFormatsType] = numberFormatsStates;
    return state;
  }
  function addTimelineEvent(event, payload) {
    if (devtoolsApi) {
      let groupId;
      if (payload && "groupId" in payload) {
        groupId = payload.groupId;
        delete payload.groupId;
      }
      devtoolsApi.addTimelineEvent({
        layerId: "vue-i18n-timeline",
        event: {
          title: event,
          groupId,
          time: Date.now(),
          meta: {},
          data: payload || {},
          logType: event === "compile-error" ? "error" : event === "fallback" || event === "missing" ? "warning" : "default"
        }
      });
    }
  }
  function editScope(payload, i18n2) {
    const composer = getComposer$1(payload.nodeId, i18n2);
    if (composer) {
      const [field] = payload.path;
      if (field === "locale" && isString(payload.state.value)) {
        composer.locale.value = payload.state.value;
      } else if (field === "fallbackLocale" && (isString(payload.state.value) || isArray(payload.state.value) || isObject$1(payload.state.value))) {
        composer.fallbackLocale.value = payload.state.value;
      } else if (field === "inheritLocale" && isBoolean(payload.state.value)) {
        composer.inheritLocale = payload.state.value;
      }
    }
  }
  function defineMixin(vuei18n, composer, i18n2) {
    return {
      beforeCreate() {
        const instance = vue.getCurrentInstance();
        if (!instance) {
          throw createI18nError(
            22
            /* UNEXPECTED_ERROR */
          );
        }
        const options = this.$options;
        if (options.i18n) {
          const optionsI18n = options.i18n;
          if (options.__i18n) {
            optionsI18n.__i18n = options.__i18n;
          }
          optionsI18n.__root = composer;
          if (this === this.$root) {
            this.$i18n = mergeToRoot(vuei18n, optionsI18n);
          } else {
            optionsI18n.__injectWithOption = true;
            this.$i18n = createVueI18n(optionsI18n);
          }
        } else if (options.__i18n) {
          if (this === this.$root) {
            this.$i18n = mergeToRoot(vuei18n, options);
          } else {
            this.$i18n = createVueI18n({
              __i18n: options.__i18n,
              __injectWithOption: true,
              __root: composer
            });
          }
        } else {
          this.$i18n = vuei18n;
        }
        vuei18n.__onComponentInstanceCreated(this.$i18n);
        i18n2.__setInstance(instance, this.$i18n);
        this.$t = (...args) => this.$i18n.t(...args);
        this.$rt = (...args) => this.$i18n.rt(...args);
        this.$tc = (...args) => this.$i18n.tc(...args);
        this.$te = (key, locale) => this.$i18n.te(key, locale);
        this.$d = (...args) => this.$i18n.d(...args);
        this.$n = (...args) => this.$i18n.n(...args);
        this.$tm = (key) => this.$i18n.tm(key);
      },
      mounted() {
        {
          this.$el.__VUE_I18N__ = this.$i18n.__composer;
          const emitter = this.__v_emitter = createEmitter();
          const _vueI18n = this.$i18n;
          _vueI18n.__enableEmitter && _vueI18n.__enableEmitter(emitter);
          emitter.on("*", addTimelineEvent);
        }
      },
      beforeUnmount() {
        const instance = vue.getCurrentInstance();
        if (!instance) {
          throw createI18nError(
            22
            /* UNEXPECTED_ERROR */
          );
        }
        {
          if (this.__v_emitter) {
            this.__v_emitter.off("*", addTimelineEvent);
            delete this.__v_emitter;
          }
          const _vueI18n = this.$i18n;
          _vueI18n.__disableEmitter && _vueI18n.__disableEmitter();
          delete this.$el.__VUE_I18N__;
        }
        delete this.$t;
        delete this.$rt;
        delete this.$tc;
        delete this.$te;
        delete this.$d;
        delete this.$n;
        delete this.$tm;
        i18n2.__deleteInstance(instance);
        delete this.$i18n;
      }
    };
  }
  function mergeToRoot(root, options) {
    root.locale = options.locale || root.locale;
    root.fallbackLocale = options.fallbackLocale || root.fallbackLocale;
    root.missing = options.missing || root.missing;
    root.silentTranslationWarn = options.silentTranslationWarn || root.silentFallbackWarn;
    root.silentFallbackWarn = options.silentFallbackWarn || root.silentFallbackWarn;
    root.formatFallbackMessages = options.formatFallbackMessages || root.formatFallbackMessages;
    root.postTranslation = options.postTranslation || root.postTranslation;
    root.warnHtmlInMessage = options.warnHtmlInMessage || root.warnHtmlInMessage;
    root.escapeParameterHtml = options.escapeParameterHtml || root.escapeParameterHtml;
    root.sync = options.sync || root.sync;
    root.__composer[SetPluralRulesSymbol](options.pluralizationRules || root.pluralizationRules);
    const messages2 = getLocaleMessages(root.locale, {
      messages: options.messages,
      __i18n: options.__i18n
    });
    Object.keys(messages2).forEach((locale) => root.mergeLocaleMessage(locale, messages2[locale]));
    if (options.datetimeFormats) {
      Object.keys(options.datetimeFormats).forEach((locale) => root.mergeDateTimeFormat(locale, options.datetimeFormats[locale]));
    }
    if (options.numberFormats) {
      Object.keys(options.numberFormats).forEach((locale) => root.mergeNumberFormat(locale, options.numberFormats[locale]));
    }
    return root;
  }
  function createI18n(options = {}) {
    const __legacyMode = isBoolean(options.legacy) ? options.legacy : true;
    const __globalInjection = !!options.globalInjection;
    const __instances = /* @__PURE__ */ new Map();
    const __global = __legacyMode ? createVueI18n(options) : createComposer(options);
    const symbol = makeSymbol("vue-i18n");
    const i18n2 = {
      // mode
      get mode() {
        return __legacyMode ? "legacy" : "composition";
      },
      // install plugin
      async install(app, ...options2) {
        {
          app.__VUE_I18N__ = i18n2;
        }
        app.__VUE_I18N_SYMBOL__ = symbol;
        app.provide(app.__VUE_I18N_SYMBOL__, i18n2);
        if (!__legacyMode && __globalInjection) {
          injectGlobalFields(app, i18n2.global);
        }
        {
          apply(app, i18n2, ...options2);
        }
        if (__legacyMode) {
          app.mixin(defineMixin(__global, __global.__composer, i18n2));
        }
        {
          const ret = await enableDevTools(app, i18n2);
          if (!ret) {
            throw createI18nError(
              21
              /* CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN */
            );
          }
          const emitter = createEmitter();
          if (__legacyMode) {
            const _vueI18n = __global;
            _vueI18n.__enableEmitter && _vueI18n.__enableEmitter(emitter);
          } else {
            const _composer = __global;
            _composer[EnableEmitter] && _composer[EnableEmitter](emitter);
          }
          emitter.on("*", addTimelineEvent);
        }
      },
      // global accessor
      get global() {
        return __global;
      },
      // @internal
      __instances,
      // @internal
      __getInstance(component) {
        return __instances.get(component) || null;
      },
      // @internal
      __setInstance(component, instance) {
        __instances.set(component, instance);
      },
      // @internal
      __deleteInstance(component) {
        __instances.delete(component);
      }
    };
    return i18n2;
  }
  function useI18n(options = {}) {
    const instance = vue.getCurrentInstance();
    if (instance == null) {
      throw createI18nError(
        16
        /* MUST_BE_CALL_SETUP_TOP */
      );
    }
    if (!instance.appContext.app.__VUE_I18N_SYMBOL__) {
      throw createI18nError(
        17
        /* NOT_INSLALLED */
      );
    }
    const i18n2 = vue.inject(instance.appContext.app.__VUE_I18N_SYMBOL__);
    if (!i18n2) {
      throw createI18nError(
        22
        /* UNEXPECTED_ERROR */
      );
    }
    const global2 = i18n2.mode === "composition" ? i18n2.global : i18n2.global.__composer;
    const scope = isEmptyObject(options) ? "__i18n" in instance.type ? "local" : "global" : !options.useScope ? "local" : options.useScope;
    if (scope === "global") {
      let messages2 = isObject$1(options.messages) ? options.messages : {};
      if ("__i18nGlobal" in instance.type) {
        messages2 = getLocaleMessages(global2.locale.value, {
          messages: messages2,
          __i18n: instance.type.__i18nGlobal
        });
      }
      const locales = Object.keys(messages2);
      if (locales.length) {
        locales.forEach((locale) => {
          global2.mergeLocaleMessage(locale, messages2[locale]);
        });
      }
      if (isObject$1(options.datetimeFormats)) {
        const locales2 = Object.keys(options.datetimeFormats);
        if (locales2.length) {
          locales2.forEach((locale) => {
            global2.mergeDateTimeFormat(locale, options.datetimeFormats[locale]);
          });
        }
      }
      if (isObject$1(options.numberFormats)) {
        const locales2 = Object.keys(options.numberFormats);
        if (locales2.length) {
          locales2.forEach((locale) => {
            global2.mergeNumberFormat(locale, options.numberFormats[locale]);
          });
        }
      }
      return global2;
    }
    if (scope === "parent") {
      let composer2 = getComposer(i18n2, instance, options.__useComponent);
      if (composer2 == null) {
        {
          warn(getWarnMessage(
            12
            /* NOT_FOUND_PARENT_SCOPE */
          ));
        }
        composer2 = global2;
      }
      return composer2;
    }
    if (i18n2.mode === "legacy") {
      throw createI18nError(
        18
        /* NOT_AVAILABLE_IN_LEGACY_MODE */
      );
    }
    const i18nInternal = i18n2;
    let composer = i18nInternal.__getInstance(instance);
    if (composer == null) {
      const type = instance.type;
      const composerOptions = assign$2({}, options);
      if (type.__i18n) {
        composerOptions.__i18n = type.__i18n;
      }
      if (global2) {
        composerOptions.__root = global2;
      }
      composer = createComposer(composerOptions);
      setupLifeCycle(i18nInternal, instance, composer);
      i18nInternal.__setInstance(instance, composer);
    }
    return composer;
  }
  function getComposer(i18n2, target, useComponent = false) {
    let composer = null;
    const root = target.root;
    let current = target.parent;
    while (current != null) {
      const i18nInternal = i18n2;
      if (i18n2.mode === "composition") {
        composer = i18nInternal.__getInstance(current);
      } else {
        const vueI18n = i18nInternal.__getInstance(current);
        if (vueI18n != null) {
          composer = vueI18n.__composer;
        }
        if (useComponent && composer && !composer[InejctWithOption]) {
          composer = null;
        }
      }
      if (composer != null) {
        break;
      }
      if (root === current) {
        break;
      }
      current = current.parent;
    }
    return composer;
  }
  function setupLifeCycle(i18n2, target, composer) {
    let emitter = null;
    vue.onMounted(() => {
      if (target.vnode.el) {
        target.vnode.el.__VUE_I18N__ = composer;
        emitter = createEmitter();
        const _composer = composer;
        _composer[EnableEmitter] && _composer[EnableEmitter](emitter);
        emitter.on("*", addTimelineEvent);
      }
    }, target);
    vue.onUnmounted(() => {
      if (target.vnode.el && target.vnode.el.__VUE_I18N__) {
        emitter && emitter.off("*", addTimelineEvent);
        const _composer = composer;
        _composer[DisableEmitter] && _composer[DisableEmitter]();
        delete target.vnode.el.__VUE_I18N__;
      }
      i18n2.__deleteInstance(target);
    }, target);
  }
  const globalExportProps = [
    "locale",
    "fallbackLocale",
    "availableLocales"
  ];
  const globalExportMethods = ["t", "rt", "d", "n", "tm"];
  function injectGlobalFields(app, composer) {
    const i18n2 = /* @__PURE__ */ Object.create(null);
    globalExportProps.forEach((prop) => {
      const desc = Object.getOwnPropertyDescriptor(composer, prop);
      if (!desc) {
        throw createI18nError(
          22
          /* UNEXPECTED_ERROR */
        );
      }
      const wrap = vue.isRef(desc.value) ? {
        get() {
          return desc.value.value;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(val) {
          desc.value.value = val;
        }
      } : {
        get() {
          return desc.get && desc.get();
        }
      };
      Object.defineProperty(i18n2, prop, wrap);
    });
    app.config.globalProperties.$i18n = i18n2;
    globalExportMethods.forEach((method) => {
      const desc = Object.getOwnPropertyDescriptor(composer, method);
      if (!desc || !desc.value) {
        throw createI18nError(
          22
          /* UNEXPECTED_ERROR */
        );
      }
      Object.defineProperty(app.config.globalProperties, `$${method}`, desc);
    });
  }
  {
    initFeatureFlags();
  }
  {
    const target = getGlobalThis();
    target.__INTLIFY__ = true;
    setDevToolsHook(target.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__);
  }
  const ON_SHOW = "onShow";
  const ON_HIDE = "onHide";
  const ON_LAUNCH = "onLaunch";
  const ON_LOAD = "onLoad";
  const ON_PAGE_SCROLL = "onPageScroll";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onHide = /* @__PURE__ */ createHook(ON_HIDE);
  const onLaunch = /* @__PURE__ */ createHook(ON_LAUNCH);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const onPageScroll = /* @__PURE__ */ createHook(ON_PAGE_SCROLL);
  function getItem(key) {
    try {
      const v = uni.getStorageSync(key);
      if (v === "" || v == null)
        return null;
      return typeof v === "string" ? v : String(v);
    } catch {
      return null;
    }
  }
  function setItem(key, value) {
    try {
      uni.setStorageSync(key, value);
    } catch {
    }
  }
  function removeItem(key) {
    try {
      uni.removeStorageSync(key);
    } catch {
    }
  }
  function keysWithPrefix(prefix) {
    try {
      const info = uni.getStorageInfoSync();
      return (info.keys || []).filter((k) => k.startsWith(prefix));
    } catch {
      return [];
    }
  }
  function removeKeysWithPrefix(prefix) {
    for (const k of keysWithPrefix(prefix)) {
      removeItem(k);
    }
  }
  function getAuthHeaders() {
    const token = getItem("user_token");
    if (!token)
      return {};
    return { "x-token": token };
  }
  var isVue2 = false;
  function set(target, key, val) {
    if (Array.isArray(target)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val;
    }
    target[key] = val;
    return val;
  }
  function del(target, key) {
    if (Array.isArray(target)) {
      target.splice(key, 1);
      return;
    }
    delete target[key];
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a2;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a2 = global.perf_hooks) === null || _a2 === void 0 ? void 0 : _a2.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id2 in plugin.settings) {
          const item = plugin.settings[id2];
          defaultSettings[id2] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * pinia v2.1.7
   * (c) 2023 Eduardo San Martin Morote
   * @license MIT
   */
  let activePinia;
  const setActivePinia = (pinia) => activePinia = pinia;
  const piniaSymbol = Symbol("pinia");
  function isPlainObject(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  const IS_CLIENT = typeof window !== "undefined";
  const USE_DEVTOOLS = IS_CLIENT;
  const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
  function bom(blob, { autoBom = false } = {}) {
    if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
    }
    return blob;
  }
  function download(url, name, opts) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.onload = function() {
      saveAs(xhr.response, name, opts);
    };
    xhr.onerror = function() {
      console.error("could not download file");
    };
    xhr.send();
  }
  function corsEnabled(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    try {
      xhr.send();
    } catch (e) {
    }
    return xhr.status >= 200 && xhr.status <= 299;
  }
  function click(node) {
    try {
      node.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      node.dispatchEvent(evt);
    }
  }
  const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
  const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
  const saveAs = !IS_CLIENT ? () => {
  } : (
    // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
    typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
      // Use msSaveOrOpenBlob as a second approach
      "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
        // Fallback to using FileReader and a popup
        fileSaverSaveAs
      )
    )
  );
  function downloadSaveAs(blob, name = "download", opts) {
    const a = document.createElement("a");
    a.download = name;
    a.rel = "noopener";
    if (typeof blob === "string") {
      a.href = blob;
      if (a.origin !== location.origin) {
        if (corsEnabled(a.href)) {
          download(blob, name, opts);
        } else {
          a.target = "_blank";
          click(a);
        }
      } else {
        click(a);
      }
    } else {
      a.href = URL.createObjectURL(blob);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 4e4);
      setTimeout(function() {
        click(a);
      }, 0);
    }
  }
  function msSaveAs(blob, name = "download", opts) {
    if (typeof blob === "string") {
      if (corsEnabled(blob)) {
        download(blob, name, opts);
      } else {
        const a = document.createElement("a");
        a.href = blob;
        a.target = "_blank";
        setTimeout(function() {
          click(a);
        });
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
    }
  }
  function fileSaverSaveAs(blob, name, opts, popup) {
    popup = popup || open("", "_blank");
    if (popup) {
      popup.document.title = popup.document.body.innerText = "downloading...";
    }
    if (typeof blob === "string")
      return download(blob, name, opts);
    const force = blob.type === "application/octet-stream";
    const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
    if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onloadend = function() {
        let url = reader.result;
        if (typeof url !== "string") {
          popup = null;
          throw new Error("Wrong reader.result type");
        }
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup) {
          popup.location.href = url;
        } else {
          location.assign(url);
        }
        popup = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const url = URL.createObjectURL(blob);
      if (popup)
        popup.location.assign(url);
      else
        location.href = url;
      popup = null;
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 4e4);
    }
  }
  function toastMessage(message, type) {
    const piniaMessage = "🍍 " + message;
    if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
      __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
    } else if (type === "error") {
      console.error(piniaMessage);
    } else if (type === "warn") {
      console.warn(piniaMessage);
    } else {
      console.log(piniaMessage);
    }
  }
  function isPinia(o) {
    return "_a" in o && "install" in o;
  }
  function checkClipboardAccess() {
    if (!("clipboard" in navigator)) {
      toastMessage(`Your browser doesn't support the Clipboard API`, "error");
      return true;
    }
  }
  function checkNotFocusedError(error) {
    if (error instanceof Error && error.message.toLowerCase().includes("document is not focused")) {
      toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
      return true;
    }
    return false;
  }
  async function actionGlobalCopyState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(pinia.state.value));
      toastMessage("Global state copied to clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalPasteState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      loadStoresState(pinia, JSON.parse(await navigator.clipboard.readText()));
      toastMessage("Global state pasted from clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalSaveState(pinia) {
    try {
      saveAs(new Blob([JSON.stringify(pinia.state.value)], {
        type: "text/plain;charset=utf-8"
      }), "pinia-state.json");
    } catch (error) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  let fileInput;
  function getFileOpener() {
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
    }
    function openFile() {
      return new Promise((resolve, reject) => {
        fileInput.onchange = async () => {
          const files = fileInput.files;
          if (!files)
            return resolve(null);
          const file = files.item(0);
          if (!file)
            return resolve(null);
          return resolve({ text: await file.text(), file });
        };
        fileInput.oncancel = () => resolve(null);
        fileInput.onerror = reject;
        fileInput.click();
      });
    }
    return openFile;
  }
  async function actionGlobalOpenStateFile(pinia) {
    try {
      const open2 = getFileOpener();
      const result = await open2();
      if (!result)
        return;
      const { text, file } = result;
      loadStoresState(pinia, JSON.parse(text));
      toastMessage(`Global state imported from "${file.name}".`);
    } catch (error) {
      toastMessage(`Failed to import the state from JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  function loadStoresState(pinia, state) {
    for (const key in state) {
      const storeState = pinia.state.value[key];
      if (storeState) {
        Object.assign(storeState, state[key]);
      } else {
        pinia.state.value[key] = state[key];
      }
    }
  }
  function formatDisplay(display) {
    return {
      _custom: {
        display
      }
    };
  }
  const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
  const PINIA_ROOT_ID = "_root";
  function formatStoreForInspectorTree(store) {
    return isPinia(store) ? {
      id: PINIA_ROOT_ID,
      label: PINIA_ROOT_LABEL
    } : {
      id: store.$id,
      label: store.$id
    };
  }
  function formatStoreForInspectorState(store) {
    if (isPinia(store)) {
      const storeNames = Array.from(store._s.keys());
      const storeMap = store._s;
      const state2 = {
        state: storeNames.map((storeId) => ({
          editable: true,
          key: storeId,
          value: store.state.value[storeId]
        })),
        getters: storeNames.filter((id2) => storeMap.get(id2)._getters).map((id2) => {
          const store2 = storeMap.get(id2);
          return {
            editable: false,
            key: id2,
            value: store2._getters.reduce((getters, key) => {
              getters[key] = store2[key];
              return getters;
            }, {})
          };
        })
      };
      return state2;
    }
    const state = {
      state: Object.keys(store.$state).map((key) => ({
        editable: true,
        key,
        value: store.$state[key]
      }))
    };
    if (store._getters && store._getters.length) {
      state.getters = store._getters.map((getterName) => ({
        editable: false,
        key: getterName,
        value: store[getterName]
      }));
    }
    if (store._customProperties.size) {
      state.customProperties = Array.from(store._customProperties).map((key) => ({
        editable: true,
        key,
        value: store[key]
      }));
    }
    return state;
  }
  function formatEventData(events) {
    if (!events)
      return {};
    if (Array.isArray(events)) {
      return events.reduce((data, event) => {
        data.keys.push(event.key);
        data.operations.push(event.type);
        data.oldValue[event.key] = event.oldValue;
        data.newValue[event.key] = event.newValue;
        return data;
      }, {
        oldValue: {},
        keys: [],
        operations: [],
        newValue: {}
      });
    } else {
      return {
        operation: formatDisplay(events.type),
        key: formatDisplay(events.key),
        oldValue: events.oldValue,
        newValue: events.newValue
      };
    }
  }
  function formatMutationType(type) {
    switch (type) {
      case MutationType.direct:
        return "mutation";
      case MutationType.patchFunction:
        return "$patch";
      case MutationType.patchObject:
        return "$patch";
      default:
        return "unknown";
    }
  }
  let isTimelineActive = true;
  const componentStateTypes = [];
  const MUTATIONS_LAYER_ID = "pinia:mutations";
  const INSPECTOR_ID = "pinia";
  const { assign: assign$1 } = Object;
  const getStoreType = (id2) => "🍍 " + id2;
  function registerPiniaDevtools(app, pinia) {
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app
    }, (api2) => {
      if (typeof api2.now !== "function") {
        toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
      }
      api2.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: `Pinia 🍍`,
        color: 15064968
      });
      api2.addInspector({
        id: INSPECTOR_ID,
        label: "Pinia 🍍",
        icon: "storage",
        treeFilterPlaceholder: "Search stores",
        actions: [
          {
            icon: "content_copy",
            action: () => {
              actionGlobalCopyState(pinia);
            },
            tooltip: "Serialize and copy the state"
          },
          {
            icon: "content_paste",
            action: async () => {
              await actionGlobalPasteState(pinia);
              api2.sendInspectorTree(INSPECTOR_ID);
              api2.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Replace the state with the content of your clipboard"
          },
          {
            icon: "save",
            action: () => {
              actionGlobalSaveState(pinia);
            },
            tooltip: "Save the state as a JSON file"
          },
          {
            icon: "folder_open",
            action: async () => {
              await actionGlobalOpenStateFile(pinia);
              api2.sendInspectorTree(INSPECTOR_ID);
              api2.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Import the state from a JSON file"
          }
        ],
        nodeActions: [
          {
            icon: "restore",
            tooltip: 'Reset the state (with "$reset")',
            action: (nodeId) => {
              const store = pinia._s.get(nodeId);
              if (!store) {
                toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
              } else if (typeof store.$reset !== "function") {
                toastMessage(`Cannot reset "${nodeId}" store because it doesn't have a "$reset" method implemented.`, "warn");
              } else {
                store.$reset();
                toastMessage(`Store "${nodeId}" reset.`);
              }
            }
          }
        ]
      });
      api2.on.inspectComponent((payload, ctx) => {
        const proxy = payload.componentInstance && payload.componentInstance.proxy;
        if (proxy && proxy._pStores) {
          const piniaStores = payload.componentInstance.proxy._pStores;
          Object.values(piniaStores).forEach((store) => {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "state",
              editable: true,
              value: store._isOptionsAPI ? {
                _custom: {
                  value: vue.toRaw(store.$state),
                  actions: [
                    {
                      icon: "restore",
                      tooltip: "Reset the state of this store",
                      action: () => store.$reset()
                    }
                  ]
                }
              } : (
                // NOTE: workaround to unwrap transferred refs
                Object.keys(store.$state).reduce((state, key) => {
                  state[key] = store.$state[key];
                  return state;
                }, {})
              )
            });
            if (store._getters && store._getters.length) {
              payload.instanceData.state.push({
                type: getStoreType(store.$id),
                key: "getters",
                editable: false,
                value: store._getters.reduce((getters, key) => {
                  try {
                    getters[key] = store[key];
                  } catch (error) {
                    getters[key] = error;
                  }
                  return getters;
                }, {})
              });
            }
          });
        }
      });
      api2.on.getInspectorTree((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          let stores = [pinia];
          stores = stores.concat(Array.from(pinia._s.values()));
          payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
        }
      });
      api2.on.getInspectorState((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return;
          }
          if (inspectedStore) {
            payload.state = formatStoreForInspectorState(inspectedStore);
          }
        }
      });
      api2.on.editInspectorState((payload, ctx) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return toastMessage(`store "${payload.nodeId}" not found`, "error");
          }
          const { path } = payload;
          if (!isPinia(inspectedStore)) {
            if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
              path.unshift("$state");
            }
          } else {
            path.unshift("state");
          }
          isTimelineActive = false;
          payload.set(inspectedStore, path, payload.state.value);
          isTimelineActive = true;
        }
      });
      api2.on.editComponentState((payload) => {
        if (payload.type.startsWith("🍍")) {
          const storeId = payload.type.replace(/^🍍\s*/, "");
          const store = pinia._s.get(storeId);
          if (!store) {
            return toastMessage(`store "${storeId}" not found`, "error");
          }
          const { path } = payload;
          if (path[0] !== "state") {
            return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
          }
          path[0] = "$state";
          isTimelineActive = false;
          payload.set(store, path, payload.state.value);
          isTimelineActive = true;
        }
      });
    });
  }
  function addStoreToDevtools(app, store) {
    if (!componentStateTypes.includes(getStoreType(store.$id))) {
      componentStateTypes.push(getStoreType(store.$id));
    }
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app,
      settings: {
        logStoreChanges: {
          label: "Notify about new/deleted stores",
          type: "boolean",
          defaultValue: true
        }
        // useEmojis: {
        //   label: 'Use emojis in messages ⚡️',
        //   type: 'boolean',
        //   defaultValue: true,
        // },
      }
    }, (api2) => {
      const now2 = typeof api2.now === "function" ? api2.now.bind(api2) : Date.now;
      store.$onAction(({ after, onError, name, args }) => {
        const groupId = runningActionId++;
        api2.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🛫 " + name,
            subtitle: "start",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args
            },
            groupId
          }
        });
        after((result) => {
          activeAction = void 0;
          api2.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              title: "🛬 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                result
              },
              groupId
            }
          });
        });
        onError((error) => {
          activeAction = void 0;
          api2.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              logType: "error",
              title: "💥 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                error
              },
              groupId
            }
          });
        });
      }, true);
      store._customProperties.forEach((name) => {
        vue.watch(() => vue.unref(store[name]), (newValue, oldValue) => {
          api2.notifyComponentUpdate();
          api2.sendInspectorState(INSPECTOR_ID);
          if (isTimelineActive) {
            api2.addTimelineEvent({
              layerId: MUTATIONS_LAYER_ID,
              event: {
                time: now2(),
                title: "Change",
                subtitle: name,
                data: {
                  newValue,
                  oldValue
                },
                groupId: activeAction
              }
            });
          }
        }, { deep: true });
      });
      store.$subscribe(({ events, type }, state) => {
        api2.notifyComponentUpdate();
        api2.sendInspectorState(INSPECTOR_ID);
        if (!isTimelineActive)
          return;
        const eventData = {
          time: now2(),
          title: formatMutationType(type),
          data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
          groupId: activeAction
        };
        if (type === MutationType.patchFunction) {
          eventData.subtitle = "⤵️";
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = "🧩";
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type;
        }
        if (events) {
          eventData.data["rawEvent(s)"] = {
            _custom: {
              display: "DebuggerEvent",
              type: "object",
              tooltip: "raw DebuggerEvent[]",
              value: events
            }
          };
        }
        api2.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData
        });
      }, { detached: true, flush: "sync" });
      const hotUpdate = store._hotUpdate;
      store._hotUpdate = vue.markRaw((newStore) => {
        hotUpdate(newStore);
        api2.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🔥 " + store.$id,
            subtitle: "HMR update",
            data: {
              store: formatDisplay(store.$id),
              info: formatDisplay(`HMR update`)
            }
          }
        });
        api2.notifyComponentUpdate();
        api2.sendInspectorTree(INSPECTOR_ID);
        api2.sendInspectorState(INSPECTOR_ID);
      });
      const { $dispose } = store;
      store.$dispose = () => {
        $dispose();
        api2.notifyComponentUpdate();
        api2.sendInspectorTree(INSPECTOR_ID);
        api2.sendInspectorState(INSPECTOR_ID);
        api2.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
      };
      api2.notifyComponentUpdate();
      api2.sendInspectorTree(INSPECTOR_ID);
      api2.sendInspectorState(INSPECTOR_ID);
      api2.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
    });
  }
  let runningActionId = 0;
  let activeAction;
  function patchActionForGrouping(store, actionNames, wrapWithProxy) {
    const actions = actionNames.reduce((storeActions, actionName) => {
      storeActions[actionName] = vue.toRaw(store)[actionName];
      return storeActions;
    }, {});
    for (const actionName in actions) {
      store[actionName] = function() {
        const _actionId = runningActionId;
        const trackedStore = wrapWithProxy ? new Proxy(store, {
          get(...args) {
            activeAction = _actionId;
            return Reflect.get(...args);
          },
          set(...args) {
            activeAction = _actionId;
            return Reflect.set(...args);
          }
        }) : store;
        activeAction = _actionId;
        const retValue = actions[actionName].apply(trackedStore, arguments);
        activeAction = void 0;
        return retValue;
      };
    }
  }
  function devtoolsPlugin({ app, store, options }) {
    if (store.$id.startsWith("__hot:")) {
      return;
    }
    store._isOptionsAPI = !!options.state;
    patchActionForGrouping(store, Object.keys(options.actions), store._isOptionsAPI);
    const originalHotUpdate = store._hotUpdate;
    vue.toRaw(store)._hotUpdate = function(newStore) {
      originalHotUpdate.apply(this, arguments);
      patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions), !!store._isOptionsAPI);
    };
    addStoreToDevtools(
      app,
      // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
      store
    );
  }
  function createPinia() {
    const scope = vue.effectScope(true);
    const state = scope.run(() => vue.ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia = vue.markRaw({
      install(app) {
        setActivePinia(pinia);
        {
          pinia._a = app;
          app.provide(piniaSymbol, pinia);
          app.config.globalProperties.$pinia = pinia;
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(app, pinia);
          }
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    if (USE_DEVTOOLS && typeof Proxy !== "undefined") {
      pinia.use(devtoolsPlugin);
    }
    return pinia;
  }
  function patchObject(newState, oldState) {
    for (const key in oldState) {
      const subPatch = oldState[key];
      if (!(key in newState)) {
        continue;
      }
      const targetValue = newState[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        newState[key] = patchObject(targetValue, subPatch);
      } else {
        {
          newState[key] = subPatch;
        }
      }
    }
    return newState;
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && vue.getCurrentScope()) {
      vue.onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  const fallbackRunWithContext = (fn) => fn();
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    }
    if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = Symbol("pinia:skipHydration");
  function shouldHydrate(obj) {
    return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(vue.isRef(o) && o.effect);
  }
  function createOptionsStore(id2, options, pinia, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia.state.value[id2];
    let store;
    function setup() {
      if (!initialState && !hot) {
        {
          pinia.state.value[id2] = state ? state() : {};
        }
      }
      const localState = hot ? (
        // use ref() to unwrap refs inside state TODO: check if this is still necessary
        vue.toRefs(vue.ref(state ? state() : {}).value)
      ) : vue.toRefs(pinia.state.value[id2]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (name in localState) {
          console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id2}".`);
        }
        computedGetters[name] = vue.markRaw(vue.computed(() => {
          setActivePinia(pinia);
          const store2 = pinia._s.get(id2);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id2, setup, options, pinia, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    if (!pinia._e.active) {
      throw new Error("Pinia destroyed");
    }
    const $subscribeOptions = {
      deep: true
      // flush: 'post',
    };
    {
      $subscribeOptions.onTrigger = (event) => {
        if (isListening) {
          debuggerEvents = event;
        } else if (isListening == false && !store._hotUpdating) {
          if (Array.isArray(debuggerEvents)) {
            debuggerEvents.push(event);
          } else {
            console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
          }
        }
      };
    }
    let isListening;
    let isSyncListening;
    let subscriptions = [];
    let actionSubscriptions = [];
    let debuggerEvents;
    const initialState = pinia.state.value[$id];
    if (!isOptionsStore && !initialState && !hot) {
      {
        pinia.state.value[$id] = {};
      }
    }
    const hotState = vue.ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      {
        debuggerEvents = [];
      }
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      vue.nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      () => {
        throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
      }
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia._s.delete($id);
    }
    function wrapAction(name, action) {
      return function() {
        setActivePinia(pinia);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name,
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = action.apply(this && this.$id === $id ? this : store, args);
        } catch (error) {
          triggerSubscriptions(onErrorCallbackList, error);
          throw error;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error);
            return Promise.reject(error);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
    }
    const _hmrPayload = /* @__PURE__ */ vue.markRaw({
      actions: {},
      getters: {},
      state: [],
      hotState
    });
    const partialStore = {
      _p: pinia,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => vue.watch(() => pinia.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = vue.reactive(assign(
      {
        _hmrPayload,
        _customProperties: vue.markRaw(/* @__PURE__ */ new Set())
        // devtools custom properties
      },
      partialStore
      // must be added later
      // setupStore
    ));
    pinia._s.set($id, store);
    const runWithContext = pinia._a && pinia._a.runWithContext || fallbackRunWithContext;
    const setupStore = runWithContext(() => pinia._e.run(() => (scope = vue.effectScope()).run(setup)));
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (vue.isRef(prop) && !isComputed(prop) || vue.isReactive(prop)) {
        if (hot) {
          set(hotState.value, key, vue.toRef(setupStore, key));
        } else if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (vue.isRef(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia.state.value[$id][key] = prop;
          }
        }
        {
          _hmrPayload.state.push(key);
        }
      } else if (typeof prop === "function") {
        const actionValue = hot ? prop : wrapAction(key, prop);
        {
          setupStore[key] = actionValue;
        }
        {
          _hmrPayload.actions[key] = prop;
        }
        optionsForPlugin.actions[key] = prop;
      } else {
        if (isComputed(prop)) {
          _hmrPayload.getters[key] = isOptionsStore ? (
            // @ts-expect-error
            options.getters[key]
          ) : prop;
          if (IS_CLIENT) {
            const getters = setupStore._getters || // @ts-expect-error: same
            (setupStore._getters = vue.markRaw([]));
            getters.push(key);
          }
        }
      }
    }
    {
      assign(store, setupStore);
      assign(vue.toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => hot ? hotState.value : pinia.state.value[$id],
      set: (state) => {
        if (hot) {
          throw new Error("cannot set hotState");
        }
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    {
      store._hotUpdate = vue.markRaw((newStore) => {
        store._hotUpdating = true;
        newStore._hmrPayload.state.forEach((stateKey) => {
          if (stateKey in store.$state) {
            const newStateTarget = newStore.$state[stateKey];
            const oldStateSource = store.$state[stateKey];
            if (typeof newStateTarget === "object" && isPlainObject(newStateTarget) && isPlainObject(oldStateSource)) {
              patchObject(newStateTarget, oldStateSource);
            } else {
              newStore.$state[stateKey] = oldStateSource;
            }
          }
          set(store, stateKey, vue.toRef(newStore.$state, stateKey));
        });
        Object.keys(store.$state).forEach((stateKey) => {
          if (!(stateKey in newStore.$state)) {
            del(store, stateKey);
          }
        });
        isListening = false;
        isSyncListening = false;
        pinia.state.value[$id] = vue.toRef(newStore._hmrPayload, "hotState");
        isSyncListening = true;
        vue.nextTick().then(() => {
          isListening = true;
        });
        for (const actionName in newStore._hmrPayload.actions) {
          const action = newStore[actionName];
          set(store, actionName, wrapAction(actionName, action));
        }
        for (const getterName in newStore._hmrPayload.getters) {
          const getter = newStore._hmrPayload.getters[getterName];
          const getterValue = isOptionsStore ? (
            // special handling of options api
            vue.computed(() => {
              setActivePinia(pinia);
              return getter.call(store, store);
            })
          ) : getter;
          set(store, getterName, getterValue);
        }
        Object.keys(store._hmrPayload.getters).forEach((key) => {
          if (!(key in newStore._hmrPayload.getters)) {
            del(store, key);
          }
        });
        Object.keys(store._hmrPayload.actions).forEach((key) => {
          if (!(key in newStore._hmrPayload.actions)) {
            del(store, key);
          }
        });
        store._hmrPayload = newStore._hmrPayload;
        store._getters = newStore._getters;
        store._hotUpdating = false;
      });
    }
    if (USE_DEVTOOLS) {
      const nonEnumerable = {
        writable: true,
        configurable: true,
        // avoid warning on devtools trying to display this property
        enumerable: false
      };
      ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
        Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
      });
    }
    pinia._p.forEach((extender) => {
      if (USE_DEVTOOLS) {
        const extensions = scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        }));
        Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
        assign(store, extensions);
      } else {
        assign(store, scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        })));
      }
    });
    if (store.$state && typeof store.$state === "object" && typeof store.$state.constructor === "function" && !store.$state.constructor.toString().includes("[native code]")) {
      console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
    }
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  function defineStore(idOrOptions, setup, setupOptions) {
    let id2;
    let options;
    const isSetupStore = typeof setup === "function";
    if (typeof idOrOptions === "string") {
      id2 = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    } else {
      options = idOrOptions;
      id2 = idOrOptions.id;
      if (typeof id2 !== "string") {
        throw new Error(`[🍍]: "defineStore()" must be passed a store id as its first argument.`);
      }
    }
    function useStore(pinia, hot) {
      const hasContext = vue.hasInjectionContext();
      pinia = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia || (hasContext ? vue.inject(piniaSymbol, null) : null);
      if (pinia)
        setActivePinia(pinia);
      if (!activePinia) {
        throw new Error(`[🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?
See https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.
This will fail in production.`);
      }
      pinia = activePinia;
      if (!pinia._s.has(id2)) {
        if (isSetupStore) {
          createSetupStore(id2, setup, options, pinia);
        } else {
          createOptionsStore(id2, options, pinia);
        }
        {
          useStore._pinia = pinia;
        }
      }
      const store = pinia._s.get(id2);
      if (hot) {
        const hotId = "__hot:" + id2;
        const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia, true) : createOptionsStore(hotId, assign({}, options), pinia, true);
        hot._hotUpdate(newStore);
        delete pinia.state.value[hotId];
        pinia._s.delete(hotId);
      }
      if (IS_CLIENT) {
        const currentInstance = vue.getCurrentInstance();
        if (currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
        !hot) {
          const vm = currentInstance.proxy;
          const cache2 = "_pStores" in vm ? vm._pStores : vm._pStores = {};
          cache2[id2] = store;
        }
      }
      return store;
    }
    useStore.$id = id2;
    return useStore;
  }
  const useToastStore = defineStore("toast", () => {
    const message = vue.ref("");
    let timer = null;
    function showToast2(text, duration = 2500) {
      message.value = text;
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(() => {
        message.value = "";
        timer = null;
      }, duration);
      uni.showToast({ title: text, icon: "none", duration });
    }
    return { message, showToast: showToast2 };
  });
  function showToast(text) {
    useToastStore().showToast(text);
  }
  var define_import_meta_env_default$5 = { VITE_CJS_IGNORE_WARNING: "true", VITE_USER_NODE_ENV: "development", VITE_ROOT_DIR: "/Users/zeas/Desktop/client-uniii", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const API_BASE$3 = define_import_meta_env_default$5.VITE_API_BASE_URL || "";
  const DEFAULT_TIMEOUT_MS = 15e3;
  const AUTH_TIMEOUT_MS = 2e4;
  function buildUrl$1(url) {
    if (!url)
      return API_BASE$3 || "/";
    if (url.startsWith("http://") || url.startsWith("https://"))
      return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE$3}${path}`;
  }
  function mergeHeaders(extra = {}, skipJsonContentType = false) {
    const header = {
      ...getAuthHeaders(),
      ...extra
    };
    if (!skipJsonContentType && !header["Content-Type"] && !header["content-type"]) {
      header["Content-Type"] = "application/json";
    }
    return header;
  }
  function normalizeData(data) {
    if (data == null)
      return void 0;
    if (typeof data === "string")
      return data;
    if (typeof FormData !== "undefined" && data instanceof FormData)
      return data;
    return JSON.stringify(data);
  }
  function handle401() {
    removeItem("user_token");
    removeItem("user_info");
    showToast("登录已过期，请重新登录");
    uni.reLaunch({ url: "/pages/login/index" });
  }
  function pickErrorDetail(data, status) {
    if (data == null)
      return `HTTP ${status}`;
    if (typeof data === "string")
      return data;
    return data.detail || data.message || data.error || `HTTP ${status}`;
  }
  function apiFetch(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const rawData = options.data;
    const isFormData = typeof FormData !== "undefined" && rawData instanceof FormData;
    const header = mergeHeaders(options.header || {}, isFormData);
    const data = normalizeData(rawData);
    const fullUrl = buildUrl$1(url);
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method,
        header,
        data,
        timeout,
        success(res) {
          var _a2, _b;
          const status = res.statusCode || 0;
          if (status >= 200 && status < 300) {
            const ct = ((_a2 = res.header) == null ? void 0 : _a2["content-type"]) || ((_b = res.header) == null ? void 0 : _b["Content-Type"]) || "";
            let body = res.data;
            if (typeof body !== "object" || body === null) {
              if (typeof body === "string") {
                try {
                  body = JSON.parse(body);
                } catch {
                }
              }
            } else if (typeof ct === "string" && ct.includes("application/json") && typeof body === "string") {
              try {
                body = JSON.parse(body);
              } catch {
              }
            }
            if (body && typeof body === "object" && body.ok !== true && (body.error || body.detail) && body.id == null && body.token == null) {
              const msg = pickErrorDetail(body, status);
              const error2 = new Error(msg);
              error2.status = Number(body.status_code) || status;
              error2.detail = body.detail || body.error;
              if (error2.status === 401 || /登录|鉴权|权限|IsAuthenticated/i.test(msg)) {
                handle401();
              } else {
                showToast(msg || "请求失败");
              }
              reject(error2);
              return;
            }
            resolve(body);
            return;
          }
          const errorData = res.data || {};
          const error = new Error(pickErrorDetail(errorData, status));
          error.status = status;
          error.detail = typeof errorData === "object" ? errorData.detail : void 0;
          if (status === 401) {
            handle401();
          } else if (status >= 500) {
            showToast("服务器错误，请稍后重试");
          } else {
            showToast(pickErrorDetail(errorData, status) || "请求失败");
          }
          reject(error);
        },
        fail(err) {
          formatAppLog("error", "at utils/api.js:200", "网络错误:", err);
          showToast("网络错误，请检查您的网络连接或稍后重试");
          reject(new Error("网络连接失败，请检查网络"));
        }
      });
    });
  }
  function rawFetch(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const rawData = options.data;
    const isFormData = typeof FormData !== "undefined" && rawData instanceof FormData;
    const header = {
      ...options.header || {}
    };
    if (!isFormData && !header["Content-Type"] && !header["content-type"]) {
      header["Content-Type"] = "application/json";
    }
    const data = normalizeData(rawData);
    const fullUrl = buildUrl$1(url);
    const timeout = options.timeout ?? AUTH_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method,
        header,
        data,
        timeout,
        success(res) {
          const status = res.statusCode || 0;
          let body = res.data;
          if (typeof body === "string") {
            try {
              body = JSON.parse(body);
            } catch {
            }
          }
          resolve({
            ok: status >= 200 && status < 300,
            status,
            data: body
          });
        },
        fail(err) {
          reject(err);
        }
      });
    });
  }
  const api = {
    /** GET */
    get(url, options = {}) {
      return apiFetch(url, { ...options, method: "GET" });
    },
    /** POST JSON（data 为对象） */
    post(url, data, options = {}) {
      return apiFetch(url, { ...options, method: "POST", data });
    },
    /** PUT JSON */
    put(url, data, options = {}) {
      return apiFetch(url, { ...options, method: "PUT", data });
    },
    /** DELETE */
    delete(url, options = {}) {
      return apiFetch(url, { ...options, method: "DELETE" });
    },
    /**
     * H5 FormData 上传；App 端图片请用 `@/utils/device` 的 uploadImage
     */
    upload(url, formData, options = {}) {
      return apiFetch(url, {
        ...options,
        method: "POST",
        data: formData,
        header: { ...options.header || {} }
      });
    }
  };
  api.upload;
  var define_import_meta_env_default$4 = { VITE_CJS_IGNORE_WARNING: "true", VITE_USER_NODE_ENV: "development", VITE_ROOT_DIR: "/Users/zeas/Desktop/client-uniii", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const API_BASE$2 = define_import_meta_env_default$4.VITE_API_BASE_URL || "";
  function buildUrl(url) {
    if (url.startsWith("http"))
      return url;
    return `${API_BASE$2}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  function getDeviceId() {
    let id2 = getItem("device_id");
    if (!id2) {
      id2 = Math.random().toString(36).substring(2, 15);
      setItem("device_id", id2);
    }
    return id2;
  }
  function deviceHeaders() {
    return { "x-device-id": getDeviceId() };
  }
  function uploadImage(filePath) {
    const token = getItem("user_token");
    const header = {
      ...deviceHeaders(),
      ...token ? { "x-token": token } : {}
    };
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: buildUrl("/api/upload/image"),
        filePath,
        name: "file",
        // 后端字段名
        header,
        success(res) {
          try {
            const data = JSON.parse(res.data);
            if (data.url)
              resolve(data);
            else
              reject(new Error(data.detail || "upload failed"));
          } catch {
            reject(new Error("parse upload response failed"));
          }
        },
        fail(err) {
          reject(err);
        }
      });
    });
  }
  function chooseAndUploadImages(max = 9, existing = 0) {
    const count = Math.max(1, Math.min(max - existing, 9));
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count,
        success: async (res) => {
          const paths = res.tempFilePaths || [];
          const urls = [];
          try {
            for (const p of paths) {
              const data = await uploadImage(p);
              if (data.url)
                urls.push(data.url);
            }
            resolve(urls);
          } catch (e) {
            reject(e);
          }
        },
        fail: reject
      });
    });
  }
  function isLoggedIn() {
    return Boolean(getItem("user_token"));
  }
  function requireAuth() {
    if (!isLoggedIn()) {
      uni.reLaunch({ url: "/pages/login/index" });
      return false;
    }
    return true;
  }
  function redirectIfLoggedIn() {
    if (isLoggedIn()) {
      uni.reLaunch({ url: "/pages/home/index" });
    }
  }
  function getCurrentUserId() {
    const infoStr = getItem("user_info");
    if (!infoStr)
      return null;
    try {
      const info = JSON.parse(infoStr);
      return info.id ?? null;
    } catch {
      return null;
    }
  }
  const language$6 = {
    name: "中文",
    select: "选择语言"
  };
  const common$6 = {
    save: "保存",
    cancel: "取消",
    "delete": "删除",
    edit: "编辑",
    confirm: "确定",
    close: "关闭",
    loading: "加载中...",
    search: "搜索",
    noData: "暂无数据",
    success: "成功",
    failed: "失败",
    networkError: "网络错误，请稍后重试",
    me: "我"
  };
  const nav$6 = {
    home: "首页",
    messages: "消息",
    chat: "聊天",
    discover: "发现",
    profile: "我的"
  };
  const login$6 = {
    title: "登录",
    username: "邮箱",
    password: "密码",
    loginBtn: "登录",
    registerBtn: "去注册",
    noAccount: "还没有账号？",
    subtitle: "与你的虚拟恋人重逢",
    errorEmpty: "请输入邮箱和密码",
    errorFailed: "登录失败",
    loggingIn: "登录中..."
  };
  const register$6 = {
    title: "创建账号",
    "//username": "用户名",
    email: "邮箱",
    nickname: "昵称",
    password: "设置密码",
    confirmPassword: "确认密码",
    gender: "性别",
    male: "男生",
    female: "女生",
    secret: "保密",
    registerBtn: "注册",
    hasAccount: "已有账号？",
    goLogin: "登录",
    subtitle: "开启沉浸式恋爱之旅",
    "//errorUsername": "用户名至少3个字符",
    errorEmail: "请输入有效的邮箱地址",
    errorPassword: "密码至少6个字符",
    errorConfirm: "两次输入的密码不一致",
    errorFailed: "注册失败",
    registering: "注册中...",
    sexualOrientation: "性取向",
    heterosexual: "异性恋",
    homosexual: "同性恋",
    bisexual: "双性恋",
    pansexual: "泛性恋",
    asexual: "无性恋",
    agree: "注册即同意",
    privacy: "《隐私政策》"
  };
  const home$6 = {
    title: "trandsai",
    myCompanions: "我的智能体",
    createCompanion: "创建智能体",
    noCompanions: "还没有智能体，去创建一个吧",
    justNow: "刚刚",
    minutesAgo: "{count}分钟前",
    hoursAgo: "{count}小时前",
    daysAgo: "{count}天前",
    defaultCompanionName: "智能体",
    create: "创建",
    noMoments: "还没有动态，快去和 trandsai 聊天吧 ~",
    writeComment: "写评论...",
    noMoreMoments: "— 没有更多了 —",
    backToTop: "返回顶部",
    momentFilter: "筛选 Moments",
    filterLanguage: "智能体语种",
    filterGender: "性别",
    filterOrientation: "性取向",
    filterAll: "不限",
    resetFilter: "重置",
    applyFilter: "确定",
    replyTo: "回复 {name}",
    replyPlaceholder: "回复 {name}..."
  };
  const chat$6 = {
    placeholder: "输入消息...",
    send: "发送",
    intimacy: "亲密度",
    mood: "心情",
    online: "在线",
    connecting: "连接中...",
    loadingEarlier: "加载更早的消息...",
    loadingHistory: "加载聊天记录...",
    noMessages: "还没有聊天记录，发一条消息开始对话吧～",
    defaultName: "智能体",
    viewProfile: "查看资料",
    clearMessages: "清空聊天记录",
    confirmClearMessages: "确定要清空所有聊天记录吗？此操作不可撤销。",
    clearSuccess: "清空成功",
    clearFailed: "清空失败",
    copySuccess: "已复制",
    doubleClickToCopy: "双击可复制",
    messageQueued: "连接恢复后将自动发送未发出的消息",
    sendQueuedHint: "未连接时发送将排队，连接恢复后自动发出",
    accessDenied: "无权访问该智能体或会话不存在",
    back: "返回",
    notificationTitle: "新消息",
    notificationBody: "{preview}",
    connectionAbnormal: "连接异常，请稍后重试",
    thinkingDismissHint: "点击关闭",
    emojiSmile: "表情",
    emojiHeart: "爱心",
    emojiGesture: "手势",
    emojiMisc: "更多"
  };
  const discover$6 = {
    title: "发现",
    moments: "朋友圈",
    recommended: "推荐",
    searchPlaceholder: "搜索帖子...",
    searchBtn: "搜索",
    searchResults: "搜索结果",
    clear: "清除",
    searching: "搜索中...",
    noResults: "未找到相关内容",
    knowledgeEntry: "知识条目",
    trendingTopics: "热门话题",
    viewMore: "查看更多",
    recommendedMoments: "推荐动态",
    loading: "加载中...",
    noMoments: "暂无动态",
    upgradeMember: "升级会员",
    upgradeDesc: "解锁更多AI性格、专属语音、无限对话次数",
    learnMore: "了解更多",
    newPost: "发帖",
    tabPosts: "帖子",
    tabCompanions: "机器人",
    filterAll: "全部",
    filterRecommended: "推荐",
    noCompanions: "暂无机器人",
    noPosts: "还没有帖子，来发第一条吧～",
    noMorePosts: "没有更多了",
    noSearchResults: "未找到匹配的帖子",
    createPost: "发布帖子",
    postTitle: "标题",
    titlePlaceholder: "输入帖子标题...",
    postContent: "内容",
    contentPlaceholder: "分享你的想法...",
    publish: "发布",
    publishing: "发布中...",
    createFailed: "发布失败",
    viewDetail: "查看详情",
    postDetail: "帖子详情",
    postNotFound: "帖子不存在",
    comments: "评论",
    noComments: "还没有评论，来抢沙发吧～",
    commentPlaceholder: "写下你的评论...",
    commentFailed: "评论失败",
    justNow: "刚刚",
    minutesAgo: "{count}分钟前",
    hoursAgo: "{count}小时前",
    daysAgo: "{count}天前",
    postCategory: "分类",
    catAll: "全部",
    catDating: "恋爱交友",
    catPsychology: "情感心理",
    catTips: "经验攻略",
    catStory: "故事分享",
    catOfftopic: "闲聊杂谈",
    cat_dating: "恋爱交友",
    cat_psychology: "情感心理",
    cat_tips: "经验攻略",
    cat_story: "故事分享",
    cat_offtopic: "闲聊杂谈",
    postImages: "图片",
    addImage: "添加图片"
  };
  const profile$6 = {
    title: "我的",
    settings: "设置",
    logout: "退出登录",
    logoutConfirm: "确定要退出登录吗？退出后需要重新登录。",
    language: "语言",
    notLoggedIn: "未登录",
    pleaseLogin: "请先登录",
    authorId: "作者ID",
    myCompanions: "我的恋人",
    myCompanionsHint: "亲密度 > 5 才会显示",
    myMoments: "我的帖子",
    intimacyRecord: "亲密度记录",
    notificationSettings: "通知设置",
    languagePreference: "语言偏好",
    accountSecurity: "账号与安全",
    privacyPolicy: "隐私协议",
    aboutUs: "关于我们",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    editProfile: "编辑资料",
    enterNickname: "输入你的昵称",
    age: "年龄",
    agePlaceholder: "必填，18–70",
    region: "地区",
    placeholderRegion: "如：北京、上海",
    occupation: "职业",
    placeholderOccupation: "如：学生、设计师",
    updateFailed: "更新失败",
    invalidAge: "年龄必须在18-70岁之间",
    selectLanguage: "选择语言",
    chatTurns: "对话轮数",
    daysTogether: "陪伴天数",
    avatarUploadFailed: "头像上传失败，请重试"
  };
  const myCompanions$6 = {
    total: "总数",
    totalAffection: "总亲密度",
    intimate: "亲密个数",
    soulmate: "灵魂伴侣",
    close: "亲近",
    familiar: "熟悉",
    stranger: "初识",
    removeFromList: "从列表移除",
    removeConfirm: "从「我的恋人」列表中移除此智能体？（不会删除角色本身）",
    selfCreated: "自己创建"
  };
  const intimacy$6 = {
    avgAffection: "平均亲密度",
    highest: "最高亲密度",
    topCompanion: "最亲密的伴侣"
  };
  const notification$6 = {
    tip: "管理你接收的通知类型",
    moments: "朋友圈动态",
    momentsDesc: "当trandsai发布新动态时通知你",
    messages: "消息通知",
    messagesDesc: "当收到新消息时通知你",
    system: "系统通知",
    systemDesc: "接收系统公告和更新",
    sound: "声音提示",
    soundDesc: "收到消息时播放提示音",
    email: "邮件通知",
    emailDesc: "通过邮件接收重要通知"
  };
  const notifications$6 = {
    title: "通知",
    tabAll: "全部",
    empty: "暂无通知",
    welcome: "欢迎来到 trandsai，开始与你的虚拟恋人互动吧～",
    replyToYou: "回复了你：{content}"
  };
  const notFound$6 = {
    title: "页面未找到",
    desc: "抱歉，你访问的页面不存在",
    back: "返回上一页",
    home: "回到首页"
  };
  const createCompanion$6 = {
    title: "创造虚拟恋人",
    basicInfo: "基本信息",
    name: "名字",
    age: "年龄",
    gender: "性别",
    city: "城市",
    personality: "性格",
    background: "背景故事",
    speechStyle: "说话风格",
    hobbies: "兴趣爱好",
    values: "核心价值观",
    fears: "内心脆弱点",
    loveView: "恋爱观",
    dailyRoutine: "典型一天",
    favoriteThings: "喜欢的东西",
    mbti: "MBTI",
    preset: "预设人设",
    aiGenerate: "AI 智能生成",
    manualCreate: "手动创建",
    generateDesc: "让AI根据你的偏好生成独特人设",
    createBtn: "创建 ✨",
    autoFill: "一键填充",
    generating: "生成中...",
    namePlaceholder: "给 TA 起个名字",
    ageLabel: "年龄: {age}",
    male: "男生",
    female: "女生",
    sexualOrientation: "性取向",
    cityPlaceholder: "TA 在哪个城市？",
    mbtiPlaceholder: "选择 MBTI 类型",
    personalityLabel: "性格标签（可多选）",
    backgroundPlaceholder: "描述一下 TA 的背景故事...",
    speechStylePlaceholder: "例如：喜欢用表情符号，说话温柔体贴...",
    importChatHistory: "导入聊天记录（可选）",
    chatHistoryPlaceholder: `支持两种格式：

1. 简单文本格式（每行一条）：
用户: 你好呀
AI: 你好～很高兴见到你
用户: 今天天气不错

2. JSON 格式：
[{'{'}"role":"user","content":"你好"{'}'}, {'{'}"role":"assistant","content":"你好呀～"{'}'}]`,
    recognizedMessages: "已识别 {count} 条消息",
    personalityDetails: "立体人格细节（可选）",
    hobbiesPlaceholder: "例如：摄影、烹饪、旅行、瑜伽...",
    valuesPlaceholder: "例如：真诚、自由、家庭至上...",
    fearsPlaceholder: "例如：害怕被抛弃、缺乏安全感...",
    loveViewPlaceholder: "例如：细水长流、彼此独立又相互依赖...",
    dailyRoutinePlaceholder: "例如：早上7点起床跑步，晚上喜欢看书...",
    favoriteThingsPlaceholder: "例如：猫、抹茶拿铁、日落、雨天...",
    lifeStory: "成长经历",
    lifeStoryPlaceholder: "TA 的完整人生成长故事，包含童年、青少年、原生家庭、重大转折点...",
    culturalValues: "文化三观与意识形态",
    culturalValuesPlaceholder: "TA 独特的文化三观：情感表达方式、对家庭和责任的看法、恋爱哲学、金钱观、性别角色认知...",
    genderPerspective: "性别观念与认知",
    genderPerspectivePlaceholder: "TA 对性别角色、亲密关系、男女相处方式的独特认知。例如：传统型、平等主义、独立女性意识、温柔直男观念...",
    preview: "预览",
    unnamed: "未命名",
    unknownCity: "未知城市",
    alertFillRequired: "请先填写姓名、城市和性格标签，AI 才能为你生成人设",
    alertGenerateFailed: "生成失败: {error}",
    alertNetworkError: "生成失败，请检查网络或稍后重试",
    alertCreateFailed: "创建失败: {error}",
    alertNetworkCreateFailed: "创建失败，请检查网络连接",
    mbtiTypes: {
      INTJ: "建筑师",
      INTP: "逻辑学家",
      ENTJ: "指挥官",
      ENTP: "辩论家",
      INFJ: "提倡者",
      INFP: "调停者",
      ENFJ: "主人公",
      ENFP: "竞选者",
      ISTJ: "物流师",
      ISFJ: "守护者",
      ESTJ: "总经理",
      ESFJ: "执政官",
      ISTP: "鉴赏家",
      ISFP: "探险家",
      ESTP: "企业家",
      ESFP: "表演者"
    },
    errors: {
      nameRequired: "姓名不能为空，请填写内容",
      ageRequired: "年龄不能为空，请填写内容",
      genderRequired: "性别不能为空，请填写内容",
      cityRequired: "城市不能为空，请填写内容",
      personalityRequired: "性格不能为空，请填写内容",
      personalityMin: "性格标签至少选择两个",
      mbtiRequired: "MBTI不能为空，请填写内容",
      orientationRequired: "性取向不能为空，请填写内容",
      backgroundRequired: "背景故事不能为空，请填写内容",
      backgroundMin: "背景故事内容至少填写5个字符，请补充完整描述",
      speechRequired: "说话风格不能为空，请填写内容",
      speechMin: "说话风格内容至少填写5个字符，请补充完整描述"
    }
  };
  const messages$6 = {
    title: "消息",
    searchPlaceholder: "搜索",
    feedback: "意见反馈",
    feedbackDesc: "有问题或建议？点击留言给我们",
    noMessages: "暂无消息",
    createCompanionHint: "创建智能体开始对话吧～",
    chooseAction: "选择操作",
    viewAllCompanions: "查看全部机器人列表",
    allCompanionsDesc: "浏览所有已创建的机器人",
    typing: "正在输入",
    noMessageYet: "暂无消息",
    loginRequiredFeedback: "请先登录后再使用意见反馈功能",
    justNow: "刚刚",
    minutesAgo: "{count}分钟前",
    hoursAgo: "{count}小时前",
    yesterday: "昨天",
    daysAgo: "{count}天前",
    searchNoResults: "没有匹配的会话"
  };
  const companionProfile$6 = {
    title: "trandsai资料",
    loadingError: "加载失败，请稍后重试",
    notFound: "未找到该trandsai",
    sendMessage: "发消息",
    clone: "复制创建",
    chatTurns: "对话轮数",
    moments: "Moments",
    daysTogether: "陪伴天数",
    about: "关于",
    momentsTab: "朋友圈",
    background: "背景故事",
    speechStyle: "说话风格",
    mbti: "MBTI",
    hobbies: "兴趣爱好",
    values: "核心价值观",
    fears: "内心脆弱点",
    loveView: "恋爱观",
    dailyRoutine: "典型一天",
    favoriteThings: "喜欢的东西",
    meetTime: "相遇时间",
    noMoments: "还没有朋友圈动态~",
    deleteConfirm: "确定删除此智能体？所有数据将被清除。",
    deleteFailed: "删除失败",
    deleteCompanion: "删除智能体",
    ageUnit: "岁",
    sexualOrientationLabel: "性取向",
    creator: "作者",
    sexualOrientation: {
      heterosexual: "异性恋",
      homosexual: "同性恋",
      bisexual: "双性恋",
      pansexual: "泛性恋",
      asexual: "无性恋",
      secret: "性取向保密"
    }
  };
  const feedback$6 = {
    title: "意见反馈",
    subtitle: "直接与管理员沟通",
    loading: "加载中...",
    noMessages: "还没有留言，写下你的问题或建议吧～",
    placeholder: "输入你的问题或建议...",
    sendFailed: "发送失败，请重试",
    loginExpired: "登录已过期，请重新登录",
    loginRequired: "请先登录"
  };
  const privacy$6 = {
    title: "隐私政策",
    openInBrowser: "请在浏览器中查看隐私政策："
  };
  const zh = {
    language: language$6,
    common: common$6,
    nav: nav$6,
    login: login$6,
    register: register$6,
    home: home$6,
    chat: chat$6,
    discover: discover$6,
    profile: profile$6,
    myCompanions: myCompanions$6,
    intimacy: intimacy$6,
    notification: notification$6,
    notifications: notifications$6,
    notFound: notFound$6,
    createCompanion: createCompanion$6,
    messages: messages$6,
    companionProfile: companionProfile$6,
    feedback: feedback$6,
    privacy: privacy$6
  };
  const language$5 = {
    name: "English",
    select: "Select Language"
  };
  const common$5 = {
    save: "Save",
    cancel: "Cancel",
    "delete": "Delete",
    edit: "Edit",
    confirm: "Confirm",
    close: "Close",
    loading: "Loading...",
    search: "Search",
    noData: "No data",
    success: "Success",
    failed: "Failed",
    networkError: "Network error, please try again later",
    me: "Me"
  };
  const nav$5 = {
    home: "Home",
    messages: "Messages",
    chat: "Chat",
    discover: "Discover",
    profile: "Profile"
  };
  const login$5 = {
    title: "Login",
    username: "Username",
    password: "Password",
    loginBtn: "Login",
    registerBtn: "Register",
    noAccount: "No account?",
    subtitle: "Reunite with your virtual lover",
    errorEmpty: "Please enter username and password",
    errorFailed: "Login failed",
    loggingIn: "Logging in..."
  };
  const register$5 = {
    title: "Create Account",
    "//username": "Username",
    email: "Email",
    nickname: "Nickname",
    password: "Set Password",
    confirmPassword: "Confirm Password",
    gender: "Gender",
    male: "Male",
    female: "Female",
    secret: "Secret",
    registerBtn: "Register",
    hasAccount: "Already have an account?",
    goLogin: "Login",
    subtitle: "Start your immersive love journey",
    "//errorUsername": "Username must be at least 3 characters",
    errorEmail: "Please enter a valid email address",
    errorPassword: "Password must be at least 6 characters",
    errorConfirm: "Passwords do not match",
    errorFailed: "Registration failed",
    registering: "Registering...",
    sexualOrientation: "Sexual Orientation",
    heterosexual: "Heterosexual",
    homosexual: "Homosexual",
    bisexual: "Bisexual",
    pansexual: "Pansexual",
    asexual: "Asexual",
    agree: "By registering, you agree to",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    and: " and "
  };
  const home$5 = {
    title: "trandsai",
    myCompanions: "My Companions",
    createCompanion: "Create Companion",
    noCompanions: "No companions yet, create one!",
    justNow: "Just now",
    minutesAgo: "{count} min ago",
    hoursAgo: "{count} hr ago",
    daysAgo: "{count} days ago",
    defaultCompanionName: "Companion",
    create: "Create",
    noMoments: "No moments yet. Go chat with your trandsai ~",
    writeComment: "Write a comment...",
    noMoreMoments: "— No more —",
    backToTop: "Back to top",
    momentFilter: "Filter moments",
    filterLanguage: "Agent language",
    filterGender: "Gender",
    filterOrientation: "Orientation",
    filterAll: "All",
    resetFilter: "Reset",
    applyFilter: "Confirm",
    replyTo: "Reply to {name}",
    replyPlaceholder: "Reply to {name}..."
  };
  const chat$5 = {
    placeholder: "Type a message...",
    send: "Send",
    intimacy: "Intimacy",
    mood: "Mood",
    online: "Online",
    connecting: "Connecting...",
    loadingEarlier: "Loading earlier messages...",
    loadingHistory: "Loading chat history...",
    noMessages: "No messages yet. Start a conversation~",
    defaultName: "Companion",
    viewProfile: "View Profile",
    clearMessages: "Clear Chat History",
    confirmClearMessages: "Are you sure you want to clear all chat history? This cannot be undone.",
    clearSuccess: "Cleared successfully",
    clearFailed: "Clear failed",
    copySuccess: "Copied",
    doubleClickToCopy: "Double-click to copy",
    messageQueued: "Pending messages will send automatically once reconnected",
    sendQueuedHint: "When offline, sends are queued and sent after reconnect",
    accessDenied: "You don't have access to this companion",
    back: "Back",
    notificationTitle: "New message",
    notificationBody: "{preview}",
    connectionAbnormal: "Connection issue. Please try again.",
    thinkingDismissHint: "Tap to dismiss",
    emojiSmile: "Smile",
    emojiHeart: "Heart",
    emojiGesture: "Gesture",
    emojiMisc: "More"
  };
  const discover$5 = {
    title: "Discover",
    moments: "Moments",
    recommended: "Recommended",
    searchPlaceholder: "Search posts...",
    searchBtn: "Search",
    searchResults: "Search Results",
    clear: "Clear",
    searching: "Searching...",
    noResults: "No related content found",
    knowledgeEntry: "Knowledge Entry",
    trendingTopics: "Trending Topics",
    viewMore: "View More",
    recommendedMoments: "Recommended Moments",
    loading: "Loading...",
    noMoments: "No moments yet",
    upgradeMember: "Upgrade Membership",
    upgradeDesc: "Unlock more AI personalities, exclusive voices, unlimited chats",
    learnMore: "Learn More",
    newPost: "New Post",
    tabPosts: "Posts",
    tabCompanions: "Companions",
    filterAll: "All",
    filterRecommended: "Recommended",
    noCompanions: "No companions yet",
    noPosts: "No posts yet. Be the first to share!",
    noMorePosts: "No more posts",
    noSearchResults: "No matching posts found",
    createPost: "Create Post",
    postTitle: "Title",
    titlePlaceholder: "Enter post title...",
    postContent: "Content",
    contentPlaceholder: "Share your thoughts...",
    publish: "Publish",
    publishing: "Publishing...",
    createFailed: "Failed to publish",
    viewDetail: "View Detail",
    postDetail: "Post Detail",
    postNotFound: "Post not found",
    comments: "Comments",
    noComments: "No comments yet. Be the first!",
    commentPlaceholder: "Write a comment...",
    commentFailed: "Comment failed",
    justNow: "Just now",
    minutesAgo: "{count} min ago",
    hoursAgo: "{count} hr ago",
    daysAgo: "{count} days ago",
    postCategory: "Category",
    catAll: "All",
    catDating: "Dating",
    catPsychology: "Psychology",
    catTips: "Tips",
    catStory: "Stories",
    catOfftopic: "Off-topic",
    cat_dating: "Dating",
    cat_psychology: "Psychology",
    cat_tips: "Tips",
    cat_story: "Stories",
    cat_offtopic: "Off-topic",
    postImages: "Images",
    addImage: "Add Image"
  };
  const profile$5 = {
    title: "Profile",
    settings: "Settings",
    logout: "Logout",
    language: "Language",
    notLoggedIn: "Not logged in",
    pleaseLogin: "Please log in",
    authorId: "Author ID",
    myCompanions: "My Companions",
    myCompanionsHint: "Intimacy > 5 to appear",
    myMoments: "My Posts",
    intimacyRecord: "Intimacy Record",
    notificationSettings: "Notifications",
    languagePreference: "Language Preference",
    accountSecurity: "Account & Security",
    privacyPolicy: "Privacy Policy",
    aboutUs: "About Us",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    editProfile: "Edit Profile",
    enterNickname: "Enter your nickname",
    age: "Age",
    agePlaceholder: "Optional, 0–150",
    region: "Region",
    placeholderRegion: "e.g. Beijing, NYC",
    occupation: "Occupation",
    placeholderOccupation: "e.g. Student, Designer",
    updateFailed: "Update failed",
    selectLanguage: "Select Language",
    chatTurns: "Chat Turns",
    daysTogether: "Days Together",
    avatarUploadFailed: "Avatar upload failed. Try again.",
    logoutConfirm: "Are you sure you want to log out? You will need to sign in again.",
    invalidAge: "Please enter a valid age between 18 and 70"
  };
  const myCompanions$5 = {
    total: "Total",
    totalAffection: "Total Affection",
    intimate: "Intimate Count",
    soulmate: "Soulmate",
    close: "Close",
    familiar: "Familiar",
    stranger: "Stranger",
    removeFromList: "Remove from list",
    removeConfirm: "Remove this companion from your list? (The character will not be deleted.)",
    selfCreated: "Created by you"
  };
  const intimacy$5 = {
    avgAffection: "Avg Affection",
    highest: "Highest",
    topCompanion: "Closest Companion"
  };
  const notifications$5 = {
    title: "Notifications",
    tabAll: "All",
    empty: "No notifications",
    welcome: "Welcome to trandsai. Start interacting with your virtual companion!",
    replyToYou: "Replied to you: {content}"
  };
  const notification$5 = {
    tip: "Manage the types of notifications you receive",
    moments: "Moments Updates",
    momentsDesc: "Notify when companions post new moments",
    messages: "Messages",
    messagesDesc: "Notify when you receive new messages",
    system: "System",
    systemDesc: "Receive system announcements and updates",
    sound: "Sound",
    soundDesc: "Play sound on new messages",
    email: "Email",
    emailDesc: "Receive important notifications via email"
  };
  const notFound$5 = {
    title: "Page Not Found",
    desc: "Sorry, the page you are looking for does not exist",
    back: "Go Back",
    home: "Home"
  };
  const createCompanion$5 = {
    title: "Create Virtual Lover",
    basicInfo: "Basic Info",
    name: "Name",
    age: "Age",
    gender: "Gender",
    city: "City",
    personality: "Personality",
    background: "Background",
    speechStyle: "Speech Style",
    hobbies: "Hobbies",
    values: "Core Values",
    fears: "Fears",
    loveView: "Love View",
    dailyRoutine: "Daily Routine",
    favoriteThings: "Favorite Things",
    mbti: "MBTI",
    preset: "Preset",
    aiGenerate: "AI Smart Generate",
    manualCreate: "Manual Create",
    generateDesc: "Let AI generate a unique persona based on your preferences",
    createBtn: "Create ✨",
    autoFill: "Auto Fill",
    generating: "Generating...",
    namePlaceholder: "Give them a name",
    ageLabel: "Age: {age}",
    male: "Male",
    female: "Female",
    sexualOrientation: "Sexual Orientation",
    cityPlaceholder: "Which city are they from?",
    mbtiPlaceholder: "Select MBTI type",
    personalityLabel: "Personality tags (multiple)",
    backgroundPlaceholder: "Describe their background story...",
    speechStylePlaceholder: "E.g. Likes to use emojis, speaks gently...",
    importChatHistory: "Import Chat History (Optional)",
    chatHistoryPlaceholder: `Supports two formats:

1. Simple text format (one per line):
User: Hello
AI: Hi~ Nice to meet you
User: Nice weather today

2. JSON format:
[{'{'}"role":"user","content":"Hello"{'}'}, {'{'}"role":"assistant","content":"Hi~"{'}'}]`,
    recognizedMessages: "{count} messages recognized",
    personalityDetails: "Personality Details (Optional)",
    hobbiesPlaceholder: "E.g. Photography, cooking, travel, yoga...",
    valuesPlaceholder: "E.g. Honesty, freedom, family first...",
    fearsPlaceholder: "E.g. Fear of abandonment, lack of security...",
    loveViewPlaceholder: "E.g. Slow and steady, independent yet interdependent...",
    dailyRoutinePlaceholder: "E.g. Wake up at 7am for a run, read at night...",
    favoriteThingsPlaceholder: "E.g. Cats, matcha latte, sunsets, rainy days...",
    lifeStory: "Life Story",
    lifeStoryPlaceholder: "Their complete life story, including childhood, adolescence, family of origin, major turning points...",
    culturalValues: "Cultural Values & Ideology",
    culturalValuesPlaceholder: "Their unique cultural values: emotional expression, views on family and responsibility, love philosophy, money views, gender role perceptions...",
    genderPerspective: "Gender Perspective",
    genderPerspectivePlaceholder: "Their unique perspective on gender roles, intimate relationships, and male-female interactions. E.g. Traditional, egalitarian, independent feminist, gentle straight male...",
    preview: "Preview",
    unnamed: "Unnamed",
    unknownCity: "Unknown City",
    alertFillRequired: "Please fill in name, city, and personality tags first for AI to generate a persona",
    alertGenerateFailed: "Generation failed: {error}",
    alertNetworkError: "Generation failed, please check network or try again later",
    alertCreateFailed: "Creation failed: {error}",
    alertNetworkCreateFailed: "Creation failed, please check network connection",
    mbtiTypes: {
      INTJ: "Architect",
      INTP: "Logician",
      ENTJ: "Commander",
      ENTP: "Debater",
      INFJ: "Advocate",
      INFP: "Mediator",
      ENFJ: "Protagonist",
      ENFP: "Campaigner",
      ISTJ: "Logistician",
      ISFJ: "Defender",
      ESTJ: "Executive",
      ESFJ: "Consul",
      ISTP: "Virtuoso",
      ISFP: "Adventurer",
      ESTP: "Entrepreneur",
      ESFP: "Entertainer"
    },
    errors: {
      nameRequired: "Name is required",
      ageRequired: "Age is required",
      genderRequired: "Gender is required",
      cityRequired: "City is required",
      personalityRequired: "Personality is required",
      personalityMin: "Select at least two personality tags",
      mbtiRequired: "MBTI is required",
      orientationRequired: "Sexual orientation is required",
      backgroundRequired: "Background story is required",
      backgroundMin: "Background story must be at least 5 characters",
      speechRequired: "Speech style is required",
      speechMin: "Speech style must be at least 5 characters"
    }
  };
  const messages$5 = {
    title: "Messages",
    searchPlaceholder: "Search",
    feedback: "Feedback",
    feedbackDesc: "Have questions or suggestions? Click to leave a message",
    noMessages: "No messages",
    createCompanionHint: "Create a companion to start chatting~",
    typing: "Typing...",
    noMessageYet: "No messages yet",
    loginRequiredFeedback: "Please log in first to use the feedback feature",
    justNow: "Just now",
    minutesAgo: "{count} min ago",
    hoursAgo: "{count} hr ago",
    yesterday: "Yesterday",
    daysAgo: "{count} days ago",
    searchNoResults: "No conversations match your search",
    chooseAction: "Choose an action",
    viewAllCompanions: "View all companions",
    allCompanionsDesc: "Browse all companions you've created"
  };
  const companionProfile$5 = {
    title: "trandsai Profile",
    loadingError: "Failed to load, please try again later",
    notFound: "trandsai not found",
    sendMessage: "Send Message",
    clone: "Clone & Create",
    chatTurns: "Chat Turns",
    moments: "Moments",
    daysTogether: "Days Together",
    about: "About",
    momentsTab: "Moments",
    background: "Background",
    speechStyle: "Speech Style",
    mbti: "MBTI",
    hobbies: "Hobbies",
    values: "Core Values",
    fears: "Vulnerabilities",
    loveView: "Love View",
    dailyRoutine: "Daily Routine",
    favoriteThings: "Favorite Things",
    meetTime: "Time We Met",
    noMoments: "No moments yet~",
    deleteConfirm: "Are you sure you want to delete this companion? All data will be cleared.",
    deleteFailed: "Delete failed",
    deleteCompanion: "Delete Companion",
    ageUnit: "years old",
    sexualOrientationLabel: "Sexual Orientation",
    creator: "Creator",
    sexualOrientation: {
      heterosexual: "Heterosexual",
      homosexual: "Homosexual",
      bisexual: "Bisexual",
      pansexual: "Pansexual",
      asexual: "Asexual",
      secret: "Secret"
    }
  };
  const feedback$5 = {
    title: "Feedback",
    subtitle: "Direct communication with admin",
    loading: "Loading...",
    noMessages: "No messages yet. Write your questions or suggestions~",
    placeholder: "Enter your questions or suggestions...",
    sendFailed: "Send failed, please try again",
    loginExpired: "Login expired, please log in again",
    loginRequired: "Please log in first"
  };
  const privacy$5 = {
    title: "Privacy Policy",
    openInBrowser: "Please open the privacy policy in your browser:"
  };
  const en = {
    language: language$5,
    common: common$5,
    nav: nav$5,
    login: login$5,
    register: register$5,
    home: home$5,
    chat: chat$5,
    discover: discover$5,
    profile: profile$5,
    myCompanions: myCompanions$5,
    intimacy: intimacy$5,
    notifications: notifications$5,
    notification: notification$5,
    notFound: notFound$5,
    createCompanion: createCompanion$5,
    messages: messages$5,
    companionProfile: companionProfile$5,
    feedback: feedback$5,
    privacy: privacy$5
  };
  const language$4 = {
    name: "日本語",
    select: "言語を選択"
  };
  const common$4 = {
    save: "保存",
    cancel: "キャンセル",
    "delete": "削除",
    edit: "編集",
    confirm: "確定",
    close: "閉じる",
    loading: "読み込み中...",
    search: "検索",
    noData: "データなし",
    success: "成功",
    failed: "失敗",
    networkError: "ネットワークエラー、後でもう一度お試しください",
    me: "自分"
  };
  const nav$4 = {
    home: "ホーム",
    messages: "メッセージ",
    chat: "チャット",
    discover: "発見",
    profile: "マイページ"
  };
  const login$4 = {
    title: "ログイン",
    username: "ユーザー名",
    password: "パスワード",
    loginBtn: "ログイン",
    registerBtn: "登録",
    noAccount: "アカウントをお持ちでないですか？",
    subtitle: "あなたのバーチャル恋人と再会しよう",
    errorEmpty: "ユーザー名とパスワードを入力してください",
    errorFailed: "ログインに失敗しました",
    loggingIn: "ログイン中..."
  };
  const register$4 = {
    title: "アカウント作成",
    "//username": "ユーザー名",
    email: "メールアドレス",
    nickname: "ニックネーム",
    password: "パスワード設定",
    confirmPassword: "パスワード確認",
    gender: "性別",
    male: "男性",
    female: "女性",
    secret: "秘密",
    registerBtn: "登録",
    hasAccount: "既にアカウントをお持ちですか？",
    goLogin: "ログイン",
    subtitle: "没入型恋愛の旅を始めよう",
    "//errorUsername": "ユーザー名は3文字以上にしてください",
    errorEmail: "有効なメールアドレスを入力してください",
    errorPassword: "パスワードは6文字以上にしてください",
    errorConfirm: "パスワードが一致しません",
    errorFailed: "登録に失敗しました",
    registering: "登録中...",
    sexualOrientation: "性的指向",
    heterosexual: "異性愛",
    homosexual: "同性愛",
    bisexual: "両性愛",
    pansexual: "パンセクシャル",
    asexual: "無性愛",
    agree: "登録により、以下に同意します",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    and: "および"
  };
  const home$4 = {
    title: "trandsai",
    myCompanions: "マイキャラ",
    createCompanion: "キャラ作成",
    noCompanions: "キャラがまだありません。作成しましょう！",
    justNow: "たった今",
    minutesAgo: "{count}分前",
    hoursAgo: "{count}時間前",
    daysAgo: "{count}日前",
    defaultCompanionName: "キャラ",
    create: "作成",
    noMoments: "まだ投稿がありません。trandsaiとお話ししましょう ~",
    writeComment: "コメントを書く...",
    noMoreMoments: "— これ以上ありません —",
    backToTop: "トップへ戻る",
    replyTo: "{name} に返信",
    replyPlaceholder: "{name} に返信...",
    momentFilter: "Moments を絞り込み",
    filterLanguage: "キャラの言語",
    filterGender: "性別",
    filterOrientation: "性的指向",
    filterAll: "すべて",
    resetFilter: "リセット",
    applyFilter: "適用"
  };
  const chat$4 = {
    placeholder: "メッセージを入力...",
    send: "送信",
    intimacy: "親密度",
    mood: "気分",
    online: "オンライン",
    connecting: "接続中...",
    loadingEarlier: "以前のメッセージを読み込み中...",
    loadingHistory: "チャット履歴を読み込み中...",
    noMessages: "まだメッセージがありません。会話を始めましょう～",
    defaultName: "キャラ",
    viewProfile: "プロフィールを見る",
    clearMessages: "チャット履歴を削除",
    confirmClearMessages: "すべてのチャット履歴を削除してもよろしいですか？この操作は元に戻せません。",
    clearSuccess: "削除しました",
    clearFailed: "削除に失敗しました",
    copySuccess: "コピーしました",
    doubleClickToCopy: "ダブルクリックでコピー",
    messageQueued: "再接続後に未送信メッセージが自動送信されます",
    sendQueuedHint: "未接続時に送ると、接続後に自動送信されます",
    accessDenied: "このキャラにアクセスする権限がありません",
    back: "戻る",
    notificationTitle: "新着メッセージ",
    notificationBody: "{preview}",
    connectionAbnormal: "接続に問題があります。しばらくしてから試してください",
    emojiSmile: "顔",
    emojiHeart: "ハート",
    emojiGesture: "ジェスチャー",
    emojiMisc: "その他",
    thinkingDismissHint: "タップで閉じる"
  };
  const discover$4 = {
    title: "発見",
    moments: "タイムライン",
    recommended: "おすすめ",
    searchPlaceholder: "知識ベースを検索...",
    searchBtn: "検索",
    searchResults: "検索結果",
    clear: "クリア",
    searching: "検索中...",
    noResults: "関連コンテンツが見つかりません",
    knowledgeEntry: "知識項目",
    trendingTopics: "人気トピック",
    viewMore: "もっと見る",
    recommendedMoments: "おすすめタイムライン",
    loading: "読み込み中...",
    noMoments: "まだ投稿がありません",
    upgradeMember: "メンバーアップグレード",
    upgradeDesc: "より多くのAI性格、専属ボイス、無制限のチャットを解放",
    learnMore: "詳細を見る",
    newPost: "投稿する",
    tabPosts: "投稿",
    tabCompanions: "キャラ",
    filterAll: "すべて",
    filterRecommended: "おすすめ",
    noCompanions: "キャラがいません",
    noPosts: "まだ投稿がありません。最初の投稿をしましょう！",
    noMorePosts: "これ以上ありません",
    noSearchResults: "一致する投稿が見つかりません",
    createPost: "投稿を作成",
    postTitle: "タイトル",
    titlePlaceholder: "投稿のタイトルを入力...",
    postContent: "内容",
    contentPlaceholder: "あなたの考えをシェア...",
    publish: "投稿",
    publishing: "投稿中...",
    createFailed: "投稿に失敗しました",
    viewDetail: "詳細を見る",
    postDetail: "投稿詳細",
    postNotFound: "投稿が見つかりません",
    comments: "コメント",
    noComments: "まだコメントがありません。最初のコメントを！",
    commentPlaceholder: "コメントを書く...",
    commentFailed: "コメント失敗",
    justNow: "たった今",
    minutesAgo: "{count}分前",
    hoursAgo: "{count}時間前",
    daysAgo: "{count}日前",
    postCategory: "カテゴリ",
    catAll: "すべて",
    catDating: "恋愛",
    catPsychology: "心理",
    catTips: "攻略",
    catStory: "ストーリー",
    catOfftopic: "雑談",
    cat_dating: "恋愛",
    cat_psychology: "心理",
    cat_tips: "攻略",
    cat_story: "ストーリー",
    cat_offtopic: "雑談",
    postImages: "画像",
    addImage: "画像を追加"
  };
  const profile$4 = {
    title: "マイページ",
    settings: "設定",
    logout: "ログアウト",
    language: "言語",
    notLoggedIn: "未ログイン",
    pleaseLogin: "ログインしてください",
    authorId: "作者ID",
    myCompanions: "マイ恋人",
    myCompanionsHint: "親密度 > 5 で表示",
    myMoments: "マイモーメント",
    intimacyRecord: "親密度記録",
    notificationSettings: "通知設定",
    languagePreference: "言語設定",
    accountSecurity: "アカウントとセキュリティ",
    privacyPolicy: "プライバシーポリシー",
    aboutUs: "私たちについて",
    darkMode: "ダークモード",
    lightMode: "ライトモード",
    editProfile: "プロフィール編集",
    enterNickname: "ニックネームを入力",
    age: "年齢",
    agePlaceholder: "任意、0～150",
    region: "地域",
    placeholderRegion: "例：東京都、大阪",
    occupation: "職業",
    placeholderOccupation: "例：学生、デザイナー",
    updateFailed: "更新に失敗しました",
    selectLanguage: "言語を選択",
    chatTurns: "対話回数",
    daysTogether: "一緒に過ごした日数",
    logoutConfirm: "ログアウトしますか？再度ログインが必要になります。",
    invalidAge: "18〜70の有効な年齢を入力してください",
    avatarUploadFailed: "アバターのアップロードに失敗しました"
  };
  const myCompanions$4 = {
    total: "総数",
    totalAffection: "総親密度",
    intimate: "親密数",
    soulmate: "ソウルメイト",
    close: "親しい",
    familiar: "馴染み",
    stranger: "初対面",
    selfCreated: "自分が作成",
    removeFromList: "リストから削除",
    removeConfirm: "「マイ恋人」リストからこのキャラを削除しますか？（キャラ自体は削除されません）"
  };
  const intimacy$4 = {
    avgAffection: "平均親密度",
    highest: "最高親密度",
    topCompanion: "最も親しい相手"
  };
  const notification$4 = {
    tip: "受け取る通知の種類を管理します",
    moments: "タイムライン更新",
    momentsDesc: "相手が新しい投稿をしたときに通知",
    messages: "メッセージ通知",
    messagesDesc: "新しいメッセージを受信したときに通知",
    system: "システム通知",
    systemDesc: "システムのお知らせと更新を受信",
    sound: "サウンド",
    soundDesc: "新しいメッセージで音を再生",
    email: "メール通知",
    emailDesc: "重要な通知をメールで受信"
  };
  const notFound$4 = {
    title: "ページが見つかりません",
    desc: "申し訳ありませんが、お探しのページは存在しません",
    back: "戻る",
    home: "ホーム"
  };
  const createCompanion$4 = {
    title: "バーチャル恋人を作成",
    basicInfo: "基本情報",
    name: "名前",
    age: "年齢",
    gender: "性別",
    city: "都市",
    personality: "性格",
    background: "背景",
    speechStyle: "話し方",
    hobbies: "趣味",
    values: "核となる価値観",
    fears: "不安",
    loveView: "恋愛観",
    dailyRoutine: "1日の流れ",
    favoriteThings: "好きなもの",
    mbti: "MBTI",
    preset: "プリセット",
    aiGenerate: "AI スマート生成",
    manualCreate: "手動作成",
    generateDesc: "AIがあなたの好みに応じてユニークなキャラを生成します",
    createBtn: "作成 ✨",
    autoFill: "一括入力",
    generating: "生成中...",
    namePlaceholder: "名前を付けてください",
    ageLabel: "年齢: {age}",
    male: "男性",
    female: "女性",
    sexualOrientation: "性的指向",
    cityPlaceholder: "どの都市出身ですか？",
    mbtiPlaceholder: "MBTIタイプを選択",
    personalityLabel: "性格タグ（複数可）",
    backgroundPlaceholder: "背景ストーリーを教えてください...",
    speechStylePlaceholder: "例：絵文字を使う、優しく話す...",
    importChatHistory: "チャット履歴をインポート（任意）",
    chatHistoryPlaceholder: `2つの形式に対応：

1. 簡易テキスト形式（1行1件）：
ユーザー: こんにちは
AI: こんにちは～よろしくね
ユーザー: 今日はいい天気

2. JSON形式：
[{'{'}"role":"user","content":"こんにちは"{'}'}, {'{'}"role":"assistant","content":"こんにちは～"{'}'}]`,
    recognizedMessages: "{count}件のメッセージを認識しました",
    personalityDetails: "人格の詳細（任意）",
    hobbiesPlaceholder: "例：写真、料理、旅行、ヨガ...",
    valuesPlaceholder: "例：誠実、自由、家族第一...",
    fearsPlaceholder: "例：見捨てられる恐怖、安心感の欠如...",
    loveViewPlaceholder: "例：長く安定した関係、独立しつつ支え合う...",
    dailyRoutinePlaceholder: "例：朝7時に起きてランニング、夜は読書...",
    favoriteThingsPlaceholder: "例：猫、抹茶ラテ、夕日、雨の日...",
    lifeStory: "人生の物語",
    lifeStoryPlaceholder: "幼少期、思春期、原生家庭、大きな転機を含む完全な人生ストーリー...",
    culturalValues: "文化的価値観とイデオロギー",
    culturalValuesPlaceholder: "独自の文化的価値観：感情表現、家族と責任への考え方、恋愛哲学、金銭感覚、性別役割認識...",
    genderPerspective: "ジェンダー観",
    genderPerspectivePlaceholder: "性別役割、親密な関係、男女の接し方に対する独自の考え方。例：伝統的、平等主義、独立した女性意識、優しい直男...",
    preview: "プレビュー",
    unnamed: "名前未設定",
    unknownCity: "未知の都市",
    alertFillRequired: "名前、都市、性格タグを入力すると、AIがキャラを生成できます",
    alertGenerateFailed: "生成に失敗しました: {error}",
    alertNetworkError: "生成に失敗しました。ネットワークを確認するか後でもう一度お試しください",
    alertCreateFailed: "作成に失敗しました: {error}",
    alertNetworkCreateFailed: "作成に失敗しました。ネットワーク接続を確認してください",
    mbtiTypes: {
      INTJ: "建築家",
      INTP: "論理学者",
      ENTJ: "指揮官",
      ENTP: "討論者",
      INFJ: "提唱者",
      INFP: "仲介者",
      ENFJ: "主人公",
      ENFP: "運動家",
      ISTJ: "管理者",
      ISFJ: "擁護者",
      ESTJ: "幹部",
      ESFJ: "領事官",
      ISTP: "巨匠",
      ISFP: "冒険家",
      ESTP: "起業家",
      ESFP: "エンターテイナー"
    },
    errors: {
      nameRequired: "名前を入力してください",
      ageRequired: "年齢を入力してください",
      genderRequired: "性別を選択してください",
      cityRequired: "都市を選択してください",
      personalityRequired: "性格を選択してください",
      personalityMin: "性格タグを2つ以上選択してください",
      mbtiRequired: "MBTIを選択してください",
      orientationRequired: "性的指向を選択してください",
      backgroundRequired: "背景ストーリーを入力してください",
      backgroundMin: "背景ストーリーは5文字以上で入力してください",
      speechRequired: "話し方を入力してください",
      speechMin: "話し方は5文字以上で入力してください"
    }
  };
  const messages$4 = {
    title: "メッセージ",
    searchPlaceholder: "検索",
    feedback: "フィードバック",
    feedbackDesc: "質問や提案がありますか？メッセージを残してください",
    noMessages: "メッセージがありません",
    createCompanionHint: "キャラを作成してチャットを始めましょう～",
    typing: "入力中...",
    noMessageYet: "まだメッセージがありません",
    loginRequiredFeedback: "フィードバック機能を使うには先にログインしてください",
    justNow: "たった今",
    minutesAgo: "{count}分前",
    hoursAgo: "{count}時間前",
    yesterday: "昨日",
    daysAgo: "{count}日前",
    searchNoResults: "一致する会話がありません",
    chooseAction: "操作を選択",
    viewAllCompanions: "すべてのキャラを見る",
    allCompanionsDesc: "作成したすべてのキャラを閲覧"
  };
  const companionProfile$4 = {
    title: "trandsai プロフィール",
    loadingError: "読み込みに失敗しました。後でもう一度お試しください",
    notFound: "trandsaiが見つかりません",
    sendMessage: "メッセージを送る",
    clone: "コピーして作成",
    chatTurns: "対話回数",
    moments: "タイムライン",
    daysTogether: "一緒に過ごした日数",
    about: "概要",
    momentsTab: "タイムライン",
    background: "背景",
    speechStyle: "話し方",
    mbti: "MBTI",
    hobbies: "趣味",
    values: "核となる価値観",
    fears: "弱さ",
    loveView: "恋愛観",
    dailyRoutine: "1日の流れ",
    favoriteThings: "好きなもの",
    meetTime: "出会った日",
    noMoments: "まだタイムラインの投稿がありません～",
    deleteConfirm: "このキャラを削除しますか？すべてのデータが消去されます。",
    deleteFailed: "削除に失敗しました",
    deleteCompanion: "キャラを削除",
    ageUnit: "歳",
    sexualOrientationLabel: "性的指向",
    creator: "作者",
    sexualOrientation: {
      heterosexual: "異性愛",
      homosexual: "同性愛",
      bisexual: "両性愛",
      pansexual: "パンセクシャル",
      asexual: "無性愛",
      secret: "秘密"
    }
  };
  const feedback$4 = {
    title: "フィードバック",
    subtitle: "管理者と直接連絡",
    loading: "読み込み中...",
    noMessages: "まだメッセージがありません。質問や提案を書いてください～",
    placeholder: "質問や提案を入力してください...",
    sendFailed: "送信に失敗しました。もう一度お試しください",
    loginExpired: "ログイン期限切れです。再度ログインしてください",
    loginRequired: "先にログインしてください"
  };
  const privacy$4 = {
    title: "プライバシーポリシー",
    openInBrowser: "ブラウザでプライバシーポリシーをご覧ください："
  };
  const notifications$4 = {
    title: "通知",
    tabAll: "すべて",
    empty: "通知はありません",
    welcome: "trandsai へようこそ。バーチャル恋人と交流をはじめましょう～",
    replyToYou: "あなたに返信：{content}"
  };
  const ja = {
    language: language$4,
    common: common$4,
    nav: nav$4,
    login: login$4,
    register: register$4,
    home: home$4,
    chat: chat$4,
    discover: discover$4,
    profile: profile$4,
    myCompanions: myCompanions$4,
    intimacy: intimacy$4,
    notification: notification$4,
    notFound: notFound$4,
    createCompanion: createCompanion$4,
    messages: messages$4,
    companionProfile: companionProfile$4,
    feedback: feedback$4,
    privacy: privacy$4,
    notifications: notifications$4
  };
  const language$3 = {
    name: "한국어",
    select: "언어 선택"
  };
  const common$3 = {
    save: "저장",
    cancel: "취소",
    "delete": "삭제",
    edit: "편집",
    confirm: "확인",
    close: "닫기",
    loading: "로딩 중...",
    search: "검색",
    noData: "데이터 없음",
    success: "성공",
    failed: "실패",
    networkError: "네트워크 오류, 잠시 후 다시 시도해주세요",
    me: "나"
  };
  const nav$3 = {
    home: "홈",
    messages: "메시지",
    chat: "채팅",
    discover: "발견",
    profile: "마이페이지"
  };
  const login$3 = {
    title: "로그인",
    username: "아이디",
    password: "비밀번호",
    loginBtn: "로그인",
    registerBtn: "회원가입",
    noAccount: "계정이 없으신가요?",
    subtitle: "가상 연인과 다시 만나세요",
    errorEmpty: "아이디와 비밀번호를 입력해주세요",
    errorFailed: "로그인 실패",
    loggingIn: "로그인 중..."
  };
  const register$3 = {
    title: "계정 만들기",
    "//username": "아이디",
    email: "이메일",
    nickname: "닉네임",
    password: "비밀번호 설정",
    confirmPassword: "비밀번호 확인",
    gender: "성별",
    male: "남성",
    female: "여성",
    secret: "비공개",
    registerBtn: "회원가입",
    hasAccount: "이미 계정이 있으신가요?",
    goLogin: "로그인",
    subtitle: "몰입형 연애 여정을 시작하세요",
    "//errorUsername": "아이디는 3자 이상이어야 합니다",
    errorEmail: "유효한 이메일 주소를 입력하세요",
    errorPassword: "비밀번호는 6자 이상이어야 합니다",
    errorConfirm: "비밀번호가 일치하지 않습니다",
    errorFailed: "회원가입 실패",
    registering: "가입 중...",
    sexualOrientation: "성적 지향",
    heterosexual: "이성애",
    homosexual: "동성애",
    bisexual: "양성애",
    pansexual: "범성애",
    asexual: "무성애",
    agree: "가입하면 다음에 동의합니다",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    and: " 및 "
  };
  const home$3 = {
    title: "trandsai",
    myCompanions: "나의 캐릭터",
    createCompanion: "캐릭터 만들기",
    noCompanions: "아직 캐릭터가 없습니다. 하나 만들어보세요!",
    justNow: "방금",
    minutesAgo: "{count}분 전",
    hoursAgo: "{count}시간 전",
    daysAgo: "{count}일 전",
    defaultCompanionName: "캐릭터",
    create: "만들기",
    noMoments: "아직 게시물이 없습니다. trandsai와 대화필보세요 ~",
    writeComment: "댓글 작성...",
    noMoreMoments: "— 더 이상 없음 —",
    backToTop: "맨 위로",
    replyTo: "{name}님에게 답글",
    replyPlaceholder: "{name}님에게 답글...",
    momentFilter: "모먼트 필터",
    filterLanguage: "캐릭터 언어",
    filterGender: "성별",
    filterOrientation: "성적 지향",
    filterAll: "전체",
    resetFilter: "초기화",
    applyFilter: "적용"
  };
  const chat$3 = {
    placeholder: "메시지를 입력하세요...",
    send: "보내기",
    intimacy: "친밀도",
    mood: "기분",
    online: "온라인",
    connecting: "연결 중...",
    loadingEarlier: "이전 메시지 불러오는 중...",
    loadingHistory: "채팅 기록 불러오는 중...",
    noMessages: "아직 메시지가 없습니다. 대화를 시작핼보세요~",
    defaultName: "캐릭터",
    viewProfile: "프로필 보기",
    clearMessages: "채팅 기록 삭제",
    confirmClearMessages: "모든 채팅 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    clearSuccess: "삭제 완료",
    clearFailed: "삭제 실패",
    copySuccess: "복사 완료",
    doubleClickToCopy: "더블 클릭하여 복사",
    messageQueued: "연결되면 대기 중인 메시지가 자동으로 전송됩니다",
    sendQueuedHint: "오프라인 상태에서 보내면 연결 후 자동 전송됩니다",
    accessDenied: "이 캐릭터에 접근할 수 없습니다",
    back: "뒤로",
    notificationTitle: "새 메시지",
    notificationBody: "{preview}",
    connectionAbnormal: "연결에 문제가 있어요. 잠시 후 다시 시도해 주세요",
    emojiSmile: "표정",
    emojiHeart: "하트",
    emojiGesture: "제스처",
    emojiMisc: "더보기",
    thinkingDismissHint: "탭하여 닫기"
  };
  const discover$3 = {
    title: "발견",
    moments: "타임라인",
    recommended: "추천",
    searchPlaceholder: "지식 베이스 검색...",
    searchBtn: "검색",
    searchResults: "검색 결과",
    clear: "지우기",
    searching: "검색 중...",
    noResults: "관련 내용을 찾을 수 없습니다",
    knowledgeEntry: "지식 항목",
    trendingTopics: "인기 토픽",
    viewMore: "더 보기",
    recommendedMoments: "추천 타임라인",
    loading: "로딩 중...",
    noMoments: "아직 게시물이 없습니다",
    upgradeMember: "멤버십 업그레이드",
    upgradeDesc: "더 많은 AI 성격, 전용 보이스, 무제한 채팅 해금",
    learnMore: "자세히 보기",
    newPost: "글쓰기",
    tabPosts: "글",
    tabCompanions: "캐릭터",
    filterAll: "전체",
    filterRecommended: "추천",
    noCompanions: "캐릭터가 없습니다",
    noPosts: "아직 글이 없습니다. 첫 글을 작성핳세요！",
    noMorePosts: "더 이상 없음",
    noSearchResults: "일치하는 글을 찾을 수 없습니다",
    createPost: "글 작성",
    postTitle: "제목",
    titlePlaceholder: "글 제목을 입력...",
    postContent: "내용",
    contentPlaceholder: "당신의 생각을 공유...",
    publish: "게시",
    publishing: "게시 중...",
    createFailed: "게시 실패",
    viewDetail: "자세히 보기",
    postDetail: "글 상세",
    postNotFound: "글을 찾을 수 없습니다",
    comments: "댓글",
    noComments: "아직 댓글이 없습니다. 첫 댓글을 달아보세요!",
    commentPlaceholder: "댓글을 작성...",
    commentFailed: "댓글 실패",
    justNow: "방금",
    minutesAgo: "{count}분 전",
    hoursAgo: "{count}시간 전",
    daysAgo: "{count}일 전",
    postCategory: "카테고리",
    catAll: "전체",
    catDating: "연애",
    catPsychology: "심리",
    catTips: "팁",
    catStory: "이야기",
    catOfftopic: "잡담",
    cat_dating: "연애",
    cat_psychology: "심리",
    cat_tips: "팁",
    cat_story: "이야기",
    cat_offtopic: "잡담",
    postImages: "이미지",
    addImage: "이미지 추가"
  };
  const profile$3 = {
    title: "마이페이지",
    settings: "설정",
    logout: "로그아웃",
    language: "언어",
    notLoggedIn: "로그인 안 됨",
    pleaseLogin: "로그인해주세요",
    authorId: "작가ID",
    myCompanions: "나의 연인",
    myCompanionsHint: "친밀도 > 5 시 표시",
    myMoments: "나의 모멘트",
    intimacyRecord: "친밀도 기록",
    notificationSettings: "알림 설정",
    languagePreference: "언어 설정",
    accountSecurity: "계정 및 보안",
    privacyPolicy: "개인정보 처리방침",
    aboutUs: "회사 소개",
    darkMode: "다크 모드",
    lightMode: "라이트 모드",
    editProfile: "프로필 수정",
    enterNickname: "닉네임을 입력하세요",
    age: "나이",
    agePlaceholder: "선택, 0–150",
    region: "지역",
    placeholderRegion: "예: 서울, 부산",
    occupation: "직업",
    placeholderOccupation: "예: 학생, 디자이너",
    updateFailed: "업데이트 실패",
    selectLanguage: "언어 선택",
    chatTurns: "대화 횟수",
    daysTogether: "함께한 날짜",
    logoutConfirm: "로그아웃하시겠습니까? 다시 로그인해야 합니다.",
    invalidAge: "18~70 사이의 유효한 나이를 입력해 주세요",
    avatarUploadFailed: "아바타 업로드에 실패했습니다"
  };
  const myCompanions$3 = {
    total: "총수",
    totalAffection: "총 친밀도",
    intimate: "친밀 수",
    soulmate: "소울메이트",
    close: "친근",
    familiar: "익숙한",
    stranger: "낯선",
    selfCreated: "직접 생성",
    removeFromList: "목록에서 제거",
    removeConfirm: "「내 연인」 목록에서 이 캐릭터를 제거할까요? (캐릭터 자체는 삭제되지 않습니다)"
  };
  const intimacy$3 = {
    avgAffection: "평균 친밀도",
    highest: "최고 친밀도",
    topCompanion: "가장 친한 연인"
  };
  const notification$3 = {
    tip: "받는 알림 유형을 관리합니다",
    moments: "타임라인 업데이트",
    momentsDesc: "연인이 새 게시물을 올리면 알림",
    messages: "메시지 알림",
    messagesDesc: "새 메시지를 받으면 알림",
    system: "시스템 알림",
    systemDesc: "시스템 공지 및 업데이트 수신",
    sound: "소리",
    soundDesc: "새 메시지 시 소리 재생",
    email: "이메일 알림",
    emailDesc: "중요 알림을 이메일로 수신"
  };
  const notFound$3 = {
    title: "페이지를 찾을 수 없습니다",
    desc: "죄송합니다. 찾으시는 페이지가 존재하지 않습니다",
    back: "뒤로 가기",
    home: "홈"
  };
  const createCompanion$3 = {
    title: "가상 연인 만들기",
    basicInfo: "기본 정보",
    name: "이름",
    age: "나이",
    gender: "성별",
    city: "도시",
    personality: "성격",
    background: "배경",
    speechStyle: "말투",
    hobbies: "취미",
    values: "핵심 가치관",
    fears: "두려움",
    loveView: "연애관",
    dailyRoutine: "하루 일과",
    favoriteThings: "좋아하는 것",
    mbti: "MBTI",
    preset: "프리셋",
    aiGenerate: "AI 스마트 생성",
    manualCreate: "수동 만들기",
    generateDesc: "AI가 당신의 취향에 맞는 독특한 캐릭터를 생성합니다",
    createBtn: "만들기 ✨",
    autoFill: "일괄 입력",
    generating: "생성 중...",
    namePlaceholder: "이름을 지어주세요",
    ageLabel: "나이: {age}",
    male: "남성",
    female: "여성",
    sexualOrientation: "성적 지향",
    cityPlaceholder: "어느 도시 출신인가요?",
    mbtiPlaceholder: "MBTI 유형 선택",
    personalityLabel: "성격 태그 (복수 선택)",
    backgroundPlaceholder: "배경 이야기를 설명해주세요...",
    speechStylePlaceholder: "예: 이모지를 좋아하고, 부드럽게 말한다...",
    importChatHistory: "채팅 기록 가져오기 (선택)",
    chatHistoryPlaceholder: `두 가지 형식을 지원합니다:

1. 간단 텍스트 형식 (한 줄에 하나씩):
사용자: 안녕
AI: 안녕~ 반가워
사용자: 오늘 날씨 좋다

2. JSON 형식:
[{'{'}"role":"user","content":"안녕"{'}'}, {'{'}"role":"assistant","content":"안녕~"{'}'}]`,
    recognizedMessages: "{count}개 메시지를 인식했습니다",
    personalityDetails: "입체적 인격 세부사항 (선택)",
    hobbiesPlaceholder: "예: 사진, 요리, 여행, 요가...",
    valuesPlaceholder: "예: 진실, 자유, 가족 최우선...",
    fearsPlaceholder: "예: 버려질 두려움, 불안정감...",
    loveViewPlaceholder: "예: 물 흐르듯이, 독립적이면서 서로 의지...",
    dailyRoutinePlaceholder: "예: 아침 7시 기상 후 달리기, 밤에는 독서...",
    favoriteThingsPlaceholder: "예: 고양이, 말차 라떼, 일몰, 비 오는 날...",
    lifeStory: "성장 경험",
    lifeStoryPlaceholder: "유년기, 청소년기, 원가족, 주요 전환점을 포함한 완전한 인생 이야기...",
    culturalValues: "문화적 가치관과 이념",
    culturalValuesPlaceholder: "독특한 문화적 가치관: 감정 표현 방식, 가족과 책임에 대한 관점, 연애 철학, 금전관, 성별 역할 인식...",
    genderPerspective: "성별 관점과 인식",
    genderPerspectivePlaceholder: "성별 역할, 친밀한 관계, 남녀 관계에 대한 독특한 인식. 예: 전통형, 평등주의, 독립적인 여성 의식, 부드러운 직남...",
    preview: "미리보기",
    unnamed: "이름 없음",
    unknownCity: "알 수 없는 도시",
    alertFillRequired: "이름, 도시, 성격 태그를 입력하면 AI가 캐릭터를 생성할 수 있습니다",
    alertGenerateFailed: "생성 실패: {error}",
    alertNetworkError: "생성에 실패했습니다. 네트워크를 확인하거나 나중에 다시 시도해주세요",
    alertCreateFailed: "생성 실패: {error}",
    alertNetworkCreateFailed: "생성에 실패했습니다. 네트워크 연결을 확인해주세요",
    mbtiTypes: {
      INTJ: "전략가",
      INTP: "논리술사",
      ENTJ: "통솔자",
      ENTP: "변론가",
      INFJ: "옹호자",
      INFP: "중재자",
      ENFJ: "선도자",
      ENFP: "활동가",
      ISTJ: "현실주의자",
      ISFJ: "수호자",
      ESTJ: "경영자",
      ESFJ: "집정관",
      ISTP: "장인",
      ISFP: "모험가",
      ESTP: "사업가",
      ESFP: "연예인"
    },
    errors: {
      nameRequired: "이름을 입력해 주세요",
      ageRequired: "나이를 입력해 주세요",
      genderRequired: "성별을 선택해 주세요",
      cityRequired: "도시를 선택해 주세요",
      personalityRequired: "성격을 선택해 주세요",
      personalityMin: "성격 태그를 최소 2개 선택해 주세요",
      mbtiRequired: "MBTI를 선택해 주세요",
      orientationRequired: "성적 지향을 선택해 주세요",
      backgroundRequired: "배경 이야기를 입력해 주세요",
      backgroundMin: "배경 이야기는 최소 5자 이상이어야 합니다",
      speechRequired: "말투를 입력해 주세요",
      speechMin: "말투는 최소 5자 이상이어야 합니다"
    }
  };
  const messages$3 = {
    title: "메시지",
    searchPlaceholder: "검색",
    feedback: "피드백",
    feedbackDesc: "질문이나 제안이 있으신가요? 메시지를 남겨주세요",
    noMessages: "메시지 없음",
    createCompanionHint: "캐릭터를 만들어 대화를 시작핼보세요~",
    typing: "입력 중...",
    noMessageYet: "아직 메시지가 없습니다",
    loginRequiredFeedback: "피드백 기능을 사용하려면 먼저 로그인해주세요",
    justNow: "방금",
    minutesAgo: "{count}분 전",
    hoursAgo: "{count}시간 전",
    yesterday: "어제",
    daysAgo: "{count}일 전",
    searchNoResults: "검색과 일치하는 대화가 없습니다",
    chooseAction: "작업 선택",
    viewAllCompanions: "모든 캐릭터 보기",
    allCompanionsDesc: "만든 모든 캐릭터 둘러보기"
  };
  const companionProfile$3 = {
    title: "trandsai 프로필",
    loadingError: "불러오기에 실패했습니다. 잠시 후 다시 시도해주세요",
    notFound: "trandsai를 찾을 수 없습니다",
    sendMessage: "메시지 복사하기",
    clone: "복사하여 생성",
    chatTurns: "대화 횟수",
    moments: "타임라인",
    daysTogether: "함께한 날짜",
    about: "소개",
    momentsTab: "타임라인",
    background: "배경",
    speechStyle: "말투",
    mbti: "MBTI",
    hobbies: "취미",
    values: "핵심 가치관",
    fears: "취약점",
    loveView: "연애관",
    dailyRoutine: "하루 일과",
    favoriteThings: "좋아하는 것",
    meetTime: "만난 날",
    noMoments: "아직 타임라인 게시물이 없습니다~",
    deleteConfirm: "이 캐릭터를 삭제하시겠습니까? 모든 데이터가 삭제됩니다.",
    deleteFailed: "삭제 실패",
    deleteCompanion: "캐릭터 삭제",
    ageUnit: "세",
    sexualOrientationLabel: "성적 지향",
    creator: "작성자",
    sexualOrientation: {
      heterosexual: "이성애",
      homosexual: "동성애",
      bisexual: "양성애",
      pansexual: "범성애",
      asexual: "무성애",
      secret: "비밀"
    }
  };
  const feedback$3 = {
    title: "피드백",
    subtitle: "관리자와 직접 소통",
    loading: "로딩 중...",
    noMessages: "아직 메시지가 없습니다. 질문이나 제안을 남겨주세요~",
    placeholder: "질문이나 제안을 입력하세요...",
    sendFailed: "전송 실패. 다시 시도해주세요",
    loginExpired: "로그인이 만료되었습니다. 다시 로그인해주세요",
    loginRequired: "먼저 로그인해주세요"
  };
  const privacy$3 = {
    title: "개인정보처리방침",
    openInBrowser: "브라우저에서 개인정보처리방침을 확인해 주세요:"
  };
  const notifications$3 = {
    title: "알림",
    tabAll: "전체",
    empty: "알림 없음",
    welcome: "trandsai에 오신 것을 환영합니다. 가상 연인과 소통해 보세요~",
    replyToYou: "회원님에게 답글: {content}"
  };
  const ko = {
    language: language$3,
    common: common$3,
    nav: nav$3,
    login: login$3,
    register: register$3,
    home: home$3,
    chat: chat$3,
    discover: discover$3,
    profile: profile$3,
    myCompanions: myCompanions$3,
    intimacy: intimacy$3,
    notification: notification$3,
    notFound: notFound$3,
    createCompanion: createCompanion$3,
    messages: messages$3,
    companionProfile: companionProfile$3,
    feedback: feedback$3,
    privacy: privacy$3,
    notifications: notifications$3
  };
  const language$2 = {
    name: "Português",
    select: "Selecionar idioma"
  };
  const common$2 = {
    save: "Salvar",
    cancel: "Cancelar",
    "delete": "Excluir",
    edit: "Editar",
    confirm: "Confirmar",
    close: "Fechar",
    loading: "Carregando...",
    search: "Pesquisar",
    noData: "Sem dados",
    success: "Sucesso",
    failed: "Falhou",
    networkError: "Erro de rede, por favor tente novamente mais tarde",
    me: "Eu"
  };
  const nav$2 = {
    home: "Início",
    messages: "Mensagens",
    chat: "Conversa",
    discover: "Descobrir",
    profile: "Perfil"
  };
  const login$2 = {
    title: "Entrar",
    username: "Nome de usuário",
    password: "Senha",
    loginBtn: "Entrar",
    registerBtn: "Cadastrar",
    noAccount: "Não tem conta?",
    subtitle: "Reencontre seu amor virtual",
    errorEmpty: "Por favor, insira nome de usuário e senha",
    errorFailed: "Falha no login",
    loggingIn: "Entrando..."
  };
  const register$2 = {
    title: "Criar Conta",
    "//username": "Nome de usuário",
    email: "E-mail",
    nickname: "Apelido",
    password: "Definir senha",
    confirmPassword: "Confirmar senha",
    gender: "Gênero",
    male: "Masculino",
    female: "Feminino",
    secret: "Secreto",
    registerBtn: "Cadastrar",
    hasAccount: "Já tem conta?",
    goLogin: "Entrar",
    subtitle: "Comece sua jornada de amor imersiva",
    "//errorUsername": "Nome de usuário deve ter pelo menos 3 caracteres",
    errorEmail: "Insira um e-mail válido",
    errorPassword: "Senha deve ter pelo menos 6 caracteres",
    errorConfirm: "As senhas não coincidem",
    errorFailed: "Falha no cadastro",
    registering: "Cadastrando...",
    sexualOrientation: "Orientação sexual",
    heterosexual: "Heterossexual",
    homosexual: "Homossexual",
    bisexual: "Bissexual",
    pansexual: "Pansexual",
    asexual: "Assexual",
    agree: "Ao se cadastrar, você concorda com",
    terms: "Termos de Serviço",
    privacy: "Política de Privacidade",
    and: " e "
  };
  const home$2 = {
    title: "trandsai",
    myCompanions: "Meus Personagens",
    createCompanion: "Criar Personagem",
    noCompanions: "Ainda não tem personagens. Crie um!",
    justNow: "Agora mesmo",
    minutesAgo: "{count} min atrás",
    hoursAgo: "{count} h atrás",
    daysAgo: "{count} dias atrás",
    defaultCompanionName: "Personagem",
    create: "Criar",
    noMoments: "Ainda não há momentos. Vá conversar com seu trandsai ~",
    writeComment: "Escrever comentário...",
    noMoreMoments: "— Fim —",
    backToTop: "Voltar ao topo",
    replyTo: "Responder a {name}",
    replyPlaceholder: "Responder a {name}...",
    momentFilter: "Filtrar Moments",
    filterLanguage: "Idioma do personagem",
    filterGender: "Gênero",
    filterOrientation: "Orientação",
    filterAll: "Todos",
    resetFilter: "Redefinir",
    applyFilter: "Aplicar"
  };
  const chat$2 = {
    placeholder: "Digite uma mensagem...",
    send: "Enviar",
    intimacy: "Intimidade",
    mood: "Humor",
    online: "Online",
    connecting: "Conectando...",
    loadingEarlier: "Carregando mensagens anteriores...",
    loadingHistory: "Carregando histórico de chat...",
    noMessages: "Ainda não há mensagens. Comece uma conversa~",
    defaultName: "Personagem",
    viewProfile: "Ver Perfil",
    clearMessages: "Limpar Histórico",
    confirmClearMessages: "Tem certeza de que deseja limpar todo o histórico de chat? Esta ação não pode ser desfeita.",
    clearSuccess: "Limpo com sucesso",
    clearFailed: "Falha ao limpar",
    copySuccess: "Copiado",
    doubleClickToCopy: "Duplo clique para copiar",
    messageQueued: "As mensagens pendentes serão enviadas ao reconectar",
    sendQueuedHint: "Offline, as mensagens ficam na fila até reconectar",
    accessDenied: "Sem permissão para este companheiro",
    back: "Voltar",
    notificationTitle: "Nova mensagem",
    notificationBody: "{preview}",
    connectionAbnormal: "Problema de conexão. Tente novamente em instantes.",
    emojiSmile: "Rostos",
    emojiHeart: "Coração",
    emojiGesture: "Gestos",
    emojiMisc: "Mais",
    thinkingDismissHint: "Toque para dispensar"
  };
  const discover$2 = {
    title: "Descobrir",
    moments: "Momentos",
    recommended: "Recomendado",
    searchPlaceholder: "Pesquisar tópicos da base de conhecimento...",
    searchBtn: "Pesquisar",
    searchResults: "Resultados da Pesquisa",
    clear: "Limpar",
    searching: "Pesquisando...",
    noResults: "Nenhum conteúdo relacionado encontrado",
    knowledgeEntry: "Entrada de Conhecimento",
    trendingTopics: "Tópicos em Alta",
    viewMore: "Ver Mais",
    recommendedMoments: "Momentos Recomendados",
    loading: "Carregando...",
    noMoments: "Ainda não há momentos",
    upgradeMember: "Atualizar Associação",
    upgradeDesc: "Desbloqueie mais personalidades de IA, vozes exclusivas, chats ilimitados",
    learnMore: "Saiba Mais",
    newPost: "Novo Post",
    tabPosts: "Posts",
    tabCompanions: "Personagens",
    filterAll: "Todos",
    filterRecommended: "Recomendado",
    noCompanions: "Nenhum personagem ainda",
    noPosts: "Ainda não há posts. Seja o primeiro a compartilhar!",
    noMorePosts: "Não há mais publicações",
    noSearchResults: "Nenhum post encontrado",
    createPost: "Criar Post",
    postTitle: "Título",
    titlePlaceholder: "Digite o título do post...",
    postContent: "Conteúdo",
    contentPlaceholder: "Compartilhe seus pensamentos...",
    publish: "Publicar",
    publishing: "Publicando...",
    createFailed: "Falha ao publicar",
    viewDetail: "Ver Detalhes",
    postDetail: "Detalhes do Post",
    postNotFound: "Post não encontrado",
    comments: "Comentários",
    noComments: "Ainda não há comentários. Seja o primeiro!",
    commentPlaceholder: "Escreva um comentário...",
    commentFailed: "Falha no comentário",
    justNow: "Agora mesmo",
    minutesAgo: "{count} min atrás",
    hoursAgo: "{count} hr atrás",
    daysAgo: "{count} dias atrás",
    postCategory: "Categoria",
    catAll: "Tudo",
    catDating: "Namoro",
    catPsychology: "Psicologia",
    catTips: "Dicas",
    catStory: "Histórias",
    catOfftopic: "Off-topic",
    cat_dating: "Namoro",
    cat_psychology: "Psicologia",
    cat_tips: "Dicas",
    cat_story: "Histórias",
    cat_offtopic: "Off-topic",
    postImages: "Imagens",
    addImage: "Adicionar imagem"
  };
  const profile$2 = {
    title: "Perfil",
    settings: "Configurações",
    logout: "Sair",
    language: "Idioma",
    notLoggedIn: "Não logado",
    pleaseLogin: "Por favor, faça login",
    authorId: "ID do Autor",
    myCompanions: "Meus Personagens",
    myCompanionsHint: "Intimidade > 5 para aparecer",
    myMoments: "Meus Momentos",
    intimacyRecord: "Registro de Intimidade",
    notificationSettings: "Notificações",
    languagePreference: "Preferência de Idioma",
    accountSecurity: "Conta e Segurança",
    privacyPolicy: "Política de Privacidade",
    aboutUs: "Sobre Nós",
    darkMode: "Modo Escuro",
    lightMode: "Modo Claro",
    editProfile: "Editar Perfil",
    enterNickname: "Digite seu apelido",
    age: "Idade",
    agePlaceholder: "Opcional, 0–150",
    region: "Região",
    placeholderRegion: "ex.: São Paulo, Lisboa",
    occupation: "Profissão",
    placeholderOccupation: "ex.: Estudante, designer",
    updateFailed: "Falha na atualização",
    selectLanguage: "Selecionar Idioma",
    chatTurns: "Turnos de Conversa",
    daysTogether: "Dias Juntos",
    logoutConfirm: "Tem certeza de que deseja sair? Você precisará entrar novamente.",
    invalidAge: "Informe uma idade válida entre 18 e 70",
    avatarUploadFailed: "Falha ao enviar o avatar"
  };
  const myCompanions$2 = {
    total: "Total",
    totalAffection: "Afeição Total",
    intimate: "Qtd. Íntimos",
    soulmate: "Alma gêmea",
    close: "Próximo",
    familiar: "Familiar",
    stranger: "Desconhecido",
    selfCreated: "Criado por você",
    removeFromList: "Remover da lista",
    removeConfirm: "Remover este personagem de Meus companheiros? (O personagem em si não será excluído)"
  };
  const intimacy$2 = {
    avgAffection: "Afeição Média",
    highest: "Maior Afeição",
    topCompanion: "Parceiro Mais Próximo"
  };
  const notification$2 = {
    tip: "Gerencie os tipos de notificações que você recebe",
    moments: "Atualizações da Linha do Tempo",
    momentsDesc: "Notificar quando parceiros postarem novos momentos",
    messages: "Mensagens",
    messagesDesc: "Notificar ao receber novas mensagens",
    system: "Sistema",
    systemDesc: "Receber anúncios e atualizações do sistema",
    sound: "Som",
    soundDesc: "Reproduzir som em novas mensagens",
    email: "E-mail",
    emailDesc: "Receber notificações importantes por e-mail"
  };
  const notFound$2 = {
    title: "Página Não Encontrada",
    desc: "Desculpe, a página que você está procurando não existe",
    back: "Voltar",
    home: "Início"
  };
  const createCompanion$2 = {
    title: "Criar Amor Virtual",
    basicInfo: "Informações Básicas",
    name: "Nome",
    age: "Idade",
    gender: "Gênero",
    city: "Cidade",
    personality: "Personalidade",
    background: "História",
    speechStyle: "Estilo de fala",
    hobbies: "Hobbies",
    values: "Valores Centrais",
    fears: "Medos",
    loveView: "Visão de amor",
    dailyRoutine: "Rotina diária",
    favoriteThings: "Coisas favoritas",
    mbti: "MBTI",
    preset: "Predefinição",
    aiGenerate: "Geração Inteligente com AI",
    manualCreate: "Criar manualmente",
    generateDesc: "Deixe a AI gerar uma persona única baseada nas suas preferências",
    createBtn: "Criar ✨",
    autoFill: "Preencher Automaticamente",
    generating: "Gerando...",
    namePlaceholder: "Dê um nome",
    ageLabel: "Idade: {age}",
    male: "Masculino",
    female: "Feminino",
    sexualOrientation: "Orientação Sexual",
    cityPlaceholder: "De qual cidade ele/a é?",
    mbtiPlaceholder: "Selecione o tipo MBTI",
    personalityLabel: "Tags de personalidade (múltiplas)",
    backgroundPlaceholder: "Descreva a história de fundo...",
    speechStylePlaceholder: "Ex: Gosta de usar emojis, fala gentilmente...",
    importChatHistory: "Importar Histórico de Chat (Opcional)",
    chatHistoryPlaceholder: `Suporta dois formatos:

1. Formato de texto simples (um por linha):
Usuário: Olá
AI: Oi~ Prazer em te conhecer
Usuário: Hoje o tempo está bom

2. Formato JSON:
[{'{'}"role":"user","content":"Olá"{'}'}, {'{'}"role":"assistant","content":"Oi~"{'}'}]`,
    recognizedMessages: "{count} mensagens reconhecidas",
    personalityDetails: "Detalhes da Personalidade (Opcional)",
    hobbiesPlaceholder: "Ex: Fotografia, culinária, viagens, yoga...",
    valuesPlaceholder: "Ex: Honestidade, liberdade, família em primeiro lugar...",
    fearsPlaceholder: "Ex: Medo de abandono, falta de segurança...",
    loveViewPlaceholder: "Ex: Devagar e sempre, independentes mas interdependentes...",
    dailyRoutinePlaceholder: "Ex: Acorda às 7h para correr, lê à noite...",
    favoriteThingsPlaceholder: "Ex: Gatos, matcha latte, pôr do sol, dias chuvosos...",
    lifeStory: "História de Vida",
    lifeStoryPlaceholder: "A história completa da vida, incluindo infância, adolescência, família de origem, grandes viradas...",
    culturalValues: "Valores Culturais e Ideologia",
    culturalValuesPlaceholder: "Seus valores culturais únicos: expressão emocional, visão sobre família e responsabilidade, filosofia do amor, visão de dinheiro, percepção de papéis de gênero...",
    genderPerspective: "Perspectiva de Gênero",
    genderPerspectivePlaceholder: "Sua perspectiva única sobre papéis de gênero, relacionamentos íntimos e interação entre homens e mulheres. Ex: Tradicional, igualitário, feminista independente, homem straight gentil...",
    preview: "Pré-visualização",
    unnamed: "Sem Nome",
    unknownCity: "Cidade Desconhecida",
    alertFillRequired: "Por favor, preencha nome, cidade e tags de personalidade primeiro para a AI gerar uma persona",
    alertGenerateFailed: "Falha na geração: {error}",
    alertNetworkError: "Falha na geração, verifique a rede ou tente novamente mais tarde",
    alertCreateFailed: "Falha na criação: {error}",
    alertNetworkCreateFailed: "Falha na criação, verifique a conexão de rede",
    mbtiTypes: {
      INTJ: "Arquiteto",
      INTP: "Lógico",
      ENTJ: "Comandante",
      ENTP: "Debatedor",
      INFJ: "Advogado",
      INFP: "Mediador",
      ENFJ: "Protagonista",
      ENFP: "Ativista",
      ISTJ: "Logístico",
      ISFJ: "Defensor",
      ESTJ: "Executivo",
      ESFJ: "Cônsul",
      ISTP: "Virtuoso",
      ISFP: "Aventureiro",
      ESTP: "Empreendedor",
      ESFP: "Animador"
    },
    errors: {
      nameRequired: "O nome é obrigatório",
      ageRequired: "A idade é obrigatória",
      genderRequired: "O gênero é obrigatório",
      cityRequired: "A cidade é obrigatória",
      personalityRequired: "A personalidade é obrigatória",
      personalityMin: "Selecione pelo menos duas tags de personalidade",
      mbtiRequired: "O MBTI é obrigatório",
      orientationRequired: "A orientação sexual é obrigatória",
      backgroundRequired: "A história de fundo é obrigatória",
      backgroundMin: "A história de fundo deve ter pelo menos 5 caracteres",
      speechRequired: "O estilo de fala é obrigatório",
      speechMin: "O estilo de fala deve ter pelo menos 5 caracteres"
    }
  };
  const messages$2 = {
    title: "Mensagens",
    searchPlaceholder: "Pesquisar",
    feedback: "Feedback",
    feedbackDesc: "Tem perguntas ou sugestões? Clique para deixar uma mensagem",
    noMessages: "Sem mensagens",
    createCompanionHint: "Crie um personagem para começar a conversar~",
    typing: "Digitando...",
    noMessageYet: "Ainda não há mensagens",
    loginRequiredFeedback: "Faça login primeiro para usar o recurso de feedback",
    justNow: "Agora mesmo",
    minutesAgo: "{count} min atrás",
    hoursAgo: "{count} h atrás",
    yesterday: "Ontem",
    daysAgo: "{count} dias atrás",
    searchNoResults: "Nenhuma conversa encontrada",
    chooseAction: "Escolher ação",
    viewAllCompanions: "Ver todos os personagens",
    allCompanionsDesc: "Navegue por todos os personagens que você criou"
  };
  const companionProfile$2 = {
    title: "Perfil do trandsai",
    loadingError: "Falha ao carregar, por favor tente novamente mais tarde",
    notFound: "trandsai não encontrado",
    sendMessage: "Enviar Mensagem",
    clone: "Clonar e Criar",
    chatTurns: "Turnos de Conversa",
    moments: "Momentos",
    daysTogether: "Dias Juntos",
    about: "Sobre",
    momentsTab: "Momentos",
    background: "História",
    speechStyle: "Estilo de Fala",
    mbti: "MBTI",
    hobbies: "Hobbies",
    values: "Valores Centrais",
    fears: "Vulnerabilidades",
    loveView: "Visão de Amor",
    dailyRoutine: "Rotina Diária",
    favoriteThings: "Coisas Favoritas",
    meetTime: "Momento do Encontro",
    noMoments: "Ainda não há momentos~",
    deleteConfirm: "Tem certeza de que deseja excluir este personagem? Todos os dados serão apagados.",
    deleteFailed: "Falha ao excluir",
    deleteCompanion: "Excluir Personagem",
    ageUnit: "anos",
    sexualOrientationLabel: "Orientação Sexual",
    creator: "Criador",
    sexualOrientation: {
      heterosexual: "Heterossexual",
      homosexual: "Homossexual",
      bisexual: "Bissexual",
      pansexual: "Pansexual",
      asexual: "Assexual",
      secret: "Secreto"
    }
  };
  const feedback$2 = {
    title: "Feedback",
    subtitle: "Comunicação direta com o administrador",
    loading: "Carregando...",
    noMessages: "Ainda não há mensagens. Escreva suas perguntas ou sugestões~",
    placeholder: "Digite suas perguntas ou sugestões...",
    sendFailed: "Falha no envio, por favor tente novamente",
    loginExpired: "Login expirado, por favor faça login novamente",
    loginRequired: "Faça login primeiro"
  };
  const privacy$2 = {
    title: "Política de Privacidade",
    openInBrowser: "Abra a política de privacidade no navegador:"
  };
  const notifications$2 = {
    title: "Notificações",
    tabAll: "Todas",
    empty: "Sem notificações",
    welcome: "Bem-vindo ao trandsai. Comece a interagir com seu companheiro virtual!",
    replyToYou: "Respondeu a você: {content}"
  };
  const pt = {
    language: language$2,
    common: common$2,
    nav: nav$2,
    login: login$2,
    register: register$2,
    home: home$2,
    chat: chat$2,
    discover: discover$2,
    profile: profile$2,
    myCompanions: myCompanions$2,
    intimacy: intimacy$2,
    notification: notification$2,
    notFound: notFound$2,
    createCompanion: createCompanion$2,
    messages: messages$2,
    companionProfile: companionProfile$2,
    feedback: feedback$2,
    privacy: privacy$2,
    notifications: notifications$2
  };
  const language$1 = {
    name: "Español",
    select: "Seleccionar idioma"
  };
  const common$1 = {
    save: "Guardar",
    cancel: "Cancelar",
    "delete": "Eliminar",
    edit: "Editar",
    confirm: "Confirmar",
    close: "Cerrar",
    loading: "Cargando...",
    search: "Buscar",
    noData: "Sin datos",
    success: "Éxito",
    failed: "Falló",
    networkError: "Error de red, por favor intenta más tarde",
    me: "Yo"
  };
  const nav$1 = {
    home: "Inicio",
    messages: "Mensajes",
    chat: "Chat",
    discover: "Descubrir",
    profile: "Perfil"
  };
  const login$1 = {
    title: "Iniciar sesión",
    username: "Usuario",
    password: "Contraseña",
    loginBtn: "Entrar",
    registerBtn: "Registrarse",
    noAccount: "¿No tienes cuenta?",
    subtitle: "Reencuentra a tu amor virtual",
    errorEmpty: "Por favor ingresa usuario y contraseña",
    errorFailed: "Error al iniciar sesión",
    loggingIn: "Iniciando sesión..."
  };
  const register$1 = {
    title: "Crear Cuenta",
    _comment_username: "已改为 email，旧值: Usuario",
    email: "Correo electrónico",
    nickname: "Apodo",
    password: "Establecer contraseña",
    confirmPassword: "Confirmar contraseña",
    gender: "Género",
    male: "Hombre",
    female: "Mujer",
    secret: "Secreto",
    registerBtn: "Registrarse",
    hasAccount: "¿Ya tienes cuenta?",
    goLogin: "Iniciar sesión",
    subtitle: "Comienza tu viaje de amor inmersivo",
    "//errorUsername": "El usuario debe tener al menos 3 caracteres",
    errorEmail: "Ingrese un correo electrónico válido",
    errorPassword: "La contraseña debe tener al menos 6 caracteres",
    errorConfirm: "Las contraseñas no coinciden",
    errorFailed: "Error en el registro",
    registering: "Registrando...",
    sexualOrientation: "Orientación sexual",
    heterosexual: "Heterosexual",
    homosexual: "Homosexual",
    bisexual: "Bisexual",
    pansexual: "Pansexual",
    asexual: "Asexual",
    agree: "Al registrarte, aceptas los",
    terms: "Términos de Servicio",
    privacy: "Política de Privacidad",
    and: " y "
  };
  const home$1 = {
    title: "trandsai",
    myCompanions: "Mis Personajes",
    createCompanion: "Crear Personaje",
    noCompanions: "Aún no tienes personajes. ¡Crea uno!",
    justNow: "Ahora mismo",
    minutesAgo: "hace {count} min",
    hoursAgo: "hace {count} h",
    daysAgo: "hace {count} días",
    defaultCompanionName: "Personaje",
    create: "Crear",
    noMoments: "Aún no hay momentos. Ve a chatear con tu trandsai ~",
    writeComment: "Escribir comentario...",
    noMoreMoments: "— No hay más —",
    backToTop: "Volver arriba",
    replyTo: "Responder a {name}",
    replyPlaceholder: "Responder a {name}...",
    momentFilter: "Filtrar Moments",
    filterLanguage: "Idioma del personaje",
    filterGender: "Género",
    filterOrientation: "Orientación",
    filterAll: "Todos",
    resetFilter: "Restablecer",
    applyFilter: "Aplicar"
  };
  const chat$1 = {
    placeholder: "Escribe un mensaje...",
    send: "Enviar",
    intimacy: "Intimidad",
    mood: "Estado de ánimo",
    online: "En línea",
    connecting: "Conectando...",
    loadingEarlier: "Cargando mensajes anteriores...",
    loadingHistory: "Cargando historial de chat...",
    noMessages: "Aún no hay mensajes. ¡Inicia una conversación~",
    defaultName: "Personaje",
    viewProfile: "Ver Perfil",
    clearMessages: "Borrar Historial",
    confirmClearMessages: "¿Estás seguro de que quieres borrar todo el historial de chat? Esta acción no se puede deshacer.",
    clearSuccess: "Borrado con éxito",
    clearFailed: "Error al borrar",
    copySuccess: "Copiado",
    doubleClickToCopy: "Doble clic para copiar",
    messageQueued: "Los mensajes pendientes se enviarán al reconectar",
    sendQueuedHint: "Sin conexión, los envíos quedan en cola hasta reconectar",
    accessDenied: "Sin acceso a este compañero",
    back: "Volver",
    notificationTitle: "Nuevo mensaje",
    notificationBody: "{preview}",
    connectionAbnormal: "Problema de conexión. Inténtalo de nuevo.",
    emojiSmile: "Caras",
    emojiHeart: "Corazón",
    emojiGesture: "Gestos",
    emojiMisc: "Más",
    thinkingDismissHint: "Toca para cerrar"
  };
  const discover$1 = {
    title: "Descubrir",
    moments: "Momentos",
    recommended: "Recomendado",
    searchPlaceholder: "Buscar temas de la base de conocimientos...",
    searchBtn: "Buscar",
    searchResults: "Resultados de Búsqueda",
    clear: "Limpiar",
    searching: "Buscando...",
    noResults: "No se encontró contenido relacionado",
    knowledgeEntry: "Entrada de Conocimiento",
    trendingTopics: "Temas Populares",
    viewMore: "Ver Más",
    recommendedMoments: "Momentos Recomendados",
    loading: "Cargando...",
    noMoments: "Aún no hay momentos",
    upgradeMember: "Actualizar Membresía",
    upgradeDesc: "Desbloquea más personalidades de IA, voces exclusivas, chats ilimitados",
    learnMore: "Saber Más",
    newPost: "Nueva Publicación",
    tabPosts: "Publicaciones",
    tabCompanions: "Personajes",
    filterAll: "Todos",
    filterRecommended: "Recomendado",
    noCompanions: "Aún no hay personajes",
    noPosts: "Aún no hay publicaciones. ¡Sé el primero en compartir!",
    noMorePosts: "No hay más publicaciones",
    noSearchResults: "No se encontraron publicaciones",
    createPost: "Crear Publicación",
    postTitle: "Título",
    titlePlaceholder: "Ingresa el título...",
    postContent: "Contenido",
    contentPlaceholder: "Comparte tus pensamientos...",
    publish: "Publicar",
    publishing: "Publicando...",
    createFailed: "Error al publicar",
    viewDetail: "Ver Detalle",
    postDetail: "Detalle de Publicación",
    postNotFound: "Publicación no encontrada",
    comments: "Comentarios",
    noComments: "Aún no hay comentarios. ¡Sé el primero!",
    commentPlaceholder: "Escribe un comentario...",
    commentFailed: "Error en comentario",
    justNow: "Ahora mismo",
    minutesAgo: "hace {count} min",
    hoursAgo: "hace {count} hr",
    daysAgo: "hace {count} días",
    postCategory: "Categoría",
    catAll: "Todo",
    catDating: "Citas",
    catPsychology: "Psicología",
    catTips: "Consejos",
    catStory: "Historias",
    catOfftopic: "Off-topic",
    cat_dating: "Citas",
    cat_psychology: "Psicología",
    cat_tips: "Consejos",
    cat_story: "Historias",
    cat_offtopic: "Off-topic",
    postImages: "Imágenes",
    addImage: "Añadir imagen"
  };
  const profile$1 = {
    title: "Perfil",
    settings: "Ajustes",
    logout: "Cerrar sesión",
    language: "Idioma",
    notLoggedIn: "No has iniciado sesión",
    pleaseLogin: "Por favor inicia sesión",
    authorId: "ID de Autor",
    myCompanions: "Mis Personajes",
    myCompanionsHint: "Intimidad > 5 para aparecer",
    myMoments: "Mis Momentos",
    intimacyRecord: "Registro de Intimidad",
    notificationSettings: "Notificaciones",
    languagePreference: "Preferencia de Idioma",
    accountSecurity: "Cuenta y Seguridad",
    privacyPolicy: "Política de Privacidad",
    aboutUs: "Sobre Nosotros",
    darkMode: "Modo Oscuro",
    lightMode: "Modo Claro",
    editProfile: "Editar Perfil",
    enterNickname: "Ingresa tu apodo",
    age: "Edad",
    agePlaceholder: "Opcional, 0–150",
    region: "Región",
    placeholderRegion: "ej.: Madrid, CDMX",
    occupation: "Ocupación",
    placeholderOccupation: "ej.: Estudiante, diseñador",
    updateFailed: "Error al actualizar",
    selectLanguage: "Seleccionar Idioma",
    chatTurns: "Turnos de Chat",
    daysTogether: "Días Juntos",
    logoutConfirm: "¿Seguro que quieres cerrar sesión? Tendrás que iniciar sesión de nuevo.",
    invalidAge: "Introduce una edad válida entre 18 y 70",
    avatarUploadFailed: "Error al subir el avatar"
  };
  const myCompanions$1 = {
    total: "Total",
    totalAffection: "Afecto Total",
    intimate: "Cant. Íntimos",
    soulmate: "Alma gemela",
    close: "Cercano",
    familiar: "Familiar",
    stranger: "Desconocido",
    selfCreated: "Creado por ti",
    removeFromList: "Quitar de la lista",
    removeConfirm: "¿Quitar este personaje de Mis compañeros? (El personaje no se eliminará)"
  };
  const intimacy$1 = {
    avgAffection: "Afecto Promedio",
    highest: "Mayor Afecto",
    topCompanion: "Pareja Más Cercana"
  };
  const notification$1 = {
    tip: "Gestiona los tipos de notificaciones que recibes",
    moments: "Actualizaciones de Momentos",
    momentsDesc: "Notificar cuando las parejas publiquen nuevos momentos",
    messages: "Mensajes",
    messagesDesc: "Notificar al recibir nuevos mensajes",
    system: "Sistema",
    systemDesc: "Recibir anuncios y actualizaciones del sistema",
    sound: "Sonido",
    soundDesc: "Reproducir sonido en mensajes nuevos",
    email: "Correo",
    emailDesc: "Recibir notificaciones importantes por correo"
  };
  const notFound$1 = {
    title: "Página No Encontrada",
    desc: "Lo sentimos, la página que buscas no existe",
    back: "Volver",
    home: "Inicio"
  };
  const createCompanion$1 = {
    title: "Crear Amor Virtual",
    basicInfo: "Información básica",
    name: "Nombre",
    age: "Edad",
    gender: "Género",
    city: "Ciudad",
    personality: "Personalidad",
    background: "Historia",
    speechStyle: "Estilo de habla",
    hobbies: "Hobbies",
    values: "Valores Centrales",
    fears: "Miedos",
    loveView: "Visión del amor",
    dailyRoutine: "Rutina diaria",
    favoriteThings: "Cosas favoritas",
    mbti: "MBTI",
    preset: "Predefinido",
    aiGenerate: "Generación Inteligente con AI",
    manualCreate: "Crear manualmente",
    generateDesc: "Deja que la AI genere una persona única basada en tus preferencias",
    createBtn: "Crear ✨",
    autoFill: "Rellenar Automáticamente",
    generating: "Generando...",
    namePlaceholder: "Dale un nombre",
    ageLabel: "Edad: {age}",
    male: "Hombre",
    female: "Mujer",
    sexualOrientation: "Orientación Sexual",
    cityPlaceholder: "¿De qué ciudad es?",
    mbtiPlaceholder: "Selecciona el tipo MBTI",
    personalityLabel: "Etiquetas de personalidad (múltiples)",
    backgroundPlaceholder: "Describe su historia de fondo...",
    speechStylePlaceholder: "Ej: Le gusta usar emojis, habla suavemente...",
    importChatHistory: "Importar Historial de Chat (Opcional)",
    chatHistoryPlaceholder: `Soporta dos formatos:

1. Formato de texto simple (uno por línea):
Usuario: Hola
AI: Hola~ Encantado de conocerte
Usuario: Hace buen tiempo hoy

2. Formato JSON:
[{'{'}"role":"user","content":"Hola"{'}'}, {'{'}"role":"assistant","content":"Hola~"{'}'}]`,
    recognizedMessages: "{count} mensajes reconocidos",
    personalityDetails: "Detalles de Personalidad (Opcional)",
    hobbiesPlaceholder: "Ej: Fotografía, cocina, viajes, yoga...",
    valuesPlaceholder: "Ej: Honestidad, libertad, familia primero...",
    fearsPlaceholder: "Ej: Miedo al abandono, falta de seguridad...",
    loveViewPlaceholder: "Ej: Lento pero seguro, independientes pero interdependientes...",
    dailyRoutinePlaceholder: "Ej: Despierta a las 7am para correr, lee por la noche...",
    favoriteThingsPlaceholder: "Ej: Gatos, matcha latte, atardeceres, días lluviosos...",
    lifeStory: "Historia de Vida",
    lifeStoryPlaceholder: "Su historia de vida completa, incluyendo infancia, adolescencia, familia de origen, grandes giros...",
    culturalValues: "Valores Culturales e Ideología",
    culturalValuesPlaceholder: "Sus valores culturales únicos: expresión emocional, visión sobre familia y responsabilidad, filosofía del amor, visión del dinero, percepción de roles de género...",
    genderPerspective: "Perspectiva de Género",
    genderPerspectivePlaceholder: "Su perspectiva única sobre roles de género, relaciones íntimas e interacción entre hombres y mujeres. Ej: Tradicional, igualitario, feminista independiente, hombre straight gentil...",
    preview: "Vista Previa",
    unnamed: "Sin Nombre",
    unknownCity: "Ciudad Desconocida",
    alertFillRequired: "Por favor, completa nombre, ciudad y etiquetas de personalidad primero para que la AI genere una persona",
    alertGenerateFailed: "Fallo en la generación: {error}",
    alertNetworkError: "Fallo en la generación, verifica la red o intenta más tarde",
    alertCreateFailed: "Fallo en la creación: {error}",
    alertNetworkCreateFailed: "Fallo en la creación, verifica la conexión de red",
    mbtiTypes: {
      INTJ: "Arquitecto",
      INTP: "Lógico",
      ENTJ: "Comandante",
      ENTP: "Debatiente",
      INFJ: "Abogado",
      INFP: "Mediador",
      ENFJ: "Protagonista",
      ENFP: "Activista",
      ISTJ: "Logista",
      ISFJ: "Defensor",
      ESTJ: "Ejecutivo",
      ESFJ: "Cónsul",
      ISTP: "Virtuoso",
      ISFP: "Aventurero",
      ESTP: "Emprendedor",
      ESFP: "Animador"
    },
    errors: {
      nameRequired: "El nombre es obligatorio",
      ageRequired: "La edad es obligatoria",
      genderRequired: "El género es obligatorio",
      cityRequired: "La ciudad es obligatoria",
      personalityRequired: "La personalidad es obligatoria",
      personalityMin: "Selecciona al menos dos etiquetas de personalidad",
      mbtiRequired: "El MBTI es obligatorio",
      orientationRequired: "La orientación sexual es obligatoria",
      backgroundRequired: "La historia de fondo es obligatoria",
      backgroundMin: "La historia de fondo debe tener al menos 5 caracteres",
      speechRequired: "El estilo de habla es obligatorio",
      speechMin: "El estilo de habla debe tener al menos 5 caracteres"
    }
  };
  const messages$1 = {
    title: "Mensajes",
    searchPlaceholder: "Buscar",
    feedback: "Feedback",
    feedbackDesc: "¿Tienes preguntas o sugerencias? Haz clic para dejar un mensaje",
    noMessages: "Sin mensajes",
    createCompanionHint: "¡Crea un personaje para empezar a chatear~",
    typing: "Escribiendo...",
    noMessageYet: "Aún no hay mensajes",
    loginRequiredFeedback: "Inicia sesión primero para usar la función de feedback",
    justNow: "Ahora mismo",
    minutesAgo: "hace {count} min",
    hoursAgo: "hace {count} h",
    yesterday: "Ayer",
    daysAgo: "hace {count} días",
    searchNoResults: "No hay conversaciones que coincidan",
    chooseAction: "Elige una acción",
    viewAllCompanions: "Ver todos los personajes",
    allCompanionsDesc: "Explora todos los personajes que has creado"
  };
  const companionProfile$1 = {
    title: "Perfil del trandsai",
    loadingError: "Error al cargar, por favor intenta más tarde",
    notFound: "trandsai no encontrado",
    sendMessage: "Enviar Mensaje",
    clone: "Clonar y Crear",
    chatTurns: "Turnos de Chat",
    moments: "Momentos",
    daysTogether: "Días Juntos",
    about: "Acerca de",
    momentsTab: "Momentos",
    background: "Historia",
    speechStyle: "Estilo de Habla",
    mbti: "MBTI",
    hobbies: "Hobbies",
    values: "Valores Centrales",
    fears: "Vulnerabilidades",
    loveView: "Visión del Amor",
    dailyRoutine: "Rutina Diaria",
    favoriteThings: "Cosas Favoritas",
    meetTime: "Momento del Encuentro",
    noMoments: "Aún no hay momentos~",
    deleteConfirm: "¿Estás seguro de que quieres eliminar este personaje? Todos los datos serán borrados.",
    deleteFailed: "Error al eliminar",
    deleteCompanion: "Eliminar Personaje",
    ageUnit: "años",
    sexualOrientationLabel: "Orientación Sexual",
    creator: "Creador",
    sexualOrientation: {
      heterosexual: "Heterosexual",
      homosexual: "Homosexual",
      bisexual: "Bisexual",
      pansexual: "Pansexual",
      asexual: "Asexual",
      secret: "Secreto"
    }
  };
  const feedback$1 = {
    title: "Feedback",
    subtitle: "Comunicación directa con el administrador",
    loading: "Cargando...",
    noMessages: "Aún no hay mensajes. Escribe tus preguntas o sugerencias~",
    placeholder: "Escribe tus preguntas o sugerencias...",
    sendFailed: "Error al enviar, por favor intenta de nuevo",
    loginExpired: "Sesión expirada, por favor inicia sesión de nuevo",
    loginRequired: "Por favor inicia sesión primero"
  };
  const privacy$1 = {
    title: "Política de Privacidad",
    openInBrowser: "Abre la política de privacidad en tu navegador:"
  };
  const notifications$1 = {
    title: "Notificaciones",
    tabAll: "Todas",
    empty: "Sin notificaciones",
    welcome: "Bienvenido a trandsai. ¡Empieza a interactuar con tu compañero virtual!",
    replyToYou: "Te respondió: {content}"
  };
  const es = {
    language: language$1,
    common: common$1,
    nav: nav$1,
    login: login$1,
    register: register$1,
    home: home$1,
    chat: chat$1,
    discover: discover$1,
    profile: profile$1,
    myCompanions: myCompanions$1,
    intimacy: intimacy$1,
    notification: notification$1,
    notFound: notFound$1,
    createCompanion: createCompanion$1,
    messages: messages$1,
    companionProfile: companionProfile$1,
    feedback: feedback$1,
    privacy: privacy$1,
    notifications: notifications$1
  };
  const language = {
    name: "Bahasa Indonesia",
    select: "Pilih Bahasa"
  };
  const common = {
    save: "Simpan",
    cancel: "Batal",
    "delete": "Hapus",
    edit: "Edit",
    confirm: "Konfirmasi",
    close: "Tutup",
    loading: "Memuat...",
    search: "Cari",
    noData: "Tidak ada data",
    success: "Berhasil",
    failed: "Gagal",
    networkError: "Kesalahan jaringan, silakan coba lagi nanti",
    me: "Saya"
  };
  const nav = {
    home: "Beranda",
    messages: "Pesan",
    chat: "Obrolan",
    discover: "Jelajahi",
    profile: "Profil"
  };
  const login = {
    title: "Masuk",
    username: "Nama pengguna",
    password: "Kata sandi",
    loginBtn: "Masuk",
    registerBtn: "Daftar",
    noAccount: "Belum punya akun?",
    subtitle: "Bertemu kembali dengan kekasih virtualmu",
    errorEmpty: "Silakan masukkan nama pengguna dan kata sandi",
    errorFailed: "Gagal masuk",
    loggingIn: "Sedang masuk..."
  };
  const register = {
    title: "Buat Akun",
    "//username": "Nama pengguna",
    email: "Email",
    nickname: "Nama panggilan",
    password: "Atur kata sandi",
    confirmPassword: "Konfirmasi kata sandi",
    gender: "Jenis kelamin",
    male: "Laki-laki",
    female: "Perempuan",
    secret: "Rahasia",
    registerBtn: "Daftar",
    hasAccount: "Sudah punya akun?",
    goLogin: "Masuk",
    subtitle: "Mulai perjalanan cinta yang imersif",
    "//errorUsername": "Nama pengguna minimal 3 karakter",
    errorEmail: "Masukkan alamat email yang valid",
    errorPassword: "Kata sandi minimal 6 karakter",
    errorConfirm: "Kata sandi tidak cocok",
    errorFailed: "Pendaftaran gagal",
    registering: "Mendaftar...",
    sexualOrientation: "Orientasi seksual",
    heterosexual: "Heteroseksual",
    homosexual: "Homoseksual",
    bisexual: "Biseksual",
    pansexual: "Panseksual",
    asexual: "Aseksual",
    agree: "Dengan mendaftar, Anda menyetujui",
    terms: "Ketentuan Layanan",
    privacy: "Kebijakan Privasi",
    and: " dan "
  };
  const home = {
    title: "trandsai",
    myCompanions: "Karakter Saya",
    createCompanion: "Buat Karakter",
    noCompanions: "Belum ada karakter. Buat satu!",
    justNow: "Baru saja",
    minutesAgo: "{count} menit lalu",
    hoursAgo: "{count} jam lalu",
    daysAgo: "{count} hari lalu",
    defaultCompanionName: "Karakter",
    create: "Buat",
    noMoments: "Belum ada momen. Ayo ngobrol dengan trandsai ~",
    writeComment: "Tulis komentar...",
    noMoreMoments: "— Selesai —",
    backToTop: "Kembali ke atas",
    replyTo: "Balas {name}",
    replyPlaceholder: "Balas {name}...",
    momentFilter: "Filter Moments",
    filterLanguage: "Bahasa karakter",
    filterGender: "Jenis kelamin",
    filterOrientation: "Orientasi",
    filterAll: "Semua",
    resetFilter: "Atur ulang",
    applyFilter: "Terapkan"
  };
  const chat = {
    placeholder: "Ketik pesan...",
    send: "Kirim",
    intimacy: "Kedekatan",
    mood: "Suasana hati",
    online: "Daring",
    connecting: "Menghubungkan...",
    loadingEarlier: "Memuat pesan sebelumnya...",
    loadingHistory: "Memuat riwayat obrolan...",
    noMessages: "Belum ada pesan. Mulai percakapan~",
    defaultName: "Karakter",
    viewProfile: "Lihat Profil",
    clearMessages: "Hapus Riwayat Chat",
    confirmClearMessages: "Apakah Anda yakin ingin menghapus semua riwayat chat? Tindakan ini tidak dapat dibatalkan.",
    clearSuccess: "Berhasil dihapus",
    clearFailed: "Gagal menghapus",
    copySuccess: "Disalin",
    doubleClickToCopy: "Klik dua kali untuk menyalin",
    messageQueued: "Pesan tertunda akan dikirim otomatis setelah terhubung kembali",
    sendQueuedHint: "Saat offline, pesan diantrekan hingga terhubung lagi",
    accessDenied: "Tidak ada akses ke pendamping ini",
    back: "Kembali",
    notificationTitle: "Pesan baru",
    notificationBody: "{preview}",
    connectionAbnormal: "Koneksi bermasalah. Coba lagi sebentar lagi.",
    emojiSmile: "Ekspresi",
    emojiHeart: "Hati",
    emojiGesture: "Gestur",
    emojiMisc: "Lainnya",
    thinkingDismissHint: "Ketuk untuk menutup"
  };
  const discover = {
    title: "Jelajahi",
    moments: "Momen",
    recommended: "Rekomendasi",
    searchPlaceholder: "Cari topik basis pengetahuan...",
    searchBtn: "Cari",
    searchResults: "Hasil Pencarian",
    clear: "Bersihkan",
    searching: "Mencari...",
    noResults: "Tidak ada konten terkait ditemukan",
    knowledgeEntry: "Entri Pengetahuan",
    trendingTopics: "Topik Populer",
    viewMore: "Lihat Lebih Banyak",
    recommendedMoments: "Momen Rekomendasi",
    loading: "Memuat...",
    noMoments: "Belum ada momen",
    upgradeMember: "Tingkatkan Keanggotaan",
    upgradeDesc: "Buka lebih banyak kepribadian AI, suara eksklusif, obrolan tanpa batas",
    learnMore: "Pelajari Lebih Lanjut",
    newPost: "Posting Baru",
    tabPosts: "Posting",
    tabCompanions: "Karakter",
    filterAll: "Semua",
    filterRecommended: "Rekomendasi",
    noCompanions: "Belum ada karakter",
    noPosts: "Belum ada posting. Jadilah yang pertama membagikan!",
    noMorePosts: "Tidak ada lagi postingan",
    noSearchResults: "Tidak ada posting yang cocok",
    createPost: "Buat Posting",
    postTitle: "Judul",
    titlePlaceholder: "Masukkan judul posting...",
    postContent: "Konten",
    contentPlaceholder: "Bagikan pendapatmu...",
    publish: "Publikasikan",
    publishing: "Menerbitkan...",
    createFailed: "Gagal menerbitkan",
    viewDetail: "Lihat Detail",
    postDetail: "Detail Posting",
    postNotFound: "Posting tidak ditemukan",
    comments: "Komentar",
    noComments: "Belum ada komentar. Jadilah yang pertama!",
    commentPlaceholder: "Tulis komentar...",
    commentFailed: "Komentar gagal",
    justNow: "Baru saja",
    minutesAgo: "{count} menit lalu",
    hoursAgo: "{count} jam lalu",
    daysAgo: "{count} hari lalu",
    postCategory: "Kategori",
    catAll: "Semua",
    catDating: "Kencan",
    catPsychology: "Psikologi",
    catTips: "Tips",
    catStory: "Cerita",
    catOfftopic: "Off-topic",
    cat_dating: "Kencan",
    cat_psychology: "Psikologi",
    cat_tips: "Tips",
    cat_story: "Cerita",
    cat_offtopic: "Off-topic",
    postImages: "Gambar",
    addImage: "Tambah gambar"
  };
  const profile = {
    title: "Profil",
    settings: "Pengaturan",
    logout: "Keluar",
    language: "Bahasa",
    notLoggedIn: "Belum masuk",
    pleaseLogin: "Silakan masuk",
    authorId: "ID Penulis",
    myCompanions: "Karakter Saya",
    myCompanionsHint: "Kedekatan > 5 untuk muncul",
    myMoments: "Momen Saya",
    intimacyRecord: "Riwayat Kedekatan",
    notificationSettings: "Pengaturan Notifikasi",
    languagePreference: "Preferensi Bahasa",
    accountSecurity: "Akun dan Keamanan",
    privacyPolicy: "Kebijakan Privasi",
    aboutUs: "Tentang Kami",
    darkMode: "Mode Gelap",
    lightMode: "Mode Terang",
    editProfile: "Edit Profil",
    enterNickname: "Masukkan nama panggilan",
    age: "Usia",
    agePlaceholder: "Opsional, 0–150",
    region: "Wilayah",
    placeholderRegion: "mis. Jakarta, Surabaya",
    occupation: "Pekerjaan",
    placeholderOccupation: "mis. Mahasiswa, desainer",
    updateFailed: "Pembaruan gagal",
    selectLanguage: "Pilih Bahasa",
    chatTurns: "Jumlah Percakapan",
    daysTogether: "Hari Bersama",
    logoutConfirm: "Yakin ingin keluar? Anda perlu masuk lagi.",
    invalidAge: "Masukkan usia valid antara 18 dan 70",
    avatarUploadFailed: "Gagal mengunggah avatar"
  };
  const myCompanions = {
    total: "Total",
    totalAffection: "Total Afeksi",
    intimate: "Jumlah Intim",
    soulmate: "Jiwa kembar",
    close: "Dekat",
    familiar: "Familiar",
    stranger: "Asing",
    selfCreated: "Buatanmu",
    removeFromList: "Hapus dari daftar",
    removeConfirm: "Hapus karakter ini dari Pasangan Saya? (Karakternya sendiri tidak akan dihapus)"
  };
  const intimacy = {
    avgAffection: "Rata-rata Kedekatan",
    highest: "Kedekatan Tertinggi",
    topCompanion: "Kekasih Terdekat"
  };
  const notification = {
    tip: "Kelola jenis notifikasi yang Anda terima",
    moments: "Pembaruan Linimasa",
    momentsDesc: "Beritahu saat kekasih memposting momen baru",
    messages: "Pesan",
    messagesDesc: "Beritahu saat menerima pesan baru",
    system: "Sistem",
    systemDesc: "Terima pengumuman dan pembaruan sistem",
    sound: "Suara",
    soundDesc: "Putar suara pada pesan baru",
    email: "Email",
    emailDesc: "Terima notifikasi penting melalui email"
  };
  const notFound = {
    title: "Halaman Tidak Ditemukan",
    desc: "Maaf, halaman yang Anda cari tidak ada",
    back: "Kembali",
    home: "Beranda"
  };
  const createCompanion = {
    title: "Buat Kekasih Virtual",
    basicInfo: "Informasi Dasar",
    name: "Nama",
    age: "Usia",
    gender: "Jenis kelamin",
    city: "Kota",
    personality: "Kepribadian",
    background: "Latar belakang",
    speechStyle: "Gaya bicara",
    hobbies: "Hobi",
    values: "Nilai-nilai Inti",
    fears: "Ketakutan",
    loveView: "Pandangan cinta",
    dailyRoutine: "Rutinitas harian",
    favoriteThings: "Hal favorit",
    mbti: "MBTI",
    preset: "Preset",
    aiGenerate: "Generasi Cerdas dengan AI",
    manualCreate: "Buat manual",
    generateDesc: "Biarkan AI membuat karakter unik berdasarkan preferensi Anda",
    createBtn: "Buat ✨",
    autoFill: "Isi Otomatis",
    generating: "Membuat...",
    namePlaceholder: "Beri nama",
    ageLabel: "Usia: {age}",
    male: "Laki-laki",
    female: "Perempuan",
    sexualOrientation: "Orientasi Seksual",
    cityPlaceholder: "Dari kota mana dia?",
    mbtiPlaceholder: "Pilih tipe MBTI",
    personalityLabel: "Tag kepribadian (banyak)",
    backgroundPlaceholder: "Deskripsikan latar belakangnya...",
    speechStylePlaceholder: "Cont: Suka menggunakan emoji, berbicara lembut...",
    importChatHistory: "Impor Riwayat Obrolan (Opsional)",
    chatHistoryPlaceholder: `Mendukung dua format:

1. Format teks sederhana (satu per baris):
Pengguna: Halo
AI: Halo~ Senang bertemu denganmu
Pengguna: Cuaca hari ini bagus

2. Format JSON:
[{'{'}"role":"user","content":"Halo"{'}'}, {'{'}"role":"assistant","content":"Halo~"{'}'}]`,
    recognizedMessages: "{count} pesan dikenali",
    personalityDetails: "Detail Kepribadian (Opsional)",
    hobbiesPlaceholder: "Cont: Fotografi, memasak, traveling, yoga...",
    valuesPlaceholder: "Cont: Kejujuran, kebebasan, keluarga utama...",
    fearsPlaceholder: "Cont: Takut ditinggalkan, kurang rasa aman...",
    loveViewPlaceholder: "Cont: Pelan tapi pasti, mandiri namun saling bergantung...",
    dailyRoutinePlaceholder: "Cont: Bangun jam 7 pagi untuk lari, malamnya suka baca buku...",
    favoriteThingsPlaceholder: "Cont: Kucing, matcha latte, matahari terbenam, hari hujan...",
    lifeStory: "Kisah Hidup",
    lifeStoryPlaceholder: "Kisah hidup lengkapnya, termasuk masa kecil, remaja, keluarga asal, titik balik besar...",
    culturalValues: "Nilai-nilai Budaya dan Ideologi",
    culturalValuesPlaceholder: "Nilai-nilai budaya uniknya: ekspresi emosional, pandangan tentang keluarga dan tanggung jawab, filosofi cinta, pandangan uang, persepsi peran gender...",
    genderPerspective: "Perspektif Gender",
    genderPerspectivePlaceholder: "Pandangan uniknya tentang peran gender, hubungan intim, dan cara berinteraksi antara pria dan wanita. Cont: Tradisional, egaliter, feminis mandiri, pria straight yang lembut...",
    preview: "Pratinjau",
    unnamed: "Tanpa Nama",
    unknownCity: "Kota Tidak Dikenal",
    alertFillRequired: "Harap isi nama, kota, dan tag kepribadian terlebih dahulu agar AI dapat membuat karakter",
    alertGenerateFailed: "Gagal membuat: {error}",
    alertNetworkError: "Gagal membuat, periksa jaringan atau coba lagi nanti",
    alertCreateFailed: "Gagal membuat: {error}",
    alertNetworkCreateFailed: "Gagal membuat, periksa koneksi jaringan",
    mbtiTypes: {
      INTJ: "Arsitek",
      INTP: "Ahli Logika",
      ENTJ: "Komandan",
      ENTP: "Pendebat",
      INFJ: "Advokat",
      INFP: "Mediator",
      ENFJ: "Protagonis",
      ENFP: "Juru Kampanye",
      ISTJ: "Ahli Logistik",
      ISFJ: "Pembela",
      ESTJ: "Eksekutif",
      ESFJ: "Konsul",
      ISTP: "Virtuoso",
      ISFP: "Petualang",
      ESTP: "Pengusaha",
      ESFP: "Penghibur"
    },
    errors: {
      nameRequired: "Nama wajib diisi",
      ageRequired: "Usia wajib diisi",
      genderRequired: "Jenis kelamin wajib dipilih",
      cityRequired: "Kota wajib dipilih",
      personalityRequired: "Kepribadian wajib dipilih",
      personalityMin: "Pilih minimal dua tag kepribadian",
      mbtiRequired: "MBTI wajib dipilih",
      orientationRequired: "Orientasi seksual wajib dipilih",
      backgroundRequired: "Latar belakang wajib diisi",
      backgroundMin: "Latar belakang minimal 5 karakter",
      speechRequired: "Gaya bicara wajib diisi",
      speechMin: "Gaya bicara minimal 5 karakter"
    }
  };
  const messages = {
    title: "Pesan",
    searchPlaceholder: "Cari",
    feedback: "Umpan Balik",
    feedbackDesc: "Punya pertanyaan atau saran? Klik untuk meninggalkan pesan",
    noMessages: "Tidak ada pesan",
    createCompanionHint: "Buat karakter untuk mulai mengobrol~",
    typing: "Mengetik...",
    noMessageYet: "Belum ada pesan",
    loginRequiredFeedback: "Harap masuk terlebih dahulu untuk menggunakan fitur umpan balik",
    justNow: "Baru saja",
    minutesAgo: "{count} menit lalu",
    hoursAgo: "{count} jam lalu",
    yesterday: "Kemarin",
    daysAgo: "{count} hari lalu",
    searchNoResults: "Tidak ada percakapan yang cocok",
    chooseAction: "Pilih tindakan",
    viewAllCompanions: "Lihat semua karakter",
    allCompanionsDesc: "Jelajahi semua karakter yang Anda buat"
  };
  const companionProfile = {
    title: "Profil trandsai",
    loadingError: "Gagal memuat, silakan coba lagi nanti",
    notFound: "trandsai tidak ditemukan",
    sendMessage: "Kirim Pesan",
    clone: "Salin & Buat",
    chatTurns: "Jumlah Percakapan",
    moments: "Momen",
    daysTogether: "Hari Bersama",
    about: "Tentang",
    momentsTab: "Momen",
    background: "Latar Belakang",
    speechStyle: "Gaya Bicara",
    mbti: "MBTI",
    hobbies: "Hobi",
    values: "Nilai-nilai Inti",
    fears: "Kerentanan",
    loveView: "Pandangan Cinta",
    dailyRoutine: "Rutinitas Harian",
    favoriteThings: "Hal Favorit",
    meetTime: "Waktu Bertemu",
    noMoments: "Belum ada momen~",
    deleteConfirm: "Yakin ingin menghapus karakter ini? Semua data akan dihapus.",
    deleteFailed: "Gagal menghapus",
    deleteCompanion: "Hapus Karakter",
    ageUnit: "tahun",
    sexualOrientationLabel: "Orientasi Seksual",
    creator: "Pembuat",
    sexualOrientation: {
      heterosexual: "Heteroseksual",
      homosexual: "Homoseksual",
      bisexual: "Biseksual",
      pansexual: "Panseksual",
      asexual: "Aseksual",
      secret: "Rahasia"
    }
  };
  const feedback = {
    title: "Umpan Balik",
    subtitle: "Komunikasi langsung dengan admin",
    loading: "Memuat...",
    noMessages: "Belum ada pesan. Tulis pertanyaan atau saran Anda~",
    placeholder: "Masukkan pertanyaan atau saran Anda...",
    sendFailed: "Gagal mengirim, silakan coba lagi",
    loginExpired: "Login kedaluwarsa, silakan masuk kembali",
    loginRequired: "Harap masuk terlebih dahulu"
  };
  const privacy = {
    title: "Kebijakan Privasi",
    openInBrowser: "Silakan buka kebijakan privasi di browser:"
  };
  const notifications = {
    title: "Notifikasi",
    tabAll: "Semua",
    empty: "Tidak ada notifikasi",
    welcome: "Selamat datang di trandsai. Mulai berinteraksi dengan pasangan virtual Anda!",
    replyToYou: "Membalas Anda: {content}"
  };
  const id = {
    language,
    common,
    nav,
    login,
    register,
    home,
    chat,
    discover,
    profile,
    myCompanions,
    intimacy,
    notification,
    notFound,
    createCompanion,
    messages,
    companionProfile,
    feedback,
    privacy,
    notifications
  };
  const supportedLngs = ["zh", "en", "ja", "ko", "pt", "es", "id"];
  function detectLanguage() {
    const saved = getItem("i18nextLng") || getItem("ui_language");
    if (saved && supportedLngs.includes(saved))
      return saved;
    try {
      const sys = uni.getSystemInfoSync();
      const lang = (sys.language || "zh").slice(0, 2);
      if (supportedLngs.includes(lang))
        return lang;
    } catch {
    }
    return "zh";
  }
  const i18n = createI18n({
    legacy: false,
    locale: detectLanguage(),
    fallbackLocale: "en",
    messages: {
      zh,
      en,
      ja,
      ko,
      pt,
      es,
      id
    }
  });
  function setAppLanguage(lng) {
    const key = supportedLngs.includes(lng) ? lng : "en";
    i18n.global.locale.value = key;
    setItem("i18nextLng", key);
    setItem("ui_language", key);
  }
  var define_import_meta_env_default$3 = { VITE_CJS_IGNORE_WARNING: "true", VITE_USER_NODE_ENV: "development", VITE_ROOT_DIR: "/Users/zeas/Desktop/client-uniii", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const ANALYTICS_API = "/api/analytics";
  const API_BASE$1 = (define_import_meta_env_default$3.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
  const BATCH_SIZE = 10;
  const FLUSH_INTERVAL_MS = 5e3;
  const ANALYTICS_TIMEOUT_MS = 4e3;
  const MAX_FLUSH_EVENTS = 50;
  const ANALYTICS_LANG_CODES = ["zh", "en", "ja", "ko", "pt", "es", "id"];
  const queue = [];
  let flushTimer = null;
  let flushing = false;
  let lifecycleBound = false;
  let batchUnsupported = false;
  function markBatchUnsupported() {
    batchUnsupported = true;
  }
  function getCurrentLanguage() {
    const raw = (i18n.global.locale.value || "zh").split("-")[0].toLowerCase();
    return ANALYTICS_LANG_CODES.includes(raw) ? raw : "en";
  }
  function analyticsUrl(path) {
    if (path.startsWith("http"))
      return path;
    if (API_BASE$1)
      return `${API_BASE$1}${path}`;
    return path;
  }
  function getCurrentPagePath() {
    const pages = getCurrentPages();
    const cur = pages[pages.length - 1];
    return (cur == null ? void 0 : cur.route) ? `/${cur.route}` : "";
  }
  function scheduleFlush() {
    if (flushTimer)
      return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushAnalyticsQueue();
    }, FLUSH_INTERVAL_MS);
  }
  function enqueueEvent(event) {
    ensureAnalyticsLifecycle();
    queue.push(event);
    if (queue.length >= BATCH_SIZE) {
      void flushAnalyticsQueue();
    } else {
      scheduleFlush();
    }
  }
  function requestJson(url, data) {
    return new Promise((resolve) => {
      try {
        uni.request({
          url,
          method: "POST",
          header: { "Content-Type": "application/json" },
          data,
          timeout: ANALYTICS_TIMEOUT_MS,
          success(res) {
            const status = res.statusCode || 0;
            resolve({ ok: status >= 200 && status < 300, status });
          },
          fail: () => resolve({ ok: false, status: 0 })
        });
      } catch {
        resolve({ ok: false, status: 0 });
      }
    });
  }
  async function flushLegacyOneByOne(events) {
    for (const ev of events) {
      if (ev.type === "page_view") {
        await requestJson(analyticsUrl(`${ANALYTICS_API}/page-view`), {
          page_path: ev.page_path,
          page_name: ev.page_name,
          device_id: ev.device_id,
          language: ev.language
        });
      } else if (ev.type === "button_click") {
        await requestJson(analyticsUrl(`${ANALYTICS_API}/button-click`), {
          button_id: ev.button_id,
          button_name: ev.button_name,
          page_path: ev.page_path,
          device_id: ev.device_id,
          language: ev.language
        });
      }
    }
  }
  async function flushAnalyticsQueue() {
    if (flushing)
      return;
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!queue.length)
      return;
    flushing = true;
    try {
      while (queue.length) {
        const chunk = queue.splice(0, MAX_FLUSH_EVENTS);
        if (!batchUnsupported) {
          const res = await requestJson(analyticsUrl(`${ANALYTICS_API}/batch`), {
            events: chunk
          });
          if (res.ok)
            continue;
          if (res.status === 404 || res.status === 405) {
            markBatchUnsupported();
          } else if (res.status === 0) {
            continue;
          } else {
            await flushLegacyOneByOne(chunk);
            continue;
          }
        }
        await flushLegacyOneByOne(chunk);
      }
    } finally {
      flushing = false;
      if (queue.length)
        scheduleFlush();
    }
  }
  function ensureAnalyticsLifecycle() {
    if (lifecycleBound)
      return;
    lifecycleBound = true;
    try {
      uni.onAppHide(() => {
        void flushAnalyticsQueue();
      });
    } catch {
    }
  }
  function trackPageView(pagePath, pageName) {
    enqueueEvent({
      type: "page_view",
      page_path: pagePath,
      page_name: pageName,
      device_id: getDeviceId(),
      language: getCurrentLanguage()
    });
  }
  function trackButtonClick(buttonId, buttonName, pagePath) {
    enqueueEvent({
      type: "button_click",
      button_id: buttonId,
      button_name: buttonName,
      page_path: pagePath || getCurrentPagePath(),
      device_id: getDeviceId(),
      language: getCurrentLanguage()
    });
  }
  const PAGE_NAME_MAP = {
    "/pages/login/index": "登录页",
    "/pages/register/index": "注册页",
    "/pages/home/index": "首页",
    "/pages/messages/index": "消息列表页",
    "/pages/discover/index": "发现页",
    "/pages/profile/index": "个人中心",
    "/pages/chat/index": "聊天页",
    "/pages-sub/companion/index": "伴侣详情页",
    "/pages-sub/create/index": "创建伴侣页",
    "/pages-sub/feedback/index": "反馈页",
    "/pages-sub/my-companions/index": "我的伴侣页",
    "/pages-sub/intimacy/index": "亲密度记录页",
    "/pages-sub/my-posts/index": "我的帖子页",
    "/pages-sub/settings/index": "通知设置页",
    "/pages-sub/notifications/index": "通知页",
    "/pages-sub/privacy/index": "隐私政策",
    "/pages-sub/moment/index": "朋友圈详情",
    "/pages-sub/post/index": "帖子详情",
    "/pages-sub/not-found/index": "404",
    // React 时代路径兼容
    "/": "登录页",
    "/register": "注册页",
    "/home": "首页",
    "/messages": "消息列表页",
    "/discover": "发现页",
    "/profile": "个人中心",
    "/chat": "聊天页",
    "/companion": "伴侣详情页",
    "/create": "创建伴侣页",
    "/feedback": "反馈页",
    "/my-companions": "我的伴侣页",
    "/intimacy-record": "亲密度记录页",
    "/my-posts": "我的帖子页",
    "/notification-settings": "通知设置页"
  };
  function getPageName(path) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (PAGE_NAME_MAP[normalized])
      return PAGE_NAME_MAP[normalized];
    for (const [key, name] of Object.entries(PAGE_NAME_MAP)) {
      if (normalized.startsWith(`${key}/`) || normalized.startsWith(`${key}?`)) {
        return name;
      }
    }
    if (normalized.includes("/chat/") || normalized.includes("pages/chat"))
      return "聊天页";
    if (normalized.includes("/companion/") || normalized.includes("companion/index"))
      return "伴侣详情页";
    return normalized;
  }
  let lastTrackedRoute = "";
  function trackCurrentPageIfChanged() {
    const path = getCurrentPagePath();
    if (!path || path === lastTrackedRoute)
      return;
    lastTrackedRoute = path;
    trackPageView(path, getPageName(path));
  }
  function bindAnalyticsTap(buttonId, handler, buttonName) {
    trackButtonClick(buttonId, buttonName || buttonId);
    handler == null ? void 0 : handler();
  }
  function bindAnalyticsTapArg(buttonId, handler, buttonName) {
    return (arg) => {
      const id2 = typeof buttonId === "function" ? buttonId(arg) : buttonId;
      const name = typeof buttonName === "function" ? buttonName(arg) : buttonName || id2;
      trackButtonClick(id2, name);
      handler(arg);
    };
  }
  function setupGlobalButtonTracking() {
    ensureAnalyticsLifecycle();
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$f = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const { t } = useI18n();
      redirectIfLoggedIn();
      const email = vue.ref("");
      const password = vue.ref("");
      const showPassword = vue.ref(false);
      const error = vue.ref("");
      const loading = vue.ref(false);
      async function handleLogin() {
        error.value = "";
        if (!email.value.trim() || !password.value) {
          error.value = t("login.errorEmpty");
          return;
        }
        loading.value = true;
        try {
          const res = await rawFetch("/api/auth/login", {
            method: "POST",
            header: { "Content-Type": "application/json" },
            data: { username: email.value.trim(), password: password.value }
          });
          if (!res.ok) {
            error.value = res.data.detail || t("login.errorFailed");
            return;
          }
          setItem("user_token", res.data.token);
          setItem("user_info", JSON.stringify(res.data.user));
          uni.reLaunch({ url: "/pages/home/index" });
        } catch {
          error.value = t("common.networkError");
        } finally {
          loading.value = false;
        }
      }
      function goRegister() {
        uni.navigateTo({ url: "/pages/register/index" });
      }
      const __returned__ = { t, email, password, showPassword, error, loading, handleLogin, goRegister, ref: vue.ref, get useI18n() {
        return useI18n;
      }, get rawFetch() {
        return rawFetch;
      }, get setItem() {
        return setItem;
      }, get redirectIfLoggedIn() {
        return redirectIfLoggedIn;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "login-page" }, [
      vue.createElementVNode("view", { class: "login-inner" }, [
        vue.createElementVNode("view", { class: "logo-wrap" }, [
          vue.createElementVNode("view", { class: "logo-circle" }, "♥"),
          vue.createElementVNode(
            "text",
            { class: "login-title" },
            vue.toDisplayString($setup.t("home.title")),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "text-muted" },
            vue.toDisplayString($setup.t("login.subtitle")),
            1
            /* TEXT */
          )
        ]),
        $setup.error ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 0,
            class: "error-text"
          },
          vue.toDisplayString($setup.error),
          1
          /* TEXT */
        )) : vue.createCommentVNode("v-if", true),
        vue.withDirectives(vue.createElementVNode("input", {
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.email = $event),
          class: "input-field mt-md",
          placeholder: $setup.t("login.username")
        }, null, 8, ["placeholder"]), [
          [vue.vModelText, $setup.email]
        ]),
        vue.createElementVNode("view", { class: "password-wrap mt-md" }, [
          vue.withDirectives(vue.createElementVNode("input", {
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.password = $event),
            class: "input-field",
            password: !$setup.showPassword,
            placeholder: $setup.t("login.password")
          }, null, 8, ["password", "placeholder"]), [
            [vue.vModelText, $setup.password]
          ]),
          vue.createElementVNode(
            "text",
            {
              class: "eye-btn",
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.showPassword = !$setup.showPassword)
            },
            vue.toDisplayString($setup.showPassword ? "👁" : "👁‍🗨"),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("button", {
          class: "btn-primary w-full mt-md",
          disabled: $setup.loading,
          onClick: _cache[3] || (_cache[3] = ($event) => $setup.bindAnalyticsTap("login-submit", $setup.handleLogin, "登录"))
        }, vue.toDisplayString($setup.loading ? $setup.t("login.loggingIn") : $setup.t("login.loginBtn")), 9, ["disabled"]),
        vue.createElementVNode("view", {
          class: "register-link mt-md",
          onClick: _cache[4] || (_cache[4] = ($event) => $setup.bindAnalyticsTap("login-to-register", $setup.goRegister, "去注册"))
        }, [
          vue.createElementVNode(
            "text",
            { class: "text-muted" },
            vue.toDisplayString($setup.t("login.noAccount")),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "text-primary" },
            vue.toDisplayString($setup.t("login.registerBtn")),
            1
            /* TEXT */
          )
        ])
      ])
    ]);
  }
  const PagesLoginIndex = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$f], ["__scopeId", "data-v-d08ef7d4"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/login/index.vue"]]);
  vue.ref(null);
  function readSafeArea() {
    try {
      const sys = uni.getSystemInfoSync();
      const statusBarHeight = sys.statusBarHeight || 0;
      const safe = sys.safeAreaInsets || { top: 0, bottom: 0, left: 0, right: 0 };
      const safeAreaTop = Math.max(statusBarHeight, safe.top || 0);
      const safeAreaBottom = safe.bottom || 0;
      const windowHeight = sys.windowHeight || 0;
      let navBarHeight = 44;
      return {
        statusBarHeight,
        safeAreaTop,
        safeAreaBottom,
        windowHeight,
        navBarHeight
      };
    } catch {
      return {
        statusBarHeight: 0,
        safeAreaTop: 0,
        safeAreaBottom: 0,
        windowHeight: 0,
        navBarHeight: 44
      };
    }
  }
  function resolveMessageLocale(lang) {
    var _a2;
    const base = ((_a2 = (lang || "zh").split("-")[0]) == null ? void 0 : _a2.toLowerCase()) || "zh";
    const map = {
      zh: "zh-CN",
      en: "en-US",
      ja: "ja-JP",
      ko: "ko-KR",
      pt: "pt-BR",
      es: "es-ES",
      id: "id-ID"
    };
    return map[base] || lang || "zh-CN";
  }
  function formatMessageTime(isoOrDate, lang) {
    const d = typeof isoOrDate === "object" ? isoOrDate : new Date(isoOrDate);
    if (Number.isNaN(d.getTime()))
      return "";
    return d.toLocaleTimeString(resolveMessageLocale(lang), {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function formatNowMessageTime(lang) {
    return formatMessageTime(/* @__PURE__ */ new Date(), lang);
  }
  function _startOfLocalDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  function formatChatDateSeparator(iso, lang) {
    var _a2;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
      return "";
    const now2 = /* @__PURE__ */ new Date();
    const sd = _startOfLocalDay(d);
    const sn = _startOfLocalDay(now2);
    const diffDays = Math.round((sn - sd) / 864e5);
    const base = ((_a2 = (lang || "zh").split("-")[0]) == null ? void 0 : _a2.toLowerCase()) || "zh";
    const today = {
      zh: "今天",
      en: "Today",
      ja: "今日",
      ko: "오늘",
      pt: "Hoje",
      es: "Hoy",
      id: "Hari ini"
    };
    const yesterday = {
      zh: "昨天",
      en: "Yesterday",
      ja: "昨日",
      ko: "어제",
      pt: "Ontem",
      es: "Ayer",
      id: "Kemarin"
    };
    if (diffDays === 0)
      return today[base] || today.en;
    if (diffDays === 1)
      return yesterday[base] || yesterday.en;
    const loc = resolveMessageLocale(lang);
    if (base === "zh") {
      return d.toLocaleDateString(loc, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    return d.toLocaleDateString(loc, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }
  function calendarDayKeyFromIso(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
      return "";
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  function isWsConnectWelcomeNotice(text) {
    const s = (text || "").trim();
    if (!s)
      return false;
    if (s.includes("已连接到") && s.includes("开始聊天吧"))
      return true;
    if (s.startsWith("Connected to") && s.includes("Let's chat"))
      return true;
    if (s.includes("に接続しました") && s.includes("お話ししましょう"))
      return true;
    if (s.includes("에 연결") && s.includes("이야기하자"))
      return true;
    if (s.startsWith("Conectado a") && s.includes("Vamos conversar"))
      return true;
    if (s.startsWith("Conectado a") && s.includes("¡Hablemos"))
      return true;
    if (s.startsWith("Terhubung dengan") && s.includes("Mari ngobrol"))
      return true;
    return false;
  }
  const SUPPORTED = /* @__PURE__ */ new Set(["zh", "en", "ja", "ko", "pt", "es", "id"]);
  function normalizeUiLang(lang) {
    var _a2;
    if (!lang || typeof lang !== "string")
      return "zh";
    const cleaned = lang.trim().replace(/_/g, "-");
    const lower = cleaned.toLowerCase();
    if (lower.startsWith("zh"))
      return "zh";
    const base = ((_a2 = cleaned.split("-")[0]) == null ? void 0 : _a2.toLowerCase()) ?? "";
    if (base && SUPPORTED.has(base))
      return base;
    return "en";
  }
  var define_import_meta_env_default$2 = { VITE_CJS_IGNORE_WARNING: "true", VITE_USER_NODE_ENV: "development", VITE_ROOT_DIR: "/Users/zeas/Desktop/client-uniii", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const MAX_MESSAGES = 5e3;
  const MESSAGE_TRIM_TARGET = 3e3;
  const MAX_WS_CONNECTIONS = 4;
  const RECONNECT_STAGGER_MS = 180;
  function getWsOrigin() {
    const explicit = (define_import_meta_env_default$2.VITE_WS_URL || "").trim();
    if (explicit)
      return explicit.replace(/\/$/, "");
    const apiBase = (define_import_meta_env_default$2.VITE_API_BASE_URL || "").replace(/\/$/, "");
    if (apiBase.startsWith("https://"))
      return apiBase.replace(/^https:/, "wss:");
    if (apiBase.startsWith("http://"))
      return apiBase.replace(/^http:/, "ws:");
    return "wss://www.trandsai.com";
  }
  function buildChatWsPayload(text, lang, userGender) {
    let tz = "";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
    }
    let tz_offset;
    try {
      tz_offset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
    } catch {
    }
    return { text, lang, user_gender: userGender, tz, tz_offset };
  }
  function messageContentKey(m) {
    return `${m.sender}\0${(m.text || "").trim()}`;
  }
  const useChatStore = defineStore("chat", () => {
    const messages2 = vue.ref([]);
    const unreadCounts = vue.ref({});
    const lastMessages = vue.ref({});
    const isConnected = vue.ref({});
    const typingCompanions = vue.ref({});
    const activeCompanionId = vue.ref(null);
    const ephemeral = vue.ref({});
    let msgIdCounter = 1e6;
    const connections = {};
    const reconnectTimers = {};
    const reconnectAttempts = {};
    const intentionallyClosed = {};
    const trackedCompanionIds = /* @__PURE__ */ new Set();
    const lastActiveAt = {};
    let staggerTimers = [];
    let visibilityReconnectTimer = null;
    let languageReconnectTimer = null;
    const outbox = {};
    const queueNoticeSent = {};
    let persistTimer = null;
    const pendingPersist = {};
    function nextMsgId() {
      return msgIdCounter++;
    }
    function touchActive(companionId) {
      if (!companionId)
        return;
      lastActiveAt[companionId] = Date.now();
    }
    function reconnectDelayMs(attempts) {
      const base = Math.min(1e3 * Math.pow(2, attempts), 3e4);
      const jitter = 0.7 + Math.random() * 0.6;
      return Math.floor(base * jitter);
    }
    function clearStaggerTimers() {
      for (const t of staggerTimers)
        clearTimeout(t);
      staggerTimers = [];
    }
    function evictLruIfNeeded(protectId) {
      const openIds = Object.keys(connections);
      if (openIds.length < MAX_WS_CONNECTIONS)
        return;
      const protectedIds = /* @__PURE__ */ new Set();
      if (protectId)
        protectedIds.add(protectId);
      if (activeCompanionId.value)
        protectedIds.add(activeCompanionId.value);
      const victims = openIds.filter((id2) => !protectedIds.has(id2)).sort((a, b) => (lastActiveAt[a] || 0) - (lastActiveAt[b] || 0));
      const need = openIds.length - MAX_WS_CONNECTIONS + 1;
      for (let i = 0; i < need && i < victims.length; i++) {
        const id2 = victims[i];
        trackedCompanionIds.delete(id2);
        disconnect(id2);
      }
    }
    function reconnectTrackedStaggered(ids, baseDelay = 400, opts = {}) {
      clearStaggerTimers();
      const force = opts.force === true;
      const list = Array.from(ids);
      list.forEach((cid, idx) => {
        const jitter = Math.floor(Math.random() * 120);
        const t = setTimeout(() => {
          connect(cid, { force });
        }, baseDelay + idx * RECONNECT_STAGGER_MS + jitter);
        staggerTimers.push(t);
      });
    }
    function getLang() {
      return normalizeUiLang(i18n.global.locale.value);
    }
    function getUserGender() {
      try {
        const userInfoStr = getItem("user_info");
        return userInfoStr ? JSON.parse(userInfoStr).gender || "" : "";
      } catch {
        return "";
      }
    }
    function localeForTime() {
      return i18n.global.locale.value || "zh";
    }
    function appendMessages(newMsgs) {
      if (!(newMsgs == null ? void 0 : newMsgs.length))
        return;
      const base = messages2.value ?? [];
      const next = [...base, ...newMsgs];
      messages2.value = next.length > MAX_MESSAGES ? next.slice(-MESSAGE_TRIM_TARGET) : next;
    }
    function dismissMessage(id2) {
      messages2.value = (messages2.value ?? []).filter((m) => m.id !== id2);
      const next = { ...ephemeral.value };
      for (const cid of Object.keys(next)) {
        next[cid] = next[cid].filter((m) => m.id !== id2);
        if (next[cid].length === 0)
          delete next[cid];
      }
      ephemeral.value = next;
    }
    function appendEphemeral(msg) {
      ephemeral.value = {
        ...ephemeral.value,
        [msg.companionId]: [...ephemeral.value[msg.companionId] || [], msg]
      };
    }
    function flushOutboxForCompanion(companionId) {
      const task = connections[companionId];
      if (!task || !isConnected.value[companionId])
        return;
      const pending = outbox[companionId];
      if (!(pending == null ? void 0 : pending.length))
        return;
      const lang = getLang();
      const userGender = getUserGender();
      for (const queued of pending) {
        try {
          task.send({
            data: JSON.stringify(buildChatWsPayload(queued, lang, userGender))
          });
        } catch (err) {
          formatAppLog("error", "at stores/chat.js:230", "发送队列消息失败:", err);
          break;
        }
      }
      delete outbox[companionId];
    }
    function flushPersist() {
      if (pendingPersist.unread !== void 0) {
        setItem("chat_unread", JSON.stringify(pendingPersist.unread));
      }
      if (pendingPersist.last !== void 0) {
        setItem("chat_last_messages", JSON.stringify(pendingPersist.last));
      }
      pendingPersist.unread = void 0;
      pendingPersist.last = void 0;
      persistTimer = null;
    }
    function schedulePersist(patch) {
      if (patch.unread !== void 0)
        pendingPersist.unread = patch.unread;
      if (patch.last !== void 0)
        pendingPersist.last = patch.last;
      if (persistTimer)
        clearTimeout(persistTimer);
      persistTimer = setTimeout(flushPersist, 300);
    }
    function initFromStorage() {
      const saved = getItem("chat_unread");
      if (saved) {
        try {
          unreadCounts.value = JSON.parse(saved);
        } catch {
        }
      }
      const savedLast = getItem("chat_last_messages");
      if (savedLast) {
        try {
          lastMessages.value = JSON.parse(savedLast);
        } catch {
        }
      }
    }
    function mergeHistoryMessages(companionId, incoming, mode) {
      const base = messages2.value ?? [];
      const forCompanion = base.filter((m) => m.companionId === companionId);
      const others = base.filter((m) => m.companionId !== companionId);
      if (mode === "initial") {
        const restKeys = new Set(incoming.map(messageContentKey));
        const liveOnly = forCompanion.filter(
          (m) => !restKeys.has(messageContentKey(m))
        );
        const seen = /* @__PURE__ */ new Set();
        const merged = [];
        for (const m of [...incoming, ...liveOnly]) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            merged.push(m);
          }
        }
        messages2.value = [...others, ...merged];
        return;
      }
      const existingKeys = new Set(forCompanion.map(messageContentKey));
      const older = incoming.filter(
        (m) => !existingKeys.has(messageContentKey(m))
      );
      messages2.value = [...others, ...older, ...forCompanion];
    }
    function connect(companionId, opts = {}) {
      if (!companionId)
        return;
      trackedCompanionIds.add(companionId);
      touchActive(companionId);
      const force = opts.force === true;
      const existing = connections[companionId];
      if (existing && !force)
        return;
      if (existing) {
        intentionallyClosed[companionId] = true;
        try {
          existing.close({});
        } catch {
        }
        delete connections[companionId];
      }
      if (reconnectTimers[companionId]) {
        clearTimeout(reconnectTimers[companionId]);
        delete reconnectTimers[companionId];
      }
      evictLruIfNeeded(companionId);
      intentionallyClosed[companionId] = false;
      const lang = getLang();
      const token = getItem("user_token") || "";
      const origin = getWsOrigin();
      const wsUrl = `${origin}/ws/chat/${companionId}?lang=${encodeURIComponent(lang)}&token=${encodeURIComponent(token)}`;
      const task = uni.connectSocket({
        url: wsUrl,
        complete: () => {
        }
      });
      connections[companionId] = task;
      task.onOpen(() => {
        isConnected.value = { ...isConnected.value, [companionId]: true };
        reconnectAttempts[companionId] = 0;
        queueNoticeSent[companionId] = false;
        touchActive(companionId);
        flushOutboxForCompanion(companionId);
      });
      task.onMessage((event) => {
        try {
          const data = JSON.parse(event.data);
          const locale = localeForTime();
          touchActive(companionId);
          if (data.type === "toast") {
            const text = data.text || "";
            const t = text.trimStart();
            if (t.startsWith("💭")) {
              const thinkId = nextMsgId();
              appendEphemeral({
                id: thinkId,
                companionId,
                sender: "thinking",
                text,
                time: formatNowMessageTime(locale),
                ts: (/* @__PURE__ */ new Date()).toISOString()
              });
              setTimeout(() => dismissMessage(thinkId), 5e3);
            }
          } else if (data.type === "filler" && typeof data.text === "string" && data.text.trim()) {
            const fillId = nextMsgId();
            appendEphemeral({
              id: fillId,
              companionId,
              sender: "filler",
              text: data.text.trim(),
              time: formatNowMessageTime(locale),
              ts: (/* @__PURE__ */ new Date()).toISOString()
            });
            setTimeout(() => dismissMessage(fillId), 4500);
          } else if (data.type === "system" && data.text) {
            const sysText = String(data.text);
            if (!isWsConnectWelcomeNotice(sysText)) {
              appendMessages([
                {
                  id: nextMsgId(),
                  companionId,
                  sender: "system",
                  text: sysText,
                  time: formatNowMessageTime(locale),
                  ts: (/* @__PURE__ */ new Date()).toISOString()
                }
              ]);
            }
          } else if (data.type === "typing") {
            typingCompanions.value = {
              ...typingCompanions.value,
              [companionId]: true
            };
          } else if (data.type === "message" && data.role === "assistant") {
            const text = data.text || "";
            const time = formatNowMessageTime(locale);
            typingCompanions.value = {
              ...typingCompanions.value,
              [companionId]: false
            };
            lastMessages.value = {
              ...lastMessages.value,
              [companionId]: {
                text,
                time,
                fullTime: (/* @__PURE__ */ new Date()).toISOString()
              }
            };
            appendMessages([
              {
                id: nextMsgId(),
                companionId,
                sender: "ai",
                text,
                time,
                ts: (/* @__PURE__ */ new Date()).toISOString()
              }
            ]);
            if (activeCompanionId.value !== companionId) {
              unreadCounts.value = {
                ...unreadCounts.value,
                [companionId]: (unreadCounts.value[companionId] || 0) + 1
              };
            }
          } else if (data.type === "error") {
            typingCompanions.value = {
              ...typingCompanions.value,
              [companionId]: false
            };
            const detail = typeof data.text === "string" && data.text.trim() ? data.text.trim() : i18n.global.t("chat.connectionAbnormal");
            appendMessages([
              {
                id: nextMsgId(),
                companionId,
                sender: "ai",
                text: detail,
                time: formatNowMessageTime(locale),
                ts: (/* @__PURE__ */ new Date()).toISOString()
              }
            ]);
          }
        } catch (e) {
          formatAppLog("error", "at stores/chat.js:499", "解析消息失败:", e);
        }
      });
      task.onError(() => {
        isConnected.value = { ...isConnected.value, [companionId]: false };
      });
      task.onClose(() => {
        isConnected.value = { ...isConnected.value, [companionId]: false };
        typingCompanions.value = {
          ...typingCompanions.value,
          [companionId]: false
        };
        if (connections[companionId] === task) {
          delete connections[companionId];
        }
        if (!intentionallyClosed[companionId]) {
          const attempts = reconnectAttempts[companionId] || 0;
          if (attempts < 12) {
            reconnectAttempts[companionId] = attempts + 1;
            const delay = reconnectDelayMs(attempts);
            reconnectTimers[companionId] = setTimeout(
              () => connect(companionId),
              delay
            );
          }
        }
      });
    }
    function disconnect(companionId) {
      intentionallyClosed[companionId] = true;
      if (reconnectTimers[companionId]) {
        clearTimeout(reconnectTimers[companionId]);
        delete reconnectTimers[companionId];
      }
      const task = connections[companionId];
      if (task) {
        try {
          task.close({});
        } catch {
        }
        delete connections[companionId];
      }
      isConnected.value = { ...isConnected.value, [companionId]: false };
    }
    function disconnectAll() {
      var _a2;
      clearStaggerTimers();
      for (const cid of Object.keys(connections)) {
        intentionallyClosed[cid] = true;
        if (reconnectTimers[cid]) {
          clearTimeout(reconnectTimers[cid]);
          delete reconnectTimers[cid];
        }
        try {
          (_a2 = connections[cid]) == null ? void 0 : _a2.close({});
        } catch {
        }
        delete connections[cid];
      }
      trackedCompanionIds.clear();
      for (const k of Object.keys(lastActiveAt))
        delete lastActiveAt[k];
      isConnected.value = {};
      typingCompanions.value = {};
    }
    function sendMessage(companionId, text) {
      touchActive(companionId);
      const locale = localeForTime();
      appendMessages([
        {
          id: nextMsgId(),
          companionId,
          sender: "user",
          text,
          time: formatNowMessageTime(locale),
          ts: (/* @__PURE__ */ new Date()).toISOString()
        }
      ]);
      lastMessages.value = {
        ...lastMessages.value,
        [companionId]: {
          text,
          time: formatNowMessageTime(locale),
          fullTime: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const task = connections[companionId];
      const lang = getLang();
      const userGender = getUserGender();
      if (task && isConnected.value[companionId]) {
        flushOutboxForCompanion(companionId);
        try {
          task.send({
            data: JSON.stringify(buildChatWsPayload(text, lang, userGender))
          });
          typingCompanions.value = {
            ...typingCompanions.value,
            [companionId]: true
          };
        } catch (err) {
          formatAppLog("error", "at stores/chat.js:607", "发送消息失败:", err);
          const pending = outbox[companionId] || [];
          pending.push(text);
          outbox[companionId] = pending;
          appendMessages([
            {
              id: nextMsgId(),
              companionId,
              sender: "system",
              text: i18n.global.t("chat.messageQueued"),
              time: formatNowMessageTime(locale),
              ts: (/* @__PURE__ */ new Date()).toISOString()
            }
          ]);
        }
      } else {
        const pending = outbox[companionId] || [];
        pending.push(text);
        outbox[companionId] = pending;
        reconnectAttempts[companionId] = 0;
        connect(companionId);
        if (!queueNoticeSent[companionId]) {
          queueNoticeSent[companionId] = true;
          appendMessages([
            {
              id: nextMsgId(),
              companionId,
              sender: "system",
              text: i18n.global.t("chat.messageQueued"),
              time: formatNowMessageTime(locale),
              ts: (/* @__PURE__ */ new Date()).toISOString()
            }
          ]);
        }
      }
    }
    function clearUnread(companionId) {
      const next = { ...unreadCounts.value };
      delete next[companionId];
      unreadCounts.value = next;
    }
    function clearMessages(companionId) {
      messages2.value = (messages2.value ?? []).filter(
        (m) => m.companionId !== companionId
      );
      const nextLast = { ...lastMessages.value };
      delete nextLast[companionId];
      lastMessages.value = nextLast;
      const nextUnread = { ...unreadCounts.value };
      delete nextUnread[companionId];
      unreadCounts.value = nextUnread;
      delete outbox[companionId];
      queueNoticeSent[companionId] = false;
      const nextEphemeral = { ...ephemeral.value };
      delete nextEphemeral[companionId];
      ephemeral.value = nextEphemeral;
    }
    function getCompanionMessages(companionId) {
      return (messages2.value ?? []).filter((m) => m.companionId === companionId);
    }
    function getDisplayMessages(companionId) {
      const base = getCompanionMessages(companionId);
      const extra = ephemeral.value[companionId] || [];
      return extra.length ? [...base, ...extra] : base;
    }
    function setActiveCompanionId(id2) {
      activeCompanionId.value = id2;
      if (id2)
        touchActive(id2);
    }
    function onAppShow() {
      if (visibilityReconnectTimer)
        clearTimeout(visibilityReconnectTimer);
      visibilityReconnectTimer = setTimeout(() => {
        visibilityReconnectTimer = null;
        for (const k of Object.keys(reconnectAttempts))
          delete reconnectAttempts[k];
        const preferred = [];
        if (activeCompanionId.value)
          preferred.push(activeCompanionId.value);
        const rest = Array.from(trackedCompanionIds).filter((id2) => id2 !== activeCompanionId.value).sort((a, b) => (lastActiveAt[b] || 0) - (lastActiveAt[a] || 0));
        const ordered = [...preferred, ...rest];
        const keep = ordered.slice(0, MAX_WS_CONNECTIONS);
        for (const id2 of ordered.slice(MAX_WS_CONNECTIONS)) {
          trackedCompanionIds.delete(id2);
        }
        reconnectTrackedStaggered(
          keep,
          280 + Math.floor(Math.random() * 200)
        );
      }, 400);
    }
    function onLanguageChanged() {
      if (languageReconnectTimer)
        clearTimeout(languageReconnectTimer);
      languageReconnectTimer = setTimeout(() => {
        languageReconnectTimer = null;
        for (const k of Object.keys(reconnectAttempts))
          delete reconnectAttempts[k];
        const ordered = Array.from(trackedCompanionIds).sort(
          (a, b) => (lastActiveAt[b] || 0) - (lastActiveAt[a] || 0)
        );
        const keep = ordered.slice(0, MAX_WS_CONNECTIONS);
        for (const id2 of ordered.slice(MAX_WS_CONNECTIONS)) {
          trackedCompanionIds.delete(id2);
        }
        reconnectTrackedStaggered(
          keep,
          200 + Math.floor(Math.random() * 160),
          { force: true }
        );
      }, 320);
    }
    function setupLifecycle() {
      initFromStorage();
      uni.onAppShow(onAppShow);
    }
    function watchPersistEffects() {
      vue.watch(
        unreadCounts,
        (v) => {
          schedulePersist({ unread: v });
        },
        { deep: true }
      );
      vue.watch(
        lastMessages,
        (v) => {
          schedulePersist({ last: v });
        },
        { deep: true }
      );
    }
    const totalUnread = vue.computed(
      () => Object.values(unreadCounts.value).reduce((a, b) => a + (b || 0), 0)
    );
    return {
      messages: messages2,
      unreadCounts,
      lastMessages,
      isConnected,
      typingCompanions,
      activeCompanionId,
      totalUnread,
      dismissMessage,
      mergeHistoryMessages,
      getCompanionMessages,
      getDisplayMessages,
      clearMessages,
      connect,
      disconnect,
      disconnectAll,
      sendMessage,
      setActiveCompanionId,
      clearUnread,
      setupLifecycle,
      watchPersistEffects,
      onLanguageChanged,
      onAppShow
    };
  });
  const useTabScrollStore = defineStore("tabScroll", () => {
    const scrollTops = vue.ref({});
    const scrollToTopTick = vue.ref({});
    function setScroll(path, top) {
      scrollTops.value[path] = top;
    }
    function resetScroll(path) {
      scrollTops.value[path] = 0;
    }
    function requestScrollToTop(path) {
      scrollToTopTick.value[path] = (scrollToTopTick.value[path] || 0) + 1;
    }
    function isScrolled(path, threshold = 200) {
      return (scrollTops.value[path] || 0) > threshold;
    }
    return {
      scrollTops,
      scrollToTopTick,
      setScroll,
      resetScroll,
      requestScrollToTop,
      isScrolled
    };
  });
  const _sfc_main$e = {
    __name: "AppTabIcon",
    props: {
      name: {
        type: String,
        required: true,
        validator: (v) => ["home", "messages", "discover", "profile", "arrow-up"].includes(v)
      },
      active: { type: Boolean, default: false }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const __returned__ = {};
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["tab-icon-svg", { active: $props.active }])
      },
      [
        vue.createCommentVNode(" uni-app 无原生 svg 组件时用 text 符号兜底；H5 可用 image+data-uri，此处用 emoji 风格字符保证多端 "),
        vue.createElementVNode(
          "text",
          {
            class: vue.normalizeClass(["icon-glyph", { active: $props.active }])
          },
          vue.toDisplayString($props.name === "home" ? "⌂" : $props.name === "messages" ? "💬" : $props.name === "discover" ? "◎" : $props.name === "profile" ? "☺" : "↑"),
          3
          /* TEXT, CLASS */
        )
      ],
      2
      /* CLASS */
    );
  }
  const AppTabIcon = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$e], ["__scopeId", "data-v-82052abc"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppTabIcon.vue"]]);
  const _sfc_main$d = {
    __name: "AppTabBar",
    setup(__props, { expose: __expose }) {
      __expose();
      const { t } = useI18n();
      const chat2 = useChatStore();
      const tabScroll = useTabScrollStore();
      const safe = vue.computed(() => readSafeArea());
      const tabs = vue.computed(() => [
        { path: "/pages/home/index", icon: "home", label: t("nav.home") },
        { path: "/pages/messages/index", icon: "messages", label: t("nav.messages"), badge: true },
        { path: "/pages/discover/index", icon: "discover", label: t("nav.discover") },
        { path: "/pages/profile/index", icon: "profile", label: t("nav.profile") }
      ]);
      const totalUnread = vue.computed(() => chat2.totalUnread);
      function isActive(path) {
        const pages = getCurrentPages();
        const cur = pages[pages.length - 1];
        if (!cur)
          return false;
        const normalized = path.replace(/^\//, "");
        return cur.route === normalized;
      }
      function showBackToTop(path) {
        return isActive(path) && tabScroll.isScrolled(path);
      }
      function onTabTap(path) {
        if (isActive(path)) {
          if (tabScroll.isScrolled(path)) {
            tabScroll.requestScrollToTop(path);
          }
          return;
        }
        tabScroll.resetScroll(path);
        uni.redirectTo({
          url: path,
          fail: () => uni.reLaunch({ url: path })
        });
      }
      const __returned__ = { t, chat: chat2, tabScroll, safe, tabs, totalUnread, isActive, showBackToTop, onTabTap, computed: vue.computed, get useI18n() {
        return useI18n;
      }, get useChatStore() {
        return useChatStore;
      }, get useTabScrollStore() {
        return useTabScrollStore;
      }, get readSafeArea() {
        return readSafeArea;
      }, AppTabIcon };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "tab-bar",
        style: vue.normalizeStyle({ paddingBottom: $setup.safe.safeAreaBottom + "px" })
      },
      [
        vue.createElementVNode("view", { class: "tab-bar-inner" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.tabs, (tab) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: tab.path,
                class: "tab-item",
                onClick: ($event) => $setup.onTabTap(tab.path)
              }, [
                vue.createElementVNode("view", { style: { "position": "relative" } }, [
                  vue.createVNode($setup["AppTabIcon"], {
                    name: $setup.showBackToTop(tab.path) ? "arrow-up" : tab.icon,
                    active: $setup.isActive(tab.path)
                  }, null, 8, ["name", "active"]),
                  tab.badge && $setup.totalUnread > 0 && !$setup.showBackToTop(tab.path) ? (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 0,
                      class: "tab-badge"
                    },
                    vue.toDisplayString($setup.totalUnread > 99 ? "99+" : $setup.totalUnread),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ]),
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass(["tab-label", { active: $setup.isActive(tab.path), muted: !$setup.isActive(tab.path) }])
                  },
                  vue.toDisplayString(tab.label),
                  3
                  /* TEXT, CLASS */
                )
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ],
      4
      /* STYLE */
    );
  }
  const AppTabBar = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$d], ["__scopeId", "data-v-8715b27c"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppTabBar.vue"]]);
  const TAB_FALLBACK = "/pages/home/index";
  const _sfc_main$c = {
    __name: "AppPageShell",
    props: {
      /** 顶栏标题 */
      title: String,
      /** 是否显示顶栏 */
      showHeader: { type: Boolean, default: true },
      /**
       * 是否显示返回：
       * - true / false：强制开关
       * - 未传：非 Tab 页自动显示（showTabBar=false）
       */
      showBack: { type: Boolean, default: void 0 },
      /** 是否挂载底部自定义 TabBar（主 Tab 页） */
      showTabBar: { type: Boolean, default: false },
      /** 是否预留顶栏右侧插槽区域 */
      headerRight: { type: Boolean, default: false },
      /** 返回按钮埋点 ID */
      backAnalyticsId: String,
      /** 返回按钮埋点名称 */
      backAnalyticsName: String,
      /** navigateBack 失败时的兜底路径 */
      backFallbackUrl: { type: String, default: TAB_FALLBACK }
    },
    emits: ["back"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const safe = vue.computed(() => readSafeArea());
      const shouldShowBack = vue.computed(() => {
        if (props.showBack === true)
          return true;
        if (props.showBack === false)
          return false;
        return !props.showTabBar;
      });
      const shellStyle = vue.computed(() => ({
        paddingBottom: props.showTabBar ? `${safe.value.safeAreaBottom + 56}px` : `${safe.value.safeAreaBottom}px`
      }));
      const headerStyle = vue.computed(() => ({
        paddingTop: `${safe.value.safeAreaTop}px`
      }));
      function onBack() {
        if (props.backAnalyticsId) {
          trackButtonClick(
            props.backAnalyticsId,
            props.backAnalyticsName || props.backAnalyticsId
          );
        }
        emit("back");
        const pages = getCurrentPages();
        if (pages.length > 1) {
          uni.navigateBack({
            fail: () => uni.reLaunch({ url: props.backFallbackUrl })
          });
          return;
        }
        uni.reLaunch({ url: props.backFallbackUrl });
      }
      const __returned__ = { TAB_FALLBACK, props, emit, safe, shouldShowBack, shellStyle, headerStyle, onBack, computed: vue.computed, get readSafeArea() {
        return readSafeArea;
      }, get trackButtonClick() {
        return trackButtonClick;
      }, AppTabBar };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "app-shell",
        style: vue.normalizeStyle($setup.shellStyle)
      },
      [
        $props.showHeader ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 0,
            class: "app-header",
            style: vue.normalizeStyle($setup.headerStyle)
          },
          [
            vue.createElementVNode("view", { class: "app-header-inner" }, [
              vue.createElementVNode("view", { class: "header-side header-left" }, [
                $setup.shouldShowBack ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "back-btn",
                  "hover-class": "back-btn-hover",
                  onClick: vue.withModifiers($setup.onBack, ["stop"])
                }, [
                  vue.createElementVNode("text", { class: "back-icon" }, "‹")
                ])) : vue.createCommentVNode("v-if", true)
              ]),
              vue.createElementVNode("view", { class: "header-main" }, [
                vue.renderSlot(_ctx.$slots, "header-title", {}, () => [
                  $props.title ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 0,
                      class: "app-title"
                    },
                    vue.toDisplayString($props.title),
                    1
                    /* TEXT */
                  )) : (vue.openBlock(), vue.createElementBlock("text", {
                    key: 1,
                    class: "app-title app-title-spacer"
                  }))
                ], true)
              ]),
              vue.createElementVNode("view", { class: "header-side header-right" }, [
                vue.renderSlot(_ctx.$slots, "header-right", {}, void 0, true)
              ])
            ])
          ],
          4
          /* STYLE */
        )) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "app-shell-body" }, [
          vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
        ]),
        $props.showTabBar ? (vue.openBlock(), vue.createBlock($setup["AppTabBar"], { key: 1 })) : vue.createCommentVNode("v-if", true)
      ],
      4
      /* STYLE */
    );
  }
  const AppPageShell = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c], ["__scopeId", "data-v-d72e35f1"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppPageShell.vue"]]);
  const _sfc_main$b = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const { t } = useI18n();
      const gender = vue.ref("secret");
      const sexualOrientation = vue.ref("heterosexual");
      const email = vue.ref("");
      const nickname = vue.ref("");
      const password = vue.ref("");
      const confirmPassword = vue.ref("");
      const error = vue.ref("");
      const loading = vue.ref(false);
      const showPassword = vue.ref(false);
      const showConfirmPassword = vue.ref(false);
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      async function handleRegister() {
        error.value = "";
        const trimmedEmail = email.value.trim();
        const trimmedNickname = nickname.value.trim();
        if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
          error.value = t("register.errorEmail");
          return;
        }
        if (!trimmedNickname) {
          error.value = t("register.errorNickname", { defaultValue: "请输入昵称" });
          return;
        }
        if (!password.value || password.value.length < 6) {
          error.value = t("register.errorPassword");
          return;
        }
        if (password.value !== confirmPassword.value) {
          error.value = t("register.errorConfirm");
          return;
        }
        loading.value = true;
        try {
          const res = await rawFetch("/api/auth/register", {
            method: "POST",
            header: { "Content-Type": "application/json" },
            data: {
              username: trimmedEmail,
              nickname: trimmedNickname,
              email: trimmedEmail,
              password: password.value,
              gender: gender.value === "male" ? "男" : gender.value === "female" ? "女" : "保密",
              sexual_orientation: sexualOrientation.value
            }
          });
          if (!res.ok) {
            const serverError = String(res.data.error || res.data.message || res.data.detail || "").toLowerCase();
            const isEmailRegistered = res.status === 409 || serverError.includes("already") || serverError.includes("duplicate") || serverError.includes("用户名") || serverError.includes("邮箱");
            error.value = isEmailRegistered ? "该邮箱已被注册" : res.data.error || res.data.message || res.data.detail || t("register.errorFailed");
            return;
          }
          setItem("user_token", res.data.token);
          setItem("user_info", JSON.stringify(res.data.user));
          uni.reLaunch({ url: "/pages/home/index" });
        } catch {
          error.value = t("common.networkError");
        } finally {
          loading.value = false;
        }
      }
      const genderOptions = [
        { value: "male", label: () => t("register.male") },
        { value: "female", label: () => t("register.female") },
        { value: "secret", label: () => t("register.secret") }
      ];
      const orientations = [
        "heterosexual",
        "homosexual",
        "bisexual",
        "pansexual",
        "asexual",
        "secret"
      ];
      function onOrientationChange(e) {
        var _a2;
        const idx = Number(((_a2 = e == null ? void 0 : e.detail) == null ? void 0 : _a2.value) ?? 0);
        sexualOrientation.value = orientations[idx] || orientations[0];
      }
      function goPrivacy() {
        uni.navigateTo({ url: "/pages-sub/privacy/index" });
      }
      function goLogin() {
        uni.navigateBack({
          fail: () => uni.reLaunch({ url: "/pages/login/index" })
        });
      }
      const __returned__ = { t, gender, sexualOrientation, email, nickname, password, confirmPassword, error, loading, showPassword, showConfirmPassword, EMAIL_REGEX, handleRegister, genderOptions, orientations, onOrientationChange, goPrivacy, goLogin, ref: vue.ref, get useI18n() {
        return useI18n;
      }, get rawFetch() {
        return rawFetch;
      }, get setItem() {
        return setItem;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      }, AppPageShell };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createBlock($setup["AppPageShell"], {
      title: $setup.t("register.title"),
      "show-back": true,
      "back-fallback-url": "/pages/login/index",
      "back-analytics-id": "register-back",
      "back-analytics-name": "注册页返回"
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode("scroll-view", {
          "scroll-y": "",
          class: "register-page"
        }, [
          vue.createElementVNode("view", { class: "register-inner" }, [
            vue.createElementVNode("view", { class: "logo-wrap" }, [
              vue.createElementVNode("view", { class: "logo-circle" }, "♥"),
              vue.createElementVNode(
                "text",
                { class: "text-muted" },
                vue.toDisplayString($setup.t("register.subtitle")),
                1
                /* TEXT */
              )
            ]),
            $setup.error ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 0,
                class: "error-text"
              },
              vue.toDisplayString($setup.error),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true),
            vue.withDirectives(vue.createElementVNode("input", {
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.email = $event),
              class: "input-field",
              placeholder: $setup.t("register.email")
            }, null, 8, ["placeholder"]), [
              [vue.vModelText, $setup.email]
            ]),
            vue.withDirectives(vue.createElementVNode("input", {
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.nickname = $event),
              class: "input-field mt-md",
              placeholder: $setup.t("register.nickname")
            }, null, 8, ["placeholder"]), [
              [vue.vModelText, $setup.nickname]
            ]),
            vue.createElementVNode("view", { class: "password-wrap mt-md" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.password = $event),
                class: "input-field",
                password: !$setup.showPassword,
                placeholder: $setup.t("register.password")
              }, null, 8, ["password", "placeholder"]), [
                [vue.vModelText, $setup.password]
              ]),
              vue.createElementVNode(
                "text",
                {
                  class: "eye-btn",
                  onClick: _cache[3] || (_cache[3] = ($event) => $setup.showPassword = !$setup.showPassword)
                },
                vue.toDisplayString($setup.showPassword ? "👁" : "👁‍🗨"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "password-wrap mt-md" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.confirmPassword = $event),
                class: "input-field",
                password: !$setup.showConfirmPassword,
                placeholder: $setup.t("register.confirmPassword")
              }, null, 8, ["password", "placeholder"]), [
                [vue.vModelText, $setup.confirmPassword]
              ]),
              vue.createElementVNode(
                "text",
                {
                  class: "eye-btn",
                  onClick: _cache[5] || (_cache[5] = ($event) => $setup.showConfirmPassword = !$setup.showConfirmPassword)
                },
                vue.toDisplayString($setup.showConfirmPassword ? "👁" : "👁‍🗨"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode(
              "text",
              { class: "label mt-md" },
              vue.toDisplayString($setup.t("register.gender")),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "flex-row gap-sm mt-md" }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.genderOptions, (opt) => {
                  return vue.createElementVNode("button", {
                    key: opt.value,
                    class: vue.normalizeClass(["pill-btn", { active: $setup.gender === opt.value }]),
                    onClick: ($event) => $setup.gender = opt.value
                  }, vue.toDisplayString(opt.label()), 11, ["onClick"]);
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ]),
            vue.createElementVNode(
              "text",
              { class: "label mt-md" },
              vue.toDisplayString($setup.t("register.sexualOrientation")),
              1
              /* TEXT */
            ),
            vue.createElementVNode("picker", {
              range: $setup.orientations,
              value: $setup.orientations.indexOf($setup.sexualOrientation),
              onChange: $setup.onOrientationChange
            }, [
              vue.createElementVNode(
                "view",
                { class: "input-field mt-md" },
                vue.toDisplayString($setup.t(`register.${$setup.sexualOrientation}`)),
                1
                /* TEXT */
              )
            ], 40, ["value"]),
            vue.createElementVNode("button", {
              class: "btn-primary w-full mt-md",
              disabled: $setup.loading,
              onClick: _cache[6] || (_cache[6] = ($event) => $setup.bindAnalyticsTap("register-submit", $setup.handleRegister, "注册"))
            }, vue.toDisplayString($setup.loading ? $setup.t("register.registering") : $setup.t("register.registerBtn")), 9, ["disabled"]),
            vue.createElementVNode("view", { class: "agree mt-md" }, [
              vue.createElementVNode(
                "text",
                { class: "text-muted" },
                vue.toDisplayString($setup.t("register.agree")),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                {
                  class: "text-primary",
                  onClick: $setup.goPrivacy
                },
                vue.toDisplayString($setup.t("register.privacy")),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", {
              class: "login-link mt-md",
              onClick: _cache[7] || (_cache[7] = ($event) => $setup.bindAnalyticsTap("register-to-login", $setup.goLogin, "去登录"))
            }, [
              vue.createElementVNode(
                "text",
                { class: "text-muted" },
                vue.toDisplayString($setup.t("register.hasAccount")),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "text-primary" },
                vue.toDisplayString($setup.t("register.goLogin")),
                1
                /* TEXT */
              )
            ])
          ])
        ])
      ]),
      _: 1
      /* STABLE */
    }, 8, ["title"]);
  }
  const PagesRegisterIndex = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b], ["__scopeId", "data-v-46a64346"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/register/index.vue"]]);
  var define_import_meta_env_default$1 = { VITE_CJS_IGNORE_WARNING: "true", VITE_USER_NODE_ENV: "development", VITE_ROOT_DIR: "/Users/zeas/Desktop/client-uniii", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const LOCAL_HOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i;
  const API_BASE = ((_a = define_import_meta_env_default$1.VITE_API_BASE_URL) == null ? void 0 : _a.trim().replace(/\/$/, "")) || "";
  const DEFAULT_COS_IMAGE_BASE = "https://trandsai-1256118830.cos.ap-bangkok.myqcloud.com/images";
  function getCosImageBase() {
    return (define_import_meta_env_default$1.VITE_COS_IMAGE_BASE || "").trim().replace(/\/$/, "") || DEFAULT_COS_IMAGE_BASE;
  }
  function getMediaOrigin() {
    if (API_BASE)
      return API_BASE;
    return "https://www.trandsai.com";
  }
  function dataImagesFilename(src) {
    if (!src)
      return "";
    try {
      const path = /^https?:\/\//i.test(src) ? new URL(src).pathname : src;
      const m = String(path).match(/^\/data\/images\/([^/]+)$/);
      return m ? m[1] : "";
    } catch {
      return "";
    }
  }
  function cosUrlForDataImage(src) {
    const name = dataImagesFilename(src);
    if (!name)
      return void 0;
    return `${getCosImageBase()}/${name}`;
  }
  function localDataImageUrl(src) {
    const name = dataImagesFilename(src);
    if (!name)
      return void 0;
    return `${getMediaOrigin()}/data/images/${name}`;
  }
  function normalizeMediaUrl(src) {
    if (!src)
      return void 0;
    const trimmed = src.trim();
    if (!trimmed)
      return void 0;
    if (!trimmed || trimmed === "__GENERATING__" || trimmed.includes("__GENERATING__") || trimmed.includes("/src/") || trimmed.includes("main.tsx") || trimmed.includes("?t=") || /\.(tsx?|jsx?|js|map|json|md|py|html|css|ts|log)$/i.test(trimmed) || trimmed.includes("placeholder") || // 测试/脏数据占位域名（discover 帖子里偶发 https://xxx/1.jpg）
    /^https?:\/\/xxx(\/|$)/i.test(trimmed) || trimmed.includes("picsum.photos") && trimmed.length < 30 || trimmed.startsWith("http") && trimmed.includes("x.ai")) {
      const knownJunk = /^https?:\/\/xxx(\/|$)/i.test(trimmed) || trimmed.includes("__GENERATING__") || trimmed.includes("placeholder");
      if (!knownJunk) {
        formatAppLog("warn", "at utils/media.js:108", "[Image Guard] 检测到无效/异常图片地址，使用 fallback:", trimmed);
      }
      return void 0;
    }
    const origin = getMediaOrigin();
    if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
      return trimmed;
    }
    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      const isLocalHost = LOCAL_HOST_RE.test(trimmed);
      let isSameHost = false;
      try {
        const parsed = new URL(trimmed);
        if (!isSameHost && API_BASE) {
          try {
            isSameHost = parsed.origin === new URL(API_BASE).origin;
          } catch {
          }
        }
        if (isLocalHost || isSameHost) {
          const cos = cosUrlForDataImage(parsed.pathname);
          if (cos)
            return cos;
          return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        isSameHost = false;
      }
      return trimmed;
    }
    if (trimmed.startsWith("/")) {
      const cos = cosUrlForDataImage(trimmed);
      if (cos)
        return cos;
      return `${origin}${trimmed}`;
    }
    return `${origin}/${trimmed}`;
  }
  function resolveThumbUrl(src, maxEdge = 400) {
    const full = normalizeMediaUrl(src);
    if (!full)
      return void 0;
    if (full.startsWith("data:") || full.startsWith("blob:"))
      return full;
    if (full.includes("_thumb."))
      return full;
    const origin = getMediaOrigin();
    try {
      const u = new URL(full, origin);
      const path = u.pathname;
      if (/\.(svg)$/i.test(path))
        return full;
      if (path.startsWith("/data/images/")) {
        return `${origin}/api/media/thumb?src=${encodeURIComponent(path)}&w=${maxEdge}`;
      }
      const parts = path.split("/");
      const name = parts.pop() || "";
      const stem = name.replace(/\.[^.]+$/, "");
      if (!stem)
        return full;
      parts.push(`${stem}_thumb.webp`);
      u.pathname = parts.join("/");
      return u.toString();
    } catch {
      return full;
    }
  }
  const _sfc_main$a = {
    __name: "AppAvatarImage",
    props: {
      src: String,
      seed: String,
      size: { type: String, default: "md" },
      generating: { type: Boolean, default: false }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const props = __props;
      const failed = vue.ref(false);
      const displaySrc = vue.ref("");
      vue.watch(
        () => [props.src, props.seed],
        () => {
          failed.value = false;
          displaySrc.value = props.src ? normalizeMediaUrl(props.src) || "" : "";
        },
        { immediate: true }
      );
      const fallback = vue.computed(
        () => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(props.seed || "default")}`
      );
      const finalSrc = vue.computed(() => {
        if (failed.value || !displaySrc.value)
          return fallback.value;
        return displaySrc.value;
      });
      function onError() {
        failed.value = true;
      }
      const __returned__ = { props, failed, displaySrc, fallback, finalSrc, onError, ref: vue.ref, watch: vue.watch, computed: vue.computed, get normalizeMediaUrl() {
        return normalizeMediaUrl;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["avatar-root", "size-" + $props.size])
      },
      [
        $props.generating ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "avatar-gen"
        }, [
          vue.createElementVNode("view", { class: "spinner" })
        ])) : (vue.openBlock(), vue.createElementBlock("image", {
          key: 1,
          class: "avatar-img",
          src: $setup.finalSrc,
          mode: "aspectFill",
          "lazy-load": "",
          onError: $setup.onError
        }, null, 40, ["src"]))
      ],
      2
      /* CLASS */
    );
  }
  const AppAvatarImage = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a], ["__scopeId", "data-v-ecaa79ce"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppAvatarImage.vue"]]);
  var define_import_meta_env_default = { VITE_CJS_IGNORE_WARNING: "true", VITE_USER_NODE_ENV: "development", VITE_ROOT_DIR: "/Users/zeas/Desktop/client-uniii", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const FALLBACK = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=";
  const _sfc_main$9 = {
    __name: "AppMomentImage",
    props: {
      src: String,
      preferThumb: { type: Boolean, default: true },
      mode: { type: String, default: "widthFix" },
      imgClass: String
    },
    emits: ["click"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      const stage = vue.ref(props.preferThumb ? "thumb" : "full");
      vue.watch(
        () => [props.src, props.preferThumb],
        () => {
          stage.value = props.preferThumb ? "thumb" : "full";
        }
      );
      const displaySrc = vue.computed(() => {
        if (stage.value === "fallback")
          return FALLBACK;
        const cos = cosUrlForDataImage(props.src);
        const local = localDataImageUrl(props.src);
        const full = normalizeMediaUrl(props.src) || cos || local;
        if (!full)
          return FALLBACK;
        if (stage.value === "thumb") {
          return resolveThumbUrl(full) || full;
        }
        if (stage.value === "full") {
          return full;
        }
        return local || FALLBACK;
      });
      function onError() {
        if (stage.value === "thumb") {
          stage.value = "full";
          return;
        }
        if (stage.value === "full") {
          const apiBase = (define_import_meta_env_default.VITE_API_BASE_URL || "").trim();
          const localBackend = /localhost|127\.0\.0\.1/.test(apiBase) || define_import_meta_env_default.VITE_PREFER_LOCAL_IMAGES === "1";
          const local = localDataImageUrl(props.src);
          if (localBackend && local && local !== displaySrc.value) {
            stage.value = "local";
            return;
          }
        }
        stage.value = "fallback";
      }
      function onTap() {
        emit("click");
      }
      const __returned__ = { FALLBACK, props, emit, stage, displaySrc, onError, onTap, ref: vue.ref, watch: vue.watch, computed: vue.computed, get normalizeMediaUrl() {
        return normalizeMediaUrl;
      }, get resolveThumbUrl() {
        return resolveThumbUrl;
      }, get cosUrlForDataImage() {
        return cosUrlForDataImage;
      }, get localDataImageUrl() {
        return localDataImageUrl;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("image", {
      class: vue.normalizeClass($props.imgClass),
      src: $setup.displaySrc,
      mode: $props.mode,
      "lazy-load": "",
      onError: $setup.onError,
      onClick: $setup.onTap
    }, null, 42, ["src", "mode"]);
  }
  const AppMomentImage = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppMomentImage.vue"]]);
  const _sfc_main$8 = {
    __name: "AppListSkeleton",
    props: {
      /** 骨架行数 */
      rows: { type: Number, default: 4 },
      /** 是否显示左侧圆形头像占位 */
      avatar: { type: Boolean, default: true }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const __returned__ = {};
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "list-skeleton px-md py-sm" }, [
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($props.rows, (i) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: i,
            class: "skel-row flex-row items-center gap-sm"
          }, [
            $props.avatar ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "skel-avatar skeleton"
            })) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", {
              class: "skel-body flex-col",
              style: { "flex": "1" }
            }, [
              vue.createElementVNode("view", {
                class: "skel-line skeleton",
                style: { "width": "40%", "height": "28rpx", "margin-bottom": "16rpx" }
              }),
              vue.createElementVNode("view", {
                class: "skel-line skeleton",
                style: { "width": "80%", "height": "24rpx" }
              })
            ])
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  const AppListSkeleton = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8], ["__scopeId", "data-v-6163bb8c"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppListSkeleton.vue"]]);
  function resolveRaw(tree, key) {
    if (!tree || !key)
      return void 0;
    let cur = tree;
    for (const part of key.split(".")) {
      if (cur == null || typeof cur !== "object")
        return void 0;
      cur = cur[part];
    }
    return typeof cur === "string" ? cur : void 0;
  }
  function withCount(template, count) {
    return String(template).replace(/\{\{count\}\}/g, String(count)).replace(/\{count\}/g, String(count));
  }
  function useRelativeTime(prefix = "home") {
    const { t, locale, messages: messages2 } = useI18n();
    function tr(key, count) {
      var _a2, _b, _c, _d, _e;
      const tree = ((_a2 = messages2.value) == null ? void 0 : _a2[locale.value]) || ((_b = messages2.value) == null ? void 0 : _b.zh) || ((_c = messages2.value) == null ? void 0 : _c.en) || {};
      const raw = resolveRaw(tree, key) || resolveRaw(((_d = messages2.value) == null ? void 0 : _d.en) || {}, key) || resolveRaw(((_e = messages2.value) == null ? void 0 : _e.zh) || {}, key);
      if (raw != null && count != null)
        return withCount(raw, count);
      if (raw != null)
        return raw;
      return count != null ? t(key, { count }) : t(key);
    }
    function format2(isoTime) {
      if (!isoTime)
        return "";
      const diffMs = Date.now() - new Date(isoTime).getTime();
      const diffSec = Math.floor(diffMs / 1e3);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      if (prefix === "messages") {
        if (diffSec < 60)
          return tr("messages.justNow");
        if (diffMin < 60)
          return tr("messages.minutesAgo", diffMin);
        if (diffHour < 24)
          return tr("messages.hoursAgo", diffHour);
        if (diffDay === 1)
          return tr("messages.yesterday");
        if (diffDay < 7)
          return tr("messages.daysAgo", diffDay);
        const d = new Date(isoTime);
        const now2 = /* @__PURE__ */ new Date();
        if (d.getFullYear() === now2.getFullYear()) {
          return d.toLocaleDateString(void 0, { month: "short", day: "numeric" });
        }
        return d.toLocaleDateString(void 0, {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
      if (diffSec < 60)
        return tr(`${prefix}.justNow`);
      if (diffMin < 60)
        return tr(`${prefix}.minutesAgo`, diffMin);
      if (diffHour < 24)
        return tr(`${prefix}.hoursAgo`, diffHour);
      if (diffDay < 7)
        return tr(`${prefix}.daysAgo`, diffDay);
      return new Date(isoTime).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric"
      });
    }
    return { format: format2, t: vue.computed(() => t) };
  }
  const CACHE_TTL_MS = 6e4;
  const LS_PREFIX = "companions_cache_v1:";
  const cache = /* @__PURE__ */ new Map();
  const inflight = /* @__PURE__ */ new Map();
  function cacheKey(params) {
    const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k] ?? ""}`).join("&");
    return sorted || "default";
  }
  function readLsCache(key) {
    try {
      const raw = getItem(LS_PREFIX + key);
      if (!raw)
        return null;
      const parsed = JSON.parse(raw);
      if (!(parsed == null ? void 0 : parsed.data) || Date.now() - parsed.ts >= CACHE_TTL_MS)
        return null;
      return parsed;
    } catch {
      return null;
    }
  }
  function writeLsCache(key, data) {
    try {
      setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
    }
  }
  function invalidateCompanionsCache() {
    cache.clear();
    removeKeysWithPrefix(LS_PREFIX);
  }
  function getCachedCompanions(params = {}) {
    const key = cacheKey(params);
    const now2 = Date.now();
    const hit = cache.get(key);
    if (hit && now2 - hit.ts < CACHE_TTL_MS)
      return hit.data;
    const ls = readLsCache(key);
    if (ls) {
      cache.set(key, ls);
      return ls.data;
    }
    return null;
  }
  async function fetchCompanions(params = {}, options = {}) {
    const key = cacheKey(params);
    const now2 = Date.now();
    if (!options.force) {
      const hit = cache.get(key);
      if (hit && now2 - hit.ts < CACHE_TTL_MS)
        return hit.data;
      const ls = readLsCache(key);
      if (ls) {
        cache.set(key, ls);
        return ls.data;
      }
      const pending = inflight.get(key);
      if (pending)
        return pending;
    }
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "")
        qs.set(k, String(v));
    }
    const url = `/companions${qs.toString() ? `?${qs}` : ""}`;
    const promise = apiFetch(url).then((data) => {
      const list = Array.isArray(data) ? data : [];
      const entry = { data: list, ts: Date.now() };
      cache.set(key, entry);
      writeLsCache(key, list);
      return list;
    }).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, promise);
    return promise;
  }
  const MOMENTS_KEY = "home_moments_v1";
  const COMPANIONS_STRIP_KEY = "home_companion_strip_v1";
  function readHomeMomentsCache() {
    try {
      const raw = getItem(MOMENTS_KEY);
      if (!raw)
        return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  function writeHomeMomentsCache(moments) {
    try {
      setItem(MOMENTS_KEY, JSON.stringify(moments));
    } catch {
    }
  }
  function readHomeCompanionsStripCache() {
    try {
      const raw = getItem(COMPANIONS_STRIP_KEY);
      if (!raw)
        return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  function writeHomeCompanionsStripCache(companions) {
    try {
      setItem(COMPANIONS_STRIP_KEY, JSON.stringify(companions));
    } catch {
    }
  }
  const citiesByLang = {
    zh: ["北京", "上海", "成都", "广州", "深圳", "杭州", "武汉", "西安"],
    en: ["New York", "Los Angeles", "London", "San Francisco", "Seattle", "Chicago", "Boston", "Austin"],
    ja: ["東京", "大阪", "京都", "札幌", "福岡", "名古屋", "横浜", "神戸"],
    ko: ["서울", "부산", "인천", "대구", "광주", "대전", "울산", "제주"],
    pt: ["São Paulo", "Rio de Janeiro", "Salvador", "Brasília", "Belo Horizonte", "Fortaleza", "Curitiba", "Porto Alegre"],
    es: ["Madrid", "Barcelona", "México City", "Buenos Aires", "Lima", "Bogotá", "Santiago", "Valencia"],
    id: ["Jakarta", "Surabaya", "Bandung", "Medan", "Makassar", "Yogyakarta", "Semarang", "Bali"]
  };
  const cityToLangMap = {};
  Object.entries(citiesByLang).forEach(([lang, cities]) => {
    cities.forEach((city) => {
      cityToLangMap[city] = lang;
    });
  });
  function inferCompanionLanguage(city) {
    if (!city)
      return "zh";
    const cityLower = city.trim().toLowerCase();
    return cityToLangMap[city] || (["北京", "上海", "成都", "广州", "深圳", "杭州", "武汉", "西安", "南京", "重庆"].some((c) => cityLower.includes(c.toLowerCase()) || c.toLowerCase().includes(cityLower)) ? "zh" : "zh");
  }
  function sortCompanionsByUserLang(companions, userLang) {
    const targetLang = (userLang == null ? void 0 : userLang.split("-")[0]) || userLang || "zh";
    return [...companions].sort((a, b) => {
      var _a2, _b, _c, _d;
      const langA = ((_a2 = a.profile) == null ? void 0 : _a2.language) || inferCompanionLanguage(((_b = a.profile) == null ? void 0 : _b.city) || "");
      const langB = ((_c = b.profile) == null ? void 0 : _c.language) || inferCompanionLanguage(((_d = b.profile) == null ? void 0 : _d.city) || "");
      const matchA = langA === targetLang ? 1 : 0;
      const matchB = langB === targetLang ? 1 : 0;
      return matchB - matchA;
    });
  }
  const REPLIES_VIEWED_KEY = "moment_replies_viewed";
  const LOCAL_REPLY_NOTIFS_KEY = "moment_reply_notifs_v1";
  function parseStoredIdList(raw) {
    if (!raw)
      return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed))
        return [];
      return parsed.map((item) => typeof item === "number" || typeof item === "string" ? String(item) : null).filter(Boolean);
    } catch {
      return [];
    }
  }
  function readViewedReplyIds() {
    return parseStoredIdList(getItem(REPLIES_VIEWED_KEY));
  }
  function readLocalReplyNotifs() {
    try {
      const raw = getItem(LOCAL_REPLY_NOTIFS_KEY);
      if (!raw)
        return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  function writeLocalReplyNotifs(items) {
    try {
      setItem(LOCAL_REPLY_NOTIFS_KEY, JSON.stringify((items || []).slice(0, 50)));
    } catch {
    }
  }
  function recordLocalReplyNotif(payload) {
    if (!(payload == null ? void 0 : payload.replyId) || !(payload == null ? void 0 : payload.momentId))
      return;
    const replyId = String(payload.replyId);
    const prev = readLocalReplyNotifs().filter((n) => String(n.replyId) !== replyId);
    writeLocalReplyNotifs([
      {
        replyId,
        momentId: payload.momentId,
        title: payload.title || "",
        content: payload.content || "",
        avatar: payload.avatar || "",
        imageUrl: payload.imageUrl || "",
        time: payload.time || (/* @__PURE__ */ new Date()).toISOString(),
        companionId: payload.companionId || ""
      },
      ...prev
    ]);
  }
  function findAiRepliesToUser(comments) {
    const list = Array.isArray(comments) ? comments : [];
    const myIds = new Set(
      list.filter((c) => c && c.is_user).map((c) => String(c.id))
    );
    if (!myIds.size)
      return [];
    return list.filter((c) => {
      if (!c || c.is_user)
        return false;
      if (c.parent_id == null || c.parent_id === "")
        return false;
      return myIds.has(String(c.parent_id));
    });
  }
  function computeHomeHasUnread(moments) {
    const lastViewed = getItem("moments_last_viewed");
    const hasNewMoment = (moments || []).some((m) => {
      if (!lastViewed)
        return true;
      return new Date(String(m.created_at)).getTime() > new Date(lastViewed).getTime();
    });
    if (hasNewMoment)
      return true;
    const viewed = new Set(readViewedReplyIds());
    for (const local of readLocalReplyNotifs()) {
      if ((local == null ? void 0 : local.replyId) && !viewed.has(String(local.replyId)))
        return true;
    }
    for (const m of moments || []) {
      for (const c of findAiRepliesToUser(m.comments)) {
        if (!viewed.has(String(c.id)))
          return true;
      }
    }
    return false;
  }
  function uiLangCode(locale) {
    return String(locale || "zh").split("-")[0] || "zh";
  }
  function formatCompanionGender(gender, t) {
    const g = String(gender || "").trim();
    if (!g)
      return "";
    if (g === "男" || g === "male")
      return t("register.male");
    if (g === "女" || g === "female")
      return t("register.female");
    if (g === "保密" || g === "secret")
      return t("register.secret");
    return g;
  }
  function formatCompanionAge(age, t) {
    if (age == null || age === "")
      return "";
    const unit = String(t("companionProfile.ageUnit") || "").trim();
    if (!unit)
      return String(age);
    const needsSpace = /^[A-Za-z]/.test(unit);
    return `${age}${needsSpace ? " " : ""}${unit}`;
  }
  function formatCompanionMeta(profile2, t, opts = {}) {
    const includeCity = opts.includeCity !== false;
    const parts = [
      formatCompanionAge(profile2 == null ? void 0 : profile2.age, t),
      formatCompanionGender(profile2 == null ? void 0 : profile2.gender, t)
    ];
    if (includeCity && (profile2 == null ? void 0 : profile2.city))
      parts.push(String(profile2.city));
    return parts.filter(Boolean).join(" · ");
  }
  function formatCompanionName(name, fallback = "") {
    if (name == null)
      return fallback;
    if (typeof name === "string") {
      const s2 = name.trim();
      return s2 || fallback;
    }
    if (typeof name === "object" && name.name != null) {
      return formatCompanionName(name.name, fallback);
    }
    const s = String(name).trim();
    if (!s || s === "[object Object]")
      return fallback;
    return s;
  }
  const TAB_PATH$3 = "/pages/home/index";
  const PAGE_SIZE = 20;
  const _sfc_main$7 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const tabScroll = useTabScrollStore();
      const { t, locale } = useI18n();
      const { format: formatRelativeTime } = useRelativeTime("home");
      requireAuth();
      let pendingMomentSync = false;
      let initialized = false;
      const cachedMoments = readHomeMomentsCache();
      const cachedCompanions = readHomeCompanionsStripCache();
      const hasHomeCache = Boolean((cachedMoments == null ? void 0 : cachedMoments.length) || (cachedCompanions == null ? void 0 : cachedCompanions.length));
      const companions = vue.ref(cachedCompanions ?? []);
      const moments = vue.ref(cachedMoments ?? []);
      const loading = vue.ref(!hasHomeCache);
      const refreshing = vue.ref(false);
      const loadingMore = vue.ref(false);
      const hasMore = vue.ref(true);
      const previewImage = vue.ref(null);
      const hasUnread = vue.ref(false);
      const showBackToTop = vue.ref(false);
      let momentsOffset = 0;
      const scrollTopControl = vue.ref(0);
      let lastScrollTop = 0;
      const momentFilterLang = vue.ref("");
      const momentFilterGender = vue.ref("");
      const momentFilterOrientation = vue.ref("");
      const showMomentFilter = vue.ref(false);
      const draftFilterLang = vue.ref("");
      const draftFilterGender = vue.ref("");
      const draftFilterOrientation = vue.ref("");
      const filterActive = vue.computed(
        () => Boolean(momentFilterLang.value || momentFilterGender.value || momentFilterOrientation.value)
      );
      const langOptions = vue.computed(() => [
        { value: "", label: t("home.filterAll") },
        { value: "zh", label: "中文" },
        { value: "en", label: "English" },
        { value: "ja", label: "日本語" },
        { value: "ko", label: "한국어" },
        { value: "pt", label: "Português" },
        { value: "es", label: "Español" },
        { value: "id", label: "Bahasa Indonesia" }
      ]);
      const genderOptions = vue.computed(() => [
        { value: "", label: t("home.filterAll") },
        { value: "男", label: t("register.male") },
        { value: "女", label: t("register.female") }
      ]);
      const orientationOptions = vue.computed(() => [
        { value: "", label: t("home.filterAll") },
        { value: "heterosexual", label: t("register.heterosexual") },
        { value: "homosexual", label: t("register.homosexual") },
        { value: "bisexual", label: t("register.bisexual") },
        { value: "pansexual", label: t("register.pansexual") },
        { value: "asexual", label: t("register.asexual") },
        { value: "secret", label: t("register.secret") }
      ]);
      function optionLabel(options, value) {
        var _a2;
        return ((_a2 = options.find((o) => o.value === value)) == null ? void 0 : _a2.label) || options[0].label;
      }
      const commentDrafts = vue.ref({});
      const commentBusy = vue.ref({});
      const commentInputKeys = vue.ref({});
      const focusedCommentId = vue.ref("");
      async function loadCompanionStrip() {
        const companionsRes = await fetchCompanions({ filter_type: "mine" });
        const userLang = locale.value || "zh";
        const sorted = sortCompanionsByUserLang(companionsRes || [], userLang);
        const mapped = sorted.map((c) => {
          var _a2, _b, _c, _d, _e;
          return {
            id: ((_a2 = c.profile) == null ? void 0 : _a2.id) || "",
            name: formatCompanionName((_b = c.profile) == null ? void 0 : _b.name, t("home.defaultCompanionName")),
            avatar: c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(_c = c.profile) == null ? void 0 : _c.id}`,
            affection: ((_d = c.state) == null ? void 0 : _d.affection) || 0,
            gender: ((_e = c.profile) == null ? void 0 : _e.gender) || "",
            avatar_generating: c.avatar_generating
          };
        });
        companions.value = mapped;
        writeHomeCompanionsStripCache(mapped);
      }
      async function loadMomentsPage(isRefresh, filters) {
        const currentOffset = isRefresh ? 0 : momentsOffset;
        const fl = (filters == null ? void 0 : filters.filter_lang) ?? momentFilterLang.value;
        const fg = (filters == null ? void 0 : filters.gender) ?? momentFilterGender.value;
        const fo = (filters == null ? void 0 : filters.orientation) ?? momentFilterOrientation.value;
        const mq = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(currentOffset),
          lang: locale.value || "zh"
        });
        if (fl)
          mq.set("filter_lang", fl);
        if (fg)
          mq.set("gender", fg);
        if (fo)
          mq.set("orientation", fo);
        const momentsRes = await apiFetch(
          `/api/moments?${mq.toString()}`,
          { header: deviceHeaders() }
        );
        const newMoments = momentsRes.moments || [];
        const newTotal = momentsRes.total || 0;
        const nextOffset = currentOffset + newMoments.length;
        momentsOffset = nextOffset;
        if (isRefresh) {
          moments.value = newMoments;
          writeHomeMomentsCache(newMoments);
        } else {
          const existingIds = new Set(moments.value.map((m) => m.id));
          const uniqueNew = newMoments.filter((m) => !existingIds.has(m.id));
          const merged = [...moments.value, ...uniqueNew];
          moments.value = merged;
          writeHomeMomentsCache(merged);
        }
        hasMore.value = nextOffset < newTotal;
        if (isRefresh) {
          hasUnread.value = computeHomeHasUnread(newMoments);
        }
      }
      async function performFullRefresh(isPull) {
        const hasCachedUi = companions.value.length > 0 || moments.value.length > 0;
        if (isPull)
          refreshing.value = true;
        else if (!hasCachedUi)
          loading.value = true;
        try {
          await Promise.all([loadCompanionStrip(), loadMomentsPage(true)]);
        } catch (e) {
          formatAppLog("error", "at pages/home/index.vue:220", "加载失败:", e);
        } finally {
          if (isPull)
            refreshing.value = false;
          else
            loading.value = false;
        }
      }
      async function loadMore() {
        if (loadingMore.value || !hasMore.value || loading.value)
          return;
        loadingMore.value = true;
        try {
          await loadMomentsPage(false);
        } catch (e) {
          formatAppLog("error", "at pages/home/index.vue:236", "加载更多失败:", e);
        } finally {
          loadingMore.value = false;
        }
      }
      function onRefresh() {
        if (refreshing.value)
          return;
        void performFullRefresh(true);
      }
      function onScroll(e) {
        lastScrollTop = e.detail.scrollTop;
        showBackToTop.value = e.detail.scrollTop > 200;
        tabScroll.setScroll(TAB_PATH$3, e.detail.scrollTop);
      }
      vue.watch(
        () => tabScroll.scrollToTopTick[TAB_PATH$3],
        () => {
          scrollHomeToTop();
        }
      );
      function scrollHomeToTop() {
        scrollTopControl.value = lastScrollTop;
        void vue.nextTick(() => {
          scrollTopControl.value = 0;
        });
      }
      function sameMomentId(a, b) {
        return a != null && b != null && String(a) === String(b);
      }
      function draftKey(momentId) {
        return String(momentId);
      }
      function onCommentInput(momentId, e) {
        var _a2;
        const key = draftKey(momentId);
        const value = ((_a2 = e == null ? void 0 : e.detail) == null ? void 0 : _a2.value) ?? "";
        commentDrafts.value = { ...commentDrafts.value, [key]: value };
      }
      function onCommentBlur(momentId) {
        if (focusedCommentId.value === draftKey(momentId)) {
          focusedCommentId.value = "";
        }
      }
      function focusMomentComment(momentId) {
        const key = draftKey(momentId);
        focusedCommentId.value = "";
        void vue.nextTick(() => {
          focusedCommentId.value = key;
        });
      }
      async function handleLike(momentId) {
        try {
          const data = await apiFetch(
            `/api/moments/${momentId}/like`,
            { method: "POST", header: deviceHeaders() }
          );
          if (data == null ? void 0 : data.ok) {
            moments.value = moments.value.map(
              (m) => sameMomentId(m.id, momentId) ? { ...m, liked: !!data.liked, likes_count: data.likes_count ?? m.likes_count } : m
            );
            writeHomeMomentsCache(moments.value);
          } else if (data == null ? void 0 : data.error) {
            showToast(String(data.error));
          }
        } catch (e) {
          formatAppLog("error", "at pages/home/index.vue:317", "点赞失败:", e);
        }
      }
      function patchMomentComments(momentId, patchFn) {
        moments.value = moments.value.map((m) => {
          if (!sameMomentId(m.id, momentId))
            return m;
          return patchFn(m);
        });
        writeHomeMomentsCache(moments.value);
      }
      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      async function pollMomentAiReply(momentId, userCommentId) {
        for (let i = 0; i < 20; i++) {
          await sleep(2e3);
          try {
            const detail = await apiFetch(`/api/moments/${momentId}`, {
              header: deviceHeaders()
            });
            const remote = (detail == null ? void 0 : detail.comments) || [];
            if (!remote.length)
              continue;
            const aiReady = remote.some(
              (c) => !c.is_user && (userCommentId == null || String(userCommentId).startsWith("tmp-") || sameMomentId(c.parent_id, userCommentId))
            );
            patchMomentComments(momentId, (m) => {
              const prev = m.comments || [];
              const byId = new Map(
                prev.filter((c) => !String(c.id).startsWith("tmp-")).map((c) => [String(c.id), c])
              );
              for (const c of remote) {
                byId.set(String(c.id), c);
              }
              const merged = [...byId.values()].sort((a, b) => {
                const ta = new Date(a.created_at || 0).getTime();
                const tb = new Date(b.created_at || 0).getTime();
                return ta - tb;
              });
              return {
                ...m,
                comments: merged,
                comments_count: detail.comments_count ?? Math.max(m.comments_count || 0, merged.length)
              };
            });
            if (aiReady) {
              const replies = findAiRepliesToUser(remote).filter(
                (c) => userCommentId == null || String(userCommentId).startsWith("tmp-") || sameMomentId(c.parent_id, userCommentId)
              );
              const momentRow = moments.value.find((m) => sameMomentId(m.id, momentId));
              for (const c of replies) {
                recordLocalReplyNotif({
                  replyId: c.id,
                  momentId,
                  title: c.companion_name || (momentRow == null ? void 0 : momentRow.companion_name) || t("home.defaultCompanionName"),
                  content: c.content || "",
                  avatar: (momentRow == null ? void 0 : momentRow.companion_avatar) || "",
                  imageUrl: (momentRow == null ? void 0 : momentRow.image_url) || "",
                  time: c.created_at,
                  companionId: c.companion_id || (momentRow == null ? void 0 : momentRow.companion_id)
                });
              }
              hasUnread.value = computeHomeHasUnread(moments.value);
              return;
            }
          } catch (e) {
            formatAppLog("warn", "at pages/home/index.vue:400", "轮询 AI 回复失败:", e);
          }
        }
      }
      async function handleComment(momentId, e) {
        var _a2;
        const key = draftKey(momentId);
        const fromEvent = typeof ((_a2 = e == null ? void 0 : e.detail) == null ? void 0 : _a2.value) === "string" ? e.detail.value : null;
        const content = (fromEvent ?? commentDrafts.value[key] ?? "").trim();
        if (!content || commentBusy.value[key])
          return;
        const tempId = `tmp-${key}-${Date.now()}`;
        commentBusy.value = { ...commentBusy.value, [key]: true };
        commentDrafts.value = { ...commentDrafts.value, [key]: "" };
        commentInputKeys.value = {
          ...commentInputKeys.value,
          [key]: (commentInputKeys.value[key] || 0) + 1
        };
        focusedCommentId.value = "";
        patchMomentComments(momentId, (m) => ({
          ...m,
          comments_count: (m.comments_count || 0) + 1,
          comments: [
            ...m.comments || [],
            {
              id: tempId,
              user_id: getCurrentUserId(),
              is_user: true,
              companion_id: null,
              companion_name: t("common.me"),
              content,
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              pending: true
            }
          ]
        }));
        commentBusy.value = { ...commentBusy.value, [key]: false };
        try {
          const data = await apiFetch(`/api/moments/${momentId}/comment`, {
            method: "POST",
            header: {
              ...deviceHeaders(),
              "Content-Type": "application/json"
            },
            data: { content },
            // 仅等用户评论落库；AI 在后台
            timeout: 2e4
          });
          if (data == null ? void 0 : data.ok) {
            patchMomentComments(momentId, (m) => {
              const prev = m.comments || [];
              const hadTemp = prev.some((c) => c.id === tempId);
              const hadReal = prev.some((c) => sameMomentId(c.id, data.id));
              const withoutDup = prev.filter(
                (c) => c.id !== tempId && !sameMomentId(c.id, data.id)
              );
              const newComments = [
                ...withoutDup,
                {
                  id: data.id,
                  user_id: getCurrentUserId(),
                  is_user: true,
                  companion_id: null,
                  companion_name: t("common.me"),
                  content: data.content || content,
                  created_at: data.created_at
                }
              ];
              let countDelta = 0;
              if (!hadTemp && !hadReal)
                countDelta += 1;
              if (data.ai_reply && !prev.some((c) => sameMomentId(c.id, data.ai_reply.id)) && !newComments.some((c) => sameMomentId(c.id, data.ai_reply.id))) {
                newComments.push(data.ai_reply);
                countDelta += 1;
              }
              return {
                ...m,
                comments_count: (m.comments_count || 0) + countDelta,
                comments: newComments
              };
            });
            if (!data.ai_reply) {
              void pollMomentAiReply(momentId, data.id);
            } else {
              const momentRow = moments.value.find((m) => sameMomentId(m.id, momentId));
              recordLocalReplyNotif({
                replyId: data.ai_reply.id,
                momentId,
                title: data.ai_reply.companion_name || (momentRow == null ? void 0 : momentRow.companion_name) || t("home.defaultCompanionName"),
                content: data.ai_reply.content || "",
                avatar: (momentRow == null ? void 0 : momentRow.companion_avatar) || "",
                imageUrl: (momentRow == null ? void 0 : momentRow.image_url) || "",
                time: data.ai_reply.created_at,
                companionId: data.ai_reply.companion_id || (momentRow == null ? void 0 : momentRow.companion_id)
              });
              hasUnread.value = computeHomeHasUnread(moments.value);
            }
          } else {
            patchMomentComments(momentId, (m) => ({
              ...m,
              comments_count: Math.max(0, (m.comments_count || 0) - 1),
              comments: (m.comments || []).filter((c) => c.id !== tempId)
            }));
            commentDrafts.value = { ...commentDrafts.value, [key]: content };
            commentInputKeys.value = {
              ...commentInputKeys.value,
              [key]: (commentInputKeys.value[key] || 0) + 1
            };
            showToast(String((data == null ? void 0 : data.error) || (data == null ? void 0 : data.detail) || t("common.networkError")));
          }
        } catch (err) {
          formatAppLog("error", "at pages/home/index.vue:527", "评论失败:", err);
          const msg = String((err == null ? void 0 : err.errMsg) || (err == null ? void 0 : err.message) || err || "");
          const timedOut = /timeout|超时|timed?\s*out/i.test(msg);
          if (timedOut) {
            void pollMomentAiReply(momentId, tempId);
          } else {
            patchMomentComments(momentId, (m) => ({
              ...m,
              comments_count: Math.max(0, (m.comments_count || 0) - 1),
              comments: (m.comments || []).filter((c) => c.id !== tempId)
            }));
            commentDrafts.value = { ...commentDrafts.value, [key]: content };
            commentInputKeys.value = {
              ...commentInputKeys.value,
              [key]: (commentInputKeys.value[key] || 0) + 1
            };
          }
        }
      }
      function isCommentByMe(comment) {
        if (!comment)
          return false;
        if (comment.is_user)
          return true;
        const currentUserId = getCurrentUserId();
        const userId = comment.user_id;
        return userId != null && currentUserId != null && String(userId) === String(currentUserId);
      }
      function openMomentFilter() {
        draftFilterLang.value = momentFilterLang.value;
        draftFilterGender.value = momentFilterGender.value;
        draftFilterOrientation.value = momentFilterOrientation.value;
        showMomentFilter.value = true;
      }
      function resetDraftFilter() {
        draftFilterLang.value = "";
        draftFilterGender.value = "";
        draftFilterOrientation.value = "";
      }
      function applyMomentFilter() {
        momentFilterLang.value = draftFilterLang.value;
        momentFilterGender.value = draftFilterGender.value;
        momentFilterOrientation.value = draftFilterOrientation.value;
        momentsOffset = 0;
        showMomentFilter.value = false;
        void (async () => {
          loading.value = true;
          try {
            await Promise.all([
              loadCompanionStrip(),
              loadMomentsPage(true, {
                filter_lang: draftFilterLang.value,
                gender: draftFilterGender.value,
                orientation: draftFilterOrientation.value
              })
            ]);
          } finally {
            loading.value = false;
          }
        })();
      }
      function onPickLang(e) {
        var _a2;
        draftFilterLang.value = ((_a2 = langOptions.value[Number(e.detail.value)]) == null ? void 0 : _a2.value) ?? "";
      }
      function onPickGender(e) {
        var _a2;
        draftFilterGender.value = ((_a2 = genderOptions.value[Number(e.detail.value)]) == null ? void 0 : _a2.value) ?? "";
      }
      function onPickOrientation(e) {
        var _a2;
        draftFilterOrientation.value = ((_a2 = orientationOptions.value[Number(e.detail.value)]) == null ? void 0 : _a2.value) ?? "";
      }
      function openCompanion(id2) {
        uni.navigateTo({ url: `/pages-sub/companion/index?id=${id2}` });
      }
      function openMoment(id2) {
        pendingMomentSync = true;
        uni.navigateTo({ url: `/pages-sub/moment/index?id=${id2}` });
      }
      function goCreate() {
        uni.navigateTo({ url: "/pages-sub/create/index" });
      }
      function goNotifications() {
        uni.navigateTo({ url: "/pages-sub/notifications/index" });
      }
      function closePreview() {
        previewImage.value = null;
      }
      const onLikeTap = bindAnalyticsTapArg(
        "home-moment-like",
        handleLike,
        "首页朋友圈点赞"
      );
      const onCommentOpenTap = bindAnalyticsTapArg(
        "home-moment-comment",
        focusMomentComment,
        "首页朋友圈评论"
      );
      const onMomentDetailTap = bindAnalyticsTapArg(
        "home-moment-detail",
        openMoment,
        "首页朋友圈详情"
      );
      const onSendCommentTap = bindAnalyticsTapArg(
        "home-send-comment",
        handleComment,
        "首页发送评论"
      );
      const onCompanionStripTap = bindAnalyticsTapArg(
        (id2) => `home-companion-${id2}`,
        openCompanion
      );
      function getCompanionById(id2) {
        return companions.value.find((c) => c.id === id2);
      }
      function displayName(m) {
        var _a2;
        return formatCompanionName(
          m.companion_name || ((_a2 = getCompanionById(m.companion_id)) == null ? void 0 : _a2.name),
          t("home.defaultCompanionName")
        );
      }
      function displayGender(m) {
        var _a2;
        return m.companion_gender ?? ((_a2 = getCompanionById(m.companion_id)) == null ? void 0 : _a2.gender) ?? "";
      }
      function displayAvatar(m) {
        var _a2;
        return m.companion_avatar || ((_a2 = getCompanionById(m.companion_id)) == null ? void 0 : _a2.avatar) || "";
      }
      vue.onMounted(() => {
        void performFullRefresh(false).finally(() => {
          initialized = true;
        });
      });
      onShow(() => {
        if (!initialized)
          return;
        hasUnread.value = computeHomeHasUnread(moments.value);
        void loadCompanionStrip().catch((e) => formatAppLog("error", "at pages/home/index.vue:687", e));
        if (!pendingMomentSync)
          return;
        pendingMomentSync = false;
        const commenting = Object.values(commentBusy.value).some(Boolean);
        if (commenting)
          return;
        void loadMomentsPage(true).catch((e) => formatAppLog("error", "at pages/home/index.vue:692", e));
      });
      const __returned__ = { TAB_PATH: TAB_PATH$3, tabScroll, PAGE_SIZE, t, locale, formatRelativeTime, get pendingMomentSync() {
        return pendingMomentSync;
      }, set pendingMomentSync(v) {
        pendingMomentSync = v;
      }, get initialized() {
        return initialized;
      }, set initialized(v) {
        initialized = v;
      }, cachedMoments, cachedCompanions, hasHomeCache, companions, moments, loading, refreshing, loadingMore, hasMore, previewImage, hasUnread, showBackToTop, get momentsOffset() {
        return momentsOffset;
      }, set momentsOffset(v) {
        momentsOffset = v;
      }, scrollTopControl, get lastScrollTop() {
        return lastScrollTop;
      }, set lastScrollTop(v) {
        lastScrollTop = v;
      }, momentFilterLang, momentFilterGender, momentFilterOrientation, showMomentFilter, draftFilterLang, draftFilterGender, draftFilterOrientation, filterActive, langOptions, genderOptions, orientationOptions, optionLabel, commentDrafts, commentBusy, commentInputKeys, focusedCommentId, loadCompanionStrip, loadMomentsPage, performFullRefresh, loadMore, onRefresh, onScroll, scrollHomeToTop, sameMomentId, draftKey, onCommentInput, onCommentBlur, focusMomentComment, handleLike, patchMomentComments, sleep, pollMomentAiReply, handleComment, isCommentByMe, openMomentFilter, resetDraftFilter, applyMomentFilter, onPickLang, onPickGender, onPickOrientation, openCompanion, openMoment, goCreate, goNotifications, closePreview, onLikeTap, onCommentOpenTap, onMomentDetailTap, onSendCommentTap, onCompanionStripTap, getCompanionById, displayName, displayGender, displayAvatar, ref: vue.ref, computed: vue.computed, nextTick: vue.nextTick, onMounted: vue.onMounted, watch: vue.watch, get onShow() {
        return onShow;
      }, get useI18n() {
        return useI18n;
      }, AppPageShell, AppAvatarImage, AppMomentImage, AppListSkeleton, get requireAuth() {
        return requireAuth;
      }, get getCurrentUserId() {
        return getCurrentUserId;
      }, get useRelativeTime() {
        return useRelativeTime;
      }, get apiFetch() {
        return apiFetch;
      }, get fetchCompanions() {
        return fetchCompanions;
      }, get readHomeCompanionsStripCache() {
        return readHomeCompanionsStripCache;
      }, get readHomeMomentsCache() {
        return readHomeMomentsCache;
      }, get writeHomeCompanionsStripCache() {
        return writeHomeCompanionsStripCache;
      }, get writeHomeMomentsCache() {
        return writeHomeMomentsCache;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      }, get bindAnalyticsTapArg() {
        return bindAnalyticsTapArg;
      }, get useTabScrollStore() {
        return useTabScrollStore;
      }, get sortCompanionsByUserLang() {
        return sortCompanionsByUserLang;
      }, get deviceHeaders() {
        return deviceHeaders;
      }, get getItem() {
        return getItem;
      }, get setItem() {
        return setItem;
      }, get showToast() {
        return showToast;
      }, get computeHomeHasUnread() {
        return computeHomeHasUnread;
      }, get findAiRepliesToUser() {
        return findAiRepliesToUser;
      }, get recordLocalReplyNotif() {
        return recordLocalReplyNotif;
      }, get formatCompanionName() {
        return formatCompanionName;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createBlock($setup["AppPageShell"], {
      "show-header": false,
      "show-tab-bar": ""
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode("view", { class: "home-page" }, [
          vue.createCommentVNode(" ═════════════ 顶部标题栏 + 筛选/通知 ═════════════ "),
          vue.createElementVNode("view", { class: "home-header" }, [
            vue.createElementVNode("view", { class: "flex-row justify-between items-center" }, [
              vue.createElementVNode("text", { class: "page-title" }, "Moments"),
              vue.createElementVNode("view", { class: "flex-row items-center header-actions" }, [
                $setup.refreshing ? (vue.openBlock(), vue.createElementBlock("text", {
                  key: 0,
                  class: "text-muted refreshing-hint"
                }, "⟳")) : vue.createCommentVNode("v-if", true),
                vue.createCommentVNode(" 筛选按钮：筛选激活时显示小粉点 "),
                vue.createElementVNode("view", {
                  class: "icon-btn",
                  onClick: _cache[0] || (_cache[0] = ($event) => $setup.bindAnalyticsTap("home-moment-filter", $setup.openMomentFilter, "朋友圈筛选"))
                }, [
                  vue.createElementVNode("text", { class: "icon-txt" }, "⚙️"),
                  $setup.filterActive ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "dot"
                  })) : vue.createCommentVNode("v-if", true)
                ]),
                vue.createCommentVNode(" 通知铃铛 "),
                vue.createElementVNode("view", {
                  class: "icon-btn",
                  onClick: _cache[1] || (_cache[1] = ($event) => $setup.bindAnalyticsTap("home-notification", $setup.goNotifications, "通知"))
                }, [
                  vue.createElementVNode("text", { class: "icon-txt" }, "🔔"),
                  $setup.hasUnread ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "dot"
                  })) : vue.createCommentVNode("v-if", true)
                ])
              ])
            ])
          ]),
          vue.createCommentVNode(" ═════════════ 首屏骨架（无缓存时） ═════════════ "),
          $setup.loading && !$setup.companions.length && !$setup.moments.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "home-body"
          }, [
            vue.createVNode($setup["AppListSkeleton"], { rows: 6 })
          ])) : (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            { key: 1 },
            [
              vue.createCommentVNode(" ═════════════ 主滚动区：下拉刷新 + 无限滚动 ═════════════ "),
              vue.createElementVNode("scroll-view", {
                "scroll-y": "",
                class: "home-body",
                "scroll-top": $setup.scrollTopControl,
                "scroll-with-animation": "",
                "refresher-enabled": true,
                "refresher-triggered": $setup.refreshing,
                "refresher-background": "var(--bg)",
                "lower-threshold": 240,
                onRefresherrefresh: $setup.onRefresh,
                onScrolltolower: $setup.loadMore,
                onScroll: $setup.onScroll
              }, [
                vue.createCommentVNode(" ── 智能体头像横滑条（含创建入口） ── "),
                vue.createElementVNode("view", { class: "strip-wrap" }, [
                  vue.createElementVNode("scroll-view", {
                    "scroll-x": "",
                    class: "companion-strip",
                    "show-scrollbar": "false"
                  }, [
                    vue.createElementVNode("view", { class: "strip-row" }, [
                      vue.createElementVNode("view", {
                        class: "strip-item",
                        onClick: _cache[2] || (_cache[2] = ($event) => $setup.bindAnalyticsTap("home-create-companion", $setup.goCreate, "创建伴侣"))
                      }, [
                        vue.createElementVNode("view", { class: "strip-create" }, [
                          vue.createElementVNode("text", { class: "strip-plus" }, "＋")
                        ]),
                        vue.createElementVNode(
                          "text",
                          { class: "strip-name text-muted" },
                          vue.toDisplayString($setup.t("home.create")),
                          1
                          /* TEXT */
                        )
                      ]),
                      (vue.openBlock(true), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList($setup.companions, (c) => {
                          return vue.openBlock(), vue.createElementBlock("view", {
                            key: c.id,
                            class: "strip-item",
                            onClick: ($event) => $setup.onCompanionStripTap(c.id)
                          }, [
                            vue.createElementVNode("view", { class: "strip-avatar" }, [
                              vue.createVNode($setup["AppAvatarImage"], {
                                src: c.avatar,
                                seed: c.id,
                                generating: c.avatar_generating
                              }, null, 8, ["src", "seed", "generating"])
                            ]),
                            vue.createElementVNode(
                              "text",
                              { class: "strip-name" },
                              vue.toDisplayString(c.name),
                              1
                              /* TEXT */
                            )
                          ], 8, ["onClick"]);
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ])
                  ])
                ]),
                vue.createCommentVNode(" ── 朋友圈动态列表 ── "),
                !$setup.moments.length ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "empty text-muted"
                  },
                  vue.toDisplayString($setup.t("home.noMoments")),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true),
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.moments, (m) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: m.id,
                      class: "moment-card"
                    }, [
                      vue.createCommentVNode(" 发布者信息 "),
                      vue.createElementVNode("view", { class: "flex-row items-center gap-sm moment-head" }, [
                        vue.createElementVNode("view", {
                          onClick: ($event) => $setup.openCompanion(m.companion_id)
                        }, [
                          vue.createVNode($setup["AppAvatarImage"], {
                            src: $setup.displayAvatar(m),
                            seed: m.companion_id,
                            size: "sm"
                          }, null, 8, ["src", "seed"])
                        ], 8, ["onClick"]),
                        vue.createElementVNode("view", { class: "flex-1" }, [
                          vue.createElementVNode("view", { class: "flex-row items-center name-row" }, [
                            vue.createElementVNode(
                              "text",
                              { class: "moment-name" },
                              vue.toDisplayString($setup.displayName(m)),
                              1
                              /* TEXT */
                            ),
                            $setup.displayGender(m) === "男" ? (vue.openBlock(), vue.createElementBlock("text", {
                              key: 0,
                              class: "gender male"
                            }, "♂")) : vue.createCommentVNode("v-if", true),
                            $setup.displayGender(m) === "女" ? (vue.openBlock(), vue.createElementBlock("text", {
                              key: 1,
                              class: "gender female"
                            }, "♀")) : vue.createCommentVNode("v-if", true)
                          ]),
                          vue.createElementVNode(
                            "text",
                            { class: "text-muted moment-time" },
                            vue.toDisplayString($setup.formatRelativeTime(m.created_at)),
                            1
                            /* TEXT */
                          )
                        ])
                      ]),
                      vue.createCommentVNode(" 文案 "),
                      vue.createElementVNode(
                        "text",
                        { class: "moment-caption" },
                        vue.toDisplayString(m.caption),
                        1
                        /* TEXT */
                      ),
                      vue.createCommentVNode(" 图片：生成中 → 占位 spinner，否则可点击预览 "),
                      m.image_generating ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "moment-generating"
                      }, [
                        vue.createElementVNode(
                          "text",
                          { class: "text-muted" },
                          vue.toDisplayString($setup.t("common.loading")),
                          1
                          /* TEXT */
                        )
                      ])) : (vue.openBlock(), vue.createBlock($setup["AppMomentImage"], {
                        key: 1,
                        src: m.image_url,
                        mode: "aspectFill",
                        "img-class": "moment-img",
                        onClick: ($event) => $setup.previewImage = m.image_url
                      }, null, 8, ["src", "onClick"])),
                      vue.createCommentVNode(" 点赞 / 评论（💬 聚焦输入；点评论区进详情） "),
                      vue.createElementVNode("view", { class: "moment-actions flex-row items-center" }, [
                        vue.createElementVNode("view", {
                          class: "action-btn flex-row items-center",
                          onClick: ($event) => $setup.onLikeTap(m.id)
                        }, [
                          vue.createElementVNode(
                            "text",
                            {
                              class: vue.normalizeClass(["action-icon", { liked: m.liked }])
                            },
                            vue.toDisplayString(m.liked ? "♥" : "♡"),
                            3
                            /* TEXT, CLASS */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "action-count" },
                            vue.toDisplayString(m.likes_count),
                            1
                            /* TEXT */
                          )
                        ], 8, ["onClick"]),
                        vue.createElementVNode("view", {
                          class: "action-btn flex-row items-center",
                          onClick: ($event) => $setup.onCommentOpenTap(m.id)
                        }, [
                          vue.createElementVNode("text", { class: "action-icon" }, "💬"),
                          vue.createElementVNode(
                            "text",
                            { class: "action-count" },
                            vue.toDisplayString(m.comments_count),
                            1
                            /* TEXT */
                          )
                        ], 8, ["onClick"])
                      ]),
                      vue.createCommentVNode(" 评论列表 "),
                      m.comments && m.comments.length ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 2,
                        class: "comments-box",
                        onClick: ($event) => $setup.onMomentDetailTap(m.id)
                      }, [
                        (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          null,
                          vue.renderList(m.comments, (comment) => {
                            return vue.openBlock(), vue.createElementBlock("view", {
                              key: comment.id,
                              class: "comment-line"
                            }, [
                              vue.createElementVNode(
                                "text",
                                {
                                  class: vue.normalizeClass(["comment-name", $setup.isCommentByMe(comment) ? "mine" : "text-primary"])
                                },
                                vue.toDisplayString($setup.isCommentByMe(comment) ? $setup.t("common.me") : $setup.formatCompanionName(comment.companion_name, $setup.t("home.defaultCompanionName"))),
                                3
                                /* TEXT, CLASS */
                              ),
                              vue.createElementVNode(
                                "text",
                                {
                                  class: vue.normalizeClass(["comment-content", { pending: comment.pending }])
                                },
                                [
                                  comment.reply_to_name ? (vue.openBlock(), vue.createElementBlock(
                                    "text",
                                    {
                                      key: 0,
                                      class: "text-primary reply-to"
                                    },
                                    " @" + vue.toDisplayString(comment.reply_to_name === "我" ? $setup.t("common.me") : comment.reply_to_name),
                                    1
                                    /* TEXT */
                                  )) : vue.createCommentVNode("v-if", true),
                                  vue.createTextVNode(
                                    " " + vue.toDisplayString(comment.content),
                                    1
                                    /* TEXT */
                                  )
                                ],
                                2
                                /* CLASS */
                              )
                            ]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        ))
                      ], 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                      vue.createCommentVNode(" 评论输入（uni-input 清空 :value 不刷新 DOM，靠 :key remount） "),
                      vue.createElementVNode("view", { class: "comment-input-row flex-row items-center gap-sm" }, [
                        (vue.openBlock(), vue.createElementBlock("input", {
                          key: `cmt-${m.id}-${$setup.commentInputKeys[String(m.id)] || 0}`,
                          value: $setup.commentDrafts[String(m.id)] || "",
                          class: "comment-input",
                          focus: $setup.focusedCommentId === String(m.id),
                          disabled: !!$setup.commentBusy[String(m.id)],
                          placeholder: $setup.t("home.writeComment"),
                          "confirm-type": "send",
                          onInput: ($event) => $setup.onCommentInput(m.id, $event),
                          onConfirm: ($event) => $setup.handleComment(m.id, $event),
                          onBlur: ($event) => $setup.onCommentBlur(m.id)
                        }, null, 40, ["value", "focus", "disabled", "placeholder", "onInput", "onConfirm", "onBlur"])),
                        vue.createElementVNode("view", {
                          class: vue.normalizeClass(["send-btn", { disabled: $setup.commentBusy[String(m.id)] || !($setup.commentDrafts[String(m.id)] || "").trim() }]),
                          onClick: ($event) => $setup.onSendCommentTap(m.id)
                        }, [
                          vue.createElementVNode("text", null, "➤")
                        ], 10, ["onClick"])
                      ])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                vue.createCommentVNode(" 底部加载状态 "),
                vue.createElementVNode("view", { class: "footer-hint" }, [
                  $setup.loadingMore ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 0,
                      class: "text-muted"
                    },
                    vue.toDisplayString($setup.t("common.loading")),
                    1
                    /* TEXT */
                  )) : !$setup.hasMore && $setup.moments.length ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 1,
                      class: "text-muted no-more"
                    },
                    vue.toDisplayString($setup.t("home.noMoreMoments")),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ])
              ], 40, ["scroll-top", "refresher-triggered"])
            ],
            2112
            /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
          )),
          vue.createCommentVNode(" ═════════════ 返回顶部悬浮按钮 ═════════════ "),
          $setup.showBackToTop ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "back-to-top",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.bindAnalyticsTap("home-back-to-top", $setup.scrollHomeToTop, "返回顶部"))
          }, [
            vue.createElementVNode("text", null, "↑")
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createCommentVNode(" ═════════════ 筛选弹窗 ═════════════ "),
        $setup.showMomentFilter ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "modal-mask",
          onClick: _cache[6] || (_cache[6] = ($event) => $setup.showMomentFilter = false)
        }, [
          vue.createElementVNode("view", {
            class: "modal-sheet",
            onClick: _cache[5] || (_cache[5] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode("view", { class: "modal-header flex-row justify-between items-center" }, [
              vue.createElementVNode(
                "text",
                { class: "modal-title" },
                vue.toDisplayString($setup.t("home.momentFilter")),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", {
                class: "modal-close text-muted",
                onClick: _cache[4] || (_cache[4] = ($event) => $setup.showMomentFilter = false)
              }, "✕")
            ]),
            vue.createElementVNode("view", { class: "modal-body" }, [
              vue.createCommentVNode(" 语言筛选 "),
              vue.createElementVNode("view", { class: "filter-group" }, [
                vue.createElementVNode(
                  "text",
                  { class: "filter-label text-muted" },
                  vue.toDisplayString($setup.t("home.filterLanguage")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("picker", {
                  mode: "selector",
                  range: $setup.langOptions.map((o) => o.label),
                  onChange: $setup.onPickLang
                }, [
                  vue.createElementVNode("view", { class: "filter-select flex-row justify-between items-center" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.optionLabel($setup.langOptions, $setup.draftFilterLang)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("text", { class: "text-muted" }, "›")
                  ])
                ], 40, ["range"])
              ]),
              vue.createCommentVNode(" 性别筛选 "),
              vue.createElementVNode("view", { class: "filter-group" }, [
                vue.createElementVNode(
                  "text",
                  { class: "filter-label text-muted" },
                  vue.toDisplayString($setup.t("home.filterGender")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("picker", {
                  mode: "selector",
                  range: $setup.genderOptions.map((o) => o.label),
                  onChange: $setup.onPickGender
                }, [
                  vue.createElementVNode("view", { class: "filter-select flex-row justify-between items-center" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.optionLabel($setup.genderOptions, $setup.draftFilterGender)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("text", { class: "text-muted" }, "›")
                  ])
                ], 40, ["range"])
              ]),
              vue.createCommentVNode(" 性取向筛选 "),
              vue.createElementVNode("view", { class: "filter-group" }, [
                vue.createElementVNode(
                  "text",
                  { class: "filter-label text-muted" },
                  vue.toDisplayString($setup.t("home.filterOrientation")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("picker", {
                  mode: "selector",
                  range: $setup.orientationOptions.map((o) => o.label),
                  onChange: $setup.onPickOrientation
                }, [
                  vue.createElementVNode("view", { class: "filter-select flex-row justify-between items-center" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.optionLabel($setup.orientationOptions, $setup.draftFilterOrientation)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("text", { class: "text-muted" }, "›")
                  ])
                ], 40, ["range"])
              ]),
              vue.createCommentVNode(" 重置 / 应用 "),
              vue.createElementVNode("view", { class: "flex-row gap-sm filter-footer" }, [
                vue.createElementVNode("view", {
                  class: "filter-btn reset",
                  onClick: $setup.resetDraftFilter
                }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString($setup.t("home.resetFilter")),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", {
                  class: "filter-btn apply",
                  onClick: $setup.applyMomentFilter
                }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString($setup.t("home.applyFilter")),
                    1
                    /* TEXT */
                  )
                ])
              ])
            ])
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" ═════════════ 图片全屏预览 ═════════════ "),
        $setup.previewImage ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "preview-mask",
          onClick: $setup.closePreview
        }, [
          vue.createElementVNode("view", {
            class: "preview-close",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.bindAnalyticsTap("home-close-preview", $setup.closePreview, "关闭预览"))
          }, [
            vue.createElementVNode("text", null, "✕")
          ]),
          vue.createElementVNode("view", {
            class: "preview-body",
            onClick: _cache[8] || (_cache[8] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createVNode($setup["AppMomentImage"], {
              src: $setup.previewImage,
              "prefer-thumb": false,
              mode: "aspectFit",
              "img-class": "preview-img"
            }, null, 8, ["src"])
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      _: 1
      /* STABLE */
    });
  }
  const PagesHomeIndex = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7], ["__scopeId", "data-v-4978fed5"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/home/index.vue"]]);
  const TAB_PATH$2 = "/pages/messages/index";
  const _sfc_main$6 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const tabScroll = useTabScrollStore();
      const MESSAGES_FILTER = { filter_type: "mine_chatted" };
      const { t } = useI18n();
      const chat2 = useChatStore();
      const { format: formatRelativeTime } = useRelativeTime("messages");
      requireAuth();
      const initialCached = getCachedCompanions(MESSAGES_FILTER) ?? [];
      function buildConversations(companions) {
        const list = companions.map((c) => {
          const profile2 = c.profile || {};
          const id2 = String(profile2.id || "");
          const lastMsg = chat2.lastMessages[id2];
          return {
            id: id2,
            name: formatCompanionName(profile2.name, t("chat.defaultName")),
            avatar: c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id2 || "default")}`,
            lastMessage: (lastMsg == null ? void 0 : lastMsg.text) || c.last_message || "",
            time: (lastMsg == null ? void 0 : lastMsg.fullTime) ? formatRelativeTime(lastMsg.fullTime) : formatRelativeTime(c.last_message_time),
            rawTime: (lastMsg == null ? void 0 : lastMsg.fullTime) || c.last_message_time || "",
            unread: chat2.unreadCounts[id2] || 0,
            avatar_generating: c.avatar_generating
          };
        });
        list.sort((a, b) => {
          if (b.unread !== a.unread)
            return b.unread - a.unread;
          const aTime = a.rawTime ? new Date(a.rawTime).getTime() : 0;
          const bTime = b.rawTime ? new Date(b.rawTime).getTime() : 0;
          return bTime - aTime;
        });
        return list;
      }
      function buildContextConversations() {
        const ids = /* @__PURE__ */ new Set([
          ...Object.keys(chat2.lastMessages),
          ...Object.keys(chat2.unreadCounts)
        ]);
        const list = Array.from(ids).map((id2) => {
          const lastMsg = chat2.lastMessages[id2];
          return {
            id: id2,
            name: t("chat.defaultName"),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id2)}`,
            lastMessage: (lastMsg == null ? void 0 : lastMsg.text) || "",
            time: (lastMsg == null ? void 0 : lastMsg.fullTime) ? formatRelativeTime(lastMsg.fullTime) : "",
            rawTime: (lastMsg == null ? void 0 : lastMsg.fullTime) || "",
            unread: chat2.unreadCounts[id2] || 0
          };
        });
        list.sort((a, b) => {
          if (b.unread !== a.unread)
            return b.unread - a.unread;
          const aTime = a.rawTime ? new Date(a.rawTime).getTime() : 0;
          const bTime = b.rawTime ? new Date(b.rawTime).getTime() : 0;
          return bTime - aTime;
        });
        return list;
      }
      const rawCompanions = vue.ref(initialCached ?? []);
      const conversations = vue.ref(
        (initialCached == null ? void 0 : initialCached.length) ? buildConversations(initialCached) : buildContextConversations()
      );
      const loading = vue.ref(!(initialCached == null ? void 0 : initialCached.length) && !Object.keys(chat2.lastMessages).length);
      const showMenu = vue.ref(false);
      const searchQuery = vue.ref("");
      const filtered = vue.computed(() => {
        const q = searchQuery.value.trim().toLowerCase();
        if (!q)
          return conversations.value;
        return conversations.value.filter(
          (c) => c.name.toLowerCase().includes(q) || (c.lastMessage || "").toLowerCase().includes(q)
        );
      });
      function connectBackgroundWs(all) {
        const scored = [...all].sort(
          (a, b) => new Date(String(b.last_message_time || 0)).getTime() - new Date(String(a.last_message_time || 0)).getTime()
        );
        scored.slice(0, 2).forEach((c, idx) => {
          const profile2 = c.profile || {};
          const id2 = String(profile2.id || "");
          if (id2)
            setTimeout(() => chat2.connect(id2), idx * 100);
        });
      }
      async function loadConversations(background = false) {
        if (!background) {
          const cached = getCachedCompanions(MESSAGES_FILTER);
          const hasLocal = ((cached == null ? void 0 : cached.length) ?? 0) > 0 || Object.keys(chat2.lastMessages).length > 0;
          if (!hasLocal)
            loading.value = true;
        }
        try {
          const all = await fetchCompanions(MESSAGES_FILTER) || [];
          rawCompanions.value = all;
          conversations.value = buildConversations(all);
          connectBackgroundWs(all);
        } finally {
          loading.value = false;
        }
      }
      function openChat(id2) {
        chat2.connect(id2);
        uni.navigateTo({ url: `/pages/chat/index?id=${id2}` });
      }
      function goFeedback() {
        if (!isLoggedIn()) {
          showToast(t("messages.loginRequiredFeedback"));
          uni.reLaunch({ url: "/pages/login/index" });
          return;
        }
        uni.navigateTo({ url: "/pages-sub/feedback/index" });
      }
      function openMenu() {
        showMenu.value = true;
      }
      function closeMenu() {
        showMenu.value = false;
      }
      function goCreateCompanion() {
        showMenu.value = false;
        uni.navigateTo({ url: "/pages-sub/create/index" });
      }
      function goMyCompanions() {
        showMenu.value = false;
        uni.navigateTo({ url: "/pages-sub/my-companions/index" });
      }
      const onOpenChatTap = bindAnalyticsTapArg(
        (id2) => `messages-open-chat-${id2}`,
        openChat
      );
      vue.watch(
        () => [chat2.unreadCounts, chat2.lastMessages, rawCompanions.value],
        () => {
          conversations.value = rawCompanions.value.length ? buildConversations(rawCompanions.value) : buildContextConversations();
        },
        { deep: true }
      );
      let messagesShownOnce = false;
      onShow(() => {
        const background = messagesShownOnce || Boolean(initialCached == null ? void 0 : initialCached.length);
        messagesShownOnce = true;
        loadConversations(background);
      });
      onPageScroll((e) => {
        tabScroll.setScroll(TAB_PATH$2, e.scrollTop);
      });
      vue.watch(
        () => tabScroll.scrollToTopTick[TAB_PATH$2],
        () => {
          uni.pageScrollTo({ scrollTop: 0, duration: 300 });
        }
      );
      const __returned__ = { TAB_PATH: TAB_PATH$2, tabScroll, MESSAGES_FILTER, t, chat: chat2, formatRelativeTime, initialCached, buildConversations, buildContextConversations, rawCompanions, conversations, loading, showMenu, searchQuery, filtered, connectBackgroundWs, loadConversations, openChat, goFeedback, openMenu, closeMenu, goCreateCompanion, goMyCompanions, onOpenChatTap, get messagesShownOnce() {
        return messagesShownOnce;
      }, set messagesShownOnce(v) {
        messagesShownOnce = v;
      }, ref: vue.ref, computed: vue.computed, watch: vue.watch, get onShow() {
        return onShow;
      }, get onPageScroll() {
        return onPageScroll;
      }, get useI18n() {
        return useI18n;
      }, AppPageShell, AppAvatarImage, AppListSkeleton, get requireAuth() {
        return requireAuth;
      }, get isLoggedIn() {
        return isLoggedIn;
      }, get useChatStore() {
        return useChatStore;
      }, get fetchCompanions() {
        return fetchCompanions;
      }, get getCachedCompanions() {
        return getCachedCompanions;
      }, get useRelativeTime() {
        return useRelativeTime;
      }, get showToast() {
        return showToast;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      }, get bindAnalyticsTapArg() {
        return bindAnalyticsTapArg;
      }, get useTabScrollStore() {
        return useTabScrollStore;
      }, get formatCompanionName() {
        return formatCompanionName;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createBlock($setup["AppPageShell"], {
      title: $setup.t("messages.title"),
      "show-tab-bar": ""
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode("view", { class: "header px-md" }, [
          vue.createElementVNode("view", { class: "flex-row justify-between items-center mb-md" }, [
            vue.createElementVNode(
              "text",
              { class: "page-title" },
              vue.toDisplayString($setup.t("messages.title")),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", {
              class: "menu-btn",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.bindAnalyticsTap("messages-menu", $setup.openMenu, "消息页菜单"))
            }, "＋")
          ]),
          vue.createElementVNode("view", { class: "search-wrap flex-row items-center gap-sm" }, [
            vue.createElementVNode("text", null, "🔍"),
            vue.withDirectives(vue.createElementVNode("input", {
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.searchQuery = $event),
              class: "search-input",
              placeholder: $setup.t("messages.searchPlaceholder")
            }, null, 8, ["placeholder"]), [
              [vue.vModelText, $setup.searchQuery]
            ])
          ])
        ]),
        vue.createElementVNode("view", {
          class: "feedback-row px-md",
          onClick: _cache[2] || (_cache[2] = ($event) => $setup.bindAnalyticsTap("messages-feedback", $setup.goFeedback, "意见反馈"))
        }, [
          vue.createElementVNode("view", { class: "feedback-icon" }, "💬"),
          vue.createElementVNode("view", null, [
            vue.createElementVNode(
              "text",
              { class: "feedback-title" },
              vue.toDisplayString($setup.t("messages.feedback")),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "text-muted feedback-desc" },
              vue.toDisplayString($setup.t("messages.feedbackDesc")),
              1
              /* TEXT */
            )
          ])
        ]),
        $setup.loading && !$setup.conversations.length ? (vue.openBlock(), vue.createBlock($setup["AppListSkeleton"], { key: 0 })) : !$setup.conversations.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "empty center"
        }, [
          vue.createElementVNode(
            "text",
            { class: "text-muted" },
            vue.toDisplayString($setup.t("messages.noMessages")),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "text-muted hint" },
            vue.toDisplayString($setup.t("messages.createCompanionHint")),
            1
            /* TEXT */
          )
        ])) : !$setup.filtered.length ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 2,
            class: "empty center text-muted"
          },
          vue.toDisplayString($setup.t("messages.searchNoResults")),
          1
          /* TEXT */
        )) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 3,
          class: "list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.filtered, (c) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: c.id,
                class: "conv-row",
                onClick: ($event) => $setup.onOpenChatTap(c.id)
              }, [
                vue.createElementVNode("view", { class: "avatar-wrap" }, [
                  vue.createVNode($setup["AppAvatarImage"], {
                    src: c.avatar,
                    seed: c.id,
                    generating: c.avatar_generating
                  }, null, 8, ["src", "seed", "generating"]),
                  c.unread ? (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 0,
                      class: "badge"
                    },
                    vue.toDisplayString(c.unread > 99 ? "99+" : c.unread),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ]),
                vue.createElementVNode("view", { class: "flex-1" }, [
                  vue.createElementVNode("view", { class: "flex-row justify-between" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "name" },
                      vue.toDisplayString(c.name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "text-muted time" },
                      vue.toDisplayString(c.time),
                      1
                      /* TEXT */
                    )
                  ]),
                  $setup.chat.typingCompanions[c.id] ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 0,
                      class: "typing"
                    },
                    vue.toDisplayString($setup.t("messages.typing")),
                    1
                    /* TEXT */
                  )) : (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 1,
                      class: "preview text-muted"
                    },
                    vue.toDisplayString(c.lastMessage || $setup.t("messages.noMessageYet")),
                    1
                    /* TEXT */
                  ))
                ])
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])),
        $setup.showMenu ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 4,
          class: "sheet-mask",
          onClick: _cache[6] || (_cache[6] = ($event) => $setup.bindAnalyticsTap("messages-close-menu", $setup.closeMenu, "关闭菜单"))
        }, [
          vue.createElementVNode("view", {
            class: "sheet",
            onClick: _cache[5] || (_cache[5] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode(
              "text",
              { class: "sheet-title" },
              vue.toDisplayString($setup.t("messages.chooseAction")),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", {
              class: "sheet-item",
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.bindAnalyticsTap("messages-create-companion", $setup.goCreateCompanion, "创建伴侣"))
            }, [
              vue.createElementVNode(
                "text",
                null,
                "➕ " + vue.toDisplayString($setup.t("home.create")),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "text-muted" },
                vue.toDisplayString($setup.t("messages.createCompanionHint")),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", {
              class: "sheet-item",
              onClick: _cache[4] || (_cache[4] = ($event) => $setup.bindAnalyticsTap("messages-my-companions", $setup.goMyCompanions, "我的伴侣"))
            }, [
              vue.createElementVNode(
                "text",
                null,
                "👥 " + vue.toDisplayString($setup.t("messages.viewAllCompanions")),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "text-muted" },
                vue.toDisplayString($setup.t("messages.allCompanionsDesc")),
                1
                /* TEXT */
              )
            ])
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      _: 1
      /* STABLE */
    }, 8, ["title"]);
  }
  const PagesMessagesIndex = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-aedce2fc"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/messages/index.vue"]]);
  function formatAffectionDisplay(value) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n))
      return "0";
    const rounded = Math.round(n * 1e3) / 1e3;
    if (Number.isInteger(rounded))
      return String(rounded);
    return rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }
  const personalityTagTranslations = {
    zh: {
      gentle: "温柔",
      cute: "可爱",
      mature: "成熟",
      scheming: "腹黑",
      lively: "活泼",
      sunny: "阳光",
      quiet: "安静",
      straightforward: "直率",
      warm: "温暖",
      calm: "冷静",
      cool: "酷",
      artsy: "文艺",
      "fun-loving": "爱玩",
      relaxed: "放松",
      outgoing: "外向",
      passionate: "热情",
      elegant: "优雅",
      creative: "有创意",
      intense: "热烈",
      polite: "有礼貌",
      "easy-going": "随和",
      tsundere: "傲娇",
      yandere: "病娇",
      oneesan: "御姐",
      aloof: "冷淡"
    },
    en: {
      gentle: "gentle",
      cute: "cute",
      mature: "mature",
      scheming: "scheming",
      lively: "lively",
      sunny: "sunny",
      quiet: "quiet",
      straightforward: "straightforward",
      warm: "warm",
      calm: "calm",
      cool: "cool",
      artsy: "artsy",
      "fun-loving": "fun-loving",
      relaxed: "relaxed",
      outgoing: "outgoing",
      passionate: "passionate",
      elegant: "elegant",
      creative: "creative",
      intense: "intense",
      polite: "polite",
      "easy-going": "easy-going",
      tsundere: "tsundere",
      yandere: "yandere",
      oneesan: "onee-san",
      aloof: "aloof"
    },
    ja: {
      gentle: "優しい",
      cute: "かわいい",
      mature: "成熟した",
      scheming: "腹黒い",
      lively: "活発",
      sunny: "明るい",
      quiet: "静か",
      straightforward: "率直",
      warm: "温かい",
      calm: "冷静",
      cool: "クール",
      artsy: "アーティスティック",
      "fun-loving": "楽しいのが好き",
      relaxed: "リラックス",
      outgoing: "外向的",
      passionate: "情熱的",
      elegant: "優雅",
      creative: "創造的",
      intense: "激しい",
      polite: "丁寧",
      "easy-going": "気さく",
      tsundere: "ツンデレ",
      yandere: "ヤンデレ",
      oneesan: "お姉さん系",
      aloof: "クールで淡白"
    },
    ko: {
      gentle: "다정한",
      cute: "귀여운",
      mature: "성숙한",
      scheming: "속이 검은",
      lively: "활발한",
      sunny: "밝은",
      quiet: "조용한",
      straightforward: "솔직한",
      warm: "따뜻한",
      calm: "침착한",
      cool: "쿨한",
      artsy: "예술적인",
      "fun-loving": "즐거움을 사랑하는",
      relaxed: "여유로운",
      outgoing: "외향적인",
      passionate: "열정적인",
      elegant: "우아한",
      creative: "창의적인",
      intense: "강렬한",
      polite: "예의바른",
      "easy-going": "느긋한",
      tsundere: "츤데레",
      yandere: "얀데레",
      oneesan: "누나 스타일",
      aloof: "담담한"
    },
    pt: {
      gentle: "gentil",
      cute: "fofo",
      mature: "maduro",
      scheming: "calculista",
      lively: "animado",
      sunny: "ensolarado",
      quiet: "quieto",
      straightforward: "direto",
      warm: "caloroso",
      calm: "calmo",
      cool: "legal",
      artsy: "artístico",
      "fun-loving": "divertido",
      relaxed: "relaxado",
      outgoing: "extrovertido",
      passionate: "apaixonado",
      elegant: "elegante",
      creative: "criativo",
      intense: "intenso",
      polite: "educado",
      "easy-going": "descontraído",
      tsundere: "tsundere",
      yandere: "yandere",
      oneesan: "estilo onee-san",
      aloof: "distante"
    },
    es: {
      gentle: "gentil",
      cute: "lindo",
      mature: "maduro",
      scheming: "calculador",
      lively: "animado",
      sunny: "soleado",
      quiet: "tranquilo",
      straightforward: "directo",
      warm: "cálido",
      calm: "calmado",
      cool: "genial",
      artsy: "artístico",
      "fun-loving": "divertido",
      relaxed: "relajado",
      outgoing: "extrovertido",
      passionate: "apasionado",
      elegant: "elegante",
      creative: "creativo",
      intense: "intenso",
      polite: "educado",
      "easy-going": "despreocupado",
      tsundere: "tsundere",
      yandere: "yandere",
      oneesan: "estilo onee-san",
      aloof: "distante"
    },
    id: {
      gentle: "lembut",
      cute: "lucu",
      mature: "dewasa",
      scheming: "licik",
      lively: "lincah",
      sunny: "ceria",
      quiet: "tenang",
      straightforward: "blak-blakan",
      warm: "hangat",
      calm: "tenang",
      cool: "keren",
      artsy: "artistik",
      "fun-loving": "suka bersenang-senang",
      relaxed: "santai",
      outgoing: "ekstrovert",
      passionate: "penuh gairah",
      elegant: "anggun",
      creative: "kreatif",
      intense: "intens",
      polite: "sopan",
      "easy-going": "santai",
      tsundere: "tsundere",
      yandere: "yandere",
      oneesan: "gaya onee-san",
      aloof: "dingin"
    }
  };
  const reverseMap = {};
  Object.values(personalityTagTranslations).forEach((langMap) => {
    Object.entries(langMap).forEach(([key, value]) => {
      reverseMap[value.toLowerCase()] = key;
    });
  });
  function translatePersonalityTag(tag, lang) {
    var _a2;
    const normalized = tag.trim().toLowerCase();
    const key = reverseMap[normalized];
    if (!key)
      return tag.trim();
    return ((_a2 = personalityTagTranslations[lang]) == null ? void 0 : _a2[key]) || tag.trim();
  }
  const TAB_PATH$1 = "/pages/discover/index";
  const POSTS_PAGE_SIZE = 20;
  const IMAGE_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI5IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5pWw5o2u5aSE55CG6ZSZ6K+vPC90ZXh0Pjwvc3ZnPg==";
  const _sfc_main$5 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const tabScroll = useTabScrollStore();
      let discoverLastScrollTop = 0;
      const discoverScrollTop = vue.ref(0);
      const POST_CATEGORIES = [
        { key: "", label: "discover.catAll" },
        { key: "dating", label: "discover.catDating" },
        { key: "psychology", label: "discover.catPsychology" },
        { key: "tips", label: "discover.catTips" },
        { key: "story", label: "discover.catStory" },
        { key: "offtopic", label: "discover.catOfftopic" }
      ];
      const { t, te, locale } = useI18n();
      const chat2 = useChatStore();
      const { format: formatRelativeTime } = useRelativeTime("discover");
      requireAuth();
      function loadSavedTab() {
        const saved = getItem("discover_tab");
        return saved === "companions" ? "companions" : "posts";
      }
      const activeTab = vue.ref(loadSavedTab());
      const posts = vue.ref([]);
      const loading = vue.ref(true);
      const loadingMore = vue.ref(false);
      const hasMorePosts = vue.ref(true);
      const postsOffsetRef = vue.ref(0);
      const loadingMoreGuard = vue.ref(false);
      const hasMoreGuard = vue.ref(true);
      const searchQuery = vue.ref("");
      const searchResults = vue.ref([]);
      const searchLoading = vue.ref(false);
      let searchTimer = null;
      const activeCategory = vue.ref("");
      const showCreate = vue.ref(false);
      const newTitle = vue.ref("");
      const newContent = vue.ref("");
      const newCategory = vue.ref("");
      const newImages = vue.ref([]);
      const uploadingImages = vue.ref(false);
      const creating = vue.ref(false);
      const initialCachedCompanions = getCachedCompanions() ?? [];
      const companions = vue.ref(
        initialCachedCompanions.length ? sortCompanionsByUserLang(initialCachedCompanions, locale.value || "zh") : []
      );
      const companionFilter = vue.ref("all");
      const companionsLoading = vue.ref(!initialCachedCompanions.length);
      const refreshing = vue.ref(false);
      const displayPosts = vue.computed(
        () => searchQuery.value.trim() ? searchResults.value : posts.value
      );
      const isSearchLoading = vue.computed(() => Boolean(searchQuery.value.trim()) && searchLoading.value);
      const uiLang = vue.computed(() => uiLangCode(locale.value));
      const displayCompanions = vue.computed(() => {
        if (companionFilter.value === "recommended") {
          return [...companions.value].sort((a, b) => {
            const ma = (a.profile.language || "").split("-")[0] === uiLang.value ? 1 : 0;
            const mb = (b.profile.language || "").split("-")[0] === uiLang.value ? 1 : 0;
            if (mb !== ma)
              return mb - ma;
            return (b.state.turns || 0) - (a.state.turns || 0);
          }).slice(0, 10);
        }
        return companions.value;
      });
      function categoryLabel(key) {
        if (!key)
          return "";
        const i18nKey = `discover.cat_${key}`;
        if (typeof te === "function" && !te(i18nKey))
          return String(key);
        const label = t(i18nKey);
        return label === i18nKey ? String(key) : label;
      }
      function splitPersonalities(personality) {
        if (!personality)
          return [];
        return personality.split(/[、,，]/).filter(Boolean).slice(0, 3);
      }
      async function fetchPosts(reset = true) {
        if (!reset) {
          if (loadingMoreGuard.value || !hasMoreGuard.value)
            return;
          loadingMoreGuard.value = true;
          loadingMore.value = true;
        } else {
          loading.value = true;
          postsOffsetRef.value = 0;
          hasMoreGuard.value = true;
          hasMorePosts.value = true;
        }
        try {
          const offset = reset ? 0 : postsOffsetRef.value;
          const params = new URLSearchParams({
            limit: String(POSTS_PAGE_SIZE),
            offset: String(offset)
          });
          if (activeCategory.value)
            params.set("category", activeCategory.value);
          const data = await apiFetch(
            `/api/posts?${params}`,
            { header: deviceHeaders() }
          );
          const batch = data.posts || [];
          const total = typeof data.total === "number" ? data.total : 0;
          if (reset) {
            posts.value = batch;
            postsOffsetRef.value = batch.length;
            const more = batch.length < total;
            hasMoreGuard.value = more;
            hasMorePosts.value = more;
          } else {
            const ids = new Set(posts.value.map((p) => p.id));
            posts.value = [...posts.value, ...batch.filter((p) => !ids.has(p.id))];
            const nextOffset = offset + batch.length;
            postsOffsetRef.value = nextOffset;
            const more = nextOffset < total && batch.length > 0;
            hasMoreGuard.value = more;
            hasMorePosts.value = more;
          }
        } catch (err) {
          formatAppLog("error", "at pages/discover/index.vue:181", "加载帖子失败:", err);
        } finally {
          loading.value = false;
          loadingMoreGuard.value = false;
          loadingMore.value = false;
        }
      }
      async function loadCompanions() {
        const cached = getCachedCompanions();
        if ((cached == null ? void 0 : cached.length) && !companions.value.length) {
          companions.value = sortCompanionsByUserLang(cached, locale.value || "zh");
        }
        if (!companions.value.length) {
          companionsLoading.value = true;
        }
        try {
          const data = await fetchCompanions();
          const userLang = locale.value || "zh";
          companions.value = sortCompanionsByUserLang(data || [], userLang);
        } catch (err) {
          formatAppLog("error", "at pages/discover/index.vue:205", "加载智能体列表失败:", err);
        } finally {
          companionsLoading.value = false;
        }
      }
      function onScrollToLower() {
        if (activeTab.value !== "posts" || searchQuery.value.trim())
          return;
        fetchPosts(false);
      }
      async function onRefresh() {
        if (refreshing.value)
          return;
        refreshing.value = true;
        try {
          await Promise.all([
            activeTab.value === "posts" ? fetchPosts(true) : Promise.resolve(),
            loadCompanions()
          ]);
        } finally {
          refreshing.value = false;
        }
      }
      async function handleCreatePost() {
        const title = newTitle.value.trim();
        const content = newContent.value.trim();
        if (!title || !content)
          return;
        creating.value = true;
        try {
          await apiFetch("/api/posts", {
            method: "POST",
            header: deviceHeaders(),
            data: {
              title,
              content,
              category: newCategory.value,
              images: newImages.value
            }
          });
          newTitle.value = "";
          newContent.value = "";
          newCategory.value = "";
          newImages.value = [];
          showCreate.value = false;
          fetchPosts(true);
        } catch {
        } finally {
          creating.value = false;
        }
      }
      async function handleAddImages() {
        if (newImages.value.length >= 9) {
          showToast(t("discover.maxImages") || "最多上传 9 张图片");
          return;
        }
        uploadingImages.value = true;
        try {
          const urls = await chooseAndUploadImages(9, newImages.value.length);
          newImages.value = [...newImages.value, ...urls];
        } catch (err) {
          formatAppLog("error", "at pages/discover/index.vue:270", "图片上传失败:", err);
          showToast(t("discover.imageUploadFailed") || "图片上传失败");
        } finally {
          uploadingImages.value = false;
        }
      }
      function handleRemoveImage(index) {
        newImages.value = newImages.value.filter((_, i) => i !== index);
      }
      function closeCreateModal() {
        showCreate.value = false;
        newImages.value = [];
      }
      async function handleLike(postId) {
        try {
          const data = await apiFetch(
            `/api/posts/${postId}/like`,
            { method: "POST", header: deviceHeaders() }
          );
          if (data.ok) {
            const patch = (list) => list.map(
              (p) => p.id === postId ? { ...p, liked: !!data.liked, likes_count: data.likes_count ?? p.likes_count } : p
            );
            posts.value = patch(posts.value);
            searchResults.value = patch(searchResults.value);
          }
        } catch (e) {
          formatAppLog("error", "at pages/discover/index.vue:303", "点赞失败:", e);
        }
      }
      function openPost(id2, opts = {}) {
        const focus = opts.focus ? "&focus=1" : "";
        uni.navigateTo({ url: `/pages-sub/post/index?id=${id2}${focus}` });
      }
      function openPostForComment(id2) {
        openPost(id2, { focus: true });
      }
      function openCompanionProfile(id2) {
        uni.navigateTo({ url: `/pages-sub/companion/index?id=${id2}` });
      }
      function openCreateModal() {
        showCreate.value = true;
      }
      function switchToPostsTab() {
        activeTab.value = "posts";
      }
      function switchToCompanionsTab() {
        activeTab.value = "companions";
      }
      const onPostLikeTap = bindAnalyticsTapArg(
        "discover-post-like",
        handleLike,
        "发现页帖子点赞"
      );
      const onPostCommentTap = bindAnalyticsTapArg(
        "discover-post-comment",
        openPostForComment,
        "发现页帖子评论"
      );
      const onPostDetailTap = bindAnalyticsTapArg(
        "discover-view-detail",
        openPost,
        "发现页查看详情"
      );
      function onDiscoverScroll(e) {
        discoverLastScrollTop = e.detail.scrollTop;
        tabScroll.setScroll(TAB_PATH$1, e.detail.scrollTop);
      }
      function scrollDiscoverToTop() {
        discoverScrollTop.value = discoverLastScrollTop;
        void vue.nextTick(() => {
          discoverScrollTop.value = 0;
        });
      }
      vue.watch(
        () => tabScroll.scrollToTopTick[TAB_PATH$1],
        () => {
          scrollDiscoverToTop();
        }
      );
      function openChat(id2) {
        chat2.connect(id2);
        uni.navigateTo({ url: `/pages/chat/index?id=${id2}` });
      }
      function onImageError(e) {
        const target = e.target || null;
        if (target)
          target.src = IMAGE_FALLBACK;
      }
      vue.watch(activeTab, (tab) => {
        setItem("discover_tab", tab);
        if (tab === "posts") {
          fetchPosts(true);
        } else {
          loadCompanions();
        }
      });
      vue.watch(activeCategory, () => {
        searchQuery.value = "";
        if (activeTab.value === "posts") {
          fetchPosts(true);
        }
      });
      vue.watch(searchQuery, (query) => {
        if (searchTimer)
          clearTimeout(searchTimer);
        const trimmed = query.trim();
        if (!trimmed) {
          searchResults.value = [];
          searchLoading.value = false;
          return;
        }
        searchTimer = setTimeout(async () => {
          searchLoading.value = true;
          try {
            const data = await apiFetch(
              `/api/posts/search?q=${encodeURIComponent(trimmed)}&limit=50`,
              { header: deviceHeaders() }
            );
            searchResults.value = data.posts || [];
          } catch (err) {
            formatAppLog("error", "at pages/discover/index.vue:412", "搜索失败:", err);
          } finally {
            searchLoading.value = false;
          }
        }, 400);
      });
      vue.onMounted(() => {
        if (activeTab.value === "posts") {
          fetchPosts(true);
        } else {
          loadCompanions();
        }
      });
      const __returned__ = { TAB_PATH: TAB_PATH$1, tabScroll, get discoverLastScrollTop() {
        return discoverLastScrollTop;
      }, set discoverLastScrollTop(v) {
        discoverLastScrollTop = v;
      }, discoverScrollTop, POST_CATEGORIES, POSTS_PAGE_SIZE, IMAGE_FALLBACK, t, te, locale, chat: chat2, formatRelativeTime, loadSavedTab, activeTab, posts, loading, loadingMore, hasMorePosts, postsOffsetRef, loadingMoreGuard, hasMoreGuard, searchQuery, searchResults, searchLoading, get searchTimer() {
        return searchTimer;
      }, set searchTimer(v) {
        searchTimer = v;
      }, activeCategory, showCreate, newTitle, newContent, newCategory, newImages, uploadingImages, creating, initialCachedCompanions, companions, companionFilter, companionsLoading, refreshing, displayPosts, isSearchLoading, uiLang, displayCompanions, categoryLabel, splitPersonalities, fetchPosts, loadCompanions, onScrollToLower, onRefresh, handleCreatePost, handleAddImages, handleRemoveImage, closeCreateModal, handleLike, openPost, openPostForComment, openCompanionProfile, openCreateModal, switchToPostsTab, switchToCompanionsTab, onPostLikeTap, onPostCommentTap, onPostDetailTap, onDiscoverScroll, scrollDiscoverToTop, openChat, onImageError, ref: vue.ref, computed: vue.computed, watch: vue.watch, onMounted: vue.onMounted, nextTick: vue.nextTick, get useI18n() {
        return useI18n;
      }, AppPageShell, AppAvatarImage, AppListSkeleton, get requireAuth() {
        return requireAuth;
      }, get useRelativeTime() {
        return useRelativeTime;
      }, get useChatStore() {
        return useChatStore;
      }, get showToast() {
        return showToast;
      }, get apiFetch() {
        return apiFetch;
      }, get fetchCompanions() {
        return fetchCompanions;
      }, get getCachedCompanions() {
        return getCachedCompanions;
      }, get sortCompanionsByUserLang() {
        return sortCompanionsByUserLang;
      }, get formatAffectionDisplay() {
        return formatAffectionDisplay;
      }, get formatCompanionMeta() {
        return formatCompanionMeta;
      }, get formatCompanionName() {
        return formatCompanionName;
      }, get uiLangCode() {
        return uiLangCode;
      }, get translatePersonalityTag() {
        return translatePersonalityTag;
      }, get normalizeMediaUrl() {
        return normalizeMediaUrl;
      }, get deviceHeaders() {
        return deviceHeaders;
      }, get chooseAndUploadImages() {
        return chooseAndUploadImages;
      }, get getItem() {
        return getItem;
      }, get setItem() {
        return setItem;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      }, get bindAnalyticsTapArg() {
        return bindAnalyticsTapArg;
      }, get useTabScrollStore() {
        return useTabScrollStore;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createBlock($setup["AppPageShell"], {
      "show-header": false,
      "show-tab-bar": ""
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode("view", { class: "discover-page" }, [
          vue.createCommentVNode(" Header "),
          vue.createElementVNode("view", { class: "discover-header" }, [
            vue.createElementVNode("view", { class: "flex-row justify-between items-center header-top" }, [
              vue.createElementVNode(
                "text",
                { class: "page-title" },
                vue.toDisplayString($setup.t("discover.title")),
                1
                /* TEXT */
              ),
              $setup.activeTab === "posts" ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "btn-new-post",
                onClick: _cache[0] || (_cache[0] = ($event) => $setup.bindAnalyticsTap("discover-create-post", $setup.openCreateModal, "发帖"))
              }, [
                vue.createElementVNode(
                  "text",
                  null,
                  "＋ " + vue.toDisplayString($setup.t("discover.newPost")),
                  1
                  /* TEXT */
                )
              ])) : vue.createCommentVNode("v-if", true)
            ]),
            vue.createCommentVNode(" Tab switch: posts / companions "),
            vue.createElementVNode("view", { class: "tab-switch" }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["tab-switch-item", { active: $setup.activeTab === "posts" }]),
                  onClick: _cache[1] || (_cache[1] = ($event) => $setup.bindAnalyticsTap("discover-tab-posts", $setup.switchToPostsTab, "帖子 Tab"))
                },
                [
                  vue.createElementVNode(
                    "text",
                    null,
                    "💬 " + vue.toDisplayString($setup.t("discover.tabPosts")),
                    1
                    /* TEXT */
                  )
                ],
                2
                /* CLASS */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["tab-switch-item", { active: $setup.activeTab === "companions" }]),
                  onClick: _cache[2] || (_cache[2] = ($event) => $setup.bindAnalyticsTap("discover-tab-companions", $setup.switchToCompanionsTab, "伴侣 Tab"))
                },
                [
                  vue.createElementVNode(
                    "text",
                    null,
                    "🤖 " + vue.toDisplayString($setup.t("discover.tabCompanions")),
                    1
                    /* TEXT */
                  )
                ],
                2
                /* CLASS */
              )
            ]),
            $setup.activeTab === "posts" ? (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 0 },
              [
                vue.createElementVNode("view", { class: "search-wrap flex-row items-center gap-sm" }, [
                  vue.createElementVNode("text", { class: "search-icon" }, "🔍"),
                  vue.withDirectives(vue.createElementVNode("input", {
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.searchQuery = $event),
                    class: "search-input",
                    placeholder: $setup.t("discover.searchPlaceholder")
                  }, null, 8, ["placeholder"]), [
                    [vue.vModelText, $setup.searchQuery]
                  ]),
                  $setup.searchQuery ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    class: "search-clear",
                    onClick: _cache[4] || (_cache[4] = ($event) => $setup.searchQuery = "")
                  }, "✕")) : vue.createCommentVNode("v-if", true)
                ]),
                vue.createElementVNode("scroll-view", {
                  "scroll-x": "",
                  class: "category-scroll",
                  "show-scrollbar": "false"
                }, [
                  vue.createElementVNode("view", { class: "category-row" }, [
                    (vue.openBlock(), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.POST_CATEGORIES, (cat) => {
                        return vue.createElementVNode("view", {
                          key: cat.key || "all",
                          class: vue.normalizeClass(["category-chip", { active: $setup.activeCategory === cat.key }]),
                          onClick: ($event) => $setup.activeCategory = cat.key
                        }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString($setup.t(cat.label)),
                            1
                            /* TEXT */
                          )
                        ], 10, ["onClick"]);
                      }),
                      64
                      /* STABLE_FRAGMENT */
                    ))
                  ])
                ])
              ],
              64
              /* STABLE_FRAGMENT */
            )) : (vue.openBlock(), vue.createElementBlock("scroll-view", {
              key: 1,
              "scroll-x": "",
              class: "category-scroll",
              "show-scrollbar": "false"
            }, [
              vue.createElementVNode("view", { class: "category-row" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["category-chip", { active: $setup.companionFilter === "all" }]),
                    onClick: _cache[5] || (_cache[5] = ($event) => $setup.companionFilter = "all")
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString($setup.t("discover.filterAll")),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["category-chip", { active: $setup.companionFilter === "recommended" }]),
                    onClick: _cache[6] || (_cache[6] = ($event) => $setup.companionFilter = "recommended")
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      null,
                      "✨ " + vue.toDisplayString($setup.t("discover.filterRecommended")),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                )
              ])
            ]))
          ]),
          vue.createCommentVNode(" Scrollable content "),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "discover-body",
            "scroll-top": $setup.discoverScrollTop,
            "refresher-enabled": true,
            "refresher-triggered": $setup.refreshing,
            "refresher-background": "var(--bg)",
            onScroll: $setup.onDiscoverScroll,
            onRefresherrefresh: $setup.onRefresh,
            onScrolltolower: $setup.onScrollToLower,
            "lower-threshold": 240
          }, [
            vue.createCommentVNode(" Posts tab "),
            $setup.activeTab === "posts" ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "content px-md py-sm"
            }, [
              ($setup.isSearchLoading || $setup.loading) && !$setup.displayPosts.length ? (vue.openBlock(), vue.createBlock($setup["AppListSkeleton"], {
                key: 0,
                rows: 4
              })) : !$setup.displayPosts.length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "empty"
              }, [
                vue.createElementVNode("text", { class: "empty-icon" }, "💬"),
                vue.createElementVNode(
                  "text",
                  { class: "text-muted" },
                  vue.toDisplayString($setup.searchQuery.trim() ? $setup.t("discover.noSearchResults") : $setup.t("discover.noPosts")),
                  1
                  /* TEXT */
                )
              ])) : (vue.openBlock(), vue.createElementBlock("view", {
                key: 2,
                class: "post-list"
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.displayPosts, (post) => {
                    var _a2;
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: post.id,
                      class: "card post-card"
                    }, [
                      vue.createElementVNode("view", { class: "flex-row items-center gap-sm post-author" }, [
                        vue.createVNode($setup["AppAvatarImage"], {
                          src: post.avatar,
                          seed: String(post.user_id || "user"),
                          size: "sm"
                        }, null, 8, ["src", "seed"]),
                        vue.createElementVNode("view", { class: "flex-1 min-w-0" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "author-name" },
                            vue.toDisplayString(post.user_name),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "text-muted author-time" },
                            vue.toDisplayString($setup.formatRelativeTime(post.created_at)),
                            1
                            /* TEXT */
                          )
                        ])
                      ]),
                      vue.createElementVNode("view", {
                        class: "post-body",
                        onClick: ($event) => $setup.openPost(post.id)
                      }, [
                        post.category ? (vue.openBlock(), vue.createElementBlock(
                          "text",
                          {
                            key: 0,
                            class: "post-cat"
                          },
                          vue.toDisplayString($setup.categoryLabel(post.category)),
                          1
                          /* TEXT */
                        )) : vue.createCommentVNode("v-if", true),
                        vue.createElementVNode(
                          "text",
                          { class: "post-title" },
                          vue.toDisplayString(post.title),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "post-content text-muted" },
                          vue.toDisplayString(post.content),
                          1
                          /* TEXT */
                        )
                      ], 8, ["onClick"]),
                      ((_a2 = post.images) == null ? void 0 : _a2.length) ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "post-images"
                      }, [
                        vue.createElementVNode("scroll-view", {
                          "scroll-x": "",
                          "show-scrollbar": "false"
                        }, [
                          vue.createElementVNode("view", { class: "image-row" }, [
                            (vue.openBlock(true), vue.createElementBlock(
                              vue.Fragment,
                              null,
                              vue.renderList(post.images.slice(0, 3), (img, idx) => {
                                return vue.openBlock(), vue.createElementBlock("image", {
                                  key: idx,
                                  class: "post-thumb",
                                  src: $setup.normalizeMediaUrl(img) || $setup.IMAGE_FALLBACK,
                                  mode: "aspectFill",
                                  onError: $setup.onImageError
                                }, null, 40, ["src"]);
                              }),
                              128
                              /* KEYED_FRAGMENT */
                            ))
                          ])
                        ])
                      ])) : vue.createCommentVNode("v-if", true),
                      vue.createElementVNode("view", { class: "post-actions flex-row justify-between items-center" }, [
                        vue.createElementVNode("view", { class: "flex-row gap-sm action-group" }, [
                          vue.createElementVNode("view", {
                            class: "action-btn",
                            onClick: vue.withModifiers(($event) => $setup.onPostLikeTap(post.id), ["stop"])
                          }, [
                            vue.createElementVNode(
                              "text",
                              {
                                class: vue.normalizeClass(post.liked ? "liked" : "text-muted")
                              },
                              vue.toDisplayString(post.liked ? "♥" : "♡") + " " + vue.toDisplayString(post.likes_count || 0),
                              3
                              /* TEXT, CLASS */
                            )
                          ], 8, ["onClick"]),
                          vue.createElementVNode("view", {
                            class: "action-btn",
                            onClick: vue.withModifiers(($event) => $setup.onPostCommentTap(post.id), ["stop"])
                          }, [
                            vue.createElementVNode(
                              "text",
                              { class: "text-muted" },
                              "💬 " + vue.toDisplayString(post.comments_count || 0),
                              1
                              /* TEXT */
                            )
                          ], 8, ["onClick"])
                        ]),
                        vue.createElementVNode("view", {
                          class: "detail-link",
                          onClick: ($event) => $setup.onPostDetailTap(post.id)
                        }, [
                          vue.createElementVNode(
                            "text",
                            { class: "text-primary" },
                            vue.toDisplayString($setup.t("discover.viewDetail")) + " ›",
                            1
                            /* TEXT */
                          )
                        ], 8, ["onClick"])
                      ])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])),
              !$setup.searchQuery.trim() && $setup.loadingMore ? (vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: 3,
                  class: "footer-hint text-muted"
                },
                vue.toDisplayString($setup.t("common.loading")),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true),
              !$setup.searchQuery.trim() && !$setup.loading && !$setup.hasMorePosts && $setup.displayPosts.length ? (vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: 4,
                  class: "footer-hint text-muted dim"
                },
                vue.toDisplayString($setup.t("discover.noMorePosts")),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true)
            ])) : (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 1 },
              [
                vue.createCommentVNode(" Companions tab "),
                vue.createElementVNode("view", { class: "content px-md py-sm" }, [
                  $setup.companionsLoading && !$setup.displayCompanions.length ? (vue.openBlock(), vue.createBlock($setup["AppListSkeleton"], {
                    key: 0,
                    rows: 4
                  })) : !$setup.displayCompanions.length ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "empty"
                  }, [
                    vue.createElementVNode("text", { class: "empty-icon" }, "🤖"),
                    vue.createElementVNode(
                      "text",
                      { class: "text-muted" },
                      vue.toDisplayString($setup.t("discover.noCompanions")),
                      1
                      /* TEXT */
                    )
                  ])) : (vue.openBlock(), vue.createElementBlock("view", {
                    key: 2,
                    class: "companion-list"
                  }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.displayCompanions, (c) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          key: c.profile.id,
                          class: "card companion-card flex-row items-center gap-sm",
                          onClick: ($event) => $setup.openCompanionProfile(c.profile.id)
                        }, [
                          vue.createVNode($setup["AppAvatarImage"], {
                            src: c.avatar,
                            seed: c.profile.id,
                            generating: c.avatar_generating
                          }, null, 8, ["src", "seed", "generating"]),
                          vue.createElementVNode("view", { class: "flex-1 min-w-0" }, [
                            vue.createElementVNode("view", { class: "companion-name-block min-w-0" }, [
                              vue.createElementVNode(
                                "text",
                                { class: "companion-name" },
                                vue.toDisplayString($setup.formatCompanionName(c.profile.name, $setup.t("home.defaultCompanionName"))),
                                1
                                /* TEXT */
                              ),
                              vue.createElementVNode(
                                "text",
                                { class: "text-muted companion-meta" },
                                vue.toDisplayString($setup.formatCompanionMeta(
                                  { age: c.profile.age, gender: c.profile.gender },
                                  $setup.t,
                                  { includeCity: false }
                                )),
                                1
                                /* TEXT */
                              )
                            ]),
                            vue.createElementVNode(
                              "text",
                              { class: "text-muted companion-city" },
                              vue.toDisplayString(c.profile.city),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode("view", { class: "tag-row" }, [
                              (vue.openBlock(true), vue.createElementBlock(
                                vue.Fragment,
                                null,
                                vue.renderList($setup.splitPersonalities(c.profile.personality), (p) => {
                                  return vue.openBlock(), vue.createElementBlock(
                                    "text",
                                    {
                                      key: p,
                                      class: "tag"
                                    },
                                    vue.toDisplayString($setup.translatePersonalityTag(p, $setup.uiLang)),
                                    1
                                    /* TEXT */
                                  );
                                }),
                                128
                                /* KEYED_FRAGMENT */
                              )),
                              c.profile.mbti ? (vue.openBlock(), vue.createElementBlock(
                                "text",
                                {
                                  key: 0,
                                  class: "tag mbti"
                                },
                                vue.toDisplayString(c.profile.mbti),
                                1
                                /* TEXT */
                              )) : vue.createCommentVNode("v-if", true)
                            ])
                          ]),
                          vue.createElementVNode("view", { class: "companion-side flex-col items-center gap-sm" }, [
                            vue.createElementVNode("view", { class: "affection-badge" }, [
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString($setup.formatAffectionDisplay(c.state.affection)),
                                1
                                /* TEXT */
                              )
                            ]),
                            vue.createElementVNode("view", {
                              class: "chat-btn",
                              onClick: vue.withModifiers(($event) => $setup.openChat(c.profile.id), ["stop"])
                            }, [
                              vue.createElementVNode("text", null, "💬")
                            ], 8, ["onClick"])
                          ])
                        ], 8, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ]))
                ])
              ],
              2112
              /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
            ))
          ], 40, ["scroll-top", "refresher-triggered"])
        ]),
        vue.createCommentVNode(" Create post modal "),
        $setup.showCreate ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "modal-mask",
          onClick: $setup.closeCreateModal
        }, [
          vue.createElementVNode("view", {
            class: "modal-sheet",
            onClick: _cache[12] || (_cache[12] = vue.withModifiers(() => {
            }, ["stop"]))
          }, [
            vue.createElementVNode("view", { class: "modal-header flex-row justify-between items-center" }, [
              vue.createElementVNode(
                "text",
                { class: "modal-title" },
                vue.toDisplayString($setup.t("discover.createPost")),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", {
                class: "modal-close text-muted",
                onClick: _cache[7] || (_cache[7] = ($event) => $setup.bindAnalyticsTap("discover-close-create", $setup.closeCreateModal, "关闭发帖弹窗"))
              }, "✕")
            ]),
            vue.createElementVNode("scroll-view", {
              "scroll-y": "",
              class: "modal-body"
            }, [
              vue.createElementVNode("view", { class: "form-group" }, [
                vue.createElementVNode(
                  "text",
                  { class: "form-label" },
                  vue.toDisplayString($setup.t("discover.postCategory")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "chip-wrap" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList($setup.POST_CATEGORIES.filter((c) => c.key), (cat) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: cat.key,
                        class: vue.normalizeClass(["category-chip", { active: $setup.newCategory === cat.key }]),
                        onClick: ($event) => $setup.newCategory = cat.key
                      }, [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString($setup.t(cat.label)),
                          1
                          /* TEXT */
                        )
                      ], 10, ["onClick"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ]),
              vue.createElementVNode("view", { class: "form-group" }, [
                vue.createElementVNode(
                  "text",
                  { class: "form-label" },
                  vue.toDisplayString($setup.t("discover.postTitle")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("input", {
                  value: $setup.newTitle,
                  class: "input-field",
                  placeholder: $setup.t("discover.titlePlaceholder"),
                  maxlength: "200",
                  onInput: _cache[8] || (_cache[8] = ($event) => $setup.newTitle = $event.detail.value)
                }, null, 40, ["value", "placeholder"])
              ]),
              vue.createElementVNode("view", { class: "form-group" }, [
                vue.createElementVNode(
                  "text",
                  { class: "form-label" },
                  vue.toDisplayString($setup.t("discover.postContent")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("textarea", {
                  value: $setup.newContent,
                  class: "input-field textarea",
                  placeholder: $setup.t("discover.contentPlaceholder"),
                  maxlength: "5000",
                  onInput: _cache[9] || (_cache[9] = ($event) => $setup.newContent = $event.detail.value)
                }, null, 40, ["value", "placeholder"]),
                vue.createElementVNode(
                  "text",
                  { class: "char-count text-muted" },
                  vue.toDisplayString($setup.newContent.length) + "/5000",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "form-group" }, [
                vue.createElementVNode("text", { class: "form-label" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.t("discover.postImages")) + " ",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "text-muted" },
                    "(" + vue.toDisplayString($setup.newImages.length) + "/9)",
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "upload-grid" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList($setup.newImages, (img, idx) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: idx,
                        class: "upload-thumb"
                      }, [
                        vue.createElementVNode("image", {
                          class: "upload-img",
                          src: $setup.normalizeMediaUrl(img) || $setup.IMAGE_FALLBACK,
                          mode: "aspectFill",
                          onError: $setup.onImageError
                        }, null, 40, ["src"]),
                        vue.createElementVNode("view", {
                          class: "remove-btn",
                          onClick: ($event) => $setup.handleRemoveImage(idx)
                        }, "✕", 8, ["onClick"])
                      ]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  )),
                  $setup.newImages.length < 9 ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "upload-add",
                    onClick: _cache[10] || (_cache[10] = ($event) => !$setup.uploadingImages && $setup.handleAddImages())
                  }, [
                    $setup.uploadingImages ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "text-muted"
                    }, "…")) : (vue.openBlock(), vue.createElementBlock(
                      vue.Fragment,
                      { key: 1 },
                      [
                        vue.createElementVNode("text", { class: "add-icon" }, "🖼"),
                        vue.createElementVNode(
                          "text",
                          { class: "text-muted add-label" },
                          vue.toDisplayString($setup.t("discover.addImage")),
                          1
                          /* TEXT */
                        )
                      ],
                      64
                      /* STABLE_FRAGMENT */
                    ))
                  ])) : vue.createCommentVNode("v-if", true)
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "modal-footer" }, [
              vue.createElementVNode("button", {
                class: "btn-primary w-full publish-btn",
                disabled: $setup.creating || !$setup.newTitle.trim() || !$setup.newContent.trim(),
                onClick: _cache[11] || (_cache[11] = ($event) => $setup.bindAnalyticsTap("discover-publish-post", $setup.handleCreatePost, "发布帖子"))
              }, vue.toDisplayString($setup.creating ? $setup.t("discover.publishing") : `📤 ${$setup.t("discover.publish")}`), 9, ["disabled"])
            ])
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      _: 1
      /* STABLE */
    });
  }
  const PagesDiscoverIndex = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-157e4766"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/discover/index.vue"]]);
  const _sfc_main$4 = {
    __name: "AppConfirmDialog",
    props: {
      open: { type: Boolean, default: false },
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      confirmText: { type: String, default: "确定" },
      cancelText: { type: String, default: "取消" },
      destructive: { type: Boolean, default: false }
    },
    emits: ["update:open", "confirm"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props = __props;
      const emit = __emit;
      function close() {
        emit("update:open", false);
      }
      function onConfirm() {
        emit("confirm");
        close();
      }
      const __returned__ = { props, emit, close, onConfirm };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return $props.open ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "mask",
      onClick: $setup.close
    }, [
      vue.createElementVNode("view", {
        class: "dialog card",
        onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
        }, ["stop"]))
      }, [
        $props.title ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 0,
            class: "dlg-title"
          },
          vue.toDisplayString($props.title),
          1
          /* TEXT */
        )) : vue.createCommentVNode("v-if", true),
        $props.description ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 1,
            class: "dlg-desc text-muted"
          },
          vue.toDisplayString($props.description),
          1
          /* TEXT */
        )) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "dlg-actions flex-row" }, [
          vue.createElementVNode(
            "button",
            {
              class: "dlg-btn cancel",
              onClick: $setup.close
            },
            vue.toDisplayString($props.cancelText),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "button",
            {
              class: vue.normalizeClass(["dlg-btn confirm", { destructive: $props.destructive }]),
              onClick: $setup.onConfirm
            },
            vue.toDisplayString($props.confirmText),
            3
            /* TEXT, CLASS */
          )
        ])
      ])
    ])) : vue.createCommentVNode("v-if", true);
  }
  const AppConfirmDialog = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-029d4711"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppConfirmDialog.vue"]]);
  const useThemeStore = defineStore("theme", () => {
    const theme = vue.ref(getItem("theme") || "dark");
    function applyTheme() {
    }
    function toggleTheme() {
      theme.value = theme.value === "dark" ? "light" : "dark";
      setItem("theme", theme.value);
    }
    const isDark = vue.computed(() => theme.value === "dark");
    return { theme, isDark, toggleTheme, applyTheme };
  });
  const TAB_PATH = "/pages/profile/index";
  const _sfc_main$3 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const tabScroll = useTabScrollStore();
      function loadCachedUser() {
        try {
          const raw = getItem("user_info");
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      }
      function persistUserInfo(next) {
        try {
          setItem("user_info", JSON.stringify(next));
        } catch {
        }
      }
      function patchUserInfo(partial) {
        try {
          const raw = getItem("user_info");
          if (!raw)
            return;
          const parsed = JSON.parse(raw);
          Object.assign(parsed, partial);
          setItem("user_info", JSON.stringify(parsed));
        } catch {
        }
      }
      const { t, locale } = useI18n();
      const chat2 = useChatStore();
      const themeStore = useThemeStore();
      const user = vue.ref(loadCachedUser());
      const stats = vue.ref({
        companion_count: 0,
        total_turns: 0,
        days_together: 0
      });
      const loading = vue.ref(
        Boolean(getItem("user_token")) && !getItem("user_info")
      );
      const showEditProfile = vue.ref(false);
      const editNickname = vue.ref("");
      const editSexualOrientation = vue.ref("");
      const editGender = vue.ref("保密");
      const editAge = vue.ref("");
      const editRegion = vue.ref("");
      const editOccupation = vue.ref("");
      const editLoading = vue.ref(false);
      const showLangPicker = vue.ref(false);
      const showAbout = vue.ref(false);
      const showLogoutConfirm = vue.ref(false);
      const avatarUploading = vue.ref(false);
      const genderValues = ["男", "女", "保密"];
      const orientationValues = [
        "heterosexual",
        "homosexual",
        "bisexual",
        "pansexual",
        "asexual",
        "secret"
      ];
      const languages = [
        { code: "zh", label: "中文", flag: "🇨🇳" },
        { code: "en", label: "English", flag: "🇺🇸" },
        { code: "ja", label: "日本語", flag: "🇯🇵" },
        { code: "ko", label: "한국어", flag: "🇰🇷" },
        { code: "pt", label: "Português", flag: "🇧🇷" },
        { code: "es", label: "Español", flag: "🇪🇸" },
        { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" }
      ];
      const menuItems = vue.computed(() => [
        {
          icon: "✨",
          label: t("home.createCompanion"),
          path: "/pages-sub/create/index",
          requireAuth: true
        },
        {
          icon: "👥",
          label: t("profile.myCompanions"),
          hint: t("profile.myCompanionsHint"),
          path: "/pages-sub/my-companions/index",
          requireAuth: true
        },
        {
          icon: "📝",
          label: t("profile.myMoments"),
          path: "/pages-sub/my-posts/index",
          requireAuth: true
        },
        {
          icon: "💕",
          label: t("profile.intimacyRecord"),
          path: "/pages-sub/intimacy/index",
          requireAuth: true
        },
        {
          icon: "🔔",
          label: t("profile.notificationSettings"),
          path: "/pages-sub/settings/index",
          requireAuth: true
        },
        {
          icon: "📬",
          label: t("notifications.title"),
          path: "/pages-sub/notifications/index",
          requireAuth: true
        },
        {
          icon: "🌐",
          label: t("profile.languagePreference"),
          action: () => {
            showLangPicker.value = true;
          }
        },
        {
          icon: "🛡",
          label: t("profile.privacyPolicy"),
          path: "/pages-sub/privacy/index",
          requireAuth: true
        },
        {
          icon: "💬",
          label: t("messages.feedback"),
          path: "/pages-sub/feedback/index",
          requireAuth: true
        },
        {
          icon: "ℹ️",
          label: t("profile.aboutUs"),
          action: () => {
            showAbout.value = true;
          }
        }
      ]);
      const visibleMenuItems = vue.computed(
        () => menuItems.value.filter((item) => !item.requireAuth || user.value)
      );
      const genderPickerIndex = vue.computed(() => {
        const idx = genderValues.indexOf(editGender.value);
        return idx >= 0 ? idx : 2;
      });
      const orientationPickerIndex = vue.computed(() => {
        const idx = orientationValues.indexOf(editSexualOrientation.value);
        return idx >= 0 ? idx : 0;
      });
      const avatarSrc = vue.computed(() => {
        var _a2;
        if (!((_a2 = user.value) == null ? void 0 : _a2.avatar_url))
          return "";
        return normalizeMediaUrl(user.value.avatar_url) || user.value.avatar_url;
      });
      const genderEmoji = vue.computed(() => {
        var _a2, _b;
        if (((_a2 = user.value) == null ? void 0 : _a2.gender) === "男")
          return "👨";
        if (((_b = user.value) == null ? void 0 : _b.gender) === "女")
          return "👩";
        return "👤";
      });
      function sexualOrientationLabel(value) {
        if (value === "heterosexual")
          return t("register.heterosexual");
        if (value === "homosexual")
          return t("register.homosexual");
        if (value === "bisexual")
          return t("register.bisexual");
        if (value === "pansexual")
          return t("register.pansexual");
        if (value === "asexual")
          return t("register.asexual");
        if (value === "secret")
          return t("register.secret");
        return value;
      }
      function onMenuItem(item) {
        if (item.action) {
          item.action();
          return;
        }
        if (item.requireAuth && !requireAuth())
          return;
        if (item.path)
          uni.navigateTo({ url: item.path });
      }
      function onMenuItemTap(item, index) {
        trackButtonClick(`profile-menu-${index}`, `个人中心菜单-${item.label}`);
        onMenuItem(item);
      }
      function openEditProfile() {
        if (!user.value)
          return;
        editNickname.value = user.value.nickname || user.value.username || "";
        editSexualOrientation.value = user.value.sexual_orientation || "";
        editGender.value = user.value.gender || "保密";
        editAge.value = user.value.age != null && user.value.age !== void 0 ? String(user.value.age) : "";
        editRegion.value = user.value.region || "";
        editOccupation.value = user.value.occupation || "";
        showEditProfile.value = true;
      }
      function onGenderChange(e) {
        editGender.value = genderValues[Number(e.detail.value)] || "保密";
      }
      function onOrientationChange(e) {
        editSexualOrientation.value = orientationValues[Number(e.detail.value)] || "heterosexual";
      }
      function onAgeInput(e) {
        editAge.value = e.detail.value.replace(/\D/g, "").slice(0, 2);
      }
      async function saveProfile() {
        const token = getItem("user_token");
        if (!token || !editNickname.value.trim() || !editAge.value.trim()) {
          if (!editNickname.value.trim()) {
            showToast(t("profile.enterNickname"));
          } else if (!editAge.value.trim()) {
            showToast(t("profile.agePlaceholder"));
          }
          return;
        }
        const trimmedAge = editAge.value.trim();
        const n = parseInt(trimmedAge, 10);
        if (Number.isNaN(n) || n < 18 || n > 70) {
          showToast(t("profile.invalidAge"));
          return;
        }
        editLoading.value = true;
        try {
          const data = await apiFetch("/api/auth/me", {
            method: "PATCH",
            data: {
              nickname: editNickname.value.trim(),
              sexual_orientation: editSexualOrientation.value,
              gender: editGender.value,
              age: n,
              region: editRegion.value.trim(),
              occupation: editOccupation.value.trim()
            }
          });
          if (user.value) {
            user.value = {
              ...user.value,
              nickname: data.nickname ?? user.value.nickname,
              sexual_orientation: data.sexual_orientation ?? user.value.sexual_orientation,
              gender: data.gender ?? user.value.gender,
              age: data.age ?? user.value.age,
              region: data.region ?? user.value.region,
              occupation: data.occupation ?? user.value.occupation
            };
            persistUserInfo(user.value);
          } else {
            patchUserInfo({
              nickname: data.nickname,
              sexual_orientation: data.sexual_orientation,
              gender: data.gender,
              age: data.age,
              region: data.region,
              occupation: data.occupation
            });
          }
          showEditProfile.value = false;
        } catch {
          showToast(t("common.networkError"));
        } finally {
          editLoading.value = false;
        }
      }
      function onAvatarTap() {
        const token = getItem("user_token");
        if (!token || !user.value || avatarUploading.value)
          return;
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: async (res) => {
            var _a2;
            const filePath = (_a2 = res.tempFilePaths) == null ? void 0 : _a2[0];
            if (!filePath)
              return;
            avatarUploading.value = true;
            try {
              const up = await uploadImage(filePath);
              const url = up.url;
              if (!url) {
                showToast(t("profile.avatarUploadFailed"));
                return;
              }
              const j = await apiFetch("/api/auth/me", {
                method: "PATCH",
                data: { avatar_url: url }
              });
              const savedUrl = j.avatar_url || url;
              if (user.value) {
                user.value = { ...user.value, avatar_url: savedUrl };
                persistUserInfo(user.value);
              } else {
                patchUserInfo({ avatar_url: savedUrl });
              }
            } catch {
              showToast(t("profile.avatarUploadFailed"));
            } finally {
              avatarUploading.value = false;
            }
          }
        });
      }
      function selectLanguage(code) {
        setAppLanguage(code);
        showLangPicker.value = false;
      }
      function handleLogout() {
        chat2.disconnectAll();
        invalidateCompanionsCache();
        removeItem("user_token");
        removeItem("user_info");
        uni.reLaunch({ url: "/pages/login/index" });
      }
      function goLogin() {
        uni.reLaunch({ url: "/pages/login/index" });
      }
      function promptLogout() {
        showLogoutConfirm.value = true;
      }
      function toggleTheme() {
        themeStore.toggleTheme();
      }
      async function loadBackgroundData() {
        const token = getItem("user_token");
        if (!token) {
          loading.value = false;
          return;
        }
        try {
          const [userData, statsData] = await Promise.all([
            api.get("/api/auth/me").catch(() => null),
            api.get("/api/users/stats").catch(() => null)
          ]);
          if (userData) {
            const nextUser = {
              ...userData,
              avatar_url: userData.avatar_url || "",
              region: userData.region || "",
              occupation: userData.occupation || ""
            };
            user.value = nextUser;
            persistUserInfo(nextUser);
          }
          if (statsData) {
            stats.value = {
              companion_count: statsData.intimate_companion_count ?? statsData.companion_count ?? 0,
              total_turns: statsData.total_turns ?? 0,
              days_together: statsData.max_days_together ?? statsData.days_together ?? 0
            };
          }
        } catch (err) {
          formatAppLog("error", "at pages/profile/index.vue:421", err);
        } finally {
          loading.value = false;
        }
      }
      vue.onMounted(() => {
        loadBackgroundData();
      });
      const pageScrollTop = vue.ref(0);
      function onPageBodyScroll(e) {
        var _a2;
        const top = ((_a2 = e == null ? void 0 : e.detail) == null ? void 0 : _a2.scrollTop) || 0;
        tabScroll.setScroll(TAB_PATH, top);
      }
      vue.watch(
        () => tabScroll.scrollToTopTick[TAB_PATH],
        () => {
          pageScrollTop.value = pageScrollTop.value === 0 ? 0.01 : 0;
          void vue.nextTick(() => {
            pageScrollTop.value = 0;
          });
        }
      );
      const __returned__ = { TAB_PATH, tabScroll, loadCachedUser, persistUserInfo, patchUserInfo, t, locale, chat: chat2, themeStore, user, stats, loading, showEditProfile, editNickname, editSexualOrientation, editGender, editAge, editRegion, editOccupation, editLoading, showLangPicker, showAbout, showLogoutConfirm, avatarUploading, genderValues, orientationValues, languages, menuItems, visibleMenuItems, genderPickerIndex, orientationPickerIndex, avatarSrc, genderEmoji, sexualOrientationLabel, onMenuItem, onMenuItemTap, openEditProfile, onGenderChange, onOrientationChange, onAgeInput, saveProfile, onAvatarTap, selectLanguage, handleLogout, goLogin, promptLogout, toggleTheme, loadBackgroundData, pageScrollTop, onPageBodyScroll, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, watch: vue.watch, nextTick: vue.nextTick, get useI18n() {
        return useI18n;
      }, AppPageShell, AppAvatarImage, AppConfirmDialog, get requireAuth() {
        return requireAuth;
      }, get getItem() {
        return getItem;
      }, get setItem() {
        return setItem;
      }, get removeItem() {
        return removeItem;
      }, get useChatStore() {
        return useChatStore;
      }, get useThemeStore() {
        return useThemeStore;
      }, get showToast() {
        return showToast;
      }, get invalidateCompanionsCache() {
        return invalidateCompanionsCache;
      }, get apiFetch() {
        return apiFetch;
      }, get api() {
        return api;
      }, get uploadImage() {
        return uploadImage;
      }, get setAppLanguage() {
        return setAppLanguage;
      }, get normalizeMediaUrl() {
        return normalizeMediaUrl;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      }, get trackButtonClick() {
        return trackButtonClick;
      }, get useTabScrollStore() {
        return useTabScrollStore;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createBlock($setup["AppPageShell"], {
      title: $setup.t("profile.title"),
      "show-tab-bar": ""
    }, {
      default: vue.withCtx(() => {
        var _a2, _b, _c, _d;
        return [
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "page-scroll",
            "scroll-top": $setup.pageScrollTop,
            onScroll: $setup.onPageBodyScroll
          }, [
            vue.createElementVNode("view", { class: "page-body" }, [
              vue.createCommentVNode(" 用户信息 "),
              vue.createElementVNode("view", { class: "user-row" }, [
                $setup.loading && !$setup.user ? (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  { key: 0 },
                  [
                    vue.createElementVNode("view", { class: "avatar-block" }, [
                      vue.createElementVNode("view", { class: "avatar-placeholder skeleton" })
                    ]),
                    vue.createElementVNode("view", { class: "user-meta user-meta-skeleton" }, [
                      vue.createElementVNode("view", { class: "skeleton skel-name" }),
                      vue.createElementVNode("view", { class: "skeleton skel-id" })
                    ])
                  ],
                  64
                  /* STABLE_FRAGMENT */
                )) : (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  { key: 1 },
                  [
                    vue.createElementVNode("view", { class: "avatar-block" }, [
                      $setup.avatarSrc ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "profile-avatar-wrap"
                      }, [
                        vue.createVNode($setup["AppAvatarImage"], {
                          src: $setup.avatarSrc,
                          seed: `user-${(_a2 = $setup.user) == null ? void 0 : _a2.id}`,
                          generating: $setup.avatarUploading
                        }, null, 8, ["src", "seed", "generating"])
                      ])) : (vue.openBlock(), vue.createElementBlock("view", {
                        key: 1,
                        class: "avatar-placeholder"
                      }, [
                        vue.createElementVNode(
                          "text",
                          { class: "avatar-emoji" },
                          vue.toDisplayString($setup.genderEmoji),
                          1
                          /* TEXT */
                        )
                      ])),
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["avatar-edit-btn", { disabled: !$setup.user || $setup.avatarUploading }]),
                          onClick: _cache[0] || (_cache[0] = ($event) => $setup.bindAnalyticsTap("profile-avatar-upload", $setup.onAvatarTap, "上传头像"))
                        },
                        [
                          $setup.avatarUploading ? (vue.openBlock(), vue.createElementBlock("text", {
                            key: 0,
                            class: "spinner-sm"
                          })) : (vue.openBlock(), vue.createElementBlock("text", {
                            key: 1,
                            class: "edit-icon"
                          }, "✎"))
                        ],
                        2
                        /* CLASS */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "user-meta" }, [
                      vue.createElementVNode("view", { class: "name-row" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "user-name" },
                          vue.toDisplayString(((_b = $setup.user) == null ? void 0 : _b.nickname) || ((_c = $setup.user) == null ? void 0 : _c.username) || $setup.t("profile.notLoggedIn")),
                          1
                          /* TEXT */
                        ),
                        $setup.user ? (vue.openBlock(), vue.createElementBlock("text", {
                          key: 0,
                          class: "edit-name-btn",
                          onClick: $setup.openEditProfile
                        }, "✎")) : vue.createCommentVNode("v-if", true)
                      ]),
                      vue.createElementVNode(
                        "text",
                        { class: "text-muted user-id" },
                        vue.toDisplayString($setup.user ? `${$setup.t("profile.authorId")}: ${$setup.user.id}` : $setup.t("profile.pleaseLogin")),
                        1
                        /* TEXT */
                      ),
                      ((_d = $setup.user) == null ? void 0 : _d.sexual_orientation) ? (vue.openBlock(), vue.createElementBlock(
                        "text",
                        {
                          key: 0,
                          class: "text-muted orientation-text"
                        },
                        vue.toDisplayString($setup.t("register.sexualOrientation")) + ": " + vue.toDisplayString($setup.sexualOrientationLabel($setup.user.sexual_orientation)),
                        1
                        /* TEXT */
                      )) : vue.createCommentVNode("v-if", true)
                    ])
                  ],
                  64
                  /* STABLE_FRAGMENT */
                ))
              ]),
              vue.createCommentVNode(" 统计 "),
              vue.createElementVNode("view", { class: "stats-grid" }, [
                vue.createElementVNode("view", { class: "stat-card" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "stat-value" },
                    vue.toDisplayString($setup.stats.companion_count),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "text-muted stat-label" },
                    vue.toDisplayString($setup.t("profile.myCompanions")),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "stat-card" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "stat-value" },
                    vue.toDisplayString($setup.stats.total_turns),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "text-muted stat-label" },
                    vue.toDisplayString($setup.t("profile.chatTurns")),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "stat-card" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "stat-value" },
                    vue.toDisplayString($setup.stats.days_together) + "天",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "text-muted stat-label" },
                    vue.toDisplayString($setup.t("profile.daysTogether")),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createCommentVNode(" 菜单 "),
              vue.createElementVNode("view", { class: "menu-list" }, [
                vue.createElementVNode("view", {
                  class: "menu-item",
                  onClick: _cache[1] || (_cache[1] = ($event) => $setup.bindAnalyticsTap("profile-toggle-theme", $setup.toggleTheme, "切换主题"))
                }, [
                  vue.createElementVNode("view", { class: "menu-left" }, [
                    vue.createElementVNode("view", { class: "menu-icon-wrap" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString($setup.themeStore.isDark ? "🌙" : "☀️"),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "menu-label" },
                      vue.toDisplayString($setup.themeStore.isDark ? $setup.t("profile.darkMode") : $setup.t("profile.lightMode")),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["theme-switch", { on: $setup.themeStore.isDark }])
                    },
                    [
                      vue.createElementVNode("view", { class: "theme-knob" })
                    ],
                    2
                    /* CLASS */
                  )
                ]),
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.visibleMenuItems, (item, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: index,
                      class: "menu-item",
                      onClick: ($event) => $setup.onMenuItemTap(item, index)
                    }, [
                      vue.createElementVNode("view", { class: "menu-left" }, [
                        vue.createElementVNode("view", { class: "menu-icon-wrap" }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(item.icon),
                            1
                            /* TEXT */
                          )
                        ]),
                        vue.createElementVNode("view", { class: "menu-text-col" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "menu-label" },
                            vue.toDisplayString(item.label),
                            1
                            /* TEXT */
                          ),
                          item.hint ? (vue.openBlock(), vue.createElementBlock(
                            "text",
                            {
                              key: 0,
                              class: "text-muted menu-hint"
                            },
                            vue.toDisplayString(item.hint),
                            1
                            /* TEXT */
                          )) : vue.createCommentVNode("v-if", true)
                        ])
                      ]),
                      vue.createElementVNode("view", { class: "menu-right" }, [
                        item.badge ? (vue.openBlock(), vue.createElementBlock(
                          "text",
                          {
                            key: 0,
                            class: "menu-badge"
                          },
                          vue.toDisplayString(item.badge),
                          1
                          /* TEXT */
                        )) : vue.createCommentVNode("v-if", true),
                        vue.createElementVNode("text", { class: "chevron" }, "›")
                      ])
                    ], 8, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                $setup.user ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "menu-item logout-item",
                  onClick: _cache[2] || (_cache[2] = ($event) => $setup.bindAnalyticsTap("profile-logout", $setup.promptLogout, "退出登录"))
                }, [
                  vue.createElementVNode("view", { class: "menu-left" }, [
                    vue.createElementVNode("view", { class: "menu-icon-wrap destructive" }, [
                      vue.createElementVNode("text", null, "🚪")
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "menu-label destructive-text" },
                      vue.toDisplayString($setup.t("profile.logout")),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("text", { class: "chevron destructive-chevron" }, "›")
                ])) : (vue.openBlock(), vue.createElementBlock("button", {
                  key: 1,
                  class: "btn-login",
                  onClick: _cache[3] || (_cache[3] = ($event) => $setup.bindAnalyticsTap("profile-login", $setup.goLogin, "登录"))
                }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    "🚪 " + vue.toDisplayString($setup.t("login.loginBtn")),
                    1
                    /* TEXT */
                  )
                ]))
              ])
            ])
          ], 40, ["scroll-top"]),
          vue.createCommentVNode(" 编辑资料 "),
          $setup.showEditProfile ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "modal-mask center",
            onClick: _cache[9] || (_cache[9] = ($event) => $setup.showEditProfile = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-card edit-modal",
              onClick: _cache[8] || (_cache[8] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header-row" }, [
                vue.createElementVNode(
                  "text",
                  { class: "modal-title" },
                  vue.toDisplayString($setup.t("profile.editProfile")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", {
                  class: "modal-close",
                  onClick: _cache[4] || (_cache[4] = ($event) => $setup.showEditProfile = false)
                }, "✕")
              ]),
              vue.createElementVNode("scroll-view", {
                "scroll-y": "",
                class: "edit-form-scroll"
              }, [
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "field-label" },
                    vue.toDisplayString($setup.t("register.nickname")),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("input", {
                    value: $setup.editNickname,
                    class: "input-field",
                    placeholder: $setup.t("profile.enterNickname"),
                    maxlength: "20",
                    onInput: _cache[5] || (_cache[5] = ($event) => $setup.editNickname = $event.detail.value)
                  }, null, 40, ["value", "placeholder"])
                ]),
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "field-label" },
                    vue.toDisplayString($setup.t("register.gender")),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("picker", {
                    mode: "selector",
                    range: $setup.genderValues,
                    value: $setup.genderPickerIndex,
                    onChange: $setup.onGenderChange
                  }, [
                    vue.createElementVNode(
                      "view",
                      { class: "input-field picker-field" },
                      vue.toDisplayString($setup.editGender),
                      1
                      /* TEXT */
                    )
                  ], 40, ["value"])
                ]),
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "field-label" },
                    vue.toDisplayString($setup.t("profile.age")),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("input", {
                    value: $setup.editAge,
                    class: "input-field",
                    type: "number",
                    placeholder: $setup.t("profile.agePlaceholder"),
                    onInput: $setup.onAgeInput
                  }, null, 40, ["value", "placeholder"])
                ]),
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "field-label" },
                    vue.toDisplayString($setup.t("profile.region")),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("input", {
                    value: $setup.editRegion,
                    class: "input-field",
                    placeholder: $setup.t("profile.placeholderRegion"),
                    maxlength: "120",
                    onInput: _cache[6] || (_cache[6] = ($event) => $setup.editRegion = $event.detail.value)
                  }, null, 40, ["value", "placeholder"])
                ]),
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "field-label" },
                    vue.toDisplayString($setup.t("profile.occupation")),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("input", {
                    value: $setup.editOccupation,
                    class: "input-field",
                    placeholder: $setup.t("profile.placeholderOccupation"),
                    maxlength: "100",
                    onInput: _cache[7] || (_cache[7] = ($event) => $setup.editOccupation = $event.detail.value)
                  }, null, 40, ["value", "placeholder"])
                ]),
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "field-label" },
                    vue.toDisplayString($setup.t("register.sexualOrientation")),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("picker", {
                    mode: "selector",
                    range: $setup.orientationValues.map((v) => $setup.sexualOrientationLabel(v)),
                    value: $setup.orientationPickerIndex,
                    onChange: $setup.onOrientationChange
                  }, [
                    vue.createElementVNode(
                      "view",
                      { class: "input-field picker-field" },
                      vue.toDisplayString($setup.sexualOrientationLabel($setup.editSexualOrientation)),
                      1
                      /* TEXT */
                    )
                  ], 40, ["range", "value"])
                ])
              ]),
              vue.createElementVNode("button", {
                class: "btn-primary save-btn",
                disabled: $setup.editLoading || !$setup.editNickname.trim() || !$setup.editAge.trim(),
                onClick: $setup.saveProfile
              }, [
                $setup.editLoading ? (vue.openBlock(), vue.createElementBlock(
                  "text",
                  { key: 0 },
                  vue.toDisplayString($setup.t("common.loading")),
                  1
                  /* TEXT */
                )) : (vue.openBlock(), vue.createElementBlock(
                  "text",
                  { key: 1 },
                  "✓ " + vue.toDisplayString($setup.t("common.save")),
                  1
                  /* TEXT */
                ))
              ], 8, ["disabled"])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 语言选择 "),
          $setup.showLangPicker ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "modal-mask bottom",
            onClick: _cache[12] || (_cache[12] = ($event) => $setup.showLangPicker = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-sheet lang-sheet",
              onClick: _cache[11] || (_cache[11] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header-row sheet-header" }, [
                vue.createElementVNode(
                  "text",
                  { class: "modal-title" },
                  vue.toDisplayString($setup.t("profile.selectLanguage")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", {
                  class: "modal-close",
                  onClick: _cache[10] || (_cache[10] = ($event) => $setup.showLangPicker = false)
                }, "✕")
              ]),
              vue.createElementVNode("scroll-view", {
                "scroll-y": "",
                class: "lang-list"
              }, [
                (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.languages, (lang) => {
                    return vue.createElementVNode("view", {
                      key: lang.code,
                      class: vue.normalizeClass(["lang-item", { active: $setup.locale === lang.code }]),
                      onClick: ($event) => $setup.selectLanguage(lang.code)
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lang-flag" },
                        vue.toDisplayString(lang.flag),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "lang-label" },
                        vue.toDisplayString(lang.label),
                        1
                        /* TEXT */
                      ),
                      $setup.locale === lang.code ? (vue.openBlock(), vue.createElementBlock("text", {
                        key: 0,
                        class: "lang-check"
                      }, "✓")) : vue.createCommentVNode("v-if", true)
                    ], 10, ["onClick"]);
                  }),
                  64
                  /* STABLE_FRAGMENT */
                ))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 关于我们 "),
          $setup.showAbout ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "modal-mask center",
            onClick: _cache[15] || (_cache[15] = ($event) => $setup.showAbout = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-card about-card",
              onClick: _cache[14] || (_cache[14] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header-row" }, [
                vue.createElementVNode(
                  "text",
                  { class: "modal-title" },
                  vue.toDisplayString($setup.t("profile.aboutUs")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", {
                  class: "modal-close",
                  onClick: _cache[13] || (_cache[13] = ($event) => $setup.showAbout = false)
                }, "✕")
              ]),
              vue.createElementVNode("view", { class: "about-body" }, [
                vue.createElementVNode("view", { class: "about-logo" }, [
                  vue.createElementVNode("text", { class: "about-heart" }, "♥")
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "about-app-name" },
                  vue.toDisplayString($setup.t("home.title")),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "text-muted about-line" }, "trandsai"),
                vue.createElementVNode("text", { class: "text-muted about-line" }, "支持多语言 · 多智能体 · 沉浸式聊天"),
                vue.createElementVNode("view", { class: "about-footer" }, [
                  vue.createElementVNode("text", { class: "text-muted about-copy" }, "© 2025 trandsai. All rights reserved.")
                ])
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 退出登录确认 "),
          vue.createVNode($setup["AppConfirmDialog"], {
            open: $setup.showLogoutConfirm,
            title: $setup.t("profile.logout"),
            description: $setup.t("profile.logoutConfirm"),
            "confirm-text": $setup.t("common.confirm"),
            "cancel-text": $setup.t("common.cancel"),
            destructive: "",
            "onUpdate:open": _cache[16] || (_cache[16] = ($event) => $setup.showLogoutConfirm = $event),
            onConfirm: $setup.handleLogout
          }, null, 8, ["open", "title", "description", "confirm-text", "cancel-text"])
        ];
      }),
      _: 1
      /* STABLE */
    }, 8, ["title"]);
  }
  const PagesProfileIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-201c0da5"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/profile/index.vue"]]);
  const CHAT_EMOJI_CATEGORIES = [
    {
      key: "smile",
      labelKey: "chat.emojiSmile",
      emojis: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "🤣",
        "😂",
        "🙂",
        "🙃",
        "😉",
        "😊",
        "😇",
        "🥰",
        "😍",
        "🤩",
        "😘",
        "😗",
        "😚",
        "😙",
        "😋",
        "😛",
        "😜",
        "🤪",
        "😝",
        "🤑",
        "🤗",
        "🤭",
        "🤫",
        "🤔",
        "🤐",
        "🤨",
        "😐",
        "😑",
        "😶",
        "😏",
        "😒",
        "🙄",
        "😬",
        "🤥",
        "😌",
        "😔",
        "😪",
        "🤤",
        "😴",
        "😷",
        "🤒",
        "🤕",
        "🤢",
        "🤮",
        "🥵",
        "🥶",
        "🥴",
        "😵",
        "🤯",
        "🤠",
        "🥳",
        "😎",
        "🤓",
        "🧐",
        "😕",
        "😟",
        "🙁",
        "☹️",
        "😮",
        "😯",
        "😲",
        "😳",
        "🥺",
        "😦",
        "😧",
        "😨",
        "😰",
        "😥",
        "😢",
        "😭",
        "😱",
        "😖",
        "😣",
        "😞"
      ]
    },
    {
      key: "heart",
      labelKey: "chat.emojiHeart",
      emojis: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",
        "🔥",
        "✨",
        "🎉",
        "🎊",
        "🎁",
        "🌹",
        "🌸",
        "🌺",
        "🌻",
        "🌼",
        "🌷",
        "💐",
        "🍀"
      ]
    },
    {
      key: "gesture",
      labelKey: "chat.emojiGesture",
      emojis: [
        "👍",
        "👎",
        "👊",
        "✊",
        "🤛",
        "🤜",
        "🤞",
        "✌️",
        "🤟",
        "🤘",
        "👌",
        "🤌",
        "🤏",
        "👈",
        "👉",
        "👆",
        "👇",
        "☝️",
        "👋",
        "🤚",
        "🖐️",
        "✋",
        "🖖",
        "👏",
        "🙌",
        "🤲",
        "🙏",
        "💪",
        "🦾",
        "🦿",
        "🦵",
        "🦶"
      ]
    },
    {
      key: "misc",
      labelKey: "chat.emojiMisc",
      emojis: [
        "😈",
        "👿",
        "💀",
        "☠️",
        "💩",
        "🤡",
        "👹",
        "👺",
        "👻",
        "👽",
        "👾",
        "🤖",
        "🐶",
        "🐱",
        "🐭",
        "🐹",
        "🐰",
        "🦊",
        "🐻",
        "🐼",
        "🐨",
        "🐯",
        "🦁",
        "🐮",
        "☕",
        "🍵",
        "🧋",
        "🍰",
        "🍩",
        "🍪",
        "🍫",
        "🍬"
      ]
    }
  ];
  CHAT_EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const _sfc_main$2 = {
    __name: "AppChatEmojiPicker",
    emits: ["pick"],
    setup(__props, { expose: __expose, emit: __emit }) {
      var _a2;
      __expose();
      const emit = __emit;
      const { t } = useI18n();
      const activeCategory = vue.ref(((_a2 = CHAT_EMOJI_CATEGORIES[0]) == null ? void 0 : _a2.key) ?? "smile");
      const category = () => CHAT_EMOJI_CATEGORIES.find((c) => c.key === activeCategory.value) ?? CHAT_EMOJI_CATEGORIES[0];
      const __returned__ = { emit, t, activeCategory, category, ref: vue.ref, get useI18n() {
        return useI18n;
      }, get CHAT_EMOJI_CATEGORIES() {
        return CHAT_EMOJI_CATEGORIES;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "emoji-picker" }, [
      vue.createElementVNode("scroll-view", {
        "scroll-x": "",
        class: "cat-row"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.CHAT_EMOJI_CATEGORIES, (cat) => {
            return vue.openBlock(), vue.createElementBlock("text", {
              key: cat.key,
              class: vue.normalizeClass(["cat-chip", { active: cat.key === $setup.activeCategory }]),
              onClick: ($event) => $setup.activeCategory = cat.key
            }, vue.toDisplayString($setup.t(cat.labelKey)), 11, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createElementVNode("view", { class: "emoji-grid" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.category().emojis, (emoji) => {
            return vue.openBlock(), vue.createElementBlock("text", {
              key: emoji,
              class: "emoji-item",
              onClick: ($event) => $setup.emit("pick", emoji)
            }, vue.toDisplayString(emoji), 9, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])
    ]);
  }
  const AppChatEmojiPicker = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-27a962b4"], ["__file", "/Users/zeas/Desktop/client-uniii/components/AppChatEmojiPicker.vue"]]);
  const ROW_EST_HEIGHT = 88;
  const OVERSCAN = 12;
  const VIRTUAL_THRESHOLD = 400;
  function useChatVirtualWindow(rows, scrollTop, viewHeight) {
    const enabled = vue.computed(() => rows.value.length > VIRTUAL_THRESHOLD);
    const range = vue.computed(() => {
      if (!enabled.value) {
        return { start: 0, end: rows.value.length };
      }
      const top = scrollTop.value;
      const h = viewHeight.value || 600;
      const start = Math.max(0, Math.floor(top / ROW_EST_HEIGHT) - OVERSCAN);
      const end = Math.min(
        rows.value.length,
        Math.ceil((top + h) / ROW_EST_HEIGHT) + OVERSCAN
      );
      return { start, end };
    });
    const slice = vue.computed(
      () => enabled.value ? rows.value.slice(range.value.start, range.value.end) : rows.value
    );
    const topPad = vue.computed(
      () => enabled.value ? range.value.start * ROW_EST_HEIGHT : 0
    );
    const bottomPad = vue.computed(
      () => enabled.value ? (rows.value.length - range.value.end) * ROW_EST_HEIGHT : 0
    );
    return {
      enabled,
      slice,
      topPad,
      bottomPad,
      rangeStart: vue.computed(() => range.value.start)
    };
  }
  const CHAT_GROUP_GAP_MIN = 4;
  const _sfc_main$1 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const { t, locale } = useI18n();
      const chat2 = useChatStore();
      requireAuth();
      let companionId = "";
      const input = vue.ref("");
      const companion = vue.ref({
        name: t("common.loading"),
        avatar: "",
        online: true
      });
      const historyLoading = vue.ref(true);
      const accessDenied = vue.ref(false);
      const loadingMore = vue.ref(false);
      const hasMore = vue.ref(true);
      const offset = vue.ref(0);
      const isSending = vue.ref(false);
      const showEmojiPicker = vue.ref(false);
      const showMenu = vue.ref(false);
      const showClearConfirm = vue.ref(false);
      const scrollInto = vue.ref("");
      const scrollTop = vue.ref(0);
      const viewScrollTop = vue.ref(0);
      const nearBottom = vue.ref(true);
      const scrollViewHeight = vue.ref(0);
      const initialScrollDone = vue.ref(false);
      const prevMessageCount = vue.ref(0);
      const lastLoadMoreAt = vue.ref(0);
      const connected = vue.computed(() => chat2.isConnected[companionId] || false);
      const isTyping = vue.computed(() => chat2.typingCompanions[companionId] || false);
      const visibleMessages = vue.computed(() => {
        void chat2.messages;
        return chat2.getDisplayMessages(companionId).filter(
          (m) => !(m.sender === "system" && isWsConnectWelcomeNotice(m.text))
        );
      });
      const chatListRows = vue.computed(() => {
        const list = visibleMessages.value;
        const rows = [];
        let lastDayKey = "";
        let bubbleIndex = 0;
        let prevRowWasDate = false;
        for (let i = 0; i < list.length; i++) {
          const m = list[i];
          const prev = i > 0 ? list[i - 1] : null;
          const next = i < list.length - 1 ? list[i + 1] : null;
          if (m.ts) {
            const dk = calendarDayKeyFromIso(m.ts);
            if (dk && dk !== lastDayKey) {
              rows.push({
                kind: "date",
                key: `sep-${dk}-${m.id}`,
                label: formatChatDateSeparator(m.ts, locale.value)
              });
              lastDayKey = dk;
              prevRowWasDate = true;
            }
          }
          let groupWithPrev = false;
          if (prev && isConvSender(m.sender) && isConvSender(prev.sender) && !breaksConversationGroup(prev.sender) && !breaksConversationGroup(m.sender)) {
            if (prev.sender === m.sender) {
              const gapMin = Math.abs(messageInstant(m) - messageInstant(prev)) / 6e4;
              if (gapMin < CHAT_GROUP_GAP_MIN)
                groupWithPrev = true;
            }
          }
          let groupWithNext = false;
          if (next && isConvSender(m.sender) && isConvSender(next.sender) && !breaksConversationGroup(next.sender) && !breaksConversationGroup(m.sender)) {
            if (next.sender === m.sender) {
              const gapMin = Math.abs(messageInstant(next) - messageInstant(m)) / 6e4;
              if (gapMin < CHAT_GROUP_GAP_MIN)
                groupWithNext = true;
            }
          }
          const showAvatar = m.sender === "ai" && !(groupWithPrev && (prev == null ? void 0 : prev.sender) === "ai");
          const avatarSpacer = m.sender === "ai" && !showAvatar;
          const showFootTime = Boolean(
            m.time && (!isConvSender(m.sender) || !groupWithNext)
          );
          const marginTopClass = prevRowWasDate ? "mt-date" : bubbleIndex === 0 ? groupWithPrev ? "mt-tight" : "mt-none" : groupWithPrev ? "mt-tight" : "mt-normal";
          rows.push({
            kind: "bubble",
            key: m.id,
            message: m,
            layout: {
              groupWithPrev,
              groupWithNext,
              showAvatar,
              avatarSpacer,
              showFootTime
            },
            marginTopClass
          });
          bubbleIndex += 1;
          prevRowWasDate = false;
        }
        return rows;
      });
      const typingShowsCompanionAvatar = vue.computed(() => {
        const list = visibleMessages.value;
        if (list.length === 0)
          return true;
        return list[list.length - 1].sender !== "ai";
      });
      const instance = vue.getCurrentInstance();
      function isConvSender(s) {
        return s === "user" || s === "ai";
      }
      function breaksConversationGroup(s) {
        return s === "system" || s === "thinking" || s === "filler";
      }
      function messageInstant(m) {
        if (m.ts) {
          const tMs = Date.parse(m.ts);
          if (!Number.isNaN(tMs))
            return tMs;
        }
        return Date.now();
      }
      function userBubbleShape(layout) {
        const { groupWithPrev, groupWithNext: gNext } = layout;
        if (groupWithPrev && gNext)
          return "shape-mid-user";
        if (groupWithPrev)
          return "shape-top-user";
        if (gNext)
          return "shape-bottom-user";
        return "shape-single-user";
      }
      function aiBubbleShape(layout) {
        const { groupWithPrev, groupWithNext: gNext } = layout;
        if (groupWithPrev && gNext)
          return "shape-mid-ai";
        if (groupWithPrev)
          return "shape-top-ai";
        if (gNext)
          return "shape-bottom-ai";
        return "shape-single-ai";
      }
      function queryScrollMetrics() {
        return new Promise((resolve) => {
          const q = uni.createSelectorQuery().in(instance == null ? void 0 : instance.proxy);
          q.select("#chat-scroll").fields({ scrollOffset: true, size: true }, (res) => {
            resolve({
              scrollTop: (res == null ? void 0 : res.scrollTop) ?? 0,
              scrollHeight: (res == null ? void 0 : res.scrollHeight) ?? 0
            });
          }).exec();
        });
      }
      function measureScrollViewHeight() {
        const q = uni.createSelectorQuery().in(instance == null ? void 0 : instance.proxy);
        q.select("#chat-scroll").boundingClientRect((rect) => {
          if (rect == null ? void 0 : rect.height)
            scrollViewHeight.value = rect.height;
        }).exec();
      }
      function scrollToBottom() {
        scrollInto.value = "";
        vue.nextTick(() => {
          scrollInto.value = "chat-bottom";
        });
      }
      function onScroll(e) {
        const { scrollTop: top, scrollHeight } = e.detail;
        viewScrollTop.value = top;
        const viewH = scrollViewHeight.value || 0;
        nearBottom.value = viewH <= 0 || top + viewH >= scrollHeight - 100;
      }
      const {
        enabled: virtualEnabled,
        slice: virtualChatRows,
        topPad: virtualTopPad,
        bottomPad: virtualBottomPad
      } = useChatVirtualWindow(chatListRows, viewScrollTop, scrollViewHeight);
      async function loadMessages(loadOffset, isInitial) {
        if (!companionId)
          return;
        try {
          if (isInitial)
            historyLoading.value = true;
          else
            loadingMore.value = true;
          const data = await apiFetch(`/companions/${companionId}/messages?limit=20&offset=${loadOffset}`);
          const rawMessages = data.messages || [];
          const total = data.total || 0;
          const formatted = rawMessages.map((m, idx) => ({
            id: typeof m.id === "number" ? m.id : loadOffset + idx + 1,
            companionId,
            sender: m.role === "user" ? "user" : "ai",
            text: m.content || "",
            time: m.timestamp ? formatMessageTime(m.timestamp, locale.value) : "",
            ts: typeof m.timestamp === "string" ? m.timestamp : void 0
          }));
          if (isInitial) {
            chat2.mergeHistoryMessages(companionId, formatted, "initial");
            offset.value = rawMessages.length;
            hasMore.value = rawMessages.length < total;
          } else {
            const before = await queryScrollMetrics();
            chat2.mergeHistoryMessages(companionId, formatted, "prepend");
            offset.value += rawMessages.length;
            hasMore.value = loadOffset + rawMessages.length < total;
            await vue.nextTick();
            const after = await queryScrollMetrics();
            const delta = after.scrollHeight - before.scrollHeight;
            scrollTop.value = before.scrollTop + delta + 0.01;
          }
        } catch (err) {
          const status = err == null ? void 0 : err.status;
          if (status === 403) {
            accessDenied.value = true;
            return;
          }
          formatAppLog("error", "at pages/chat/index.vue:309", "加载聊天记录失败:", err);
        } finally {
          if (isInitial)
            historyLoading.value = false;
          else
            loadingMore.value = false;
        }
      }
      function onScrollToUpper() {
        if (loadingMore.value || !hasMore.value || !companionId)
          return;
        const now2 = Date.now();
        if (now2 - lastLoadMoreAt.value < 450)
          return;
        lastLoadMoreAt.value = now2;
        loadMessages(offset.value, false);
      }
      async function loadCompanion() {
        try {
          const data = await apiFetch(
            `/companions/${companionId}`
          );
          const profile2 = data.profile || {};
          const avatar = String(data.avatar || "");
          companion.value = {
            name: formatCompanionName(profile2.name, t("chat.defaultName")),
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${companionId}`,
            online: connected.value
          };
        } catch (err) {
          const status = err == null ? void 0 : err.status;
          if (status === 403) {
            accessDenied.value = true;
            throw err;
          }
          throw err;
        }
      }
      function handleSend() {
        if (!input.value.trim() || !companionId || isSending.value)
          return;
        const text = input.value.trim();
        input.value = "";
        isSending.value = true;
        chat2.sendMessage(companionId, text);
        vue.nextTick(() => scrollToBottom());
      }
      function copyMessage(text) {
        uni.setClipboardData({
          data: text,
          success() {
            showToast(t("chat.copySuccess"));
          }
        });
      }
      async function handleClearMessages() {
        if (!companionId)
          return;
        try {
          await apiFetch(`/companions/${companionId}/clear-messages`, {
            method: "POST"
          });
          offset.value = 0;
          hasMore.value = true;
          chat2.clearMessages(companionId);
          showToast(t("chat.clearSuccess"));
        } catch (err) {
          formatAppLog("error", "at pages/chat/index.vue:381", "清空聊天记录失败:", err);
          showToast(t("chat.clearFailed"));
        }
      }
      function handleEmojiPick(emoji) {
        input.value += emoji;
        showEmojiPicker.value = false;
      }
      function goProfile() {
        showMenu.value = false;
        uni.navigateTo({
          url: `/pages-sub/companion/index?id=${companionId}`
        });
      }
      function openClearConfirm() {
        showMenu.value = false;
        showClearConfirm.value = true;
      }
      function onProfileTap() {
        bindAnalyticsTap("chat-view-profile", goProfile, "查看资料");
      }
      function toggleMenu() {
        showMenu.value = !showMenu.value;
      }
      function closeMenu() {
        showMenu.value = false;
      }
      function toggleEmojiPicker() {
        showEmojiPicker.value = !showEmojiPicker.value;
      }
      function goBackFromDenied() {
        uni.navigateBack();
      }
      onLoad((query) => {
        companionId = String((query == null ? void 0 : query.id) || "");
      });
      vue.onMounted(async () => {
        if (!companionId)
          return;
        initialScrollDone.value = false;
        prevMessageCount.value = 0;
        accessDenied.value = false;
        chat2.setActiveCompanionId(companionId);
        chat2.connect(companionId);
        chat2.clearUnread(companionId);
        try {
          await Promise.all([loadCompanion(), loadMessages(0, true)]);
        } catch (err) {
          formatAppLog("error", "at pages/chat/index.vue:441", "加载失败:", err);
          historyLoading.value = false;
        }
        vue.nextTick(() => {
          measureScrollViewHeight();
          if (!historyLoading.value && visibleMessages.value.length > 0) {
            scrollToBottom();
            initialScrollDone.value = true;
          }
        });
      });
      vue.onUnmounted(() => {
        chat2.setActiveCompanionId(null);
      });
      vue.watch(connected, (conn) => {
        companion.value = { ...companion.value, online: conn };
        if (!conn)
          isSending.value = false;
      });
      vue.watch(
        () => visibleMessages.value.length,
        (count) => {
          if (count > prevMessageCount.value) {
            prevMessageCount.value = count;
            if (!historyLoading.value && !loadingMore.value && nearBottom.value) {
              vue.nextTick(() => {
                measureScrollViewHeight();
                scrollToBottom();
              });
            }
            isSending.value = false;
          } else {
            prevMessageCount.value = count;
          }
        }
      );
      vue.watch(isTyping, (typing) => {
        if (!historyLoading.value && !loadingMore.value && typing) {
          vue.nextTick(() => scrollToBottom());
        }
      });
      vue.watch(historyLoading, (loading) => {
        if (!loading && visibleMessages.value.length > 0 && !initialScrollDone.value) {
          vue.nextTick(() => {
            scrollToBottom();
            initialScrollDone.value = true;
          });
        }
      });
      const __returned__ = { t, locale, chat: chat2, get companionId() {
        return companionId;
      }, set companionId(v) {
        companionId = v;
      }, CHAT_GROUP_GAP_MIN, input, companion, historyLoading, accessDenied, loadingMore, hasMore, offset, isSending, showEmojiPicker, showMenu, showClearConfirm, scrollInto, scrollTop, viewScrollTop, nearBottom, scrollViewHeight, initialScrollDone, prevMessageCount, lastLoadMoreAt, connected, isTyping, visibleMessages, chatListRows, typingShowsCompanionAvatar, instance, isConvSender, breaksConversationGroup, messageInstant, userBubbleShape, aiBubbleShape, queryScrollMetrics, measureScrollViewHeight, scrollToBottom, onScroll, virtualEnabled, virtualChatRows, virtualTopPad, virtualBottomPad, loadMessages, onScrollToUpper, loadCompanion, handleSend, copyMessage, handleClearMessages, handleEmojiPick, goProfile, openClearConfirm, onProfileTap, toggleMenu, closeMenu, toggleEmojiPicker, goBackFromDenied, ref: vue.ref, computed: vue.computed, watch: vue.watch, nextTick: vue.nextTick, getCurrentInstance: vue.getCurrentInstance, onMounted: vue.onMounted, onUnmounted: vue.onUnmounted, get onLoad() {
        return onLoad;
      }, get useI18n() {
        return useI18n;
      }, AppPageShell, AppAvatarImage, AppChatEmojiPicker, AppConfirmDialog, AppListSkeleton, get requireAuth() {
        return requireAuth;
      }, get useChatStore() {
        return useChatStore;
      }, get apiFetch() {
        return apiFetch;
      }, get formatMessageTime() {
        return formatMessageTime;
      }, get formatChatDateSeparator() {
        return formatChatDateSeparator;
      }, get calendarDayKeyFromIso() {
        return calendarDayKeyFromIso;
      }, get isWsConnectWelcomeNotice() {
        return isWsConnectWelcomeNotice;
      }, get showToast() {
        return showToast;
      }, get useChatVirtualWindow() {
        return useChatVirtualWindow;
      }, get bindAnalyticsTap() {
        return bindAnalyticsTap;
      }, get formatCompanionName() {
        return formatCompanionName;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return $setup.accessDenied ? (vue.openBlock(), vue.createElementBlock("view", {
      key: 0,
      class: "access-denied"
    }, [
      vue.createElementVNode(
        "text",
        { class: "access-text" },
        vue.toDisplayString($setup.t("chat.accessDenied")),
        1
        /* TEXT */
      ),
      vue.createElementVNode(
        "button",
        {
          class: "access-back",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.bindAnalyticsTap("chat-access-denied-back", $setup.goBackFromDenied, "返回"))
        },
        vue.toDisplayString($setup.t("chat.back")),
        1
        /* TEXT */
      )
    ])) : (vue.openBlock(), vue.createBlock($setup["AppPageShell"], {
      key: 1,
      "show-back": true,
      "back-analytics-id": "chat-back",
      "back-analytics-name": "聊天页返回"
    }, {
      "header-title": vue.withCtx(() => [
        vue.createElementVNode("view", {
          class: "chat-header-info",
          onClick: $setup.onProfileTap
        }, [
          vue.createVNode($setup["AppAvatarImage"], {
            src: $setup.companion.avatar,
            seed: $setup.companionId,
            size: "sm"
          }, null, 8, ["src", "seed"]),
          vue.createElementVNode("view", { class: "chat-header-meta" }, [
            vue.createElementVNode("view", { class: "flex-row items-center gap-sm" }, [
              vue.createElementVNode(
                "text",
                { class: "chat-header-name" },
                vue.toDisplayString($setup.companion.name || $setup.t("common.loading")),
                1
                /* TEXT */
              ),
              $setup.companion.online ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "online-dot"
              })) : vue.createCommentVNode("v-if", true)
            ]),
            vue.createElementVNode(
              "text",
              { class: "chat-header-status text-muted" },
              vue.toDisplayString($setup.connected ? $setup.t("chat.online") : $setup.t("chat.connecting")),
              1
              /* TEXT */
            )
          ])
        ])
      ]),
      "header-right": vue.withCtx(() => [
        vue.createElementVNode("text", {
          class: "menu-btn",
          onClick: _cache[1] || (_cache[1] = vue.withModifiers(($event) => $setup.bindAnalyticsTap("chat-menu", $setup.toggleMenu, "聊天菜单"), ["stop"]))
        }, "⋮")
      ]),
      default: vue.withCtx(() => [
        $setup.showMenu ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "menu-mask",
          onClick: $setup.closeMenu
        })) : vue.createCommentVNode("v-if", true),
        $setup.showMenu ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "header-menu"
        }, [
          vue.createElementVNode(
            "text",
            {
              class: "menu-item",
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.bindAnalyticsTap("chat-menu-view-profile", $setup.goProfile, "查看资料"))
            },
            vue.toDisplayString($setup.t("chat.viewProfile")),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            {
              class: "menu-item destructive",
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.bindAnalyticsTap("chat-clear-messages", $setup.openClearConfirm, "清空消息"))
            },
            vue.toDisplayString($setup.t("chat.clearMessages")),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "chat-wrap" }, [
          vue.createElementVNode("scroll-view", {
            id: "chat-scroll",
            "scroll-y": "",
            class: "chat-scroll",
            "scroll-into-view": $setup.scrollInto,
            "scroll-top": $setup.scrollTop,
            "upper-threshold": 50,
            "enable-flex": true,
            "scroll-with-animation": "",
            onScroll: $setup.onScroll,
            onScrolltoupper: $setup.onScrollToUpper
          }, [
            $setup.loadingMore ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "load-more"
            }, [
              vue.createElementVNode("view", { class: "spinner spinner-sm" }),
              vue.createElementVNode(
                "text",
                { class: "text-muted" },
                vue.toDisplayString($setup.t("chat.loadingEarlier")),
                1
                /* TEXT */
              )
            ])) : vue.createCommentVNode("v-if", true),
            $setup.historyLoading && $setup.visibleMessages.length === 0 ? (vue.openBlock(), vue.createBlock($setup["AppListSkeleton"], {
              key: 1,
              rows: 6
            })) : vue.createCommentVNode("v-if", true),
            !$setup.historyLoading && $setup.visibleMessages.length === 0 ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 2,
                class: "empty-hint text-muted"
              },
              vue.toDisplayString($setup.t("chat.noMessages")),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true),
            $setup.virtualEnabled ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 3,
                class: "virtual-pad",
                style: vue.normalizeStyle({ height: $setup.virtualTopPad + "px" })
              },
              null,
              4
              /* STYLE */
            )) : vue.createCommentVNode("v-if", true),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.virtualChatRows, (row) => {
                return vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  {
                    key: row.key
                  },
                  [
                    row.kind === "date" ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "date-sep"
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "date-sep-label" },
                        vue.toDisplayString(row.label),
                        1
                        /* TEXT */
                      )
                    ])) : (vue.openBlock(), vue.createElementBlock("view", {
                      key: 1,
                      id: "msg-" + row.message.id,
                      class: vue.normalizeClass(row.marginTopClass)
                    }, [
                      vue.createCommentVNode(" thinking "),
                      row.message.sender === "thinking" ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "center-row"
                      }, [
                        vue.createElementVNode("text", {
                          class: "bubble-thinking",
                          onClick: ($event) => $setup.chat.dismissMessage(row.message.id)
                        }, vue.toDisplayString(row.message.text), 9, ["onClick"])
                      ])) : row.message.sender === "filler" ? (vue.openBlock(), vue.createElementBlock(
                        vue.Fragment,
                        { key: 1 },
                        [
                          vue.createCommentVNode(" filler "),
                          vue.createElementVNode("view", { class: "center-row" }, [
                            vue.createElementVNode(
                              "text",
                              { class: "bubble-filler" },
                              vue.toDisplayString(row.message.text),
                              1
                              /* TEXT */
                            )
                          ])
                        ],
                        2112
                        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
                      )) : row.message.sender === "system" ? (vue.openBlock(), vue.createElementBlock(
                        vue.Fragment,
                        { key: 2 },
                        [
                          vue.createCommentVNode(" system "),
                          vue.createElementVNode("view", { class: "center-row" }, [
                            vue.createElementVNode("view", { class: "bubble-system" }, [
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(row.message.text),
                                1
                                /* TEXT */
                              ),
                              row.message.time ? (vue.openBlock(), vue.createElementBlock(
                                "text",
                                {
                                  key: 0,
                                  class: "system-time"
                                },
                                vue.toDisplayString(row.message.time),
                                1
                                /* TEXT */
                              )) : vue.createCommentVNode("v-if", true)
                            ])
                          ])
                        ],
                        2112
                        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
                      )) : row.message.sender === "user" ? (vue.openBlock(), vue.createElementBlock(
                        vue.Fragment,
                        { key: 3 },
                        [
                          vue.createCommentVNode(" user "),
                          vue.createElementVNode("view", { class: "flex-row bubble-row-user" }, [
                            vue.createElementVNode("view", { class: "bubble-col" }, [
                              vue.createElementVNode("view", {
                                class: vue.normalizeClass(["chat-bubble-user", $setup.userBubbleShape(row.layout)]),
                                onLongpress: ($event) => $setup.copyMessage(row.message.text)
                              }, [
                                vue.createElementVNode(
                                  "text",
                                  { class: "bubble-text" },
                                  vue.toDisplayString(row.message.text),
                                  1
                                  /* TEXT */
                                )
                              ], 42, ["onLongpress"]),
                              row.layout.showFootTime && row.message.time ? (vue.openBlock(), vue.createElementBlock(
                                "text",
                                {
                                  key: 0,
                                  class: "foot-time foot-time-user"
                                },
                                vue.toDisplayString(row.message.time),
                                1
                                /* TEXT */
                              )) : vue.createCommentVNode("v-if", true)
                            ])
                          ])
                        ],
                        2112
                        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
                      )) : (vue.openBlock(), vue.createElementBlock(
                        vue.Fragment,
                        { key: 4 },
                        [
                          vue.createCommentVNode(" ai "),
                          vue.createElementVNode("view", { class: "flex-row bubble-row-ai" }, [
                            row.layout.showAvatar ? (vue.openBlock(), vue.createBlock($setup["AppAvatarImage"], {
                              key: 0,
                              src: $setup.companion.avatar,
                              seed: $setup.companionId,
                              size: "sm"
                            }, null, 8, ["src", "seed"])) : row.layout.avatarSpacer ? (vue.openBlock(), vue.createElementBlock("view", {
                              key: 1,
                              class: "avatar-spacer"
                            })) : vue.createCommentVNode("v-if", true),
                            vue.createElementVNode("view", { class: "bubble-col" }, [
                              vue.createElementVNode("view", {
                                class: vue.normalizeClass(["chat-bubble-ai", $setup.aiBubbleShape(row.layout)]),
                                onLongpress: ($event) => $setup.copyMessage(row.message.text)
                              }, [
                                vue.createElementVNode(
                                  "text",
                                  { class: "bubble-text" },
                                  vue.toDisplayString(row.message.text),
                                  1
                                  /* TEXT */
                                )
                              ], 42, ["onLongpress"]),
                              row.layout.showFootTime && row.message.time ? (vue.openBlock(), vue.createElementBlock(
                                "text",
                                {
                                  key: 0,
                                  class: "foot-time"
                                },
                                vue.toDisplayString(row.message.time),
                                1
                                /* TEXT */
                              )) : vue.createCommentVNode("v-if", true)
                            ])
                          ])
                        ],
                        2112
                        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
                      ))
                    ], 10, ["id"]))
                  ],
                  64
                  /* STABLE_FRAGMENT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            $setup.virtualEnabled ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 4,
                class: "virtual-pad",
                style: vue.normalizeStyle({ height: $setup.virtualBottomPad + "px" })
              },
              null,
              4
              /* STYLE */
            )) : vue.createCommentVNode("v-if", true),
            $setup.isTyping ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 5,
                class: vue.normalizeClass(["typing-row", { "typing-after-msgs": $setup.visibleMessages.length > 0 }])
              },
              [
                $setup.typingShowsCompanionAvatar ? (vue.openBlock(), vue.createBlock($setup["AppAvatarImage"], {
                  key: 0,
                  src: $setup.companion.avatar,
                  seed: $setup.companionId,
                  size: "sm"
                }, null, 8, ["src", "seed"])) : (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "avatar-spacer"
                })),
                vue.createElementVNode("view", { class: "typing-bubble" }, [
                  vue.createElementVNode("view", { class: "typing-dots" }, [
                    vue.createElementVNode("view", { class: "typing-dot" }),
                    vue.createElementVNode("view", { class: "typing-dot delay-1" }),
                    vue.createElementVNode("view", { class: "typing-dot delay-2" })
                  ])
                ])
              ],
              2
              /* CLASS */
            )) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", {
              id: "chat-bottom",
              class: "scroll-anchor"
            })
          ], 40, ["scroll-into-view", "scroll-top"]),
          vue.createElementVNode("view", { class: "chat-input-bar" }, [
            vue.createElementVNode("view", { class: "emoji-wrap" }, [
              vue.createElementVNode("text", {
                class: "emoji-toggle",
                onClick: _cache[4] || (_cache[4] = ($event) => $setup.bindAnalyticsTap("chat-emoji", $setup.toggleEmojiPicker, "表情"))
              }, "☺"),
              $setup.showEmojiPicker ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "emoji-panel"
              }, [
                vue.createVNode($setup["AppChatEmojiPicker"], { onPick: $setup.handleEmojiPick })
              ])) : vue.createCommentVNode("v-if", true)
            ]),
            vue.withDirectives(vue.createElementVNode("input", {
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.input = $event),
              class: "input-field chat-input",
              placeholder: $setup.t("chat.placeholder"),
              "confirm-type": "send",
              onConfirm: $setup.handleSend
            }, null, 40, ["placeholder"]), [
              [vue.vModelText, $setup.input]
            ]),
            vue.createElementVNode("button", {
              class: vue.normalizeClass(["send-btn", { active: $setup.input.trim() && !$setup.isSending }]),
              disabled: !$setup.input.trim() || $setup.isSending,
              onClick: _cache[6] || (_cache[6] = ($event) => $setup.bindAnalyticsTap("chat-send", $setup.handleSend, "发送消息"))
            }, " ➤ ", 10, ["disabled"])
          ])
        ]),
        vue.createVNode($setup["AppConfirmDialog"], {
          open: $setup.showClearConfirm,
          "onUpdate:open": _cache[7] || (_cache[7] = ($event) => $setup.showClearConfirm = $event),
          title: $setup.t("chat.clearMessages"),
          description: $setup.t("chat.confirmClearMessages"),
          destructive: "",
          onConfirm: $setup.handleClearMessages
        }, null, 8, ["open", "title", "description"])
      ]),
      _: 1
      /* STABLE */
    }));
  }
  const PagesChatIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-5a559478"], ["__file", "/Users/zeas/Desktop/client-uniii/pages/chat/index.vue"]]);
  __definePage("pages/login/index", PagesLoginIndex);
  __definePage("pages/register/index", PagesRegisterIndex);
  __definePage("pages/home/index", PagesHomeIndex);
  __definePage("pages/messages/index", PagesMessagesIndex);
  __definePage("pages/discover/index", PagesDiscoverIndex);
  __definePage("pages/profile/index", PagesProfileIndex);
  __definePage("pages/chat/index", PagesChatIndex);
  const _sfc_main = {
    __name: "App",
    setup(__props, { expose: __expose }) {
      __expose();
      onLaunch(() => {
        var _a2;
        const chat2 = useChatStore();
        vue.watch(
          () => i18n.global.locale.value,
          () => chat2.onLanguageChanged()
        );
        setupGlobalButtonTracking();
        const pages = getCurrentPages();
        const route = ((_a2 = pages[0]) == null ? void 0 : _a2.route) || "";
        const publicRoutes = ["pages/login/index", "pages/register/index"];
        if (!isLoggedIn() && !publicRoutes.some((r) => route.includes(r)))
          ;
        trackCurrentPageIfChanged();
      });
      onShow(() => {
        useChatStore().onAppShow();
        trackCurrentPageIfChanged();
      });
      onHide(() => {
        void flushAnalyticsQueue();
      });
      const __returned__ = { get onLaunch() {
        return onLaunch;
      }, get onShow() {
        return onShow;
      }, get onHide() {
        return onHide;
      }, get useChatStore() {
        return useChatStore;
      }, get i18n() {
        return i18n;
      }, watch: vue.watch, get isLoggedIn() {
        return isLoggedIn;
      }, get setupGlobalButtonTracking() {
        return setupGlobalButtonTracking;
      }, get trackCurrentPageIfChanged() {
        return trackCurrentPageIfChanged;
      }, get flushAnalyticsQueue() {
        return flushAnalyticsQueue;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.createCommentVNode(" 勿放占位 view：H5 上可能叠在页面上方拦截点击/输入 ");
  }
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/zeas/Desktop/client-uniii/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    const pinia = createPinia();
    app.use(pinia);
    app.use(i18n);
    const chat2 = useChatStore();
    chat2.setupLifecycle();
    chat2.watchPersistEffects();
    useThemeStore();
    return { app };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
