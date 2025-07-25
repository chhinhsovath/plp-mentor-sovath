import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Slider,
  InputNumber,
  Space,
  Statistic,
  Button,
  Divider,
  Tag,
  Progress,
  Alert,
  Tooltip,
  Radio,
  Switch,
  Table,
  Tabs,
  Result
} from 'antd';
import {
  CalculatorOutlined,
  DollarOutlined,
  UserOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  ShareAltOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { Line, Column, Gauge, Area, Radar } from '@ant-design/plots';
import styled from 'styled-components';
import CountUp from 'react-countup';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Styled Components
const CalculatorWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const HeaderCard = styled(Card)`
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
  color: white;
  margin-bottom: 24px;
  
  .ant-card-body {
    padding: 32px;
  }
  
  h1, h2, h3, p {
    color: white !important;
  }
`;

const CalculatorCard = styled(Card)`
  height: 100%;
  
  .slider-section {
    margin-bottom: 32px;
  }
  
  .ant-slider-track {
    background: linear-gradient(90deg, #52c41a 0%, #1890ff 100%);
  }
`;

const ResultCard = styled(Card)`
  background: ${props => props.highlight ? 'linear-gradient(135deg, #f6ffed 0%, #e6f4ff 100%)' : '#ffffff'};
  border: ${props => props.highlight ? '2px solid #52c41a' : '1px solid #f0f0f0'};
  height: 100%;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  }
`;

const ComparisonCard = styled(Card)`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(24,144,255,0.05) 0%, transparent 70%);
  }
`;

const MetricBox = styled.div`
  padding: 16px;
  background: ${props => props.color || '#f0f2f5'};
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

// Constants for calculations
const COST_PER_TRADITIONAL_TRAINING = 150; // USD per teacher
const COST_PER_PLP_MENTOR = 25; // USD per teacher with PLP system
const AVERAGE_STUDENTS_PER_TEACHER = 35;
const LITERACY_IMPROVEMENT_RATE = 0.15; // 15% improvement
const LONG_TERM_ECONOMIC_MULTIPLIER = 12; // Each $1 invested returns $12 over 10 years

const ROICalculator: React.FC = () => {
  const [investment, setInvestment] = useState(100000);
  const [teacherCount, setTeacherCount] = useState(500);
  const [schoolCount, setSchoolCount] = useState(25);
  const [programDuration, setProgramDuration] = useState(12); // months
  const [comparisonMode, setComparisonMode] = useState('traditional');
  const [showProjection, setShowProjection] = useState(false);

  // Calculate derived values
  const studentsImpacted = teacherCount * AVERAGE_STUDENTS_PER_TEACHER;
  const costPerTeacherPLP = investment / teacherCount;
  const costPerStudent = investment / studentsImpacted;
  const savingsVsTraditional = (COST_PER_TRADITIONAL_TRAINING - costPerTeacherPLP) * teacherCount;
  const efficiencyRatio = (COST_PER_TRADITIONAL_TRAINING / costPerTeacherPLP * 100).toFixed(0);
  const projectedLiteracyGain = Math.round(studentsImpacted * LITERACY_IMPROVEMENT_RATE);
  const longTermEconomicImpact = investment * LONG_TERM_ECONOMIC_MULTIPLIER;

  // Chart data
  const monthlyImpactData = Array.from({ length: programDuration }, (_, i) => ({
    month: `ខែ ${i + 1}`,
    teachers: Math.round((teacherCount / programDuration) * (i + 1)),
    students: Math.round((studentsImpacted / programDuration) * (i + 1)),
    cost: Math.round((investment / programDuration) * (i + 1))
  }));

  const comparisonData = [
    {
      method: 'PLP Mentor System',
      costPerTeacher: costPerTeacherPLP,
      efficiency: 100,
      scalability: 95,
      sustainability: 90
    },
    {
      method: 'Traditional Training',
      costPerTeacher: COST_PER_TRADITIONAL_TRAINING,
      efficiency: 60,
      scalability: 40,
      sustainability: 50
    }
  ];

  const impactBreakdown = [
    { category: 'ការបណ្តុះបណ្តាលគ្រូ', value: 40 },
    { category: 'សម្ភារៈអប់រំ', value: 25 },
    { category: 'បច្ចេកវិទ្យា', value: 20 },
    { category: 'ការតាមដាន', value: 15 }
  ];

  // Chart configurations
  const lineConfig = {
    data: monthlyImpactData,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000
      }
    }
  };

  const gaugeConfig = {
    percent: efficiencyRatio / 100,
    range: {
      color: 'l(0) 0:#B8E1FF 1:#3D76E4'
    },
    startAngle: Math.PI,
    endAngle: 2 * Math.PI,
    indicator: null,
    statistic: {
      title: {
        offsetY: -36,
        style: {
          fontSize: '36px',
          color: '#4B535E'
        },
        formatter: () => `${efficiencyRatio}%`
      },
      content: {
        style: {
          fontSize: '24px',
          lineHeight: '44px',
          color: '#4B535E'
        },
        formatter: () => 'ប្រសិទ្ធភាព'
      }
    }
  };

  const radarConfig = {
    data: comparisonData.flatMap(item => [
      { method: item.method, metric: 'តម្លៃ', value: 100 - (item.costPerTeacher / COST_PER_TRADITIONAL_TRAINING * 100) },
      { method: item.method, metric: 'ប្រសិទ្ធភាព', value: item.efficiency },
      { method: item.method, metric: 'ទំហំ', value: item.scalability },
      { method: item.method, metric: 'និរន្តរភាព', value: item.sustainability }
    ]),
    xField: 'metric',
    yField: 'value',
    seriesField: 'method',
    meta: {
      value: {
        min: 0,
        max: 100
      }
    },
    area: {},
    point: {
      size: 4
    }
  };

  return (
    <CalculatorWrapper>
      {/* Header */}
      <HeaderCard>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="large">
              <Title level={1} style={{ margin: 0 }}>
                <CalculatorOutlined /> គណនា ROI ការវិនិយោគអប់រំ
              </Title>
              <Paragraph style={{ fontSize: 18, opacity: 0.9 }}>
                ស្វែងយល់ពីតម្លៃពិតប្រាកដនៃការវិនិយោគរបស់អ្នកក្នុងការអប់រំ
                និងផលប៉ះពាល់រយៈពេលវែង
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="ប្រសិទ្ធភាពធៀបនឹងវិធីសាស្ត្រចាស់"
                  value={efficiencyRatio}
                  suffix="%"
                  valueStyle={{ color: 'white', fontSize: 36 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="សន្សំបានសរុប"
                  value={savingsVsTraditional}
                  prefix="$"
                  valueStyle={{ color: 'white', fontSize: 36 }}
                  formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </HeaderCard>

      <Row gutter={[24, 24]}>
        {/* Calculator Input Section */}
        <Col xs={24} lg={10}>
          <CalculatorCard title="បញ្ចូលទិន្នន័យវិនិយោគ">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Investment Amount */}
              <div className="slider-section">
                <Text strong>ចំនួនទឹកប្រាក់វិនិយោគ (USD)</Text>
                <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                  <Col span={16}>
                    <Slider
                      min={10000}
                      max={1000000}
                      value={investment}
                      onChange={setInvestment}
                      marks={{
                        10000: '$10K',
                        500000: '$500K',
                        1000000: '$1M'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <InputNumber
                      value={investment}
                      onChange={(value) => setInvestment(value || 0)}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>

              {/* Teacher Count */}
              <div className="slider-section">
                <Text strong>ចំនួនគ្រូដែលត្រូវបណ្តុះបណ្តាល</Text>
                <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                  <Col span={16}>
                    <Slider
                      min={50}
                      max={5000}
                      value={teacherCount}
                      onChange={setTeacherCount}
                      marks={{
                        50: '50',
                        2500: '2,500',
                        5000: '5,000'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <InputNumber
                      value={teacherCount}
                      onChange={(value) => setTeacherCount(value || 0)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>

              {/* School Count */}
              <div className="slider-section">
                <Text strong>ចំនួនសាលារៀន</Text>
                <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                  <Col span={16}>
                    <Slider
                      min={5}
                      max={200}
                      value={schoolCount}
                      onChange={setSchoolCount}
                      marks={{
                        5: '5',
                        100: '100',
                        200: '200'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <InputNumber
                      value={schoolCount}
                      onChange={(value) => setSchoolCount(value || 0)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>

              {/* Program Duration */}
              <div className="slider-section">
                <Text strong>រយៈពេលកម្មវិធី (ខែ)</Text>
                <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
                  <Col span={16}>
                    <Slider
                      min={6}
                      max={36}
                      value={programDuration}
                      onChange={setProgramDuration}
                      marks={{
                        6: '6 ខែ',
                        12: '1 ឆ្នាំ',
                        24: '2 ឆ្នាំ',
                        36: '3 ឆ្នាំ'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <InputNumber
                      value={programDuration}
                      onChange={(value) => setProgramDuration(value || 0)}
                      style={{ width: '100%' }}
                      suffix="ខែ"
                    />
                  </Col>
                </Row>
              </div>

              <Divider />

              {/* Options */}
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong>បង្ហាញការព្យាករណ៍ 10 ឆ្នាំ</Text>
                  </Col>
                  <Col>
                    <Switch
                      checked={showProjection}
                      onChange={setShowProjection}
                    />
                  </Col>
                </Row>
              </Space>
            </Space>
          </CalculatorCard>
        </Col>

        {/* Results Section */}
        <Col xs={24} lg={14}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* Key Metrics */}
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <ResultCard highlight>
                  <Statistic
                    title="តម្លៃក្នុងមួយគ្រូ"
                    value={costPerTeacherPLP}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress 
                    percent={100 - (costPerTeacherPLP / COST_PER_TRADITIONAL_TRAINING * 100)} 
                    size="small"
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                  <Text type="secondary">ថោកជាង {((1 - costPerTeacherPLP / COST_PER_TRADITIONAL_TRAINING) * 100).toFixed(0)}%</Text>
                </ResultCard>
              </Col>
              <Col xs={12} md={6}>
                <ResultCard>
                  <Statistic
                    title="សិស្សទទួលផល"
                    value={studentsImpacted}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                    formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                  />
                  <Text type="secondary">មធ្យម {AVERAGE_STUDENTS_PER_TEACHER}/គ្រូ</Text>
                </ResultCard>
              </Col>
              <Col xs={12} md={6}>
                <ResultCard>
                  <Statistic
                    title="តម្លៃក្នុងមួយសិស្ស"
                    value={costPerStudent}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Text type="secondary">វិនិយោគដ៏មានប្រសិទ្ធភាព</Text>
                </ResultCard>
              </Col>
              <Col xs={12} md={6}>
                <ResultCard>
                  <Statistic
                    title="អក្ខរកម្មកើនឡើង"
                    value={projectedLiteracyGain}
                    suffix="សិស្ស"
                    valueStyle={{ color: '#fa8c16' }}
                    formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                  />
                  <Text type="secondary">+{(LITERACY_IMPROVEMENT_RATE * 100).toFixed(0)}% កើនឡើង</Text>
                </ResultCard>
              </Col>
            </Row>

            {/* Efficiency Gauge */}
            <Card title="ប្រសិទ្ធភាពធៀបនឹងការបណ្តុះបណ្តាលប្រពៃណី">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <Gauge {...gaugeConfig} height={200} />
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <MetricBox color="#f6ffed">
                      <Statistic
                        title="សន្សំបានក្នុងមួយគ្រូ"
                        value={COST_PER_TRADITIONAL_TRAINING - costPerTeacherPLP}
                        prefix="$"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </MetricBox>
                    <MetricBox color="#e6f4ff">
                      <Statistic
                        title="គ្រូបានបណ្តុះបណ្តាលបន្ថែម"
                        value={Math.floor(savingsVsTraditional / costPerTeacherPLP)}
                        suffix="នាក់"
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Text type="secondary">ដោយថវិកាដដែល</Text>
                    </MetricBox>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Long Term Impact */}
            {showProjection && (
              <Card 
                title="ផលប៉ះពាល់សេដ្ឋកិច្ចរយៈពេល 10 ឆ្នាំ"
                extra={<Tag color="gold">ការព្យាករណ៍</Tag>}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Statistic
                      title="ផលតបស្នងសរុប"
                      value={longTermEconomicImpact}
                      prefix="$"
                      valueStyle={{ color: '#52c41a', fontSize: 28 }}
                      formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                    />
                    <Text type="secondary">ROI: {LONG_TERM_ECONOMIC_MULTIPLIER}x</Text>
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic
                      title="ការងារបង្កើតថ្មី"
                      value={Math.round(studentsImpacted * 0.65)}
                      valueStyle={{ fontSize: 24 }}
                      formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                    />
                    <Text type="secondary">សិស្សចូលទីផ្សារការងារ</Text>
                  </Col>
                  <Col xs={24} md={8}>
                    <Statistic
                      title="GDP កើនឡើង"
                      value={investment * 0.08}
                      prefix="$"
                      suffix="/ឆ្នាំ"
                      valueStyle={{ fontSize: 24 }}
                      formatter={(value) => <CountUp end={value as number} duration={2} separator="," />}
                    />
                    <Text type="secondary">ការរួមចំណែកសេដ្ឋកិច្ច</Text>
                  </Col>
                </Row>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {/* Comparison Section */}
      <Divider style={{ margin: '48px 0' }} />
      
      <Title level={3} style={{ marginBottom: 24 }}>ការប្រៀបធៀបវិធីសាស្ត្រ</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <ComparisonCard title="ការវិភាគប្រៀបធៀប">
            <Radar {...radarConfig} height={300} />
          </ComparisonCard>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="តារាងប្រៀបធៀបលម្អិត">
            <Table
              dataSource={[
                {
                  key: '1',
                  metric: 'តម្លៃក្នុងមួយគ្រូ',
                  plp: `$${costPerTeacherPLP.toFixed(2)}`,
                  traditional: `$${COST_PER_TRADITIONAL_TRAINING}`,
                  difference: <Text type="success">-{((1 - costPerTeacherPLP / COST_PER_TRADITIONAL_TRAINING) * 100).toFixed(0)}%</Text>
                },
                {
                  key: '2',
                  metric: 'រយៈពេលបណ្តុះបណ្តាល',
                  plp: 'បន្តបន្ទាប់',
                  traditional: '2 សប្តាហ៍',
                  difference: <Text type="success">ល្អជាង</Text>
                },
                {
                  key: '3',
                  metric: 'ការគាំទ្របន្ត',
                  plp: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                  traditional: <ClockCircleOutlined style={{ color: '#faad14' }} />,
                  difference: <Text type="success">✓</Text>
                },
                {
                  key: '4',
                  metric: 'ទិន្នន័យនិងការតាមដាន',
                  plp: 'ពេលវេលាជាក់ស្តែង',
                  traditional: 'មិនមាន',
                  difference: <Text type="success">✓</Text>
                }
              ]}
              columns={[
                { title: 'សូចនាករ', dataIndex: 'metric', key: 'metric' },
                { title: 'PLP System', dataIndex: 'plp', key: 'plp' },
                { title: 'វិធីសាស្ត្រប្រពៃណី', dataIndex: 'traditional', key: 'traditional' },
                { title: 'ភាពខុសគ្នា', dataIndex: 'difference', key: 'difference' }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Card style={{ marginTop: 24 }}>
        <Row justify="center" gutter={[16, 16]}>
          <Col>
            <Button type="primary" size="large" icon={<SaveOutlined />}>
              រក្សាទុកការគណនា
            </Button>
          </Col>
          <Col>
            <Button size="large" icon={<PrinterOutlined />}>
              បោះពុម្ពរបាយការណ៍
            </Button>
          </Col>
          <Col>
            <Button size="large" icon={<ShareAltOutlined />}>
              ចែករំលែកលទ្ធផល
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Info Alert */}
      <Alert
        message="អំពីការគណនា ROI"
        description={
          <Space direction="vertical">
            <Text>ការគណនានេះផ្អែកលើទិន្នន័យជាក់ស្តែងពីកម្មវិធី PLP និងការស្រាវជ្រាវអប់រំអន្តរជាតិ។</Text>
            <Text>ផលប៉ះពាល់រយៈពេលវែងគណនាដោយប្រើគំរូសេដ្ឋកិច្ចស្តង់ដារសម្រាប់ការវិនិយោគអប់រំ។</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </CalculatorWrapper>
  );
};

export default ROICalculator;