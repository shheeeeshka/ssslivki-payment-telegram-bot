import mongoose from 'mongoose';
import { IVideo } from '../types/Video.js';

const VideoSchema = new mongoose.Schema<IVideo>({
    name: { type: String, required: true },
    fileId: { type: String, required: true },
    fileSize: Number,
    duration: Number,
    mimeType: String,
    createdAt: { type: Date, default: Date.now }
});

export const Video = mongoose.model<IVideo>('Video', VideoSchema);