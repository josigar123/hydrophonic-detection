using Newtonsoft.Json;

namespace StorageAPI.Models;

public class AisData
{
    [JsonProperty(PropertyName = "id")] // CosmosDB requires this field
    public string Id => LogId;
    [JsonProperty(PropertyName = "logid")]
    public string LogId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "mmsi")]
    public string Mmsi { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonProperty(PropertyName = "latitude")]
    public double Latitude { get; set; } 
    
    [JsonProperty(PropertyName = "longitude")]
    public double Longitude { get; set; } 
    
    [JsonProperty(PropertyName = "speed")]
    public double Speed { get; set; }
    
    [JsonProperty(PropertyName = "heading")]
    public int Heading { get; set; }

    [JsonProperty(PropertyName = "rawMessage")]
    public string? RawMessage { get; set; } = string.Empty;

}