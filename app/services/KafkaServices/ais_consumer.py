import asyncio
import json
from aiokafka import AIOKafkaConsumer
from ServiceUtils.websocket_client import WebSocketClient

"""
Consumes AIS data from Kafka and forwards it to a local WebSocket server so the
React front-end can display real-time ship positions.
"""

BROKER_INFO_RELATIVE_PATH = '../configs/broker_info.json'
KAFKA_TOPIC = 'ais-log'
CLIENT_NAME = 'map_client'
WEBSOCKET_URL = f"ws://localhost:8766?client_name={CLIENT_NAME}"


def ensure_position_fields(record: dict) -> None:
    if "latitude" in record and "longitude" in record:
        return  # already present

    # lat / lon keys (Kystverket JSON stream)
    if "lat" in record and "lon" in record:
        try:
            record["latitude"] = float(record["lat"])
            record["longitude"] = float(record["lon"])
            return
        except (TypeError, ValueError):
            pass  # fall through and try geometry

    # GeoJSON geometry
    geom = record.get("geometry", {})
    coords = geom.get("coordinates")
    if coords and isinstance(coords, (list, tuple)) and len(coords) >= 2:
        try:
            lon, lat = float(coords[0]), float(coords[1])
            record["latitude"], record["longitude"] = lat, lon
        except (TypeError, ValueError):
            pass 

async def process_vessel_data(message: dict, ships: dict, socket_client: "WebSocketClient") -> None:
    # Merge incremental updates under MMSI to build complete records
    if "mmsi" in message:
        mmsi = message["mmsi"]
        ships.setdefault(mmsi, {})
        ships[mmsi].update(message)
        record = ships[mmsi]

        # Tag data source so the WS filter can match
        record.setdefault("data_source", "api")

        # Ensure latitude / longitude exist; if not, try to derive them
        ensure_position_fields(record)

        # Only forward if we have a position – keeps front‑end logic simple
        if "latitude" in record and "longitude" in record:
            await socket_client.send(json.dumps(record))
            print(f"[ais-consumer] → WS (api) {mmsi}")
    else:
        # No MMSI – treat as raw NMEA from antenna and wrap in JSON
        await socket_client.send(json.dumps({
            "nmea": message,
            "data_source": "antenna"
        }))
        print("[ais-consumer] → WS (raw NMEA / antenna)")


async def consume():
    """Main coroutine: connect to Kafka, then pump messages to the WS."""

    try:
        with open(BROKER_INFO_RELATIVE_PATH, "r") as fp:
            broker_info = json.load(fp)
        broker_ip, broker_port = broker_info["ip"], int(broker_info["port"])
    except (FileNotFoundError, json.JSONDecodeError, KeyError) as exc:
        raise SystemExit(f"Invalid broker info file: {exc}")

    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=f"{broker_ip}:{broker_port}",
        value_deserializer=lambda v: v.decode("utf-8"),
        auto_offset_reset="latest",
        enable_auto_commit=True,
    )
    await consumer.start()

    socket_client = WebSocketClient(WEBSOCKET_URL)
    print(f"[ais-consumer] Connecting to WebSocket at {WEBSOCKET_URL} …")
    if not await socket_client.connect():
        raise SystemExit("Could not connect to WebSocket server; aborting.")

    ships_cache: dict[str, dict] = {}

    try:
        async for kafka_msg in consumer:
            raw_value: str = kafka_msg.value

            # Attempt JSON parse first; fall back to raw string (NMEA)
            try:
                payload = json.loads(raw_value)
            except json.JSONDecodeError:
                await socket_client.send(json.dumps({
                    "nmea": raw_value,
                    "data_source": "antenna"
                }))
                continue

            # Kafka producer might emit single dicts or batches
            if isinstance(payload, list):
                for record in payload:
                    await process_vessel_data(record, ships_cache, socket_client)
            elif isinstance(payload, dict):
                await process_vessel_data(payload, ships_cache, socket_client)
            else:
                print(f"[ais-consumer] Unexpected payload type: {type(payload)}")

    finally:
        await consumer.stop()
        await socket_client.close()


if __name__ == "__main__":
    asyncio.run(consume())
