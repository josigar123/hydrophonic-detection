using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace StorageAPI.Models;

public class SpectrogramRegenerator
{

    [JsonProperty(PropertyName = "window_type")]
    public string WindowType { get; set; } = string.Empty;

    [JsonProperty(PropertyName = "n_samples")]
    public int NSamples { get; set; } = 0;

    [JsonProperty(PropertyName = "frequency_cutoff")]
    public int FrequencyCutoff { get; set; } = 0;

    [JsonProperty(PropertyName = "spectrogram_min")]
    public int SpectrogramMin { get; set; } = 0;

    [JsonProperty(PropertyName = "frequency_max")]
    public int FrequencyMax { get; set; } = 0;

    [JsonProperty(PropertyName = "uri")]
    public string Uri { get; set; } = string.Empty;
}