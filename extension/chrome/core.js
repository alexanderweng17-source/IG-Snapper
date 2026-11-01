(function exposeManageInstagramFollowersCore(root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  if (root) root.ManageInstagramFollowersCore = core;
})(typeof window !== "undefined" ? window : globalThis, function createCore() {
  function normalizeConnectionUser(user, type) {
    const envelope = user && typeof user === "object" ? user : {};
    const nested = envelope.user && typeof envelope.user === "object"
      ? envelope.user
      : envelope.node && typeof envelope.node === "object"
      ? envelope.node
      : envelope;
    const rawId = nested.id ?? nested.pk ?? envelope.id ?? envelope.pk;
    const id = rawId == null ? "" : String(rawId).trim();
    if (!id || id === "undefined" || id === "null") return null;

    const friendship = nested.friendship_status || envelope.friendship_status || {};
    return {
      ...envelope,
      ...nested,
      id,
      followed_by_viewer:
        nested.followed_by_viewer ?? envelope.followed_by_viewer ?? friendship.following ?? type === "Following",
      follows_viewer:
        nested.follows_viewer ?? envelope.follows_viewer ?? friendship.followed_by ?? type === "Followers",
      requested_by_viewer:
        nested.requested_by_viewer ?? envelope.requested_by_viewer ?? friendship.outgoing_request ?? false,
    };
  }

  function getRelationshipState(user) {
    if (user.requested_by_viewer) {
      return {
        infoKey: "requestSent",
        labelKey: null,
        action: null,
        tone: "requested",
      };
    }
    if (user.followed_by_viewer && user.follows_viewer) {
      return {
        infoKey: "mutual",
        labelKey: null,
        action: null,
        tone: "mutual",
      };
    }
    if (user.followed_by_viewer && !user.follows_viewer) {
      return {
        infoKey: "notFollowingYou",
        labelKey: null,
        action: null,
        tone: "nonFollower",
      };
    }
    if (!user.followed_by_viewer && user.follows_viewer) {
      return {
        infoKey: "youDontFollow",
        labelKey: "followBack",
        action: "follow",
        tone: "notFollowedBack",
      };
    }
    return {
      infoKey: "neither",
      labelKey: "follow",
      action: "follow",
      tone: "none",
    };
  }

  function filterUsers(users, filter) {
    if (filter === "notFollowingBack") {
      return users.filter(
        (user) => user.followed_by_viewer && !user.follows_viewer
      );
    }
    if (filter === "mutual") {
      return users.filter(
        (user) => user.followed_by_viewer && user.follows_viewer
      );
    }
    if (filter === "notFollowedBack") {
      return users.filter(
        (user) => !user.followed_by_viewer && user.follows_viewer
      );
    }
    if (filter === "requested") {
      return users.filter((user) => user.requested_by_viewer);
    }
    return [...users];
  }

  function sortUsers(users, sort, locale = "en") {
    const collator = new Intl.Collator(locale, { sensitivity: "base" });
    const result = [...users];
    if (sort === "username") {
      return result.sort((a, b) => collator.compare(a.username, b.username));
    }
    if (sort === "ratio") {
      return sortByRatio(result);
    }
    if (sort === "name") {
      return result.sort((a, b) =>
        collator.compare(a.full_name || a.username, b.full_name || b.username)
      );
    }
    if (sort === "relationship") {
      const order = {
        nonFollower: 0,
        notFollowedBack: 1,
        requested: 2,
        mutual: 3,
        none: 4,
      };
      return result.sort((a, b) => {
        const difference =
          order[getRelationshipState(a).tone] -
          order[getRelationshipState(b).tone];
        return difference || collator.compare(a.username, b.username);
      });
    }
    return result;
  }

  function countRelationships(users) {
    return users.reduce(
      (counts, user) => {
        counts.all += 1;
        const tone = getRelationshipState(user).tone;
        if (tone === "nonFollower") counts.notFollowingBack += 1;
        if (tone === "mutual") counts.mutual += 1;
        if (tone === "notFollowedBack") counts.notFollowedBack += 1;
        if (tone === "requested") counts.requested += 1;
        return counts;
      },
      {
        all: 0,
        notFollowingBack: 0,
        mutual: 0,
        notFollowedBack: 0,
        requested: 0,
      }
    );
  }

  function reconcileConnectionMaps(following, followers) {
    [following, followers].forEach((connections) => {
      connections?.forEach((user) => {
        if (following) user.followed_by_viewer = following.has(user.id);
        if (followers) user.follows_viewer = followers.has(user.id);
      });
    });
    return { following, followers };
  }

  function responseMatchesFriendshipAction(data, action) {
    const relationship = data?.friendship_status || data;
    const following = relationship?.following;
    const outgoingRequest = relationship?.outgoing_request;
    return action === "follow"
      ? following === true || outgoingRequest === true
      : following === false && outgoingRequest !== true;
  }


  function getAccountSignals(user) {
    const followerCount = Number(
      user.follower_count ?? user.followers_count ?? user?.edge_followed_by?.count ?? NaN
    );
    const followingCount = Number(
      user.following_count ?? user.follows_count ?? user?.edge_follow?.count ?? NaN
    );
    const mediaCount = Number(
      user.media_count ?? user.posts_count ?? user?.edge_owner_to_timeline_media?.count ?? NaN
    );
    const ratio = Number.isFinite(followerCount) && Number.isFinite(followingCount) && followingCount > 0
      ? followerCount / followingCount
      : null;
    return {
      verified: Boolean(user.is_verified || user.verified),
      private: Boolean(user.is_private || user.private),
      followerCount: Number.isFinite(followerCount) ? followerCount : null,
      followingCount: Number.isFinite(followingCount) ? followingCount : null,
      mediaCount: Number.isFinite(mediaCount) ? mediaCount : null,
      followerFollowingRatio: ratio,
    };
  }

  function compactSnapshotUsers(users = []) {
    const seen = new Set();
    return users.reduce((result, user) => {
      const rawId = user?.id ?? user?.pk ?? user?.user?.id ?? user?.user?.pk ?? user?.node?.id ?? user?.node?.pk;
      const id = rawId == null ? "" : String(rawId).trim();
      if (!id || id === "undefined" || id === "null" || seen.has(id)) return result;
      seen.add(id);
      result.push([
        id,
        String(user?.username ?? user?.user?.username ?? user?.node?.username ?? ""),
        String(user?.full_name ?? user?.user?.full_name ?? user?.node?.full_name ?? ""),
      ]);
      return result;
    }, []);
  }

  function isSnapshotComplete(snapshot) {
    if (
      !snapshot ||
      snapshot.schemaVersion !== 2 ||
      snapshot.integrity?.complete !== true ||
      snapshot.integrity?.schemaVersion !== 2 ||
      !snapshot.viewerId ||
      !Array.isArray(snapshot.following) ||
      !Array.isArray(snapshot.followers)
    ) return false;

    return ["following", "followers"].every((key) => {
      const scan = snapshot.integrity[key];
      const list = snapshot[key];
      if (
        !scan ||
        scan.complete !== true ||
        String(scan.viewerId || "") !== String(snapshot.viewerId) ||
        !Number.isInteger(scan.pages) ||
        scan.pages < 1 ||
        scan.count !== list.length
      ) return false;

      const ids = new Set();
      for (const entry of list) {
        if (!Array.isArray(entry) || entry.length < 1) return false;
        const id = String(entry[0] ?? "").trim();
        if (!id || id === "undefined" || id === "null" || ids.has(id)) return false;
        ids.add(id);
      }
      return true;
    });
  }

  function buildSnapshot({ viewerId, following = [], followers = [], scan = null, createdAt = Date.now() }) {
    const accountId = viewerId == null ? "" : String(viewerId).trim();
    const compactFollowing = compactSnapshotUsers(following);
    const compactFollowers = compactSnapshotUsers(followers);
    const integrity = {
      schemaVersion: 2,
      complete: Boolean(accountId && scan?.following?.complete === true && scan?.followers?.complete === true),
      following: scan?.following || null,
      followers: scan?.followers || null,
    };
    const snapshot = {
      id: `${accountId || "unknown"}:${createdAt}`,
      viewerId: accountId || null,
      schemaVersion: 2,
      integrity,
      createdAt,
      following: compactFollowing,
      followers: compactFollowers,
    };
    if (isSnapshotComplete(snapshot)) return snapshot;
    integrity.complete = false;
    return snapshot;
  }

  function snapshotMap(list = []) {
    return new Map(
      list
        .filter(Array.isArray)
        .map(([id, username = "", fullName = ""]) => [
          String(id),
          { id: String(id), username: String(username || ""), full_name: String(fullName || "") },
        ])
    );
  }

  function diffSnapshotLists(previous = [], current = []) {
    const oldMap = snapshotMap(previous);
    const newMap = snapshotMap(current);
    const added = [];
    const removed = [];
    for (const [id, user] of newMap) if (!oldMap.has(id)) added.push(user);
    for (const [id, user] of oldMap) if (!newMap.has(id)) removed.push(user);
    return { added, removed };
  }

  function snapshotMembershipFingerprint(snapshot) {
    const ids = (list = []) => list
      .map((entry) => Array.isArray(entry) ? entry[0] : entry?.id ?? entry?.pk)
      .map((id) => String(id ?? "").trim())
      .filter(Boolean)
      .sort();
    return JSON.stringify([ids(snapshot?.following), ids(snapshot?.followers)]);
  }

  function diffSnapshots(previous, current) {
    const emptyDiff = (reason) => ({
      comparable: false,
      reason,
      following: { added: [], removed: [] },
      followers: { added: [], removed: [] },
      lostStillFollowing: [],
      bothRemoved: [],
    });
    if (!previous || !current) return emptyDiff("baseline");
    if (!isSnapshotComplete(previous) || !isSnapshotComplete(current)) {
      return emptyDiff("unverified");
    }
    if (String(previous.viewerId) !== String(current.viewerId)) {
      return emptyDiff("different-viewer");
    }

    const following = diffSnapshotLists(previous.following, current.following);
    const followers = diffSnapshotLists(previous.followers, current.followers);
    const currentFollowingIds = new Set(snapshotMap(current.following).keys());
    const removedFollowingIds = new Set(following.removed.map((user) => String(user.id)));

    return {
      comparable: true,
      reason: null,
      following,
      followers,
      // Accounts that stopped following the viewer but remain in the viewer's
      // current Following list. This is derived from the current snapshot, not
      // the live cache, so old history remains correct after an app restart.
      lostStillFollowing: followers.removed.filter((user) => currentFollowingIds.has(String(user.id))),
      // Accounts removed from both sides between the same two complete snapshots.
      bothRemoved: followers.removed.filter((user) => removedFollowingIds.has(String(user.id))),
    };
  }

  function filterBySignal(users, filter, protectedIds = new Set()) {
    if (!filter || filter === "all") return [...users];
    if (filter === "protected") return users.filter((user) => protectedIds.has(String(user.id)));
    if (filter === "verified") return users.filter((user) => getAccountSignals(user).verified);
    if (filter === "private") return users.filter((user) => getAccountSignals(user).private);
    if (filter === "highRatio") {
      return users.filter((user) => {
        const ratio = getAccountSignals(user).followerFollowingRatio;
        return ratio != null && ratio >= 5;
      });
    }
    return [...users];
  }

  function sortByRatio(users) {
    return [...users].sort((a, b) => {
      const ar = getAccountSignals(a).followerFollowingRatio;
      const br = getAccountSignals(b).followerFollowingRatio;
      if (ar == null && br == null) return String(a.username || "").localeCompare(String(b.username || ""));
      if (ar == null) return 1;
      if (br == null) return -1;
      return br - ar;
    });
  }

  return {
    buildSnapshot,
    compactSnapshotUsers,
    countRelationships,
    diffSnapshots,
    diffSnapshotLists,
    isSnapshotComplete,
    filterUsers,
    getAccountSignals,
    getRelationshipState,
    filterBySignal,
    normalizeConnectionUser,
    reconcileConnectionMaps,
    responseMatchesFriendshipAction,
    snapshotMap,
    snapshotMembershipFingerprint,
    sortByRatio,
    sortUsers,
  };
});
