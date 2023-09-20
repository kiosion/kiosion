import config from './config.ts';
export { parse as parseDateTime } from 'https://deno.land/std@0.95.0/datetime/mod.ts';
import type {
  BlogPost,
  GithubRepository,
  UserActivity,
  UserEvent,
  WakatimeStats,
} from './types.d.ts';

export const replaceString = (template: string, key: string, value: string) =>
  template.replaceAll(`{{${key}}}`, value);

export const repeat = (str: string, n: number) =>
  new Array(Math.floor(n) + 1).join(str);

export const olderThanDays = (date: Date, days: number) =>
  (new Date().getTime() - date.getTime()) > (days * 24 * 60 * 60 * 1000);

export const fetchUserRepos = async (token: string) => {
  const userRepos = await attemptFetch<GithubRepository[]>(
    `${config.endpoints.githubRepos}?per_page=100`,
    {
      init: {
        headers: {
          'Authorization': `token ${token}`,
        },
      },
    },
  );

  if (!userRepos) {
    throw new Error('Could not fetch user repos');
  }

  return userRepos;
};

export const fetchUserActivity = async (token: string) => {
  const userActivity = await attemptFetch<UserActivity>(
    `${config.endpoints.githubEvents}?per_page=100`,
    {
      init: {
        headers: {
          'Authorization': `token ${token}`,
        },
      },
    },
  );

  if (!userActivity) {
    throw new Error('Could not fetch user activity');
  }

  return userActivity;
};

const attemptFetch = async <T>(
  url: string,
  { init = undefined, maxAttempts = 4 }: {
    init?: RequestInit;
    maxAttempts?: number;
  } = {},
): Promise<T | undefined> => {
  let attempts = 0;
  let jsonData: T | undefined;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      jsonData = await fetch(url, init || {}).then((res) => res.json());

      if (
        !jsonData || (jsonData as unknown as Record<string, string>)?.message ||
        (jsonData as unknown as Record<string, string>)?.error
      ) {
        throw new Error('Invalid fetch response');
      }
    } catch (e) {
      console.error('[Fetch] Error fetching data:', e);
    }
  }
  return jsonData;
};

export const fetchWakatimeStats = async () => {
  const res = await attemptFetch<WakatimeStats>(
    `${config.endpoints.wakatime}/${config.limits.wakatimeTimeframe}`,
  );
  if (!res?.data) {
    throw new Error('Invalid response from Wakatime API');
  }
  return res.data;
};

export const fetchBlogPosts = async () => {
  const res = await attemptFetch<{ data: BlogPost[] }>(
    `${config.endpoints.blog}?limit=${config.limits.blogPosts}`,
  );
  if (!res?.data?.length) {
    throw new Error('Invalid response from blog API');
  }
  return res.data;
};

export const getMarkdownLineLength = (md: string) => {
  return md
    .replace(/\[[^\]]*\]\(.*?\)/g, (match: string) =>
      match
        .replace(/\(.*?\)/, '')
        .replace(/[\[\]]/g, ''))
    .replace(/`/g, '')
    .replace(/[#*_]/g, '')
    .length;
};

export const parseUserEvent = (event: UserEvent) => {
  const { type, payload, repo, public: isPublic } = event;
  const repoUrl = `https://github.com/${
    repo.url.replace('https://api.github.com/repos/', '')
  }`;

  let message: string | undefined;

  switch (type) {
    case 'PushEvent': {
      const commits = payload.commits.length;

      if (!isPublic) {
        message = `Pushed ${commits === 1 ? 'a' : commits} commit${
          commits === 1 ? '' : 's'
        } to a private repository`;
        break;
      }

      if (commits > 1) {
        message = `Pushed ${commits} commits to branch \`${
          payload.ref.replace('refs/heads/', '')
        }\` in [\`${repo.name}\`](${repoUrl})`;
        break;
      }

      message =
        `Pushed [a commit](${repoUrl}/commit/${payload.head}) to branch \`${
          payload.ref.replace('refs/heads/', '')
        }\` in [\`${repo.name}\`](${repoUrl})`;

      const firstCommit = payload.commits[0];

      if (!firstCommit?.message) {
        break;
      }

      const maxLineLength = 100;
      const messageLength = getMarkdownLineLength(message);

      let description = firstCommit.message;

      if (messageLength + firstCommit.message.length + 6 > maxLineLength) {
        if (maxLineLength - messageLength < 12) {
          break;
        }
        description = `${
          // 3 for the ellipsis, 6 for the spaces at start and colon at end
          firstCommit.message.slice(
            0,
            maxLineLength - messageLength - 3 - 6,
          )}...`;
      }

      description && (message += `: ${description}`);
      break;
    }
    case 'CreateEvent':
      message = isPublic
        ? `Created ${payload.ref_type} \`${payload.ref}\` in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : `Created a ${payload.ref_type} in a private repository`;
      break;
    case 'DeleteEvent':
      message = isPublic
        ? `Deleted ${payload.ref_type} \`${payload.ref}\` in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : `Deleted a ${payload.ref_type} in a private repository`;
      break;
    case 'IssuesEvent':
      message = isPublic
        ? `Opened issue [#${payload.issue.number}](${payload.issue.html_url}) in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Opened an issue in a private repository';
      break;
    case 'IssueCommentEvent': {
      const isPR = payload.issue.html_url.indexOf('/pull/') !== -1;

      if (isPR) {
        message = isPublic
          ? `Commented on pull request [#${payload.issue.number}](${payload.issue.html_url}) in [\`${repo.name}\`](${repoUrl})`
          : 'Commented on a pull request in a private repository';
        break;
      }

      message = isPublic
        ? `Commented on issue [#${payload.issue.number}](${payload.issue.html_url}) in [\`${repo.name}\`](${repoUrl})`
        : 'Commented on an issue in a private repository';
      break;
    }
    case 'PullRequestEvent':
      message = isPublic
        ? `${payload.action.charAt(0).toUpperCase()}${
          payload.action.slice(1)
        } pull request [#${payload.number}](${payload.pull_request.html_url}) in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : `${payload.action.charAt(0).toUpperCase()}${
          payload.action.slice(1)
        } a pull request in a private repository`;
      break;
    case 'PullRequestReviewEvent':
      message = isPublic
        ? `Reviewed pull request [#${payload.pull_request.number}](${payload.pull_request.html_url}) in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Reviewed a pull request in a private repository';
      break;
    case 'PullRequestReviewCommentEvent':
      message = isPublic
        ? `Commented on pull request [#${payload.pull_request.number}](${payload.pull_request.html_url}) in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Commented on a pull request in a private repository';
      break;
    case 'PullRequestReviewThreadEvent':
      message = isPublic
        ? `Commented on pull request [#${payload.pull_request.number}](${payload.pull_request.html_url}) in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Commented on a pull request thread in a private repository';
      break;
    case 'WatchEvent':
      message = isPublic
        ? `Starred [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Starred a private repository';
      break;
    case 'ForkEvent':
      message = isPublic
        ? `Forked [\`${payload.forkee.name}\`](${payload.forkee.html_url})`
        : 'Forked a private repository';
      break;
    case 'ReleaseEvent':
      message = isPublic
        ? `Created release "${payload.release.name}" in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Created a release in a private repository';
      break;
    case 'PublicEvent':
      message = `Made [\`${repo.name}\`](https://github.com/${
        repo.url.replace('https://api.github.com/repos/', '')
      }) public`;
      break;
    case 'GollumEvent':
      message = isPublic
        ? `Updated wiki page${
          ` ${payload.pages[0].page_name} ` ?? ''
        }in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Updated a wiki page in a private repository';
      break;
    case 'CommitCommentEvent':
      message = isPublic
        ? `Commented [on a commit](${payload.comment.html_url}) in [\`${repo.name}\`](https://github.com/${
          repo.url.replace('https://api.github.com/repos/', '')
        })`
        : 'Commented on a commit in a private repository';
      break;
  }

  return message || undefined;
};
