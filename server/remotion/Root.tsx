import { Composition } from 'remotion';
import { PostTemplate, PostProps } from '../src/components/PostTemplate';
import { StoryTemplate, StoryProps } from '../src/components/StoryTemplate';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Instagram Post - 1080x1080 square (existing) */}
      <Composition
        id="InstagramPost"
        component={PostTemplate}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          baslik: 'Örnek Başlık',
          fiyat: '100,000 TL',
          konum: 'İstanbul',
          image1: '',
        } as PostProps}
      />

      {/* Instagram Story - 1080x1920 vertical video (new) */}
      <Composition
        id="InstagramStory"
        component={StoryTemplate}
        durationInFrames={600} // 20 seconds at 30fps (18s images + 2s ending)
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          baslik: 'Örnek Başlık',
          fiyat: '100,000 TL',
          konum: 'İstanbul',
          image1: '',
          image2: '',
          image3: '',
          image4: '',
          image5: '',
          image6: '',
          agentName: '',
          agentPhone: '',
          agentLogo: '',
          imageOrientations: [],
        } as StoryProps}
      />
    </>
  );
};
