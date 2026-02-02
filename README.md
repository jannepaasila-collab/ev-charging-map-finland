# EV Charging Stations Map (Finland)

Interactive full-stack web application for exploring electric vehicle charging stations in Finland,
based on Open Charge Map open data.

## Features

- Interactive map built with React and Leaflet
- Charging stations visualized as circle markers
  - Marker size based on charging power (kW)
  - Marker color based on operator
- Dynamic filters:
  - Minimum charging power
  - Operator
  - Option to include/exclude stations with unknown power
- Automatic map zooming (fitBounds) when filters change
- Operator legend displayed directly on the map

## Data Source

- Open Charge Map (OCM) API
- Data is normalized and validated in the backend:
  - Invalid coordinates filtered out
  - Latitude/longitude swap correction
  - Finland bounding box validation

## Tech Stack

### Frontend
- React
- React-Leaflet
- Vite

### Backend
- ASP.NET Core Web API
- C#
- RESTful API design

## Backend API Endpoints

- `GET /api/Locations`
  - Query parameters:
    - `operator`
    - `minPowerKw`
    - `includeUnknown`
    - `limit`
- `GET /api/Locations/operators`
- `GET /api/Locations/powers`

## Design Decisions

- Stations with unknown charging power are excluded by default when filtering by minimum power.
- Users can explicitly include stations with unknown power to avoid losing potentially relevant results.
- Operator-based color coding improves map readability and usability.
- Automatic map zooming improves user experience when applying filters.

## Screenshots

![EV Charging Stations Map – overview](screenshots/map-overview.png)
![Filtered by operator and power](screenshots/map-filtered.png)
![Filtered by operator and unknown power](screenshots/map-filtered2.png)


## Future Improvements

- Marker clustering for large datasets
- Search by city or bounding box
- Performance optimizations for larger result sets
