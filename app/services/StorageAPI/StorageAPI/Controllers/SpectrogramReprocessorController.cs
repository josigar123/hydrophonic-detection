using Microsoft.AspNetCore.Mvc;
using Spectrogramgenerator;
using StorageAPI.Services;
using StorageAPI.Models;

[ApiController]
[Route("api/v1/[controller]")]
public class SpectrogramReprocessorController(SpectrogramGenerator.SpectrogramGeneratorClient spectrogramGeneratorClient, BlobStorageService blobClient) : ControllerBase
{

    private static readonly HashSet<string> ValidWindowTypes = new HashSet<string>
    {
        "hann",
        "hamming",
        "blackman",
        "boxcar",
        "bartlett",
        "flattop",
        "parzen",
        "bohman",
        "blackmanharris",
        "nuttall",
        "barthann",
        "cosine",
        "exponential",
        "tukey",
        "taylor",
        "lanczos",
    };

    [HttpPost]
    public async Task<IActionResult> RegenerateSpectrogram([FromBody] SpectrogramRegenerator spectrogramRegenerator)
    {
        spectrogramRegenerator.WindowType = spectrogramRegenerator.WindowType.ToLower();
        if (!ValidWindowTypes.Contains(spectrogramRegenerator.WindowType))
        {
            Console.WriteLine($"Received WindowType: {spectrogramRegenerator.WindowType}");
            return BadRequest("Invalid window type.");
        }

        var file_prefix = "audio/";
        var fileStream = await blobClient.DownloadFileAsync(file_prefix + spectrogramRegenerator.Uri);
        byte[] fileBytes;
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        fileBytes = memoryStream.ToArray();

        var request = new SpectrogramGeneratorRequest
        {
            WindowType = spectrogramRegenerator.WindowType,
            NSamples = spectrogramRegenerator.NSamples,
            FrequencyCutoff = spectrogramRegenerator.FrequencyCutoff,
            FrequencyMax = spectrogramRegenerator.FrequencyMax,
            SpectrogramMin = spectrogramRegenerator.SpectrogramMin,
            WavData = Google.Protobuf.ByteString.CopyFrom(fileBytes)
        };

        Console.WriteLine("Sending gRPC request");
        var response = await spectrogramGeneratorClient.GenerateSpectrogramAsync(request);
        Console.WriteLine("Recieved response from gRPC request");

        var spectrogramStream = new MemoryStream(response.SpectrogramImageFile.ToByteArray());
        return new FileStreamResult(spectrogramStream, "image/png");
    }
}