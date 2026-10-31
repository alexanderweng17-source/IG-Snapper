const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../extension/chrome/core.js");

const user = (id, username = `user${id}`) => ({
  id: String(id),
  username,
  full_name: username,
});

test("history separates lost followers who remain followed from accounts gone on both sides", () => {
  const previous = core.buildSnapshot({
    viewerId: "viewer-1",
    following: [user("a"), user("b"), user("c"), user("d")],
    followers: [user("a"), user("b"), user("c"), user("d")],
    createdAt: 100,
  });
  const current = core.buildSnapshot({
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
