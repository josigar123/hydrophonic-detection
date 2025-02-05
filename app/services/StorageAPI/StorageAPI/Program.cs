using StorageAPI.Services;
using Spectrogramgenerator;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<BlobStorageService>();

builder.Services.AddGrpcClient<SpectrogramGenerator.SpectrogramGeneratorClient>(o =>
{
    o.Address = new Uri("http://localhost:50051");
}
);

builder.Services.AddScoped<IShipRepository, ShipRepository>(serviceProvider => //Ship table
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    return new ShipRepository(
        configuration.GetConnectionString("CosmosDb"),
        configuration["CosmosConfig:ShipMetaData:authKey"],
        configuration["CosmosConfig:ShipMetaData:databaseName"],
        configuration["CosmosConfig:ShipMetaData:containerName"],
        serviceProvider.GetRequiredService<ILogger<ShipRepository>>()
    );
});

builder.Services.AddScoped<IRecordingRepository, RecordingRepository>(serviceProvider => //Recording table
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    return new RecordingRepository(
        configuration.GetConnectionString("CosmosDb"),
        configuration["CosmosConfig:RecordingData:authKey"],
        configuration["CosmosConfig:RecordingData:databaseName"],
        configuration["CosmosConfig:RecordingData:containerName"],
        serviceProvider.GetRequiredService<BlobStorageService>(),
        serviceProvider.GetRequiredService<ILogger<RecordingRepository>>()
    );
});

builder.Services.AddScoped<IAisRepository, AisRepository>(serviceProvider => //Ais table
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    return new AisRepository(
        configuration.GetConnectionString("CosmosDb"),
        configuration["CosmosConfig:AISData:authKey"],
        configuration["CosmosConfig:AISData:databaseName"],
        configuration["CosmosConfig:AISData:containerName"],
        serviceProvider.GetRequiredService<ILogger<AisRepository>>()
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
