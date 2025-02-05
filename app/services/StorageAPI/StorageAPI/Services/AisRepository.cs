using Microsoft.Azure.Cosmos;
using StorageAPI.Models;

namespace StorageAPI.Services;

public class AisRepository : IAisRepository
{
    private readonly Container _container;
    private readonly ILogger<AisRepository> _logger;

    public AisRepository(
        string conn,
        string key,
        string databaseName,
        string containerName,
        ILogger<AisRepository> logger)
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
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    
    public async Task<IEnumerable<AisData>> GetAisDataAsync()
    {
        var query = _container.GetItemQueryIterator<AisData>(new QueryDefinition("select * from aisData"));
        var results = new List<AisData>();
        try
        {
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();
                results.AddRange(response.ToList());
            }
                   
            return results;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError(cosmosException, "An error occurred while querying Cosmos DB for AIS data.");
            throw new ApplicationException("An error occurred while querying Cosmos DB for AIS data.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while querying Cosmos DB for AIS data.");
            throw new ApplicationException("An error occurred while querying Cosmos DB for AIS data.");
        }
    }

    public async Task<AisData> GetAisDataAsync(string logId)
    {
        try
        {
            var response = await _container.ReadItemAsync<AisData>(logId, new PartitionKey(logId));
            return response.Resource;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("AIS Item with {logId} could not be found.", logId);
            throw new ApplicationException($"AIS Item with {logId} could not be found.", cosmosException);
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("CosmosError when reading AIS item with {logId}.", logId);
            throw new ApplicationException($"CosmosError when reading AIS item with {logId}.", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Exception when reading AIS item with {logId}.", logId);
            throw new ApplicationException($"Exception when reading AIS item with {logId}.", exception);
        }
    }

    public async Task<AisData> AddAisDataAsync(AisData aisData)
    {
        try
        {
            var response = await _container.CreateItemAsync<AisData>(aisData, new PartitionKey(aisData.LogId));
            return response.Resource;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("AIS item with {logId} could not be added.", aisData.LogId);
            throw new ApplicationException($"AIS item with {aisData.LogId} could not be added.", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Exception when adding AIS item with {logId}.", aisData.LogId);
            throw new ApplicationException($"Exception when adding AIS item with {aisData.LogId}.", exception);
        }

    }
    

    public async Task<AisData> UpdateAisDataAsync(string logId, AisData updatedAisData)
    {
        try
        {
            var response =
                await _container.UpsertItemAsync<AisData>(updatedAisData, new PartitionKey(updatedAisData.LogId));
            return response.Resource;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("AIS Item with {logId} could not be found.", logId);
            throw new ApplicationException($"AIS item with {logId} could not be found.", cosmosException);
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("AIS item with {logId} could not be updated.", logId);
            throw new ApplicationException($"AIS item with {logId} could not be updated.", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Exception when updating AIS item with {logId}.", logId);
            throw new ApplicationException($"Exception when updating AIS item with {logId}.", exception);
        }
    }

    public async Task<bool> DeleteAisDataAsync(string logId)
    {
        try
        {
            await _container.DeleteItemAsync<AisData>(logId, new PartitionKey(logId));
            return true;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("AIS Item with {logId} could not be found.", logId);
            return false;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("AIS item with {logId} could not be deleted.", logId);
            throw new ApplicationException($"AIS item with {logId} could not be deleted.", cosmosException);
        }
        catch (Exception ex)
        {
            _logger.LogError("Exception when deleting AIS item with {logId}.", logId);
            return false;
        }
    }
}