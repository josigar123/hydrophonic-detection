using StorageAPI.Models;

namespace StorageAPI.Services;

public interface IAisRepository
{
    Task<IEnumerable<AisData>> GetAisDataAsync();
    Task<AisData> GetAisDataAsync(string logId);
    Task<AisData> AddAisDataAsync(AisData aisData);
    Task<AisData> UpdateAisDataAsync(string logId, AisData updatedAisData);
    Task<bool> DeleteAisDataAsync(string logId);
}