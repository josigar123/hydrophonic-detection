using Microsoft.Azure.Cosmos;
using StorageAPI.Models;

namespace StorageAPI.Services;

public class RecordingRepository :IRecordingRepository
{
    private readonly Container _container;
    private readonly BlobStorageService _blobStorageService;
    private readonly ILogger<RecordingRepository> _logger;

    public RecordingRepository(
        string conn,
        string key,
        string databaseName,
        string containerName,
        BlobStorageService blobStorageService,
        ILogger<RecordingRepository> logger)
    {
        if (string.IsNullOrEmpty(conn))
            throw new ArgumentNullException(nameof(conn), "Connection string cannot be null");
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key), "CosmosDB authKey cannot be null or empty.");
        if (string.IsNullOrEmpty(databaseName))
            throw new ArgumentNullException(nameof(databaseName), "CosmosDB database name cannot be null or empty.");
        if(string.IsNullOrEmpty(containerName))
            throw new ArgumentNullException(nameof(containerName), "CosmosDB container name cannot be null or empty.");

        var cosmosClient = new CosmosClient(conn, key, new CosmosClientOptions() { });
        _container = cosmosClient.GetContainer(databaseName, containerName);
        _blobStorageService = blobStorageService ?? throw new ArgumentNullException(nameof(blobStorageService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    
    public async Task<IEnumerable<Recordings>> GetRecordingAsync()
    {
        var query = _container.GetItemQueryIterator<Recordings>(new QueryDefinition("select * from recordings"));
        var results = new List<Recordings>();

        try
        {
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                results.AddRange(response.ToList());
            }

            return results;
        }
        catch (CosmosException ex)
        {
            _logger.LogError("An error occurred while querying Cosmos DB for Recordings.");
            throw new ApplicationException("An error occurred while querying Cosmos DB for Recordings.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError("An error occurred while querying Cosmos DB for Recordings.");
            throw new ApplicationException("An error occurred while querying Cosmos DB for Recordings.", ex);
        }

    }

    public async Task<Recordings> GetRecordingAsync(string recordingId)
    {
        try
        {
            var response = await _container.ReadItemAsync<Recordings>(recordingId, new PartitionKey(recordingId));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Recording with {recordingId} could not be found.", recordingId);
            throw new ApplicationException($"Recording with {recordingId} could not be found.", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError("Cosmos error when reading recording {recordingId}.", recordingId);
            throw new ApplicationException($"Cosmos error when reading recording {recordingId}.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError("Exception when reading recording {recordingId}.", recordingId);
            throw new ApplicationException($"Exception when reading recording {recordingId}.", ex);
        }
    }

    public async Task<Recordings> AddRecordingAsync(Recordings recording)
    {
        try
        {
            var response = await _container.CreateItemAsync<Recordings>(recording, new PartitionKey(recording.RecordingId));
            return response.Resource;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("Failed to create recording with id {recording.RecordingId}", cosmosException);
            throw new ApplicationException($"Failed to create recording with id {recording.RecordingId}", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Failed to create recording with id {recording.RecordingId}", exception);
            throw new ApplicationException($"Failed to create recording with id {recording.RecordingId}", exception);
        }

    }
    
    public async Task<Stream> GetBlobForRecordingAsync(string fileName)
    {
        try
        {
            return await _blobStorageService.DownloadFileAsync(fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download file {fileName}", fileName);
            throw new ApplicationException("Failed to download file", ex);
        }
        
    }

    public async Task<Recordings> UpdateRecordingAsync(string recordingId, Recordings updatedRecording)
    {
        try
        {
            var response =
                await _container.UpsertItemAsync<Recordings>(updatedRecording,
                    new PartitionKey(updatedRecording.RecordingId));
            return response.Resource;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("Failed to update recording with id {recordingId}", cosmosException);
            throw new ApplicationException($"Failed to update recording with id {recordingId}", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Failed to update recording with id {recordingId}", exception);
            throw new ApplicationException($"Failed to update recording with id {recordingId}", exception);
        }

    }

    public async Task<bool> DeleteRecordingAsync(string recordingId)
    {
        try
        {
            await _container.DeleteItemAsync<Recordings>(recordingId, new PartitionKey(recordingId));
            await _blobStorageService.DeleteFileAsync(recordingId);
            return true;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("AIS Item with {recordingId} could not be found.", recordingId);
            return false;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("AIS item with {recordingId} could not be deleted.", recordingId);
            throw new ApplicationException($"AIS item with {recordingId} could not be deleted.", cosmosException);
        }
        catch (Exception ex)
        {
            _logger.LogError("Exception when deleting AIS item with {recordingId}.", recordingId);
            return false;
        }
    }
}