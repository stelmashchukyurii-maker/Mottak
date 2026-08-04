(function (global) {
  "use strict";

  const DEFAULT_TIMEOUT_MS = 15000;
  const POLL_INTERVAL_MS = 5000;

  function makeError(message, details) {
    const error = new Error(message || "Ukjent Supabase-feil");
    if (details && typeof details === "object") Object.assign(error, details);
    return error;
  }

  async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw makeError(`Tilkoblingen fikk ikke svar innen ${Math.round(timeoutMs / 1000)} sekunder.`, { code: "TIMEOUT" });
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function parseResponse(response) {
    const text = await response.text();
    let body = null;
    if (text) {
      try { body = JSON.parse(text); }
      catch { body = text; }
    }

    if (!response.ok) {
      const message = body && typeof body === "object"
        ? body.message || body.error_description || body.hint || `HTTP ${response.status}`
        : body || `HTTP ${response.status}`;
      return {
        data: null,
        error: makeError(message, {
          status: response.status,
          code: body && typeof body === "object" ? body.code : undefined,
          details: body && typeof body === "object" ? body.details : undefined,
          hint: body && typeof body === "object" ? body.hint : undefined
        })
      };
    }

    return { data: body, error: null };
  }

  class QueryBuilder {
    constructor(client, table) {
      this.client = client;
      this.table = table;
      this.method = "GET";
      this.body = undefined;
      this.columns = "*";
      this.filters = [];
      this.orderBy = null;
      this.maxRows = null;
      this.wantSingle = false;
      this.returnRepresentation = false;
    }

    select(columns = "*") {
      this.columns = columns || "*";
      if (this.method !== "GET") this.returnRepresentation = true;
      return this;
    }

    insert(values) {
      this.method = "POST";
      this.body = values;
      this.returnRepresentation = true;
      return this;
    }

    update(values) {
      this.method = "PATCH";
      this.body = values;
      this.returnRepresentation = true;
      return this;
    }

    delete() {
      this.method = "DELETE";
      this.returnRepresentation = true;
      return this;
    }

    eq(column, value) {
      this.filters.push([column, `eq.${String(value)}`]);
      return this;
    }

    neq(column, value) {
      this.filters.push([column, `neq.${String(value)}`]);
      return this;
    }

    is(column, value) {
      const normalized = value === null ? "null" : String(value);
      this.filters.push([column, `is.${normalized}`]);
      return this;
    }

    order(column, options = {}) {
      this.orderBy = `${column}.${options.ascending === false ? "desc" : "asc"}`;
      return this;
    }

    limit(value) {
      this.maxRows = Number(value);
      return this;
    }

    single() {
      this.wantSingle = true;
      return this;
    }

    async execute() {
      const UrlConstructor = global.URL;
      if (typeof UrlConstructor !== "function") {
        return { data: null, error: makeError("Nettleseren mangler URL-støtte.", { code: "URL_UNAVAILABLE" }) };
      }

      const requestUrl = new UrlConstructor(`${this.client.url}/rest/v1/${encodeURIComponent(this.table)}`);
      if (this.columns) requestUrl.searchParams.set("select", this.columns);
      for (const [column, value] of this.filters) requestUrl.searchParams.append(column, value);
      if (this.orderBy) requestUrl.searchParams.set("order", this.orderBy);
      if (Number.isFinite(this.maxRows) && this.maxRows >= 0) requestUrl.searchParams.set("limit", String(this.maxRows));

      const headers = this.client.headers();
      if (this.returnRepresentation) headers.Prefer = "return=representation";

      const options = { method: this.method, headers };
      if (this.body !== undefined) options.body = JSON.stringify(this.body);

      try {
        const response = await fetchWithTimeout(requestUrl.toString(), options, this.client.timeoutMs);
        const result = await parseResponse(response);
        if (result.error) return result;

        let data = result.data;
        if (this.wantSingle) {
          if (Array.isArray(data)) data = data[0] || null;
          if (!data) return { data: null, error: makeError("Ingen rad ble returnert.", { code: "NO_ROWS" }) };
        }
        return { data, error: null };
      } catch (error) {
        return { data: null, error: makeError(error.message || String(error), { cause: error }) };
      }
    }

    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }
  }

  class PollingChannel {
    constructor(name) {
      this.name = name;
      this.callbacks = [];
      this.timer = null;
      this.stopped = false;
    }

    on(_eventType, _filter, callback) {
      if (typeof callback === "function") this.callbacks.push(callback);
      return this;
    }

    subscribe(statusCallback) {
      if (typeof statusCallback === "function") {
        setTimeout(() => {
          if (!this.stopped) statusCallback("SUBSCRIBED");
        }, 0);
      }

      this.timer = setInterval(() => {
        if (this.stopped || document.hidden) return;
        for (const callback of this.callbacks) {
          try { callback({ eventType: "POLL" }); }
          catch (error) { console.error("Supabase Lite polling callback", error); }
        }
      }, POLL_INTERVAL_MS);
      return this;
    }

    unsubscribe() {
      this.stopped = true;
      if (this.timer) clearInterval(this.timer);
      return Promise.resolve("ok");
    }
  }

  class SupabaseLiteClient {
    constructor(url, key, options = {}) {
      this.url = String(url || "").replace(/\/$/, "");
      this.key = String(key || "");
      this.timeoutMs = Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS;
    }

    headers() {
      return {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Client-Info": "bamavaremottak-supabase-lite/1.1"
      };
    }

    from(table) {
      return new QueryBuilder(this, table);
    }

    async rpc(functionName, args = {}) {
      const endpoint = `${this.url}/rest/v1/rpc/${encodeURIComponent(functionName)}`;
      try {
        const response = await fetchWithTimeout(endpoint, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(args)
        }, this.timeoutMs);
        return await parseResponse(response);
      } catch (error) {
        return { data: null, error: makeError(error.message || String(error), { cause: error }) };
      }
    }

    channel(name) {
      return new PollingChannel(name);
    }
  }

  global.supabase = {
    createClient(url, key, options = {}) {
      return new SupabaseLiteClient(url, key, options);
    }
  };
})(window);
