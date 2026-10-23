export type SiteConfig = {
    title: string;
    subTitle: string;

    favicon: string;

    pageSize: number;
    toc: {
        enable: boolean;
        depth: number;
    };
    blogNavi: {
        enable: boolean;
    };
    comments: {
        enable: boolean;
        platform: string;
        backendUrl: string;
    };
    statistics: {
        views: {
            enable: boolean;
        };
    };
    theme: {
        AOS: boolean;
        LQIP: boolean;
        PhotoSwipe: boolean;
    }
}

export type ProfileLink = {
    name: string;
    url: string;
    icon: string;     // iconify icon name, e.g. "fa6-brands:github"
    color?: string;   // optional hover color (CSS color value)
    copyable?: boolean; // if true, clicking copies url to clipboard (for email etc.)
    qrCode?: string;  // optional QR code image path, shown on hover
};

export type ProfileConfig = {
    avatar: string;
    name: string;
    description: string;
    motto?: string;    // short tagline shown under name
    indexPage?: string;
    startYear: number;
    links?: ProfileLink[];
}

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};