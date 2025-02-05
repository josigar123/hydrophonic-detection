using Newtonsoft.Json;

namespace StorageAPI.DTOs;

public class ShipsDto
{
    [JsonProperty(PropertyName = "mmsi")]
    public string Mmsi { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "type")]
    public string Type { get; set; } = string.Empty;

    [JsonProperty(PropertyName = "flag")]
    public string Flag { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "lastKnownPosition")]
    public string LastKnownPosition { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}