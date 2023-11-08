import {
  fetchUserActivity,
  fetchWakatimeStats,
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
      fetchUserActivity(GITHUB_TOKEN),
      fetchWakatimeStats(),
    ]);

    this.userActivity = fetchedData[0];
    this.wakatimeStats = fetchedData[1];

    this.placeholders = new Map([
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
