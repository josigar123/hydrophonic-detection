using Microsoft.AspNetCore.Mvc;
using StorageAPI.DTOs;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ShipController(IShipRepository shipRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        
        var shipList = await shipRepository.GetShipAsync();
        var shipDtoList = shipList.Select(ship => new ShipDto
        {
            Mmsi = ship.Mmsi,
            Name = ship.Name,
            Type = ship.Type,
            Flag = ship.Flag,
            Latitude = ship.Latitude,
            Longitude = ship.Longitude,
            LastSeen = ship.LastSeen

        });
        return Ok(shipDtoList);
    }

    [HttpGet("{mmsi}")]
    public async Task<IActionResult> Get(string mmsi)
    {
        var ships = await shipRepository.GetShipAsync(mmsi);
        
        var shipsDto = new ShipDto
        {
            Mmsi = ships.Mmsi,
            Name = ships.Name,
            Type = ships.Type,
            Flag = ships.Flag,
            Latitude = ships.Latitude,
            Longitude = ships.Longitude,
            LastSeen = ships.LastSeen
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
            Latitude = shipDto.Latitude,
            Longitude = shipDto.Longitude,
            LastSeen = shipDto.LastSeen
        };
        var addedShip = await shipRepository.AddShipAsync(ship);

        var newShipDto = new ShipDto
        {
            Mmsi = addedShip.Mmsi,
            Name = addedShip.Name,
            Type = addedShip.Type,
            Flag = addedShip.Flag,
            Latitude = addedShip.Latitude,
            Longitude = addedShip.Longitude,
            LastSeen = addedShip.LastSeen
        };

        return CreatedAtAction(nameof(Get), new { mmsi = newShipDto.Mmsi }, newShipDto);
    }

    
    [HttpPut("{mmsi}")]
    public async Task<IActionResult> Put(string mmsi, UpsertShipDto upsertShipDto)
    {
        try
        {
            Ships existingShip = null;
            try
            {
                existingShip = await shipRepository.GetShipAsync(mmsi);
                if (upsertShipDto.LastSeen != null && existingShip.LastSeen >= upsertShipDto.LastSeen)
                    return StatusCode(304);
                existingShip.LastSeen = upsertShipDto.LastSeen;
                existingShip.Latitude = upsertShipDto.Latitude;
                existingShip.Longitude = upsertShipDto.Longitude;
            }
            catch (ApplicationException)
            {
                existingShip = new Ships
                {
                    Mmsi = mmsi,
                    Name = upsertShipDto.Name,
                    Type = upsertShipDto.Type,
                    Flag = upsertShipDto.Flag,
                    Longitude = upsertShipDto.Longitude,
                    Latitude = upsertShipDto.Latitude,
                    LastSeen = upsertShipDto.LastSeen
                };
            }

            var updatedShip = await shipRepository.UpdateShipAsync(mmsi, existingShip);

            var shipDto = new ShipDto
            {
                Mmsi = updatedShip.Mmsi,
                Name = updatedShip.Name,
                Type = updatedShip.Type,
                Flag = updatedShip.Flag,
                Latitude = updatedShip.Latitude,
                Longitude = updatedShip.Longitude,
                LastSeen = updatedShip.LastSeen
            };

            return Ok(shipDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
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