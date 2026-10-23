import content from './site';

export interface Project {
  title: string;
  description: string;
  category: string;
  type: 'video' | 'image';
  video?: string;
  image?: string;
  poster?: string;
}

// One content source for the homepage, gallery filters and cinematic viewer.
export const projects: Project[] = [
  ...content.videos
    .filter((item) => item.visible !== false)
    .map((item): Project => ({
      title: item.title,
      description: item.description ?? '',
      video: item.video,
      poster: item.thumbnail,
      category: item.category,
      type: 'video',
    })),
  ...content.photos
    .filter((item) => item.visible !== false)
    .map((item): Project => ({
      title: item.title,
      description: item.description ?? '',
      image: item.image,
      category: item.category,
      type: 'image',
    })),
];
