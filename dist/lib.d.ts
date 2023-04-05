export declare const HOST = "ftp.3gpp.org";
export declare function getSpec(spec: string, rel: string, quarter: string): Promise<{
    date: Date;
    name: string;
    type: import("basic-ftp").FileType;
    size: number;
    rawModifiedAt: string;
    modifiedAt?: Date | undefined;
    permissions?: import("basic-ftp").UnixPermissions | undefined;
    hardLinkCount?: number | undefined;
    link?: string | undefined;
    group?: string | undefined;
    user?: string | undefined;
    uniqueID?: string | undefined;
    path: string;
}[]>;
