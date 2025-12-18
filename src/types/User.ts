export interface IUser {
    _id: string;
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    isAdmin: boolean;
    hasAccess: boolean;
    createdAt: Date;
    updatedAt: Date;
}