import {
  fetchBlogPosts,
  fetchUserActivity,
  fetchUserRepos,
  fetchWakatimeStats,
  olderThanDays,
  parseDateTime,
  parseUserEvent,
  repeat,
  replaceString,
} from './utils.ts';
import config from './config.ts';
import { config as configEnv } from 'https://deno.land/std@0.172.0/dotenv/mod.ts';
import type {
  BlogPost,
  GithubRepository,
  UserActivity,
  WakatimeStats,
} from './types.d.ts';

export default class Generate {
  env!: Record<string, string>;
  userRepos!: GithubRepository[];
  userActivity!: UserActivity;
  wakatimeStats!: WakatimeStats['data'];
  placeholders!: Map<string, () => string>;
  blogPosts!: BlogPost[];

  async init() {
    this.env = await configEnv();

    if (!(this.env.GITHUB_TOKEN || Deno.env.get('GITHUB_TOKEN'))) {
      throw new Error('GITHUB_TOKEN not set in .env');
    }

    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN') || this.env.GITHUB_TOKEN;

    const fetchedData = await Promise.all([
      fetchUserRepos(GITHUB_TOKEN),
      fetchUserActivity(GITHUB_TOKEN),
      fetchWakatimeStats(),
      fetchBlogPosts(),
    ]);

    this.userRepos = fetchedData[0];
    this.userActivity = fetchedData[1];
    this.wakatimeStats = fetchedData[2];
    this.blogPosts = fetchedData[3];

    this.placeholders = new Map([
      ['skill_icons', this.parseSkillIcons],
      ['recent_repos', this.parseRecentRepos],
      ['top_repos', this.parseTopRepos],
      ['blog_posts', this.parseBlogPosts],
      ['user_activity', this.parseUserActivity],
      ['languages_graph', this.parseLanguagesGraph],
      ['music_activity', this.parseMusicActivity],
      ['updated_at', this.updatedMessage],
    ]);
  }

  fillTemplate(template: string) {
    try {
      for (const [key, fn] of this.placeholders) {
        template = replaceString(template, key, fn.bind(this)());
      }

      template = replaceString(template, 'title', config.content.title);
      template = replaceString(
        template,
        'description',
        config.content.description,
      );

      return template;
    } catch (e) {
      console.error('[Generate] Error filling template:', e);
      return undefined;
    }
  }

  private parseMusicActivity() {
    return `
<a href="https://github.com/kiosion/toru">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="${config.endpoints.music}&theme=nord">
    <source media="(prefers-color-scheme: light)" srcset="${config.endpoints.music}&theme=light">
    <img alt="Last.fm Activity" src="${config.endpoints.music}" height="115" />
  </picture>
</a>`;
  }

  private parseBlogPosts() {
    const lines = [] as string[];

    this.blogPosts.sort((a, b) => {
      const aDate = parseDateTime(a.date, 'yyyy-MM-dd');
      const bDate = parseDateTime(b.date, 'yyyy-MM-dd');

      return aDate > bDate ? -1 : aDate < bDate ? 1 : 0;
    })?.forEach((post) => {
      const {
        title,
        slug,
        desc,
        date,
      } = post;

      lines.push(
        `* [${title}](https://kio.dev/blog/${
          encodeURI(slug.current)
        }): ${desc}${date ? ` - ${date}` : ''}`,
      );
    });

    return lines.slice(0, config.limits.blogPosts).join('\n');
  }

  private parseRecentRepos() {
    const lines = [] as string[];

    this.userRepos.sort((a, b) => {
      const aDate = parseDateTime(a.updated_at, 'yyyy-MM-ddTHH:mm:ssZ');
      const bDate = parseDateTime(b.updated_at, 'yyyy-MM-ddTHH:mm:ssZ');

      return aDate > bDate ? -1 : aDate < bDate ? 1 : 0;
    })?.filter((repo) => {
      const { fork, archived, private: isPrivate, updated_at } = repo;
      return !(fork || archived || isPrivate ||
        olderThanDays(
          parseDateTime(updated_at, 'yyyy-MM-ddTHH:mm:ssZ'),
          config.limits.recentRepoDays,
        ));
    })?.forEach((repo) => {
      const {
        description,
        name,
        html_url: url,
        owner,
        stargazers_count: stars,
      } = repo;

      lines.push(
        `* [${owner.login}/${name}](${url})${
          description ? ` ${description}` : ''
        } ★${stars}`,
      );
    });

    return lines.slice(0, config.limits.recentRepos).join('\n');
  }

  private parseTopRepos() {
    const lines = [] as string[];

    this.userRepos.sort((a, b) => {
      const aStars = a.stargazers_count;
      const bStars = b.stargazers_count;

      return aStars > bStars ? -1 : aStars < bStars ? 1 : 0;
    })?.filter((repo) => {
      const { archived, private: isPrivate } = repo;
      return !(archived || isPrivate);
    })?.forEach((repo) => {
      const {
        owner,
        name,
        html_url: url,
        description,
        stargazers_count: stars,
      } = repo;

      lines.push(
        `* [${owner.login}/${name}](${
          encodeURI(url)
        }) ${description} ★${stars}`,
      );
    });

    return lines.slice(0, config.limits.topRepos).join('\n');
  }

  private parseSkillIcons() {
    const names = config.skillIcons;
    const baseUrl = new URL('https://skillicons.dev/icons');

    [['i', names.join(',')], ['perline', '9'], ['theme', 'light']].forEach((
      [key, value],
    ) => baseUrl.searchParams.append(key, value));

    return `![Skills](${baseUrl.toString()})`;
  }

  private parseUserActivity() {
    const lines = [] as string[];

    // First, sort the events by date - should be broken down into individual days
    const sortedEvents: Record<string, UserActivity> = {};

    this.userActivity.forEach((event) => {
      const { created_at, repo } = event;
      if (repo?.name && repo.name.indexOf('kiosion/kiosion') !== -1) {
        return;
      }

      const dateObject = parseDateTime(created_at, 'yyyy-MM-ddTHH:mm:ssZ');
      const dateString = `${
        dateObject.toLocaleString('default', {
          month: 'long',
        })
      } ${dateObject.getDate()}`;

      if (!sortedEvents[dateString]) {
        sortedEvents[dateString] = [];
      }

      if (event.type === 'PushEvent') {
        const { commits } = event.payload;

        const messagesToAdd = commits.map((commit) => commit.message);

        sortedEvents[dateString] = sortedEvents[dateString].filter((event) => {
          if (event.type !== 'PushEvent') {
            return true;
          }

          const { commits } = event.payload;

          if (commits.length > 1) {
            return true;
          }

          return !commits.some((commit) =>
            messagesToAdd.includes(commit.message)
          );
        });
      }

      sortedEvents[dateString].push(event);
    });

    // Then, parse each day's events and add them to the lines array
    // Before the first event, add a header for the day
    Object.keys(sortedEvents).forEach((date, index) => {
      if (index >= config.limits.userActivityMaxDays) {
        return;
      }

      const events = sortedEvents[date];

      lines.push(`\n#### ${date}`);

      // Maximum events per day, after which an "and X more" message is added
      events.forEach((event, index) => {
        if (index === config.limits.userActivityMaxEventsPerDay) {
          lines.push(`* ...and ${events.length - index} more`);
        }
        if (index >= config.limits.userActivityMaxEventsPerDay) {
          return;
        }

        const message = parseUserEvent(event);

        if (message) {
          lines.push(`* ${
            message
              .replace(/([*\-_])(?=[^`]*(?:`[^`]*`[^`]*)*$)/g, '\\$&')
              .replace(/[\n\r]/g, ' ')
          }`);
        }
      });
    });

    console.log('[Generate] Parsed recent activity:', lines);

    return lines.join('\n');
  }

  private parseLanguagesGraph() {
    const languages = this.wakatimeStats?.languages.filter((lang) => {
      return !config.languagesIgnore.includes(lang.name.toLowerCase());
    });

    if (!languages?.length) {
      console.error(
        '[Generate] No languages found for Wakatime languages graph',
      );
      return '';
    }

    const sortedLanguages = languages.sort((a, b) => {
      const aTime = a.total_seconds;
      const bTime = b.total_seconds;

      return aTime > bTime ? -1 : aTime < bTime ? 1 : 0;
    })?.slice(0, config.limits.languagesGraph);

    const lines = [] as string[];

    // Need to calculate the total time among all languages to calculate the percentages
    const totalGraphSeconds = sortedLanguages.reduce(
      (acc, lang) => acc + lang.total_seconds,
      0,
    );

    sortedLanguages.forEach((lang) => {
      const {
        name,
        total_seconds: totalSeconds,
        hours,
        minutes,
      } = lang;

      const percent = Math.round((totalSeconds / totalGraphSeconds) * 100);
      const scale = 24;
      const langName = name.length > 20 ? `${name.slice(0, 20)}...` : name;
      // Bar should account for scale
      const bar = `[${repeat('=', Math.round((percent / 100) * scale))}${
        repeat(' ', scale - Math.round((percent / 100) * scale))
      }]`;

      console.log('[Generate] Language graph item:', langName, percent);

      lines.push(
        `${langName}${
          repeat(' ', 20 - langName.length)
        }${bar} ${percent}% (${hours}h ${minutes}m)`,
      );
    });

    return lines.join('\n');
  }

  private updatedMessage() {
    const localeString = new Date().toLocaleString('en-CA', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false,
      timeZone: 'America/Halifax',
    });

    return `_Updated ${localeString}_`;
  }
}
