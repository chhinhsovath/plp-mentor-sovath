import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, Row, Col, Statistic, Tag } from 'antd';
import { EnvironmentOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
`;

const StatsPanel = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1;
`;

const LegendPanel = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
`;

interface ProvinceData {
  name: string;
  nameKh: string;
  lat: number;
  lng: number;
  mentors: number;
  schools: number;
  observations: number;
  activity: 'high' | 'medium' | 'low';
}

const provincesData: ProvinceData[] = [
  { name: 'Phnom Penh', nameKh: 'ភ្នំពេញ', lat: 11.5564, lng: 104.9282, mentors: 45, schools: 120, observations: 567, activity: 'high' },
  { name: 'Kandal', nameKh: 'កណ្តាល', lat: 11.2068, lng: 105.0532, mentors: 38, schools: 89, observations: 423, activity: 'high' },
  { name: 'Kampong Cham', nameKh: 'កំពង់ចាម', lat: 11.9935, lng: 105.4635, mentors: 32, schools: 76, observations: 356, activity: 'high' },
  { name: 'Siem Reap', nameKh: 'សៀមរាប', lat: 13.3633, lng: 103.8564, mentors: 28, schools: 65, observations: 298, activity: 'medium' },
  { name: 'Battambang', nameKh: 'បាត់ដំបង', lat: 13.0957, lng: 103.2022, mentors: 22, schools: 54, observations: 234, activity: 'medium' },
  { name: 'Kampong Speu', nameKh: 'កំពង់ស្ពឺ', lat: 11.4585, lng: 104.5209, mentors: 18, schools: 43, observations: 189, activity: 'medium' },
  { name: 'Takeo', nameKh: 'តាកែវ', lat: 10.9326, lng: 104.7985, mentors: 15, schools: 38, observations: 156, activity: 'low' },
  { name: 'Prey Veng', nameKh: 'ព្រៃវែង', lat: 11.4851, lng: 105.3249, mentors: 12, schools: 32, observations: 134, activity: 'low' },
  { name: 'Kampot', nameKh: 'កំពត', lat: 10.5947, lng: 104.1640, mentors: 10, schools: 28, observations: 112, activity: 'low' },
  { name: 'Svay Rieng', nameKh: 'ស្វាយរៀង', lat: 11.0870, lng: 105.7993, mentors: 8, schools: 24, observations: 98, activity: 'low' },
  { name: 'Koh Kong', nameKh: 'កោះកុង', lat: 11.6153, lng: 103.5267, mentors: 6, schools: 20, observations: 78, activity: 'low' },
  { name: 'Pursat', nameKh: 'ពោធិ៍សាត់', lat: 12.5388, lng: 103.9192, mentors: 11, schools: 30, observations: 123, activity: 'medium' },
  { name: 'Kampong Thom', nameKh: 'កំពង់ធំ', lat: 12.7110, lng: 104.8887, mentors: 14, schools: 35, observations: 145, activity: 'medium' },
  { name: 'Kratie', nameKh: 'ក្រចេះ', lat: 12.4881, lng: 106.0188, mentors: 9, schools: 25, observations: 89, activity: 'low' },
  { name: 'Preah Vihear', nameKh: 'ព្រះវិហារ', lat: 13.8076, lng: 104.9802, mentors: 7, schools: 18, observations: 67, activity: 'low' },
  { name: 'Kampong Chhnang', nameKh: 'កំពង់ឆ្នាំង', lat: 12.2505, lng: 104.6655, mentors: 13, schools: 33, observations: 134, activity: 'medium' },
  { name: 'Pailin', nameKh: 'ប៉ៃលិន', lat: 12.8497, lng: 102.6089, mentors: 4, schools: 12, observations: 45, activity: 'low' },
  { name: 'Banteay Meanchey', nameKh: 'បន្ទាយមានជ័យ', lat: 13.7586, lng: 102.9896, mentors: 14, schools: 35, observations: 145, activity: 'medium' },
  { name: 'Ratanakiri', nameKh: 'រតនគិរី', lat: 13.7395, lng: 106.9868, mentors: 5, schools: 15, observations: 56, activity: 'low' },
  { name: 'Mondulkiri', nameKh: 'មណ្ឌលគិរី', lat: 12.4517, lng: 107.1883, mentors: 4, schools: 10, observations: 34, activity: 'low' },
  { name: 'Stung Treng', nameKh: 'ស្ទឹងត្រែង', lat: 13.5259, lng: 105.9683, mentors: 6, schools: 16, observations: 58, activity: 'low' },
  { name: 'Kep', nameKh: 'កែប', lat: 10.4831, lng: 104.2987, mentors: 3, schools: 8, observations: 29, activity: 'low' },
  { name: 'Oddar Meanchey', nameKh: 'ឧត្តរមានជ័យ', lat: 14.1810, lng: 103.5167, mentors: 8, schools: 22, observations: 78, activity: 'low' },
  { name: 'Preah Sihanouk', nameKh: 'ព្រះសីហនុ', lat: 10.6268, lng: 103.5022, mentors: 12, schools: 28, observations: 112, activity: 'medium' },
  { name: 'Tboung Khmum', nameKh: 'ត្បូងឃ្មុំ', lat: 11.8892, lng: 105.7768, mentors: 10, schools: 26, observations: 98, activity: 'low' }
];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 12.5657,
  lng: 104.991
};

const GoogleCambodiaMap: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const totalMentors = provincesData.reduce((acc, p) => acc + p.mentors, 0);
  const totalSchools = provincesData.reduce((acc, p) => acc + p.schools, 0);
  const totalObservations = provincesData.reduce((acc, p) => acc + p.observations, 0);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Set map options for better view of Cambodia
    map.setOptions({
      mapTypeId: 'terrain',
      styles: [
        {
          featureType: 'administrative.province',
          elementType: 'geometry.stroke',
          stylers: [{ weight: 2 }, { color: '#4285F4' }]
        }
      ]
    });
  }, []);

  const getMarkerSize = (observations: number) => {
    const baseSize = 30;
    const scale = Math.min(2, Math.max(1, observations / 200));
    return baseSize * scale;
  };

  const getMarkerIcon = (province: ProvinceData): google.maps.Symbol | null => {
    if (typeof google === 'undefined' || !google.maps) {
      return null;
    }
    
    const size = getMarkerSize(province.observations);
    const color = province.activity === 'high' ? '#ff4d4f' : 
                 province.activity === 'medium' ? '#faad14' : '#52c41a';
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: size / 2,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: 'white',
      strokeWeight: 3,
      labelOrigin: new google.maps.Point(0, 0)
    };
  };

  return (
    <MapContainer>
      <LoadScript googleMapsApiKey="AIzaSyDhfr75CTO3mVM9AYXvVGSC1BQmaMye8jo" language="km">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={7}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true
          }}
        >
          {provincesData.map((province, idx) => {
            const icon = getMarkerIcon(province);
            return (
              <Marker
                key={idx}
                position={{ lat: province.lat, lng: province.lng }}
                icon={icon || undefined}
                label={{
                  text: province.mentors.toString(),
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                title={province.nameKh}
                onClick={() => setSelectedProvince(province)}
              />
            );
          })}

          {selectedProvince && (
            <InfoWindow
              position={{ lat: selectedProvince.lat, lng: selectedProvince.lng }}
              onCloseClick={() => setSelectedProvince(null)}
            >
              <div style={{ fontFamily: 'system-ui', minWidth: 200 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{selectedProvince.nameKh}</h3>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <p style={{ margin: '4px 0' }}>
                    <TeamOutlined /> អ្នកណែនាំ: <strong>{selectedProvince.mentors} នាក់</strong>
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <EnvironmentOutlined /> សាលារៀន: <strong>{selectedProvince.schools}</strong>
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <EyeOutlined /> ការសង្កេត: <strong>{selectedProvince.observations}</strong>
                  </p>
                  <Tag color={
                    selectedProvince.activity === 'high' ? 'red' :
                    selectedProvince.activity === 'medium' ? 'gold' : 'green'
                  }>
                    កម្រិត{selectedProvince.activity === 'high' ? 'ខ្ពស់' :
                    selectedProvince.activity === 'medium' ? 'មធ្យម' : 'ទាប'}
                  </Tag>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      <StatsPanel>
        <Row gutter={[8, 16]}>
          <Col span={24}>
            <Statistic
              title={<><TeamOutlined /> អ្នកណែនាំសរុប</>}
              value={totalMentors}
              suffix="នាក់"
              valueStyle={{ fontSize: 20 }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={<><EnvironmentOutlined /> សាលារៀនសរុប</>}
              value={totalSchools}
              valueStyle={{ fontSize: 20, color: '#1890ff' }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={<><EyeOutlined /> ការសង្កេតសរុប</>}
              value={totalObservations}
              valueStyle={{ fontSize: 20, color: '#52c41a' }}
            />
          </Col>
        </Row>
      </StatsPanel>

      <LegendPanel>
        <div style={{ marginBottom: 8 }}><strong>កម្រិតសកម្មភាព</strong></div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff4d4f' }} />
            <span>ខ្ពស់</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#faad14' }} />
            <span>មធ្យម</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#52c41a' }} />
            <span>ទាប</span>
          </div>
        </div>
      </LegendPanel>
    </MapContainer>
  );
};

export default GoogleCambodiaMap;