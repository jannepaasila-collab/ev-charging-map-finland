namespace WebApplication1.Models
{
    public class Location
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string City { get; set; } = "";
        public double Lat { get; set; }
        public double Lon { get; set; }
        public int? PowerKw { get; set; }
        public string Operator { get; set; } = "";
    }
}
