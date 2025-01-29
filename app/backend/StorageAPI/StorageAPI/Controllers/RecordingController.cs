using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers; //TODO refactor shared logic

[ApiController]
[Route("[controller]")]
public class RecordingController(IRecordingRepository recordingRepository, BlobStorageService blobStorageService)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await recordingRepository.GetRecordingAsync();
        return Ok(result);
    }

    [HttpGet("{recordingId}")]
    public async Task<IActionResult> Get(string recordingId)
    {
        var result = await recordingRepository.GetRecordingAsync(recordingId);
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
        recording.RecordingId ??= Guid.NewGuid().ToString();

        // Upload the file to Blob Storage -> Needs support for Spectrogram
        var blobUri = await blobStorageService.UploadFileAsync(file.FileName, file.OpenReadStream());
        recording.AudioUri = blobUri; 
        
        var result = await recordingRepository.AddRecordingAsync(recording);

        return CreatedAtAction(nameof(Get), new { recordingId = result.RecordingId }, result);
    }

    

    [HttpPut("{recordingId}")]
    public async Task<IActionResult> Put(string recordingId, [FromBody] Recordings recording)
    {
        var result = await recordingRepository.UpdateRecordingAsync(recordingId, recording);
        return Ok(result);
    }

    [HttpDelete("{recordingId}")]
    public async Task<IActionResult> Delete(string recordingId)
    {
        var result = await recordingRepository.DeleteRecordingAsync(recordingId);
        
        if(result)
            return NoContent();
        else
            return BadRequest();
    }
}