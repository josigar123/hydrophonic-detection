using Newtonsoft.Json;

namespace StorageAPI.DTOs;

public class UpdateShipsDto
{
    [JsonProperty(PropertyName = "lastKnownPosition")]
    public string LastKnownPosition { get; set; } = string.Empty;
    
    [JsonProperty(PropertyName = "updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}