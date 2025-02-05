using Newtonsoft.Json;
namespace StorageAPI.Models;

public class Recordings
{
    [JsonProperty(PropertyName = "id")] // CosmosDB requires this field
    public string Id => RecordingId;
    [JsonProperty(PropertyName = "recordingid")]
    public string RecordingId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "hydrophoneId")]
    public string HydrophoneId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "startTime")]
    public DateTime StartTime { get; set; } = DateTime.Now; 
    
    [JsonProperty(PropertyName = "endTime")]
    public DateTime EndTime { get; set; } = DateTime.Now;

    [JsonProperty(PropertyName = "audioURI")]
    public string AudioUri { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "spectrogramURI")]
    public string SpectrogramUri { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "referencedAISLog")]
    public string ReferencedAisLog { get; set; } = string.Empty;

}