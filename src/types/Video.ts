export interface IVideo {
    _id: string;
    name: string;
    fileId: string;
    fileSize?: number;
    duration?: number;
    mimeType?: string;
    createdAt: Date;
}