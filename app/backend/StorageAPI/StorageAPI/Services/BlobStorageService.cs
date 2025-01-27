using Azure.Storage.Blobs;

namespace StorageAPI.Services;

public class BlobStorageService
{
    private readonly string _connectionString;
    private readonly string _containerName;
    private readonly BlobServiceClient _blobServiceClient;

    public BlobStorageService(IConfiguration configuration)
    {
        _connectionString = configuration["BlobConfig:connectionString"];
        _containerName = configuration["BlobConfig:containerName"];
        _blobServiceClient = new BlobServiceClient(_connectionString);
    }

    public async Task<string> UploadFileAsync(string fileName, Stream fileStream)
    {
        Console.WriteLine($"Attempting to upload to container: {_containerName}");
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(fileName);
        await blobClient.UploadAsync(fileStream, overwrite: true);
        Console.WriteLine($"Container verified or created: {_containerName}");



        return blobClient.Uri.ToString(); // Return URI of uploaded file
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
