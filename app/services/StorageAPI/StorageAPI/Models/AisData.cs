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
    public DateTime Timestamp { get; set; } = DateTime.Now;

    [JsonProperty(PropertyName = "latitude")]
    public string Latitude { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "longitude")]
    public string Longitude { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "speed")]
    public string Speed { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "heading")]
    public string Heading { get; set; } = string.Empty;

    [JsonProperty(PropertyName = "rawMessage")]
    public string RawMessage { get; set; } = string.Empty;

}