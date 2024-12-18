import { useState, useRef, useCallback, useEffect } from 'react'

export const useSpeechRecognition = (onResult, onError) => {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      recognitionRef.current.lang = 'ja-JP'
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = onResult
      recognitionRef.current.onerror = onError
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (e) {
      console.error('Error starting speech recognition:', e)
    }
  }, [onResult, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return { isListening, startListening, stopListening }
}

