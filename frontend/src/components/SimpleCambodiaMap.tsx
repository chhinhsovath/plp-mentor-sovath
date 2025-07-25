import React from 'react';
import { Card, Row, Col, Statistic, Tag, Tooltip } from 'antd';
import { EnvironmentOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #f0f8ff 0%, #e1f5fe 100%);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
`;

const ProvinceMarker = styled.div<{ size: number; color: string; top: string; left: string }>`
  position: absolute;
  top: ${props => props.top};
  left: ${props => props.left};
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  border-radius: 50%;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1;
  
  &:hover {
    transform: scale(1.2);
    z-index: 10;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
`;

const ProvinceLabel = styled.div`
  position: absolute;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, 10px);
  pointer-events: none;
`;

const MapSvg = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.2;
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
  name: string;
  nameKh: string;
  top: string;
  left: string;
  mentors: number;
  schools: number;
  observations: number;
  color: string;
  size: number;
}

const provincesData: ProvinceData[] = [
  { name: 'Phnom Penh', nameKh: 'ភ្នំពេញ', top: '65%', left: '55%', mentors: 45, schools: 120, observations: 567, color: '#ff4444', size: 60 },
  { name: 'Kandal', nameKh: 'កណ្តាល', top: '68%', left: '58%', mentors: 38, schools: 89, observations: 423, color: '#ff6644', size: 50 },
  { name: 'Kampong Cham', nameKh: 'កំពង់ចាម', top: '55%', left: '68%', mentors: 32, schools: 76, observations: 356, color: '#ff8844', size: 45 },
  { name: 'Siem Reap', nameKh: 'សៀមរាប', top: '25%', left: '40%', mentors: 28, schools: 65, observations: 298, color: '#ffaa44', size: 40 },
  { name: 'Battambang', nameKh: 'បាត់ដំបង', top: '30%', left: '30%', mentors: 22, schools: 54, observations: 234, color: '#ffc107', size: 35 },
  { name: 'Kampong Speu', nameKh: 'កំពង់ស្ពឺ', top: '70%', left: '45%', mentors: 18, schools: 43, observations: 189, color: '#ffdd44', size: 30 },
  { name: 'Takeo', nameKh: 'តាកែវ', top: '80%', left: '52%', mentors: 15, schools: 38, observations: 156, color: '#8bc34a', size: 28 },
  { name: 'Prey Veng', nameKh: 'ព្រៃវែង', top: '65%', left: '70%', mentors: 12, schools: 32, observations: 134, color: '#4caf50', size: 25 },
  { name: 'Kampot', nameKh: 'កំពត', top: '85%', left: '40%', mentors: 10, schools: 28, observations: 112, color: '#00bcd4', size: 23 },
  { name: 'Banteay Meanchey', nameKh: 'បន្ទាយមានជ័យ', top: '15%', left: '25%', mentors: 14, schools: 35, observations: 145, color: '#2196f3', size: 26 },
];

const SimpleCambodiaMap: React.FC = () => {
  const [hoveredProvince, setHoveredProvince] = React.useState<ProvinceData | null>(null);

  const totalMentors = provincesData.reduce((acc, p) => acc + p.mentors, 0);
  const totalSchools = provincesData.reduce((acc, p) => acc + p.schools, 0);
  const totalObservations = provincesData.reduce((acc, p) => acc + p.observations, 0);

  return (
    <MapWrapper>
      {/* Cambodia outline - simplified shape */}
      <MapSvg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
        <path
          d="M 100,30 
             L 150,20 
             L 200,25 
             L 250,35 
             L 280,50 
             L 300,80 
             L 320,100 
             L 330,130 
             L 325,160 
             L 310,180 
             L 290,200 
             L 270,220 
             L 250,230 
             L 220,235 
             L 190,240 
             L 160,235 
             L 130,225 
             L 100,210 
             L 80,190 
             L 60,170 
             L 50,150 
             L 45,120 
             L 50,90 
             L 65,60 
             L 85,40 
             Z"
          fill="#e8f4f8"
          stroke="#1890ff"
          strokeWidth="2"
          opacity="0.8"
        />
        {/* Add some internal borders to show provinces */}
        <g stroke="#1890ff" strokeWidth="1" fill="none" opacity="0.3">
          <line x1="150" y1="50" x2="180" y2="180" />
          <line x1="200" y1="40" x2="220" y2="200" />
          <line x1="250" y1="60" x2="240" y2="180" />
          <line x1="100" y1="100" x2="280" y2="120" />
          <line x1="120" y1="150" x2="300" y2="160" />
        </g>
      </MapSvg>

      {/* Province markers */}
      {provincesData.map((province, idx) => (
        <Tooltip
          key={idx}
          title={
            <div>
              <strong>{province.nameKh}</strong>
              <br />អ្នកណែនាំ: {province.mentors} នាក់
              <br />សាលារៀន: {province.schools}
              <br />ការសង្កេត: {province.observations}
            </div>
          }
        >
          <ProvinceMarker
            size={province.size}
            color={province.color}
            top={province.top}
            left={province.left}
            onMouseEnter={() => setHoveredProvince(province)}
            onMouseLeave={() => setHoveredProvince(null)}
          >
            {province.mentors}
          </ProvinceMarker>
        </Tooltip>
      ))}

      {/* Hover label */}
      {hoveredProvince && (
        <ProvinceLabel
          style={{
            top: hoveredProvince.top,
            left: hoveredProvince.left,
            transform: `translate(-50%, ${hoveredProvince.size/2 + 15}px)`
          }}
        >
          {hoveredProvince.nameKh}
        </ProvinceLabel>
      )}

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

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: 8,
        borderRadius: 4,
        fontSize: 12
      }}>
        <div style={{ marginBottom: 4 }}><strong>កម្រិតសកម្មភាព</strong></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag color="#ff4444">ខ្ពស់</Tag>
          <Tag color="#ffc107">មធ្យម</Tag>
          <Tag color="#4caf50">ទាប</Tag>
        </div>
      </div>
    </MapWrapper>
  );
};

export default SimpleCambodiaMap;