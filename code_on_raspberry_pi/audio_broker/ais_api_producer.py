import asyncio
import json
import time
from datetime import datetime
import requests
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from math import radians, cos, sin, asin, sqrt

class AisFetcher:
    def __init__(self, config_file="ais_fetcher_config.json"):
        # Load configuration
        with open(config_file, "r") as file:
            self.config = json.load(file)
        
        # API endpoint from config
        self.api_url = self.config.get("api_url", "https://kystdatahuset.no/ws/api/ais/realtime/geojson")
        
        # Kafka configuration
        self.bootstrap_servers = f"{self.config['broker']['ip']}:{self.config['broker']['port']}"
        self.topic = self.config.get("kafka_topic", "ais-log")
        
        # Fetch interval in seconds
        self.fetch_interval = self.config.get("fetch_interval", 10)
        
        # Whether to run continuously or only during events
        self.event_only = self.config.get("event_only", True)
        
        # Geographic filtering configuration
        self.geo_filter = self.config.get("geographic_filter", {})
        self.geo_filter_enabled = self.geo_filter.get("enabled", False)
        
        # Default center position and radius (used if no user position is available)
        default_center = self.geo_filter.get("default_center", {})
        self.center_lat = default_center.get("latitude", 0)
        self.center_lon = default_center.get("longitude", 0)
        self.radius_km = self.geo_filter.get("default_radius_km", 25)
        
        # User position topic
        self.user_position_topic = self.geo_filter.get("user_position_topic", "user-position")
        
        # Current active events
        self.active_events = set()
        
        print(f"AIS Fetcher initialized with interval {self.fetch_interval}s")
        if self.event_only:
            print("Running in event-only mode")
        else:
            print("Running in continuous mode")
            
        if self.geo_filter_enabled:
            print(f"Geographic filtering enabled with radius {self.radius_km}km")
            print(f"Default center position: {self.center_lat}, {self.center_lon}")

    async def start(self):
        """Start the AIS fetcher service"""
        # Create producer
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        await self.producer.start()
        print(f"Connected to Kafka broker at {self.bootstrap_servers}")
        
        try:
            tasks = []
            
            # Start user position listener if geographic filtering is enabled
            if self.geo_filter_enabled:
                tasks.append(self.listen_for_user_position())
            
            if self.event_only:
                # If event-only mode, start event listener and fetch task
                tasks.extend([
                    self.listen_for_events(),
                    self.fetch_during_events()
                ])
            else:
                # If continuous mode, just fetch continuously
                tasks.append(self.fetch_continuously())
                
            await asyncio.gather(*tasks)
        finally:
            await self.producer.stop()
            print("AIS Fetcher service stopped")

    async def fetch_ais_data(self):
        """Fetch AIS data from the API and return it"""
        try:
            print(f"Fetching AIS data from {self.api_url}")
            response = requests.get(self.api_url, timeout=10)
            response.raise_for_status()
            
            features = response.json().get('features', [])
            
            if not isinstance(features, list):
                print("Invalid data format received")
                return []
    
            ships = []
            for feature in features:
                coords = feature.get('geometry', {}).get('coordinates', [])
                if not coords or len(coords) == 0:
                    continue
                
                last_position = coords[-1]
                if not isinstance(last_position, list) or len(last_position) != 2:
                    continue
                
                longitude, latitude = last_position
                
                # Basic validation
                if (not isinstance(latitude, (int, float)) or 
                    not isinstance(longitude, (int, float)) or
                    latitude < -90 or latitude > 90 or
                    longitude < -180 or longitude > 180):
                    continue
                
                # Calculate course if neccessary
                calculated_course = 0
                if len(coords) >= 2:
                    prev_position = coords[-2]
                    if prev_position:
                        import math
                        calculated_course = math.atan2(
                            last_position[0] - prev_position[0],
                            last_position[1] - prev_position[1]
                        ) * (180 / math.pi)
                        calculated_course = (calculated_course + 360) % 360
                
                properties = feature.get('properties', {})
                
                ship = {
                    'mmsi': str(properties.get('mmsi', 'Unknown')),
                    'shipName': properties.get('ship_name', 'Unknown'),
                    'shipType': str(properties.get('ship_type', 'Unknown')),
                    'aisClass': properties.get('ais_class', 'Unknown'),
                    'callsign': properties.get('callsign', 'Unknown'),
                    'speed': str(properties.get('speed', '0')),
                    'destination': properties.get('destination', 'Unknown'),
                    'trueHeading': str(calculated_course if properties.get('true_heading') == 511 
                                   else properties.get('true_heading', '0')),
                    'length': str(properties.get('length', '0')),
                    'breadth': str(properties.get('breadth', '0')),
                    'latitude': latitude,
                    'longitude': longitude,
                    'dateTimeUtc': properties.get('date_time_utc', datetime.now().isoformat()),
                    'course': calculated_course,
                    'path': coords,
                    'timestamp': datetime.now().isoformat(),
                    'data_source': 'api'  

                }
                ships.append(ship)
            
    
            if self.geo_filter_enabled:
                filtered_ships = []
                for ship in ships:
                    if self.is_ship_in_area_of_interest(ship["latitude"], ship["longitude"]):
                        filtered_ships.append(ship)
                print(f"Filtered from {len(ships)} to {len(filtered_ships)} ships in geographic area")
                ships = filtered_ships
            
            return ships
        
        except Exception as e:
            print(f"Error fetching AIS data: {e}")
            return []

    def is_ship_in_area_of_interest(self, lat, lon):
        """Check if a ship is within the specified radius of the center position"""
        if not self.geo_filter_enabled:
            return True
            
        # Calculate distance using Haversine formula
        lat1, lon1 = radians(lat), radians(lon)
        lat2, lon2 = radians(self.center_lat), radians(self.center_lon)
        
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of Earth in kilometers
        
        distance = c * r
        return distance <= self.radius_km

    async def produce_api(self, ships):
        """Publish the AIS data to Kafka"""
        if not ships:
            print("No ships to publish")
            return
        
        for ship in ships:
            try:
                await self.producer.send_and_wait(self.topic, ship)
            except Exception as e:
                print(f"Error publishing ship {ship.get('mmsi')} to Kafka: {e}")
        
        print(f"Published {len(ships)} ships to Kafka topic '{self.topic}'")

    async def fetch_continuously(self):
        """Fetch AIS data continuously at the specified interval"""
        print(f"Starting continuous fetching every {self.fetch_interval} seconds")
        
        while True:
            try:
                ships = await self.fetch_ais_data()
                await self.produce_api(ships)
            except Exception as e:
                print(f"Error in continuous fetch cycle: {e}")
            
            await asyncio.sleep(self.fetch_interval)

    async def fetch_during_events(self):
        """Fetch AIS data only when there are active events"""
        print("Ready to fetch data during events")
        
        while True:
            if self.active_events:
                try:
                    event_interval = self.config.get("event_fetch_interval", self.fetch_interval / 2)
                    print(f"Event active, fetching data every {event_interval}s")
                    
                    ships = await self.fetch_ais_data()
                    await self.produce_api(ships)
                    
                    await asyncio.sleep(event_interval)
                except Exception as e:
                    print(f"Error in event fetch cycle: {e}")
                    await asyncio.sleep(1) 
            else:
                await asyncio.sleep(1)

    async def listen_for_events(self):
        """Listen for detection events from Kafka to trigger AIS fetching"""
        event_topics = [
            "narrowband-detection",
            "broadband-detection",
            "override-detection"
        ]
        
        consumer = AIOKafkaConsumer(
            *event_topics,
            bootstrap_servers=self.bootstrap_servers,
            auto_offset_reset="latest",
            value_deserializer=lambda m: bool(int.from_bytes(m, byteorder='big'))
        )
        
        await consumer.start()
        print(f"Started listening for events from {', '.join(event_topics)}")
        
        topic_states = {topic: False for topic in event_topics}
        
        try:
            async for msg in consumer:
                topic, threshold_reached = msg.topic, msg.value
                
                # Update topic state
                old_state = topic_states[topic]
                topic_states[topic] = threshold_reached
                
                # Check if event is active
                auto_detection = (topic_states["narrowband-detection"] and 
                                 topic_states["broadband-detection"])
                override_active = topic_states["override-detection"]
                any_event_active = auto_detection or override_active
                
                # Create a unique event ID based on active topics
                event_id = "event"
                if any_event_active and not self.active_events:
                    # New event started
                    self.active_events.add(event_id)
                    print(f"Event {event_id} started, AIS fetching activated")
                    
                    # Do an immediate fetch when event starts
                    ships = await self.fetch_ais_data()
                    await self.produce_api(ships)
                    
                elif not any_event_active and self.active_events:
                    # Event ended
                    self.active_events.clear()
                    print("All events ended, AIS fetching deactivated")
                    
                    # Do one final fetch when event ends
                    ships = await self.fetch_ais_data()
                    await self.produce_api(ships)
        finally:
            await consumer.stop()
            print("Event listener stopped")

    async def listen_for_user_position(self):
        """Listen for user position updates from Kafka"""
        consumer = AIOKafkaConsumer(
            self.user_position_topic,
            bootstrap_servers=self.bootstrap_servers,
            auto_offset_reset="latest",
            value_deserializer=lambda m: json.loads(m.decode("utf-8"))
        )
        
        await consumer.start()
        print(f"Started listening for user position updates from {self.user_position_topic}")
        
        try:
            async for msg in consumer:
                try:
                    position_data = msg.value
                    
                    # Update center position if valid coordinates are provided
                    if isinstance(position_data, dict):
                        if "latitude" in position_data and "longitude" in position_data:
                            lat = position_data["latitude"]
                            lon = position_data["longitude"]
                            
                            # Validate coordinates
                            if (isinstance(lat, (int, float)) and 
                                isinstance(lon, (int, float)) and
                                lat >= -90 and lat <= 90 and
                                lon >= -180 and lon <= 180):
                                
                                old_lat, old_lon = self.center_lat, self.center_lon
                                self.center_lat = lat
                                self.center_lon = lon
                                
                                # Update radius if provided
                                if "radius_km" in position_data and isinstance(position_data["radius_km"], (int, float)):
                                    self.radius_km = position_data["radius_km"]
                                
                                print(f"Updated center position from ({old_lat}, {old_lon}) to ({lat}, {lon})")
                                print(f"Current filtering radius: {self.radius_km}km")
                except Exception as e:
                    print(f"Error processing user position update: {e}")
        finally:
            await consumer.stop()
            print("User position listener stopped")

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