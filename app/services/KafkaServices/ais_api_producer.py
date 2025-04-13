import asyncio
import json
from ServiceUtils.ais_fetcher import AisFetcher

async def main():
    config_file = "ais_fetcher_config.json"
    try:
        with open(config_file, "r") as file:
            config = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        # Create default config
        config = {
            "api_url": "https://kystdatahuset.no/ws/api/ais/realtime/geojson",
            "broker": {
                "ip": "10.0.0.24",
                "port": 9092
            },
            "kafka_topic": "ais-log",
            "fetch_interval": 10,
            "event_fetch_interval": 5,
            "event_only": False,
            "geographic_filter": {
                "enabled": True,
                "default_center": {
                    "latitude": 59.412598788251344,
                    "longitude": 10.4901256300511
                },
                "default_radius_km": 10,
                "user_position_topic": "user-position"
            }
        }
        
        with open(config_file, "w") as file:
            json.dump(config, file, indent=2)
    
    
    fetcher = AisFetcher(config_file)
    await fetcher.start()

if __name__ == "__main__":
    asyncio.run(main())