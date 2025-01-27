using Microsoft.Azure.Cosmos;
using StorageAPI.Models;

namespace StorageAPI.Services;

public class RecordingRepository :IRecordingRepository
{
    private readonly Container _container;
    private readonly BlobStorageService _blobStorageService;

    public RecordingRepository(
        string conn,
        string key,
        string databaseName,
        string containerName,
        BlobStorageService blobStorageService)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key), "CosmosDB authKey cannot be null or empty.");

        var cosmosClient = new CosmosClient(conn, key, new CosmosClientOptions() { });
        _container = cosmosClient.GetContainer(databaseName, containerName);

        _blobStorageService = blobStorageService ?? throw new ArgumentNullException(nameof(blobStorageService));
    }

    
    public async Task<IEnumerable<Recordings>> GetRecordingAsync()
    {
        var query = _container.GetItemQueryIterator<Recordings>(new QueryDefinition("select * from recordings"));
        
        var results = new List<Recordings>();
        while (query.HasMoreResults)
        {
            var response = await query.ReadNextAsync();
            results.AddRange(response.ToList());
        }
        
        return results;
    }

    public async Task<Recordings> GetRecordingAsync(string recordingId)
    {
        try
        {
            var response = await _container.ReadItemAsync<Recordings>(recordingId, new PartitionKey(recordingId));
            return response.Resource;
        }
        catch (Exception ex)
        {
            //Console.WriteLine(ex);
            //throw;
            return null; //Update this
        }
    }

    public async Task<Recordings> AddRecordingAsync(Recordings recording)
    {
        var response = await _container.CreateItemAsync<Recordings>(recording, new PartitionKey(recording.RecordingId));
        return response.Resource;
    }
    
    public async Task<Stream> GetBlobForRecordingAsync(string fileName)
    {
        return await _blobStorageService.DownloadFileAsync(fileName);
    }

    public async Task<Recordings> UpdateRecordingAsync(string recordingId, Recordings updatedRecording)
    {
        var response = await _container.UpsertItemAsync<Recordings>(updatedRecording, new PartitionKey(updatedRecording.RecordingId));
        return response.Resource;
    }

    public async Task<bool> DeleteRecordingAsync(string recordingId)
    {
        try
        {
            await _container.DeleteItemAsync<Recordings>(recordingId, new PartitionKey(recordingId));
            await _blobStorageService.DeleteFileAsync(recordingId);
            return true;
        }
        catch (Exception ex)
        {
            return false;
        }
    }
}