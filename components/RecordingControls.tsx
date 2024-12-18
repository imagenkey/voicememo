import React from 'react'
import { Button } from "@/components/ui/button"
import { Mic, Volume2 } from 'lucide-react'

interface RecordingControlsProps {
  isMicMuted: boolean
  setIsMicMuted: (muted: boolean) => void
  isListening: boolean
  startListening: () => void
  stopListening: () => void
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isMicMuted,
  setIsMicMuted,
  isListening,
  startListening,
  stopListening
}) => {
  return (
    <div className="flex items-center justify-between space-x-2">
      <Button
        onClick={() => {
          setIsMicMuted(!isMicMuted)
          if (!isMicMuted && isListening) {
            stopListening()
          }
        }}
        variant={isMicMuted ? "destructive" : "secondary"}
        size="icon"
        className="w-8 h-8 p-0"
      >
        {isMicMuted ? <Volume2 className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      <Button 
        onClick={isListening ? stopListening : startListening}
        disabled={isMicMuted}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className={`text-xs px-2 py-1 ${!isListening ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
      >
        {isListening ? 'Stop' : 'Start'}
      </Button>
    </div>
  )
}

