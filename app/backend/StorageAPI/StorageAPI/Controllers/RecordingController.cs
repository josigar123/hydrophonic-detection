using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using StorageAPI.DTOs;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("[controller]")]
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
            HydrophoneId = recording.HydrophoneId,
            StartTime = recording.StartTime,
            EndTime = recording.EndTime,
            AudioUri = recording.AudioUri,
            SpectrogramUri = recording.SpectrogramUri,
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
            HydrophoneId = recording.HydrophoneId,
            StartTime = recording.StartTime,
            EndTime = recording.EndTime,
            AudioUri = recording.AudioUri,
            SpectrogramUri = recording.SpectrogramUri,
            ReferencedAisLog = recording.ReferencedAisLog
        };
        return Ok(recordingDto);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Post(IFormFile audioFile, IFormFile spectrogram, [FromForm] CreateRecordingDto createRecordingDto)
    {
        if (spectrogram.Length == 0)
        {
            return BadRequest("Spectrogram is missing.");
        }
        if (audioFile.Length == 0)
        {
            return BadRequest("Audio file is missing.");   
        }
        
        var (audioUri, spectrogramUri) = await blobStorageService.UploadFileAsync(audioFile.FileName, spectrogram.FileName, audioFile.OpenReadStream(), spectrogram.OpenReadStream());
        var recording = new Recordings
        {
            RecordingId = createRecordingDto.RecordingId,
            HydrophoneId = createRecordingDto.HydrophoneId,
            StartTime = createRecordingDto.StartTime,
            EndTime = createRecordingDto.EndTime,
            AudioUri = audioUri,
            SpectrogramUri = spectrogramUri,
            ReferencedAisLog = createRecordingDto.ReferencedAisLog
        };

        var newRecording = await recordingRepository.AddRecordingAsync(recording);
        
        var newRecordingDto = new RecordingsDto
        {
            RecordingId = newRecording.RecordingId,
            HydrophoneId = newRecording.HydrophoneId,
            StartTime = newRecording.StartTime,
            EndTime = newRecording.EndTime,
            AudioUri = newRecording.AudioUri,
            SpectrogramUri = newRecording.SpectrogramUri,
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
            HydrophoneId = updatedRecording.HydrophoneId,
            StartTime = updatedRecording.StartTime,
            EndTime = updatedRecording.EndTime,
            AudioUri = updatedRecording.AudioUri,
            SpectrogramUri = updatedRecording.SpectrogramUri,
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