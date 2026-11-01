(function exposeManageInstagramFollowersTransport(root, factory) {
  const transport = factory(root || globalThis);
  if (typeof module === "object" && module.exports) module.exports = transport;
  if (root) root.ManageInstagramFollowersTransport = transport;
})(typeof window !== "undefined" ? window : globalThis, function createTransport(env) {
  const VIEWER_PROVIDERS = [
    {
      id: "instagram-web-account-self",
      build: () => `${env.location.origin}/api/v1/accounts/edit/web_form_data/`,
    },
    {
      id: "instagram-web-current-user",
      build: () => `${env.location.origin}/api/v1/accounts/current_user/?edit=true`,
    },
    {
      id: "instagram-i-current-user",
      build: () => `https://i.instagram.com/api/v1/accounts/current_user/?edit=true`,
    },
  ];

  const LIST_PROVIDERS = [
    {
      id: "instagram-web-rest-v1",
      build: (type, viewerId, params) =>
        `${env.location.origin}/api/v1/friendships/${viewerId}/${type.toLowerCase()}/?${params}` ,
    },
    {
      id: "instagram-i-rest-v1",
      build: (type, viewerId, params) =>
        `https://i.instagram.com/api/v1/friendships/${viewerId}/${type.toLowerCase()}/?${params}` ,
    },
  ];

  const ACTION_PROVIDERS = {
    follow: [
      {
        id: "instagram-web-follow-v1",
        build: (userId) => ({
          endpoint: `${env.location.origin}/api/v1/friendships/create/${userId}/`,
          body: new URLSearchParams({
            container_module: "profile",
            include_follow_friction_check: "true",
            nav_chain: "PolarisFeedRoot:feedPage:1:via_cold_start",
            user_id: userId,
          }),
        }),
      },
    ],
    verify: [
      {
        id: "instagram-web-friendship-show-v1",
        build: (userId) =>
          `${env.location.origin}/api/v1/friendships/show/${userId}/`,
      },
      {
        id: "instagram-i-friendship-show-v1",
        build: (userId) =>
          `https://i.instagram.com/api/v1/friendships/show/${userId}/`,
      },
    ],
  };

  let preferredListProviderId = null;
  const preferredActionProviderIds = new Map();
  let lastNetwork = null;
  let resolvedViewerId = null;
  let resolvingViewerPromise = null;

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function readCookie(name) {
    const cookie = String(env.document?.cookie || "");
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`, "i"));
    return match ? safeDecode(match[1]) : null;
  }

  // Serialising Instagram's whole DOM is expensive and buildHeaders() used to do
  // it ~6 times per request. Cache the markup briefly so paging stays fast.
  let bodyHtmlCache = { at: 0, html: "" };
  function getBodyHtml() {
    const now = Date.now();
    if (!bodyHtmlCache.html || now - bodyHtmlCache.at > 15000) {
      bodyHtmlCache = { at: now, html: String(env.document?.body?.innerHTML || "") };
    }
    return bodyHtmlCache.html;
  }

  function readBodyValue(pattern) {
    const match = getBodyHtml().match(pattern);
    return match ? match[1] : null;
  }

  const REQUEST_TIMEOUT_MS = 20000;
  const MAX_PAGES = 600;
  const PAGE_RETRIES = 3;
  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(makeAbortError());
      let timer;
      const cleanup = () => signal?.removeEventListener("abort", onAbort);
      const onAbort = () => {
        clearTimeout(timer);
        cleanup();
        reject(makeAbortError());
      };
      timer = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  function makeAbortError() {
    const error = new Error("Cancelled");
    error.name = "AbortError";
    return error;
  }

  function extractViewerIdFromPayload(data) {
    const candidates = [
      data?.user?.pk,
      data?.user?.id,
      data?.user?.user?.pk,
      data?.user?.user?.id,
      data?.data?.user?.pk,
      data?.data?.user?.id,
      data?.viewer?.pk,
      data?.viewer?.id,
      data?.config?.viewerId,
      data?.config?.viewer_id,
    ];
    const value = candidates.find((candidate) => candidate != null && String(candidate).trim() !== "");
    return value != null ? String(value) : null;
  }

  function getViewerId() {
    const cookieViewerId = readCookie("ds_user_id");
    if (cookieViewerId) return String(cookieViewerId);

    const direct =
      readBodyValue(/"viewerId":"(\w+)"/i) ||
      readBodyValue(/"viewer_id":"(\w+)"/i) ||
      readBodyValue(/"appScopedIdentity":"(\w+)"/i) ||
      readBodyValue(/"viewer_id":\s*"(\w+)"/i);

    if (direct) return direct;

    const sharedData = env.window?._sharedData || env._sharedData;
    const sharedViewerId =
      sharedData?.config?.viewerId ||
      sharedData?.config?.viewer_id ||
      sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.id;

    return sharedViewerId ? String(sharedViewerId) : null;
  }

  async function resolveViewerId() {
    const direct = getViewerId();
    if (direct) {
      resolvedViewerId = direct;
      return direct;
    }
    if (resolvedViewerId) return resolvedViewerId;
    if (resolvingViewerPromise) return resolvingViewerPromise;

    resolvingViewerPromise = (async () => {
      let lastError = null;
      for (const provider of VIEWER_PROVIDERS) {
        try {
          const endpoint = provider.build();
          const { response, data } = await requestJson(endpoint, {
            method: "GET",
            headers: { Accept: "application/json, text/plain, */*" },
          });
          if (!response.ok) {
            lastError = new Error(`Viewer lookup HTTP ${response.status}`);
            continue;
          }
          const viewer = extractViewerIdFromPayload(data);
          if (viewer) {
            resolvedViewerId = viewer;
            return viewer;
          }
          lastError = new Error(`Viewer ID missing in ${provider.id} response.`);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Instagram viewer ID is unavailable.");
    })().finally(() => {
      resolvingViewerPromise = null;
    });

    return resolvingViewerPromise;
  }

  function buildHeaders() {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      "X-Asbd-Id": readBodyValue(/"X-ASBD-ID":"([^"]+)"/i) || "129477",
      "X-Ig-Www-Claim":
        env.sessionStorage?.getItem("www-claim-v2") ||
        readBodyValue(/"wwwClaimV2":"([^"]+)"/i) ||
        "",
    };

    const csrfToken =
      readBodyValue(/(?<="csrf_token":").+?(?=")/i) || readCookie("csrftoken");
    if (csrfToken) headers["X-Csrftoken"] = csrfToken;

    headers["X-Ig-App-Id"] =
      readBodyValue(/(?<="X-IG-App-ID":").+?(?=")/i) ||
      readBodyValue(/"X-IG-App-ID":"([^"]+)"/i) ||
      "936619743392459";

    const rolloutHash =
      readBodyValue(/"rollout_hash":"([^"]+)"/i) ||
      readBodyValue(/"rolloutHash":"([^"]+)"/i);
    if (rolloutHash) headers["X-Instagram-Ajax"] = rolloutHash;

    return headers;
  }

  function findUsersArray(data) {
    const candidates = [
      data?.users,
      data?.items,
      data?.data?.users,
      data?.data?.items,
      data?.data?.followers?.users,
      data?.data?.following?.users,
    ];
    return candidates.find(Array.isArray) || null;
  }

  function findGraphQlEdges(data) {
    const candidates = [
      data?.data?.user?.edge_followed_by?.edges,
      data?.data?.user?.edge_follow?.edges,
    ];
    const edges = candidates.find(Array.isArray);
    return edges ? edges.map((edge) => edge?.node).filter(Boolean) : null;
  }

  function extractUsers(data) {
    const users = findUsersArray(data);
    if (users) return { users, shape: "array" };

    const edges = findGraphQlEdges(data);
    if (edges) return { users: edges, shape: "graphql-edges" };

    return { users: null, shape: null };
  }

  function getNextCursor(data) {
    const pageInfos = [
      data?.page_info,
      data?.pagination?.page_info,
      data?.data?.page_info,
      data?.data?.pagination?.page_info,
      data?.data?.user?.edge_followed_by?.page_info,
      data?.data?.user?.edge_follow?.page_info,
    ].filter(Boolean);

    const cursors = [
      data?.next_max_id,
      data?.pagination?.next_max_id,
      data?.data?.next_max_id,
      data?.next_cursor,
      data?.pagination_token,
      ...pageInfos.flatMap((pageInfo) => [
        pageInfo.end_cursor,
        pageInfo.next_max_id,
        pageInfo.next_cursor,
      ]),
    ];
    return cursors.find((value) => value != null && String(value).trim() !== "") ?? null;
  }

  function hasMore(data, cursor) {
    const pageInfos = [
      data?.page_info,
      data?.pagination?.page_info,
      data?.data?.page_info,
      data?.data?.pagination?.page_info,
      data?.data?.user?.edge_followed_by?.page_info,
      data?.data?.user?.edge_follow?.page_info,
    ].filter(Boolean);
    const flags = [
      data?.has_more,
      data?.more_available,
      data?.pagination?.has_more,
      data?.pagination?.more_available,
      data?.data?.has_more,
      data?.data?.more_available,
      ...pageInfos.map((pageInfo) => pageInfo.has_next_page ?? pageInfo.hasNextPage),
    ];

    // An explicit positive signal always wins. Without a positive or negative
    // terminal signal, a cursor means another page; no cursor is ambiguous.
    if (flags.some((flag) => flag === true)) return true;
    if (flags.some((flag) => flag === false)) return false;
    return cursor ? true : null;
  }

  function isUsableListPayload(data) {
    const extracted = extractUsers(data);
    if (!extracted.users) return false;
    return data?.status !== "fail" && data?.status !== "error";
  }

  function getOrderedProviders(providers, preferredId) {
    if (!preferredId) return providers;
    const preferred = providers.find((provider) => provider.id === preferredId);
    return preferred
      ? [preferred, ...providers.filter((provider) => provider.id !== preferredId)]
      : providers;
  }

  async function requestJson(endpoint, options = {}) {
    const { signal: outerSignal, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const onOuterAbort = () => controller.abort();
    if (outerSignal?.aborted) controller.abort();
    else outerSignal?.addEventListener("abort", onOuterAbort, { once: true });

    const requestOptions = {
      credentials: "include",
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...(fetchOptions.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...buildHeaders(),
        ...(fetchOptions.headers || {}),
      },
    };

    try {
      const response = await env.fetch(endpoint, requestOptions);
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      lastNetwork = { endpoint, status: response.status, ok: response.ok };
      return { response, data };
    } catch (error) {
      if (outerSignal?.aborted) throw makeAbortError();
      if (timedOut) {
        const timeoutError = new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
        timeoutError.code = "TIMEOUT";
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }

  async function requestConnectionPage(type, viewerId, params, preferredId, signal) {
    let lastError = null;

    for (const provider of getOrderedProviders(LIST_PROVIDERS, preferredId)) {
      const endpoint = provider.build(type, viewerId, params);
      try {
        const { response, data } = await requestJson(endpoint, { signal });
        if (!response.ok) {
          lastError = new Error(`HTTP Error: ${response.status}`);
          lastError.status = response.status;
          lastError.retryAfter = Number(response.headers?.get?.("retry-after")) || 0;
          continue;
        }

        if (!isUsableListPayload(data)) {
          lastError = new Error(
            `Unsupported Instagram response schema from ${provider.id}.`
          );
          continue;
        }

        const extracted = extractUsers(data);
        preferredListProviderId = provider.id;

        return {
          providerId: provider.id,
          users: extracted.users,
          shape: extracted.shape,
          nextCursor: getNextCursor(data),
          hasMore: hasMore(data, getNextCursor(data)),
          data,
          status: response.status,
          endpoint,
        };
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        lastError = error;
      }
    }

    throw (
      lastError ||
      new Error(`No compatible Instagram connection endpoint is available.`)
    );
  }

  function isRetryable(error) {
    if (!error || error.name === "AbortError") return false;
    if (error.code === "TIMEOUT") return true;
    if (error.status) return error.status === 429 || error.status >= 500;
    return error instanceof TypeError; // network failure
  }

  // One page with exponential back-off, so a 429 or a hiccup pauses instead of
  // leaving the UI "loading" forever or aborting the whole scan.
  async function requestConnectionPageWithRetry(type, viewerId, params, preferredId, signal, onRetry) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await requestConnectionPage(type, viewerId, params, preferredId, signal);
      } catch (error) {
        if (attempt >= PAGE_RETRIES || !isRetryable(error)) throw error;
        const wait = Math.max(error.retryAfter * 1000 || 0, 2000 * 2 ** attempt);
        onRetry?.({ attempt: attempt + 1, wait, status: error.status || null });
        await sleep(wait, signal);
      }
    }
  }

  async function requestConnections(type, onProgress, options = {}) {
    // A shorter, jittered gap improves large-list scans without removing the
    // exponential back-off used for 429s, timeouts, and transient server errors.
    const { signal, pageDelayMs = 150 } = options;
    const viewerId = await resolveViewerId();

    const users = [];
    const seen = new Set();
    const seenCursors = new Set();
    let nextCursor = null;
    let page = 0;
    let providerId = null;

    do {
      if (signal?.aborted) throw makeAbortError();
      // The current web friendships endpoints expect the follow-list surface
      // parameters. `count` is advisory and `max_id` is the REST cursor.
      const params = new URLSearchParams({
        count: "200",
        search_surface: "follow_list_page",
        query: "",
        includes_hashtags: "false",
        enable_groups: "true",
      });
      if (nextCursor) params.set("max_id", nextCursor);

      const result = await requestConnectionPageWithRetry(
        type,
        viewerId,
        params,
        providerId || preferredListProviderId,
        signal,
        (retry) => onProgress?.({ count: users.length, page, retry, type })
      );
      providerId = result.providerId;

      let added = 0;
      for (const rawUser of result.users) {
        const nested = rawUser?.user && typeof rawUser.user === "object"
          ? rawUser.user
          : rawUser?.node && typeof rawUser.node === "object"
          ? rawUser.node
          : rawUser;
        const rawId = nested?.id ?? nested?.pk ?? rawUser?.id ?? rawUser?.pk;
        const id = rawId == null ? "" : String(rawId).trim();
        if (!id || id === "undefined" || id === "null") {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: Instagram returned an account without a stable ID. No snapshot was recorded.`);
        }
        if (seen.has(id)) continue;
        seen.add(id);
        users.push(rawUser);
        added += 1;
      }

      page += 1;
      onProgress?.({
        type,
        count: users.length,
        page,
        providerId,
        endpoint: result.endpoint,
        shape: result.shape,
        nextCursor: result.nextCursor,
      });

      // Never cache or snapshot a partial list. These guards used to stop the
      // loop silently, which made missing pages look like genuine relationship changes.
      if (result.hasMore === null) {
        throw new Error(`Incomplete ${type.toLowerCase()} scan: Instagram did not provide a reliable pagination end signal. Refresh and retry; no history event was recorded.`);
      }
      if (result.hasMore === false) {
        nextCursor = null;
      } else {
        const cursor = result.nextCursor == null ? "" : String(result.nextCursor);
        if (!cursor) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: Instagram reported more pages but returned no cursor. Refresh and retry.`);
        }
        if (!added) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: a page contained no new accounts while more pages remained. Refresh and retry.`);
        }
        if (seenCursors.has(cursor)) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: Instagram repeated a pagination cursor. Refresh and retry.`);
        }
        if (page >= MAX_PAGES) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: the safety page limit was reached. Refresh and retry.`);
        }

        seenCursors.add(cursor);
        nextCursor = cursor;
        await sleep(pageDelayMs + Math.random() * 150, signal);
      }
    } while (nextCursor);

    return {
      users,
      providerId,
      pages: page,
      viewerId,
      count: users.length,
      complete: true,
      completedAt: Date.now(),
    };
  }

  async function requestAction(action, userId) {
    const providers = ACTION_PROVIDERS[action] || [];
    if (!providers.length) throw new Error(`Unsupported action: ${action}.`);
    const preferredId = preferredActionProviderIds.get(action);

    let lastError = null;
    for (const provider of getOrderedProviders(providers, preferredId)) {
      const request = provider.build(userId);
      try {
        const { response, data } = await requestJson(request.endpoint, {
          method: "POST",
          body: request.body,
        });

        if (!response.ok || data?.status === "fail") {
          lastError = {
            error: new Error(
              data?.feedback_message ||
                data?.message ||
                `HTTP ${response.status}`
            ),
            response,
            data,
            providerId: provider.id,
            endpoint: request.endpoint,
          };
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 429 ||
            data?.feedback_required ||
            data?.checkpoint_required
          ) {
            throw lastError;
          }
          continue;
        }

        preferredActionProviderIds.set(action, provider.id);
        return {
          data,
          response,
          providerId: provider.id,
          endpoint: request.endpoint,
        };
      } catch (error) {
        if (error?.error && error?.response) throw error;
        lastError = {
          error,
          response: error?.response || null,
          data: error?.data || null,
          providerId: provider.id,
          endpoint: request.endpoint,
        };
      }
    }

    throw (
      lastError || {
        error: new Error(`No compatible Instagram ${action} endpoint is available.`),
        response: null,
        data: null,
        providerId: null,
        endpoint: null,
      }
    );
  }

  async function verifyFriendshipAction(userId, action, matches) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000));

      const providers = ACTION_PROVIDERS.verify;
      for (const provider of getOrderedProviders(providers, "instagram-web-friendship-show-v1")) {
        try {
          const endpoint = provider.build(userId);
          const { response, data } = await requestJson(endpoint);
          if (!response.ok) continue;
          if (matches(data, action)) {
            return {
              matched: true,
              providerId: provider.id,
              endpoint,
              data,
            };
          }
        } catch {
          // Try the next verification provider.
        }
      }
    }

    return {
      matched: false,
      providerId: null,
      endpoint: lastNetwork?.endpoint || null,
      data: null,
    };
  }

  function getDiagnostics() {
    return {
      viewerAvailable: Boolean(getViewerId()),
      listProvider: preferredListProviderId,
      actionProviders: Object.fromEntries(preferredActionProviderIds),
      lastNetwork,
      providerCount: LIST_PROVIDERS.length,
      listProviders: LIST_PROVIDERS.map((provider) => provider.id),
    };
  }

  return {
    ACTION_PROVIDERS,
    createTransport: (customEnv = env) => createTransport(customEnv),
    LIST_PROVIDERS,
    VIEWER_PROVIDERS,
    buildHeaders,
    extractUsers,
    getDiagnostics,
    getNextCursor,
    getViewerId,
    extractViewerIdFromPayload,
    hasMore,
    isUsableListPayload,
    requestAction,
    requestConnections,
    resolveViewerId,
    requestJson,
    verifyFriendshipAction,
  };
});
