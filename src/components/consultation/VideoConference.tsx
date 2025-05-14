'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MicrophoneIcon, MicrophoneOffIcon, VideoIcon, VideoOffIcon, PhoneIcon, MessageSquareIcon, UsersIcon, SettingsIcon, AlertTriangleIcon } from 'lucide-react';
import { MeetingDetails } from '@/types/consultation';

interface VideoConferenceProps {
  consultationId: string;
  meetingDetails: MeetingDetails;
  expertName: string;
}

export default function VideoConference({ consultationId, meetingDetails, expertName }: VideoConferenceProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  
  // In a real implementation, this would integrate with a video conferencing API
  // For now, we'll simulate the video conference UI
  
  useEffect(() => {
    // Simulate loading the video conference
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes, randomly show an error or success
      const shouldShowError = false; // Set to true to test error state
      
      if (shouldShowError) {
        setError('Failed to connect to the meeting. Please check your internet connection and try again.');
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleJoinMeeting = () => {
    setIsJoined(true);
    
    // In a real implementation, this would connect to the video conference
    // For now, we'll just update the UI state
  };
  
  const handleLeaveMeeting = () => {
    if (confirm('Are you sure you want to leave the meeting?')) {
      setIsJoined(false);
      
      // In a real implementation, this would disconnect from the video conference
      // For now, we'll just update the UI state
    }
  };
  
  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
    
    // In a real implementation, this would mute/unmute the microphone
  };
  
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    
    // In a real implementation, this would turn on/off the video
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Connecting to your meeting...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="flex flex-col items-center justify-center py-4">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <p className="mt-4 text-sm text-gray-500">
              If the problem persists, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!isJoined) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Join Consultation</CardTitle>
          <CardDescription>
            Your meeting with {expertName} is ready to join
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <div className="bg-gray-100 rounded-lg w-full max-w-md aspect-video mb-6 flex items-center justify-center">
            {isVideoOff ? (
              <VideoOffIcon className="h-12 w-12 text-gray-400" />
            ) : (
              <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-white">
                Camera preview
              </div>
            )}
          </div>
          
          <div className="flex space-x-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              className={isMicMuted ? "bg-red-50 text-red-600 border-red-200" : ""}
              onClick={toggleMic}
            >
              {isMicMuted ? <MicrophoneOffIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={isVideoOff ? "bg-red-50 text-red-600 border-red-200" : ""}
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOffIcon className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
            </Button>
          </div>
          
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleJoinMeeting}>
            Join Meeting
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative" ref={videoRef}>
        {/* Main video area */}
        <div className="w-full h-full flex items-center justify-center text-white text-lg">
          {isVideoOff ? (
            <div className="flex flex-col items-center">
              <VideoOffIcon className="h-16 w-16 mb-2" />
              <p>Your video is off</p>
            </div>
          ) : (
            <p>Video conference in progress</p>
          )}
        </div>
        
        {/* Participant thumbnails */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <div className="w-32 h-24 bg-gray-700 rounded border-2 border-white shadow-lg">
            <div className="w-full h-full flex items-center justify-center text-white text-xs">
              You
            </div>
          </div>
          <div className="w-32 h-24 bg-gray-700 rounded border-2 border-white shadow-lg">
            <div className="w-full h-full flex items-center justify-center text-white text-xs">
              {expertName}
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 p-4 rounded-b-lg flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className={isMicMuted ? "text-red-400 hover:text-red-300 hover:bg-gray-700" : "text-white hover:bg-gray-700"}
            onClick={toggleMic}
          >
            {isMicMuted ? <MicrophoneOffIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={isVideoOff ? "text-red-400 hover:text-red-300 hover:bg-gray-700" : "text-white hover:bg-gray-700"}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOffIcon className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-700"
          >
            <MessageSquareIcon className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-700"
          >
            <UsersIcon className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-700"
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
        
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
          onClick={handleLeaveMeeting}
        >
          <PhoneIcon className="h-5 w-5 mr-2" />
          Leave
        </Button>
      </div>
    </div>
  );
}
