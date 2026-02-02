using Microsoft.AspNetCore.Mvc;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private static List<Location>? _cache;

    private static List<Location> GetData()
    {
        // Content root = projektin juurikansio ajossa
        var contentRoot = Directory.GetCurrentDirectory();
        var path = Path.Combine(contentRoot, "Data", "ocm_finland_raw.json");

        if (!System.IO.File.Exists(path))
            throw new FileNotFoundException($"OCM file not found: {path}");

        _cache ??= OcmImporter.Load(path);
        return _cache;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Location>> GetAll(
        [FromQuery] string? city = null,
        [FromQuery] int? minPowerKw = null,
        [FromQuery(Name = "operator")] string? operatorName = null,
        [FromQuery] bool includeUnknown = false,
        [FromQuery] int limit = 500)
    {
        try
        {
            IEnumerable<Location> q = GetData();

            if (minPowerKw is not null)
            {
                if (includeUnknown)
                    q = q.Where(l => !l.PowerKw.HasValue || l.PowerKw.Value >= minPowerKw);
                else
                    q = q.Where(l => l.PowerKw.HasValue && l.PowerKw.Value >= minPowerKw);
            }


            if (!string.IsNullOrWhiteSpace(operatorName))
                q = q.Where(l => l.Operator != null &&
                  l.Operator.Contains(operatorName, StringComparison.OrdinalIgnoreCase));


            return Ok(q.Take(limit));
        }
        catch (Exception ex)
        {
            return Problem("Locations failed: " + ex.Message);
        }
    }

    [HttpGet("operators")]
    public ActionResult<IEnumerable<string>> GetOperators()
    {
        try
        {
            var ops = GetData()
                .Select(l => l.Operator)
                .Where(o => !string.IsNullOrWhiteSpace(o) && o != "Unknown")
                .Distinct()
                .OrderBy(o => o)
                .ToList();

            return Ok(ops);
        }
        catch (Exception ex)
        {
            return Problem("Operators failed: " + ex.Message);
        }
    }

    [HttpGet("powers")]
    public ActionResult<IEnumerable<int>> GetAvailablePowers()
    {
        try
        {
            var powers = GetData()
                .Where(l => l.PowerKw.HasValue)
                .Select(l => l.PowerKw!.Value)
                .Distinct()
                .OrderBy(p => p)
                .ToList();

            return Ok(powers);
        }
        catch (Exception ex)
        {
            return Problem("Powers failed: " + ex.Message);
        }
    }

}
