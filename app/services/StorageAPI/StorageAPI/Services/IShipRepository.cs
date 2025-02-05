using StorageAPI.Models;

namespace StorageAPI.Services;


public interface IShipRepository
{
    Task<IEnumerable<Ships>> GetShipAsync(); 
    Task<Ships> GetShipAsync(string mmsi);
    Task<Ships> AddShipAsync(Ships ships);
    Task<Ships> UpdateShipAsync(string mmsi, Ships ships);
    Task<bool> DeleteShipAsync(string mmsi);
}