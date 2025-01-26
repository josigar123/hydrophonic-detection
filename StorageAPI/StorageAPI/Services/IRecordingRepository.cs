using StorageAPI.Models;

namespace StorageAPI.Services;

public interface IRecordingRepository
{
    Task<IEnumerable<Recordings>> GetRecordingAsync();
    Task<Recordings> GetRecordingAsync(string recordingId);
    Task<Recordings> AddRecordingAsync(Recordings recording);
    Task<Stream> GetBlobForRecordingAsync(string fileName); //TODO implement
    Task<Recordings> UpdateRecordingAsync(string recordingId, Recordings updatedRecording);
    Task<bool> DeleteRecordingAsync(string recordingId);
}