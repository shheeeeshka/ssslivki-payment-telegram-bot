import mongoose from 'mongoose';
import { IUser } from '../types/User.js';

const UserSchema = new mongoose.Schema<IUser>({
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    isAdmin: { type: Boolean, default: false },
    hasAccess: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function () {
    this.set({ updatedAt: new Date() });
});

export const User = mongoose.model<IUser>('User', UserSchema);