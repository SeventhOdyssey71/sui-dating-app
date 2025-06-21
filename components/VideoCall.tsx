'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  Maximize2, Minimize2, X, Loader2 
} from 'lucide-react';
import { useDatingPlatform } from '@/hooks/useDatingPlatform';

interface VideoCallProps {
  matchId: string;
  recipientAddress: string;
  recipientName?: string;
  isIncoming?: boolean;
  onEnd: () => void;
}

export function VideoCall({ 
  matchId, 
  recipientAddress, 
  recipientName, 
  isIncoming = false,
  onEnd 
}: VideoCallProps) {
  const { startCall, endCall } = useDatingPlatform();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [isConnecting, setIsConnecting] = useState(!isIncoming);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isIncoming) {
      initiateCall();
    }
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isConnected]);

  const initiateCall = async () => {
    try {
      setIsConnecting(true);
      
      // Start the call on blockchain
      await new Promise<void>((resolve, reject) => {
        startCall(
          matchId,
          recipientAddress,
          callType,
          (id) => {
            setSessionId(id);
            resolve();
          },
          reject
        );
      });
      
      // Initialize media streams
      await setupMediaStreams();
      
      // In production, you would establish WebRTC connection here
      // For demo, we'll simulate connection
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
      }, 2000);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      alert('Failed to start call. Please try again.');
      onEnd();
    }
  };

  const setupMediaStreams = async () => {
    try {
      const constraints = {
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // In production, you would set up WebRTC peer connection here
    } catch (error) {
      console.error('Failed to access media devices:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const handleEndCall = async () => {
    if (sessionId) {
      try {
        await new Promise<void>((resolve, reject) => {
          endCall(sessionId, resolve, reject);
        });
      } catch (error) {
        console.error('Failed to end call on blockchain:', error);
      }
    }
    
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? '' : 'md:p-4'}`}>
      <div className={`relative h-full w-full ${isFullscreen ? '' : 'md:max-w-6xl md:max-h-[90vh] md:mx-auto md:rounded-2xl overflow-hidden'}`}>
        {/* Remote Video (Main) */}
        <div className="relative h-full w-full bg-gray-900">
          {callType === 'video' ? (
            <video
              ref={remoteVideoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-white">
                    {recipientName?.[0] || '?'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{recipientName || 'Unknown'}</h3>
                {isConnected && (
                  <p className="text-gray-400 mt-2">{formatDuration(callDuration)}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                <p>Connecting...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (PiP) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 rounded-xl overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              className="h-full w-full object-cover mirror"
              autoPlay
              playsInline
              muted
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-semibold">{recipientName || 'Unknown'}</h3>
              {isConnected && (
                <p className="text-sm opacity-75">{formatDuration(callDuration)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-white" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={handleEndCall}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors md:hidden"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all ${
                  !isVideoEnabled 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </button>
            )}
            
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}