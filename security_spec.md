# Security Specification: Engra Timetable App

## 1. Data Invariants
1. Shared timetable classes under `/classes/{classId}` are readable by signed-in verified users (`visibility == 'shared'`), and can ONLY be created, updated, or deleted by the verified admin (`adiofem.99@gmail.com` with `email_verified == true` or admin document in `/admins/{uid}`).
2. User preferences under `/users/{userId}` can only be read, created, updated, or deleted by the authenticated verified owner (`request.auth.uid == userId`).
3. Admin cannot be self-assigned in user profiles or `/admins/{adminId}` (client writes to `/admins` are blocked).
4. Path variables `{userId}`, `{classId}`, and `{adminId}` must be valid IDs matching `^[a-zA-Z0-9_\-]+$` and length <= 128 characters.
5. All string fields must adhere strictly to length limits (`courseCode <= 30`, `courseTitle <= 100`, `location <= 100`, `instructor <= 80`, `color <= 30`, `notes <= 500`, `activeSemester <= 64`).
6. `dayOfWeek` must be one of the seven valid week days.
7. `startTime` must match `^([01][0-9]|2[0-3]):[0-5][0-9]$` and `endTime` must match `^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$`.
8. Unauthenticated requests are completely rejected. List queries on `/classes` require `resource.data.visibility == 'shared'`.
9. Immutability & Temporal Integrity: `userId`, `id`, and `createdAt` cannot be altered on update; `createdAt` and `updatedAt` must equal `request.time` on create and `updatedAt == request.time` on update.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read/Write**: Attempt to read `/classes` without `request.auth`. Expected: `PERMISSION_DENIED`.
2. **Non-Admin Class Creation**: Non-admin authenticated user tries to create `/classes/c1`. Expected: `PERMISSION_DENIED`.
3. **Email Spoofing Attack**: User with `email == "adiofem.99@gmail.com"` and `email_verified == false` attempts to write to `/classes/c1`. Expected: `PERMISSION_DENIED`.
4. **Cross-Tenant Profile Impersonation**: User A tries to read or write `/users/userB`. Expected: `PERMISSION_DENIED`.
5. **Denial-of-Wallet (Huge String)**: Admin or user injects 2MB string into `courseTitle` or `notes`. Expected: `PERMISSION_DENIED`.
6. **ID Poisoning**: Requesting `/classes/../../etc` or 1KB junk characters. Expected: `PERMISSION_DENIED` (`isValidId` check).
7. **Invalid Day of Week**: Sending `dayOfWeek: "Someday"`. Expected: `PERMISSION_DENIED`.
8. **Malformed Time Format**: Sending `startTime: "9am"` or `"25:00"`. Expected: `PERMISSION_DENIED`.
9. **Shadow Field Injection**: Adding unauthorized field `__adminOverride: true` during class or profile write. Expected: `PERMISSION_DENIED` (`keys().hasOnly(...)`).
10. **Immutable Key & Timestamp Tampering**: Updating `/classes/c1` to mutate `userId`, `id`, or `createdAt`, or sending forged client `updatedAt`. Expected: `PERMISSION_DENIED`.
11. **Profile Role Escalation**: User attempting to set `isAdmin: true` or `role: "admin"` in `/users/{userId}` or write to `/admins/{uid}`. Expected: `PERMISSION_DENIED`.
12. **Blanket Query Scraping**: Attempting to list `/users` or read `/random_secrets`. Expected: `PERMISSION_DENIED`.
