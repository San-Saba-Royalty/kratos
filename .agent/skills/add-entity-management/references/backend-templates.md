# Backend Controller & Entity Templates

Reference templates for the .NET 10 backend scaffolding steps. The backend project
is located at the path determined by:

1. Environment variable `SSR_BACKEND_PATH` (if set)
2. Default: `/Users/gqadonis/Projects/sansaba/ssr-backend`

## Project Structure

```
{BACKEND_ROOT}/
├── src/
│   ├── SSRBlazor.Api/
│   │   ├── Controllers/v1/{EntitiesName}Controller.cs   ← CRUD API
│   │   ├── Hubs/{EntityName}Hub.cs                      ← SignalR hub
│   │   ├── Services/EntityChangeNotifier.cs             ← Notifier additions
│   │   └── Program.cs                                   ← Hub mapping
│   └── SSRBusiness.NET10/
│       ├── Entities/{EntityName}.cs                     ← Entity model
│       └── Data/SsrDbContext.cs                         ← DbSet registration
```

## Two Controller Patterns

The backend uses two patterns depending on entity complexity:

### Pattern A: Dedicated Controller

Used by: **Buyer, County, Operator, Referrer, AppraisalGroup, User**

These entities have their own controller file because they have:
- Custom query logic (`.Include()`, `.OrderBy()`, projection)
- Sub-entity routes (contacts, appraisal groups)
- Entity-specific validation

### Pattern B: Generic Lookups Controller

Used by: **DealStatus, LienType, CurativeType, LetterAgreementDealStatus**

These entities are served through `LookupsController.cs` at:
- `GET    api/v1/lookups/{type-slug}`
- `POST   api/v1/lookups/{type-slug}`
- `PUT    api/v1/lookups/{type-slug}/{id}`
- `DELETE api/v1/lookups/{type-slug}/{id}`

Where `{type-slug}` is: `deal-statuses`, `lien-types`, `curative-types`, `letter-agreement-deal-statuses`

---

## Template: Dedicated Controller

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SSRBlazor.Api.Extensions;
using SSRBlazor.Api.Services;
using SSRBusiness.Data;
using SSRBusiness.Entities;

namespace SSRBlazor.Api.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class {EntitiesName}Controller : ControllerBase
{
    private readonly IDbContextFactory<SsrDbContext> _contextFactory;
    private readonly IEntityChangeNotifier _notifier;

    public {EntitiesName}Controller(
        IDbContextFactory<SsrDbContext> contextFactory,
        IEntityChangeNotifier notifier)
    {
        _contextFactory = contextFactory;
        _notifier = notifier;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var list = await context.{EntitiesName}
            .OrderBy(x => x.{EntityNameField})
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var entity = await context.{EntitiesName}.FindAsync(id);
        if (entity == null) return NotFound();
        return Ok(entity);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] {EntityName} entity)
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        context.{EntitiesName}.Add(entity);
        await context.SaveChangesAsync();
        await _notifier.NotifyAsync("{EntityName}", "Created", entity.{EntityIdField}, User.GetUserName());
        return CreatedAtAction(nameof(GetById), new { id = entity.{EntityIdField} }, entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] {EntityName} updated)
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var entity = await context.{EntitiesName}.FindAsync(id);
        if (entity == null) return NotFound();
        updated.{EntityIdField} = id;
        context.Entry(entity).CurrentValues.SetValues(updated);
        await context.SaveChangesAsync();
        await _notifier.NotifyAsync("{EntityName}", "Updated", id, User.GetUserName());
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var context = await _contextFactory.CreateDbContextAsync();
        var entity = await context.{EntitiesName}.FindAsync(id);
        if (entity == null) return NotFound();
        context.{EntitiesName}.Remove(entity);
        await context.SaveChangesAsync();
        await _notifier.NotifyAsync("{EntityName}", "Deleted", id, User.GetUserName());
        return NoContent();
    }
}
```

## Template: SignalR Hub

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SSRBusiness.Entities;

namespace SSRBlazor.Api.Hubs;

/// <summary>
/// Client interface for the {EntityName}Hub.
/// </summary>
public interface I{EntityName}Client
{
    Task {EntityName}Created({EntityName} entity);
    Task {EntityName}Updated({EntityName} entity);
    Task {EntityName}Deleted(int entityId);
}

/// <summary>
/// SignalR hub for broadcasting {entityName}-specific events.
/// </summary>
[Authorize]
public class {EntityName}Hub : Hub<I{EntityName}Client>
{
    // No specific methods needed; clients connect to receive events.
}
```

## Template: Entity Model

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SSRBusiness.Entities;

public class {EntityName}
{
    [Key]
    public int {EntityIdField} { get; set; }

    [Required, MaxLength(100)]
    public string {EntityNameField} { get; set; } = null!;

    // Add additional properties as needed...
}
```

## Template: Program.cs Hub Mapping

Add this line alongside the other `MapHub` calls in `Program.cs`:

```csharp
app.MapHub<{EntityName}Hub>("/hubs/{hubPathSlug}");
```

## Template: DbContext Registration

Add this line to `SsrDbContext.cs`:

```csharp
public DbSet<{EntityName}> {EntitiesName} { get; set; }
```

## Notifier Integration

The `EntityChangeNotifier` has a generic `NotifyAsync(entityType, operation, entityId, changedBy)`
method that works for all entity types. Most simple entities use this generic method
rather than adding typed notification methods. Only add typed methods if the entity
needs to push the full entity object (not just the ID) through a typed hub.

For entities that need typed hub notifications, follow the pattern in
`EntityChangeNotifier.cs`:

1. **Inject** `IHubContext<{EntityName}Hub, I{EntityName}Client>` in the constructor
2. **Add** typed methods like `Notify{EntityName}CreatedAsync({EntityName} entity, string? changedBy)`
3. **Add** the interface methods to `IEntityChangeNotifier`
4. **Call** from the controller instead of the generic `NotifyAsync`
