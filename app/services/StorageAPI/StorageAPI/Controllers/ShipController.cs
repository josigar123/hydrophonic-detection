using Microsoft.AspNetCore.Mvc;
using StorageAPI.DTOs;
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
        
        var shipList = await shipRepository.GetShipAsync();
        var shipDtoList = shipList.Select(ship => new ShipsDto
        {
            Mmsi = ship.Mmsi,
            Name = ship.Name,
            Type = ship.Type,
            Flag = ship.Flag,
            LastKnownPosition = ship.LastKnownPosition,
            UpdatedAt = ship.UpdatedAt

        });
        return Ok(shipDtoList);
    }

    [HttpGet("{mmsi}")]
    public async Task<IActionResult> Get(string mmsi)
    {
        var ships = await shipRepository.GetShipAsync(mmsi);
        
        var shipsDto = new ShipsDto
        {
            Mmsi = ships.Mmsi,
            Name = ships.Name,
            Type = ships.Type,
            Flag = ships.Flag,
            LastKnownPosition = ships.LastKnownPosition,
            UpdatedAt = ships.UpdatedAt
        };
        
        return Ok(shipsDto);
    }

    [HttpPost]
    public async Task<IActionResult> AddShip(CreateShipDto shipDto)
    {
        var ship = new Ships
        {
            Mmsi = shipDto.Mmsi,
            Name = shipDto.Name,
            Type = shipDto.Type,
            Flag = shipDto.Flag,
            LastKnownPosition = shipDto.LastKnownPosition,
            UpdatedAt = shipDto.UpdatedAt
        };
        var addedShip = await shipRepository.AddShipAsync(ship);

        var newShipDto = new ShipsDto
        {
            Mmsi = addedShip.Mmsi,
            Name = addedShip.Name,
            Type = addedShip.Type,
            Flag = addedShip.Flag,
            LastKnownPosition = addedShip.LastKnownPosition,
            UpdatedAt = addedShip.UpdatedAt
        };

        return CreatedAtAction(nameof(Get), new { mmsi = newShipDto.Mmsi }, newShipDto);
    }

    
    [HttpPut("{mmsi}")]
    public async Task<IActionResult> Put(string mmsi, UpdateShipDto updateShipDto)
    {
        var ship = await shipRepository.GetShipAsync(mmsi);
        if (mmsi != ship.Mmsi)
            return BadRequest();
        
        ship.LastKnownPosition = updateShipDto.LastKnownPosition;
        ship.UpdatedAt = updateShipDto.UpdatedAt;
        
        var updatedShip= await shipRepository.UpdateShipAsync(mmsi, ship);
        var shipsDto = new ShipsDto
        {
            Mmsi = updatedShip.Mmsi,
            Name = updatedShip.Name,
            Type = updatedShip.Type,
            Flag = updatedShip.Flag,
            LastKnownPosition = updatedShip.LastKnownPosition,
            UpdatedAt = updatedShip.UpdatedAt
        };
        return Ok(shipsDto);
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