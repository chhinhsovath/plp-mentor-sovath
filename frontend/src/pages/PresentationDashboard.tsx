import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Statistic,
  Progress,
  Timeline,
  Modal,
  Carousel,
  Tag,
  Avatar,
  Divider,
  Badge,
  message,
  Tooltip,
  QRCode,
  Segmented,
  FloatButton,
  Tour,
  Alert,
  List,
  type TourProps
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  CameraOutlined,
  RightOutlined,
  LeftOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  SoundOutlined,
  SettingOutlined,
  GlobalOutlined,
  DollarOutlined,
  TeamOutlined,
  BookOutlined,
  TrophyOutlined,
  RiseOutlined,
  HeartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarFilled,
  FileTextOutlined
} from '@ant-design/icons';
import { Line, Column, Pie, Area, Gauge, Liquid } from '@ant-design/plots';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import CountUp from 'react-countup';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text, Paragraph } = Typography;

// Global styles for presentation mode
const PresentationModeStyles = createGlobalStyle`
  .presentation-mode {
    * {
      cursor: none !important;
    }
    
    &.show-cursor * {
      cursor: default !important;
    }
  }
`;

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled Components
const PresentationWrapper = styled.div`
  min-height: 100vh;
  background: ${props => props.presentationMode ? '#000' : '#f0f2f5'};
  padding: ${props => props.presentationMode ? '0' : '24px'};
  transition: all 0.3s ease;
  
  &.presentation-mode {
    padding: 0;
    overflow: hidden;
  }
`;

const SlideContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${props => props.fullscreen ? '48px' : '24px'};
  background: ${props => props.dark ? '#001529' : '#ffffff'};
  animation: ${fadeIn} 0.8s ease-out;
`;

const HeroSlide = styled.div`
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: ${pulse} 4s ease-in-out infinite;
  }
`;

const MetricCard = styled(Card)`
  text-align: center;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  animation: ${slideInLeft} 0.8s ease-out;
  animation-delay: ${props => props.delay || '0s'};
  animation-fill-mode: both;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
`;

const ImpactNumber = styled.div`
  font-size: ${props => props.size || '72px'};
  font-weight: bold;
  color: ${props => props.color || '#1890ff'};
  line-height: 1;
  margin: 24px 0;
`;

const SlideControls = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  gap: 12px;
`;

const SlideIndicator = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 8px;
  
  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    cursor: pointer;
    
    &.active {
      width: 24px;
      border-radius: 4px;
      background: #1890ff;
    }
  }
`;

// Slide components
const slides = [
  {
    id: 'hero',
    type: 'hero',
    title: 'ប្រព័ន្ធគ្រប់គ្រងអ្នកណែនាំ PLP',
    subtitle: 'ផ្លាស់ប្តូរការអប់រំកម្ពុជាតាមរយៈទិន្នន័យ'
  },
  {
    id: 'impact',
    type: 'metrics',
    title: 'ផលប៉ះពាល់សរុប'
  },
  {
    id: 'results-chain',
    type: 'flow',
    title: 'ខ្សែសង្វាក់លទ្ធផល'
  },
  {
    id: 'roi',
    type: 'calculator',
    title: 'ការវិនិយោគ និង ROI'
  },
  {
    id: 'success',
    type: 'stories',
    title: 'រឿងរ៉ាវជោគជ័យ'
  },
  {
    id: 'comparison',
    type: 'analytics',
    title: 'ការវិភាគប្រៀបធៀប'
  },
  {
    id: 'transparency',
    type: 'donor',
    title: 'តម្លាភាពហិរញ្ញវត្ថុ'
  },
  {
    id: 'future',
    type: 'roadmap',
    title: 'ទិសដៅអនាគត'
  },
  {
    id: 'cta',
    type: 'action',
    title: 'ចូលរួមជាមួយយើង'
  }
];

const PresentationDashboard: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [presentationMode, setPresentationMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  const presentationRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tour steps
  const tourSteps: TourProps['steps'] = [
    {
      title: 'ចាប់ផ្តើមបទបង្ហាញ',
      description: 'ចុចប៊ូតុងនេះដើម្បីចូលទៅកាន់របៀបបទបង្ហាញ',
      target: () => document.querySelector('.start-presentation-btn'),
    },
    {
      title: 'ការគ្រប់គ្រងស្លាយ',
      description: 'ប្រើសញ្ញាព្រួញឬកង់កណ្តុរដើម្បីផ្លាស់ទីស្លាយ',
      target: () => document.querySelector('.slide-controls'),
    },
    {
      title: 'លេខស្លាយ',
      description: 'ចុចលើចំណុចដើម្បីរំលងទៅស្លាយជាក់លាក់',
      target: () => document.querySelector('.slide-indicator'),
    }
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!presentationMode) return;
      
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'Escape':
          exitPresentation();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [presentationMode, currentSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && presentationMode) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 8000);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, presentationMode]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const startPresentation = () => {
    setPresentationMode(true);
    setCurrentSlide(0);
    message.info('ចុច ESC ដើម្បីចេញ, F សម្រាប់អេក្រង់ពេញ');
  };

  const exitPresentation = () => {
    setPresentationMode(false);
    setAutoPlay(false);
    setFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await presentationRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const exportToPDF = async () => {
    message.loading('កំពុងបង្កើត PDF...');
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    for (let i = 0; i < slides.length; i++) {
      setCurrentSlide(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(presentationRef.current!);
      const imgData = canvas.toDataURL('image/png');
      
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    }
    
    pdf.save('PLP-Mentor-Presentation.pdf');
    message.success('PDF ត្រូវបានទាញយក!');
  };

  const sharePresentation = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    message.success('តំណភ្ជាប់ត្រូវបានចម្លង!');
  };

  // Render slide content
  const renderSlide = (slide: any) => {
    switch (slide.type) {
      case 'hero':
        return (
          <HeroSlide>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Title level={1} style={{ fontSize: 72, color: 'white', marginBottom: 24 }}>
                {slide.title}
              </Title>
              <Paragraph style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', maxWidth: 800, margin: '0 auto 48px' }}>
                {slide.subtitle}
              </Paragraph>
              <Space size="large">
                <Tag color="blue" style={{ fontSize: 18, padding: '8px 16px' }}>
                  <TeamOutlined /> 1,234 គ្រូបានបណ្តុះបណ្តាល
                </Tag>
                <Tag color="green" style={{ fontSize: 18, padding: '8px 16px' }}>
                  <BookOutlined /> 45,678 សិស្សទទួលផល
                </Tag>
                <Tag color="purple" style={{ fontSize: 18, padding: '8px 16px' }}>
                  <TrophyOutlined /> 156 សាលារៀន
                </Tag>
              </Space>
            </div>
          </HeroSlide>
        );

      case 'metrics':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} sm={12} md={6}>
                <MetricCard delay="0.2s">
                  <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <ImpactNumber>
                    <CountUp end={1234} duration={2} />
                  </ImpactNumber>
                  <Title level={4}>គ្រូបានបណ្តុះបណ្តាល</Title>
                  <Progress percent={89} strokeColor="#1890ff" />
                </MetricCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <MetricCard delay="0.4s">
                  <BookOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <ImpactNumber color="#52c41a">
                    <CountUp end={45678} duration={2} separator="," />
                  </ImpactNumber>
                  <Title level={4}>សិស្សទទួលផល</Title>
                  <Progress percent={92} strokeColor="#52c41a" />
                </MetricCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <MetricCard delay="0.6s">
                  <DollarOutlined style={{ fontSize: 48, color: '#722ed1' }} />
                  <ImpactNumber color="#722ed1" size="56px">
                    $<CountUp end={27.50} duration={2} decimals={2} />
                  </ImpactNumber>
                  <Title level={4}>តម្លៃក្នុងមួយសិស្ស</Title>
                  <Text type="success">ថោកជាង 85%</Text>
                </MetricCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <MetricCard delay="0.8s">
                  <RiseOutlined style={{ fontSize: 48, color: '#fa8c16' }} />
                  <ImpactNumber color="#fa8c16">
                    <CountUp end={12} duration={2} />x
                  </ImpactNumber>
                  <Title level={4}>ROI រយៈពេល 10 ឆ្នាំ</Title>
                  <Text>ផលតបស្នងលើការវិនិយោគ</Text>
                </MetricCard>
              </Col>
            </Row>
          </SlideContainer>
        );

      case 'flow':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Timeline mode="alternate" style={{ fontSize: 18 }}>
              <Timeline.Item color="blue" dot={<DollarOutlined style={{ fontSize: 24 }} />}>
                <Card>
                  <Title level={4}>ធាតុចូល</Title>
                  <Text>ថវិកា $1.25M • អ្នកណែនាំ 156 នាក់ • ទម្រង់សង្កេត 12</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="green" dot={<CheckCircleOutlined style={{ fontSize: 24 }} />}>
                <Card>
                  <Title level={4}>សកម្មភាព</Title>
                  <Text>ការសង្កេត 1,245 • បេសកកម្ម 189 • សិក្ខាសាលា 28</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="orange" dot={<BarChartOutlined style={{ fontSize: 24 }} />}>
                <Card>
                  <Title level={4}>លទ្ធផលផ្ទាល់</Title>
                  <Text>គ្រូបានណែនាំ 523 • ផែនការកែលម្អ 412</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="purple" dot={<LineChartOutlined style={{ fontSize: 24 }} />}>
                <Card>
                  <Title level={4}>លទ្ធផលរយៈពេលខ្លី</Title>
                  <Text>គុណភាពបង្រៀនកើនឡើង 73% • ការចូលរួមសិស្ស 68%</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="red" dot={<TrophyOutlined style={{ fontSize: 24 }} />}>
                <Card>
                  <Title level={4}>ផលប៉ះពាល់រយៈពេលវែង</Title>
                  <Text>អក្ខរកម្មកើន 15% • អត្រាបោះបង់ថយ 8%</Text>
                </Card>
              </Timeline.Item>
            </Timeline>
          </SlideContainer>
        );

      case 'calculator':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} md={12}>
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Statistic
                      title="ការវិនិយោគសរុប"
                      value={1250000}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="ក្នុងមួយគ្រូ" value={25} prefix="$" />
                      </Col>
                      <Col span={12}>
                        <Statistic title="ក្នុងមួយសិស្ស" value={27.50} prefix="$" precision={2} />
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Gauge
                  percent={0.85}
                  range={{ color: 'l(0) 0:#B8E1FF 1:#3D76E4' }}
                  startAngle={Math.PI}
                  endAngle={2 * Math.PI}
                  indicator={null}
                  statistic={{
                    title: {
                      offsetY: -36,
                      style: { fontSize: '36px' },
                      formatter: () => '85%'
                    },
                    content: {
                      style: { fontSize: '24px' },
                      formatter: () => 'ប្រសិទ្ធភាពធៀបនឹងវិធីសាស្ត្រចាស់'
                    }
                  }}
                />
              </Col>
            </Row>
            <Alert
              message="ផលតបស្នងលើការវិនិយោគ"
              description="$1 វិនិយោគថ្ងៃនេះ = $12 ផលប៉ះពាល់ក្នុងរយៈពេល 10 ឆ្នាំ"
              type="success"
              showIcon
              style={{ marginTop: 48, fontSize: 18 }}
            />
          </SlideContainer>
        );

      case 'stories':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Row gutter={[32, 32]}>
              <Col xs={24} md={8}>
                <Card
                  cover={
                    <div style={{ height: 200, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                  }
                >
                  <Card.Meta
                    avatar={<Avatar size={48}>គ្រូ</Avatar>}
                    title="គ្រូសុខា"
                    description="ពីការលំបាកទៅជាគំរូ"
                  />
                  <Paragraph style={{ marginTop: 16 }}>
                    បន្ទាប់ពីទទួលបានការណែនាំ គ្រូសុខាបានកែលម្អវិធីសាស្ត្របង្រៀន 
                    ដែលជួយសិស្ស 78% អានបានល្អជាងមុន។
                  </Paragraph>
                  <Progress percent={78} strokeColor="#52c41a" />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  cover={
                    <div style={{ height: 200, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} />
                  }
                >
                  <Card.Meta
                    avatar={<Avatar size={48}>សិស្ស</Avatar>}
                    title="សិស្សពូកែ"
                    description="ពីមិនចេះអានទៅជាពូកែ"
                  />
                  <Paragraph style={{ marginTop: 16 }}>
                    ក្នុងរយៈពេលត្រឹមតែ 3 ខែ សិស្សពូកែបានរៀនអានបានយ៉ាងល្អ 
                    ហើយឥឡូវនេះជាសិស្សពូកែក្នុងថ្នាក់។
                  </Paragraph>
                  <Progress percent={95} strokeColor="#52c41a" />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  cover={
                    <div style={{ height: 200, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }} />
                  }
                >
                  <Card.Meta
                    avatar={<Avatar size={48}>សាលា</Avatar>}
                    title="សាលាគំរូ"
                    description="ការផ្លាស់ប្តូរទាំងស្រុង"
                  />
                  <Paragraph style={{ marginTop: 16 }}>
                    សាលាបឋមសិក្សាកំពង់ចាមក្លាយជាសាលាគំរូ 
                    បន្ទាប់ពីអនុវត្តកម្មវិធីណែនាំ។
                  </Paragraph>
                  <Progress percent={92} strokeColor="#52c41a" />
                </Card>
              </Col>
            </Row>
          </SlideContainer>
        );

      case 'analytics':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Row gutter={[48, 48]}>
              <Col xs={24} md={12}>
                <Card title="ចំណាត់ថ្នាក់តាមខេត្ត">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {['ភ្នំពេញ', 'កណ្តាល', 'កំពង់ចាម', 'សៀមរាប', 'បាត់ដំបង'].map((region, index) => (
                      <div key={region} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Avatar
                          size={40}
                          style={{
                            backgroundColor: index === 0 ? '#ffd700' :
                                           index === 1 ? '#c0c0c0' :
                                           index === 2 ? '#cd7f32' : '#f0f0f0',
                            color: index < 3 ? 'white' : '#8c8c8c'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text strong>{region}</Text>
                          <Progress percent={95 - index * 5} showInfo={false} />
                        </div>
                        <Text>{95 - index * 5}%</Text>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="ការអនុវត្តល្អដែលបានកំណត់">
                  <List
                    dataSource={[
                      'កម្មវិធីណែនាំរួមគ្នា - ភ្នំពេញ',
                      'ប្រព័ន្ធតាមដានឌីជីថល - សៀមរាប',
                      'វគ្គបណ្តុះបណ្តាលគ្រូជាប់លាប់ - កំពង់ចាម'
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <Space>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text>{item}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                  <Alert
                    message="សេចក្តីសន្និដ្ឋាន"
                    description="ការចែករំលែកការអនុវត្តល្អរវាងតំបន់អាចបង្កើនប្រសិទ្ធភាព 40%"
                    type="info"
                    style={{ marginTop: 16 }}
                  />
                </Card>
              </Col>
            </Row>
          </SlideContainer>
        );

      case 'donor':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} md={12}>
                <Pie
                  data={[
                    { category: 'ការបណ្តុះបណ្តាលគ្រូ', value: 35 },
                    { category: 'សម្ភារៈសិក្សា', value: 25 },
                    { category: 'កម្មវិធីណែនាំ', value: 20 },
                    { category: 'បច្ចេកវិទ្យា', value: 15 },
                    { category: 'ប្រតិបត្តិការ', value: 5 }
                  ]}
                  angleField="value"
                  colorField="category"
                  radius={0.8}
                  label={{
                    type: 'spider',
                    content: '{name}\n{percentage}'
                  }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Card>
                  <Title level={4}>អ្នកឧបត្ថម្ភកំពូល</Title>
                  <List
                    dataSource={[
                      { name: 'មូលនិធិអាស៊ី', amount: 500000 },
                      { name: 'ក្រុមហ៊ុន ABC', amount: 350000 },
                      { name: 'អង្គការ XYZ', amount: 250000 }
                    ]}
                    renderItem={(item, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              size={40}
                              style={{
                                backgroundColor: index === 0 ? '#ffd700' :
                                               index === 1 ? '#c0c0c0' : '#cd7f32'
                              }}
                            >
                              {index + 1}
                            </Avatar>
                          }
                          title={item.name}
                          description={`$${item.amount.toLocaleString()}`}
                        />
                      </List.Item>
                    )}
                  />
                  <Alert
                    message="ថវិកាត្រូវបានប្រើប្រាស់ប្រកបដោយប្រសិទ្ធភាព 85%"
                    type="success"
                    style={{ marginTop: 16 }}
                  />
                </Card>
              </Col>
            </Row>
          </SlideContainer>
        );

      case 'roadmap':
        return (
          <SlideContainer>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
              {slide.title}
            </Title>
            <Timeline mode="alternate" style={{ marginTop: 48 }}>
              <Timeline.Item color="green">
                <Card>
                  <Title level={5}>ត្រីមាសទី 1 - 2024</Title>
                  <Text>ពង្រីកទៅ 200 សាលាបន្ថែម</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Card>
                  <Title level={5}>ត្រីមាសទី 2 - 2024</Title>
                  <Text>ដាក់ឱ្យប្រើប្រាស់ AI សម្រាប់វិភាគ</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Card>
                  <Title level={5}>ត្រីមាសទី 3 - 2024</Title>
                  <Text>កម្មវិធីផ្លូវការជាមួយក្រសួងអប់រំ</Text>
                </Card>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Card>
                  <Title level={5}>ត្រីមាសទី 4 - 2024</Title>
                  <Text>គ្របដណ្តប់ទូទាំងប្រទេស</Text>
                </Card>
              </Timeline.Item>
            </Timeline>
            <Alert
              message="គោលដៅ 2025"
              description="ជួយគ្រូ 10,000 នាក់ និងសិស្ស 350,000 នាក់"
              type="info"
              showIcon
              style={{ marginTop: 48, fontSize: 18 }}
            />
          </SlideContainer>
        );

      case 'action':
        return (
          <SlideContainer style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
              <Title level={1} style={{ color: 'white', fontSize: 56, marginBottom: 32 }}>
                ចូលរួមជាមួយយើង
              </Title>
              <Paragraph style={{ fontSize: 24, color: 'rgba(255,255,255,0.9)', marginBottom: 48 }}>
                រួមគ្នាយើងអាចផ្លាស់ប្តូរការអប់រំនៅកម្ពុជា
              </Paragraph>
              
              <Row gutter={[32, 32]} justify="center" style={{ marginBottom: 48 }}>
                <Col xs={24} sm={8}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <DollarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                    <Title level={4}>វិនិយោគ</Title>
                    <Text>ជួយផ្តល់មូលនិធិដល់កម្មវិធី</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <TeamOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                    <Title level={4}>ចូលរួម</Title>
                    <Text>ក្លាយជាអ្នកណែនាំ</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <ShareAltOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                    <Title level={4}>ចែករំលែក</Title>
                    <Text>ផ្សព្វផ្សាយអំពីកម្មវិធី</Text>
                  </Card>
                </Col>
              </Row>
              
              <Space size="large">
                <Button type="primary" size="large" style={{ fontSize: 18, padding: '8px 32px', height: 'auto' }}>
                  ទាក់ទងយើង
                </Button>
                <Button size="large" ghost style={{ fontSize: 18, padding: '8px 32px', height: 'auto', color: 'white', borderColor: 'white' }}>
                  ស្វែងយល់បន្ថែម
                </Button>
              </Space>
              
              <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '48px 0' }} />
              
              <QRCode 
                value="https://plp-mentor.edu.kh" 
                size={160}
                style={{ margin: '0 auto', display: 'block' }}
              />
              <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16, display: 'block' }}>
                ស្កេន QR Code ដើម្បីចូលមើលគេហទំព័រ
              </Text>
            </div>
          </SlideContainer>
        );

      default:
        return null;
    }
  };

  if (!presentationMode) {
    return (
      <PresentationWrapper>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <PlayCircleOutlined /> មជ្ឈមណ្ឌលបទបង្ហាញ
              </Title>
              <Text type="secondary">បង្កើតបទបង្ហាញដ៏មានអានុភាពសម្រាប់អ្នកពាក់ព័ន្ធ</Text>
            </Col>
            <Col>
              <Space>
                <Button icon={<QuestionCircleOutlined />} onClick={() => setShowTour(true)}>
                  ជំនួយ
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PlayCircleOutlined />}
                  onClick={startPresentation}
                  className="start-presentation-btn"
                >
                  ចាប់ផ្តើមបទបង្ហាញ
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {slides.map((slide, index) => (
              <Col xs={24} sm={12} md={8} key={slide.id}>
                <Card
                  hoverable
                  onClick={() => {
                    setCurrentSlide(index);
                    startPresentation();
                  }}
                  style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Space direction="vertical" align="center">
                    <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }}>
                      <Avatar size={64} style={{ backgroundColor: '#f0f0f0' }}>
                        {index + 1}
                      </Avatar>
                    </Badge>
                    <Title level={5}>{slide.title}</Title>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="ស្លាយសរុប"
                  value={slides.length}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="រយៈពេលប៉ាន់ស្មាន"
                  value={slides.length * 2}
                  suffix="នាទី"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="ទិដ្ឋភាពអន្តរកម្ម"
                  value={12}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Alert
            message="គន្លឹះសម្រាប់បទបង្ហាញល្អ"
            description={
              <ul>
                <li>ប្រើសញ្ញាព្រួញឆ្វេង/ស្តាំដើម្បីរុករកស្លាយ</li>
                <li>ចុច F ដើម្បីចូលអេក្រង់ពេញ</li>
                <li>ចុច Space ដើម្បីលេងដោយស្វ័យប្រវត្តិ</li>
                <li>ចុច ESC ដើម្បីចេញពីបទបង្ហាញ</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginTop: 24 }}
          />
        </Card>

        <Tour 
          open={showTour} 
          onClose={() => setShowTour(false)} 
          steps={tourSteps} 
        />
      </PresentationWrapper>
    );
  }

  return (
    <>
      <PresentationModeStyles />
      <PresentationWrapper 
        ref={presentationRef}
        presentationMode={presentationMode}
        className={`${presentationMode ? 'presentation-mode' : ''} ${showControls ? 'show-cursor' : ''}`}
        onMouseMove={() => {
          setShowControls(true);
          setTimeout(() => setShowControls(false), 3000);
        }}
      >
        {renderSlide(slides[currentSlide])}

        {presentationMode && showControls && (
          <>
            <SlideIndicator className="slide-indicator">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </SlideIndicator>

            <SlideControls className="slide-controls">
              <Button
                shape="circle"
                icon={<LeftOutlined />}
                onClick={prevSlide}
                size="large"
              />
              <Button
                shape="circle"
                icon={autoPlay ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => setAutoPlay(!autoPlay)}
                size="large"
              />
              <Button
                shape="circle"
                icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                size="large"
              />
              <Button
                shape="circle"
                icon={<HomeOutlined />}
                onClick={exitPresentation}
                size="large"
                danger
              />
            </SlideControls>
          </>
        )}

        <FloatButton.Group
          trigger="click"
          icon={<SettingOutlined />}
          style={{ right: 24, bottom: 100 }}
        >
          <FloatButton
            icon={<ShareAltOutlined />}
            tooltip="ចែករំលែក"
            onClick={sharePresentation}
          />
          <FloatButton
            icon={<DownloadOutlined />}
            tooltip="ទាញយក PDF"
            onClick={exportToPDF}
          />
          <FloatButton
            icon={<PrinterOutlined />}
            tooltip="បោះពុម្ព"
            onClick={() => window.print()}
          />
        </FloatButton.Group>
      </PresentationWrapper>
    </>
  );
};

export default PresentationDashboard;