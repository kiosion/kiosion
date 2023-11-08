// deno-fmt-ignore-file
export default {
  endpoints: {
    blog: 'https://kio.dev/api/v1/get/post/many',
    githubRepos: 'https://api.github.com/users/kiosion/repos',
    githubEvents: 'https://api.github.com/users/kiosion/events',
    wakatime: 'https://wakatime.com/api/v1/users/kiosion/stats',
    music:
      'https://toru.kio.dev/api/v1/kiosion?blur&border_width=0&border_radius=26',
  },
  limits: {
    topRepos: 6,
    recentRepos: 6,
    blogPosts: 4,
    recentRepoDays: 30,
    languagesGraph: 12,
    userActivityMaxEventsPerDay: 4,
    userActivityMaxDays: 3,
    wakatimeTimeframe: 'all_time',
  },
  content: {
    title: `Hi there, I'm Maxim`,
    description: `I'm a full-stack software developer based out of Toronto working in Fintech. I like building stuff for the web.

I have a blog where I sometimes write about programming and things I find interesting - [kio.dev](https://kio.dev).
`
  },
  languagesIgnore: [
    'json',
    'yaml',
    'markdown',
    'shell',
    'batchfile',
    'other',
  ],
};
