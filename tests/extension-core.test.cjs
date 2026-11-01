const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../extension/chrome/core.js");

const user = (id, username = `user${id}`) => ({
  id: String(id),
  username,
  full_name: username,
});

function verifiedSnapshot({ viewerId = "viewer-1", following = [], followers = [], createdAt = Date.now() }) {
  const scan = (users) => ({
    complete: true,
    viewerId: String(viewerId),
    pages: 1,
    count: users.length,
    completedAt: createdAt,
  });
  return core.buildSnapshot({
    viewerId,
    following,
    followers,
    createdAt,
    scan: { following: scan(following), followers: scan(followers) },
  });
}

test("history separates lost followers who remain followed from accounts gone on both sides", () => {
  const previous = verifiedSnapshot({
    viewerId: "viewer-1",
    following: [user("a"), user("b"), user("c"), user("d")],
    followers: [user("a"), user("b"), user("c"), user("d")],
    createdAt: 100,
  });
  const current = verifiedSnapshot({
    viewerId: "viewer-1",
    following: [user("a"), user("c"), user("d")],
    followers: [user("a"), user("d"), user("e")],
    createdAt: 200,
  });

  const diff = core.diffSnapshots(previous, current);

  assert.deepEqual(diff.followers.removed.map((entry) => entry.id), ["b", "c"]);
  assert.deepEqual(diff.lostStillFollowing.map((entry) => entry.id), ["c"]);
  assert.deepEqual(diff.bothRemoved.map((entry) => entry.id), ["b"]);
  assert.deepEqual(diff.followers.added.map((entry) => entry.id), ["e"]);
  assert.deepEqual(diff.following.removed.map((entry) => entry.id), ["b"]);
});

test("snapshot membership fingerprint ignores list order and profile-name changes", () => {
  const first = {
    following: [["2", "old_name", "Old Name"], ["1", "one", "One"]],
    followers: [["3", "three", "Three"]],
  };
  const second = {
    following: [["1", "one", "One"], ["2", "new_name", "New Name"]],
    followers: [["3", "three_updated", "Three Updated"]],
  };

  assert.equal(
    core.snapshotMembershipFingerprint(first),
    core.snapshotMembershipFingerprint(second)
  );
});

test("the first snapshot is a baseline and is not diffed", () => {
  const diff = core.diffSnapshots(null, core.buildSnapshot({
    viewerId: "viewer-1",
    following: [user("1")],
    followers: [user("2")],
  }));

  assert.equal(diff.comparable, false);
  assert.deepEqual(diff.lostStillFollowing, []);
  assert.deepEqual(diff.bothRemoved, []);
});

test("relationship states no longer expose an unfollow action", () => {
  assert.equal(core.getRelationshipState({
    followed_by_viewer: true,
    follows_viewer: true,
  }).action, null);

  assert.equal(core.getRelationshipState({
    followed_by_viewer: true,
    follows_viewer: false,
  }).action, null);

  assert.equal(core.getRelationshipState({
    requested_by_viewer: true,
  }).action, null);

  assert.equal(core.getRelationshipState({
    followed_by_viewer: false,
    follows_viewer: true,
  }).action, "follow");
});

function makeTransport(pages) {
  let requestCount = 0;
  const env = {
    location: { origin: "https://www.instagram.com" },
    document: {
      cookie: "ds_user_id=12345; csrftoken=test",
      body: { innerHTML: "" },
    },
    sessionStorage: { getItem: () => null },
    fetch: async (input) => {
      const url = new URL(input);
      const cursor = url.searchParams.get("max_id");
      const page = pages({ cursor, requestCount });
      requestCount += 1;
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => page,
      };
    },
  };

  return require("../extension/chrome/instagram-api.js").createTransport(env);
}

test("connection scan rejects a repeated cursor rather than caching a partial list", async () => {
  const transport = makeTransport(({ cursor }) => cursor
    ? { users: [{ pk: "2" }], has_more: true, next_max_id: "page-2" }
    : { users: [{ pk: "1" }], has_more: true, next_max_id: "page-2" });

  await assert.rejects(
    transport.requestConnections("Followers", null, { pageDelayMs: 0 }),
    /repeated a pagination cursor/
  );
});

test("connection scan rejects a server response that promises another page without a cursor", async () => {
  const transport = makeTransport(() => ({
    users: [{ pk: "1" }],
    has_more: true,
  }));

  await assert.rejects(
    transport.requestConnections("Following", null, { pageDelayMs: 0 }),
    /reported more pages but returned no cursor/
  );
});

test("connection scan returns the complete list when pagination ends normally", async () => {
  const transport = makeTransport(({ cursor }) => cursor
    ? { users: [{ pk: "2" }], has_more: false }
    : { users: [{ pk: "1" }], has_more: true, next_max_id: "page-2" });

  const result = await transport.requestConnections("Following", null, { pageDelayMs: 0 });

  assert.deepEqual(result.users.map((entry) => String(entry.pk)), ["1", "2"]);
  assert.equal(result.pages, 2);
});

test("relationship states with no available action have no action label", () => {
  const states = [
    { requested_by_viewer: true },
    { followed_by_viewer: true, follows_viewer: true },
    { followed_by_viewer: true, follows_viewer: false },
  ];

  for (const input of states) {
    const state = core.getRelationshipState(input);
    assert.equal(state.action, null);
    assert.equal(state.labelKey, null);
  }
});

test("customer sources contain no legacy Unfollow controls, storage or endpoints", () => {
  const fs = require("node:fs");
  const files = [
    "../extension/chrome/core.js",
    "../extension/chrome/instagram-api.js",
    "../extension/chrome/script.js",
    "../extension/chrome/html.js",
    "../extension/chrome/background.js",
    "../extension/chrome/style.css",
  ];
  const forbidden = /unfollowUser|ACTION_PROVIDERS\.unfollow|data-action=["']unfollow["']|confirmDialog|acceptConfirmButton|followUnfollowAttempts|unfollowSelected|actionUnfollow|unfollowingLoading|tabYouUnfollowed|youUnfollowedNote|labelKey:\s*["']unfollow["']/i;

  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(require("node:path").join(__dirname, file), "utf8"), forbidden, file);
  }
});

test("history labels describe list membership instead of claiming a deliberate Unfollow", () => {
  const fs = require("node:fs");
  const source = fs.readFileSync(require("node:path").join(__dirname, "../extension/chrome/script.js"), "utf8");
  assert.match(source, /tabFollowingRemoved: "No longer in your Following list"/);
  assert.match(source, /followingRemovedNote: "These accounts are no longer present in your Following list/);
  assert.doesNotMatch(source, /tabYouUnfollowed|youUnfollowedNote/);
});


test("nested Instagram user envelopes preserve real account IDs and reject invalid IDs", () => {
  const normalized = core.normalizeConnectionUser({
    user: { pk: "987654321", username: "long_followed_account", full_name: "Long Followed" },
  }, "Following");
  assert.equal(normalized.id, "987654321");
  assert.equal(normalized.username, "long_followed_account");
  assert.equal(normalized.followed_by_viewer, true);
  assert.equal(core.normalizeConnectionUser({ username: "missing-id" }, "Following"), null);
  assert.deepEqual(core.compactSnapshotUsers([
    { user: { pk: "987654321", username: "long_followed_account" } },
    { id: "undefined", username: "broken" },
    { pk: "987654321", username: "duplicate" },
  ]), [["987654321", "long_followed_account", ""]]);
});

test("a long-followed account present in both complete scans is never reported as new in Following", () => {
  const previous = verifiedSnapshot({
    viewerId: "viewer-1",
    following: [user("987654321", "old_username"), user("2")],
    followers: [user("3")],
    createdAt: 100,
  });
  const current = verifiedSnapshot({
    viewerId: "viewer-1",
    following: [user("2"), user("987654321", "renamed_username")],
    followers: [user("3")],
    createdAt: 200,
  });

  const diff = core.diffSnapshots(previous, current);
  assert.equal(diff.comparable, true);
  assert.deepEqual(diff.following.added, []);
  assert.deepEqual(diff.following.removed, []);
});

test("legacy snapshots without integrity proof are not compared with complete scans", () => {
  const legacy = core.buildSnapshot({
    viewerId: "viewer-1",
    following: [user("987654321")],
    followers: [user("2")],
    createdAt: 100,
  });
  const current = verifiedSnapshot({
    viewerId: "viewer-1",
    following: [user("987654321"), user("3")],
    followers: [user("2")],
    createdAt: 200,
  });

  const diff = core.diffSnapshots(legacy, current);
  assert.equal(core.isSnapshotComplete(legacy), false);
  assert.equal(diff.comparable, false);
  assert.equal(diff.reason, "unverified");
  assert.deepEqual(diff.following.added, []);
});

test("complete snapshots from different Instagram accounts are not compared", () => {
  const previous = verifiedSnapshot({
    viewerId: "viewer-1",
    following: [user("1")],
    followers: [user("2")],
    createdAt: 100,
  });
  const current = verifiedSnapshot({
    viewerId: "viewer-2",
    following: [user("1"), user("3")],
    followers: [user("2")],
    createdAt: 200,
  });

  const diff = core.diffSnapshots(previous, current);
  assert.equal(diff.comparable, false);
  assert.equal(diff.reason, "different-viewer");
});

test("snapshot integrity rejects counts that do not match captured account IDs", () => {
  const snapshot = verifiedSnapshot({
    following: [user("1")],
    followers: [user("2")],
  });
  snapshot.integrity.following.count = 2;
  assert.equal(core.isSnapshotComplete(snapshot), false);
});

test("connection scan rejects an ambiguous final page instead of treating it as complete", async () => {
  const transport = makeTransport(() => ({ users: [{ pk: "1" }] }));
  await assert.rejects(
    transport.requestConnections("Following", null, { pageDelayMs: 0 }),
    /did not provide a reliable pagination end signal/
  );
});

test("connection scan accepts nested pagination page_info and records a verified completion", async () => {
  const transport = makeTransport(({ cursor }) => cursor
    ? { users: [{ user: { pk: "2" } }], pagination: { page_info: { has_next_page: false } } }
    : { users: [{ user: { pk: "1" } }], pagination: { page_info: { has_next_page: true, end_cursor: "page-2" } } });

  const result = await transport.requestConnections("Following", null, { pageDelayMs: 0 });
  assert.equal(result.complete, true);
  assert.equal(result.count, 2);
  assert.equal(result.pages, 2);
  assert.deepEqual(result.users.map((entry) => entry.user.pk), ["1", "2"]);
});

test("history UI does not describe list-membership changes as a confirmed Follow action", () => {
  const fs = require("node:fs");
  const source = fs.readFileSync(require("node:path").join(__dirname, "../extension/chrome/script.js"), "utf8");
  assert.match(source, /tabFollowingAdded: "New in Following"/);
  assert.match(source, /followingAddedNote: "These accounts appear in this complete Following snapshot/);
  assert.match(source, /does not prove when or whether you tapped Follow/);
  assert.doesNotMatch(source, /tabYouFollowed|youFollowedNote/);
});

test("connection scan rejects accounts without a stable user ID instead of silently dropping them", async () => {
  const transport = makeTransport(() => ({
    users: [{ pk: "valid-1" }, { username: "missing-id" }],
    has_more: false,
  }));

  await assert.rejects(
    transport.requestConnections("Following", null, { pageDelayMs: 0 }),
    /without a stable ID/
  );
});

test("connection scan deduplicates nested GraphQL node IDs", async () => {
  const transport = makeTransport(() => ({
    users: [
      { node: { pk: "graph-55", username: "first" } },
      { node: { pk: "graph-55", username: "duplicate" } },
    ],
    has_more: false,
  }));

  const result = await transport.requestConnections("Following", null, { pageDelayMs: 0 });
  assert.equal(result.count, 1);
  assert.equal(result.users[0].node.pk, "graph-55");
});

test("local storage bridge keeps Snapshot History isolated by Instagram account", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const background = fs.readFileSync(path.join(__dirname, "../extension/chrome/background.js"), "utf8");
  const bridge = fs.readFileSync(path.join(__dirname, "../extension/chrome/html.js"), "utf8");

  assert.match(background, /snapshot\?\.viewerId\s*&&\s*String\(snapshot\.viewerId\)\s*===\s*accountId/);
  assert.match(bridge, /snapshot\?\.viewerId\s*&&\s*String\(snapshot\.viewerId\)\s*===\s*accountId/);
  assert.match(bridge, /otherAccountSnapshots/);
});

test("Snapshot compaction reads nested GraphQL node IDs", () => {
  assert.deepEqual(
    core.compactSnapshotUsers([{ node: { id: "graph-77", username: "graph_user" } }]),
    [["graph-77", "graph_user", ""]]
  );
});
