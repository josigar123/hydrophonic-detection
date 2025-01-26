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


/*
 * Suggested database structure 
 * recordingId: "unique-recording-id"
 * mmsi: "unique-ship-id"
 * recordingDate: "date"
 * location: {latitude: decimal, longitude: decimal},
 * recordingURI: "BlobURI"
 * aisData: {speed: decimal, heading: decimal },
 * soundData: {duration: decimal, frequencyRange: int hz }
 * 
 */