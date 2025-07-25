import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { useTranslation } from 'react-i18next';
import {
  Input,
  Button,
  Card,
  List,
  Spin,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Tooltip,
  Modal,
  Tag,
  Divider,
  App,
} from 'antd';
import { 
  SearchOutlined, 
  EnvironmentOutlined, 
  AimOutlined, 
  GlobalOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
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
  placeholder?: string;
  disabled?: boolean;
  showCoordinates?: boolean;
  showSearchHistory?: boolean;
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

const { Text, Title } = Typography;

export const EnhancedLocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  height = 400,
  placeholder,
  disabled = false,
  showCoordinates = true,
  showSearchHistory = false,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedBounds, setSelectedBounds] = useState<[[number, number], [number, number]] | undefined>();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
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

  useEffect(() => {
    // Load search history from localStorage
    if (showSearchHistory) {
      const history = localStorage.getItem('locationSearchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    }
  }, [showSearchHistory]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
    setLocationAccuracy(null);
  };

  const saveSearchToHistory = (query: string) => {
    if (!showSearchHistory || !query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('locationSearchHistory', JSON.stringify(newHistory));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await provider.current.search({ query: searchQuery });
      setSearchResults(results as SearchResult[]);
      setShowResults(true);
      
      if (results.length > 0) {
        saveSearchToHistory(searchQuery);
        message.success(`រកឃើញទីតាំងចំនួន ${results.length} កន្លែង`);
      } else {
        message.warning('រកមិនឃើញទីតាំង សូមសាកល្បងពាក្យស្វែងរកផ្សេង');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      message.error('មានបញ្ហាក្នុងការស្វែងរក សូមសាកល្បងម្តងទៀត');
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
    if (value.trim() && value.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 800);
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
    message.success('បានជ្រើសរើសទីតាំងដោយជោគជ័យ');
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      Modal.error({
        title: 'មិនគាំទ្រ',
        content: 'កម្មវិធីរុករករបស់អ្នកមិនគាំទ្រសេវាកម្មទីតាំងទេ។',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
        setLocationAccuracy(accuracy);
        setSearchQuery('ទីតាំងបច្ចុប្បន្ន');
        setIsGettingLocation(false);
        
        message.success('បានទទួលទីតាំងបច្ចុប្បន្នដោយជោគជ័យ');
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        
        let errorMessage = 'សូមបើកសេវាកម្មទីតាំងនៅក្នុងកម្មវិធីរុករករបស់អ្នក។';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'បានបដិសេធការចូលដំណើរការទីតាំង។ សូមអនុញ្ញាតការចូលដំណើរការទីតាំង។';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'ព័ត៌មានទីតាំងមិនអាចរកបាន។';
            break;
          case error.TIMEOUT:
            errorMessage = 'ការស្នើសុំទីតាំងបានអស់ពេល។';
            break;
        }
        
        Modal.error({
          title: 'មិនអាចទទួលបានទីតាំង',
          content: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const handleClearLocation = () => {
    Modal.confirm({
      title: 'តើអ្នកចង់សម្អាតទីតាំងមែនទេ?',
      content: 'សកម្មភាពនេះនឹងលុបទីតាំងដែលបានជ្រើសរើស។',
      onOk: () => {
        setPosition(null);
        onLocationChange(0, 0, '');
        setSearchQuery('');
        setSelectedBounds(undefined);
        setLocationAccuracy(null);
        message.success('បានសម្អាតទីតាំងដោយជោគជ័យ');
      },
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <Card size="small" style={{ marginBottom: 8, position: 'relative' }}>
        <Row gutter={[8, 8]}>
          <Col flex={1}>
            <div style={{ position: 'relative' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={placeholder || 'ស្វែងរកទីតាំង...'}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  prefix={<GlobalOutlined />}
                  allowClear
                  disabled={disabled}
                />
                <Tooltip title="ស្វែងរក">
                  <Button 
                    icon={isSearching ? <Spin size="small" /> : <SearchOutlined />} 
                    onClick={handleSearch} 
                    disabled={isSearching || disabled}
                  />
                </Tooltip>
                <Tooltip title="ប្រើទីតាំងបច្ចុប្បន្ន">
                  <Button 
                    icon={isGettingLocation ? <Spin size="small" /> : <AimOutlined />} 
                    onClick={handleGetCurrentLocation}
                    type="primary"
                    disabled={isGettingLocation || disabled}
                  />
                </Tooltip>
                {position && (
                  <Tooltip title="សម្អាត">
                    <Button 
                      icon={<ClearOutlined />} 
                      onClick={handleClearLocation}
                      danger
                      disabled={disabled}
                    />
                  </Tooltip>
                )}
              </Space.Compact>
              
              {/* Search Results - Positioned below search box */}
              {showResults && searchResults.length > 0 && (
                <Card
                  size="small"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1050,
                    maxHeight: 200,
                    overflow: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginTop: 4,
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
                        <Space>
                          <EnvironmentOutlined />
                          <Text>{result.label}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </div>
          </Col>
        </Row>
        
        {/* Search History */}
        {showSearchHistory && searchHistory.length > 0 && !showResults && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ការស្វែងរកថ្មីៗ:
            </Text>
            <div style={{ marginTop: 4 }}>
              {searchHistory.map((item, index) => (
                <Tag
                  key={index}
                  style={{ cursor: 'pointer', marginBottom: 4 }}
                  onClick={() => {
                    setSearchQuery(item);
                    handleSearch();
                  }}
                >
                  {item}
                </Tag>
              ))}
            </div>
          </div>
        )}
        
        {/* Location Status */}
        {position && (
          <Alert
            message={
              <Space>
                <CheckCircleOutlined />
                ទីតាំងដែលបានជ្រើសរើស
                {locationAccuracy && (
                  <Tag color="blue">
                    ភាពត្រឹមត្រូវ: ±{Math.round(locationAccuracy)}m
                  </Tag>
                )}
              </Space>
            }
            description={
              showCoordinates && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  កូអរដោនេ: {Number(position[0]).toFixed(6)}, {Number(position[1]).toFixed(6)}
                </Text>
              )
            }
            type="success"
            showIcon={false}
            style={{ marginTop: 8 }}
          />
        )}
      </Card>

      {/* Map Instructions */}
      <Alert
        message="ចុចលើផែនទីដើម្បីជ្រើសរើសទីតាំង"
        type="info"
        showIcon
        style={{ marginBottom: 8 }}
        icon={<InfoCircleOutlined />}
      />
      
      {/* Map Container */}
      <div style={{ 
        height, 
        position: 'relative', 
        border: '1px solid #d9d9d9', 
        borderRadius: 6, 
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}>
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
        
        {/* Map overlay controls */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <Tooltip title="ព័ត៌មានផែនទី">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              style={{ backgroundColor: 'white', border: '1px solid #d9d9d9' }}
              onClick={() => {
                Modal.info({
                  title: 'របៀបប្រើប្រាស់ផែនទី',
                  content: (
                    <div>
                      <p>• ចុចលើផែនទីដើម្បីកំណត់ទីតាំង</p>
                      <p>• ស្វែងរកទីតាំងដោយបញ្ចូលឈ្មោះ</p>
                      <p>• ចុចប៊ូតុង GPS ដើម្បីប្រើទីតាំងបច្ចុប្បន្ន</p>
                    </div>
                  ),
                });
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLocationPicker;