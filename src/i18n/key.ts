export interface Translation {
    header: {
        home: string;
        archive: string;
        tech: string;
        bookReview: string;
        bookshelf: string;
        articles: string;
        harnessKit: string;
        about: string;
        friends: string;
    };
    cover: {
        title: {
            home: string;
            archive: string;
            tech: string;
            bookReview: string;
            bookshelf: string;
            articles: string;
            harnessKit: string;
            about: string;
            friends: string;
        };
        subTitle: {
            home: string;
            archive: string;
            tech: string;
            bookReview: string;
            bookshelf: string;
            articles: string;
            articlesCount: string;
            harnessKit: string;
            about: string;
            friends: string;
        };
    };
    toc:string;
    tag: string;
    pageNavigation: {
        previous: string;
        next: string;
        currentPage: string;
    };
    button: {
        switchDarkMode: string;
        backToTop: string;
        backToBottom: string;
        meun: string;
        toc: string;
        backToComments: string;
    }
    search: {
        placeholder: string;
        noresult: string;
        error: string;
    };
    license: {
        author: string;
        license: string;
        publishon: string;
    };
    blogNavi: {
        next: string;
        prev: string;
    },
    pagecard: {
        words: string;
        minutes: string;
        uncategorized: string;
        pinned: string;
        views: string;
    }
    comments: {
        name: string;
        email: string;
        site: string;
        required: string;
        optional: string;
        welcome: string;
        comments: string;
        cancel: string;
        send: string;
        sending: string;
        reply: string;
        replyPlaceholder: string;
        loadMore: string;
        loading: string;
        loadFailed: string;
        submitSuccess: string;
        submitFailed: string;
        verificationRequired: string;
        fillRequired: string;
        confirmDelete: string;
        delete: string;
        deleteSuccess: string;
        deleteFailed: string;
        deleteError: string;
        characters: string;
        words: string;
        contentTooLong: string;
        replyTo: string;
        write: string;
        preview: string;
        previewError: string;
        codeFence: string;
        inlineCode: string;
        bold: string;
        italic: string;
        quote: string;
        code: string;
        link: string;
        image: string;
        list: string;
        showMoreReplies: string;
        collapseReplies: string;
    },
    langNote: {
        note: string;
        description: string;
    },
    draftNote: {
        warning: string;
        description: string;
    },
    page404: {
        title: string;
        subTitle: string;
        backToHome: string;
        backToPreview: string;
        errorCode: string;
        notice: string;
    },
    bookshelf: {
        searchPlaceholder: string;
        filterTag: string;
        filterRating: string;
        ratingRecommended: string;
        ratingNeutral: string;
        ratingNotRecommended: string;
        ratingAll: string;
        tagAll: string;
        close: string;
        readDate: string;
        readTime: string;
        year: string;
        author: string;
        summary: string;
        reviewArticle: string;
        briefComment: string;
        noResults: string;
        noReview: string;
        readReview: string;
        statsRead: string;
        statsRecommended: string;
        statsDomains: string;
    };
    bookReview: {
        relatedBook: string;
        reviewCount: string;
    };
    themeInfo: {
        light: string;
        dark: string;
        system: string;
    },
    profileCard: {
        title: string;
        contact: string;
        copy: string;
        copySuccess: string;
        copyFailed: string;
    },
    column: {
        title: string;
        articleCount: string;
        noColumns: string;
        backToList: string;
        series: string;
    },
    siteStats: {
        articles: string;
        heroSentence: string;
        runningDays: string;
        runningYears: string;
        totalVisits: string;
    },
    articles: {
        noResults: string;
        viewMode: string;
        viewCard: string;
        viewCompact: string;
    };
    harness: {
        searchPlaceholder: string;
        filterType: string;
        typeAll: string;
        empty: string;
        emptyHint: string;
        noResults: string;
        docs: string;
        types: {
            skill: string;
            command: string;
            agent: string;
            mcp: string;
            prompt: string;
            workflow: string;
            other: string;
        };
    };
}