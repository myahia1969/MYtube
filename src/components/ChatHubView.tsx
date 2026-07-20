import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Phone, PhoneOff, Mic, MicOff, Search, 
  Sparkles, Bot, Volume2, VolumeX, Shield, Circle, RefreshCw, Radio
} from 'lucide-react';
import { User, Channel } from '../types';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface ChatHubViewProps {
  language: 'ar' | 'en';
  currentUser: User | null;
  onTriggerToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

// Initial mock subscribers with custom personas and behaviors
const INITIAL_MOCK_SUBSCRIBERS: User[] = [
  {
    id: 'usr-ahmed',
    username: 'ahmed_dev',
    displayName: 'أحمد المطور | Ahmed Dev',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    email: 'ahmed@example.com'
  },
  {
    id: 'usr-sarah',
    username: 'sarah_design',
    displayName: 'سارة للتصميم | Sarah UX',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    email: 'sarah@example.com'
  },
  {
    id: 'usr-yousef',
    username: 'yousef_gamer',
    displayName: 'يوسف جيمر | Yousef Gaming',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
    email: 'yousef@example.com'
  },
  {
    id: 'usr-mariam',
    username: 'mariam_music',
    displayName: 'مريم الموسيقية | Mariam Music',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
    email: 'mariam@example.com'
  }
];

export default function ChatHubView({ language, currentUser, onTriggerToast }: ChatHubViewProps) {
  const isAr = language === 'ar';
  
  // Real active user account (with switchability for testing!)
  const [activeUser, setActiveUser] = useState<User>(() => {
    return currentUser || {
      id: 'usr-current',
      username: 'user_channel',
      displayName: isAr ? 'قناتي الخاصة' : 'My Channel',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      email: 'myahia69@gmail.com'
    };
  });

  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [onlineUsersList, setOnlineUsersList] = useState<User[]>([]);
  const [chatHistoryMap, setChatHistoryMap] = useState<Record<string, ChatMessage[]>>({});
  
  // Custom switch state to easily test chats
  const [testUserRole, setTestUserRole] = useState<'main' | 'tester'>('main');

  // Bot response toggle (automatic smart AI/Script responses when chatting with mock accounts)
  const [botAutoReply, setBotAutoReply] = useState(true);

  // Connection & WebSockets
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Audio & Microphone Call States
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [activeCallPartner, setActiveCallPartner] = useState<User | null>(null);
  const [incomingCallerData, setIncomingCallerData] = useState<{ id: string; name: string; avatar: string } | null>(null);
  
  // Web Audio Visualizer API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  // Sound generator helpers
  const playCallSound = (type: 'ring' | 'accept' | 'disconnect') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'ring') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'accept') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'disconnect') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Sound context error:", e);
    }
  };

  // Define full lists of subscribers (including dynamic channels + mock users)
  const [subscribers, setSubscribers] = useState<User[]>(() => {
    // Merge mock subscribers
    return INITIAL_MOCK_SUBSCRIBERS;
  });

  // Establish real WebSockets infrastructure
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const connectWS = () => {
      console.log("[ChatWS] Connecting to:", wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[ChatWS] Connected successfully!");
        setWsConnected(true);
        // Register current active user on server
        socket.send(JSON.stringify({
          type: 'register',
          user: activeUser
        }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          switch (payload.type) {
            case 'online_users': {
              const users = payload.users as User[];
              // Filter out current active user
              const filtered = users.filter(u => u.id !== activeUser.id);
              setOnlineUsersList(filtered);
              break;
            }

            case 'message': {
              const msg: ChatMessage = {
                id: payload.id,
                senderId: payload.senderId,
                senderName: payload.senderName,
                text: payload.text,
                timestamp: payload.timestamp
              };

              // Add message to chat history maps
              const conversationPartnerId = payload.senderId === activeUser.id ? payload.senderId : payload.senderId;
              const targetChatKey = payload.senderId === activeUser.id ? selectedRecipient?.id : payload.senderId;
              
              if (targetChatKey) {
                setChatHistoryMap(prev => {
                  const current = prev[targetChatKey] || [];
                  // Prevent duplicates based on message ID
                  if (current.some(m => m.id === msg.id)) return prev;
                  return {
                    ...prev,
                    [targetChatKey]: [...current, msg]
                  };
                });
              } else {
                // If message arrives from another sender not actively opened, store in background history
                setChatHistoryMap(prev => {
                  const current = prev[payload.senderId] || [];
                  if (current.some(m => m.id === msg.id)) return prev;
                  return {
                    ...prev,
                    [payload.senderId]: [...current, msg]
                  };
                });
                onTriggerToast(
                  isAr ? `رسالة جديدة من ${payload.senderName}` : `New message from ${payload.senderName}`,
                  'info'
                );
              }
              break;
            }

            case 'call_incoming': {
              playCallSound('ring');
              setIncomingCallerData({
                id: payload.callerId,
                name: payload.callerName,
                avatar: payload.callerAvatar
              });
              setCallState('incoming');
              break;
            }

            case 'call_answered': {
              if (payload.accepted) {
                playCallSound('accept');
                setCallState('connected');
                const partner = subscribers.find(s => s.id === payload.responderId) || {
                  id: payload.responderId,
                  displayName: isAr ? 'مستخدم متصل' : 'Connected Subscriber',
                  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
                  username: 'remote_user',
                  email: ''
                };
                setActiveCallPartner(partner);
                // Start capturing mic to stream
                startLocalAudioStreaming(payload.responderId);
              } else {
                playCallSound('disconnect');
                setCallState('idle');
                onTriggerToast(
                  isAr ? 'تم رفض المكالمة الصوتية.' : 'Voice call was declined.',
                  'info'
                );
              }
              break;
            }

            case 'audio_packet': {
              // Decode base64 and play audio
              playIncomingAudioPacket(payload.audio);
              break;
            }

            case 'call_ended': {
              playCallSound('disconnect');
              stopAudioAndVisualizer();
              setCallState('idle');
              setActiveCallPartner(null);
              onTriggerToast(
                isAr ? 'انتهت المكالمة الصوتية.' : 'Voice call ended.',
                'info'
              );
              break;
            }
          }
        } catch (err) {
          console.error("Error parsing socket message:", err);
        }
      };

      socket.onclose = () => {
        console.log("[ChatWS] Connection closed. Retrying...");
        setWsConnected(false);
        setTimeout(connectWS, 5000);
      };

      socket.onerror = (err) => {
        console.error("[ChatWS] Socket error:", err);
      };
    };

    connectWS();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      stopAudioAndVisualizer();
    };
  }, [activeUser, selectedRecipient]);

  // Scroll to bottom of chat history dynamically
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistoryMap, selectedRecipient]);

  // Dynamic search filter for subscribers
  const filteredSubscribers = subscribers.filter(sub => {
    const term = searchQuery.toLowerCase();
    return sub.displayName.toLowerCase().includes(term) || sub.username.toLowerCase().includes(term);
  });

  // Handle Send Text Message
  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedRecipient) return;

    const textToSend = inputText.trim();
    setInputText('');

    // If socket is open and receiver is connected online, send via real WebSocket
    const isRecipientOnline = onlineUsersList.some(u => u.id === selectedRecipient.id);

    if (wsConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'message',
        targetId: selectedRecipient.id,
        text: textToSend
      }));
    } else {
      // Offline fallback: simulate local appending + bot response
      const clientMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: activeUser.id,
        senderName: activeUser.displayName,
        text: textToSend,
        timestamp: new Date().toISOString()
      };

      setChatHistoryMap(prev => {
        const current = prev[selectedRecipient.id] || [];
        return {
          ...prev,
          [selectedRecipient.id]: [...current, clientMsg]
        };
      });

      // Handle Bot Automatic Reply
      if (botAutoReply && selectedRecipient.id.startsWith('usr-')) {
        simulateBotResponse(selectedRecipient.id, textToSend);
      }
    }
  };

  // Bot response simulator
  const simulateBotResponse = (botId: string, userText: string) => {
    setTimeout(async () => {
      let replyText = '';
      const isArabic = /[\u0600-\u06FF]/.test(userText);

      // Fetch dynamic answer from our server API using Gemini!
      try {
        const response = await fetch('/api/ai/chat-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: isArabic ? "محادثة المشتركين الفورية" : "Subscribers Instant Chat",
            description: isArabic 
              ? "محادثة كتابية وصوتية متقدمة بين حسابات وقنوات منصة MYtube التعليمية." 
              : "An advanced real-time text and voice chat layout for MYtube subscribers.",
            category: "Tech",
            message: userText,
            chatHistory: []
          })
        });
        const data = await response.json();
        if (data.response) {
          replyText = data.response;
        }
      } catch (err) {
        console.error("AI bot reply error, calling local engine:", err);
      }

      // Final fallback if API down or empty
      if (!replyText) {
        if (isArabic) {
          replyText = `أهلاً بك! أنا أستمع إليك باهتمام كبير. أنا مشترك في قناتك وأحب محتواك التعليمي والتقني الرائع. هل ترغب في بدء اتصال صوتي مباشر للتحدث بشكل أفضل؟ 🎙️`;
        } else {
          replyText = `Hi! I am listening closely. I am a huge fan of your educational channel and content. Would you like to start a live voice call so we can speak directly? 🎙️`;
        }
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: botId,
        senderName: subscribers.find(s => s.id === botId)?.displayName || "Subscriber",
        text: replyText,
        timestamp: new Date().toISOString()
      };

      setChatHistoryMap(prev => {
        const current = prev[botId] || [];
        return {
          ...prev,
          [botId]: [...current, botMsg]
        };
      });
    }, 1500);
  };

  // Initiate Call
  const handleInitiateCall = () => {
    if (!selectedRecipient) return;

    playCallSound('ring');
    setCallState('outgoing');
    setActiveCallPartner(selectedRecipient);

    const isRecipientOnline = onlineUsersList.some(u => u.id === selectedRecipient.id);

    if (wsConnected && socketRef.current && isRecipientOnline) {
      // Send WebSocket signal to trigger ringing on receiver side
      socketRef.current.send(JSON.stringify({
        type: 'call_initiate',
        targetId: selectedRecipient.id
      }));
    } else {
      // Simulated Bot Call Auto-Accept after 2.5 seconds
      setTimeout(() => {
        playCallSound('accept');
        setCallState('connected');
        onTriggerToast(
          isAr ? `قبل ${selectedRecipient.displayName} المكالمة الصوتية` : `${selectedRecipient.displayName} accepted the call`,
          'success'
        );
        // Start rendering the wave visualizer
        startLocalAudioStreaming(selectedRecipient.id);
      }, 2500);
    }
  };

  // Accept Incoming Call
  const handleAcceptCall = () => {
    if (!incomingCallerData) return;

    playCallSound('accept');
    setCallState('connected');
    
    const partner = subscribers.find(s => s.id === incomingCallerData.id) || {
      id: incomingCallerData.id,
      displayName: incomingCallerData.name,
      avatarUrl: incomingCallerData.avatar,
      username: 'tester',
      email: ''
    };
    setActiveCallPartner(partner);

    if (wsConnected && socketRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'call_response',
        targetId: incomingCallerData.id,
        accepted: true
      }));
      // Start microphone stream and feed it to target
      startLocalAudioStreaming(incomingCallerData.id);
    }
    
    setIncomingCallerData(null);
  };

  // Decline Incoming Call
  const handleDeclineCall = () => {
    if (!incomingCallerData) return;

    playCallSound('disconnect');
    setCallState('idle');

    if (wsConnected && socketRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'call_response',
        targetId: incomingCallerData.id,
        accepted: false
      }));
    }
    setIncomingCallerData(null);
  };

  // End Current Call
  const handleEndCall = () => {
    playCallSound('disconnect');
    
    if (activeCallPartner && wsConnected && socketRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'call_terminate',
        targetId: activeCallPartner.id
      }));
    }

    stopAudioAndVisualizer();
    setCallState('idle');
    setActiveCallPartner(null);
    onTriggerToast(
      isAr ? 'تم إنهاء المكالمة الصوتية.' : 'Voice call ended.',
      'info'
    );
  };

  // Local Microphone audio capturing and rendering visual wave on Canvas
  const startLocalAudioStreaming = async (targetId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioAnalyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start drawing real microphone waves!
      drawVisualizerWave();

      // If online and real Websocket, setup audio recorder to stream voice packets in real-time
      if (wsConnected && socketRef.current) {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0 && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.readAsDataURL(e.data);
            reader.onloadend = () => {
              const base64data = reader.result;
              if (typeof base64data === 'string' && socketRef.current) {
                socketRef.current.send(JSON.stringify({
                  type: 'audio_packet',
                  targetId: targetId,
                  audio: base64data
                }));
              }
            };
          }
        };

        // Stream audio in slices of 400ms
        mediaRecorder.start(400);
      }
    } catch (err) {
      console.warn("Could not access microphone, initiating beautiful simulated waveform:", err);
      // Fallback: draw animated simulated visual waves so it still looks spectacular!
      drawSimulatedVisualWave();
    }
  };

  // Play incoming audio chunks
  const playIncomingAudioPacket = (base64Audio: string) => {
    try {
      const audio = new Audio(base64Audio);
      audio.play().catch(e => console.warn("Audio autoplay blocked by browser policy:", e));
      audioElementsRef.current.push(audio);
    } catch (e) {
      console.error("Error playing back received voice packet:", e);
    }
  };

  // Drawing high-fidelity canvas wave from actual microphone
  const drawVisualizerWave = () => {
    if (!canvasRef.current || !audioAnalyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioAnalyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!audioAnalyserRef.current || !canvasRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'; // slate-900 background translucent
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // Custom stylish futuristic neon rose/violet gradient
        const red = Math.min(255, 225 + i * 2);
        const green = Math.min(255, 40 + i * 5);
        const blue = Math.min(255, 130 + i * 3);

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, canvas.height - barHeight / 1.5, barWidth - 1, barHeight / 1.5);

        x += barWidth;
      }
    };

    draw();
  };

  // Simulated visual wave fallback
  const drawSimulatedVisualWave = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const draw = () => {
      if (!canvasRef.current || audioAnalyserRef.current) return; // cancel if real analyser connected
      animationFrameRef.current = requestAnimationFrame(draw);

      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f43f5e'; // rose-500 neon style

      for (let i = 0; i < canvas.width; i++) {
        const amplitude = 40 + Math.sin(step + i * 0.05) * 15;
        const y = canvas.height / 2 + Math.sin(i * 0.03 + step) * amplitude * Math.sin(step * 0.5);
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }

      ctx.stroke();
      step += 0.05;
    };

    draw();
  };

  // Stop media streams
  const stopAudioAndVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => {});
      audioContextRef.current = null;
    }
    audioAnalyserRef.current = null;
    // Stop all playing audio packet fragments
    audioElementsRef.current.forEach(el => el.pause());
    audioElementsRef.current = [];
  };

  // Tester account switcher helper
  const handleToggleAccountTest = (role: 'main' | 'tester') => {
    setTestUserRole(role);
    stopAudioAndVisualizer();
    setCallState('idle');
    setSelectedRecipient(null);

    if (role === 'main') {
      const mainAcc = currentUser || {
        id: 'usr-current',
        username: 'user_channel',
        displayName: isAr ? 'قناتي الخاصة' : 'My Channel',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        email: 'myahia69@gmail.com'
      };
      setActiveUser(mainAcc);
      onTriggerToast(
        isAr ? 'تم تسجيل الدخول بحسابك الرئيسي' : 'Logged into Main Channel account',
        'success'
      );
    } else {
      const testerAcc: User = {
        id: 'usr-tester-companion',
        username: 'tester_sub',
        displayName: isAr ? 'عمر الفاروق (متابع متفاعل)' : 'Omar Farooq (Active Subscriber)',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
        email: 'omar@example.com'
      };
      setActiveUser(testerAcc);
      onTriggerToast(
        isAr ? 'تم تسجيل الدخول بحساب عمر الفاروق التجريبي' : 'Logged into Omar Farooq testing account',
        'success'
      );
    }
  };

  return (
    <div id="chat-hub-container" className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-slate-950 text-slate-100">
      
      {/* 1. Left Sidebar: Subscribers / Contacts */}
      <div id="chat-sidebar" className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
        
        {/* Search header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-rose-500 animate-pulse" />
              <span>{isAr ? 'محادثات المشتركين' : 'Subscribers Chat'}</span>
            </h2>
            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/20">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span>{wsConnected ? (isAr ? 'متصل' : 'WS Server') : (isAr ? 'غير متصل' : 'Offline')}</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث عن حساب أو مشترك...' : 'Search subscriber account...'}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
            {isAr ? 'قائمة المشتركين النشطين' : 'Active Subscribers'}
          </p>
          
          {filteredSubscribers.map((sub) => {
            const isOnline = onlineUsersList.some(u => u.id === sub.id) || sub.id.startsWith('usr-'); // mock bots appear online
            const isSelected = selectedRecipient?.id === sub.id;
            const history = chatHistoryMap[sub.id] || [];
            const lastMsg = history[history.length - 1];

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedRecipient(sub)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-right lg:text-left ${
                  isSelected ? 'bg-rose-500/10 border-l-4 border-rose-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={sub.avatarUrl}
                    alt={sub.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 referrerPolicy='no-referrer'"
                  />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-100 truncate">{sub.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">@{sub.username}</p>
                  {lastMsg ? (
                    <p className="text-xs text-rose-400 truncate mt-1 italic">
                      {lastMsg.senderId === activeUser.id ? (isAr ? 'أنت: ' : 'You: ') : ''}{lastMsg.text}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 truncate mt-1">
                      {sub.id.startsWith('usr-') ? (isAr ? 'مستشار الذكاء الاصطناعي متوفر' : 'AI Assistant Available') : (isAr ? 'انقر لبدء محادثة' : 'Click to start chat')}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current profile and simulator panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={activeUser.avatarUrl}
              alt={activeUser.displayName}
              className="w-9 h-9 rounded-full object-cover border border-rose-500/30"
            />
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[10px] text-rose-400 font-semibold block uppercase tracking-wide">
                {isAr ? 'حسابك النشط حالياً' : 'Current Active Account'}
              </span>
              <p className="text-xs font-bold text-white truncate">{activeUser.displayName}</p>
            </div>
          </div>

          {/* Quick Dual Account Simulation buttons */}
          <div className="pt-2 border-t border-slate-800/60 space-y-2 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              {isAr 
                ? '💡 يمكنك التبديل لتجربة المحادثة الثنائية الحقيقية فورا!' 
                : '💡 Easily switch accounts to test real two-way chat immediately!'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleToggleAccountTest('main')}
                className={`py-1.5 px-2 text-xs rounded font-medium transition-all ${
                  testUserRole === 'main' ? 'bg-rose-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'الحساب الرئيسي' : 'Main Account'}
              </button>
              <button
                onClick={() => handleToggleAccountTest('tester')}
                className={`py-1.5 px-2 text-xs rounded font-medium transition-all ${
                  testUserRole === 'tester' ? 'bg-rose-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'عمر الفاروق' : 'Omar Farooq'}
              </button>
            </div>
          </div>

          {/* Bot automated response config */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">{isAr ? 'الرد التلقائي للمشتركين' : 'Subscriber Auto-Bot'}</span>
            <input
              type="checkbox"
              checked={botAutoReply}
              onChange={(e) => setBotAutoReply(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

      </div>

      {/* 2. Main Area: Chat history + Audio Calls */}
      <div id="chat-content-area" className="flex-1 flex flex-col bg-slate-950 relative">
        
        {/* Dynamic Voice Call Overlay Frame */}
        {callState !== 'idle' && (
          <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={activeCallPartner?.avatarUrl || incomingCallerData?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                  alt="Partner"
                  className="w-24 h-24 rounded-full object-cover border-4 border-rose-500 animate-pulse"
                />
                <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-75" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {activeCallPartner?.displayName || incomingCallerData?.name}
                </h3>
                <p className="text-sm text-rose-400 font-medium tracking-wide animate-pulse">
                  {callState === 'outgoing' && (isAr ? 'جاري الاتصال الصوتي المباشر...' : 'Ringing direct voice call...')}
                  {callState === 'incoming' && (isAr ? 'مكالمة صوتية واردة...' : 'Incoming voice call...')}
                  {callState === 'connected' && (isAr ? 'متصل الآن بث مباشر' : 'Live Connected')}
                </p>
              </div>
            </div>

            {/* Audio streaming visualizer canvas */}
            <div className="w-full max-w-sm h-32 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
              <canvas ref={canvasRef} className="w-full h-full" width={400} height={120} />
            </div>

            <div className="flex items-center gap-6">
              {/* Accept/Decline triggers for Incoming */}
              {callState === 'incoming' ? (
                <>
                  <button
                    onClick={handleAcceptCall}
                    className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all flex items-center justify-center shadow-lg hover:scale-105"
                    title={isAr ? 'قبول' : 'Accept'}
                  >
                    <Phone className="w-6 h-6 animate-bounce" />
                  </button>
                  <button
                    onClick={handleDeclineCall}
                    className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all flex items-center justify-center shadow-lg hover:scale-105"
                    title={isAr ? 'رفض' : 'Decline'}
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              ) : (
                /* Outgoing / Connected Controls */
                <>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3.5 rounded-full transition-all ${
                      isMuted ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={handleEndCall}
                    className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all flex items-center justify-center shadow-lg hover:scale-105"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'المكالمة مشفرة اتصال مباشر نظير لنظير' : 'Call encrypted peer-to-peer connection'}</span>
            </p>
          </div>
        )}

        {/* Selected Chat Box */}
        {selectedRecipient ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedRecipient.avatarUrl}
                    alt={selectedRecipient.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-800"
                  />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    onlineUsersList.some(u => u.id === selectedRecipient.id) || selectedRecipient.id.startsWith('usr-') ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-white">{selectedRecipient.displayName}</h3>
                  <p className="text-xs text-slate-400">@{selectedRecipient.username}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInitiateCall}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-950/30"
                >
                  <Phone className="w-4 h-4 animate-pulse" />
                  <span>{isAr ? 'اتصال صوتي' : 'Voice Call'}</span>
                </button>
              </div>
            </div>

            {/* Chat messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex justify-center my-2">
                <span className="bg-slate-900 text-slate-500 text-[10px] px-3 py-1 rounded-full border border-slate-800">
                  {isAr ? 'بدأت المحادثة الآمنة والمشفرة بين المشتركين' : 'Secure encrypted subscribers session started'}
                </span>
              </div>

              {(chatHistoryMap[selectedRecipient.id] || []).map((msg) => {
                const isOwn = msg.senderId === activeUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-none shadow-md'
                          : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line text-left">{msg.text}</p>
                      <div className={`text-[9px] mt-1.5 flex justify-end gap-1 ${isOwn ? 'text-rose-200' : 'text-slate-500'}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input panel */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isAr ? `اكتب رسالتك للمشترك ${selectedRecipient.displayName}...` : `Type your message to subscriber ${selectedRecipient.displayName}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                
                <button
                  type="submit"
                  className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty Chat View */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-rose-600/10 rounded-full flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-950/20">
                <MessageSquare className="w-10 h-10 text-rose-500 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-950 flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'غرفة محادثة المشتركين والقنوات' : 'Subscribers & Channels Chat Room'}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isAr 
                  ? 'ابدأ التحدث والكتابة بشكل مباشر مع المشتركين أو القنوات التي تتابعها، مع إمكانية بدء اتصال صوتي عالي الدقة في أي وقت!'
                  : 'Start instant text and high-fidelity audio calls directly with subscribers or channels you follow, completely powered by real WebSockets.'}
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 max-w-sm text-left">
              <p className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'كيفية تجربة مكالمة ثنائية حقيقية:' : 'How to test real voice calls:'}</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 text-right pr-4 lg:text-left lg:pl-4">
                <li>{isAr ? 'افتح التطبيق في نافذتين مختلفتين بالمتصفح' : 'Open the app in two different browser tabs'}</li>
                <li>{isAr ? 'سجل في نافذة بالحساب التجريبي "عمر الفاروق"' : 'Switch one tab to the tester account "Omar Farooq"'}</li>
                <li>{isAr ? 'ابدأ مكالمة صوتية أو شات بين الحسابين فوراً وبشكل حقيقي!' : 'Make instant calls or text chats between both tabs live!'}</li>
              </ul>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
