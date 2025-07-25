import React from 'react';
import { Card, Row, Col, Typography, Progress, Statistic, Timeline, Badge, Divider, Space, Tag } from 'antd';
import { 
  TeamOutlined, 
  BookOutlined, 
  RiseOutlined, 
  TrophyOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;

const ResultsChainWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const ChainCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  .ant-card-head {
    background: ${props => props.color || '#1890ff'};
    color: white;
    
    .ant-card-head-title {
      color: white;
      font-size: 20px;
    }
  }
`;

const MetricCard = styled(Card)`
  text-align: center;
  height: 100%;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;


const ResultsChain: React.FC = () => {
  return (
    <ResultsChainWrapper>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        ប្រព័ន្ធគ្រប់គ្រងអ្នកណែនាំ PLP - ខ្សែសង្វាក់លទ្ធផល (Results Chain)
      </Title>
      
      <Paragraph style={{ textAlign: 'center', fontSize: 18, marginBottom: 40 }}>
        បង្ហាញពីរបៀបដែលប្រព័ន្ធរបស់យើងរួមចំណែកដល់ការអភិវឌ្ឍន៍គុណភាពអប់រំតាមរយៈខ្សែសង្វាក់លទ្ធផល
      </Paragraph>

      {/* Input Level */}
      <ChainCard 
        title="ធាតុចូល (Inputs)" 
        color="#722ed1"
        extra={<TeamOutlined style={{ fontSize: 24 }} />}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <MetricCard>
              <Statistic 
                title="អ្នកណែនាំដែលបានចុះឈ្មោះ" 
                value={156} 
                prefix={<TeamOutlined />}
                suffix="នាក់"
              />
              <Progress percent={89} strokeColor="#722ed1" />
              <Text type="secondary">សម្រេចបាន 89% នៃគោលដៅ</Text>
            </MetricCard>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard>
              <Statistic 
                title="សាលារៀនដែលចូលរួម" 
                value={45} 
                prefix={<BookOutlined />}
                suffix="សាលា"
              />
              <Progress percent={75} strokeColor="#722ed1" />
              <Text type="secondary">គ្របដណ្តប់ 75% នៃតំបន់គោលដៅ</Text>
            </MetricCard>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard>
              <Statistic 
                title="ទម្រង់សង្កេតការណ៍" 
                value={12} 
                prefix={<FileTextOutlined />}
                suffix="ប្រភេទ"
              />
              <Tag color="success">សកម្ម</Tag>
            </MetricCard>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <MetricCard>
              <Statistic 
                title="បេសកកម្មដែលបានកំណត់" 
                value={234} 
                prefix={<SolutionOutlined />}
              />
              <Tag color="processing">កំពុងដំណើរការ</Tag>
            </MetricCard>
          </Col>
        </Row>
      </ChainCard>

      {/* Activities Level */}
      <ChainCard 
        title="សកម្មភាព (Activities)" 
        color="#13c2c2"
        extra={<SolutionOutlined style={{ fontSize: 24 }} />}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="ការសង្កេតថ្នាក់រៀន" variant="borderless">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>សរុបការសង្កេត:</Text> <Badge count={1,245} showZero color="#13c2c2" />
                </div>
                <div>
                  <Text strong>មធ្យមភាគក្នុងមួយសប្តាហ៍:</Text> <Text>48 ការសង្កេត</Text>
                </div>
                <Progress 
                  percent={92} 
                  success={{ percent: 85 }}
                  format={() => '92% បានបញ្ចប់'}
                />
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="បេសកកម្មដែលបានបំពេញ" variant="borderless">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>បេសកកម្មសរុប:</Text> <Badge count={189} showZero color="#52c41a" />
                </div>
                <div>
                  <Text strong>អត្រាបំពេញ:</Text> <Text>81%</Text>
                </div>
                <Progress 
                  percent={81} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </ChainCard>

      {/* Output Level */}
      <ChainCard 
        title="លទ្ធផលផ្ទាល់ (Outputs)" 
        color="#fa8c16"
        extra={<BarChartOutlined style={{ fontSize: 24 }} />}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="គ្រូដែលទទួលបានការណែនាំ"
                value={523}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
                suffix="នាក់"
              />
              <Divider />
              <Text>ពីចំនួនគ្រូសរុប 650 នាក់</Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="ផែនការកែលម្អដែលបានបង្កើត"
                value={412}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<FileTextOutlined />}
              />
              <Divider />
              <Text>សម្រាប់គ្រូដែលត្រូវការជំនួយ</Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="សិក្ខាសាលាដែលបានរៀបចំ"
                value={28}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TeamOutlined />}
              />
              <Divider />
              <Text>គ្របដណ្តប់គ្រូ 85%</Text>
            </Card>
          </Col>
        </Row>
      </ChainCard>

      {/* Outcome Level */}
      <ChainCard 
        title="លទ្ធផលរយៈពេលខ្លី (Outcomes)" 
        color="#52c41a"
        extra={<RiseOutlined style={{ fontSize: 24 }} />}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="ការកែលម្អគុណភាពបង្រៀន">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Progress 
                  percent={73} 
                  success={{ percent: 60 }}
                  format={percent => (
                    <span>
                      <div>បច្ចុប្បន្ន: {percent}%</div>
                      <div style={{ fontSize: 12 }}>គោលដៅ: 85%</div>
                    </span>
                  )}
                  size="default"
                />
                <Text>គ្រូ 73% បានកែលម្អវិធីសាស្ត្របង្រៀន</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="ការចូលរួមរបស់សិស្ស">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Progress 
                  type="circle" 
                  percent={68} 
                  strokeColor="#52c41a"
                  format={percent => (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>{percent}%</div>
                      <div style={{ fontSize: 12 }}>កើនឡើង</div>
                    </div>
                  )}
                />
                <Text>ការចូលរួមសកម្មរបស់សិស្សកើនឡើង 68%</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </ChainCard>

      {/* Impact Level */}
      <ChainCard 
        title="ផលប៉ះពាល់រយៈពេលវែង (Impact)" 
        color="#f5222d"
        extra={<TrophyOutlined style={{ fontSize: 24 }} />}
      >
        <Row gutter={[16, 24]}>
          <Col xs={24}>
            <Title level={4}>សូចនាករផលប៉ះពាល់សំខាន់ៗ</Title>
          </Col>
          <Col xs={24} md={8}>
            <MetricCard>
              <Statistic
                title="អត្រាអក្ខរកម្មសិស្ស"
                value={15}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
                prefix={<RiseOutlined />}
              />
              <Text type="success">កើនឡើងពីឆ្នាំមុន</Text>
              <Divider />
              <Progress 
                percent={82} 
                size="small" 
                format={() => 'ថ្នាក់ទី 1-3'}
              />
              <Progress 
                percent={75} 
                size="small" 
                format={() => 'ថ្នាក់ទី 4-6'}
              />
            </MetricCard>
          </Col>
          <Col xs={24} md={8}>
            <MetricCard>
              <Statistic
                title="អត្រាបោះបង់ការសិក្សា"
                value={8}
                suffix="%"
                valueStyle={{ color: '#f5222d' }}
                prefix={<RiseOutlined rotate={180} />}
              />
              <Text type="danger">ថយចុះពីឆ្នាំមុន</Text>
              <Divider />
              <Text>ពី 12% មក 8%</Text>
            </MetricCard>
          </Col>
          <Col xs={24} md={8}>
            <MetricCard>
              <Statistic
                title="ពិន្ទុមធ្យមភាគជាតិ"
                value={12}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
                prefix={<RiseOutlined />}
              />
              <Text type="secondary">កើនឡើងជាបន្តបន្ទាប់</Text>
              <Divider />
              <Text>លទ្ធផលប្រឡងថ្នាក់ទី 6</Text>
            </MetricCard>
          </Col>
        </Row>
        
        <Divider />
        
        <Row>
          <Col xs={24}>
            <Title level={4}>ដំណាក់កាលនៃការផ្លាស់ប្តូរ</Title>
            <Timeline
              items={[
                {
                  color: 'green',
                  dot: <CheckCircleOutlined />,
                  children: (
                    <>
                      <Text strong>ត្រីមាសទី 1:</Text> អ្នកណែនាំចាប់ផ្តើមសង្កេតការណ៍ជាប្រចាំ
                    </>
                  ),
                },
                {
                  color: 'green',
                  dot: <CheckCircleOutlined />,
                  children: (
                    <>
                      <Text strong>ត្រីមាសទី 2:</Text> គ្រូចាប់ផ្តើមអនុវត្តវិធីសាស្ត្រថ្មី
                    </>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>ត្រីមាសទី 3:</Text> សិស្សបង្ហាញការរីកចម្រើនក្នុងការអាន
                    </>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <>
                      <Text strong>ត្រីមាសទី 4:</Text> វាយតម្លៃផលប៉ះពាល់រយៈពេលវែង
                    </>
                  ),
                },
              ]}
            />
          </Col>
        </Row>
      </ChainCard>

      {/* Summary */}
      <Card>
        <Title level={3} style={{ textAlign: 'center' }}>
          សង្ខេបលទ្ធផលតាមខ្សែសង្វាក់
        </Title>
        <Paragraph style={{ fontSize: 16, textAlign: 'center' }}>
          ប្រព័ន្ធគ្រប់គ្រងអ្នកណែនាំ PLP បានបង្ហាញពីប្រសិទ្ធភាពក្នុងការតាមដានការអនុវត្តការងារអប់រំ
          និងរួមចំណែកដល់ការកែលម្អគុណភាពអប់រំតាមរយៈការប្រើប្រាស់ទិន្នន័យជាមូលដ្ឋាន
        </Paragraph>
      </Card>
    </ResultsChainWrapper>
  );
};

export default ResultsChain;