using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos;
using StorageAPI.Models;

namespace StorageAPI.Services;

public class ShipRepository : IShipRepository
{
    private readonly Container _container;

    public ShipRepository(
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

    
    public async Task<IEnumerable<Ships>> GetShipAsync()
    {
        var query = _container.GetItemQueryIterator<Ships>(new QueryDefinition("select * from ships"));
        
        var results = new List<Ships>();
        while (query.HasMoreResults)
        {
            var response = await query.ReadNextAsync();
            results.AddRange(response.ToList());
        }
        
        return results;
    }

    public async Task<Ships> GetShipAsync(string mmsi)
    {
        try
        {
            var response = await _container.ReadItemAsync<Ships>(mmsi, new PartitionKey(mmsi));
            return response.Resource;
        }
        catch (Exception ex)
        {
            //Console.WriteLine(ex);
            //throw;
            return null; //Update this
        }
    }

    public async Task<Ships> AddShipAsync(Ships ship)
    {
        //Console.WriteLine($"Adding Ship: Id={ships.Id}, RecordingId={ships.RecordingId}, Mmsi={ships.Mmsi}");
        ship.UpdatedAt = DateTime.Now;
        var response = await _container.CreateItemAsync<Ships>(ship, new PartitionKey(ship.Mmsi));
        return response.Resource;
    }
    
    //public async Task<Stream> GetBlobForShipAsync(string fileName)
    //{
    //    return await _blobStorageService.DownloadFileAsync(fileName);
    //}

    public async Task<Ships> UpdateShipAsync(string mmsi, Ships updatedShip)
    {
        updatedShip.UpdatedAt = DateTime.Now;
        var response = await _container.UpsertItemAsync<Ships>(updatedShip, new PartitionKey(updatedShip.Mmsi));
        return response.Resource;
    }

    public async Task<bool> DeleteShipAsync(string mmsi)
    {
        try
        {
            await _container.DeleteItemAsync<Ships>(mmsi, new PartitionKey(mmsi));
            return true;
        }
        catch (Exception ex)
        {
            return false;
        }
    }
}