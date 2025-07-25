import React from 'react';
import { Card, Row, Col, Statistic, Tag } from 'antd';
import { EnvironmentOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  background: #e3f4fd;
  border-radius: 8px;
  overflow: hidden;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect fill="%23e3f4fd" width="800" height="600"/><path fill="%23f0f9ff" stroke="%231e40af" stroke-width="2" d="M200,100 L400,80 L550,90 L650,120 L700,180 L720,250 L700,350 L650,420 L550,480 L400,500 L250,480 L150,420 L100,350 L80,250 L100,180 L150,120 Z"/></svg>');
  background-size: cover;
  background-position: center;
`;

const ProvinceMarker = styled.div<{ size: number; color: string; top: string; left: string }>`
  position: absolute;
  top: ${props => props.top};
  left: ${props => props.left};
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  border-radius: 50%;
  border: 3px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 1;
  
  &:hover {
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
`;

const ProvinceLabel = styled.div`
  position: absolute;
  background: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
`;

const StatsPanel = styled(Card)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const LegendCard = styled(Card)`
  position: absolute;
  bottom: 16px;
  left: 16px;
  padding: 8px;
`;

interface ProvinceData {
  id: string;
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
  { id: '1', name: 'Phnom Penh', nameKh: 'ភ្នំពេញ', top: '55%', left: '52%', mentors: 45, schools: 120, observations: 567, color: '#ff4444', size: 50 },
  { id: '2', name: 'Kandal', nameKh: 'កណ្តាល', top: '58%', left: '55%', mentors: 38, schools: 89, observations: 423, color: '#ff6644', size: 45 },
  { id: '3', name: 'Kampong Cham', nameKh: 'កំពង់ចាម', top: '48%', left: '65%', mentors: 32, schools: 76, observations: 356, color: '#ff8844', size: 42 },
  { id: '4', name: 'Siem Reap', nameKh: 'សៀមរាប', top: '25%', left: '40%', mentors: 28, schools: 65, observations: 298, color: '#ffaa44', size: 38 },
  { id: '5', name: 'Battambang', nameKh: 'បាត់ដំបង', top: '28%', left: '30%', mentors: 22, schools: 54, observations: 234, color: '#ffc107', size: 35 },
  { id: '6', name: 'Kampong Speu', nameKh: 'កំពង់ស្ពឺ', top: '60%', left: '45%', mentors: 18, schools: 43, observations: 189, color: '#ffdd44', size: 32 },
  { id: '7', name: 'Takeo', nameKh: 'តាកែវ', top: '70%', left: '50%', mentors: 15, schools: 38, observations: 156, color: '#8bc34a', size: 30 },
  { id: '8', name: 'Prey Veng', nameKh: 'ព្រៃវែង', top: '55%', left: '68%', mentors: 12, schools: 32, observations: 134, color: '#4caf50', size: 28 },
  { id: '9', name: 'Kampot', nameKh: 'កំពត', top: '75%', left: '42%', mentors: 10, schools: 28, observations: 112, color: '#00bcd4', size: 26 },
  { id: '10', name: 'Banteay Meanchey', nameKh: 'បន្ទាយមានជ័យ', top: '18%', left: '32%', mentors: 14, schools: 35, observations: 145, color: '#2196f3', size: 28 },
];

const StaticCambodiaMap: React.FC = () => {
  const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(null);

  const totalMentors = provincesData.reduce((sum, p) => sum + p.mentors, 0);
  const totalSchools = provincesData.reduce((sum, p) => sum + p.schools, 0);
  const totalObservations = provincesData.reduce((sum, p) => sum + p.observations, 0);

  return (
    <MapWrapper>
      {/* Province markers */}
      {provincesData.map(province => (
        <React.Fragment key={province.id}>
          <ProvinceMarker
            size={province.size}
            color={province.color}
            top={province.top}
            left={province.left}
            onMouseEnter={() => setHoveredProvince(province.id)}
            onMouseLeave={() => setHoveredProvince(null)}
          >
            {province.mentors}
          </ProvinceMarker>
          
          {/* Province name label */}
          <ProvinceLabel
            style={{
              top: `calc(${province.top} - 25px)`,
              left: province.left,
              transform: 'translateX(-50%)',
              opacity: hoveredProvince === province.id ? 1 : 0.8,
              fontWeight: hoveredProvince === province.id ? 600 : 400,
            }}
          >
            {province.nameKh}
          </ProvinceLabel>
          
          {/* Hover tooltip */}
          {hoveredProvince === province.id && (
            <div
              style={{
                position: 'absolute',
                top: `calc(${province.top} + ${province.size / 2 + 10}px)`,
                left: province.left,
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 20,
              }}
            >
              <div>អ្នកណែនាំ: {province.mentors} នាក់</div>
              <div>សាលារៀន: {province.schools}</div>
              <div>ការសង្កេត: {province.observations}</div>
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Stats panel */}
      <StatsPanel size="small" styles={{ body: { padding: '12px' } }}>
        <Row gutter={[8, 12]}>
          <Col span={24}>
            <Statistic
              title={<><TeamOutlined /> អ្នកណែនាំសរុប</>}
              value={totalMentors}
              suffix="នាក់"
              valueStyle={{ fontSize: 18 }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={<><EnvironmentOutlined /> សាលារៀនសរុប</>}
              value={totalSchools}
              valueStyle={{ fontSize: 18, color: '#1890ff' }}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={<><EyeOutlined /> ការសង្កេតសរុប</>}
              value={totalObservations}
              valueStyle={{ fontSize: 18, color: '#52c41a' }}
            />
          </Col>
        </Row>
      </StatsPanel>

      {/* Legend */}
      <LegendCard size="small" styles={{ body: { padding: '8px 12px' } }}>
        <div style={{ fontSize: 12 }}>
          <strong>កម្រិតសកម្មភាព</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Tag color="#ff4444">ខ្ពស់</Tag>
            <Tag color="#ffc107">មធ្យម</Tag>
            <Tag color="#4caf50">ទាប</Tag>
          </div>
        </div>
      </LegendCard>
    </MapWrapper>
  );
};

export default StaticCambodiaMap;