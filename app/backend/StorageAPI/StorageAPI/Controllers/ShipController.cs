using Microsoft.AspNetCore.Mvc;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("[controller]")]
public class ShipController(IShipRepository shipRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var ships = await shipRepository.GetShipAsync();
        return Ok(ships);
    }

    [HttpGet("{mmsi}")]
    public async Task<IActionResult> Get(string mmsi)
    {
        var ship = await shipRepository.GetShipAsync(mmsi);
        
        return Ok(ship);
    }

    [HttpPost]
    public async Task<IActionResult> AddShip(Ships ship)
    {
        ship.Mmsi = Guid.NewGuid().ToString();
        var addedShip = await shipRepository.AddShipAsync(ship);

        return CreatedAtAction(nameof(Get), new { mmsi = addedShip.Mmsi }, addedShip);
    }

    

    [HttpPut("{mmsi}")]
    public async Task<IActionResult> Put(string mmsi, Ships ship)
    {
        if (mmsi != ship.Mmsi)
            return BadRequest();
        
        var updatedShip= await shipRepository.UpdateShipAsync(mmsi, ship);
        return Ok(updatedShip);
    }

    [HttpDelete("{mmsi}")]
    public async Task<IActionResult> Delete(string mmsi)
    {
        var success = await shipRepository.DeleteShipAsync(mmsi);

        if (success)
            return NoContent();
        
        return NotFound();
    }
}