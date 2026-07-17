import React, { useState } from 'react';
import { 
  Database, FolderTree, Terminal, ShieldAlert, Copy, Check, 
  ExternalLink, Code, Layers, FileText, Server, AppWindow, Globe
} from 'lucide-react';

export default function DevConsole() {
  const [activeTab, setActiveTab] = useState<'sql' | 'tree' | 'client' | 'env' | 'deploy'>('sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sqlSchema = `-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR PRODUCTION YOUTUBE CLONE
-- Features: Users profiles, Videos list, Comments, Likes system, Channel Subscribers
-- Row Level Security (RLS) included!
-- ====================================================================

-- 1. PROFILES TABLE (linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. VIDEOS TABLE (metadata for streaming files)
CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- points to Supabase Storage bucket or MUX
  thumbnail_url TEXT NOT NULL,
  duration TEXT DEFAULT '00:00' NOT NULL,
  views_count BIGINT DEFAULT 0 NOT NULL,
  category TEXT DEFAULT 'All' NOT NULL,
  channel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COMMENTS TABLE
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. VIDEO LIKES TABLE (Composite unique key handles single like/dislike per user)
CREATE TYPE like_type AS ENUM ('like', 'dislike');

CREATE TABLE public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  type like_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, video_id)
);

-- 5. SUBSCRIBERS TABLE
CREATE TABLE public.subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- User who is subscribing
  channel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,    -- Channel creator being subscribed to
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(subscriber_id, channel_id),
  CONSTRAINT self_subscription_check CHECK (subscriber_id <> channel_id)
);

-- ====================================================================
-- INDEX OPTIMIZATION (Speeds up feeds, recommendations, and comments)
-- ====================================================================
CREATE INDEX idx_videos_channel ON public.videos(channel_id);
CREATE INDEX idx_videos_category ON public.videos(category);
CREATE INDEX idx_comments_video ON public.comments(video_id);
CREATE INDEX idx_likes_video ON public.likes(video_id);
CREATE INDEX idx_subscribers_channel ON public.subscribers(channel_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can edit their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Videos policies
CREATE POLICY "Videos are readable by everyone" ON public.videos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload videos" ON public.videos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = channel_id);

CREATE POLICY "Users can update their own videos" ON public.videos
  FOR UPDATE USING (auth.uid() = channel_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
  FOR DELETE USING (auth.uid() = channel_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);
`;

  const nextJsTree = `youtube-clone/
├── .env.local                 # Local environment secrets
├── package.json               # Next.js configurations & scripts
├── tailwind.config.ts         # Tailwind CSS styling parameters
├── tsconfig.json              # TypeScript compilation options
├── src/
│   ├── app/                   # Next.js App Router folders
│   │   ├── layout.tsx         # Root app layout & font configurations
│   │   ├── page.tsx           # Home Feed layout
│   │   ├── watch/[id]/        # Watch Page: dynamic video playback route
│   │   │   └── page.tsx       
│   │   ├── upload/            # Video Upload Page
│   │   │   └── page.tsx       
│   │   └── auth/              # Sign In & Registration landing
│   │       ├── login/
│   │       └── signup/
│   ├── components/            # Reusable UI component modules
│   │   ├── navbar.tsx         
│   │   ├── sidebar.tsx        
│   │   ├── video-player.tsx   # Advanced Custom HTML5 Player
│   │   ├── video-card.tsx     
│   │   ├── comments-section.tsx 
│   │   └── ui/                # Shadcn UI primitives (button, input, dialogue)
│   ├── lib/                   # Utility scripts & configurations
│   │   ├── supabase.ts        # Initialized Supabase JS client
│   │   └── utils.ts           
│   └── types/                 # Shared TypeScript Interfaces
│       └── database.types.ts  # Auto-generated database types
`;

  const envFile = `# 1. SUPABASE CONNECTION CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here"

# 2. SUPABASE SERVICE ROLE KEY (Keep secure, only server-side)
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# 3. VIDEO PROCESSING SETTINGS
# If using MUX API integrations for professional transcoding:
MUX_TOKEN_ID="your-mux-token-id"
MUX_TOKEN_SECRET="your-mux-token-secret"

# 4. APP PROTOCOL SETTINGS
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;

  const clientSetup = `// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variable configurations for Supabase client initialization.');
}

// Instantiate fully typed, production-ready Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
`;

  const installCommands = `# 1. Create a brand new Next.js project with App Router and TypeScript
npx create-next-app@latest youtube-clone --typescript --tailwind --eslint --app --src-dir

# 2. Enter workspace directory
cd youtube-clone

# 3. Install core backend, auth, and database SDK dependencies
npm install @supabase/supabase-js @supabase/ssr lucide-react zustand

# 4. Install Tailwind CSS & animation libraries (or Tailwind CSS v4)
npm install motion clsx tailwind-merge

# 5. Initialize Shadcn/ui configurations
npx shadcn-ui@latest init
# (Select Default style, Slate slate theme, and configure custom globals.css)

# 6. Add standard Shadcn component libraries for our interfaces
npx shadcn-ui@latest add button card dialog dropdown-menu input textarea slider progress
`;

  const vercelSteps = `1. **Configure local repo**:
   Ensure your local project is pushed to a Github/Gitlab repository.

2. **Sign In to Vercel**:
   Go to [Vercel](https://vercel.com) and click **Add New** -> **Project**.

3. **Import Repo**:
   Authorize access to your GitHub account and import your \`youtube-clone\` repository.

4. **Inject Environment Variables**:
   Under the **Environment Variables** accordion, copy and paste the values from your local \`.env.local\`:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`MUX_TOKEN_ID\` (if using Mux stream)

5. **Deploy**:
   Click **Deploy**. Vercel will bundle static folders, run Next.js edge builds, and serve your app securely over HTTPS.

6. **Update Supabase Redirects**:
   In your Supabase project panel under **Auth -> URL Configuration**:
   - Set **Site URL** to your newly generated Vercel production link (e.g., \`https://youtube-clone.vercel.app\`).
   - Add \`https://youtube-clone.vercel.app/auth/callback\` to the redirect wildcards.
`;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-[#0f0f0f] font-sans space-y-6">
      
      {/* Visual Hub Title Card */}
      <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="absolute right-0 top-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-mono border border-red-200 font-bold uppercase tracking-widest">
              Phase 1 Deliverable
            </span>
            <h1 className="font-sans font-bold text-2xl text-gray-900 tracking-tight mt-1">
              Supabase Database Schema & Next.js Blueprint
            </h1>
          </div>
        </div>
        <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
          Welcome to the System Architect Console. This page hosts your complete, copy-paste-ready technical specifications for building and deploying this YouTube Clone into production using Next.js, Tailwind v4, and Supabase PostgreSQL.
        </p>
      </div>

      {/* Tabs navigation bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sql'
              ? 'border-red-600 bg-red-50/50 text-red-600'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          PostgreSQL Database Schema
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'tree'
              ? 'border-red-600 bg-red-50/50 text-red-600'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Recommended Folders Directory
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'client'
              ? 'border-red-600 bg-red-50/50 text-red-600'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Next.js Setup & Supabase Client
        </button>

        <button
          onClick={() => setActiveTab('env')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'env'
              ? 'border-red-600 bg-red-50/50 text-red-600'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Environment Configuration (.env.local)
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'deploy'
              ? 'border-red-600 bg-red-50/50 text-red-600'
              : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Vercel Deployment Guides
        </button>
      </div>

      {/* Selected Tab content pane */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden p-5 shadow-sm">
        
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-sans font-bold text-sm text-gray-900">PostgreSQL SQL Editor Blueprint</span>
              </div>
              <button
                onClick={() => handleCopy(sqlSchema, 'sql')}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedKey === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Run this script in the **Supabase SQL Editor** panel. It pre-seeds the tables for profiles, streaming video records, channel subscribers, like counts, and comments, optimizing performance via secondary composite indices.
            </p>

            <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-gray-800 overflow-x-auto max-h-[500px]">
              <code>{sqlSchema}</code>
            </pre>
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-amber-600" />
                <span className="font-sans font-bold text-sm text-gray-900">Next.js App Router Structure</span>
              </div>
              <button
                onClick={() => handleCopy(nextJsTree, 'tree')}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedKey === 'tree' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied Structure!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Tree</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              We recommend the following Next.js 14+ (App Router) project template directory. It clearly segregates dynamic route handlers from modular React components and initialized backend client libraries.
            </p>

            <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-gray-800 overflow-x-auto">
              <code>{nextJsTree}</code>
            </pre>
          </div>
        )}

        {activeTab === 'client' && (
          <div className="space-y-5">
            {/* Command section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  Terminal CLI Installation
                </span>
                <button
                  onClick={() => handleCopy(installCommands, 'commands')}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedKey === 'commands' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied Commands!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-gray-800 overflow-x-auto">
                <code>{installCommands}</code>
              </pre>
            </div>

            <hr className="border-gray-150" />

            {/* Client file setup */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-indigo-600" />
                  Supabase Client Initializer File
                </span>
                <button
                  onClick={() => handleCopy(clientSetup, 'client')}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedKey === 'client' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied Client Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-indigo-900 overflow-x-auto">
                <code>{clientSetup}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'env' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="font-sans font-bold text-sm text-gray-900">Local Environment Configuration file (.env.local)</span>
              </div>
              <button
                onClick={() => handleCopy(envFile, 'env')}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedKey === 'env' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied variables!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Config</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Create a file named **.env.local** in the root of your Next.js folder, and paste the parameters below. Avoid checking this file into public GitHub directories.
            </p>

            <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-gray-800 overflow-x-auto">
              <code>{envFile}</code>
            </pre>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="font-sans font-bold text-sm text-gray-900">Vercel Deployment Step-By-Step</span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              We recommend using Vercel for instant static hosting, serverless functions, and SSL security. Follow these steps to deploy:
            </p>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans text-gray-700 leading-relaxed whitespace-pre-wrap">
              {vercelSteps}
            </div>
          </div>
        )}

      </div>

      {/* Safety check warning badge */}
      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-sans font-bold text-red-950 uppercase tracking-wider">Authentication callback warning:</h4>
          <p className="text-[11px] text-red-700 leading-relaxed">
            When users register or sign up via Supabase, ensure that your redirect links match exactly. Vercel utilizes unique deployment preview links that might fail standard redirects unless wildcard rules are appended inside **Supabase Auth Configuration** settings.
          </p>
        </div>
      </div>

    </div>
  );
}
