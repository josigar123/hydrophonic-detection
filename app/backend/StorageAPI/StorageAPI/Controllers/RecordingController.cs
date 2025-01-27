using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers; //TODO refactor shared logic

[ApiController]
[Route("[controller]")]
public class RecordingController : ControllerBase
{
    private readonly IRecordingRepository _recordingRepository;
    private readonly BlobStorageService _blobStorageService;

    public RecordingController(IRecordingRepository recordingRepository, BlobStorageService blobStorageService)
    {
        _recordingRepository = recordingRepository;
        _blobStorageService = blobStorageService;
    }


    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _recordingRepository.GetRecordingAsync();
        return Ok(result);
    }

    [HttpGet("{recordingId}")]
    public async Task<IActionResult> Get(string recordingId) //Add support for MMSI lookup?
    {
        var result = await _recordingRepository.GetRecordingAsync(recordingId);
        return Ok(result);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Post(IFormFile file, [FromForm] Recordings recording)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("File is missing.");
        }

        // Generate a unique ID for the recording if not provided
        recording.RecordingId ??= Guid.NewGuid().ToString();

        // Upload the file to Blob Storage -> Needs support for Spectrogram
        var blobUri = await _blobStorageService.UploadFileAsync(file.FileName, file.OpenReadStream());
        recording.AudioUri = blobUri; 

        // Add metadata to the database
        var result = await _recordingRepository.AddRecordingAsync(recording);

        return CreatedAtAction(nameof(Get), new { recordingId = result.RecordingId }, result);
    }

    

    [HttpPut("{recordingId}")]
    public async Task<IActionResult> Put(string recordingId, [FromBody] Recordings recording)
    {
        var result = await _recordingRepository.UpdateRecordingAsync(recordingId, recording);
        return Ok(result);
    }

    [HttpDelete("{recordingId}")]
    public async Task<IActionResult> Delete(string recordingId)
    {
        var result = await _recordingRepository.DeleteRecordingAsync(recordingId);
        
        if(result)
            return NoContent();
        else
            return BadRequest();
    }
}