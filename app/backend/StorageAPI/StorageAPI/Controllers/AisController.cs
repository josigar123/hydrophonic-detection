using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos.Serialization.HybridRow;
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
    public async Task<IActionResult> Post(AisDataDto aisDataDto)
    {
        var aisData = new AisData
        {
            LogId = Guid.NewGuid().ToString(),
            Mmsi = aisDataDto.Mmsi,
            Timestamp = aisDataDto.Timestamp,
            Latitude = aisDataDto.Latitude,
            Longitude = aisDataDto.Longitude,
            Speed = aisDataDto.Speed,
            Heading = aisDataDto.Heading,
            RawMessage = aisDataDto.RawMessage
        };

        var newAisData = await aisRepository.AddAisDataAsync(aisData);

        var createdDto = new AisDataDto
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

        return CreatedAtAction(nameof(Get), new { logId = newAisData.LogId }, createdDto);
    }
    

    [HttpPut("{logId}")] //LogID should not be open to alterations here. 
    public async Task<IActionResult> Put(string logId, AisDataDto aisDataDto)
    {
        if (logId != aisDataDto.LogId)
            return BadRequest("Log ID in the URL does not match the Log ID in the request body.");

        var aisData = new AisData
        {
            LogId = aisDataDto.LogId,
            Mmsi = aisDataDto.Mmsi,
            Timestamp = aisDataDto.Timestamp,
            Latitude = aisDataDto.Latitude,
            Longitude = aisDataDto.Longitude,
            Speed = aisDataDto.Speed,
            Heading = aisDataDto.Heading,
            RawMessage = aisDataDto.RawMessage
        };
        
        var updatedAisData = await aisRepository.UpdateAisDataAsync(logId, aisData);
        
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