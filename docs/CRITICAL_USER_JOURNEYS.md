# Critical User Journeys

This document outlines the project's critical user journeys, with step-by-step flows, expected results, and acceptance criteria. Use these as the basis for endpoint/feature tests and UI test scenarios.

---

## 1) User Can Create a Monitor

- **Purpose**: Allow a user to create a monitor that will be evaluated by the system scheduler.

- **Preconditions**:
  - User is authenticated (if auth exists) or has appropriate access.
  - Required group(s) exist if monitors must be associated with a group (optional).

- **Primary UI Flow** (Frontend):
  1. User opens the "Create Monitor" screen/form in the UI.
  2. User fills in required fields: `name`, `type` (e.g., http/ping), `target` (URL or IP), `interval`, and optional settings.
  3. User clicks `Create` (or `Save`).
  4. UI shows a confirmation and displays the new monitor in the list.

- **Primary API Flow** (Backend):
  1. Frontend sends POST request to create monitor endpoint with payload similar to the DTO in `api/src/monitors/dto/create-monitor.dto.ts`.
  2. Backend validates the payload and persists the monitor in the `monitors` collection/table using `api/src/monitors/monitors.repository.ts`.
  3. Backend responds with 201 Created and the new monitor resource (including ID).
  4. Scheduler/service `api/src/monitors/monitor-scheduler.service.ts` picks up the new monitor (either via immediate schedule update or next cycle).

- **Expected Results**:
  - API returns 201 with monitor data containing a generated ID.
  - Monitor appears in UI lists and is scheduled for checking.
  - Scheduler runs checks for the monitor at configured intervals.

- **Acceptance Criteria**:
  - POST `/monitors` with valid payload returns 201 and the created monitor.
  - Created monitor is persisted and retrievable via GET `/monitors/:id`.
  - Scheduler service includes the monitor in its next check cycle.
  - Input validation errors return appropriate 4xx responses (missing required fields -> 400).

- **Test Cases**:
  - Create monitor with minimal valid payload -> expect 201 and data persisted.
  - Create monitor missing required field -> expect 400 and error message.
  - Verify scheduler triggers check for newly created monitor within expected interval.


---

## 2) User Can Create a Notification and Assign It to a Group

- **Purpose**: Let a user configure a notification (e.g., email, webhook) and assign it to a group so that alerts are delivered to that group.

- **Preconditions**:
  - At least one group exists. Groups are defined in `api/src/groups/dto/create-group.dto.ts` and persisted by `api/src/groups/groups.repository.ts`.

- **Primary UI Flow** (Frontend):
  1. User navigates to "Notifications" -> "Create Notification".
  2. User fills the notification form: `name`, `type` (email/webhook/sms), delivery settings (email address, webhook URL), and selects one or more groups from a multi-select.
  3. User clicks `Create`.
  4. UI shows success and lists the notification, showing assigned group(s).

- **Primary API Flow** (Backend):
  1. Frontend sends POST to create-notification endpoint with payload similar to `api/src/notifications/dto/create-notification.dto.ts` including `groupId` or `groupIds`.
  2. Backend validates the payload and confirms referenced group IDs exist (via `groups.repository` or service).
  3. Backend persists the notification in `notifications` collection/table via `api/src/notifications/notifications.repository.ts`.
  4. Backend returns 201 Created with the notification resource including its assigned group reference(s).

- **Expected Results**:
  - API returns 201 with notification data and group association(s).
  - Notification appears in UI and shows assigned group(s).
  - When a monitor detects an alert that targets this notification (or its group), the notification delivery mechanism is invoked (email/webhook delivery logic in `notifications.service.ts`).

- **Acceptance Criteria**:
  - POST `/notifications` with valid payload and existing group IDs returns 201 and persisted notification.
  - Attempting to assign a notification to a non-existent group returns 400 (or 404), with a clear error.
  - Notifications associated with groups cause the system to attempt delivery when an alert is generated for monitors linked to that group.

- **Test Cases**:
  - Create notification with valid group ID -> expect 201 and group association persisted.
  - Create notification with invalid/non-existent group ID -> expect 400/404.
  - Trigger an alert for a monitor associated with that group -> expect the notification delivery handler to be called (mockable in tests).


---

## Notes and References

- DTOs and repositories referenced above live under:
  - `api/src/monitors/dto/create-monitor.dto.ts`
  - `api/src/monitors/monitor.schema.ts`
  - `api/src/monitors/monitors.repository.ts`
  - `api/src/monitors/monitor-scheduler.service.ts`
  - `api/src/notifications/dto/create-notification.dto.ts`
  - `api/src/notifications/notifications.repository.ts`
  - `api/src/notifications/notifications.service.ts`
  - `api/src/groups/dto/create-group.dto.ts`
  - `api/src/groups/groups.repository.ts`

- Use these journeys to create integration/e2e tests (see `test/app.e2e-spec.ts`) and corresponding UI tests in `ui/__tests__`.

- If authentication or RBAC is added, update the Preconditions and Acceptance Criteria to require authenticated and authorized users.


---

Revision history:
- 2025-12-02: Initial draft including Monitor and Notification->Group journeys.
