# Community, Friends, private Chat, and Support Chat

Implemented on 2026-09-23. The original worktree was clean; existing support conversations and staff friendship records are preserved.

## What changed

- **Community** appears immediately before Notifications in the sidebar for adopters, vets, employees, managers, and admins. The adopter dashboard links to Community as well.
- Members can send text (up to 4,000 characters), attach one PNG/JPEG/WebP photo (up to 5 MB), and reply to messages. Sender avatars are circular, own names are omitted, and vets have a Vet badge.
- Users can delete their own messages; staff can delete any Community message. Deleted messages retain their place and show “This message has been deleted.” Text and photo bytes are removed, and reply previews no longer expose deleted text.
- Employees, managers, and admins can block/unblock users from Community. The blocked screen replaces Community content. Friendships, private chat, support, and the account itself are unaffected.
- **Friends** now belongs to adopters, with incoming/outgoing requests, accept/reject/cancel, removal, public profile viewing, and online/offline presence. Automatic staff friendships and their old API have been retired. Old staff Friends bookmarks open Community.
- **Chat** in the adopter sidebar contains private conversations with accepted friends. Both conversation creation and message sending check friendship on the server. Removing a friend stops new messages, but participants keep their history. Staff cannot access friend chats through the new API.
- **Support Chat** remains the existing support system with its history and shared inbox behavior. Adopters open it with a floating button; staff have a Support Chat sidebar entry. Admins and managers can now reply under the same conversation ownership rules as employees.
- Public profiles expose only ID, name, email, avatar, and role. Adopters cannot open staff/vet public profiles, including by manually calling the endpoint. Current avatar images are readable by registered users so message identities display correctly; avatar deletion permissions remain unchanged.

## Main files

- `Backend/src/modules/community/`: DTOs, authenticated endpoints, authorization, and persistence.
- `Backend/src/database/entities/community.entity.ts`: Community messages/blocks, friend requests, private conversations/messages, and presence entities.
- `Backend/src/database/migrations/1790200000000-AddCommunityAndDirectChat.ts`: reversible schema migration. Accepted friendships reuse the existing `friendships` table.
- `Frontend/src/pages/CommunityPage.tsx`: Community, moderation controls, and public profile dialog.
- `Frontend/src/pages/FriendsPage.tsx`: adopter friendship lifecycle and status.
- `Frontend/src/pages/DirectChatPage.tsx`: private conversations and read receipts.
- `Frontend/src/components/DashboardLayout.tsx` and `Frontend/src/app/App.tsx`: navigation, support entry point, routing, and presence heartbeat.
- Existing users, uploads, and support modules were adjusted to remove staff friendship behavior, permit avatar display, and enable staff replies.

## Run locally

Apply the migration to your intended development database, then start the backend and frontend:

```bash
npm run migration:run
npm run backend:dev
# In another terminal:
npm run frontend:dev
```

The application database was **not** migrated during implementation. Database testing used a separate disposable PostgreSQL container. Production already runs pending migrations on application startup through the existing configuration.

Use `VITE_USE_MOCKS=false`. The existing demo mock API does not implement the new social endpoints.

Community/private chat refresh every four seconds; friend lists refresh every five seconds. Presence sends a heartbeat every 15 seconds and expires after 45 seconds. This is polling-based basic chat; existing Support Chat retains its WebSocket transport. A newly applied block stops server access immediately and replaces the open Community screen at its next refresh.

Community photo bytes are stored with their message in PostgreSQL and served through an authenticated, non-cached endpoint. This makes photo deletion and access checks consistent with message permissions. New screens currently use English labels; existing screens retain their translations.

## Endpoints

All require authentication. Moderation additionally requires ADMIN, MANAGER, or EMPLOYEE. Friends/private chat/public profiles require an ADOPTER caller.

| Purpose | Method and path |
| --- | --- |
| Access state | `GET /community/access` |
| Community history | `GET /community/messages?before=<message-id>` |
| Post text/photo/reply | `POST /community/messages` (`multipart/form-data`: `text`, `photo`, `replyTo`) |
| Delete message | `DELETE /community/messages/:id` |
| Retrieve photo | `GET /community/messages/:id/image` |
| List blocks | `GET /community/blocks` |
| Block user | `POST /community/blocks` with `{userId}` |
| Unblock user | `DELETE /community/blocks/:id` |
| Public adopter profile | `GET /public-profiles/:id` |
| Presence | `POST /presence/heartbeat` |
| List/remove friends | `GET /friends`, `DELETE /friends/:id` |
| List/send requests | `GET /friend-requests`, `POST /friend-requests` with `{userId}` |
| Respond/cancel | `PATCH /friend-requests/:id` with `{action: "accept" | "reject" | "cancel"}` |
| List/start private conversations | `GET /direct-conversations`, `POST /direct-conversations` with `{userId}` |
| Private history | `GET /direct-conversations/:id/messages?before=<message-id>` |
| Send private message | `POST /direct-conversations/:id/messages` with `{text}` |
| Read receipts | `PATCH /direct-conversations/:id/read` |
| Support | Existing `/conversations` endpoints retained |

## Validation

- Backend build passed.
- Frontend production build passed (existing bundle-size warning).
- 28 backend tests passed: support regressions, avatar permissions, real PostgreSQL social behavior, concurrent requests, privacy, deletion, moderation, presence, pagination, and migration reversal.
- Playwright browser checks passed for adopter, admin, and vet flows: posting/deletion, profile restrictions, friend acceptance, private chat, support navigation, moderation, and blocked screens.
- Full frontend TypeScript check has 504 existing diagnostics. Comparing against a clean copy of the original commit produced **identical diagnostics**, with none added by this change.
- Dependencies were installed locally for verification without changing package manifests or the lockfile. The existing lockfile is out of sync; local installation required `--legacy-peer-deps`, and React peers were installed without saving.

Re-run:

```bash
npm run backend:build
npm run frontend:build
node --test Backend/test/chat/*.test.cjs Backend/test/community/avatar.test.cjs
# Supply a dedicated disposable PostgreSQL database, never your application database:
TEST_DATABASE_URL=postgres://USER:PASSWORD@HOST/DATABASE node --test Backend/test/community/community.test.cjs
# With the frontend dev server running and mocks disabled:
node Frontend/tests/community.browser.mjs
```

## Undo

A local undo bundle is saved under `.git/community-change/`, outside the application source. From the repository root:

```bash
bash .git/community-change/undo.sh
```

It first checks that the reverse patch applies, then reverses only this implementation. It does not reset Git, alter your index, remove unrelated files, or touch the database. If subsequent edits conflict, it stops instead of overwriting them. The patch includes added, edited, and removed source/documentation/test files. The undo bundle itself remains available locally and is not included in commits.

If you have applied the database migration and also want to remove its tables, first back up any new Community/private-chat data. While this migration is still present in the source, verify it is the latest applied migration and run:

```bash
npm run migration:revert
```

Then run the source undo command above. Database reversal deletes the new Community messages/photos, blocks, friend requests, direct conversations/messages, and presence table. It leaves existing users, support data, and the shared friendships table intact. Code-only undo may leave the added tables safely unused.

## Profile and message menu refinement

The profile dialog displays adopter email, has a top-right close icon, and centers the friend-request button at the bottom. Community message actions are in a top-right dropdown revealed on hover or keyboard focus (always visible on touch devices). Adopters/vets can reply and delete their own messages; staff can delete, reply, and block other users.

To undo only the profile/menu refinement while keeping the main Community implementation:

```bash
bash .git/community-change/undo-refinements.sh
```

The original `undo.sh` continues to undo the entire implementation, including this refinement.

## Friends tabs and chat layout update

- Friends now uses compact Friends/Requests pills and a single changing list, retaining existing accept/reject/cancel/remove/chat actions.
- Friends search filters existing friends and finds other active adopters by name with an Add friend action. The only added backend capability is authenticated `GET /adopters/search?name=...`: adopter-only callers, no staff/self results, a 100-character query limit, and at most 30 public identity results. Existing friendship and chat logic is unchanged.
- Private Chat lists all friends with avatars, presence, and name search, including friends with no conversation yet. Previous conversations remain available separately.
- Community uses the available content width and one title. A compact single-row composer has a plus upload icon inside its right edge and an adjacent arrow send button. Enter sends; Shift+Enter adds a line. Selected photos can be removed before sending.
- Community appears immediately before Notifications for every role. Blocked users are managed in an accessible popup.
- The floating Support Chat entry opens/reuses the support conversation directly, with retry handling on failure.
- Backend and frontend builds passed, 15 focused backend checks passed, and browser flows passed for all five roles, including search and tabs. No migration is needed for this layout/search update.

Undo only this latest layout/search update:

```bash
bash .git/community-change/undo-layout.sh
```

The full implementation undo script remains available as `bash .git/community-change/undo.sh`.

## Full-width chats and logout presence fix

Friends and adopter/staff Support Chat now use the available content width. Private Chat starts with a full-width searchable list; opening a conversation replaces the list with a separate full-width conversation view and Back to chats control.

Logout now invalidates sessions and clears presence in one transaction. Heartbeats lock the same user row and verify the authenticated session version, preventing a stale request from restoring online status after logout. Friends see Offline on the next refresh (up to five seconds); abrupt connection loss still uses the 45-second expiry. No additional database migration is needed.

Both builds, all 29 backend checks, and browser checks across all five roles passed. Undo only this update:

```bash
bash .git/community-change/undo-width-presence.sh
```
