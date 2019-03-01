export declare module BitBucketApi {

    export interface Self {
        href: string;
    }

    export interface DownloadLink {
        self: Self;
    }

    export interface Self2 {
        href: string;
    }

    export interface Html {
        href: string;
    }

    export interface Avatar {
        href: string;
    }

    export interface Links2 {
        self: Self2;
        html: Html;
        avatar: Avatar;
    }

    export interface User {
        username: string;
        display_name: string;
        account_id: string;
        links: Links2;
        nickname: string;
        type: string;
        uuid: string;
    }

    export interface Build {
        name: string;
        links: DownloadLink;
        downloads: number;
        created_on: Date;
        user: User;
        type: string;
        size: number;
    }

    export interface Response {
        pagelen: number;
        values: Build[];
        page: number;
        size: number;
    }

}
