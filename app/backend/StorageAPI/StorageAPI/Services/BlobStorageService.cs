using Azure.Storage.Blobs;

namespace StorageAPI.Services;

public class BlobStorageService
{
    private readonly string _containerName;
    private readonly BlobServiceClient _blobServiceClient;

    public BlobStorageService(IConfiguration configuration)
    {
        var connectionString = configuration["BlobConfig:connectionString"] ?? throw new InvalidOperationException();
        _containerName = configuration["BlobConfig:containerName"] ?? throw new InvalidOperationException();
        _blobServiceClient = new BlobServiceClient(connectionString);
    }

    public async Task<(string AudioUri, string BlobUri)> UploadFileAsync
    (string audioFile, string spectrogram, 
        Stream audioStream, Stream spectrogramStream)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        
        var audioBlobClient = containerClient.GetBlobClient("audio/" + audioFile);
        var spectrogramBlobClient = containerClient.GetBlobClient("spectrogram/" + spectrogram);
        
        await audioBlobClient.UploadAsync(audioStream, overwrite: true);
        await spectrogramBlobClient.UploadAsync(spectrogramStream, overwrite: true);
        
        return (audioBlobClient.Uri.ToString(), spectrogramBlobClient.Uri.ToString()); // Return URI of uploaded file
    }

    public async Task<Stream> DownloadFileAsync(string fileName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileName);

        var blobDownloadInfo = await blobClient.DownloadAsync();
        return blobDownloadInfo.Value.Content;
    }

    public async Task DeleteFileAsync(string fileName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileName);
        await blobClient.DeleteIfExistsAsync();
    }
}
