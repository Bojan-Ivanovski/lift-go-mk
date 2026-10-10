import content from '../content/site.json';

export const projects = [
  {
    title: 'Кревање градежни материјали',
    description: 'Практично кревање материјали директно до потребната висина.',
    video: 'uploads/videos/liftgo-gradezni-materijali.mp4',
    poster: 'uploads/thumbnails/liftgo-gradezni-materijali.jpg',
    category: 'Материјали',
    type: 'video',
  },
  {
    title: 'Преселби на станови и деловни простори',
    description: 'Качување и спуштање мебел без непотребно носење по скали.',
    video: 'uploads/videos/liftgo-preselbi.mp4',
    poster: 'uploads/thumbnails/liftgo-preselbi.jpg',
    category: 'Преселби',
    type: 'video',
  },
  {
    title: 'LiftGoMK на терен',
    description: 'Надворешен лифт до балкон на станбена зграда.',
    image: content.hero.image,
    category: 'Материјали',
    type: 'image',
  },
];
