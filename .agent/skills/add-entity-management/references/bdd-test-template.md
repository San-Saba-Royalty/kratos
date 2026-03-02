# BDD Integration Test Templates

Parameterised templates for entity management BDD tests.
Replace `{Entity}`, `{entity-kebab}`, `{entitiesName}`, `{EntityIdField}`,
`{entityNameField}`, `{pageTitle}`, `{pageRoute}`, and `{hubPath}` with values
from `entity-registry.md`.

---

## 1. Feature File

Save to: `tests/features/ui/{entity-kebab}-management.feature`

```gherkin
@ui @video @entity-management @{entity-kebab}
Feature: {Entity} Management
  As an admin user
  I need to manage {entitiesName}
  So that I can create, view, edit, and delete {entitiesName} in the system

  Background:
    Given I am logged in
    And I navigate to "/admin/{pageRoute}"
    And the page should be fully loaded

  # ── List & Search ────────────────────────────────

  Scenario: Page displays {entitiesName} data table
    Then I should see the "{entity-kebab}-management-page" element
    And the data table should be visible
    And the data table should contain at least 1 row

  Scenario: Search filters {entitiesName} by name
    When I type "Test" in the search box
    Then the data table should only show rows containing "Test"
    When I clear the search box
    Then the data table should show all {entitiesName}

  # ── Create ───────────────────────────────────────

  Scenario: Create a new {entity}
    When I click the "Add New" button
    Then the editor dialog should be visible
    And the dialog title should contain "Create"
    When I fill in the {entity} form with valid data
    And I click the "Save" button in the dialog
    Then the editor dialog should close
    And I should see a success toast
    And the new {entity} should appear in the data table

  Scenario: Create dialog validates required fields
    When I click the "Add New" button
    And I click the "Save" button in the dialog without filling required fields
    Then I should see validation errors in the dialog

  # ── Edit ─────────────────────────────────────────

  Scenario: Edit an existing {entity}
    Given at least one {entity} exists in the data table
    When I click the edit action on the first {entity}
    Then the editor dialog should be visible
    And the dialog title should contain "Edit"
    And the form should be pre-populated with the {entity} data
    When I change the name field to "Updated {Entity} Name"
    And I click the "Save" button in the dialog
    Then the editor dialog should close
    And I should see a success toast
    And the data table should show "Updated {Entity} Name"

  # ── Delete ───────────────────────────────────────

  Scenario: Delete an existing {entity}
    Given at least one {entity} exists in the data table
    When I click the edit action on the first {entity}
    And I click the "Delete" button in the dialog
    Then I should see a delete confirmation prompt
    When I confirm the deletion
    Then the editor dialog should close
    And I should see a success toast
    And the deleted {entity} should no longer appear in the data table

  # ── Real-time Sync (SignalR) ─────────────────────

  @realtime
  Scenario: Real-time create — new {entity} appears in second session
    Given I have two browser sessions open as "Session A" and "Session B"
    And both sessions are on the "{pageRoute}" page
    When in "Session A", I create a new {entity} with name "RT Create Test"
    Then in "Session B", "RT Create Test" should appear in the data table within 3 seconds

  @realtime
  Scenario: Real-time update — edited {entity} refreshes in second session
    Given I have two browser sessions open as "Session A" and "Session B"
    And both sessions are on the "{pageRoute}" page
    And at least one {entity} exists in the data table
    When in "Session A", I edit the first {entity} and change name to "RT Updated"
    Then in "Session B", "RT Updated" should appear in the data table within 3 seconds

  @realtime
  Scenario: Real-time delete — removed {entity} disappears from second session
    Given I have two browser sessions open as "Session A" and "Session B"
    And both sessions are on the "{pageRoute}" page
    And at least one {entity} exists named "To Delete RT"
    When in "Session A", I delete "{entity}" named "To Delete RT"
    Then in "Session B", "To Delete RT" should disappear from the data table within 3 seconds
```

---

## 2. Step Definitions

Save to: `tests/steps/{entity-kebab}-management.steps.ts`

```typescript
/**
 * Step Definitions for {Entity} Management
 *
 * Covers scenarios in tests/features/ui/{entity-kebab}-management.feature
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { expect, type Page } from '@playwright/test';

// ── Helpers ─────────────────────────────────────────

const PAGE_ROUTE = '/admin/{pageRoute}';
const PAGE_TESTID = '{entity-kebab}-management-page';
const SEARCH_TESTID = '{entity-kebab}-search-input';
const CREATE_BTN_TESTID = 'create-{entity-kebab}-button';
const TABLE_ROW_SELECTOR = '[data-testid^="table-row-"]';

function getSessionPage(world: CustomWorld, sessionName: string): Page {
  if (sessionName === 'Session A' || sessionName === 'User 1') return world.page;
  if (sessionName === 'Session B' || sessionName === 'User 2') {
    const p = world.testData.secondPage;
    if (!p) throw new Error(`${sessionName} not initialised`);
    return p;
  }
  throw new Error(`Unknown session: ${sessionName}`);
}

// ── Given ───────────────────────────────────────────

Given(
  'the page should be fully loaded',
  async function (this: CustomWorld) {
    await this.page.waitForSelector(`[data-testid="${PAGE_TESTID}"]`, { timeout: 10_000 });
    await this.page.waitForLoadState('networkidle');
  }
);

Given(
  'at least one {entity} exists in the data table',
  async function (this: CustomWorld) {
    const rows = await this.page.locator(TABLE_ROW_SELECTOR).count();
    expect(rows).toBeGreaterThanOrEqual(1);
  }
);

Given(
  'at least one {entity} exists named {string}',
  async function (this: CustomWorld, name: string) {
    // Create via API if needed, then verify it's visible
    const row = this.page.locator(TABLE_ROW_SELECTOR, { hasText: name });
    const visible = await row.isVisible();
    if (!visible) {
      // Create via API — requires apiContext + authToken
      // Adapt POST to entity's controller pattern
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5054';
      const { request } = await import('playwright');
      const apiCtx = await request.newContext({
        baseURL: backendUrl,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        ignoreHTTPSErrors: true,
      });
      await apiCtx.post(`${backendUrl}/api/v1/{entitiesName}`, {
        data: { {entityNameField}: name },
      });
      await apiCtx.dispose();
      // Reload page to pick up new data
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
    }
  }
);

Given(
  'both sessions are on the "{pageRoute}" page',
  async function (this: CustomWorld) {
    await this.page.goto(`${this.baseUrl}${PAGE_ROUTE}`);
    await this.page.waitForLoadState('networkidle');

    const secondPage = this.testData.secondPage;
    if (!secondPage) throw new Error('Second session not initialised');
    await secondPage.goto(`${this.baseUrl}${PAGE_ROUTE}`);
    await secondPage.waitForLoadState('networkidle');
  }
);

// ── When ────────────────────────────────────────────

When(
  'I type {string} in the search box',
  async function (this: CustomWorld, text: string) {
    await this.page.fill(`[data-testid="${SEARCH_TESTID}"]`, text);
    await this.page.waitForTimeout(400); // debounce
  }
);

When(
  'I clear the search box',
  async function (this: CustomWorld) {
    await this.page.fill(`[data-testid="${SEARCH_TESTID}"]`, '');
    await this.page.waitForTimeout(400);
  }
);

When(
  'I click the "Add New" button',
  async function (this: CustomWorld) {
    await this.page.click(`[data-testid="${CREATE_BTN_TESTID}"]`);
  }
);

When(
  'I fill in the {entity} form with valid data',
  async function (this: CustomWorld) {
    // Fill the primary name field — adapt selector per entity
    const nameInput = this.page.locator('[data-testid="{entity-kebab}-name-input"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('BDD Test {Entity}');
    }
    // Add additional required fields here per entity
    this.testData.entityManagement = {
      ...this.testData.entityManagement,
      lastCreatedName: 'BDD Test {Entity}',
    };
  }
);

When(
  'I click the "Save" button in the dialog',
  async function (this: CustomWorld) {
    await this.page.click('[data-testid="dialog-save-button"]');
    await this.page.waitForTimeout(500);
  }
);

When(
  'I click the "Save" button in the dialog without filling required fields',
  async function (this: CustomWorld) {
    // Clear any pre-filled fields first
    const nameInput = this.page.locator('[data-testid="{entity-kebab}-name-input"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('');
    }
    await this.page.click('[data-testid="dialog-save-button"]');
  }
);

When(
  'I click the edit action on the first {entity}',
  async function (this: CustomWorld) {
    const firstRow = this.page.locator(TABLE_ROW_SELECTOR).first();
    // Store the text content for later verification
    this.testData.entityManagement = {
      ...this.testData.entityManagement,
      editingRowText: await firstRow.textContent() ?? '',
    };
    // Click the edit button on the row
    const editBtn = firstRow.locator('[data-testid="edit-row-button"]');
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      // Double-click the row to open edit dialog
      await firstRow.dblclick();
    }
    await this.page.waitForTimeout(500);
  }
);

When(
  'I change the name field to {string}',
  async function (this: CustomWorld, newName: string) {
    const nameInput = this.page.locator('[data-testid="{entity-kebab}-name-input"]');
    await nameInput.clear();
    await nameInput.fill(newName);
  }
);

When(
  'I click the "Delete" button in the dialog',
  async function (this: CustomWorld) {
    await this.page.click('[data-testid="dialog-delete-button"]');
  }
);

When(
  'I confirm the deletion',
  async function (this: CustomWorld) {
    await this.page.click('[data-testid="confirm-delete-button"]');
    await this.page.waitForTimeout(500);
  }
);

// Real-time When steps

When(
  'in {string}, I create a new {entity} with name {string}',
  async function (this: CustomWorld, sessionName: string, name: string) {
    const page = getSessionPage(this, sessionName);
    await page.click(`[data-testid="${CREATE_BTN_TESTID}"]`);
    await page.waitForSelector('[data-testid="editor-dialog"]', { timeout: 5000 });
    const nameInput = page.locator('[data-testid="{entity-kebab}-name-input"]');
    await nameInput.fill(name);
    await page.click('[data-testid="dialog-save-button"]');
    await page.waitForTimeout(500);
  }
);

When(
  'in {string}, I edit the first {entity} and change name to {string}',
  async function (this: CustomWorld, sessionName: string, newName: string) {
    const page = getSessionPage(this, sessionName);
    const firstRow = page.locator(TABLE_ROW_SELECTOR).first();
    const editBtn = firstRow.locator('[data-testid="edit-row-button"]');
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      await firstRow.dblclick();
    }
    await page.waitForSelector('[data-testid="editor-dialog"]', { timeout: 5000 });
    const nameInput = page.locator('[data-testid="{entity-kebab}-name-input"]');
    await nameInput.clear();
    await nameInput.fill(newName);
    await page.click('[data-testid="dialog-save-button"]');
    await page.waitForTimeout(500);
  }
);

When(
  'in {string}, I delete "{entity}" named {string}',
  async function (this: CustomWorld, sessionName: string, name: string) {
    const page = getSessionPage(this, sessionName);
    const row = page.locator(TABLE_ROW_SELECTOR, { hasText: name });
    const editBtn = row.locator('[data-testid="edit-row-button"]');
    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else {
      await row.dblclick();
    }
    await page.waitForSelector('[data-testid="editor-dialog"]', { timeout: 5000 });
    await page.click('[data-testid="dialog-delete-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    await page.waitForTimeout(500);
  }
);

// ── Then ────────────────────────────────────────────

Then(
  'I should see the {string} element',
  async function (this: CustomWorld, testId: string) {
    await expect(this.page.locator(`[data-testid="${testId}"]`)).toBeVisible();
  }
);

Then(
  'the data table should be visible',
  async function (this: CustomWorld) {
    await expect(this.page.locator('[data-testid="data-table"]')).toBeVisible();
  }
);

Then(
  'the data table should contain at least {int} row(s)',
  async function (this: CustomWorld, minRows: number) {
    const count = await this.page.locator(TABLE_ROW_SELECTOR).count();
    expect(count).toBeGreaterThanOrEqual(minRows);
  }
);

Then(
  'the data table should only show rows containing {string}',
  async function (this: CustomWorld, text: string) {
    const rows = this.page.locator(TABLE_ROW_SELECTOR);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const content = await rows.nth(i).textContent();
      expect(content?.toLowerCase()).toContain(text.toLowerCase());
    }
  }
);

Then(
  'the data table should show all {entitiesName}',
  async function (this: CustomWorld) {
    const count = await this.page.locator(TABLE_ROW_SELECTOR).count();
    expect(count).toBeGreaterThanOrEqual(1);
  }
);

Then(
  'the editor dialog should be visible',
  async function (this: CustomWorld) {
    await expect(this.page.locator('[data-testid="editor-dialog"]')).toBeVisible();
  }
);

Then(
  'the editor dialog should close',
  async function (this: CustomWorld) {
    await expect(this.page.locator('[data-testid="editor-dialog"]')).not.toBeVisible({ timeout: 5000 });
  }
);

Then(
  'the dialog title should contain {string}',
  async function (this: CustomWorld, text: string) {
    const title = this.page.locator('[data-testid="editor-dialog"] [data-testid="dialog-title"]');
    await expect(title).toContainText(text);
  }
);

Then(
  'the form should be pre-populated with the {entity} data',
  async function (this: CustomWorld) {
    const nameInput = this.page.locator('[data-testid="{entity-kebab}-name-input"]');
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  }
);

Then(
  'I should see a success toast',
  async function (this: CustomWorld) {
    const toast = this.page.locator('[data-sonner-toast][data-type="success"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
  }
);

Then(
  'I should see validation errors in the dialog',
  async function (this: CustomWorld) {
    // Look for error text or aria-invalid fields
    const invalid = this.page.locator('[data-testid="editor-dialog"] [aria-invalid="true"]');
    const errorText = this.page.locator('[data-testid="editor-dialog"] [data-testid*="error"]');
    const hasInvalid = (await invalid.count()) > 0;
    const hasError = (await errorText.count()) > 0;
    expect(hasInvalid || hasError).toBeTruthy();
  }
);

Then(
  'the new {entity} should appear in the data table',
  async function (this: CustomWorld) {
    const name = this.testData.entityManagement?.lastCreatedName ?? 'BDD Test {Entity}';
    const row = this.page.locator(TABLE_ROW_SELECTOR, { hasText: name });
    await expect(row).toBeVisible({ timeout: 5000 });
  }
);

Then(
  'the data table should show {string}',
  async function (this: CustomWorld, text: string) {
    const row = this.page.locator(TABLE_ROW_SELECTOR, { hasText: text });
    await expect(row).toBeVisible({ timeout: 5000 });
  }
);

Then(
  'I should see a delete confirmation prompt',
  async function (this: CustomWorld) {
    const confirm = this.page.locator('[data-testid="confirm-delete-button"]');
    await expect(confirm).toBeVisible();
  }
);

Then(
  'the deleted {entity} should no longer appear in the data table',
  async function (this: CustomWorld) {
    const text = this.testData.entityManagement?.editingRowText ?? '';
    if (text) {
      const row = this.page.locator(TABLE_ROW_SELECTOR, { hasText: text });
      await expect(row).not.toBeVisible({ timeout: 5000 });
    }
  }
);

// Real-time Then steps

Then(
  'in {string}, {string} should appear in the data table within {int} second(s)',
  async function (this: CustomWorld, sessionName: string, text: string, seconds: number) {
    const page = getSessionPage(this, sessionName);
    const row = page.locator(TABLE_ROW_SELECTOR, { hasText: text });
    await expect(row).toBeVisible({ timeout: seconds * 1000 });
  }
);

Then(
  'in {string}, {string} should disappear from the data table within {int} second(s)',
  async function (this: CustomWorld, sessionName: string, text: string, seconds: number) {
    const page = getSessionPage(this, sessionName);
    const row = page.locator(TABLE_ROW_SELECTOR, { hasText: text });
    await expect(row).not.toBeVisible({ timeout: seconds * 1000 });
  }
);
```

---

## 3. World Extensions

These fields must be added to `testData` in `tests/support/world.ts`:

```typescript
// Entity management testing
entityManagement?: {
  lastCreatedName?: string;
  lastEditedEntityId?: string | number;
  editingRowText?: string;
  dialogMode?: 'create' | 'edit';
};
```

---

## 4. `data-testid` Requirements

The page template and generated components **MUST** include these `data-testid`
attributes for BDD tests to locate elements:

| Element | `data-testid` |
| --- | --- |
| Page wrapper | `{entity-kebab}-management-page` |
| Search input | `{entity-kebab}-search-input` |
| Create button | `create-{entity-kebab}-button` |
| Data table | `data-table` |
| Table rows | `table-row-{id}` (prefix `table-row-`) |
| Row edit button | `edit-row-button` |
| Editor dialog | `editor-dialog` |
| Dialog title | `dialog-title` |
| Dialog save button | `dialog-save-button` |
| Dialog delete button | `dialog-delete-button` |
| Delete confirm button | `confirm-delete-button` |
| Name input | `{entity-kebab}-name-input` |

> [!IMPORTANT]
> If any of these `data-testid` attributes are missing from generated components,
> the BDD tests will fail. Always verify they are present during Step 5–7.

---

## 5. Running Tests

```bash
# All entity management tests with video
VIDEO=true pnpm test:bdd:tag "@entity-management"

# Single entity
VIDEO=true pnpm test:bdd:tag "@{entity-kebab}"

# Dry-run to verify step wiring
pnpm exec cucumber-js --dry-run --tags "@entity-management"

# Real-time tests only
VIDEO=true pnpm test:bdd:tag "@entity-management and @realtime"
```

Videos are saved to `tests/reports/videos/` as `.webm` files.
