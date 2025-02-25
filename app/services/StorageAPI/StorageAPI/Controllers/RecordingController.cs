using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using StorageAPI.DTOs;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class RecordingController(IRecordingRepository recordingRepository, BlobStorageService blobStorageService)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var recordingDataList = await recordingRepository.GetRecordingAsync();
        var recordingDataListDto = recordingDataList.Select(recording => new RecordingsDto
        {
            RecordingId = recording.RecordingId,
            StartTime = recording.StartTime,
            EndTime = recording.EndTime,
            AudioUri = recording.AudioUri,
            ReferencedAisLog = recording.ReferencedAisLog
            
        });
        return Ok(recordingDataListDto);
    }

    [HttpGet("{recordingId}")]
    public async Task<IActionResult> Get(string recordingId)
    {
        var recording = await recordingRepository.GetRecordingAsync(recordingId);
        var recordingDto = new RecordingsDto
        {
            RecordingId = recording.RecordingId,
            StartTime = recording.StartTime,
            EndTime = recording.EndTime,
            AudioUri = recording.AudioUri,
            ReferencedAisLog = recording.ReferencedAisLog
        };
        return Ok(recordingDto);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Post(IFormFile audioFile, [FromForm] CreateRecordingDto createRecordingDto)
    {
        if (audioFile.Length == 0)
        {
            return BadRequest("Audio file is missing.");   
        }
        var fileType = "audio";
        var audioUri = await blobStorageService.UploadFileAsync(fileType, audioFile.OpenReadStream());
        var recording = new Recordings
        {
            RecordingId = Guid.NewGuid().ToString("N"),
            StartTime = createRecordingDto.StartTime,
            EndTime = createRecordingDto.EndTime,
            AudioUri = audioUri,
            ReferencedAisLog = createRecordingDto.ReferencedAisLog
        };

        var newRecording = await recordingRepository.AddRecordingAsync(recording);
        
        var newRecordingDto = new RecordingsDto
        {
            RecordingId = newRecording.RecordingId,
            StartTime = newRecording.StartTime,
            EndTime = newRecording.EndTime,
            AudioUri = newRecording.AudioUri,
            ReferencedAisLog = newRecording.ReferencedAisLog
        };
        return CreatedAtAction(nameof(Get), new { recordingId = newRecordingDto.RecordingId }, newRecordingDto);
    }

    

    [HttpPut("{recordingId}")]
    public async Task<IActionResult> Put(string recordingId, UpdateRecordingDto updateRecordingDto)
    {
        var recording = await recordingRepository.GetRecordingAsync(recordingId);
        recording.HydrophoneId = updateRecordingDto.HydrophoneId;
        recording.ReferencedAisLog = updateRecordingDto.ReferencedAisLog;
        
        var updatedRecording = await recordingRepository.UpdateRecordingAsync(recordingId, recording);
        var recordingDto = new RecordingsDto
        {
            RecordingId = updatedRecording.RecordingId,
            StartTime = updatedRecording.StartTime,
            EndTime = updatedRecording.EndTime,
            AudioUri = updatedRecording.AudioUri,
            ReferencedAisLog = updatedRecording.ReferencedAisLog
        };
        return Ok(recordingDto);
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