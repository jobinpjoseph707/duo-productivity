# Backend Plan: .NET Core 8 Web API

## Technology
- **Framework**: ASP.NET Core 8 Minimal/Controller API
- **Language**: C#
- **Auth**: JWT Bearer (Supabase tokens)
- **Database Client**: supabase-csharp or Npgsql + Dapper
- **Real-time**: SignalR (optional, for live dashboard updates)

---

## Folder Structure

```
DuoProductivity/
├── DuoProductivity.sln
│
├── src/
│   ├── DuoProductivity.API/              # Web API entry point
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs         # Login/register proxy (optional)
│   │   │   ├── ProjectsController.cs     # GET /api/projects, tasks
│   │   │   ├── ProductivityController.cs # Dashboard, log work, allocations
│   │   │   └── CategoriesController.cs   # Category CRUD
│   │   ├── Middleware/
│   │   │   └── SupabaseAuthMiddleware.cs # Validate Supabase JWT
│   │   ├── Program.cs                    # DI, middleware pipeline
│   │   ├── appsettings.json              # Config (Supabase URL, keys)
│   │   └── DuoProductivity.API.csproj
│   │
│   ├── DuoProductivity.Core/             # Business logic & interfaces
│   │   ├── Entities/
│   │   │   ├── Project.cs
│   │   │   ├── Task.cs
│   │   │   ├── Category.cs
│   │   │   ├── WorkLog.cs
│   │   │   ├── TimeAllocation.cs
│   │   │   └── UserCategoryAccess.cs
│   │   ├── Interfaces/
│   │   │   ├── IProjectRepository.cs
│   │   │   ├── IProductivityRepository.cs
│   │   │   └── ICategoryRepository.cs
│   │   ├── Services/
│   │   │   ├── ProjectService.cs
│   │   │   ├── ProductivityService.cs    # XP, streaks, time tracking
│   │   │   └── GamificationEngine.cs     # XP calculation, level-ups
│   │   ├── DTOs/
│   │   │   ├── DashboardDto.cs
│   │   │   ├── LogWorkRequest.cs
│   │   │   ├── TimeAllocationRequest.cs
│   │   │   └── ProjectDto.cs
│   │   └── DuoProductivity.Core.csproj
│   │
│   └── DuoProductivity.Infrastructure/   # Data access & external services
│       ├── Repositories/
│       │   ├── SupabaseProjectRepository.cs
│       │   ├── SupabaseProductivityRepository.cs
│       │   └── SupabaseCategoryRepository.cs
│       ├── SupabaseClient.cs             # Singleton Supabase connection
│       ├── Extensions/
│       │   └── ServiceCollectionExtensions.cs
│       └── DuoProductivity.Infrastructure.csproj
│
├── tests/
│   ├── DuoProductivity.UnitTests/
│   │   ├── GamificationEngineTests.cs
│   │   └── ProductivityServiceTests.cs
│   └── DuoProductivity.IntegrationTests/
│       └── ProjectsControllerTests.cs
│
└── .github/
    └── workflows/
        └── ci.yml                        # Build + test pipeline
```

---

## Setup Steps

### 1. Create the Solution
```bash
dotnet new sln -n DuoProductivity
mkdir -p src/DuoProductivity.API src/DuoProductivity.Core src/DuoProductivity.Infrastructure tests/DuoProductivity.UnitTests

# Create projects
dotnet new webapi -n DuoProductivity.API -o src/DuoProductivity.API
dotnet new classlib -n DuoProductivity.Core -o src/DuoProductivity.Core
dotnet new classlib -n DuoProductivity.Infrastructure -o src/DuoProductivity.Infrastructure
dotnet new xunit -n DuoProductivity.UnitTests -o tests/DuoProductivity.UnitTests

# Add to solution
dotnet sln add src/DuoProductivity.API
dotnet sln add src/DuoProductivity.Core
dotnet sln add src/DuoProductivity.Infrastructure
dotnet sln add tests/DuoProductivity.UnitTests

# Set up references
dotnet add src/DuoProductivity.API reference src/DuoProductivity.Core
dotnet add src/DuoProductivity.API reference src/DuoProductivity.Infrastructure
dotnet add src/DuoProductivity.Infrastructure reference src/DuoProductivity.Core
dotnet add tests/DuoProductivity.UnitTests reference src/DuoProductivity.Core
```

### 2. Install NuGet Packages
```bash
# API project
cd src/DuoProductivity.API
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Swashbuckle.AspNetCore

# Infrastructure project
cd ../DuoProductivity.Infrastructure
dotnet add package supabase-csharp
# OR for raw SQL:
dotnet add package Npgsql
dotnet add package Dapper
```

### 3. Configure JWT Auth (Program.cs)
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Supabase:Url"] + "/auth/v1";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Supabase:Url"] + "/auth/v1"
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Supabase + repositories
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### 4. Key Controller: ProductivityController
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductivityController : ControllerBase
{
    private readonly IProductivityRepository _repo;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = User.FindFirst("sub")?.Value;
        var dashboard = await _repo.GetDashboardAsync(Guid.Parse(userId!));
        return Ok(dashboard);
    }

    [HttpPost("log")]
    public async Task<IActionResult> LogWork([FromBody] LogWorkRequest request)
    {
        var userId = User.FindFirst("sub")?.Value;
        var result = await _repo.LogWorkAsync(Guid.Parse(userId!), request);
        return Ok(result);
    }

    [HttpPost("allocate")]
    public async Task<IActionResult> AllocateTime([FromBody] TimeAllocationRequest req)
    {
        var userId = User.FindFirst("sub")?.Value;
        await _repo.AllocateTimeAsync(Guid.Parse(userId!), req);
        return Ok();
    }
}
```

### 5. Key Controller: ProjectsController
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectRepository _repo;

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        // RLS in Supabase handles category filtering
        // Pass the user's JWT to Supabase client
        var userId = User.FindFirst("sub")?.Value;
        var projects = await _repo.GetProjectsForUserAsync(Guid.Parse(userId!));
        return Ok(projects);
    }

    [HttpGet("{projectId}/tasks")]
    public async Task<IActionResult> GetTasks(Guid projectId)
    {
        var tasks = await _repo.GetTasksAsync(projectId);
        return Ok(tasks);
    }
}
```

### 6. appsettings.json
```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "AnonKey": "eyJ...",
    "ServiceRoleKey": "eyJ..."
  },
  "AllowedHosts": "*"
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List user's authorized projects | ✅ |
| GET | `/api/projects/{id}/tasks` | List tasks for a project | ✅ |
| GET | `/api/categories` | List all categories | ✅ |
| GET | `/api/productivity/dashboard` | Get XP, streak, today's logs | ✅ |
| POST | `/api/productivity/log` | Log completed work | ✅ |
| POST | `/api/productivity/allocate` | Set time partitions for today | ✅ |
