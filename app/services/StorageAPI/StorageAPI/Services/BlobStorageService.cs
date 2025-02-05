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

    public async Task<string> UploadFileAsync
    (string type, Stream blobStream)
    {
        var blobFileName = Guid.NewGuid().ToString("N");
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        
        var fileBlobClient = containerClient.GetBlobClient(type + "/" + blobFileName);
        await fileBlobClient.UploadAsync(blobStream, overwrite: true);
        return (fileBlobClient.Uri.ToString()); // Return URI of uploaded file
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
