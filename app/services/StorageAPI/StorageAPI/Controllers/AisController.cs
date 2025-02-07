using Microsoft.AspNetCore.Mvc;
using StorageAPI.DTOs;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("[controller]")]
public class AisController(IAisRepository aisRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var aisDataList = await aisRepository.GetAisDataAsync();
        var aisDataDtoList = aisDataList.Select(aisData => new AisDataDto
        {
            LogId = aisData.LogId,
            Mmsi = aisData.Mmsi,
            Timestamp = aisData.Timestamp,
            Latitude = aisData.Latitude,
            Longitude = aisData.Longitude,
            Speed = aisData.Speed,
            Heading = aisData.Heading,
            RawMessage = aisData.RawMessage
        });
        return Ok(aisDataDtoList);
    }

    [HttpGet("{logId}")]
    public async Task<IActionResult> Get(string logId)
    {
        var aisData = await aisRepository.GetAisDataAsync(logId);

        var aisDataDto = new AisDataDto
        {
            LogId = aisData.LogId,
            Mmsi = aisData.Mmsi,
            Timestamp = aisData.Timestamp,
            Latitude = aisData.Latitude,
            Longitude = aisData.Longitude,
            Speed = aisData.Speed,
            Heading = aisData.Heading,
            RawMessage = aisData.RawMessage
        };

        return Ok(aisDataDto);
    }

    [HttpPost]
    public async Task<IActionResult> Post(CreateAisDataDto createAisDataDto)
    {
        var aisData = new AisData
        {
            LogId = Guid.NewGuid().ToString("D"),
            Mmsi = createAisDataDto.Mmsi,
            Timestamp = createAisDataDto.Timestamp,
            Latitude = createAisDataDto.Latitude,
            Longitude = createAisDataDto.Longitude,
            Speed = createAisDataDto.Speed,
            Heading = createAisDataDto.Heading,
            RawMessage = createAisDataDto.RawMessage
        };

        var newAisData = await aisRepository.AddAisDataAsync(aisData);

        var newAisDataDto = new AisDataDto
        {
            LogId = newAisData.LogId,
            Mmsi = newAisData.Mmsi,
            Timestamp = newAisData.Timestamp,
            Latitude = newAisData.Latitude,
            Longitude = newAisData.Longitude,
            Speed = newAisData.Speed,
            Heading = newAisData.Heading,
            RawMessage = newAisData.RawMessage
        };

        return CreatedAtAction(nameof(Get), new { logId = newAisDataDto.LogId }, newAisDataDto);
    }


    [HttpPut("{logId}")]
    public async Task<IActionResult> Put(string logId, UpdateAisDataDto updateAisDataDto)
    {
        var aisData = await aisRepository.GetAisDataAsync(logId);
        if (logId != aisData.LogId)
            return BadRequest("Log ID in the URL does not match the Log ID in the request body.");

        var newAisData = new AisData
        {
            LogId = aisData.LogId,
            Mmsi = aisData.Mmsi,
            Timestamp = updateAisDataDto.Timestamp,
            Latitude = updateAisDataDto.Latitude,
            Longitude = updateAisDataDto.Longitude,
            Speed = updateAisDataDto.Speed,
            Heading = updateAisDataDto.Heading,
            RawMessage = updateAisDataDto.RawMessage
        };
        var updatedAisData = await aisRepository.UpdateAisDataAsync(logId, newAisData);

        var updatedAisDataDto = new AisDataDto
        {
            LogId = updatedAisData.LogId,
            Mmsi = updatedAisData.Mmsi,
            Timestamp = updatedAisData.Timestamp,
            Latitude = updatedAisData.Latitude,
            Longitude = updatedAisData.Longitude,
            Speed = updatedAisData.Speed,
            Heading = updatedAisData.Heading,
            RawMessage = updatedAisData.RawMessage
        };

        return Ok(updatedAisDataDto);
    }

    [HttpDelete("{logId}")]
    public async Task<IActionResult> Delete(string logId)
    {
        var success = await aisRepository.DeleteAisDataAsync(logId);

        if (success)
            return NoContent();

        return NotFound();
    }
}