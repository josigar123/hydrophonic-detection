using Microsoft.AspNetCore.Mvc;
using Spectrogramgenerator;
using StorageAPI.Services;
using StorageAPI.Models;

[ApiController]
[Route("api/v1/[controller]")]
public class ReprocessorController(SpectrogramGenerator.SpectrogramGeneratorClient spectrogramGeneratorClient, BlobStorageService blobClient) : ControllerBase
{

    [HttpPost]
    public async Task<IActionResult> RegenerateSpectrogram(SpectrogramRegenerator spectrogramRegenerator)
    {
        var file_prefix = "audio/";
        var fileStream = await blobClient.DownloadFileAsync(file_prefix + spectrogramRegenerator.Uri);
        Console.WriteLine("Fetched filestream from blob");
        byte[] fileBytes;
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);
        fileBytes = memoryStream.ToArray();
        Console.WriteLine("Copied memoryStream to byte array");
        // Perform the gRPC call
        var request = new SpectrogramGeneratorRequest
        {
            WindowType = spectrogramRegenerator.WindowType,
            NSamples = spectrogramRegenerator.NSamples,
            FrequencyCutoff = spectrogramRegenerator.FrequencyCutoff,
            FrequencyMax = spectrogramRegenerator.FrequencyMax,
            SpectrogramMin = spectrogramRegenerator.SpectrogramMin,
            WavData = Google.Protobuf.ByteString.CopyFrom(fileBytes)
        };
        // After call, return the spectrograms ByteStream PNG for frontend use

        Console.WriteLine("Sending gRPC request");
        var response = await spectrogramGeneratorClient.GenerateSpectrogramAsync(request);
        Console.WriteLine("Recieved response from gRPC request");

        var spectrogramStream = new MemoryStream(response.SpectrogramImageFile.ToByteArray());
        return new FileStreamResult(spectrogramStream, "image/png");
    }

}