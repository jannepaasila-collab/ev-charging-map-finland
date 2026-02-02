using WebApplication1.Models;

namespace WebApplication1.Data
{
    public class SeedLocations
    {
        public static readonly List<Location> All = new()
    {
        new Location { Id = 1, Name = "Kauppakeskus Trio (demo)", City = "Lahti", Lat = 60.9827, Lon = 25.6615, PowerKw = 50 },
        new Location { Id = 2, Name = "Matkakeskus (demo)", City = "Lahti", Lat = 60.9769, Lon = 25.6544, PowerKw = 22 },
        new Location { Id = 3, Name = "Kamppi (demo)", City = "Helsinki", Lat = 60.1686, Lon = 24.9322, PowerKw = 150 },
        new Location { Id = 4, Name = "Rautatieasema (demo)", City = "Tampere", Lat = 61.4978, Lon = 23.7730, PowerKw = 50 },
    };
    }
}
