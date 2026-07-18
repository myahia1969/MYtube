export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
}

export interface Channel {
  id: string;
  name: string;
  avatarUrl: string;
  subscribersCount: number;
  isSubscribed?: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string; // e.g. "12:34"
  views: number;
  uploadedAt: string; // e.g. "2 hours ago" or date
  category: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  likes: number;
  dislikes: number;
  likeStatus: 'like' | 'dislike' | 'none';
}

export interface Comment {
  id: string;
  videoId: string;
  userName: string;
  userAvatar: string;
  content: string;
  uploadedAt: string;
  likes: number;
}

export type Category = 'All' | 'Tech' | 'Design' | 'Nature' | 'Music' | 'Coding' | 'Gaming';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  videoIds: string[];
  createdAt: string;
}
