(() => {
window.__manageInstagramFollowersDispose?.();
const lifecycle = new AbortController();
window.__manageInstagramFollowersDispose = () => lifecycle.abort();
const core = window.ManageInstagramFollowersCore;
const instagramTransport = window.ManageInstagramFollowersTransport;

if (!core || !instagramTransport) {
  const root = document.getElementById("manage-instagram-followers-root");
  const target = root?.querySelector("#notice");
  const targetText = root?.querySelector("#noticeText");
  if (target && targetText) {
    targetText.textContent = "The extension could not start its Instagram connection layer. Reload Instagram and try again.";
    target.hidden = false;
    target.dataset.tone = "error";
  }
  console.error("IG Snapper bootstrap failed.", { core: Boolean(core), transport: Boolean(instagramTransport) });
  return;
}

const translations = {
  en: {
    appTitle: "IG Snapper",
    introTitle: "See who doesn’t follow you back.",
    introEyebrow: "Connection checkup",
    introBody:
      "Compare your connections, find non-followers, and review changes over time.",
    howItWorks: "How it works",
    stepCompare: "Compare",
    stepCompareDetail: "Followers and following",
    stepReview: "Review",
    stepReviewDetail: "See the relationship status",
    stepDecide: "History",
    stepDecideDetail: "Open the list of changes",
    privacyNote: "Your connection data stays in this browser.",
    backHome: "Back to start",
    followingTab: "Following",
    followersTab: "Followers",
    listsLabel: "Connection lists",
    close: "Close",
    dismiss: "Dismiss message",
    searchLabel: "Search accounts",
    searchPlaceholder: "Username or name",
    findNonFollowers: "Find non-followers",
    allFilter: "All",
    nonFollowersFilter: "Not following you",
    mutualFilter: "Mutual",
    notFollowedBackFilter: "You don’t follow",
    requestedFilter: "Requested",
    sortLabel: "Sort",
    sortRelationship: "Relationship",
    sortUsername: "Username",
    sortName: "Name",
    sortRatio: "Follower ratio",
    signalLabel: "Signals",
    signalAll: "All signals",
    signalProtected: "Saved",
    signalVerified: "Verified",
    signalPrivate: "Private",
    signalHighRatio: "High follower ratio",
    selectSafe: "Select safe",
    followersStat: "Followers",
    followingStat: "Following",
    mutualStat: "Mutual",
    nonFollowersStat: "Not following back",
    saveSnapshot: "Save snapshot",
    snapshotSaved: "Snapshot saved locally.",
    history: "History",
    historyTitle: "Scan history",
    historySubtitle: "History compares account membership between two complete scans. It is not an Instagram activity log and cannot prove when you tapped Follow.",
    closeHistory: "Close history",
    historyNoData: "No snapshots yet. Run a complete scan and save one.",
    historyFirst: "Baseline snapshot",
    historyUnverified: "Older snapshot — completeness cannot be verified",
    historyChanges: "+{added} new · −{removed} removed",
    followersGained: "Followers gained",
    followersLost: "Followers lost",
    followingAdded: "Following added",
    followingRemoved: "No longer in Following list",
    currentSnapshot: "Current snapshot",
    previousSnapshot: "Previous snapshot",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    backup: "Backup",
    restore: "Restore",
    exportDone: "Export created.",
    backupDone: "Backup created.",
    restoreDone: "Backup restored locally.",
    invalidBackup: "That backup file is not compatible.",
    protectedAccount: "Save account",
    unprotectedAccount: "Remove saved account",
    verifiedBadge: "Verified",
    privateBadge: "Private",
    ratioLabel: "Follower ratio: {ratio}",
    protectedHint: "Saved account",
    noHistoryChanges: "No changes since the previous snapshot.",
    refreshBeforeHistory: "Run a complete scan before comparing history.",
    historyDetailBack: "Back to history",
    viewChanges: "View who changed",
    tabLostFollowers: "No longer in your Followers list",
    tabLostStillFollowing: "You still follow them",
    tabRemovedBoth: "Gone from both lists",
    tabNewFollowers: "New followers",
    tabFollowingRemoved: "No longer in your Following list",
    tabFollowingAdded: "New in Following",
    detailEmpty: "Nobody in this group.",
    openProfile: "Open profile",
    youStillFollow: "You still follow them",
    youDontFollowBack: "You don’t follow back",
    lostNote: "These accounts disappeared from your Followers list. Instagram does not reveal whether they unfollowed, blocked you, or deactivated their account.",
    lostStillFollowingNote: "These accounts are no longer in your Followers list, but remain in your Following list. Instagram does not reveal why they disappeared.",
    removedBothNote: "These accounts disappeared from both your Followers and Following lists in this interval. Instagram does not reveal the reason.",
    newNote: "Accounts that started following you since the previous snapshot.",
    followingRemovedNote: "These accounts are no longer present in your Following list compared with the previous snapshot. This does not by itself prove why they disappeared.",
    followingAddedNote: "These accounts appear in this complete Following snapshot but not the previous complete snapshot. This only shows list membership changed between scans; it does not prove when or whether you tapped Follow.",
    copyUsernames: "Copy usernames",
    usernamesCopied: "Usernames copied.",
    lostFollowersAlert: "{count} accounts are no longer in your Followers list since the last snapshot. Open History to review the changes.",
    orbOpen: "Open IG Snapper",
    orbQuit: "Quit IG Snapper",
    noChanges: "No changes",
    peopleCount: "{count} accounts",
    refresh: "Refresh",
    updatedNow: "Updated just now",
    updatedMinutes: "Updated {count} min ago",
    loadingConnections: "Comparing your connections…",
    loadingPage: "Comparing your connections… {count} loaded",
    loadingBoth: "Following {following} · Followers {followers}",
    loadingRetry: "Instagram asked us to slow down. Retrying in {seconds}s…",
    cancelLoad: "Cancel",
    loadCancelled: "Loading cancelled.",
    licenseTitle: "Activate IG Snapper",
    licenseBody: "Enter your license key to unlock the app. One key works on 1 Instagram account and up to 2 browsers.",
    licenseActivate: "Activate",
    licenseChecking: "Checking…",
    licenseOk: "Activated. Thank you!",
    licenseOkUntil: "Activated until {date}.",
    licenseEmpty: "Please enter your key.",
    license_not_found: "Key not found. Check it and try again.",
    license_revoked: "This key has been disabled.",
    license_expired: "This key has expired. Ask the seller to renew it.",
    license_device_limit: "This key is already used on 2 browsers. Contact the seller to move it.",
    license_account_limit: "This key is already used on another Instagram account. Contact the seller to change it.",
    license_rate_limited: "Too many wrong attempts. Try again in a few minutes.",
    license_bad_request: "Could not verify the key. Reinstall the extension and try again.",
    license_offline: "Cannot reach the license server. Check your internet.",
    license_server_error: "License server error. Try again later.",
    license_not_configured: "License server is not configured in this build.",
    licenseLocked: "Activate a license key to use this feature.",
    licenseGetKey: "Get a key",
    licenseBannerText: "IG Snapper is not activated yet.",
    licenseBannerButton: "Enter key",
    licenseChipUntil: "Active until {date}",
    licenseChipForever: "Active",
    licenseChipSoon: "Expires in {days} d",
    licenseChipTitle: "License active. Click to change the key.",
    cancel: "Cancel",
    copyDiagnostics: "Copy diagnostic report",
    diagnosticsCopied: "Diagnostic report copied. It contains no usernames, IDs, cookies, or tokens.",
    advancedTitle: "Tools",
    advancedSummary: "Export and backup",
    footerNote:
      "Follow requests are verified with Instagram before the interface changes.",
    followingTitle: "Following",
    followersTitle: "Followers",
    resultCount: "{count} account",
    resultCountPlural: "{count} accounts",
    filteredCount: "{count} of {total} accounts",
    noUsersTitle: "No accounts here",
    noUsersBody: "Instagram returned an empty list for this view.",
    noSearchTitle: "No matching accounts",
    noSearchBody: "Try another username or name.",
    noFilterTitle: "You’re all caught up",
    noFilterBody: "No accounts match this filter.",
    loginRequired:
      "Log in to Instagram, then reopen the extension to manage your connections.",
    loadError:
      "Instagram couldn’t load this list. Wait a moment and try again.",
    storageLoadFailed: "Could not load this Instagram account’s local history. No history was changed; please try again.",
    mutual: "You follow each other",
    notFollowingYou: "Doesn’t follow you back",
    youDontFollow: "You don’t follow back",
    neither: "You don’t follow each other",
    requestSent: "Follow request sent",
    follow: "Follow",
    followBack: "Follow back",
    cancelRequest: "Cancel request",
    followingLoading: "Following…",
    cancellingLoading: "Cancelling…",
    minuteLimit:
      "You reached the extension’s {action} limit for one minute. Wait before trying again.",
    hourLimit:
      "You reached the extension’s {action} limit for one hour. Wait before trying again.",
    actionFollow: "follow",
    instagramBlocked:
      "Instagram blocked the {action} request: {reason}.",
    instagramRejected: "Instagram rejected the {action} request: {reason}.",
    relationshipUnchanged:
      "Instagram answered the {action} request, but the relationship didn’t change.",
    actionFailed: "Instagram couldn’t complete the {action} request.",
  },
  th: {
    appTitle: "IG Snapper",
    introTitle: "ดูว่าใครไม่ติดตามคุณกลับ",
    introEyebrow: "ตรวจสอบการเชื่อมต่อ",
    introBody:
      "เปรียบเทียบรายชื่อผู้ติดตามและกำลังติดตาม ค้นหาคนที่ไม่ติดตามกลับ และตรวจดูการเปลี่ยนแปลงในแต่ละวัน",
    howItWorks: "ขั้นตอนการใช้งาน",
    stepCompare: "เปรียบเทียบ",
    stepCompareDetail: "ผู้ติดตามและกำลังติดตาม",
    stepReview: "ตรวจสอบ",
    stepReviewDetail: "ดูสถานะความสัมพันธ์",
    stepDecide: "ประวัติ",
    stepDecideDetail: "เปิดดูรายชื่อที่เปลี่ยนแปลง",
    privacyNote: "ข้อมูลการเชื่อมต่อของคุณอยู่ในเบราว์เซอร์นี้เท่านั้น",
    backHome: "กลับหน้าแรก",
    followingTab: "กำลังติดตาม",
    followersTab: "ผู้ติดตาม",
    listsLabel: "รายการการเชื่อมต่อ",
    close: "ปิด",
    dismiss: "ปิดข้อความ",
    searchLabel: "ค้นหาบัญชี",
    searchPlaceholder: "ชื่อผู้ใช้หรือชื่อ",
    findNonFollowers: "ค้นหาคนที่ไม่ติดตามกลับ",
    allFilter: "ทั้งหมด",
    nonFollowersFilter: "ไม่ติดตามคุณ",
    mutualFilter: "ติดตามกันและกัน",
    notFollowedBackFilter: "คุณยังไม่ติดตาม",
    requestedFilter: "ส่งคำขอแล้ว",
    sortLabel: "เรียงตาม",
    sortRelationship: "ความสัมพันธ์",
    sortUsername: "ชื่อผู้ใช้",
    sortName: "ชื่อ",
    sortRatio: "อัตราส่วนผู้ติดตาม",
    signalLabel: "สัญญาณบัญชี",
    signalAll: "ทุกสัญญาณ",
    signalProtected: "ที่บันทึกไว้",
    signalVerified: "ยืนยันตัวตนแล้ว",
    signalPrivate: "บัญชีส่วนตัว",
    signalHighRatio: "อัตราส่วนผู้ติดตามสูง",
    selectSafe: "เลือกเฉพาะที่ปลอดภัย",
    followersStat: "ผู้ติดตาม",
    followingStat: "กำลังติดตาม",
    mutualStat: "ติดตามกัน",
    nonFollowersStat: "ไม่ติดตามกลับ",
    saveSnapshot: "บันทึกสแนปช็อต",
    snapshotSaved: "บันทึกสแนปช็อตในเครื่องแล้ว",
    history: "ประวัติ",
    historyTitle: "ประวัติการสแกน",
    historySubtitle: "ประวัตินี้เปรียบเทียบสมาชิกในรายชื่อจากการสแกนที่สมบูรณ์สองครั้ง ไม่ใช่บันทึกกิจกรรมของ Instagram จึงยืนยันไม่ได้ว่าคุณกดติดตามเมื่อใด",
    closeHistory: "ปิดประวัติ",
    historyNoData: "ยังไม่มีสแนปช็อต ลองสแกนให้ครบแล้วบันทึกไว้หนึ่งรายการ",
    historyFirst: "สแนปช็อตเริ่มต้น",
    historyUnverified: "สแนปช็อตเก่า — ตรวจสอบความครบถ้วนไม่ได้",
    historyChanges: "+{added} ใหม่ · −{removed} ลบออก",
    followersGained: "ผู้ติดตามเพิ่มขึ้น",
    followersLost: "ผู้ติดตามที่หายไป",
    followingAdded: "ติดตามเพิ่ม",
    followingRemoved: "ไม่อยู่ในรายชื่อที่กำลังติดตามแล้ว",
    currentSnapshot: "สแนปช็อตปัจจุบัน",
    previousSnapshot: "สแนปช็อตก่อนหน้า",
    exportCsv: "ส่งออก CSV",
    exportJson: "ส่งออก JSON",
    backup: "สำรองข้อมูล",
    restore: "กู้คืน",
    exportDone: "สร้างไฟล์ส่งออกแล้ว",
    backupDone: "สร้างไฟล์สำรองข้อมูลแล้ว",
    restoreDone: "กู้คืนข้อมูลสำรองในเครื่องแล้ว",
    invalidBackup: "ไฟล์สำรองข้อมูลนี้ใช้งานร่วมกันไม่ได้",
    protectedAccount: "บันทึกบัญชี",
    unprotectedAccount: "นำออกจากรายการบันทึก",
    verifiedBadge: "ยืนยันตัวตนแล้ว",
    privateBadge: "ส่วนตัว",
    ratioLabel: "อัตราส่วนผู้ติดตาม: {ratio}",
    protectedHint: "บัญชีที่บันทึกไว้",
    noHistoryChanges: "ไม่มีการเปลี่ยนแปลงจากสแนปช็อตก่อนหน้า",
    refreshBeforeHistory: "สแกนให้ครบก่อนจึงจะเปรียบเทียบประวัติได้",
    historyDetailBack: "กลับไปหน้าประวัติ",
    viewChanges: "ดูว่าใครเปลี่ยนไป",
    tabLostFollowers: "หายไปจากรายชื่อผู้ติดตาม",
    tabLostStillFollowing: "คุณยังติดตามเขาอยู่",
    tabRemovedBoth: "หายจากทั้งสองรายการ",
    tabNewFollowers: "ผู้ติดตามใหม่",
    tabFollowingRemoved: "หายไปจากรายชื่อที่คุณติดตาม",
    tabFollowingAdded: "พบเพิ่มในรายชื่อกำลังติดตาม",
    detailEmpty: "ไม่มีใครในกลุ่มนี้",
    openProfile: "เปิดโปรไฟล์",
    youStillFollow: "คุณยังติดตามเขาอยู่",
    youDontFollowBack: "คุณยังไม่ได้ติดตามกลับ",
    lostNote: "บัญชีเหล่านี้หายไปจากรายชื่อผู้ติดตามของคุณ Instagram ไม่ได้บอกว่าเขาเลิกติดตาม บล็อกคุณ หรือปิด/ลบบัญชี",
    lostStillFollowingNote: "บัญชีเหล่านี้ไม่อยู่ในรายชื่อผู้ติดตามแล้ว แต่ยังอยู่ในรายชื่อที่คุณกำลังติดตาม โดย Instagram ไม่ได้เปิดเผยสาเหตุ",
    removedBothNote: "บัญชีเหล่านี้หายไปจากทั้งรายชื่อผู้ติดตามและกำลังติดตามในช่วงเดียวกัน Instagram ไม่ได้บอกสาเหตุ",
    newNote: "บัญชีที่เริ่มติดตามคุณตั้งแต่สแนปช็อตก่อนหน้า",
    followingRemovedNote: "บัญชีเหล่านี้ไม่อยู่ในรายชื่อที่คุณกำลังติดตามเมื่อเทียบกับสแนปช็อตก่อนหน้า ข้อมูลนี้ไม่ได้ยืนยันสาเหตุที่บัญชีหายไป",
    followingAddedNote: "บัญชีเหล่านี้ปรากฏในรายชื่อกำลังติดตามของสแนปช็อตที่สมบูรณ์ล่าสุด แต่ไม่พบในสแนปช็อตก่อนหน้า ข้อมูลนี้บอกได้เพียงว่าสมาชิกในรายชื่อเปลี่ยนไประหว่างการสแกน ไม่ได้ยืนยันว่าคุณกดติดตามบัญชีเหล่านี้เมื่อใดหรือเป็นผู้กดติดตามเอง",
    copyUsernames: "คัดลอกชื่อผู้ใช้",
    usernamesCopied: "คัดลอกชื่อผู้ใช้แล้ว",
    lostFollowersAlert: "มี {count} บัญชีที่ไม่อยู่ในรายชื่อผู้ติดตามตั้งแต่สแนปช็อตล่าสุด เปิดประวัติเพื่อตรวจดูการเปลี่ยนแปลง",
    orbOpen: "เปิด IG Snapper",
    orbQuit: "ปิด IG Snapper ทั้งหมด",
    noChanges: "ไม่มีการเปลี่ยนแปลง",
    peopleCount: "{count} บัญชี",
    refresh: "รีเฟรช",
    updatedNow: "อัปเดตเมื่อสักครู่",
    updatedMinutes: "อัปเดตเมื่อ {count} นาทีที่แล้ว",
    loadingConnections: "กำลังเปรียบเทียบรายชื่อของคุณ…",
    loadingPage: "กำลังเปรียบเทียบรายชื่อของคุณ… โหลดแล้ว {count} บัญชี",
    loadingBoth: "กำลังติดตาม {following} · ผู้ติดตาม {followers}",
    loadingRetry: "Instagram ให้ชะลอความเร็ว กำลังลองใหม่ใน {seconds} วิ…",
    cancelLoad: "ยกเลิก",
    loadCancelled: "ยกเลิกการโหลดแล้ว",
    licenseTitle: "เปิดใช้งาน IG Snapper",
    licenseBody: "ใส่คีย์ลิขสิทธิ์เพื่อปลดล็อกโปรแกรม 1 คีย์ใช้ได้กับ 1 บัญชี Instagram และสูงสุด 2 เบราว์เซอร์",
    licenseActivate: "เปิดใช้งาน",
    licenseChecking: "กำลังตรวจสอบ…",
    licenseOk: "เปิดใช้งานแล้ว ขอบคุณครับ",
    licenseOkUntil: "เปิดใช้งานแล้ว ถึงวันที่ {date}",
    licenseEmpty: "กรุณาใส่คีย์",
    license_not_found: "ไม่พบคีย์นี้ ตรวจสอบแล้วลองใหม่",
    license_revoked: "คีย์นี้ถูกปิดการใช้งานแล้ว",
    license_expired: "คีย์นี้หมดอายุแล้ว ติดต่อผู้ขายเพื่อต่ออายุ",
    license_device_limit: "คีย์นี้ใช้ครบ 2 เบราว์เซอร์แล้ว ติดต่อผู้ขายเพื่อย้ายเครื่อง",
    license_account_limit: "คีย์นี้ถูกใช้กับบัญชี Instagram อื่นอยู่แล้ว ติดต่อผู้ขายเพื่อเปลี่ยนบัญชี",
    license_rate_limited: "ใส่คีย์ผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่",
    license_bad_request: "ตรวจคีย์ไม่สำเร็จ ลองติดตั้งส่วนขยายใหม่แล้วลองอีกครั้ง",
    license_offline: "เชื่อมต่อเซิร์ฟเวอร์ตรวจคีย์ไม่ได้ ตรวจสอบอินเทอร์เน็ต",
    license_server_error: "เซิร์ฟเวอร์ตรวจคีย์ขัดข้อง ลองใหม่ภายหลัง",
    license_not_configured: "ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์ตรวจคีย์ในเวอร์ชันนี้",
    licenseLocked: "ใส่คีย์ลิขสิทธิ์เพื่อใช้ฟีเจอร์นี้",
    licenseGetKey: "ซื้อคีย์",
    licenseBannerText: "IG Snapper ยังไม่ได้เปิดใช้งาน",
    licenseBannerButton: "ใส่คีย์",
    licenseChipUntil: "ใช้ได้ถึง {date}",
    licenseChipForever: "เปิดใช้งานแล้ว",
    licenseChipSoon: "หมดอายุใน {days} วัน",
    licenseChipTitle: "เปิดใช้งานแล้ว กดเพื่อเปลี่ยนคีย์",
    cancel: "ยกเลิก",
    copyDiagnostics: "คัดลอกรายงานวินิจฉัย",
    diagnosticsCopied: "คัดลอกรายงานแล้ว ไม่มีชื่อผู้ใช้ รหัสบัญชี คุกกี้ หรือโทเคน",
    advancedTitle: "เครื่องมือ",
    advancedSummary: "ส่งออกและสำรองข้อมูล",
    footerNote:
      "คำขอติดตามจะได้รับการยืนยันกับ Instagram ก่อนอัปเดตหน้าจอ",
    followingTitle: "กำลังติดตาม",
    followersTitle: "ผู้ติดตาม",
    resultCount: "{count} บัญชี",
    resultCountPlural: "{count} บัญชี",
    filteredCount: "{count} จาก {total} บัญชี",
    noUsersTitle: "ไม่มีบัญชีในรายการนี้",
    noUsersBody: "Instagram ส่งรายการว่างกลับมาสำหรับมุมมองนี้",
    noSearchTitle: "ไม่พบบัญชีที่ตรงกัน",
    noSearchBody: "ลองใช้ชื่อผู้ใช้หรือชื่ออื่น",
    noFilterTitle: "เรียบร้อยหมดแล้ว",
    noFilterBody: "ไม่มีบัญชีที่ตรงกับตัวกรองนี้",
    loginRequired:
      "กรุณาเข้าสู่ระบบ Instagram แล้วเปิดส่วนขยายอีกครั้งเพื่อจัดการรายชื่อของคุณ",
    loadError:
      "Instagram โหลดรายการนี้ไม่สำเร็จ โปรดรอสักครู่แล้วลองอีกครั้ง",
    storageLoadFailed: "โหลดประวัติในเครื่องของบัญชี Instagram นี้ไม่สำเร็จ ไม่มีการแก้ไขประวัติ โปรดลองอีกครั้ง",
    mutual: "ติดตามกันและกัน",
    notFollowingYou: "ไม่ได้ติดตามคุณกลับ",
    youDontFollow: "คุณยังไม่ได้ติดตามกลับ",
    neither: "ไม่ได้ติดตามกันทั้งคู่",
    requestSent: "ส่งคำขอติดตามแล้ว",
    follow: "ติดตาม",
    followBack: "ติดตามกลับ",
    cancelRequest: "ยกเลิกคำขอ",
    followingLoading: "กำลังติดตาม…",
    cancellingLoading: "กำลังยกเลิก…",
    minuteLimit:
      "คุณใช้ครบขีดจำกัดการ{action}ต่อนาทีของส่วนขยายแล้ว โปรดรอสักครู่ก่อนลองอีกครั้ง",
    hourLimit:
      "คุณใช้ครบขีดจำกัดการ{action}ต่อชั่วโมงของส่วนขยายแล้ว โปรดรอสักครู่ก่อนลองอีกครั้ง",
    actionFollow: "ติดตาม",
    instagramBlocked:
      "Instagram บล็อกคำขอ{action}: {reason}",
    instagramRejected: "Instagram ปฏิเสธคำขอ{action}: {reason}",
    relationshipUnchanged:
      "Instagram ตอบรับคำขอ{action} แต่ความสัมพันธ์ระหว่างบัญชีไม่เปลี่ยนแปลง",
    actionFailed: "Instagram ดำเนินการ{action}ไม่สำเร็จ",
  },
};

let currentLocale = "en";

function t(key, values = {}) {
  const template = translations[currentLocale]?.[key] || translations.en[key] || key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  );
}

function getPreferredLocale() {
  return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

const loadFollowersButton = document.getElementById("loadFollowersButton");
const loadFollowingButton = document.getElementById("loadFollowingButton");
const searchGroup = document.getElementById("searchGroup");
const titleAndFilter = document.getElementById("titleAndFilter");
const filterNotFollowingBackButton = document.getElementById(
  "filterNotFollowingBackButton"
);
const filterNotFollowedBackButton = document.getElementById(
  "filterNotFollowedBackButton"
);
const overlay = document.getElementById("overlay");
const infoText = document.getElementById("info-text");
const title = document.getElementById("title");
const workspace = document.getElementById("workspace");
const listTabs = document.getElementById("listTabs");
const introBlock = document.querySelector(".intro-block");
const userList = document.getElementById("userList");
const resultsSummary = document.getElementById("resultsSummary");
const notice = document.getElementById("notice");
const noticeText = document.getElementById("noticeText");
const filterAllButton = document.getElementById("filterAllButton");
const filterMutualButton = document.getElementById("filterMutualButton");
const filterRequestedButton = document.getElementById("filterRequestedButton");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const signalFilter = document.getElementById("signalFilter");
const updatedAt = document.getElementById("updatedAt");
const historyDialog = document.getElementById("historyDialog");
const historyList = document.getElementById("historyList");
const historySummary = document.getElementById("historySummary");

function setLocale(locale, persist = true) {
  currentLocale = locale === "th" ? "th" : "en";
  if (persist) {
    window.postMessage(
      { mifStorage: true, action: "setLocale", payload: currentLocale },
      window.location.origin
    );
  }

  document
    .getElementById("manage-instagram-followers-root")
    ?.setAttribute("lang", currentLocale === "th" ? "th" : "en");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll(".language-button").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.locale === currentLocale)
    );
  });
  document
    .querySelector(".language-switch")
    ?.setAttribute("data-active", currentLocale);
  try { renderLicenseState(); } catch { /* license UI not ready yet */ }

  if (caller) {
    if (searchInput.value.trim()) {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      renderCurrentUsers();
    }
    updateUpdatedAt();
  }
}

function showNotice(message, tone = "error") {
  noticeText.textContent = message;
  notice.dataset.tone = tone;
  notice.hidden = false;
  pingOrb();
}

function dismissNotice() {
  notice.hidden = true;
  noticeText.textContent = "";
  delete notice.dataset.tone;
}

function closeExtension() {
  clearTimeout(orbPingTimer);
  window.removeEventListener("resize", onOrbResize);
  document.getElementById("manage-instagram-followers-root")?.remove();
  lifecycle.abort();
}

/* ───────────── HUD Orb (minimized state) ───────────── */
const rootEl = document.getElementById("manage-instagram-followers-root");
const hudOrb = document.getElementById("hudOrb");
const hudOrbBadge = document.getElementById("hudOrbBadge");
const ORB_SIZE = 64;
const ORB_LABEL_SPACE = 34;
const ORB_MARGIN = 8;
let isMinimized = false;
let orbPos = null; // { fx, fy } as fractions of the free viewport area
let orbUnseen = 0;
let orbPingTimer = null;
let orbTransitioning = false;

function orbRange() {
  return {
    maxX: Math.max(ORB_MARGIN, window.innerWidth - ORB_SIZE - ORB_MARGIN),
    maxY: Math.max(ORB_MARGIN, window.innerHeight - ORB_SIZE - ORB_LABEL_SPACE - ORB_MARGIN),
  };
}

function clampOrb(x, y) {
  const { maxX, maxY } = orbRange();
  return {
    x: Math.min(Math.max(ORB_MARGIN, x), maxX),
    y: Math.min(Math.max(ORB_MARGIN, y), maxY),
  };
}

function placeOrb() {
  const { maxX, maxY } = orbRange();
  const fx = Number.isFinite(orbPos?.fx) ? orbPos.fx : 1;
  const fy = Number.isFinite(orbPos?.fy) ? orbPos.fy : 0.82;
  const { x, y } = clampOrb(ORB_MARGIN + fx * (maxX - ORB_MARGIN), ORB_MARGIN + fy * (maxY - ORB_MARGIN));
  hudOrb.style.left = `${x}px`;
  hudOrb.style.top = `${y}px`;
}

function saveOrbPos(x, y) {
  const { maxX, maxY } = orbRange();
  orbPos = {
    fx: maxX > ORB_MARGIN ? (x - ORB_MARGIN) / (maxX - ORB_MARGIN) : 1,
    fy: maxY > ORB_MARGIN ? (y - ORB_MARGIN) / (maxY - ORB_MARGIN) : 0.82,
  };
  settings = { ...settings, orbPos };
  persistState();
}

function onOrbResize() {
  if (isMinimized) placeOrb();
}
window.addEventListener("resize", onOrbResize);

function orbCenter() {
  const left = parseFloat(hudOrb.style.left) || 0;
  const top = parseFloat(hudOrb.style.top) || 0;
  return { x: left + ORB_SIZE / 2, y: top + ORB_SIZE / 2 };
}

function updateOrbBadge() {
  if (!hudOrbBadge) return;
  hudOrbBadge.hidden = orbUnseen <= 0;
  hudOrbBadge.textContent = orbUnseen > 99 ? "99+" : String(orbUnseen);
}

function pingOrb() {
  if (!isMinimized) return;
  hudOrb.classList.remove("is-ping");
  void hudOrb.offsetWidth;
  hudOrb.classList.add("is-ping");
  clearTimeout(orbPingTimer);
  orbPingTimer = setTimeout(() => hudOrb.classList.remove("is-ping"), 1400);
}

function panelFlight() {
  const panel = overlay.querySelector(".my-component");
  const box = panel.getBoundingClientRect();
  const orb = orbCenter();
  return {
    panel,
    dx: orb.x - (box.left + box.width / 2),
    dy: orb.y - (box.top + box.height / 2),
  };
}

function minimizeToOrb() {
  if (isMinimized || orbTransitioning) return;
  orbTransitioning = true;
  placeOrb();
  const { panel, dx, dy } = panelFlight();
  const duration = prefersReducedMotion.matches ? 1 : 460;
  const flight = panel.animate(
    [
      { transform: "none", opacity: 1, filter: "blur(0px)" },
      { transform: `translate(${dx}px, ${dy}px) scale(0.05)`, opacity: 0, filter: "blur(8px)" },
    ],
    { duration, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }
  );
  const fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration,
    easing: "ease-in",
    fill: "forwards",
  });
  flight.finished
    .catch(() => {})
    .then(() => {
      overlay.classList.add("is-hidden");
      flight.cancel();
      fade.cancel();
      rootEl.classList.add("is-minimized");
      isMinimized = true;
      orbTransitioning = false;
      hudOrb.hidden = false;
      updateOrbBadge();
    });
}

function restoreFromOrb() {
  if (!isMinimized || orbTransitioning) return;
  orbTransitioning = true;
  const orb = orbCenter();
  hudOrb.hidden = true;
  rootEl.classList.remove("is-minimized");
  overlay.classList.remove("is-hidden");
  isMinimized = false;
  orbUnseen = 0;
  updateOrbBadge();
  const panel = overlay.querySelector(".my-component");
  const box = panel.getBoundingClientRect();
  const dx = orb.x - (box.left + box.width / 2);
  const dy = orb.y - (box.top + box.height / 2);
  const duration = prefersReducedMotion.matches ? 1 : 560;
  const flight = panel.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(0.05)`, opacity: 0, filter: "blur(8px)" },
      { transform: "none", opacity: 1, filter: "blur(0px)" },
    ],
    { duration, easing: "cubic-bezier(0.34, 1.3, 0.64, 1)" }
  );
  overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.min(duration, 320), easing: "ease-out" });
  flight.finished.catch(() => {}).then(() => {
    orbTransitioning = false;
    document.getElementById("findNonFollowersButton")?.focus({ preventScroll: true });
  });
}

rootEl.addEventListener("mif-restore", restoreFromOrb, { signal: lifecycle.signal });

// Dragging: pointer events with a movement threshold so a tap still opens the app.
(() => {
  let drag = null;
  const THRESHOLD = 5;

  hudOrb.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || event.target.closest(".orb-quit")) return;
      const left = parseFloat(hudOrb.style.left) || 0;
      const top = parseFloat(hudOrb.style.top) || 0;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left,
        top,
        lastX: event.clientX,
        lastT: performance.now(),
        moved: false,
      };
      hudOrb.setPointerCapture(event.pointerId);
    },
    { signal: lifecycle.signal }
  );

  hudOrb.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < THRESHOLD) return;
      if (!drag.moved) {
        drag.moved = true;
        hudOrb.classList.add("is-dragging");
      }
      const { x, y } = clampOrb(drag.left + dx, drag.top + dy);
      hudOrb.style.left = `${x}px`;
      hudOrb.style.top = `${y}px`;
      const now = performance.now();
      const velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
      hudOrb.style.setProperty("--tilt", `${Math.max(-26, Math.min(26, velocity * 14))}deg`);
      drag.lastX = event.clientX;
      drag.lastT = now;
    },
    { signal: lifecycle.signal }
  );

  const finish = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const wasMoved = drag.moved;
    drag = null;
    hudOrb.classList.remove("is-dragging");
    hudOrb.style.setProperty("--tilt", "0deg");
    if (hudOrb.hasPointerCapture?.(event.pointerId)) hudOrb.releasePointerCapture(event.pointerId);
    if (wasMoved) {
      saveOrbPos(parseFloat(hudOrb.style.left) || 0, parseFloat(hudOrb.style.top) || 0);
    } else if (event.type === "pointerup") {
      restoreFromOrb();
    }
  };
  hudOrb.addEventListener("pointerup", finish, { signal: lifecycle.signal });
  hudOrb.addEventListener("pointercancel", finish, { signal: lifecycle.signal });

  hudOrb.addEventListener(
    "keydown",
    (event) => {
      if (event.target.closest(".orb-quit")) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        restoreFromOrb();
      }
      const step = event.shiftKey ? 40 : 16;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[event.key]) {
        event.preventDefault();
        const { x, y } = clampOrb(
          (parseFloat(hudOrb.style.left) || 0) + moves[event.key][0],
          (parseFloat(hudOrb.style.top) || 0) + moves[event.key][1]
        );
        hudOrb.style.left = `${x}px`;
        hudOrb.style.top = `${y}px`;
        saveOrbPos(x, y);
      }
    },
    { signal: lifecycle.signal }
  );

  document.getElementById("hudOrbQuit").addEventListener("click", (event) => {
    event.stopPropagation();
    closeExtension();
  }, { signal: lifecycle.signal });
})();

document.querySelectorAll(".language-button").forEach((button) => {
  button.addEventListener("click", () => setLocale(button.dataset.locale));
});
document
  .getElementById("closeExtensionButton")
  .addEventListener("click", minimizeToOrb);
document
  .getElementById("dismissNoticeButton")
  .addEventListener("click", dismissNotice);
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      if (!licenseDialog.hidden) licenseDialog.hidden = true;
      else if (!historyDialog.hidden) historyDialog.hidden = true;
      else if (!isMinimized) minimizeToOrb();
    }
  },
  { signal: lifecycle.signal }
);

function resetUI() {
  loadedUsers.clear();
  currentFilter = "all";
  document.getElementById("userList").innerHTML = "";
  searchInput.value = "";
  sortSelect.value = "relationship";
  title.textContent =
    caller === "Followers" ? t("followersTitle") : t("followingTitle");
  title.style.display = "flex";
  document
    .querySelectorAll(".filter")
    .forEach((element) => {
      element.classList.remove("filter-active");
      if (element.dataset.filter) element.setAttribute("aria-pressed", "false");
    });
  filterAllButton.classList.add("filter-active");
  filterAllButton.setAttribute("aria-pressed", "true");
  infoText.style.display = "none";
  searchGroup.style.display = "grid";
  titleAndFilter.style.display = "flex";
  workspace.hidden = false;
  introBlock.hidden = true;
  listTabs.hidden = false;
  dismissNotice();
}

function showHome() {
  viewGeneration += 1;
  cancelLoading();
  setLoading(false);
  caller = null;
  currentFilter = "all";
  userList.innerHTML = "";
  workspace.hidden = true;
  listTabs.hidden = true;
  introBlock.hidden = false;
  loadFollowingButton.classList.remove("is-active");
  loadFollowersButton.classList.remove("is-active");
  loadFollowingButton.removeAttribute("aria-current");
  loadFollowersButton.removeAttribute("aria-current");
  dismissNotice();
  document
    .getElementById("findNonFollowersButton")
    .focus({ preventScroll: true });
}

function toggleFilterButtons(type) {
  filterAllButton.style.display = "flex";
  filterMutualButton.style.display = "flex";
  filterNotFollowingBackButton.style.display =
    type === "Following" ? "flex" : "none";
  filterRequestedButton.style.display =
    type === "Following" ? "flex" : "none";
  filterNotFollowedBackButton.style.display =
    type === "Followers" ? "flex" : "none";
}

async function openList(type, initialFilter = "all") {
  if (!ensureLicensed()) return;
  try {
    viewerId = await instagramTransport.resolveViewerId();
  } catch (error) {
    diagnostics.lastError = error?.message || String(error);
    showNotice(t("loginRequired"));
    console.error("Unable to resolve Instagram viewer ID.", error);
    return;
  }
  if (!viewerId) {
    showNotice(t("loginRequired"));
    return;
  }
  const accountId = String(viewerId);
  if (loadedStateAccountId !== accountId) {
    // Clear old account data before awaiting storage. Keep each account's
    // snapshots and protected-user list isolated within the same browser tab.
    resetUI();
    snapshotHistory = [];
    latestDiff = null;
    const stateLoaded = await requestStoredState(accountId);
    if (!stateLoaded || loadedStateAccountId !== accountId) {
      showNotice(t("storageLoadFailed"), "error");
      return;
    }
  }
  // Now that the Instagram account is known, let the server check it against the key's account limit.
  license = await licenseRequest("status");
  renderLicenseState();
  if (!ensureLicensed()) return;
  const generation = ++viewGeneration;
  caller = type;
  resetUI();
  currentFilter = initialFilter;
  setActiveListTab(type);
  toggleFilterButtons(type);
  await fetchConnections(type, generation);
  if (generation !== viewGeneration) return;
  setFilter(initialFilter);
}

loadFollowersButton.addEventListener("click", () => openList("Followers"));
loadFollowingButton.addEventListener("click", () => openList("Following"));
document
  .getElementById("findNonFollowersButton")
  .addEventListener("click", () => openList("Following", "notFollowingBack"));
document.getElementById("backHomeButton").addEventListener("click", showHome);
document.getElementById("cancelLoadButton").addEventListener("click", () => {
  cancelLoading();
});

function setActiveListTab(type) {
  loadFollowingButton.classList.toggle("is-active", type === "Following");
  loadFollowersButton.classList.toggle("is-active", type === "Followers");
  loadFollowingButton.setAttribute(
    "aria-current",
    type === "Following" ? "page" : "false"
  );
  loadFollowersButton.setAttribute(
    "aria-current",
    type === "Followers" ? "page" : "false"
  );
}

overlay.addEventListener("click", function (event) {
  if (event.target === this) {
    minimizeToOrb();
  }
});

const loadedUsers = new Map();
const connectionCache = {
  Following: null,
  Followers: null,
};
const connectionRequests = {
  Following: null,
  Followers: null,
};
const connectionCacheUpdatedAt = {
  Following: 0,
  Followers: 0,
};
const connectionCacheViewerId = {
  Following: null,
  Followers: null,
};
const connectionScanMeta = {
  Following: null,
  Followers: null,
};
const connectionCacheTtl = 10 * 60 * 1000;
let caller = null;
let currentFilter = "all";
let lastUpdatedAt = null;
let searchTimer = null;
let renderGeneration = 0;
let viewGeneration = 0;
let visibleUserIds = [];
const protectedUserIds = new Set();
let snapshotHistory = [];
let latestDiff = null;
let settings = {};
const diagnostics = { lastError: null, lastEndpoint: null, lastStatus: null };
let followAttempts = [];

function persistRateLimitState() {
  window.postMessage(
    {
      mifStorage: true,
      action: "setRateLimits",
      payload: { follow: followAttempts },
    },
    window.location.origin
  );
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderCurrentUsers, 150);
});
sortSelect.addEventListener("change", renderCurrentUsers);
signalFilter?.addEventListener("change", renderCurrentUsers);

function normalizeConnectionUser(user, type) {
  return core.normalizeConnectionUser(user, type);
}

function setLoading(isLoading) {
  const loader = document.getElementById("loader");
  if (isLoading) {
    document.getElementById("loadingProgress").textContent = t(
      "loadingConnections"
    );
  }
  rootEl?.toggleAttribute("data-busy", isLoading);
  if (!isLoading) pingOrb();
  loader.style.display = isLoading ? "flex" : "none";
  loader.setAttribute("aria-hidden", String(!isLoading));
  userList.style.display = isLoading ? "none" : caller ? "flex" : "none";
  document
    .querySelector(".my-component")
    ?.setAttribute("aria-busy", String(isLoading));
  document.querySelectorAll(".data-action-control").forEach((element) => {
    element.disabled = isLoading;
    element.setAttribute("aria-disabled", String(isLoading));
  });
}

function updateResultsMeta(users) {
  const total = loadedUsers.size;
  const count = users.length;
  resultsSummary.textContent =
    currentFilter !== "all" || count !== total
      ? t("filteredCount", { count, total })
      : t(count === 1 ? "resultCount" : "resultCountPlural", { count });
}

function renderEmptyState(reason = "empty") {
  const titleKey =
    reason === "search"
      ? "noSearchTitle"
      : reason === "filter"
      ? "noFilterTitle"
      : "noUsersTitle";
  const bodyKey =
    reason === "search"
      ? "noSearchBody"
      : reason === "filter"
      ? "noFilterBody"
      : "noUsersBody";

  userList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <circle cx="10" cy="9" r="3.5" stroke="currentColor" stroke-width="1.7" />
        <path d="M3.5 19c.7-3.1 2.8-4.8 6.5-4.8 2.2 0 3.9.6 5 1.8m2-7 4 4m0-4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
      </svg>
      <strong>${t(titleKey)}</strong>
      <span>${t(bodyKey)}</span>
    </div>
  `;
  userList.style.display = "flex";
}

const loadProgress = { Following: 0, Followers: 0 };
let loadController = null;

async function requestConnections(type, signal) {
  loadProgress[type] = 0;
  const result = await instagramTransport.requestConnections(
    type,
    (progress) => {
      diagnostics.lastEndpoint = `${type.toLowerCase()} list via ${progress.providerId || "retry"}`;
      diagnostics.lastStatus = progress.retry?.status || 200;
      loadProgress[type] = progress.count;
      const label = document.getElementById("loadingProgress");
      label.textContent = progress.retry
        ? t("loadingRetry", { seconds: Math.ceil(progress.retry.wait / 1000) })
        : t("loadingBoth", {
            following: formatNumber(loadProgress.Following),
            followers: formatNumber(loadProgress.Followers),
          });
    },
    { signal }
  );

  diagnostics.lastEndpoint = `${type.toLowerCase()} list via ${result.providerId}`;
  diagnostics.lastStatus = 200;
  const users = result.users.map((user) => normalizeConnectionUser(user, type));
  if (
    !result.complete ||
    !result.viewerId ||
    String(result.viewerId) !== String(viewerId) ||
    users.some((user) => !user) ||
    users.length !== result.count
  ) {
    throw new Error(`Incomplete ${type.toLowerCase()} scan: account IDs or scan metadata failed validation. No snapshot was saved.`);
  }
  return {
    users,
    scan: {
      complete: true,
      viewerId: String(result.viewerId),
      pages: result.pages,
      count: users.length,
      completedAt: result.completedAt,
    },
  };
}

function cancelLoading() {
  loadController?.abort();
  connectionRequests.Following = null;
  connectionRequests.Followers = null;
}

function refreshRelationshipFlags() {
  core.reconcileConnectionMaps(
    connectionCache.Following,
    connectionCache.Followers
  );
}

async function ensureConnections(type, signal) {
  const cacheOwner = String(viewerId || "");
  if (connectionCacheViewerId[type] !== cacheOwner) {
    connectionCache[type] = null;
    connectionCacheUpdatedAt[type] = 0;
    connectionScanMeta[type] = null;
    connectionCacheViewerId[type] = cacheOwner;
  }

  const cacheIsFresh =
    connectionCache[type] &&
    connectionScanMeta[type]?.complete === true &&
    connectionScanMeta[type]?.viewerId === cacheOwner &&
    connectionScanMeta[type]?.count === connectionCache[type].size &&
    Date.now() - connectionCacheUpdatedAt[type] < connectionCacheTtl;
  if (cacheIsFresh) return connectionCache[type];
  connectionCache[type] = null;
  connectionScanMeta[type] = null;

  if (!connectionRequests[type]) {
    const request = requestConnections(type, signal)
      .then(({ users, scan }) => {
        if (cacheOwner !== String(viewerId || "") || scan.viewerId !== cacheOwner) {
          throw new Error("Instagram account changed during the scan. Please scan again.");
        }
        const connections = new Map(users.map((user) => [user.id, user]));
        if (connections.size !== scan.count) {
          throw new Error(`Incomplete ${type.toLowerCase()} scan: duplicate or invalid account IDs were detected.`);
        }
        connectionCache[type] = connections;
        connectionScanMeta[type] = scan;
        connectionCacheUpdatedAt[type] = Date.now();
        return connections;
      })
      .finally(() => {
        if (connectionRequests[type] === request) connectionRequests[type] = null;
      });
    connectionRequests[type] = request;
  }

  const connections = await connectionRequests[type];
  refreshRelationshipFlags();
  return connections;
}

async function fetchConnections(type, generation) {
  caller = type;
  title.textContent =
    type === "Followers" ? t("followersTitle") : t("followingTitle");
  setLoading(true);

  try {
    const companionType = type === "Following" ? "Followers" : "Following";
    cancelLoading();
    loadController = new AbortController();
    const { signal } = loadController;
    const [selectedConnections] = await Promise.all([
      ensureConnections(type, signal),
      ensureConnections(companionType, signal),
    ]);
    if (generation !== viewGeneration) return;
    refreshRelationshipFlags();
    const users = [...selectedConnections.values()];
    loadedUsers.clear();
    updateUIWithData(users, type);
    lastUpdatedAt = Date.now();
    updateUpdatedAt();
    updateInsightStrip();
    saveCurrentSnapshot(false);
  } catch (error) {
    if (generation !== viewGeneration) return;
    if (error?.name === "AbortError") {
      showNotice(t("loadCancelled"), "info");
      renderEmptyState();
      return;
    }
    diagnostics.lastError = error?.message || String(error);
    console.error("Error when fetching data from Instagram:", error);
    showNotice(`${t("loadError")} ${diagnostics.lastError}`.trim());
    renderEmptyState();
  } finally {
    if (generation === viewGeneration) {
      setLoading(false);
      const loader = document.getElementById("loader");
      if (loader) loader.setAttribute("aria-hidden", "true");
    }
  }
}

function updateUIWithData(edges, functionCalled) {
  searchInput.style.display = "block";
  populateLoadedUser(edges, functionCalled);
  updateFilterCounts();
  renderCurrentUsers();
}

function populateLoadedUser(users, functionCalled) {
  if (caller !== functionCalled) {
    caller = functionCalled;
  }
  users.forEach((edge) => {
    const user = edge.node ?? edge;
    if (!loadedUsers.has(user.id)) {
      loadedUsers.set(user.id, user);
    }
  });
}

function getRelationshipState(user) {
  return core.getRelationshipState(user);
}

function isProtected(userId) {
  return protectedUserIds.has(String(userId));
}

function persistState() {
  window.postMessage(
    {
      mifStorage: true,
      action: "setState",
      requestId: crypto.randomUUID(),
      payload: {
        accountId: viewerId || "default",
        locale: currentLocale,
        rateLimits: { follow: followAttempts },
        whitelist: [...protectedUserIds],
        snapshots: snapshotHistory,
        settings,
      },
    },
    window.location.origin
  );
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateInsightStrip() {}

function snapshotFingerprint(snapshot) {
  return core.snapshotMembershipFingerprint(snapshot);
}

function saveCurrentSnapshot(force = false) {
  const following = connectionCache.Following
    ? [...connectionCache.Following.values()]
    : [];
  const followers = connectionCache.Followers
    ? [...connectionCache.Followers.values()]
    : [];
  const followingScan = connectionScanMeta.Following;
  const followersScan = connectionScanMeta.Followers;
  const scansAreVerified = [followingScan, followersScan].every((scan) =>
    scan?.complete === true &&
    scan.viewerId === String(viewerId || "") &&
    Number.isInteger(scan.pages) &&
    scan.pages > 0
  );
  if (
    !connectionCache.Following ||
    !connectionCache.Followers ||
    !scansAreVerified ||
    followingScan.count !== following.length ||
    followersScan.count !== followers.length
  ) {
    showNotice(t("refreshBeforeHistory"), "warning");
    return false;
  }

  const snapshot = core.buildSnapshot({
    viewerId,
    following,
    followers,
    scan: { following: followingScan, followers: followersScan },
  });
  if (!core.isSnapshotComplete(snapshot)) {
    showNotice(t("refreshBeforeHistory"), "warning");
    return false;
  }
  const previous = snapshotHistory[0]?.viewerId === snapshot.viewerId
    ? snapshotHistory[0]
    : null;
  if (
    !force &&
    previous &&
    core.isSnapshotComplete(previous) &&
    snapshotFingerprint(previous) === snapshotFingerprint(snapshot)
  ) {
    latestDiff = core.diffSnapshots(previous, snapshot);
    return false;
  }

  latestDiff = core.diffSnapshots(previous, snapshot);
  snapshotHistory = [snapshot, ...snapshotHistory.filter((item) => item.id !== snapshot.id)].slice(0, 12);
  persistState();
  renderHistory();
  const lostCount = latestDiff.comparable ? latestDiff.followers.removed.length : 0;
  if (lostCount > 0) {
    orbUnseen = lostCount;
    updateOrbBadge();
    showNotice(t("lostFollowersAlert", { count: lostCount }), "warning");
  } else {
    showNotice(t("snapshotSaved"), "success");
  }
  return true;
}

function formatNumber(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat(currentLocale === "th" ? "th-TH" : "en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : "—";
}

function relationshipLabel(user) {
  return t(getRelationshipState(user).infoKey);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getExportUsers() {
  let users = core.filterUsers([...loadedUsers.values()], currentFilter);
  const searchTerm = searchInput.value.trim().toLocaleLowerCase(currentLocale);
  if (searchTerm) {
    users = users.filter(
      (user) =>
        user.username.toLocaleLowerCase(currentLocale).includes(searchTerm) ||
        (user.full_name || "").toLocaleLowerCase(currentLocale).includes(searchTerm)
    );
  }
  users = core.filterBySignal(users, signalFilter?.value || "all", protectedUserIds);
  return core.sortUsers(users, sortSelect.value, currentLocale);
}

function exportCsv() {
  const users = getExportUsers();
  const rows = [
    [
      "username",
      "full_name",
      "relationship",
      "verified",
      "private",
      "protected",
      "followers",
      "following",
      "follower_following_ratio",
      "profile_url",
    ],
    ...users.map((user) => {
      const signals = core.getAccountSignals(user);
      return [
        user.username,
        user.full_name || "",
        relationshipLabel(user),
        signals.verified,
        signals.private,
        isProtected(user.id),
        signals.followerCount ?? "",
        signals.followingCount ?? "",
        signals.followerFollowingRatio == null
          ? ""
          : signals.followerFollowingRatio.toFixed(2),
        `https://www.instagram.com/${encodeURIComponent(user.username)}/`,
      ];
    }),
  ];
  downloadText(
    `instagram-${(caller || "connections").toLowerCase()}-${Date.now()}.csv`,
    rows.map((row) => row.map(escapeCsv).join(",")).join("\n"),
    "text/csv;charset=utf-8"
  );
  showNotice(t("exportDone"), "success");
}

function exportJson() {
  const users = getExportUsers();
  const payload = {
    exportedAt: new Date().toISOString(),
    view: caller,
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name || "",
      relationship: getRelationshipState(user).tone,
      verified: core.getAccountSignals(user).verified,
      private: core.getAccountSignals(user).private,
      protected: isProtected(user.id),
      profile_url: `https://www.instagram.com/${encodeURIComponent(user.username)}/`,
    })),
  };
  downloadText(
    `instagram-${(caller || "connections").toLowerCase()}-${Date.now()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
  showNotice(t("exportDone"), "success");
}

function exportBackup() {
  const payload = {
    format: "manage-instagram-followers-backup",
    version: 2,
    accountId: viewerId ? String(viewerId) : null,
    createdAt: new Date().toISOString(),
    locale: currentLocale,
    whitelist: [...protectedUserIds],
    snapshots: snapshotHistory.filter((snapshot) => String(snapshot?.viewerId || "") === String(viewerId || "")),
    settings,
  };
  downloadText(
    `manage-instagram-followers-backup-${Date.now()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
  showNotice(t("backupDone"), "success");
}

function restoreBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || ""));
      if (
        payload?.format !== "manage-instagram-followers-backup" ||
        !Array.isArray(payload.whitelist) ||
        !Array.isArray(payload.snapshots)
      ) throw new Error("invalid backup");
      const targetAccountId = String(viewerId || "");
      if (payload.accountId && String(payload.accountId) !== targetAccountId) {
        throw new Error("This backup belongs to a different Instagram account.");
      }
      const matchingSnapshots = payload.snapshots.filter(
        (snapshot) => snapshot?.viewerId && String(snapshot.viewerId) === targetAccountId
      );
      if (payload.accountId && String(payload.accountId) === targetAccountId) {
        protectedUserIds.clear();
        payload.whitelist.map(String).filter(Boolean).slice(0, 5000).forEach((id) => protectedUserIds.add(id));
      }
      snapshotHistory = matchingSnapshots.slice(0, 12);
      settings = payload.settings && typeof payload.settings === "object" ? payload.settings : {};
      latestDiff = core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]);
      persistState();
      renderCurrentUsers();
      renderHistory();
      showNotice(t("restoreDone"), "success");
    } catch {
      showNotice(t("invalidBackup"), "error");
    }
  };
  reader.readAsText(file);
}

function icon(name, size = 16, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" aria-hidden="true"><use href="#mif-i-${name}"/></svg>`;
}

function formatSnapshotDate(snapshot) {
  return new Date(snapshot.createdAt).toLocaleString(currentLocale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderHistory() {
  if (!historyList) return;
  updateHistoryBadge();
  if (!snapshotHistory.length) {
    historySummary.textContent = "";
    historyList.innerHTML = `<div class="history-empty">${t("historyNoData")}</div>`;
    return;
  }

  latestDiff = core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]);
  historySummary.textContent = "";

  historyList.innerHTML = snapshotHistory.map((snapshot, index) => {
    const prev = snapshotHistory[index + 1];
    const diff = core.diffSnapshots(prev, snapshot);
    const dateLabel = formatSnapshotDate(snapshot);
    const lost = diff.followers.removed.length;
    const gained = diff.followers.added.length;
    const chips = diff.comparable
      ? `<div class="history-chips">
          ${lost ? `<span class="hchip hchip-lost">${icon("user-x", 13)}−${lost} ${t("tabLostFollowers")}</span>` : ""}
          ${diff.lostStillFollowing.length ? `<span class="hchip">${icon("user-check", 13)}${diff.lostStillFollowing.length} ${t("tabLostStillFollowing")}</span>` : ""}
          ${diff.bothRemoved.length ? `<span class="hchip hchip-lost">${icon("user-minus", 13)}${diff.bothRemoved.length} ${t("tabRemovedBoth")}</span>` : ""}
          ${gained ? `<span class="hchip hchip-new">${icon("user-plus", 13)}+${gained} ${t("tabNewFollowers")}</span>` : ""}
          ${diff.following.removed.length ? `<span class="hchip">${icon("user-minus", 13)}−${diff.following.removed.length} ${t("tabFollowingRemoved")}</span>` : ""}
          ${diff.following.added.length ? `<span class="hchip">${icon("user-check", 13)}+${diff.following.added.length} ${t("tabFollowingAdded")}</span>` : ""}
          ${!lost && !gained && !diff.following.added.length && !diff.following.removed.length ? `<span class="hchip">${t("noChanges")}</span>` : ""}
        </div>`
      : `<div class="history-chips"><span class="hchip">${t(diff.reason === "unverified" ? "historyUnverified" : "historyFirst")}</span></div>`;
    const body = `
      <div class="history-when"><strong>${index === 0 ? t("currentSnapshot") : dateLabel}</strong>${index === 0 ? `<span>${dateLabel}</span>` : ""}</div>
      <div class="history-counts"><span>${formatNumber(snapshot.followers?.length || 0)} ${t("followersStat")}</span><span>${formatNumber(snapshot.following?.length || 0)} ${t("followingStat")}</span></div>
      ${chips}
      ${diff.comparable ? `<span class="history-go">${t("viewChanges")}${icon("arrow-right", 14)}</span>` : ""}`;
    return diff.comparable
      ? `<button type="button" class="history-row is-clickable" data-index="${index}">${body}</button>`
      : `<div class="history-row">${body}</div>`;
  }).join("");
}

/* ───────────── History detail: who changed ───────────── */
const historyDetail = document.getElementById("historyDetail");
const historyDetailTabs = document.getElementById("historyDetailTabs");
const historyDetailList = document.getElementById("historyDetailList");
const historyDetailRange = document.getElementById("historyDetailRange");
const historyDetailNote = document.getElementById("historyDetailNote");
const historyDetailState = { index: 0, tab: "lost" };

const DETAIL_TABS = [
  { id: "lost", label: "tabLostFollowers", note: "lostNote", icon: "user-x", tone: "lost" },
  { id: "lostStillFollowing", label: "tabLostStillFollowing", note: "lostStillFollowingNote", icon: "user-check", tone: "neutral" },
  { id: "bothRemoved", label: "tabRemovedBoth", note: "removedBothNote", icon: "user-minus", tone: "lost" },
  { id: "new", label: "tabNewFollowers", note: "newNote", icon: "user-plus", tone: "new" },
  { id: "followingRemoved", label: "tabFollowingRemoved", note: "followingRemovedNote", icon: "user-minus", tone: "neutral" },
  { id: "followed", label: "tabFollowingAdded", note: "followingAddedNote", icon: "user-check", tone: "neutral" },
];

function getDetailGroups(index) {
  const diff = core.diffSnapshots(snapshotHistory[index + 1], snapshotHistory[index]);
  return {
    lost: diff.followers.removed,
    lostStillFollowing: diff.lostStillFollowing,
    bothRemoved: diff.bothRemoved,
    new: diff.followers.added,
    followingRemoved: diff.following.removed,
    followed: diff.following.added,
  };
}

function connectionHas(type, id) {
  const map = connectionCache[type];
  if (!map) return null;
  return map.has(String(id)) || map.has(Number(id));
}

function avatarHue(id) {
  let hash = 7;
  for (const char of String(id)) hash = (hash * 131 + char.charCodeAt(0) * 17) % 360;
  return hash;
}

function buildProfileCard(user, tabId, index) {
  const username = String(user.username || "");
  const displayName = String(user.full_name || "").trim() || username || `ID ${user.id}`;
  const card = document.createElement(username ? "a" : "div");
  card.className = "profile-card";
  card.style.setProperty("--i", String(Math.min(index, 14)));
  if (username) {
    card.href = `https://www.instagram.com/${encodeURIComponent(username)}/`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `${t("openProfile")}: @${username}`);
  }

  const avatar = document.createElement("span");
  avatar.className = "pc-avatar";
  avatar.style.setProperty("--h", String(avatarHue(username || user.id)));
  avatar.textContent = (displayName.replace(/^@/, "").trim()[0] || "?").toUpperCase();

  const body = document.createElement("span");
  body.className = "pc-body";
  const name = document.createElement("strong");
  name.textContent = displayName;
  body.append(name);
  if (username) {
    const handle = document.createElement("small");
    handle.textContent = `@${username}`;
    body.append(handle);
  }

  const chips = document.createElement("span");
  chips.className = "pc-chips";
  if (tabId === "lost" && connectionHas("Following", user.id)) {
    chips.append(createChip("warning", t("youStillFollow")));
  }
  if (tabId === "lostStillFollowing") {
    chips.append(createChip("warning", t("youStillFollow")));
  }
  if (tabId === "new" && connectionHas("Following", user.id) === false) {
    chips.append(createChip("info", t("youDontFollowBack")));
  }
  if (chips.childElementCount) body.append(chips);

  card.append(avatar, body);
  if (username) {
    const open = document.createElement("span");
    open.className = "pc-open";
    open.setAttribute("aria-hidden", "true");
    open.innerHTML = icon("arrow-right", 16);
    card.append(open);
  }
  return card;
}

function renderHistoryDetail() {
  const { index, tab } = historyDetailState;
  const groups = getDetailGroups(index);
  const snapshot = snapshotHistory[index];
  const previous = snapshotHistory[index + 1];
  if (!snapshot || !previous) return;

  historyDetailRange.textContent = `${formatSnapshotDate(previous)}  →  ${formatSnapshotDate(snapshot)}`;

  historyDetailTabs.innerHTML = "";
  DETAIL_TABS.forEach((def) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `detail-tab tone-${def.tone}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(def.id === tab));
    button.dataset.tab = def.id;
    button.innerHTML = `${icon(def.icon, 15)}<span>${t(def.label)}</span><b>${groups[def.id].length}</b>`;
    historyDetailTabs.append(button);
  });

  const activeDef = DETAIL_TABS.find((def) => def.id === tab) || DETAIL_TABS[0];
  historyDetailNote.textContent = groups[activeDef.id].length ? t(activeDef.note) : "";

  historyDetailList.innerHTML = "";
  const users = [...groups[activeDef.id]].sort((a, b) =>
    String(a.username || a.id).localeCompare(String(b.username || b.id))
  );
  if (!users.length) {
    historyDetailList.innerHTML = `<div class="history-empty">${t("detailEmpty")}</div>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  users.forEach((user, i) => fragment.append(buildProfileCard(user, activeDef.id, i)));
  historyDetailList.append(fragment);
}

function openHistoryDetail(index, preferredTab = null) {
  const groups = getDetailGroups(index);
  const firstWithItems = DETAIL_TABS.find((def) => groups[def.id].length)?.id || "lost";
  historyDetailState.index = index;
  historyDetailState.tab = preferredTab || (groups.lost.length ? "lost" : firstWithItems);
  renderHistoryDetail();
  historyList.hidden = true;
  historySummary.hidden = true;
  historyDetail.hidden = false;
  historyDetail.scrollTop = 0;
  if (index === 0) {
    orbUnseen = 0;
    updateOrbBadge();
  }
}

function closeHistoryDetail() {
  historyDetail.hidden = true;
  historyList.hidden = false;
  historySummary.hidden = false;
}

function updateHistoryBadge() {
  const button = document.getElementById("historyButton");
  if (!button) return;
  let badge = button.querySelector(".tool-badge");
  const lost = snapshotHistory.length > 1 ? core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]).followers.removed.length : 0;
  if (!lost) {
    badge?.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tool-badge";
    button.append(badge);
  }
  badge.textContent = `−${lost}`;
}

historyList.addEventListener("click", (event) => {
  const row = event.target.closest(".history-row[data-index]");
  if (row) openHistoryDetail(Number(row.dataset.index));
});
historyDetailTabs.addEventListener("click", (event) => {
  const tabButton = event.target.closest(".detail-tab");
  if (!tabButton) return;
  historyDetailState.tab = tabButton.dataset.tab;
  renderHistoryDetail();
});
document.getElementById("historyDetailBack").addEventListener("click", closeHistoryDetail);
document.getElementById("historyCopyButton").addEventListener("click", async () => {
  const users = getDetailGroups(historyDetailState.index)[historyDetailState.tab] || [];
  const text = users.filter((user) => user.username).map((user) => `@${user.username}`).join("\n");
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showNotice(t("usernamesCopied"), "success");
  } catch (error) {
    showNotice(String(error?.message || error), "warning");
  }
});

function toggleProtected(userId) {
  const id = String(userId);
  if (protectedUserIds.has(id)) protectedUserIds.delete(id);
  else protectedUserIds.add(id);
  persistState();
  renderCurrentUsers();
}

function updateFilterCounts() {
  const counts = core.countRelationships([...loadedUsers.values()]);
  document.querySelectorAll("[data-count]").forEach((element) => {
    element.textContent = String(counts[element.dataset.count] || 0);
  });
  if (caller === "Following") {
    filterRequestedButton.style.display = counts.requested ? "flex" : "none";
  }
  updateInsightStrip();
}

function setFilter(filter) {
  currentFilter = filter || "all";
  document.querySelectorAll(".filter[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("filter-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderCurrentUsers();
}

function renderCurrentUsers() {
  let users = core.filterUsers([...loadedUsers.values()], currentFilter);
  const searchTerm = searchInput.value.trim().toLocaleLowerCase(currentLocale);
  if (searchTerm) {
    users = users.filter(
      (user) =>
        user.username.toLocaleLowerCase(currentLocale).includes(searchTerm) ||
        (user.full_name || "")
          .toLocaleLowerCase(currentLocale)
          .includes(searchTerm)
    );
  }
  users = core.filterBySignal(users, signalFilter?.value || "all", protectedUserIds);
  const filteredUsers = core.sortUsers(users, sortSelect.value, currentLocale);
  visibleUserIds = filteredUsers.map((user) => user.id);
  addUsersToDom(
    filteredUsers,
    filteredUsers.length === 0
      ? searchTerm
        ? "search"
        : currentFilter !== "all"
        ? "filter"
        : "empty"
      : null
  );
}

function updateUpdatedAt() {
  if (!lastUpdatedAt) {
    updatedAt.textContent = "";
    return;
  }
  const minutes = Math.floor((Date.now() - lastUpdatedAt) / 60000);
  updatedAt.textContent =
    minutes < 1 ? t("updatedNow") : t("updatedMinutes", { count: minutes });
}

const ICON_STAR =
  '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="m12 3.6 2.55 5.2 5.7.83-4.13 4.02.98 5.7L12 16.7l-5.1 2.65.98-5.7L3.75 9.63l5.7-.83L12 3.6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
const CHIP_ICONS = {
  verified:
    '<svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="m12 2.8 2.3 1.7 2.8-.1.9 2.7 2.3 1.6-.9 2.7.9 2.7-2.3 1.6-.9 2.7-2.8-.1L12 21.2l-2.3-1.7-2.8.1-.9-2.7-2.3-1.6.9-2.7-.9-2.7 2.3-1.6.9-2.7 2.8.1L12 2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.6 12.1 2.3 2.3 4.5-4.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  private:
    '<svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ratio:
    '<svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true"><path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

function createChip(kind, label) {
  const chip = document.createElement("span");
  chip.className = `chip chip-${kind}`;
  chip.insertAdjacentHTML("afterbegin", CHIP_ICONS[kind] || "");
  const text = document.createElement("span");
  text.textContent = label;
  chip.append(text);
  return chip;
}

function addUsersToDom(users, emptyReason = null) {
  const generation = ++renderGeneration;
  userList.innerHTML = "";
  userList.style.display = "flex";
  title.textContent =
    caller === "Followers" ? t("followersTitle") : t("followingTitle");
  updateResultsMeta(users);

  if (users.length === 0) {
    renderEmptyState(emptyReason || (currentFilter ? "filter" : "empty"));
    return;
  }

  const renderChunk = (startIndex) => {
    if (generation !== renderGeneration) return;
    const fragment = document.createDocumentFragment();
    users.slice(startIndex, startIndex + 80).forEach((user, itemIndex) => {
    const relationState = getRelationshipState(user);
    const profileUrl = `https://www.instagram.com/${encodeURIComponent(
      user.username
    )}/`;
    const userDiv = document.createElement("article");
    userDiv.className = "user";
    userDiv.dataset.id = user.id;
    userDiv.style.setProperty("--i", String(Math.min(itemIndex, 14)));

    const photoLink = document.createElement("a");
    photoLink.className = "user-photo-link";
    photoLink.href = profileUrl;
    photoLink.target = "_blank";
    photoLink.rel = "noreferrer";
    photoLink.setAttribute("aria-label", `@${user.username}`);

    const photo = document.createElement("img");
    photo.className = "user-photo";
    photo.src = user.profile_pic_url;
    photo.alt = "";
    photo.width = 44;
    photo.height = 44;
    photo.loading = "lazy";
    photoLink.appendChild(photo);

    const details = document.createElement("div");
    details.className = "user-details";

    const username = document.createElement("a");
    username.className = "username";
    username.href = profileUrl;
    username.target = "_blank";
    username.rel = "noreferrer";
    username.textContent = `@${user.username}`;

    const fullName = document.createElement("span");
    fullName.className = "full-name";
    fullName.textContent = user.full_name || "";

    const relationshipInfo = document.createElement("span");
    relationshipInfo.className = "relationship-info";
    relationshipInfo.dataset.relationship = relationState.tone;
    relationshipInfo.textContent = t(relationState.infoKey);

    const signals = core.getAccountSignals(user);
    const signalInfo = document.createElement("span");
    signalInfo.className = "account-signals";
    const chips = [];
    if (signals.verified) chips.push(createChip("verified", t("verifiedBadge")));
    if (signals.private) chips.push(createChip("private", t("privateBadge")));
    if (signals.followerFollowingRatio != null) {
      chips.push(
        createChip(
          "ratio",
          t("ratioLabel", {
            ratio:
              signals.followerFollowingRatio >= 10
                ? "10+"
                : signals.followerFollowingRatio.toFixed(1),
          })
        )
      );
    }
    signalInfo.append(...chips);
    signalInfo.hidden = chips.length === 0;

    details.append(username, fullName, relationshipInfo, signalInfo);

    const protectButton = document.createElement("button");
    protectButton.type = "button";
    protectButton.className = "protect-button";
    protectButton.dataset.id = user.id;
    protectButton.innerHTML = ICON_STAR;
    protectButton.setAttribute("aria-pressed", String(isProtected(user.id)));
    protectButton.setAttribute(
      "aria-label",
      isProtected(user.id) ? t("unprotectedAccount") : t("protectedAccount")
    );
    protectButton.title = isProtected(user.id)
      ? t("unprotectedAccount")
      : t("protectedAccount");

    const actionButton = relationState.action === "follow"
      ? document.createElement("button")
      : null;
    if (actionButton) {
      actionButton.type = "button";
      actionButton.className = "action-button data-action-control";
      actionButton.dataset.id = user.id;
      actionButton.dataset.action = "follow";
      actionButton.textContent = t("follow");
    }

    userDiv.append(photoLink, details, protectButton);
    if (actionButton) userDiv.appendChild(actionButton);
      fragment.appendChild(userDiv);
    });
    userList.appendChild(fragment);
    if (startIndex + 80 < users.length) {
      requestAnimationFrame(() => renderChunk(startIndex + 80));
    }
  };
  renderChunk(0);
}

userList.addEventListener("click", (event) => {
  const protectButton = event.target.closest(".protect-button");
  if (protectButton) {
    toggleProtected(protectButton.dataset.id);
    return;
  }
  const button = event.target.closest(".action-button");
  if (button) handleActionButtonClick({ target: button });
});
let viewerId = instagramTransport.getViewerId() || null;

function isFollowWithinLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  followAttempts = followAttempts.filter((timestamp) => timestamp >= oneHourAgo);
  const attemptsLastMinute = followAttempts.filter((timestamp) => timestamp >= oneMinuteAgo).length;
  const attemptsLastHour = followAttempts.length;

  if (attemptsLastMinute >= 5) {
    showNotice(t("minuteLimit", { action: t("actionFollow") }), "warning");
    return false;
  }
  if (attemptsLastHour >= 60) {
    showNotice(t("hourLimit", { action: t("actionFollow") }), "warning");
    return false;
  }

  followAttempts.push(now);
  persistRateLimitState();
  return true;
}
const handleActionButtonClick = async (event) => {
  if (!ensureLicensed()) return;
  const userId = event.target.getAttribute("data-id");
  const action = event.target.getAttribute("data-action");
  if (action !== "follow" || !isFollowWithinLimit()) return;
  await followUser(userId, event.target);
};

function getInstagramErrorMessage(action, response, data) {
  const actionLabel = t("actionFollow");
  const reason =
    data?.feedback_message ||
    data?.message ||
    data?.error_type ||
    `HTTP ${response.status}`;
  const wasBlocked =
    response.status === 401 ||
    response.status === 403 ||
    response.status === 429 ||
    data?.feedback_required ||
    data?.spam ||
    data?.require_login ||
    data?.checkpoint_required ||
    /feedback_required|checkpoint_required|challenge_required|login_required/i.test(
      reason
    );

  if (wasBlocked) {
    return t("instagramBlocked", { action: actionLabel, reason });
  }

  return t("instagramRejected", { action: actionLabel, reason });
}

const responseMatchesFriendshipAction =
  core.responseMatchesFriendshipAction;

function getInstagramModule(moduleName) {
  try {
    const moduleRequire =
      typeof require === "function" ? require : window.require;
    return typeof moduleRequire === "function"
      ? moduleRequire(moduleName)
      : null;
  } catch (error) {
    console.warn(`Instagram module ${moduleName} is unavailable:`, error);
    return null;
  }
}

function getInstagramNavigationContext() {
  const navChain = getInstagramModule("IGNavChain")?.getInstance?.();
  const containerUtils = getInstagramModule("PolarisContainerModuleUtils");
  const pageId = navChain?.last?.()?.pageID;

  return {
    container_module:
      containerUtils?.getContainerModule?.(pageId) || "profile",
    nav_chain:
      navChain?.getNavChainForSend?.() ||
      "PolarisFeedRoot:feedPage:1:via_cold_start",
  };
}

async function performNativeInstagramFollow(userId) {
  const instapi = getInstagramModule("PolarisInstapi");
  if (!instapi?.apiPost) return { handled: false, data: null };

  const navigation = getInstagramNavigationContext();
  const response = await instapi.apiPost(
    "/api/v1/friendships/create/{target_user_id}/",
    {
      body: {
        container_module: navigation.container_module,
        include_follow_friction_check: true,
        nav_chain: navigation.nav_chain,
        user_id: userId,
      },
      path: { target_user_id: userId },
    }
  );

  return { handled: true, data: response?.data || response };
}

async function verifyFriendshipAction(userId, action) {
  const result = await instagramTransport.verifyFriendshipAction(
    userId,
    action,
    responseMatchesFriendshipAction
  );
  diagnostics.lastEndpoint = "friendship verification";
  diagnostics.lastStatus = result.matched ? 200 : null;
  return result.matched;
}

async function performFriendshipAction(userId, action) {
  if (action !== "follow") throw new Error(t("actionFailed", { action: t("actionFollow") }));
  try {
    if (action === "follow") {
      const nativeResult = await performNativeInstagramFollow(userId);
      if (nativeResult.handled) {
        diagnostics.lastEndpoint = "native Instagram follow";
        diagnostics.lastStatus = 200;
        if (
          responseMatchesFriendshipAction(nativeResult.data, action) ||
          (await verifyFriendshipAction(userId, action))
        ) {
          return nativeResult.data;
        }
        throw new Error(
          t("relationshipUnchanged", { action: t("actionFollow") })
        );
      }
    }

    const result = await instagramTransport.requestAction(action, userId);
    diagnostics.lastEndpoint = result.providerId;
    diagnostics.lastStatus = result.response?.status ?? null;

    if (
      responseMatchesFriendshipAction(result.data, action) ||
      (await verifyFriendshipAction(userId, action))
    ) {
      return result.data;
    }

    throw new Error(
      t("relationshipUnchanged", {
        action: t("actionFollow"),
      })
    );
  } catch (error) {
    const response = error?.response;
    const data = error?.data;
    const reason =
      data?.feedback_message ||
      data?.message ||
      error?.error?.message ||
      error?.message ||
      "unknown error";

    const responseLike = response || {
      status: diagnostics.lastStatus || 500,
    };

    throw new Error(
      getInstagramErrorMessage(action, responseLike, { ...data, message: reason })
    );
  }
}

const followUser = async (userId, button) => {
  button.disabled = true;
  button.dataset.state = "loading";
  button.textContent = t("followingLoading");
  dismissNotice();
  try {
    await performFriendshipAction(userId, "follow");
    console.log("User followed successfully.");
    const user = loadedUsers.get(userId);
    user.followed_by_viewer = true;
    user.requested_by_viewer = false;
    connectionCache.Following?.set(userId, user);
    connectionCacheUpdatedAt.Following = Date.now();
    if (connectionScanMeta.Following?.complete) {
      connectionScanMeta.Following.count = connectionCache.Following.size;
    }
    updateFilterCounts();
    renderCurrentUsers();
    return true;
  } catch (error) {
    diagnostics.lastError = error?.message || String(error);
    const user = loadedUsers.get(userId);
    if (user) button.textContent = t(getRelationshipState(user).labelKey);
    showNotice(error.message || t("actionFailed", { action: t("actionFollow") }));
    console.error("Error in the follow request:", error);
    return false;
  } finally {
    delete button.dataset.state;
    button.disabled = false;
  }
};

document.querySelectorAll(".filter[data-filter]").forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

document.getElementById("refreshButton").addEventListener("click", async () => {
  if (!caller) return;
  connectionCache.Following = null;
  connectionCache.Followers = null;
  connectionCacheUpdatedAt.Following = 0;
  connectionCacheUpdatedAt.Followers = 0;
  connectionScanMeta.Following = null;
  connectionScanMeta.Followers = null;
  // Must pass a fresh generation: without it fetchConnections bails out after
  // loading and never hides the loader (the "reload spins forever" bug).
  await fetchConnections(caller, ++viewGeneration);
});

document.getElementById("saveSnapshotButton").addEventListener("click", () => {
  saveCurrentSnapshot(true);
});
document.getElementById("historyButton").addEventListener("click", () => {
  if (!ensureLicensed()) return;
  renderHistory();
  closeHistoryDetail();
  historyDialog.hidden = false;
});
document.getElementById("closeHistoryButton").addEventListener("click", () => {
  historyDialog.hidden = true;
});
historyDialog.addEventListener("click", (event) => {
  if (event.target === historyDialog) historyDialog.hidden = true;
});
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
document.getElementById("exportJsonButton").addEventListener("click", exportJson);
document.getElementById("backupButton").addEventListener("click", exportBackup);
document.getElementById("restoreButton").addEventListener("click", () => {
  document.getElementById("restoreInput").click();
});
document.getElementById("restoreInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) restoreBackup(file);
  event.target.value = "";
});


/* ───────────── License gate ───────────── */
let license = { active: false, reason: "checking" };
const licenseDialog = document.getElementById("licenseDialog");
const licenseInput = document.getElementById("licenseInput");
const licenseMessage = document.getElementById("licenseMessage");
const licenseActivateButton = document.getElementById("licenseActivateButton");
const licenseBuyLink = document.getElementById("licenseBuyLink");
const licenseBanner = document.getElementById("licenseBanner");
const licenseChip = document.getElementById("licenseChip");
const licenseChipText = document.getElementById("licenseChipText");

function licenseRequest(op, key = "") {
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    const finish = (payload) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      resolve(payload);
    };
    const onMessage = (event) => {
      if (
        event.source !== window ||
        !event.data?.mifStorage ||
        event.data.action !== "licenseResult" ||
        event.data.requestId !== requestId
      ) return;
      finish(event.data.payload || { active: false, reason: "server_error" });
    };
    const timer = setTimeout(() => finish({ active: false, reason: "offline" }), 25000);
    window.addEventListener("message", onMessage);
    window.postMessage(
      { mifStorage: true, action: "license", requestId, payload: { op, key, accountId: viewerId || "" } },
      window.location.origin
    );
  });
}

function licenseDate(value) {
  return new Date(value).toLocaleDateString(currentLocale === "th" ? "th-TH" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function licenseReasonText() {
  const reason = license.reason;
  if (!reason || reason === "no_key" || reason === "checking") return "";
  const key = `license_${reason}`;
  return translations.en[key] ? t(key) : t("license_server_error");
}

// Banner (locked), status chip (active) and the "Get a key" link follow the license state.
function renderLicenseState() {
  const checking = license.reason === "checking";
  licenseBanner.hidden = license.active || checking;
  licenseChip.hidden = !license.active;
  if (license.active) {
    let label = t("licenseChipForever");
    let tone = "ok";
    if (license.expiresAt) {
      const daysLeft = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / 86400000);
      if (daysLeft <= 3) {
        label = t("licenseChipSoon", { days: Math.max(daysLeft, 0) });
        tone = "soon";
      } else {
        label = t("licenseChipUntil", { date: licenseDate(license.expiresAt) });
      }
    }
    licenseChipText.textContent = label;
    licenseChip.dataset.tone = tone;
    licenseChip.title = t("licenseChipTitle");
  }
  const buyUrl = license.buyUrl || "";
  licenseBuyLink.hidden = !buyUrl;
  if (buyUrl) licenseBuyLink.href = buyUrl;
}

function setLicenseMessage(text, tone = "") {
  licenseMessage.textContent = text;
  if (tone) licenseMessage.dataset.tone = tone;
  else delete licenseMessage.dataset.tone;
}

function showLicenseDialog(message = "", tone = "error") {
  setLicenseMessage(message, tone);
  licenseDialog.hidden = false;
  licenseInput.focus({ preventScroll: true });
}

function ensureLicensed() {
  if (license.active) return true;
  showLicenseDialog(licenseReasonText());
  return false;
}

async function activateFromDialog() {
  const key = licenseInput.value.trim();
  if (!key) {
    setLicenseMessage(t("licenseEmpty"), "error");
    return;
  }
  licenseActivateButton.disabled = true;
  setLicenseMessage(t("licenseChecking"));
  const result = await licenseRequest("activate", key);
  licenseActivateButton.disabled = false;
  if (result.active) {
    license = result;
    licenseInput.value = "";
    setLicenseMessage(
      result.expiresAt ? t("licenseOkUntil", { date: licenseDate(result.expiresAt) }) : t("licenseOk"),
      "success"
    );
    setTimeout(() => { licenseDialog.hidden = true; }, 900);
  } else {
    // A wrong key must not lock out someone whose current key still works.
    if (!license.active) license = result;
    else license = { ...license, buyUrl: result.buyUrl || license.buyUrl };
    const text = result.reason && translations.en[`license_${result.reason}`]
      ? t(`license_${result.reason}`)
      : t("license_server_error");
    setLicenseMessage(text, "error");
  }
  renderLicenseState();
}

licenseActivateButton.addEventListener("click", activateFromDialog);
licenseInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") activateFromDialog();
});
document.getElementById("licenseCloseButton").addEventListener("click", () => {
  licenseDialog.hidden = true;
});
document.getElementById("licenseBannerButton").addEventListener("click", () => showLicenseDialog(licenseReasonText()));
licenseChip.addEventListener("click", () => showLicenseDialog("", ""));

licenseRequest("status").then((result) => {
  license = result;
  renderLicenseState();
  if (!result.active) setTimeout(() => ensureLicensed(), 3400); // after the preloader
});

let loadedStateAccountId = null;
let stateLoadGeneration = 0;

function applyStoredState(payload, accountId) {
  const storedLocale = payload?.locale;
  if (storedLocale === "en" || storedLocale === "th") setLocale(storedLocale, false);

  const storedLimits = payload?.rateLimits;
  followAttempts = Array.isArray(storedLimits?.follow) ? storedLimits.follow : [];

  protectedUserIds.clear();
  (Array.isArray(payload?.whitelist) ? payload.whitelist : [])
    .map(String).filter(Boolean).slice(0, 5000)
    .forEach((id) => protectedUserIds.add(id));

  snapshotHistory = (Array.isArray(payload?.snapshots) ? payload.snapshots : [])
    .filter((snapshot) => accountId === "default"
      ? !snapshot?.viewerId
      : snapshot?.viewerId && String(snapshot.viewerId) === accountId)
    .slice(0, 12);

  settings = payload?.settings && typeof payload.settings === "object" ? payload.settings : {};
  const storedOrb = settings.orbPos;
  if (storedOrb && Number.isFinite(storedOrb.fx) && Number.isFinite(storedOrb.fy)) {
    orbPos = { fx: Math.min(1, Math.max(0, storedOrb.fx)), fy: Math.min(1, Math.max(0, storedOrb.fy)) };
    if (isMinimized) placeOrb();
  }

  loadedStateAccountId = accountId;
  latestDiff = core.diffSnapshots(snapshotHistory[1], snapshotHistory[0]);
  renderHistory();
  renderCurrentUsers();
}

function requestStoredState(accountId) {
  const targetAccount = String(accountId || "default");
  const requestId = crypto.randomUUID();
  const generation = ++stateLoadGeneration;

  return new Promise((resolve) => {
    let timer = null;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (timer) clearTimeout(timer);
    };
    const onMessage = (event) => {
      if (
        event.source !== window ||
        !event.data?.mifStorage ||
        event.data.action !== "state" ||
        event.data.requestId !== requestId
      ) return;

      cleanup();
      if (generation !== stateLoadGeneration) return resolve(false);
      applyStoredState(event.data.payload || {}, targetAccount);
      resolve(true);
    };

    window.addEventListener("message", onMessage, { signal: lifecycle.signal });
    timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
    window.postMessage({
      mifStorage: true,
      action: "get",
      requestId,
      payload: { accountId: targetAccount },
    }, window.location.origin);
  });
}

void requestStoredState(viewerId || "default");

document
  .getElementById("copyDiagnosticsButton")
  .addEventListener("click", async () => {
    const counts = core.countRelationships([...loadedUsers.values()]);
    const report = {
      extension: "IG Snapper",
      version: "2.3.3",
      locale: currentLocale,
      view: caller || "home",
      filter: currentFilter,
      counts,
      lastEndpoint: diagnostics.lastEndpoint,
      lastStatus: diagnostics.lastStatus,
      lastFailure: Boolean(diagnostics.lastError),
      generatedAt: new Date().toISOString(),
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    showNotice(t("diagnosticsCopied"), "success");
  });

document.getElementById("manage-instagram-followers-root")?.addEventListener(
  "pointermove",
  (event) => {
    const panel = event.target.closest?.(".my-component");
    if (panel) {
      const box = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${event.clientX - box.left}px`);
      panel.style.setProperty("--my", `${event.clientY - box.top}px`);
    }
    const glowTarget = event.target.closest?.(
      ".user, .primary-cta, .intro-steps li, .insight-stat"
    );
    if (glowTarget) {
      const box = glowTarget.getBoundingClientRect();
      glowTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
      glowTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
    }
  },
  { signal: lifecycle.signal, passive: true }
);

setLocale(getPreferredLocale(), false);
document
  .getElementById("findNonFollowersButton")
  .focus({ preventScroll: true });
})();
