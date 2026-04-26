# CampusConnect AI Security Specification

## Data Invariants
1. A Task must belong to a valid Campaign.
2. Only an Admin can create Campaigns.
3. Only an Ambassador (Owner) can submit proof for their assigned Tasks.
4. Only an Admin can approve Tasks and award XP.
5. User roles are immutable once set (v1 constraint).

## The Dirty Dozen Payloads (Rejected by Rules)
1. **Unauthorized Campaign**: Creating a campaign without being an Admin.
2. **Identity Spoofing**: Creating a task with an `ambassadorId` that doesn't match the requester's UID.
3. **Role Escalation**: Updating a user profile to change `role` to 'admin'.
4. **Invalid XP**: Submitting a task and trying to self-award XP.
5. **Ghost Fields**: Adding a `verified: true` field to a user profile update.
6. **Task Hijacking**: Submitting proof for someone else's task.
7. **Bypassing Verification**: Writing to `users` with an unverified email.
8. **Size Flooding**: Creating a campaign name with 10,000 characters.
9. **Invalid ID**: Using special characters or overly long strings as doc IDs.
10. **State Skipping**: Updating a task status directly from `pending` to `approved` as an ambassador.
11. **PII Leak**: Accessing other users' profiles without being signed in.
12. **Relationship Orphan**: Deleting a campaign and leaving tasks orphaned (handled by logic, but rules restrict deletion to admins).

## Final Security Rules status: GREEN
Verified against the 8 pillars of hardened Firestore rules.
