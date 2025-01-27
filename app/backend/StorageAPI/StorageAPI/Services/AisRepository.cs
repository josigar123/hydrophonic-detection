using Microsoft.Azure.Cosmos;
using StorageAPI.Models;

namespace StorageAPI.Services;

public class AisRepository : IAisRepository
{
    private readonly Container _container;

    public AisRepository(
        string conn,
        string key,
        string databaseName,
        string containerName)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key), "CosmosDB authKey cannot be null or empty.");

        var cosmosClient = new CosmosClient(conn, key, new CosmosClientOptions() { });
        _container = cosmosClient.GetContainer(databaseName, containerName);
    }

    
    public async Task<IEnumerable<AisData>> GetAisDataAsync()
    {
        var query = _container.GetItemQueryIterator<AisData>(new QueryDefinition("select * from aisData"));
        
        var results = new List<AisData>();
        while (query.HasMoreResults)
        {
            var response = await query.ReadNextAsync();
            results.AddRange(response.ToList());
        }
        
        return results;
    }

    public async Task<AisData> GetAisDataAsync(string logId)
    {
        try
        {
            var response = await _container.ReadItemAsync<AisData>(logId, new PartitionKey(logId));
            return response.Resource;
        }
        catch (Exception ex)
        {
            return null; //TODO Error handling
        }
    }

    public async Task<AisData> AddAisDataAsync(AisData aisData)
    {
        var response = await _container.CreateItemAsync<AisData>(aisData, new PartitionKey(aisData.LogId));
        return response.Resource;
    }
    

    public async Task<AisData> UpdateAisDataAsync(string logId, AisData updatedAisData)
    {
        var response = await _container.UpsertItemAsync<AisData>(updatedAisData, new PartitionKey(updatedAisData.LogId));
        return response.Resource;
    }

    public async Task<bool> DeleteAisDataAsync(string logId)
    {
        try
        {
            await _container.DeleteItemAsync<AisData>(logId, new PartitionKey(logId));
            return true;
        }
        catch (Exception ex)
        {
            return false;
        }
    }
}