# Security Specification: Timetable App

## 1. Data Invariants
1. User profile can only be accessed or modified by its authenticated owner (`request.auth.uid == userId`).
2. Class items belong exclusively to the user under `/users/{userId}/classes/{classId}`.
3. Users cannot create or modify classes under another user's path (`incoming().userId == request.auth.uid && userId == request.auth.uid`).
4. Path variables `{userId}` and `{classId}` must be valid IDs matching `^[a-zA-Z0-9_\-]+$` and length <= 128 characters.
5. All string fields must adhere strictly to length limits (e.g. `courseCode <= 30`, `courseTitle <= 100`, `location <= 100`, `notes <= 500`).
6. `dayOfWeek` must be one of the seven valid week days.
7. `startTime` and `endTime` must match `^[0-2][0-9]:[0-5][0-9]$`.
8. Unauthenticated requests are completely rejected. Blanket queries are prohibited; queries are strictly bounded to the user's subcollection.
9. Immutability: `userId` and `id` cannot be altered on update (`incoming().userId == existing().userId`).

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read/Write**: Attempt to read `/users/user123/classes` without `request.auth`. Expected: `PERMISSION_DENIED`.
2. **Cross-Tenant Impersonation**: User A (`auth.uid: userA`) tries to read or write to `/users/userB/classes/c1`. Expected: `PERMISSION_DENIED`.
3. **Payload Spoofing**: User A sends `userId: "userB"` inside their own document `/users/userA/classes/c1`. Expected: `PERMISSION_DENIED`.
4. **Denial-of-Wallet (Huge String)**: Injecting 2MB string into `courseTitle` or `notes`. Expected: `PERMISSION_DENIED` (`size() <= 100` / `size() <= 500`).
5. **ID Poisoning**: Requesting document with malicious path `../etc` or 1KB junk characters. Expected: `PERMISSION_DENIED` (`isValidId` check).
6. **Invalid Day of Week**: Sending `dayOfWeek: "Someday"`. Expected: `PERMISSION_DENIED`.
7. **Malformed Time Format**: Sending `startTime: "9am"` instead of `"09:00"`. Expected: `PERMISSION_DENIED`.
8. **Shadow Field Injection**: Adding unauthorized field `__adminOverride: true` during class creation. Expected: `PERMISSION_DENIED` (`keys().hasOnly(...)`).
9. **Immutable Key Tampering**: Updating an existing class to mutate `userId` to another user. Expected: `PERMISSION_DENIED`.
10. **Global Catch-All Probe**: Attempting to read `/random_secrets` or non-existent root collection. Expected: `PERMISSION_DENIED`.
11. **Profile Role Escalation**: User attempting to set `isAdmin: true` in user profile. Expected: `PERMISSION_DENIED`.
12. **Blanket Query Scraping**: Attempting to query collectionGroup('classes') without user boundary. Expected: `PERMISSION_DENIED`.
