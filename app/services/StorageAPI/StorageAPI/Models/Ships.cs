using Newtonsoft.Json;

namespace StorageAPI.Models;

public class Ships
{
    [JsonProperty(PropertyName = "id")] // CosmosDB requires this field
    public string Id => Mmsi; // Map 'id' to 'MMSI'
    [JsonProperty(PropertyName = "mmsi")]
    public string Mmsi { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "type")]
    public string Type { get; set; } = string.Empty;

    [JsonProperty(PropertyName = "flag")]
    public string Flag { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "latitude")]
    public double Latitude { get; set; }
    
    [JsonProperty(PropertyName = "longitude")]
    public double Longitude { get; set; }
    
    [JsonProperty(PropertyName = "lastSeen")]
    public DateTime LastSeen { get; set; }
    
}
