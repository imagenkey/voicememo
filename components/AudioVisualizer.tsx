import React, { useMemo } from 'react'

interface AudioVisualizerProps {
  audioData: number[]
  isMicMuted: boolean
  isListening: boolean
  barColor?: string
  barWidth?: number
  maxBars?: number
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  audioData, 
  isMicMuted, 
  isListening,
  barColor = 'blue',
  barWidth = 2,
  maxBars = 100
}) => {
  const visualizerData = useMemo(() => {
    const step = Math.ceil(audioData.length / maxBars);
    return audioData.filter((_, index) => index % step === 0).slice(0, maxBars);
  }, [audioData, maxBars]);

  if (visualizerData.length === 0) {
    return (
      <div className="h-8 md:h-12 lg:h-16 flex items-center justify-center text-gray-500 text-xs">
        No audio data
      </div>
    )
  }

  const getBarColor = () => {
    if (isMicMuted) return 'gray';
    if (isListening) return 'green';
    return barColor;
  }

  return (
    <div className="flex items-end justify-center"
      role="img"
      aria-label="Audio visualizer">
      {visualizerData.map((value, index) => (
        <div
          key={index}
          style={{
            width: `${barWidth}px`,
            height: `${value / 2}%`,
            backgroundColor: getBarColor(),
            transition: 'height 0.1s ease, background-color 0.3s ease'
          }}
          className="mx-px"
        />
      ))}
    </div>
  )
}

