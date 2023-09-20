export type UserActivity = UserEvent[];

export type UserEvent =
  | UserEventGeneric<'CommitCommentEvent'> & {
    payload: {
      action: 'created';
      comment: GithubComment;
    };
  }
  | UserEventGeneric<'CreateEvent'> & {
    payload: {
      ref: string;
      ref_type: 'branch' | 'tag';
      master_branch: string;
      description: string;
    };
  }
  | UserEventGeneric<'DeleteEvent'> & {
    payload: {
      ref: string;
      ref_type: 'branch' | 'tag';
    };
  }
  | UserEventGeneric<'ForkEvent'> & {
    payload: {
      forkee: GithubRepository;
    };
  }
  | UserEventGeneric<'GollumEvent'> & {
    payload: {
      pages: {
        page_name: string;
        title: string;
        action: 'created' | 'edited';
        sha: string;
        html_url: string;
      }[];
    };
  }
  | UserEventGeneric<'IssueCommentEvent'> & {
    payload: {
      action: 'created' | 'edited' | 'deleted';
      issue: GithubIssue;
      comment: GithubComment;
      changes?: {
        body: {
          from: string;
        };
      };
    };
  }
  | UserEventGeneric<'IssuesEvent'> & {
    payload: {
      action:
        | 'opened'
        | 'edited'
        | 'closed'
        | 'reopened'
        | 'assigned'
        | 'unassigned'
        | 'labeled'
        | 'unlabeled';
      issue: GithubIssue;
      changes?: {
        title: {
          from: string;
        };
        body: {
          from: string;
        };
      };
      assignee?: GithubUserGeneric<'User'>;
      label?: {
        name: string;
      };
    };
  }
  | UserEventGeneric<'MemberEvent'> & {
    payload: {
      action: 'added' | 'deleted';
      member: GithubUserGeneric<'User'>;
      changes?: {
        old_permission: {
          from: string;
        };
      };
    };
  }
  | UserEventGeneric<'PublicEvent'> & {
    payload: Record<string, string>;
  }
  | UserEventGeneric<'PullRequestEvent'> & {
    payload: {
      action:
        | 'opened'
        | 'edited'
        | 'closed'
        | 'reopened'
        | 'assigned'
        | 'unassigned'
        | 'review_requested'
        | 'review_request_removed'
        | 'labeled'
        | 'unlabeled'
        | 'synchronize';
      number: number;
      changes?: {
        title: {
          from: string;
        };
        body: {
          from: string;
        };
      };
      pull_request: GithubPullRequest;
      reason?: string;
    };
  }
  | UserEventGeneric<'PullRequestReviewEvent'> & {
    payload: {
      action: 'created';
      pull_request: GithubPullRequest;
      review: GithubReview;
    };
  }
  | UserEventGeneric<'PullRequestReviewCommentEvent'> & {
    payload: {
      action: 'created' | 'edited' | 'deleted';
      changes?: {
        body: {
          from: string;
        };
      };
      pull_request: GithubPullRequest;
      comment: GithubComment;
    };
  }
  | UserEventGeneric<'PullRequestReviewThreadEvent'> & {
    payload: {
      action: 'resolved' | 'unresolved';
      pull_request: GithubPullRequest;
      thread: unknown;
    };
  }
  | UserEventGeneric<'PushEvent'> & {
    payload: {
      push_id: number;
      size: number;
      distinct_size: number;
      ref: string;
      head: string;
      before: string;
      commits: GithubCommit[];
    };
  }
  | UserEventGeneric<'ReleaseEvent'> & {
    payload: {
      action: 'published' | 'edited';
      changes?: {
        body: {
          from: string;
        };
      };
      release: GithubRelease;
    };
  }
  | UserEventGeneric<'SponsorshipEvent'> & {
    payload: {
      action: 'created';
      effective_date: string;
      changes?: {
        tier: {
          from: unknown;
        };
        privacy_level: {
          from: unknown;
        };
      };
    };
  }
  | UserEventGeneric<'WatchEvent'> & {
    // Confusingly named, this denotes a 'star' event
    payload: {
      action: 'started';
    };
  };

interface UserEventGeneric<T extends UserEventType> {
  id: string;
  type: T;
  actor: {
    id: number;
    login: string;
    display_login: string;
    gravatar_id: string;
    url: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  repository: {
    id: number;
    name: string;
    url: string;
  };
  public: boolean;
  created_at: string;
  org: {
    id: number;
    login: string;
    gravatar_id: string;
    url: string;
    avatar_url: string;
  };
}

type UserEventType =
  | 'CommitCommentEvent'
  | 'CreateEvent'
  | 'DeleteEvent'
  | 'ForkEvent'
  | 'GollumEvent'
  | 'IssueCommentEvent'
  | 'IssuesEvent'
  | 'MemberEvent'
  | 'PublicEvent'
  | 'PullRequestEvent'
  | 'PullRequestReviewEvent'
  | 'PullRequestReviewCommentEvent'
  | 'PullRequestReviewThreadEvent'
  | 'PushEvent'
  | 'ReleaseEvent'
  | 'SponsorshipEvent'
  | 'WatchEvent';

interface GithubRelease {
  url: string;
  html_url: string;
  assets_url: string;
  upload_url: string;
  tarball_url: string;
  zipball_url: string;
  discussion_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: GithubUserGeneric<'User'>;
  assets: {
    url: string;
    browser_download_url: string;
    id: number;
    node_id: string;
    name: string;
    label: string;
    state: 'uploaded' | 'deleted';
    content_type: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    uploader: GithubUserGeneric<'User'>;
  }[];
}

interface GithubCommit {
  url: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  message: string;
  sha: string;
  distinct: boolean;
}

interface GithubReview {
  id: number;
  node_id: string;
  user: GithubUserGeneric<'User'>;
  body: string;
  state: 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED';
  html_url: string;
  pull_request_url: string;
  _links: {
    html: {
      href: string;
    };
    pull_request: {
      href: string;
    };
  };
  submitted_at: string;
  commit_id: string;
  author_association:
    | 'OWNER'
    | 'COLLABORATOR'
    | 'CONTRIBUTOR'
    | 'FIRST_TIMER'
    | 'FIRST_TIME_CONTRIBUTOR'
    | 'MANNEQUIN'
    | 'MEMBER'
    | 'NONE';
}

interface GithubPullRequest {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: GithubUserGeneric<'User'>;
  body: string;
  labels: {
    id: number;
    node_id: string;
    url: string;
    name: string;
    description: string;
    color: string;
    default: boolean;
  }[];
  milestone: {
    url: string;
    html_url: string;
    labels_url: string;
    id: number;
    node_id: string;
    number: number;
    state: 'open' | 'closed';
    title: string;
    description: string;
    creator: GithubUserGeneric<'User'>;
    open_issues: number;
    closed_issues: number;
    created_at: string;
    updated_at: string;
    closed_at: string;
    due_on: string;
  };
  active_lock_reason: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
  merged_at: string;
  merge_commit_sha: string;
  assignee: GithubUserGeneric<'User'>;
  assignees: GithubUserGeneric<'User'>[];
  requested_reviewers: GithubUserGeneric<'User'>[];
  requested_teams: {
    id: number;
    node_id: string;
    url: string;
    name: string;
    slug: string;
    description: string;
    privacy: 'secret' | 'closed';
    permission: 'pull' | 'push' | 'admin';
    members_url: string;
    repositories_url: string;
  }[];
  head: {
    label: string;
    ref: string;
    sha: string;
    user: GithubUserGeneric<'User'>;
    repo: GithubRepository;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: GithubUserGeneric<'User'>;
    repo: GithubRepository;
  };
  _links: {
    self: {
      href: string;
    };
    html: {
      href: string;
    };
    issue: {
      href: string;
    };
    comments: {
      href: string;
    };
    review_comments: {
      href: string;
    };
    review_comment: {
      href: string;
    };
    commits: {
      href: string;
    };
    statuses: {
      href: string;
    };
  };
  author_association: string;
  draft: boolean;
}

interface GithubIssue {
  id: number;
  node_id: string;
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string;
  actor: GithubUserGeneric<'User' | 'Organization'>;
  event: string;
  commit_id: string;
  commit_url: string;
  created_at: string;
}

interface GithubComment {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  body: string;
  user: GithubUserGeneric<'User' | 'Organization'>;
  created_at: string;
  updated_at: string;
  issue_url: string;
  author_association: string;
  commit_id?: string;
}

interface GithubUserGeneric<T extends GithubUserType> {
  login: string;
  id: number;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: T;
  site_admin: boolean;
}

type GithubUserType = 'User' | 'Organization';

export interface BlogPost extends SanityObject {
  title: string;
  tags: PostTag[];
  slug: SanitySlug;
  publishedAt?: string;
  objectId: string;
  numberOfCharacters: number;
  estimatedWordCount: number;
  estimatedReadingTime: number;
  desc: string;
  date: string;
  body: PTBlock[];
  author: PTAuthor;
  _type: 'post';
}

interface PTBlock extends Omit<SanityObject, '_rev' | '_id'> {
  _type: 'block';
  _key: string;
  style: string;
  markDefs: Record<string, string>[];
  children: Record<string, string>[];
}

interface PTAuthor extends Omit<SanityObject, '_rev'> {
  _type: 'author';
  _id: 'me';
  slug: null;
  name: string;
  image: {
    asset: {
      _type: 'reference';
      _ref: string;
    };
    _type: 'image';
  };
}

interface PostTag extends Omit<SanityObject, '_type' | '_rev'> {
  title: string;
  slug: SanitySlug;
}

interface SanitySlug extends Omit<SanityObject, '_id' | '_rev'> {
  current: string;
}

interface SanityObject {
  _id: string;
  _type: string;
  _rev: string;
}

export interface GithubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GithubUserGeneric<'User' | 'Organization'>;
  html_url: string;
  description?: string | null;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  assignees_url: string;
  branches_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage?: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language?: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url?: null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license?: License | null;
  allow_forking: boolean;
  is_template: boolean;
  topics?: (string | null)[] | null;
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

export interface License {
  key: string;
  name: string;
  spdx_id: string;
  url?: string | null;
  node_id: string;
}

export interface WakatimeStats {
  data?: {
    total_seconds: number;
    human_readable_total: string;
    daily_average: number;
    human_readable_daily_average: string;
    categories: WakatimeCategoryStat[];
    projects: WakatimeProjectStat[];
    languages: WakatimeLanguageStat[];
    editors: WakatimeEditorStat[];
    best_day: {
      date: string;
      text: string;
      total_seconds: number;
    };
    range: string;
    human_readable_range: string;
    holidays: number;
    days_including_holidays: number;
    days_minus_holidays: number;
    status: string;
    percent_calculated: number;
    is_already_updating: boolean;
    is_coding_activity_visible: boolean;
    is_other_usage_visible: boolean;
    is_stuck: boolean;
    is_including_today: boolean;
    is_up_to_date: boolean;
    start: string;
    end: string;
    timezone: string;
    timeout: number;
    writes_only: boolean;
    user_id: string;
    username: string;
    created_at: string;
    modified_at: string;
  };
}

interface WakatimeEditorStat {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  hours: number;
  minutes: number;
  seconds: number;
}

interface WakatimeProjectStat {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  hours: number;
  minutes: number;
}

interface WakatimeCategoryStat {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  hours: number;
  minutes: number;
}

interface WakatimeLanguageStat {
  name: string;
  total_seconds: number;
  percent: number;
  digital: string;
  text: string;
  hours: number;
  minutes: number;
  seconds: number;
}
