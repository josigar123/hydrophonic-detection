using StorageAPI.Services;
using Spectrogramgenerator;
using Microsoft.AspNetCore.Server.Kestrel.Core;

const int MAX_REQUEST_BODY_SIZE = 30 * 1024 * 1024; // 50mb

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<BlobStorageService>();

builder.Services.AddGrpcClient<SpectrogramGenerator.SpectrogramGeneratorClient>(o =>
{
    o.Address = new Uri("http://localhost:50051");
}
)
.ConfigureChannel(channelOpions =>
{
    channelOpions.MaxSendMessageSize = MAX_REQUEST_BODY_SIZE;
    channelOpions.MaxReceiveMessageSize = MAX_REQUEST_BODY_SIZE;
});

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

// CORS to allow requests from web page
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", builder =>
    {
        builder.WithOrigins("http://localhost:5173").AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowLocalhost");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
