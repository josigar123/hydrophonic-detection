using Microsoft.AspNetCore.Mvc;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("[controller]")]
public class AisController : ControllerBase
{
    private readonly IAisRepository _aisRepository;

    public AisController(IAisRepository aisRepository)
    {
        _aisRepository = aisRepository;
    }


    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _aisRepository.GetAisDataAsync();
        return Ok(result);
    }

    [HttpGet("{logid}")]
    public async Task<IActionResult> GetShip(string logId)
    {
        var aisData = await _aisRepository.GetAisDataAsync(logId);
        //if(ship == null)
        //    return NotFound();
        
        return Ok(aisData);
    }

    [HttpPost]
    public async Task<IActionResult> AddAisData(AisData aisData)
    {
        // Generate a unique ID for logId if not provided
        aisData.LogId = Guid.NewGuid().ToString();
        var newAisData = await _aisRepository.AddAisDataAsync(aisData);

        return CreatedAtAction(nameof(GetShip), new { logId = newAisData.LogId }, aisData);
    }

    

    [HttpPut("{logid}")]
    public async Task<IActionResult> UpdateAisData(string logId, AisData aisData)
    {
        if (logId != aisData.LogId)
            return BadRequest();
        
        var updatedShip= await _aisRepository.UpdateAisDataAsync(logId, aisData);
        return Ok(updatedShip);
    }

    [HttpDelete("{logid}")]
    public async Task<IActionResult> Delete(string logId)
    {
        var success = await _aisRepository.DeleteAisDataAsync(logId);

        if (success)
            return NoContent();
        
        return NotFound();
    }
}