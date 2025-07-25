import React, { useState } from 'react';
import { Tooltip, Card, Row, Col, Statistic } from 'antd';
import { EnvironmentOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
`;

const SvgMap = styled.svg`
  width: 100%;
  height: 100%;
`;

const Province = styled.path<{ isHovered: boolean }>`
  fill: ${props => props.isHovered ? '#1890ff' : '#e6f7ff'};
  stroke: #1890ff;
  stroke-width: 1.5;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    fill: #1890ff;
    stroke-width: 2;
  }
`;

const ProvinceCircle = styled.circle<{ activity: 'high' | 'medium' | 'low' }>`
  fill: ${props => 
    props.activity === 'high' ? '#ff4d4f' : 
    props.activity === 'medium' ? '#faad14' : 
    '#52c41a'
  };
  stroke: white;
  stroke-width: 2;
  cursor: pointer;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

const ProvinceText = styled.text`
  font-size: 11px;
  fill: #333;
  pointer-events: none;
  text-anchor: middle;
  font-weight: 500;
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
`;

interface ProvinceData {
  id: string;
  nameKh: string;
  nameEn: string;
  path: string;
  cx: number;
  cy: number;
  mentors: number;
  schools: number;
  observations: number;
  activity: 'high' | 'medium' | 'low';
}

// Simplified province paths and data
const provincesData: ProvinceData[] = [
  {
    id: 'phnom-penh',
    nameKh: 'ភ្នំពេញ',
    nameEn: 'Phnom Penh',
    path: 'M 245,235 L 255,230 L 265,235 L 265,245 L 255,250 L 245,245 Z',
    cx: 255,
    cy: 240,
    mentors: 45,
    schools: 120,
    observations: 567,
    activity: 'high'
  },
  {
    id: 'kandal',
    nameKh: 'កណ្តាល',
    nameEn: 'Kandal',
    path: 'M 230,220 L 280,215 L 285,255 L 280,265 L 230,270 L 225,260 L 220,230 Z',
    cx: 250,
    cy: 242,
    mentors: 38,
    schools: 89,
    observations: 423,
    activity: 'high'
  },
  {
    id: 'kampong-cham',
    nameKh: 'កំពង់ចាម',
    nameEn: 'Kampong Cham',
    path: 'M 280,180 L 340,175 L 345,220 L 340,230 L 285,235 L 280,225 L 275,190 Z',
    cx: 310,
    cy: 205,
    mentors: 32,
    schools: 76,
    observations: 356,
    activity: 'high'
  },
  {
    id: 'siem-reap',
    nameKh: 'សៀមរាប',
    nameEn: 'Siem Reap',
    path: 'M 180,80 L 240,75 L 245,120 L 240,130 L 185,135 L 180,125 L 175,90 Z',
    cx: 210,
    cy: 105,
    mentors: 28,
    schools: 65,
    observations: 298,
    activity: 'medium'
  },
  {
    id: 'battambang',
    nameKh: 'បាត់ដំបង',
    nameEn: 'Battambang',
    path: 'M 100,90 L 160,85 L 165,130 L 160,140 L 105,145 L 100,135 L 95,100 Z',
    cx: 130,
    cy: 115,
    mentors: 22,
    schools: 54,
    observations: 234,
    activity: 'medium'
  },
  {
    id: 'kampong-speu',
    nameKh: 'កំពង់ស្ពឺ',
    nameEn: 'Kampong Speu',
    path: 'M 190,240 L 230,235 L 235,270 L 230,280 L 195,285 L 190,275 L 185,250 Z',
    cx: 210,
    cy: 260,
    mentors: 18,
    schools: 43,
    observations: 189,
    activity: 'medium'
  },
  {
    id: 'takeo',
    nameKh: 'តាកែវ',
    nameEn: 'Takeo',
    path: 'M 220,280 L 260,275 L 265,310 L 260,320 L 225,325 L 220,315 L 215,290 Z',
    cx: 240,
    cy: 300,
    mentors: 15,
    schools: 38,
    observations: 156,
    activity: 'low'
  },
  {
    id: 'prey-veng',
    nameKh: 'ព្រៃវែង',
    nameEn: 'Prey Veng',
    path: 'M 290,230 L 340,225 L 345,260 L 340,270 L 295,275 L 290,265 L 285,240 Z',
    cx: 315,
    cy: 250,
    mentors: 12,
    schools: 32,
    observations: 134,
    activity: 'low'
  },
  {
    id: 'kampot',
    nameKh: 'កំពត',
    nameEn: 'Kampot',
    path: 'M 180,300 L 220,295 L 225,330 L 220,340 L 185,345 L 180,335 L 175,310 Z',
    cx: 200,
    cy: 320,
    mentors: 10,
    schools: 28,
    observations: 112,
    activity: 'low'
  },
  {
    id: 'banteay-meanchey',
    nameKh: 'បន្ទាយមានជ័យ',
    nameEn: 'Banteay Meanchey',
    path: 'M 120,40 L 180,35 L 185,80 L 180,90 L 125,95 L 120,85 L 115,50 Z',
    cx: 150,
    cy: 65,
    mentors: 14,
    schools: 35,
    observations: 145,
    activity: 'medium'
  }
];

const CambodiaProvinceMap: React.FC = () => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);

  const totalMentors = provincesData.reduce((acc, p) => acc + p.mentors, 0);
  const totalSchools = provincesData.reduce((acc, p) => acc + p.schools, 0);
  const totalObservations = provincesData.reduce((acc, p) => acc + p.observations, 0);

  const getRadius = (observations: number) => {
    return Math.max(15, Math.min(30, observations / 20));
  };

  return (
    <MapContainer>
      <SvgMap viewBox="0 0 450 400">
        {/* Cambodia border outline */}
        <path
          d="M 80,30 L 350,25 L 380,50 L 390,100 L 385,150 L 380,200 L 375,250 L 370,300 L 350,340 L 300,360 L 250,365 L 200,360 L 150,350 L 100,330 L 70,300 L 50,250 L 45,200 L 50,150 L 55,100 L 70,50 Z"
          fill="#f0f9ff"
          stroke="#0369a1"
          strokeWidth="2"
        />
        
        {/* Province paths */}
        {provincesData.map(province => (
          <g key={province.id}>
            <Tooltip
              title={
                <div>
                  <strong>{province.nameKh}</strong>
                  <br />អ្នកណែនាំ: {province.mentors} នាក់
                  <br />សាលារៀន: {province.schools}
                  <br />ការសង្កេត: {province.observations}
                </div>
              }
            >
              <Province
                d={province.path}
                isHovered={hoveredProvince === province.id}
                onMouseEnter={() => setHoveredProvince(province.id)}
                onMouseLeave={() => setHoveredProvince(null)}
                onClick={() => setSelectedProvince(province)}
              />
            </Tooltip>
          </g>
        ))}
        
        {/* Activity circles and labels */}
        {provincesData.map(province => (
          <g key={`${province.id}-marker`}>
            <Tooltip
              title={
                <div>
                  <strong>{province.nameKh}</strong>
                  <br />អ្នកណែនាំ: {province.mentors} នាក់
                  <br />សាលារៀន: {province.schools}
                  <br />ការសង្កេត: {province.observations}
                </div>
              }
            >
              <ProvinceCircle
                cx={province.cx}
                cy={province.cy}
                r={getRadius(province.observations)}
                activity={province.activity}
              />
            </Tooltip>
            <ProvinceText x={province.cx} y={province.cy + 5}>
              {province.mentors}
            </ProvinceText>
            <ProvinceText x={province.cx} y={province.cy - 25} style={{ fontSize: '10px', fill: '#666' }}>
              {province.nameKh}
            </ProvinceText>
          </g>
        ))}
      </SvgMap>

      {/* Stats panel */}
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

      {/* Selected province details */}
      {selectedProvince && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: 16,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          maxWidth: 300
        }}>
          <h4 style={{ margin: '0 0 8px 0' }}>{selectedProvince.nameKh}</h4>
          <p style={{ margin: '4px 0' }}>អ្នកណែនាំ: {selectedProvince.mentors} នាក់</p>
          <p style={{ margin: '4px 0' }}>សាលារៀន: {selectedProvince.schools}</p>
          <p style={{ margin: '4px 0' }}>ការសង្កេត: {selectedProvince.observations}</p>
        </div>
      )}
    </MapContainer>
  );
};

export default CambodiaProvinceMap;