/*
 * Utility functions shared across the application.
 *
 * These helpers centralise logic used in multiple modules (admin, guide, etc.)
 * so that duplicate implementations can be removed from individual files.
 * All functions are exposed on the global `window` object to make them
 * available without requiring import statements.
 */

(() => {
  /**
   * Compute a stable 32‑bit FNV‑1a hash of a string and return a hex string.
   * This is used to detect when source text has changed and whether
   * translations need to be refreshed. The algorithm is deterministic and
   * fast for short strings.
   *
   * @param {string} input The string to hash.
   * @returns {string} A hexadecimal representation of the hash.
   */
  function hashString(input) {
    let h = 0x811c9dc5;
    const s = String(input ?? '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      // Multiply by FNV prime (mod 2^32)
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
  }

  /**
   * Recursively flatten a JSON object or array into an array of entries
   * containing a dot/bracket path and the associated string value. Only
   * string leaves are emitted; other types are ignored. The `_meta` key
   * on the root object is skipped as it contains translation metadata.
   *
   * @param {any} obj The current object or value being processed.
   * @param {string} prefix The path prefix up to this point.
   * @param {Array<{path: string, text: string}>} out The accumulator array.
   */
  function flattenJsonStrings(obj, prefix, out) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string') {
      out.push({ path: prefix, text: obj });
      return;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const p = prefix ? `${prefix}[${i}]` : `[${i}]`;
        flattenJsonStrings(obj[i], p, out);
      }
      return;
    }
    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        if (!k) continue;
        if (prefix === '' && k === '_meta') continue; // skip meta at root
        const p = prefix ? `${prefix}.${k}` : k;
        flattenJsonStrings(v, p, out);
      }
    }
  }

  /**
   * Retrieve a nested value from an object given a dot/bracket path. If any
   * component of the path is missing the function returns undefined. Both
   * dot notation (foo.bar) and array indices (arr[0]) are supported. Paths
   * containing invalid syntax are ignored and return undefined.
   *
   * @param {any} obj The object to traverse.
   * @param {string} path The path string, e.g. "a.b[0].c".
   * @returns {any} The value at the given path or undefined if not found.
   */
  function getNestedValue(obj, path) {
    if (!obj || typeof path !== 'string' || !path) return undefined;
    let cur = obj;
    const re = /([^\.\[\]]+)(\[\d+\])*/g;
    let match;
    let idx = 0;
    while ((match = re.exec(path)) !== null) {
      const key = match[1];
      if (cur === undefined || cur === null) return undefined;
      cur = cur[key];
      const bracketPart = match[2] || '';
      if (bracketPart) {
        const indices = bracketPart.match(/\[(\d+)\]/g) || [];
        for (const idxStr of indices) {
          const i = Number(idxStr.replace(/\[|\]/g, ''));
          if (!Array.isArray(cur) || i >= cur.length) return undefined;
          cur = cur[i];
        }
      }
    }
    return cur;
  }

  /**
   * Set a nested value on an object given a dot/bracket path. Missing
   * intermediate objects or arrays are created on demand. Paths containing
   * invalid syntax are ignored. Arrays will be created when a numeric index
   * is encountered in bracket notation.
   *
   * @param {any} obj The object to modify (mutated in place).
   * @param {string} path The path where the value should be set.
   * @param {any} value The value to assign at the given path.
   */
  function setNestedValue(obj, path, value) {
    if (!obj || typeof path !== 'string' || !path) return;
    const parts = [];
    const regex = /([^\.\[\]]+)(\[\d+\])*/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
      parts.push(match[1]);
      const indices = match[2] ? match[2].match(/\[(\d+)\]/g) : null;
      if (indices) {
        for (const idxStr of indices) {
          parts.push(Number(idxStr.replace(/\[|\]/g, '')));
        }
      }
    }
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        cur[key] = value;
        return;
      }
      const next = parts[i + 1];
      if (cur[key] === undefined || cur[key] === null) {
        cur[key] = typeof next === 'number' ? [] : {};
      }
      cur = cur[key];
    }
  }

  // Expose helpers globally so other scripts can use them without imports.
  if (typeof window !== 'undefined') {
    window.hashString = hashString;
    window.flattenJsonStrings = flattenJsonStrings;
    window.getNestedValue = getNestedValue;
    window.setNestedValue = setNestedValue;
  }
})();