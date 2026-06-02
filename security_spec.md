# Security Specification for Firestore

This document describes the security policies, data invariants, and access control matrices for database entities.

## 1. Data Invariants

1. **User Ownership & Role Editing Rules**:
   - A user's profile can be created by the user themselves.
   - Only a user with the `'owner'` or `'administrator'` role can modify roles, departments, or approval statuses of others.
   - Users cannot elevate their own role upon profile creation (verified by standard role constraints or setting default to 'guest' unless database has no owners yet).
   - A user can edit their own basic profile properties like `'name'`, `'avatar'`, and `'bgColor'`, as well as their active status (`'isOnline'`), but *never* their `'role'` or `'departmentId'`.

2. **Task Modification Rules**:
   - Newly created tasks must be valid. Anyone authenticated and having an active role (not `'guest'`) can create tasks.
   - Task `creatorId` must match the authenticated user.
   - Updates to tasks can only be done by members who have a assigned role which is not `'guest'`.
   - Sub-arrays and fields are validated.

3. **Verification Constraints**:
   - All write operations require that the user is authenticated, and *crucially*, if logged in via Email/Password, their email must be verified (`request.auth.token.email_verified == true`). Users with unverified emails are blocked from reading or writing data. Note: users can read their own profile in order to verify their status, but they cannot access standard resources until verified and approved.

## 2. The Dirty Dozen Payloads (Potential Exploits)

1. **Self-Escalation**: Authenticated user attempts to set their role to `owner` or `administrator` upon registration.
2. **Unverified Email Access**: An email/password registrant tries to read tasks before verifying their email address.
3. **Guest Role Write**: A verified user who has the default `guest` role (awaiting administrator's approval) attempts to create or update a task.
4. **Spoofed Ownership**: A user tries to create a task where `creatorId` contains someone else's UID.
5. **Unauthorized Role Modification**: A standard `developer` attempts to update another user's role to `administrator`.
6. **Task Hijacking**: A user with role `operator` attempts to delete a task created by an `owner` (only owners/admins or the creator should delete tasks).
7. **Junk Fields Injection**: Injecting arbitrary extra fields like `{ "ghost_field": "val" }` in a task or user profile.
8. **Invalid Priority Range**: Creating a task with `priority: "ultra-high"` which is outside the enum values.
9. **Blanket Collection Leak**: Client tries to perform a list query on `/users` or `/tasks` without filters, attempting to scrape all content.
10. **Malicious Long IDs**: Writing a document where ID is a huge random string of 1MB, causing resource exhaustion.
11. **Negative Workload**: Setting user `workload` to `-100%` or other invalid ranges.
12. **System-Generated Field Invalidation**: Directly modifying the activity logs or system time records without server-validated stamps.

## 3. Test Cases (TDD Blueprint)

We will secure all writes and reads to guard against these vectors. Rules will be enforced directly at the database gateway through `firestore.rules`.
