import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Avatar,
  Button,
  Carousel,
  Timeline,
  Statistic,
  Rate,
  Divider,
  Image,
  Badge,
  Tooltip,
  Modal,
  List,
  Progress,
  Input,
  Select
} from 'antd';
import {
  UserOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  CommentOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TrophyOutlined,
  RiseOutlined,
  CameraOutlined,
  PlayCircleOutlined,
  StarFilled
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Styled Components
const StoriesWrapper = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const StoryCard = styled(Card)`
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  
  .ant-card-cover {
    overflow: hidden;
    height: 240px;
    
    img {
      transition: transform 0.3s ease;
    }
  }
  
  &:hover .ant-card-cover img {
    transform: scale(1.1);
  }
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 48px;
  margin-bottom: 32px;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    transform: rotate(30deg);
  }
`;

const StatCard = styled(Card)`
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: none;
  height: 100%;
`;

const VideoThumbnail = styled.div`
  position: relative;
  height: 240px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .play-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    color: rgba(255, 255, 255, 0.9);
    transition: transform 0.3s ease;
  }
  
  &:hover .play-overlay {
    transform: translate(-50%, -50%) scale(1.2);
  }
`;

const TestimonialCard = styled(Card)`
  background: linear-gradient(145deg, #f5f5f5 0%, #ffffff 100%);
  border: none;
  height: 100%;
  
  .quote-mark {
    font-size: 48px;
    color: #ddd;
    line-height: 1;
    margin-bottom: 16px;
  }
`;

// Mock data
const successStories = [
  {
    id: 1,
    type: 'teacher',
    title: 'គ្រូសុខា៖ ពីការលំបាកទៅជាគំរូ',
    subtitle: 'ការផ្លាស់ប្តូរវិធីសាស្ត្របង្រៀនដែលជួយសិស្សថ្នាក់ទី១',
    image: 'https://images.unsplash.com/photo-1580894732930-0babd100d356?w=800',
    location: 'សាលាបឋមសិក្សា ភ្នំពេញថ្មី',
    date: '២ ខែមុន',
    stats: {
      studentImprovement: 78,
      classSize: 45,
      readingLevel: 85
    },
    likes: 234,
    comments: 45,
    story: 'គ្រូសុខាបានប្រឈមមុខនឹងបញ្ហាក្នុងការបង្រៀនសិស្សថ្នាក់ទី១ឱ្យអាន។ បន្ទាប់ពីទទួលបានការណែនាំពីអ្នកណែនាំ PLPគាត់បានផ្លាស់ប្តូរវិធីសាស្ត្របង្រៀន...',
    mentor: 'លោកគ្រូ ចាន់ សុភាព',
    featured: true
  },
  {
    id: 2,
    type: 'student',
    title: 'សិស្សពូកែ៖ ការរីកចម្រើនគួរឱ្យកត់សម្គាល់',
    subtitle: 'ពីមិនចេះអានទៅជាសិស្សពូកែក្នុងរយៈពេល៣ខែ',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    location: 'សាលាបឋមសិក្សា កណ្តាល',
    date: '១ ខែមុន',
    stats: {
      readingSpeed: 95,
      comprehension: 88,
      confidence: 100
    },
    likes: 567,
    comments: 89,
    story: 'សិស្សពូកែ អាយុ៧ឆ្នាំ មិនអាចអានអក្សរខ្មែរបានពេលចាប់ផ្តើមឆ្នាំសិក្សា។ ក្រោយពីគ្រូរបស់គាត់ទទួលបានការណែនាំថ្មីៗ...',
    video: true,
    featured: true
  },
  {
    id: 3,
    type: 'school',
    title: 'សាលារៀនគំរូ៖ ការផ្លាស់ប្តូរទាំងស្រុង',
    subtitle: 'របៀបដែលសាលាមួយក្លាយជាគំរូក្នុងស្រុក',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800',
    location: 'សាលាបឋមសិក្សា កំពង់ចាម',
    date: '៣ សប្តាហ៍មុន',
    stats: {
      teachersTrained: 24,
      studentsBenefited: 650,
      performanceIncrease: 67
    },
    likes: 890,
    comments: 156,
    story: 'សាលាបឋមសិក្សាកំពង់ចាមបានក្លាយជាសាលាគំរូបន្ទាប់ពីអនុវត្តកម្មវិធីណែនាំរបស់ PLP...',
    featured: false
  }
];

const testimonials = [
  {
    id: 1,
    author: 'លោកគ្រូ សំអាត',
    role: 'នាយកសាលា',
    school: 'សាលាបឋមសិក្សា ភ្នំពេញថ្មី',
    content: 'កម្មវិធីណែនាំរបស់ PLP បានផ្លាស់ប្តូរវិធីដែលគ្រូរបស់យើងបង្រៀន។ យើងឃើញការរីកចម្រើនជាក់ស្តែងក្នុងការអានរបស់សិស្ស។',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    author: 'អ្នកគ្រូ សុភី',
    role: 'គ្រូថ្នាក់ទី២',
    school: 'សាលាបឋមសិក្សា កណ្តាល',
    content: 'ខ្ញុំរីករាយណាស់ដែលមានអ្នកណែនាំជួយ។ ឥឡូវនេះសិស្សរបស់ខ្ញុំចូលចិត្តអានជាងមុន។',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=2'
  }
];

const SuccessStories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [likedStories, setLikedStories] = useState<number[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLike = (storyId: number) => {
    if (likedStories.includes(storyId)) {
      setLikedStories(likedStories.filter(id => id !== storyId));
    } else {
      setLikedStories([...likedStories, storyId]);
    }
  };

  const filteredStories = successStories.filter(story => {
    const matchesFilter = filter === 'all' || story.type === filter;
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <StoriesWrapper>
      {/* Hero Section */}
      <HeroSection>
        <Title level={1} style={{ color: 'white', fontSize: 48, marginBottom: 16 }}>
          រឿងរ៉ាវជោគជ័យ
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 20, maxWidth: 800, margin: '0 auto 32px' }}>
          ស្វែងយល់ពីរបៀបដែលកម្មវិធីណែនាំរបស់ PLP កំពុងផ្លាស់ប្តូរជីវិតគ្រូ សិស្ស និងសហគមន៍
        </Paragraph>
        
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={8} md={6}>
            <StatCard>
              <Statistic
                title="គ្រូដែលបានកែលម្អ"
                value={1234}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </StatCard>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <StatCard>
              <Statistic
                title="សិស្សទទួលផល"
                value={45678}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </StatCard>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <StatCard>
              <Statistic
                title="សាលារៀនចូលរួម"
                value={156}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </StatCard>
          </Col>
        </Row>
      </HeroSection>

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Search
            placeholder="ស្វែងរករឿងរ៉ាវ..."
            size="large"
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Select
            size="large"
            style={{ width: '100%' }}
            placeholder="ជ្រើសរើសប្រភេទ"
            defaultValue="all"
            onChange={setFilter}
          >
            <Option value="all">ទាំងអស់</Option>
            <Option value="teacher">រឿងរ៉ាវគ្រូ</Option>
            <Option value="student">រឿងរ៉ាវសិស្ស</Option>
            <Option value="school">រឿងរ៉ាវសាលារៀន</Option>
          </Select>
        </Col>
      </Row>

      {/* Featured Stories Carousel */}
      <Card title="រឿងរ៉ាវពិសេស" style={{ marginBottom: 24 }}>
        <Carousel autoplay>
          {successStories.filter(s => s.featured).map(story => (
            <div key={story.id}>
              <Row gutter={[24, 24]} align="middle">
                <Col xs={24} md={12}>
                  <Image
                    src={story.image}
                    alt={story.title}
                    style={{ borderRadius: 8, width: '100%', height: 300, objectFit: 'cover' }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                      <Tag color="gold" style={{ marginBottom: 8 }}>រឿងរ៉ាវពិសេស</Tag>
                      <Title level={3}>{story.title}</Title>
                      <Text type="secondary">{story.subtitle}</Text>
                    </div>
                    <Paragraph ellipsis={{ rows: 3 }}>
                      {story.story}
                    </Paragraph>
                    <Space>
                      <Text><EnvironmentOutlined /> {story.location}</Text>
                      <Text><CalendarOutlined /> {story.date}</Text>
                    </Space>
                    <Button type="primary" size="large" onClick={() => setSelectedStory(story)}>
                      អានបន្ថែម
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          ))}
        </Carousel>
      </Card>

      {/* Story Grid */}
      <Title level={3} style={{ marginBottom: 24 }}>រឿងរ៉ាវទាំងអស់</Title>
      <Row gutter={[16, 16]}>
        {filteredStories.map(story => (
          <Col key={story.id} xs={24} sm={12} lg={8}>
            <StoryCard
              cover={
                story.video ? (
                  <VideoThumbnail>
                    <img src={story.image} alt={story.title} />
                    <div className="play-overlay">
                      <PlayCircleOutlined />
                    </div>
                  </VideoThumbnail>
                ) : (
                  <img src={story.image} alt={story.title} />
                )
              }
              actions={[
                <Tooltip title="ចូលចិត្ត">
                  <Button
                    type="text"
                    icon={likedStories.includes(story.id) ? <HeartFilled /> : <HeartOutlined />}
                    onClick={() => handleLike(story.id)}
                    style={{ color: likedStories.includes(story.id) ? '#ff4d4f' : undefined }}
                  >
                    {story.likes + (likedStories.includes(story.id) ? 1 : 0)}
                  </Button>
                </Tooltip>,
                <Button type="text" icon={<CommentOutlined />}>
                  {story.comments}
                </Button>,
                <Button type="text" icon={<ShareAltOutlined />}>
                  ចែករំលែក
                </Button>
              ]}
              onClick={() => setSelectedStory(story)}
            >
              <Card.Meta
                title={
                  <Space>
                    {story.title}
                    {story.video && <Badge count="វីដេអូ" style={{ backgroundColor: '#ff4d4f' }} />}
                  </Space>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">{story.subtitle}</Text>
                    <Space split={<Divider type="vertical" />}>
                      <Text type="secondary"><EnvironmentOutlined /> {story.location}</Text>
                      <Text type="secondary"><CalendarOutlined /> {story.date}</Text>
                    </Space>
                    {story.mentor && (
                      <Text type="secondary">អ្នកណែនាំ៖ {story.mentor}</Text>
                    )}
                  </Space>
                }
              />
            </StoryCard>
          </Col>
        ))}
      </Row>

      {/* Testimonials Section */}
      <Divider style={{ margin: '48px 0' }} />
      <Title level={3} style={{ marginBottom: 24, textAlign: 'center' }}>
        សម្លេងពីអ្នកចូលរួម
      </Title>
      <Row gutter={[16, 16]}>
        {testimonials.map(testimonial => (
          <Col key={testimonial.id} xs={24} md={12}>
            <TestimonialCard>
              <div className="quote-mark">"</div>
              <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
                {testimonial.content}
              </Paragraph>
              <Space align="center">
                <Avatar size={48} src={testimonial.avatar} />
                <div>
                  <Text strong>{testimonial.author}</Text>
                  <br />
                  <Text type="secondary">{testimonial.role} • {testimonial.school}</Text>
                </div>
              </Space>
              <div style={{ marginTop: 16 }}>
                <Rate disabled defaultValue={testimonial.rating} />
              </div>
            </TestimonialCard>
          </Col>
        ))}
      </Row>

      {/* Story Detail Modal */}
      <Modal
        title={selectedStory?.title}
        open={!!selectedStory}
        onCancel={() => setSelectedStory(null)}
        footer={null}
        width={800}
      >
        {selectedStory && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {selectedStory.video ? (
              <VideoThumbnail style={{ height: 400 }}>
                <img src={selectedStory.image} alt={selectedStory.title} />
                <div className="play-overlay">
                  <PlayCircleOutlined />
                </div>
              </VideoThumbnail>
            ) : (
              <Image
                src={selectedStory.image}
                alt={selectedStory.title}
                style={{ width: '100%', borderRadius: 8 }}
              />
            )}
            
            <Space split={<Divider type="vertical" />}>
              <Text><EnvironmentOutlined /> {selectedStory.location}</Text>
              <Text><CalendarOutlined /> {selectedStory.date}</Text>
              {selectedStory.mentor && <Text>អ្នកណែនាំ៖ {selectedStory.mentor}</Text>}
            </Space>

            <Paragraph style={{ fontSize: 16 }}>
              {selectedStory.story}
            </Paragraph>

            {selectedStory.stats && (
              <Row gutter={[16, 16]}>
                {selectedStory.stats.studentImprovement && (
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="ការរីកចម្រើនសិស្ស"
                        value={selectedStory.stats.studentImprovement}
                        suffix="%"
                        prefix={<RiseOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                )}
                {selectedStory.stats.readingLevel && (
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="កម្រិតអាន"
                        value={selectedStory.stats.readingLevel}
                        suffix="%"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                )}
                {selectedStory.stats.classSize && (
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="ចំនួនសិស្ស"
                        value={selectedStory.stats.classSize}
                        suffix="នាក់"
                      />
                    </Card>
                  </Col>
                )}
              </Row>
            )}

            <Timeline>
              <Timeline.Item color="green">ចាប់ផ្តើមទទួលការណែនាំ</Timeline.Item>
              <Timeline.Item color="blue">អនុវត្តវិធីសាស្ត្រថ្មី</Timeline.Item>
              <Timeline.Item color="gold">ឃើញលទ្ធផលដំបូង</Timeline.Item>
              <Timeline.Item dot={<StarFilled style={{ fontSize: 16, color: '#ff4d4f' }} />}>
                សម្រេចជោគជ័យ
              </Timeline.Item>
            </Timeline>
          </Space>
        )}
      </Modal>
    </StoriesWrapper>
  );
};

export default SuccessStories;