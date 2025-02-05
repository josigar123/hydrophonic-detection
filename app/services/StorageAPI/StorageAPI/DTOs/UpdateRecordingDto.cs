using Newtonsoft.Json;

namespace StorageAPI.DTOs;

public class UpdateRecordingDto
{
    [JsonProperty(PropertyName = "hydrophoneId")]
    public string HydrophoneId { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "referencedAISLog")]
    public string ReferencedAisLog { get; set; } = string.Empty;
}