using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace StorageAPI.Models;

public class SpectrogramRegenerator
{

    [JsonProperty(PropertyName = "window_type")]
    public string WindowType { get; set; } = string.Empty;

    [JsonProperty(PropertyName = "n_segment")]
    public int NSegment { get; set; } = 0;

    [JsonProperty(PropertyName = "highpass_cutoff")]
    public int HighpassCutoff { get; set; } = 0;

    [JsonProperty(PropertyName = "lowpass_cutoff")]
    public int LowpassCutoff { get; set; } = 0;

    [JsonProperty(PropertyName = "color_scale_min")]
    public int ColorScaleMin { get; set; } = 0;

    [JsonProperty(PropertyName = "max_displayed_frequency")]
    public int MaxDisplayedFrequency { get; set; } = 0;

    [JsonProperty(PropertyName = "uri")]
    public string Uri { get; set; } = string.Empty;
}