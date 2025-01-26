using Microsoft.AspNetCore.Mvc;
using StorageAPI.Models;
using StorageAPI.Services;

namespace StorageAPI.Controllers;

[ApiController]
[Route("[controller]")]
public class ShipController : ControllerBase
{
    private readonly IShipRepository _shipRepository;

    public ShipController(IShipRepository shipRepository)
    {
        _shipRepository = shipRepository;
    }


    [HttpGet]
    public async Task<IActionResult> GetAllShips()
    {
        var ships = await _shipRepository.GetShipAsync();
        return Ok(ships);
    }

    [HttpGet("{mmsi}")]
    public async Task<IActionResult> GetShip(string mmsi)
    {
        var ship = await _shipRepository.GetShipAsync(mmsi);
        //if(ship == null)
        //    return NotFound();
        
        return Ok(ship);
    }

    [HttpPost]
    public async Task<IActionResult> AddShip(Ships ship)
    {
        // Generate a unique ID for the ship if not provided
        ship.Mmsi = Guid.NewGuid().ToString();

        // Upload the file to Blob Storage
        //var blobUri = await _blobStorageService.UploadFileAsync(file.FileName, file.OpenReadStream());
        //ship.BlobUri = blobUri;

        // Add ship metadata to the database
        var addedShip = await _shipRepository.AddShipAsync(ship);

        return CreatedAtAction(nameof(GetShip), new { mmsi = addedShip.Mmsi }, addedShip);
    }

    

    [HttpPut("{mmsi}")]
    public async Task<IActionResult> UpdateShip(string mmsi, Ships ship)
    {
        if (mmsi != ship.Mmsi)
            return BadRequest();
        
        var updatedShip= await _shipRepository.UpdateShipAsync(mmsi, ship);
        return Ok(updatedShip);
    }

    [HttpDelete("{mmsi}")]
    public async Task<IActionResult> DeleteShip(string mmsi)
    {
        var success = await _shipRepository.DeleteShipAsync(mmsi);

        if (success)
            return NoContent();
        
        return NotFound();
    }
}