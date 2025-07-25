import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import {
  Input,
  Button,
  Card,
  List,
  Spin,
  Typography,
  Space,
} from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  height?: number | string;
}

interface SearchResult {
  label: string;
  x: number;
  y: number;
  bounds: [[number, number], [number, number]];
}

const LocationMarker: React.FC<{
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : <Marker position={position} />;
};

const FitBounds: React.FC<{ bounds?: [[number, number], [number, number]] }> = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  
  return null;
};

const { Text } = Typography;

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  height = 400,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedBounds, setSelectedBounds] = useState<[[number, number], [number, number]] | undefined>();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const provider = useRef(new OpenStreetMapProvider());

  // Default center (Cambodia)
  const defaultCenter: [number, number] = [12.5657, 104.9910];
  const center = position || defaultCenter;

  useEffect(() => {
    if (latitude && longitude && (!position || position[0] !== latitude || position[1] !== longitude)) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await provider.current.search({ query: searchQuery });
      setSearchResults(results as SearchResult[]);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for auto-search
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = result.y;
    const lng = result.x;
    setPosition([lat, lng]);
    onLocationChange(lat, lng, result.label);
    setSearchQuery(result.label);
    setShowResults(false);
    setSelectedBounds(result.bounds);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition([lat, lng]);
          onLocationChange(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Card size="small" style={{ marginBottom: 8 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onPressEnter={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            style={{ flex: 1 }}
          />
          <Button 
            icon={isSearching ? <Spin size="small" /> : <SearchOutlined />} 
            onClick={handleSearch} 
            disabled={isSearching}
          />
          <Button 
            icon={<EnvironmentOutlined />} 
            onClick={handleGetCurrentLocation} 
            title="Use current location"
          />
        </Space.Compact>
      </Card>

      {showResults && searchResults.length > 0 && (
        <Card
          size="small"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <List
            size="small"
            dataSource={searchResults}
            renderItem={(result, index) => (
              <List.Item
                key={index}
                style={{ cursor: 'pointer', padding: '8px 12px' }}
                onClick={() => handleSelectResult(result)}
              >
                {result.label}
              </List.Item>
            )}
          />
        </Card>
      )}

      <div style={{ height, position: 'relative', border: '1px solid #d9d9d9', borderRadius: 2 }}>
        <MapContainer
          center={center}
          zoom={position ? 15 : 6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
          {selectedBounds && <FitBounds bounds={selectedBounds} />}
        </MapContainer>
      </div>

      {position && (
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </Text>
          <Button
            size="small"
            onClick={() => {
              setPosition(null);
              onLocationChange(0, 0, '');
              setSearchQuery('');
            }}
          >
            Clear Location
          </Button>
        </div>
      )}
    </div>
  );
};