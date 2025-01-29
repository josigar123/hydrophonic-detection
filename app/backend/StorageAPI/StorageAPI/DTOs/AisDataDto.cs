using Newtonsoft.Json;

namespace StorageAPI.DTOs;

public class AisDataDto
{
    [JsonProperty(PropertyName = "logid")]
    public string LogId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "mmsi")]
    public string Mmsi { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.Now;

    [JsonProperty(PropertyName = "latitude")]
    public string Latitude { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "longitude")]
    public string Longitude { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "speed")]
    public DateTime Speed { get; set; } = DateTime.Now;
    
    [JsonProperty(PropertyName = "heading")]
    public string Heading { get; set; } = string.Empty;

    [JsonProperty(PropertyName = "rawMessage")]
    public string RawMessage { get; set; } = string.Empty;
}