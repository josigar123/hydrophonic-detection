using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos;
using StorageAPI.Models;

namespace StorageAPI.Services;

public class ShipRepository : IShipRepository
{
    private readonly Container _container;
    private readonly ILogger<ShipRepository> _logger;

    public ShipRepository(
        string conn,
        string key,
        string databaseName,
        string containerName,
        ILogger<ShipRepository> logger)
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

    
    public async Task<IEnumerable<Ships>> GetShipAsync()
    {
        var query = _container.GetItemQueryIterator<Ships>(new QueryDefinition("select * from ships"));
        var results = new List<Ships>();

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
            _logger.LogInformation("An error occurred while querying Cosmos DB for Ships.");
            throw new ApplicationException("An error occurred while querying Cosmos DB for Ships.", ex);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("An error occurred while querying Cosmos DB for Ships.");
            throw new ApplicationException("An error occurred while querying Cosmos DB for Ships.", ex);
        }

    }

    public async Task<Ships> GetShipAsync(string mmsi)
    {
        try
        {
            var response = await _container.ReadItemAsync<Ships>(mmsi, new PartitionKey(mmsi));
            return response.Resource;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Ship {mmsi} could not be found.", mmsi);
            throw new ApplicationException($"Ship {mmsi} could not be found.", cosmosException);
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("CosmosError when reading Ship {mmsi}.", mmsi);
            throw new ApplicationException($"CosmosError when reading Ship {mmsi}.", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Exception when reading Ship {mmsi}.", mmsi);
            throw new ApplicationException($"Exception when reading Ship {mmsi}.", exception);
        }
    }

    public async Task<Ships> AddShipAsync(Ships ship)
    {
        try
        {
            var response = await _container.CreateItemAsync<Ships>(ship, new PartitionKey(ship.Mmsi));
            return response.Resource;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("Ship {Mmsi} could not be added.", ship.Mmsi);
            throw new ApplicationException($"Ship {ship.Mmsi} could not be added.", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Exception when adding AIS item with {Mmsi}.", ship.Mmsi);
            throw new ApplicationException($"Exception when adding AIS item with {ship.Mmsi}.", exception);
        }

    }

    public async Task<Ships> UpdateShipAsync(string mmsi, Ships updatedShip)
    {
        try
        {
            var response = await _container.UpsertItemAsync<Ships>(updatedShip, new PartitionKey(updatedShip.Mmsi));
            return response.Resource;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Ship {mmsi} could not be found.", mmsi);
            throw new ApplicationException($"Ship {mmsi} could not be found.", cosmosException);
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("Ship {mmsi} could not be updated.", mmsi);
            throw new ApplicationException($"Ship {mmsi} could not be updated.", cosmosException);
        }
        catch (Exception exception)
        {
            _logger.LogError("Exception when updating Ship {mmsi}.", mmsi);
            throw new ApplicationException($"Exception when updating Ship {mmsi}.", exception);
        }
    }

    public async Task<bool> DeleteShipAsync(string mmsi)
    {
        try
        {
            await _container.DeleteItemAsync<Ships>(mmsi, new PartitionKey(mmsi));
            return true;
        }
        catch (CosmosException cosmosException) when (cosmosException.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Ship {mmsi} could not be found.", mmsi);
            return false;
        }
        catch (CosmosException cosmosException)
        {
            _logger.LogError("Ship {mmsi} could not be deleted.", mmsi);
            throw new ApplicationException($"Ship {mmsi} could not be deleted.", cosmosException);
        }
        catch (Exception ex)
        {
            _logger.LogError("Exception when deleting Ship {mmsi}.", mmsi);
            return false;
        }
    }
}