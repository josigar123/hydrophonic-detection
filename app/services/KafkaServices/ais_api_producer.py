import asyncio
import json
from ServiceUtils.ais_fetcher import AisFetcher

AIS_FETCHER_CONFIG_RELATIVE_PATH = '../../configs/ais_fetcher_config.json'
BROKER_INFO_RELATIVE_PATH = '../../configs/broker_info.json'

async def main():
    config_file = AIS_FETCHER_CONFIG_RELATIVE_PATH
    
    # Read broker info
    try:
        with open(BROKER_INFO_RELATIVE_PATH, "r") as file:
            broker_info = json.loads(file)
    except Exception as e:
        print(f"Error in ais_api_producer.py: {e}")
    
    ip = broker_info["ip"]
    port = broker_info["port"]
    
    try:
        with open(config_file, "r") as file:
            config = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        # Create default config
        config = {
            "api_url": "https://kystdatahuset.no/ws/api/ais/realtime/geojson",
            "broker": {
                "ip": ip,
                "port": int(port)
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