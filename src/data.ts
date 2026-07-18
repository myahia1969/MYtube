import { Video, Comment, Channel, User } from './types';

export const INITIAL_CHANNELS: Channel[] = [];

export const INITIAL_VIDEOS: Video[] = [];

export const INITIAL_COMMENTS: Comment[] = [];

export const CURRENT_USER: User = {
  id: 'usr-current',
  username: 'user_channel',
  displayName: 'My Channel',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  email: 'myahia69@gmail.com',
};

