import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, Row, Col, Statistic } from 'antd';
import { EnvironmentOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// You can use this public token for demo purposes
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  
  .mapboxgl-popup {
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  .mapboxgl-popup-content {
    padding: 10px;
    border-radius: 8px;
    min-width: 200px;
  }
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

const RealCambodiaMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const totalMentors = provincesData.reduce((acc, p) => acc + p.mentors, 0);
  const totalSchools = provincesData.reduce((acc, p) => acc + p.schools, 0);
  const totalObservations = provincesData.reduce((acc, p) => acc + p.observations, 0);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Changed to streets style for more detail
      center: [104.991, 12.5657], // Cambodia center
      zoom: 7, // Increased zoom slightly
      pitch: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add markers for each province
      provincesData.forEach(province => {
        // Create a custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        
        const size = Math.max(30, Math.min(60, province.observations / 10));
        const color = province.activity === 'high' ? '#ff4d4f' : 
                     province.activity === 'medium' ? '#faad14' : '#52c41a';
        
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
          opacity: 0.9;
        `;
        
        el.innerHTML = province.mentors.toString();
        
        // Add hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
          el.style.zIndex = '10';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.zIndex = '1';
        });

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="font-family: system-ui">
              <h3 style="margin: 0 0 8px 0; font-size: 16px;">${province.nameKh}</h3>
              <p style="margin: 4px 0; font-size: 14px;"><strong>អ្នកណែនាំ:</strong> ${province.mentors} នាក់</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>សាលារៀន:</strong> ${province.schools}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>ការសង្កេត:</strong> ${province.observations}</p>
            </div>
          `);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat([province.lng, province.lat])
          .setPopup(popup)
          .addTo(map.current!);

        // Add province name label
        const label = document.createElement('div');
        label.style.cssText = `
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 600;
          color: #000;
          white-space: nowrap;
          text-shadow: 
            -1px -1px 0 white,
            1px -1px 0 white,
            -1px 1px 0 white,
            1px 1px 0 white,
            0 0 4px white;
          background: rgba(255, 255, 255, 0.7);
          padding: 2px 6px;
          border-radius: 4px;
        `;
        label.textContent = province.nameKh;
        el.appendChild(label);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <MapContainer>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
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

export default RealCambodiaMap;