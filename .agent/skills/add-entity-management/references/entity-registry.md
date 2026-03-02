# Entity Registry

Pre-filled configuration for all supported entity types. When the agent is asked
to build management for one of these entities, use this registry to populate the
skill inputs rather than asking the user for every field.

Backend paths are relative to `{BACKEND_ROOT}` (see SKILL.md for path resolution).

---

## Buyer

| Key | Value |
|-----|-------|
| `EntityName` | `Buyer` |
| `entitiesName` | `buyers` |
| `EntitiesName` | `Buyers` |
| `entityKebab` | `buyer` |
| `entitiesKebab` | `buyers` |
| `EntityIdField` | `buyerID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `buyerName` |
| `entityTypePath` | `@/types/buyer` |
| `routePath` | `/admin/buyers` |
| `pageDir` | `src/app/(auth)/admin/buyers` |
| `pageTitle` | `Buyer Management` |
| `HubPath` | `/hubs/buyers` |
| `navSection` | `File > Display` |

**Existing Frontend Infrastructure:**

- Type: `src/types/buyer.ts` ✅
- Store: `src/stores/buyer-store/index.ts` ✅
- SignalR: `src/stores/buyer-store/signalr.ts` ✅
- Hook: `src/hooks/use-buyers.ts` ✅ (list), `src/hooks/use-buyer.ts` ✅ (single)
- API: `getBuyers`, `getBuyerById` in `api-client.ts` (create/update/delete may need adding)

**Backend Infrastructure:**

- Controller Pattern: **Dedicated** (`BuyersController`)
- Controller: `src/SSRBlazor.Api/Controllers/v1/BuyersController.cs` ✅
- Hub: `src/SSRBlazor.Api/Hubs/BuyerHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/Buyer.cs` ✅
- DbSet: `Buyers` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<BuyerHub>("/hubs/buyers")` ✅

**Columns:**

```typescript
const BUYER_COLUMNS: DataTableColumn<Buyer>[] = [
  { id: 'buyerName', accessorKey: 'buyerName', header: 'Name', type: 'text' },
  { id: 'contactName', accessorKey: 'contactName', header: 'Contact', type: 'text' },
  { id: 'contactEmail', accessorKey: 'contactEmail', header: 'Email', type: 'text' },
  { id: 'contactPhone', accessorKey: 'contactPhone', header: 'Phone', type: 'text' },
  { id: 'city', accessorKey: 'city', header: 'City', type: 'text' },
  { id: 'stateCode', accessorKey: 'stateCode', header: 'State', type: 'text' },
];
```

**Search Fields:** `['buyerName', 'contactName', 'contactEmail', 'city']`

**Dialog Fields:** `buyerName` (required), `contactName`, `contactEmail`, `contactPhone`, `contactFax`, `attention`, `addressLine1`, `addressLine2`, `addressLine3`, `city`, `stateCode`, `zipCode`, `defaultCommission`, `defaultBuyer` (boolean toggle)

---

## County

| Key | Value |
|-----|-------|
| `EntityName` | `County` |
| `entitiesName` | `counties` |
| `EntitiesName` | `Counties` |
| `entityKebab` | `county` |
| `entitiesKebab` | `counties` |
| `EntityIdField` | `countyID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `countyName` |
| `entityTypePath` | `@/types/county` |
| `routePath` | `/admin/counties` |
| `pageDir` | `src/app/(auth)/admin/counties` |
| `pageTitle` | `County Management` |
| `HubPath` | `/hubs/counties` |
| `navSection` | `File > Display` |

**Existing Frontend Infrastructure:**

- Type: `src/types/county.ts` ✅
- Store: `src/stores/county-store/index.ts` ✅
- SignalR: `src/stores/county-store/signalr.ts` ✅
- Hook: `src/hooks/use-counties.ts` ✅
- API: `getCounties` in `api-client.ts` (create/update/delete may need adding)

**Backend Infrastructure:**

- Controller Pattern: **Dedicated** (`CountiesController`)
- Controller: `src/SSRBlazor.Api/Controllers/v1/CountiesController.cs` ✅
- Hub: `src/SSRBlazor.Api/Hubs/CountyHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/County.cs` ✅
- DbSet: `Counties` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<CountyHub>("/hubs/counties")` ✅

**Columns:**

```typescript
const COUNTY_COLUMNS: DataTableColumn<County>[] = [
  { id: 'countyName', accessorKey: 'countyName', header: 'County', type: 'text' },
  { id: 'stateCode', accessorKey: 'stateCode', header: 'State', type: 'text' },
  { id: 'city', accessorKey: 'city', header: 'City', type: 'text' },
  { id: 'contactName', accessorKey: 'contactName', header: 'Contact', type: 'text' },
  { id: 'contactPhone', accessorKey: 'contactPhone', header: 'Phone', type: 'text' },
  { id: 'recordingFeeFirstPage', accessorKey: 'recordingFeeFirstPage', header: 'Recording Fee (1st)', type: 'money' },
  { id: 'recordingFeeAdditionalPage', accessorKey: 'recordingFeeAdditionalPage', header: 'Recording Fee (Addl)', type: 'money' },
  { id: 'courtFee', accessorKey: 'courtFee', header: 'Court Fee', type: 'money' },
];
```

**Search Fields:** `['countyName', 'stateCode', 'city', 'contactName']`

**Dialog Fields:** `countyName` (required), `stateCode`, `contactName`, `contactEmail`, `contactPhone`, `contactFax`, `attention`, `addressLine1`, `addressLine2`, `addressLine3`, `city`, `zipCode`, `recordingFeeFirstPage`, `recordingFeeAdditionalPage`, `courtFee`

---

## Operator

| Key | Value |
|-----|-------|
| `EntityName` | `Operator` |
| `entitiesName` | `operators` |
| `EntitiesName` | `Operators` |
| `entityKebab` | `operator` |
| `entitiesKebab` | `operators` |
| `EntityIdField` | `operatorID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `operatorName` |
| `entityTypePath` | `@/types/operator` |
| `routePath` | `/admin/operators` |
| `pageDir` | `src/app/(auth)/admin/operators` |
| `pageTitle` | `Operator Management` |
| `HubPath` | `/hubs/operators` |
| `navSection` | `File > Display` |

**Existing Frontend Infrastructure:**

- Type: `src/types/operator.ts` ✅
- Store: `src/stores/operator-store/index.ts` ✅
- SignalR: `src/stores/operator-store/signalr.ts` ✅
- Hook: `src/hooks/use-operators.ts` ✅
- API: `getOperators` in `api-client.ts` (create/update/delete may need adding)

**Backend Infrastructure:**

- Controller Pattern: **Dedicated** (`OperatorsController`)
- Controller: `src/SSRBlazor.Api/Controllers/v1/OperatorsController.cs` ✅
- Hub: `src/SSRBlazor.Api/Hubs/OperatorHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/Operator.cs` ✅
- DbSet: `Operators` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<OperatorHub>("/hubs/operators")` ✅

**Columns:**

```typescript
const OPERATOR_COLUMNS: DataTableColumn<Operator>[] = [
  { id: 'operatorName', accessorKey: 'operatorName', header: 'Operator', type: 'text' },
  { id: 'contactName', accessorKey: 'contactName', header: 'Contact', type: 'text' },
  { id: 'contactEmail', accessorKey: 'contactEmail', header: 'Email', type: 'text' },
  { id: 'contactPhone', accessorKey: 'contactPhone', header: 'Phone', type: 'text' },
  { id: 'city', accessorKey: 'city', header: 'City', type: 'text' },
  { id: 'stateCode', accessorKey: 'stateCode', header: 'State', type: 'text' },
];
```

**Search Fields:** `['operatorName', 'contactName', 'contactEmail', 'city']`

**Dialog Fields:** `operatorName` (required), `contactName`, `contactEmail`, `contactPhone`, `contactFax`, `attention`, `addressLine1`, `addressLine2`, `addressLine3`, `city`, `stateCode`, `zipCode`

---

## Referrer

| Key | Value |
|-----|-------|
| `EntityName` | `Referrer` |
| `entitiesName` | `referrers` |
| `EntitiesName` | `Referrers` |
| `entityKebab` | `referrer` |
| `entitiesKebab` | `referrers` |
| `EntityIdField` | `referrerID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `referrerName` |
| `entityTypePath` | `@/types/referrer` |
| `routePath` | `/admin/referrers` |
| `pageDir` | `src/app/(auth)/admin/referrers` |
| `pageTitle` | `Referrer Management` |
| `HubPath` | `/hubs/referrers` |
| `navSection` | `File > Display` |

**Existing Frontend Infrastructure:**

- Type: `src/types/referrer.ts` ✅
- Store: `src/stores/referrer-store/index.ts` ✅
- SignalR: `src/stores/referrer-store/signalr.ts` ✅
- Hook: `src/hooks/use-referrers.ts` ✅
- API: API functions may be inline in store (check and extract if needed)

**Backend Infrastructure:**

- Controller Pattern: **Dedicated** (`ReferrersController`)
- Controller: `src/SSRBlazor.Api/Controllers/v1/ReferrersController.cs` ✅
- Hub: `src/SSRBlazor.Api/Hubs/ReferrerHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/Referrer.cs` ✅
- DbSet: `Referrers` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<ReferrerHub>("/hubs/referrers")` ✅

**Columns:**

```typescript
const REFERRER_COLUMNS: DataTableColumn<Referrer>[] = [
  { id: 'referrerName', accessorKey: 'referrerName', header: 'Name', type: 'text' },
  { id: 'referrerTypeCode', accessorKey: 'referrerTypeCode', header: 'Type', type: 'text' },
  { id: 'contactName', accessorKey: 'contactName', header: 'Contact', type: 'text' },
  { id: 'contactEmail', accessorKey: 'contactEmail', header: 'Email', type: 'text' },
  { id: 'contactPhone', accessorKey: 'contactPhone', header: 'Phone', type: 'text' },
  { id: 'city', accessorKey: 'city', header: 'City', type: 'text' },
  { id: 'stateCode', accessorKey: 'stateCode', header: 'State', type: 'text' },
];
```

**Search Fields:** `['referrerName', 'referrerTypeCode', 'contactName', 'contactEmail']`

**Dialog Fields:** `referrerName` (required), `referrerTypeCode`, `referrerTaxID`, `contactName`, `contactEmail`, `contactPhone`, `addressLine1`, `city`, `stateCode`, `zipCode`

---

## Appraisal Group

| Key | Value |
|-----|-------|
| `EntityName` | `AppraisalGroup` |
| `entitiesName` | `appraisalGroups` |
| `EntitiesName` | `AppraisalGroups` |
| `entityKebab` | `appraisal-group` |
| `entitiesKebab` | `appraisal-groups` |
| `EntityIdField` | `appraisalGroupID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `appraisalGroupName` |
| `entityTypePath` | `@/types/appraisal-group` |
| `routePath` | `/admin/appraisal-groups` |
| `pageDir` | `src/app/(auth)/admin/appraisal-groups` |
| `pageTitle` | `Appraisal Group Management` |
| `HubPath` | `/hubs/appraisalgroups` |
| `navSection` | `File > Display` |

**Existing Frontend Infrastructure:**

- Type: `src/types/appraisal-group.ts` ✅
- Store: `src/stores/appraisal-group-store/index.ts` ✅
- SignalR: `src/stores/appraisal-group-store/signalr.ts` ✅
- Hook: `src/hooks/use-appraisal-groups.ts` ✅
- API: API functions may be inline in store (check and extract if needed)

**Backend Infrastructure:**

- Controller Pattern: **Dedicated** (`AppraisalGroupsController`)
- Controller: `src/SSRBlazor.Api/Controllers/v1/AppraisalGroupsController.cs` ✅
- Hub: `src/SSRBlazor.Api/Hubs/AppraisalGroupHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/AppraisalGroup.cs` ✅
- DbSet: `AppraisalGroups` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<AppraisalGroupHub>("/hubs/appraisalgroups")` ✅

**Columns:**

```typescript
const APPRAISAL_GROUP_COLUMNS: DataTableColumn<AppraisalGroup>[] = [
  { id: 'appraisalGroupName', accessorKey: 'appraisalGroupName', header: 'Group Name', type: 'text' },
  { id: 'contactName', accessorKey: 'contactName', header: 'Contact', type: 'text' },
  { id: 'contactEmail', accessorKey: 'contactEmail', header: 'Email', type: 'text' },
  { id: 'contactPhone', accessorKey: 'contactPhone', header: 'Phone', type: 'text' },
  { id: 'city', accessorKey: 'city', header: 'City', type: 'text' },
  { id: 'stateCode', accessorKey: 'stateCode', header: 'State', type: 'text' },
];
```

**Search Fields:** `['appraisalGroupName', 'contactName', 'contactEmail', 'city']`

**Dialog Fields:** `appraisalGroupName` (required), `contactName`, `contactEmail`, `contactPhone`, `contactFax`, `attention`, `addressLine1`, `addressLine2`, `addressLine3`, `city`, `stateCode`, `zipCode`

---

## Lien Type

| Key | Value |
|-----|-------|
| `EntityName` | `LienType` |
| `entitiesName` | `lienTypes` |
| `EntitiesName` | `LienTypes` |
| `entityKebab` | `lien-type` |
| `entitiesKebab` | `lien-types` |
| `EntityIdField` | `lienTypeID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `lienTypeName` |
| `entityTypePath` | `@/types/lien-type` |
| `routePath` | `/admin/tools/lien-types` |
| `pageDir` | `src/app/(auth)/admin/tools/lien-types` |
| `pageTitle` | `Lien Type Management` |
| `HubPath` | `/hubs/lientypes` |
| `navSection` | `Tools` |

**Existing Frontend Infrastructure:**

- Type: `src/types/lien-type.ts` ✅
- Store: `src/stores/lien-type-store/index.ts` ✅
- SignalR: `src/stores/lien-type-store/signalr.ts` ✅
- Hook: `src/hooks/use-lien-types.ts` ✅
- API: via `api/v1/lookups/lien-types` (check `api-client.ts`)

**Backend Infrastructure:**

- Controller Pattern: **Generic Lookup** (via `LookupsController`)
- Lookup Type Slug: `lien-types`
- Controller: `src/SSRBlazor.Api/Controllers/v1/LookupsController.cs` ✅ (has CRUD entries)
- Hub: `src/SSRBlazor.Api/Hubs/LienTypeHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/` (check `AcquisitionLienEntities.cs`)
- DbSet: `LienTypes` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<LienTypeHub>("/hubs/lientypes")` ✅

**Columns:**

```typescript
const LIEN_TYPE_COLUMNS: DataTableColumn<LienType>[] = [
  { id: 'lienTypeName', accessorKey: 'lienTypeName', header: 'Name', type: 'text' },
  { id: 'description', accessorKey: 'description', header: 'Description', type: 'text' },
  { id: 'isActive', accessorKey: 'isActive', header: 'Active', type: 'boolean' },
];
```

**Search Fields:** `['lienTypeName', 'description']`

**Dialog Fields:** `lienTypeName` (required), `description`, `isActive` (boolean toggle)

---

## Curative Type

| Key | Value |
|-----|-------|
| `EntityName` | `CurativeType` |
| `entitiesName` | `curativeTypes` |
| `EntitiesName` | `CurativeTypes` |
| `entityKebab` | `curative-type` |
| `entitiesKebab` | `curative-types` |
| `EntityIdField` | `curativeTypeID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `curativeTypeName` |
| `entityTypePath` | `@/types/curative-type` |
| `routePath` | `/admin/tools/curative-types` |
| `pageDir` | `src/app/(auth)/admin/tools/curative-types` |
| `pageTitle` | `Curative Type Management` |
| `HubPath` | `/hubs/curativetypes` |
| `navSection` | `Tools` |

**Existing Frontend Infrastructure:**

- Type: `src/types/curative-type.ts` ✅
- Store: `src/stores/curative-type-store/index.ts` ✅
- SignalR: `src/stores/curative-type-store/signalr.ts` ✅
- Hook: `src/hooks/use-curative-types.ts` ✅
- API: via `api/v1/lookups/curative-types` (check `api-client.ts`)

**Backend Infrastructure:**

- Controller Pattern: **Generic Lookup** (via `LookupsController`)
- Lookup Type Slug: `curative-types`
- Controller: `src/SSRBlazor.Api/Controllers/v1/LookupsController.cs` ✅ (has CRUD entries)
- Hub: `src/SSRBlazor.Api/Hubs/CurativeTypeHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/CurativeType.cs` ✅
- DbSet: `CurativeTypes` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<CurativeTypeHub>("/hubs/curativetypes")` ✅

**Columns:**

```typescript
const CURATIVE_TYPE_COLUMNS: DataTableColumn<CurativeType>[] = [
  { id: 'curativeTypeName', accessorKey: 'curativeTypeName', header: 'Name', type: 'text' },
  { id: 'description', accessorKey: 'description', header: 'Description', type: 'text' },
  { id: 'isActive', accessorKey: 'isActive', header: 'Active', type: 'boolean' },
];
```

**Search Fields:** `['curativeTypeName', 'description']`

**Dialog Fields:** `curativeTypeName` (required), `description`, `isActive` (boolean toggle)

---

## Deal Status

| Key | Value |
|-----|-------|
| `EntityName` | `DealStatus` |
| `entitiesName` | `dealStatuses` |
| `EntitiesName` | `DealStatuses` |
| `entityKebab` | `deal-status` |
| `entitiesKebab` | `deal-statuses` |
| `EntityIdField` | `dealStatusID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `statusName` |
| `entityTypePath` | `@/types/deal-status` |
| `routePath` | `/admin/tools/deal-statuses` |
| `pageDir` | `src/app/(auth)/admin/tools/deal-statuses` |
| `pageTitle` | `Deal Status Management` |
| `HubPath` | `/hubs/dealstatuses` |
| `navSection` | `Tools` |

**Existing Frontend Infrastructure:**

- Type: `src/types/deal-status.ts` ✅
- Store: `src/stores/deal-status-store/index.ts` ✅
- SignalR: `src/stores/deal-status-store/signalr.ts` ✅
- Hook: `src/hooks/use-deal-statuses.ts` ✅
- API: `getDealStatuses` in `api-client.ts` (create/update/delete may need adding)

**Backend Infrastructure:**

- Controller Pattern: **Generic Lookup** (via `LookupsController`)
- Lookup Type Slug: `deal-statuses`
- Controller: `src/SSRBlazor.Api/Controllers/v1/LookupsController.cs` ✅ (has CRUD entries)
- Hub: `src/SSRBlazor.Api/Hubs/DealStatusHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/DealStatus.cs` ✅
- DbSet: `DealStatuses` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<DealStatusHub>("/hubs/dealstatuses")` ✅

**Columns:**

```typescript
const DEAL_STATUS_COLUMNS: DataTableColumn<DealStatus>[] = [
  { id: 'statusName', accessorKey: 'statusName', header: 'Status', type: 'text' },
  { id: 'description', accessorKey: 'description', header: 'Description', type: 'text' },
  { id: 'displayOrder', accessorKey: 'displayOrder', header: 'Order', type: 'integer' },
  { id: 'excludeFromReports', accessorKey: 'excludeFromReports', header: 'Exclude from Reports', type: 'boolean' },
  { id: 'defaultStatus', accessorKey: 'defaultStatus', header: 'Default', type: 'boolean' },
];
```

**Search Fields:** `['statusName', 'description']`

**Dialog Fields:** `statusName` (required), `description`, `displayOrder`, `excludeFromReports` (boolean toggle), `defaultStatus` (boolean toggle)

---

## Letter Agreement Deal Status

| Key | Value |
|-----|-------|
| `EntityName` | `LetterAgreementDealStatus` |
| `entitiesName` | `letterAgreementDealStatuses` |
| `EntitiesName` | `LetterAgreementDealStatuses` |
| `entityKebab` | `letter-agreement-deal-status` |
| `entitiesKebab` | `letter-agreement-deal-statuses` |
| `EntityIdField` | `letterAgreementDealStatusID` |
| `EntityIdType` | `number` |
| `EntityNameField` | `letterAgreementDealStatusName` |
| `entityTypePath` | `@/types/letter-agreement-deal-status` |
| `routePath` | `/admin/tools/letter-agreement-deal-statuses` |
| `pageDir` | `src/app/(auth)/admin/tools/letter-agreement-deal-statuses` |
| `pageTitle` | `Letter Agreement Deal Status Management` |
| `HubPath` | `/hubs/letteragreementdealstatuses` |
| `navSection` | `Tools` |

**Existing Frontend Infrastructure:**

- Type: `src/types/letter-agreement-deal-status.ts` ✅
- Store: `src/stores/letter-agreement-deal-status-store/index.ts` ✅
- SignalR: `src/stores/letter-agreement-deal-status-store/signalr.ts` ✅
- Hook: `src/hooks/use-letter-agreement-deal-statuses.ts` ✅
- API: API functions may be inline in store (check and extract if needed)

**Backend Infrastructure:**

- Controller Pattern: **Generic Lookup** (via `LookupsController`)
- Lookup Type Slug: `letter-agreement-deal-statuses`
- Controller: `src/SSRBlazor.Api/Controllers/v1/LookupsController.cs` ✅ (GET only — Create/Update/Delete may need adding)
- Hub: `src/SSRBlazor.Api/Hubs/LetterAgreementDealStatusHub.cs` ✅
- Entity Model: `src/SSRBusiness.NET10/Entities/LetterAgreementDealStatus.cs` ✅
- DbSet: `LetterAgreementDealStatuses` in `SsrDbContext` ✅
- Hub Mapping: `app.MapHub<LetterAgreementDealStatusHub>("/hubs/letteragreementdealstatuses")` ✅

**Columns:**

```typescript
const LA_DEAL_STATUS_COLUMNS: DataTableColumn<LetterAgreementDealStatus>[] = [
  { id: 'letterAgreementDealStatusName', accessorKey: 'letterAgreementDealStatusName', header: 'Status', type: 'text' },
  { id: 'description', accessorKey: 'description', header: 'Description', type: 'text' },
  { id: 'displayOrder', accessorKey: 'displayOrder', header: 'Order', type: 'integer' },
  { id: 'isActive', accessorKey: 'isActive', header: 'Active', type: 'boolean' },
];
```

**Search Fields:** `['letterAgreementDealStatusName', 'description']`

**Dialog Fields:** `letterAgreementDealStatusName` (required), `description`, `displayOrder`, `isActive` (boolean toggle)

---

## User

| Key | Value |
|-----|-------|
| `EntityName` | `User` |
| `entitiesName` | `users` |
| `EntitiesName` | `Users` |
| `entityKebab` | `user` |
| `entitiesKebab` | `users` |
| `EntityIdField` | TBD — check `src/types/auth.ts` or backend model |
| `EntityIdType` | TBD |
| `EntityNameField` | TBD |
| `entityTypePath` | TBD — may need to create `@/types/user.ts` |
| `routePath` | `/admin/users` |
| `pageDir` | `src/app/(auth)/admin/users` |
| `pageTitle` | `User Management` |
| `HubPath` | `/hubs/users` |
| `navSection` | `Administration > Display` |

**Existing Frontend Infrastructure:**

- Type: Needs investigation — may be in `auth.ts` or need a new type file
- Store: Needs creation
- SignalR: Needs creation
- Hook: Needs creation
- API: Needs creation

**Backend Infrastructure:**

- Controller Pattern: **Dedicated** (`UsersController`)
- Controller: `src/SSRBlazor.Api/Controllers/v1/UsersController.cs` ✅
- Hub: Not yet created ⚠️
- Entity Model: Needs investigation (check Identity model)
- DbSet: Needs investigation (may use ASP.NET Identity tables)
- Hub Mapping: Not yet configured ⚠️

> [!IMPORTANT]
> User management requires additional investigation. The User entity type,
> ID field, and API endpoints are not yet confirmed. Check the backend
> `User` model and existing auth types before proceeding. User CRUD may
> have additional security requirements (role-based access, password management)
> that go beyond the standard entity management pattern.

**Columns:** TBD after type investigation

**Search Fields:** TBD after type investigation

**Dialog Fields:** TBD — likely includes username, email, role, active status
