class HttpHeaders {
  constructor(init = {}) {
    this._h = {};
    for (const [k, v] of Object.entries(init)) {
      this._h[k.toLowerCase()] = v;
    }
  }
  get(name) {
    return this._h[name.toLowerCase()] ?? null;
  }
}

class HttpClient {}

module.exports = { HttpHeaders, HttpClient };
