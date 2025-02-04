using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace StorageAPI.DTOs;

public class CreateRecordingDto
{
    [JsonProperty(PropertyName = "recordingid")]
    public string RecordingId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "hydrophoneId")]
    public string HydrophoneId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "startTime")]
    public DateTime StartTime { get; set; } 
    
    [JsonProperty(PropertyName = "endTime")]
    public DateTime EndTime { get; set; } 
    
    [JsonProperty(PropertyName = "referencedAISLog")]
    public string ReferencedAisLog { get; set; } = string.Empty;
}