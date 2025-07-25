import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Override Leaflet default icon paths
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ProvinceData {
  name: string;
  nameKh: string;
  lat: number;
  lng: number;
  mentors: number;
  schools: number;
  observations: number;
  color: string;
}

// Cambodia provinces with coordinates and sample data
const provincesData: ProvinceData[] = [
  { name: 'Phnom Penh', nameKh: 'ភ្នំពេញ', lat: 11.5564, lng: 104.9282, mentors: 45, schools: 120, observations: 567, color: '#ff4444' },
  { name: 'Kandal', nameKh: 'កណ្តាល', lat: 11.4894, lng: 104.9422, mentors: 38, schools: 89, observations: 423, color: '#ff6644' },
  { name: 'Kampong Cham', nameKh: 'កំពង់ចាម', lat: 11.9935, lng: 105.4635, mentors: 32, schools: 76, observations: 356, color: '#ff8844' },
  { name: 'Siem Reap', nameKh: 'សៀមរាប', lat: 13.3633, lng: 103.8564, mentors: 28, schools: 65, observations: 298, color: '#ffaa44' },
  { name: 'Battambang', nameKh: 'បាត់ដំបង', lat: 13.0957, lng: 103.2022, mentors: 22, schools: 54, observations: 234, color: '#ffcc44' },
  { name: 'Kampong Speu', nameKh: 'កំពង់ស្ពឺ', lat: 11.4585, lng: 104.5209, mentors: 18, schools: 43, observations: 189, color: '#ffdd44' },
  { name: 'Takeo', nameKh: 'តាកែវ', lat: 10.9326, lng: 104.7985, mentors: 15, schools: 38, observations: 156, color: '#ffee44' },
  { name: 'Prey Veng', nameKh: 'ព្រៃវែង', lat: 11.4851, lng: 105.3249, mentors: 12, schools: 32, observations: 134, color: '#eeff44' },
  { name: 'Kampot', nameKh: 'កំពត', lat: 10.5947, lng: 104.1640, mentors: 10, schools: 28, observations: 112, color: '#ddff44' },
  { name: 'Svay Rieng', nameKh: 'ស្វាយរៀង', lat: 11.0870, lng: 105.7993, mentors: 8, schools: 24, observations: 98, color: '#ccff44' },
];

// Component to fit map bounds
function FitBounds() {
  const map = useMap();
  
  useEffect(() => {
    const bounds = L.latLngBounds(
      [9.5, 102.3], // Southwest
      [14.7, 107.6]  // Northeast
    );
    map.fitBounds(bounds);
  }, [map]);
  
  return null;
}

const CambodiaMap: React.FC = () => {
  // Calculate radius based on number of observations
  const getRadius = (observations: number) => {
    return Math.sqrt(observations) * 2000; // Scale factor for visibility
  };

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
      <MapContainer
        center={[12.5657, 104.991]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds />
        
        {provincesData.map((province, idx) => (
          <CircleMarker
            key={idx}
            center={[province.lat, province.lng]}
            radius={getRadius(province.observations)}
            fillColor={province.color}
            color="#fff"
            weight={2}
            opacity={0.9}
            fillOpacity={0.6}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui', lineHeight: 1.6 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{province.nameKh}</h3>
                <p style={{ margin: '4px 0' }}><strong>អ្នកណែនាំ:</strong> {province.mentors} នាក់</p>
                <p style={{ margin: '4px 0' }}><strong>សាលារៀន:</strong> {province.schools}</p>
                <p style={{ margin: '4px 0' }}><strong>ការសង្កេត:</strong> {province.observations}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CambodiaMap;