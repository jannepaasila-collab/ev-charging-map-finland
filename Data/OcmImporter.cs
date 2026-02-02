using System.Text.Json;
using WebApplication1.Models;

namespace WebApplication1.Data;

public static class OcmImporter
{
    public static List<Location> Load(string path)
    {
        var json = File.ReadAllText(path);

        // Varmistus: pitää olla JSON array
        if (!json.TrimStart().StartsWith("["))
            throw new Exception("OCM JSON is not an array (file should start with '['). First line: " + json.Split('\n')[0]);

        using var doc = JsonDocument.Parse(json);

        var list = new List<Location>();
        int id = 1;

        foreach (var poi in doc.RootElement.EnumerateArray())
        {
            // AddressInfo must be an object
            if (!poi.TryGetProperty("AddressInfo", out var addr) || addr.ValueKind != JsonValueKind.Object)
                continue;

            // Lat/Lon required
            if (!addr.TryGetProperty("Latitude", out var latProp) || latProp.ValueKind != JsonValueKind.Number)
                continue;
            if (!addr.TryGetProperty("Longitude", out var lonProp) || lonProp.ValueKind != JsonValueKind.Number)
                continue;

            var lat = latProp.GetDouble();
            var lon = lonProp.GetDouble();

            // --- FIX: lat/lon swap (yleinen virhe OCM-datassa) ---
            if (lat >= 19 && lat <= 32.5 && lon >= 59 && lon <= 71.5)
            {
                (lat, lon) = (lon, lat);
            }

            // --- FILTER: poista selvästi virheelliset koordinaatit (Suomen rajaus) ---
            if (lat < 59 || lat > 71.5 || lon < 19 || lon > 32.5)
                continue;


            // Name
            var name = "Unknown";
            if (addr.TryGetProperty("Title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String)
                name = titleProp.GetString() ?? "Unknown";

            // City
            var city = "";
            if (addr.TryGetProperty("Town", out var townProp) && townProp.ValueKind == JsonValueKind.String)
                city = townProp.GetString() ?? "";

            // Operator (OperatorInfo can be null)
            var operatorName = "Unknown";
            if (poi.TryGetProperty("OperatorInfo", out var opInfo) && opInfo.ValueKind == JsonValueKind.Object)
            {
                if (opInfo.TryGetProperty("Title", out var opTitle) && opTitle.ValueKind == JsonValueKind.String)
                    operatorName = opTitle.GetString() ?? "Unknown";
            }

            // Power (Connections can be null)
            int? powerKw = null;
            if (poi.TryGetProperty("Connections", out var conns) && conns.ValueKind == JsonValueKind.Array)
            {
                foreach (var c in conns.EnumerateArray())
                {
                    if (c.ValueKind != JsonValueKind.Object) continue;

                    // PowerKW can be int/double
                    if (c.TryGetProperty("PowerKW", out var kwProp) && kwProp.ValueKind == JsonValueKind.Number)
                    {
                        if (kwProp.TryGetDouble(out var kwDouble))
                        {
                            var kw = (int)Math.Round(kwDouble);
                            powerKw = powerKw.HasValue ? Math.Max(powerKw.Value, kw) : kw;
                        }
                    }
                }
            }

            list.Add(new Location
            {
                Id = id++,
                Name = name,
                City = city,
                Operator = operatorName,
                Lat = lat,
                Lon = lon,
                PowerKw = powerKw

            });
        }

        return list;
    }
}
