import type { SiteConfig, ProfileConfig, LicenseConfig } from './types/config';
import type { FriendLink } from './types/friend';

export const siteConfig: SiteConfig = {
    title: 'Logos',
    subTitle: 'Blog',
    favicon: '/favicon/favicon.ico',
    pageSize: 6,
    toc: { enable: true, depth: 3 },
    blogNavi: { enable: true },
    comments: { enable: false, platform: 'default', backendUrl: '' },
    statistics: { views: { enable: false } },
    theme: { AOS: true, LQIP: true, PhotoSwipe: true },
};

export const profileConfig: ProfileConfig = {
    avatar: '/avatar.svg',
    name: 'Logos',
    description: '记录学习与生活',
    motto: '欢迎来到我的博客',
    indexPage: '/',
    startYear: 2026,
    links: [],
};

export const licenseConfig: LicenseConfig = {
    enable: true,
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
};

export const friendLinkConfig: FriendLink[] = [];
