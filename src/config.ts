export default {
  endpoints: {
    blog: 'https://kio.dev/api/v1/get/post/many',
    githubRepos: 'https://api.github.com/users/kiosion/repos',
    githubEvents: 'https://api.github.com/users/kiosion/events',
    wakatime: 'https://wakatime.com/api/v1/users/kiosion/stats',
    music: 'https://toru.kio.dev/api/v1/kiosion?blur&border_width=0',
  },
  limits: {
    topRepos: 6,
    recentRepos: 6,
    blogPosts: 4,
    recentRepoDays: 30,
    languagesGraph: 14,
    userActivityMaxEventsPerDay: 4,
    userActivityMaxDays: 3,
    wakatimeTimeframe: 'all_time',
  },
  content: {
    title: 'Hi there, I\'m Maxim 👋',
    description:
      'Full-stack developer, tech enthusiast, and creative polymath hailing from the Great White North (Canada) :)',
  },
  skillIcons: [
    'js',
    'ts',
    'scss',
    'ember',
    'svelte',
    'react',
    'deno',
    'java',
    'python',
    'rust',
    'ruby',
    'elixir',
    'haskell',
    'bsd',
    'linux',
    'docker',
    'postgres',
    'cassandra',
  ],
  languagesIgnore: [
    'json',
    'yaml',
    'markdown',
    'shell',
    'batchfile',
    'other',
  ],
};
