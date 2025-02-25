using Newtonsoft.Json;

namespace StorageAPI.DTOs;

public class UpsertShipDto
{ 
        public string? Name { get; set; } 
        public string? Type { get; set; }
        public string? Flag { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime LastSeen { get; set; }
}