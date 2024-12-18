import { useState, useRef, useCallback, useEffect } from 'react'

export const useAudioAnalysis = (selectedMicrophone: string | null) => {
  const [audioData, setAudioData] = useState<number[]>(Array(15).fill(0))
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)

  const startAudioAnalysis = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    if (selectedMicrophone) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedMicrophone }
        })
        microphoneStreamRef.current = stream

        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.7
        source.connect(analyserRef.current)

        const updateAudioData = () => {
          if (!analyserRef.current) return
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const scaledData = Array.from(dataArray.slice(0, 15)).map(value => {
            const scaled = Math.pow(value / 255, 0.5) * 255
            return Math.max(scaled, 10)
          })
          setAudioData(scaledData.reverse())
          requestAnimationFrame(updateAudioData)
        }

        updateAudioData()
      } catch (error) {
        console.error('Error using microphone:', error)
      }
    }
  }, [selectedMicrophone])

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return { audioData, startAudioAnalysis }
}

