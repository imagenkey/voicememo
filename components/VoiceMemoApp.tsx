'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { AudioVisualizer } from './AudioVisualizer'
import { RecordingControls } from './RecordingControls'
import { TextArea } from './TextArea'
import { AIOutput } from './AIOutput'
import { CommandSection } from './CommandSection'
import { SettingsDialog } from './SettingsDialog'
import { ShortcutHelpModal } from './ShortcutHelpModal'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAudioAnalysis } from '../hooks/useAudioAnalysis'
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { Wand2 } from 'lucide-react'
import { ThemeProvider } from 'next-themes'
import yaml from 'js-yaml'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from '../utils/supabaseClient'
import { Login } from './Login'
import { Toaster } from 'react-hot-toast'
import { toast } from 'react-hot-toast'
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import debounce from 'lodash/debounce';

interface User {
  id: string;
  // Add other user properties as needed
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  console.error('Gemini API key is not set. Please check your environment variables.');
}

// Add debug mode flag
const DEBUG_MODE = true;

// Enhanced logging function
const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log('[VoiceMemo Debug]:', ...args);
  }
};

interface Microphone {
  deviceId: string
  label: string
}

interface SavedCommand {
  id: string
  name: string
  command: string
  user_id: string
}

export default function VoiceMemoApp() {
  const [user, setUser] = useState<User | null>(null)
  const [recognizedTexts, setRecognizedTexts] = useState(["", "", "", "", ""])
  const [pageTitles, setPageTitles] = useState(["Page 1", "Page 2", "Page 3", "Page 4", "Page 5"])
  const [numberOfPages, setNumberOfPages] = useState(5)
  const [interimResult, setInterimResult] = useState("")
  const [availableMicrophones, setAvailableMicrophones] = useState<Microphone[]>([])
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null)
  const [usePunctuation, setUsePunctuation] = useState(true)
  const [useQuestionMark, setUseQuestionMark] = useState(false)
  const [useArabicNumerals, setUseArabicNumerals] = useState(true)
  const [insertLineBreaks, setInsertLineBreaks] = useState(true)
  const [useDoubleLineBreaks, setUseDoubleLineBreaks] = useState(false)
  const [customWords, setCustomWords] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [showInterimResults, setShowInterimResults] = useState(true)
  const [aiOutputs, setAiOutputs] = useState(["", "", ""])
  const [currentAiPage, setCurrentAiPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [savedCommands, setSavedCommands] = useState<SavedCommand[]>([])
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null)
  const [newCommandName, setNewCommandName] = useState("")
  const [newCommandText, setNewCommandText] = useState("")
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null)
  const [aiOutput, setAiOutput] = useState("") // Added aiOutput state
  const [aiPrompts, setAiPrompts] = useState([
    "Summarize the following text in a concise manner:",
    "Provide a detailed summary of the key points in this text:",
    "Create an outline of the main ideas presented in this text:"
  ])
  const [interimResultPage, setInterimResultPage] = useState(0); // Added interimResultPage state

  const [isTabActive, setIsTabActive] = useState(true);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const lastSavedText = useRef<string[]>(new Array(numberOfPages).fill('')); // Added lastSavedText state

  // Add state for tracking save status
  const [saveStatus, setSaveStatus] = useState<{
    error: string | null;
  }>({
    error: null
  });

  const { audioData, startAudioAnalysis } = useAudioAnalysis(selectedMicrophone)

  const loadFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const [memoData, commandData] = await Promise.all([
        supabase
          .from('voice_memos')
          .select('*')
          .eq('user_id', user.id)
          .order('page', { ascending: true }),
        supabase
          .from('saved_commands')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (memoData.error) {
        console.error('Error loading memos from Supabase:', memoData.error);
      } else if (memoData.data) {
        const texts = memoData.data.map(item => item.text);
        setRecognizedTexts(texts);
        lastSavedText.current = texts; // Initialize lastSavedText with loaded data
      }

      if (commandData.error) {
        console.error('Error loading commands from Supabase:', commandData.error);
      } else if (commandData.data) {
        setSavedCommands(commandData.data);
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    }
  }, [supabase]);

  const processRecognizedText = useCallback((text: string) => {
    return text
  }, [usePunctuation, useDoubleLineBreaks, useQuestionMark, useArabicNumerals, insertLineBreaks, customWords])

  const saveToSupabase = useCallback(async (page: number, text: string) => {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      // toast.error('Unable to save: Supabase client is not initialized');
      return;
    }

    if (!isTabActive) {
      console.log('Tab is not active, queuing save operation');
      // Queue the save operation for when the tab becomes active again
      return;
    }

    // 前回保存した内容と同じ場合は保存をスキップ
    if (text === lastSavedText.current[page]) {
      console.log(`ページ ${page + 1} のデータに変更がないためスキップします`);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('認証されたユーザーが見つかりません');
      }

    const { error } = await supabase
      .from('voice_memos')
      .upsert({ 
        user_id: user.id,
        page, 
        text, 
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,page'
      });

      if (error) throw error;

      console.log(`ページ ${page + 1} のデータが正常に保存されました`);
      // toast.success(`ページ ${page + 1} のデータが保存されました`, { duration: 2000 });
      
      // 保存した内容を記録
      lastSavedText.current[page] = text;
    } catch (error) {
      console.error('Supabaseへの保存に失敗しました:', error);
      // toast.error(`保存に失敗しました: ${error.message}`, { duration: 3000 });
    }
  }, [supabase, isTabActive]);

  const onSpeechResult = useCallback((event: SpeechRecognitionEvent) => {
    let interimTranscript = ''
    let finalTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' '
      } else {
        interimTranscript += transcript
      }
    }

    if (finalTranscript) {
      setRecognizedTexts(prev => {
        const newTexts = [...prev]
        newTexts[currentPage] = (newTexts[currentPage] || '') + processRecognizedText(finalTranscript)
        saveToSupabase(currentPage, newTexts[currentPage])
        return newTexts
      })
    }

    setInterimResult(interimTranscript)

    if (finalTranscript.toLowerCase().includes("command")) {
      processWithGemini(finalTranscript, "command")
    }
  }, [currentPage, processRecognizedText, saveToSupabase])

  const onSpeechError = useCallback((error: any) => {
    console.error('Speech recognition error:', error)
    toast.error('Speech recognition error. Please try again.')
  }, [])

  const { isListening, startListening, stopListening } = useSpeechRecognition(onSpeechResult, onSpeechError)

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err))
  }, [])

  const clearText = useCallback((index: number) => {
    setRecognizedTexts(prev => {
      const newTexts = [...prev];
      newTexts[index] = "";
      return newTexts;
    });
    saveToSupabase(index, "");
  }, [saveToSupabase]);

  const downloadAsTextFile = useCallback((text: string, index: number) => {
    const element = document.createElement('a')
    const file = new Blob([text], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `voice_memo_${index + 1}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }, [])

  const processWithGemini = async (text: string, task: string) => {
    setIsLoading(true)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    
    let prompts = []
    if (task === "summarize") {
      prompts = aiPrompts.map(prompt => `${prompt} ${text}`)
    } else if (task === "command") {
      prompts = [
        `Interpret the following voice command and suggest actions: ${text}`,
        `Analyze the given voice command and provide a step-by-step guide to execute it: ${text}`,
        `Explain the intent behind this voice command and suggest alternative ways to achieve the same goal: ${text}`
      ]
    }

    try {
      const results = await Promise.all(prompts.map(prompt => model.generateContent(prompt)))
      const generatedTexts = results.map(result => result.response.text())
      setAiOutputs(generatedTexts)
    } catch (error) {
      console.error("Error processing with Gemini:", error)
      const errorMessage = `Error processing: ${error.message}`
      setAiOutputs([errorMessage, errorMessage, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearAiOutput = useCallback((index: number) => {
    setAiOutputs(prev => prev.map((output, i) => i === index ? "" : output))
  }, [])

  const executeCommand = useCallback(async (command: string) => {
    setIsLoading(true)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const prompt = `Execute the following command on the current text: ${command}\n\nCurrent text: ${recognizedTexts[currentPage]}`
    
    try {
      const result = await model.generateContent(prompt)
      const generatedText = result.response.text()
      setAiOutput(generatedText); // Updated to set aiOutput
      setIsLoading(false)
      return generatedText;
    } catch (error) {
      console.error("Error executing command:", error)
      const errorMessage = `Error executing command: ${error.message}`
      setAiOutput(errorMessage); // Updated to set aiOutput
      setIsLoading(false)
      return errorMessage;
    }
  }, [genAI, recognizedTexts, currentPage])


  const saveCommand = useCallback(async (name: string, command: string) => {
    if (!user) {
      console.error('No authenticated user found');
      toast.error('You must be logged in to save commands');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_commands')
        .insert([{ name, command, user_id: user.id }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newCommand = data[0];
        setSavedCommands(prev => [...prev, newCommand]);
        setNewCommandName('');
        setNewCommandText('');
        toast.success('Command saved successfully');
      } else {
        throw new Error('No data returned from insert operation');
      }
    } catch (error) {
      console.error('Error saving command:', error);
      toast.error('Failed to save command');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, setSavedCommands, setNewCommandName, setNewCommandText]);

  const updateCommand = useCallback(async (id: string, newName: string, newCommandText: string) => {
    const { data, error } = await supabase
      .from('saved_commands')
      .update({ name: newName, command: newCommandText })
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error updating command:', error);
    } else {
      setSavedCommands(prev => prev.map(cmd => 
        cmd.id === id ? { ...cmd, name: newName, command: newCommandText } : cmd
      ));
    }
    setEditingCommandId(null);
  }, [user]);

  const deleteCommand = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('saved_commands')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error deleting command:', error);
      toast.error('Failed to delete command');
    } else {
      setSavedCommands(prev => prev.filter(cmd => cmd.id !== id));
      toast.success('Command deleted successfully');
    }
  }, [user, supabase]);


  const importCommands = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedCommands = yaml.load(content) as SavedCommand[]
          setSavedCommands(prev => [...prev, ...importedCommands])
        } catch (error) {
          console.error('Error importing commands:', error)
          alert('Failed to import commands. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
  }, [])

  const updateAiPrompt = useCallback((index: number, newPrompt: string) => {
    setAiPrompts(prev => {
      const newPrompts = prev.map((prompt, i) => i === index ? newPrompt : prompt)
      saveAiPrompt(index, newPrompt)
      return newPrompts
    })
  }, []);

  const saveAiPrompt = useCallback(async (index: number, prompt: string) => {
  console.log('Starting to save AI prompt:', { index, prompt });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }
    console.log('User authenticated:', user.id);

    const { data, error } = await supabase
      .from('ai_prompts')
      .upsert({
        id: index,
        prompt,
        user_id: user.id
      }, {
        onConflict: 'id,user_id'
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('AI prompt saved successfully:', data);
    
    // Update aiPrompts state after successful save
    setAiPrompts(prev => {
      const newPrompts = [...prev];
      newPrompts[index] = prompt;
      return newPrompts;
    });
    
    console.log('aiPrompts state updated');
  } catch (error) {
    console.error('Error in saveAiPrompt:', error);
    throw error;
  }
}, [supabase]);


  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await loadFromSupabase()
      }
    }
    checkUser()
  }, [loadFromSupabase, supabase])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user)
        await loadFromSupabase()
        // Check if the user was redirected from Google OAuth
        const { error } = await supabase.auth.getSession()
        if (error) console.error('Error getting session:', error)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setRecognizedTexts(["", "", "", "", ""])
        setSavedCommands([])  // Clear saved commands on sign out
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [loadFromSupabase])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey && event.key === 's') || (event.ctrlKey && event.key === 'm')) {
        event.preventDefault()
        if (isListening) {
          stopListening()
        } else {
          startListening()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    const getAvailableMicrophones = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const microphones = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({ deviceId: device.deviceId, label: device.label || `Microphone ${device.deviceId.slice(0, 5)}` }))
        setAvailableMicrophones(microphones)
        if (microphones.length > 0 && !selectedMicrophone) {
          setSelectedMicrophone(microphones[0].deviceId)
        }
      } catch (error) {
        console.error('Error getting available microphones:', error)
      }
    }

    getAvailableMicrophones()
  }, [])

  useEffect(() => {
    setRecognizedTexts(prev => {
      const newTexts = [...prev]
      while (newTexts.length < numberOfPages) {
        newTexts.push("")
      }
      return newTexts.slice(0, numberOfPages)
    })
    setPageTitles(prev => {
      const newTitles = [...prev]
      while (newTitles.length < numberOfPages) {
        newTitles.push(`Page ${newTitles.length + 1}`)
      }
      return newTitles.slice(0, numberOfPages)
    })
    setCurrentPage(prev => Math.min(prev, numberOfPages - 1))
  }, [numberOfPages])

  const handleStartRecording = useCallback(() => {
    startAudioAnalysis();
    startListening();
    setInterimResultPage(currentPage); // Added setInterimResultPage call
    console.log(`Starting voice recognition on page ${currentPage + 1}`);
    toast.success(`音声認識を開始しました。ページ ${currentPage + 1}`);
  }, [startAudioAnalysis, startListening, currentPage]);

  const handleStopRecording = useCallback(() => {
    stopListening();
    setInterimResult("");
    console.log(`Stopping voice recognition on page ${currentPage + 1}`);
    toast.success(`音声認識を停止しました。ページ ${currentPage + 1}`);
  }, [stopListening, currentPage]);

  // Add effect to save data when text changes
  useEffect(() => {
    if (recognizedTexts[currentPage]) {
      saveToSupabase(currentPage, recognizedTexts[currentPage]);
    }
  }, [recognizedTexts, currentPage, saveToSupabase]);

  const generateCommandName = useCallback(async (command: string) => {
    setIsLoading(true);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Given the following command, generate a short, descriptive name for it. The name should be concise and reflect the purpose of the command. Command: "${command}"`;

    try {
      const result = await model.generateContent(prompt);
      const generatedName = result.response.text().trim();
      return generatedName;
    } catch (error) {
      console.error("Error generating command name:", error);
      toast.error("Failed to generate command name");
      return "";
    } finally {
      setIsLoading(false);
    }
  }, [genAI]);

  useEffect(() => {
    if (user) {
      loadFromSupabase();
    }
  }, [user, loadFromSupabase]);

  const queueSaveOperation = useCallback((page: number, text: string) => {
    if (!isTabActive) {
      saveQueue.current.push({ page, text });
    } else {
      saveToSupabase(page, text);
    }
  }, [saveToSupabase, isTabActive]);

  const handleTextChange = useCallback((newText: string, pageIndex: number) => {
    setRecognizedTexts(prev => {
      const newTexts = [...prev];
      newTexts[pageIndex] = newText;
      return newTexts;
    });
    queueSaveOperation(pageIndex, newText);
  }, [queueSaveOperation]);

  const handleTextBlur = useCallback((pageIndex: number) => {
    const textToSave = recognizedTexts[pageIndex];
    queueSaveOperation(pageIndex, textToSave);
  }, [recognizedTexts, queueSaveOperation]);


  useEffect(() => {
    setInterimResult("");
  }, [currentPage]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setIsTabActive(false);
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    } else {
      setIsTabActive(true);
      // Retry queued save operations
      while (saveQueue.current.length > 0) {
        const { page, text } = saveQueue.current.shift()!;
        saveToSupabase(page, text);
      }
    }
  }, []);

  const startPeriodicSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }
    saveIntervalRef.current = setInterval(() => {
      saveToSupabase(currentPage, recognizedTexts[currentPage]);
    }, 30000); // 30秒ごとに保存
  }, [currentPage, recognizedTexts, saveToSupabase]);

  const handleWindowFocus = useCallback(() => {
    if (isTabActive) {
      saveToSupabase(currentPage, recognizedTexts[currentPage]);
    }
  }, [currentPage, recognizedTexts, saveToSupabase, isTabActive]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (isTabActive) {
        console.log('Window regained focus, saving current data...');
        saveToSupabase(currentPage, recognizedTexts[currentPage]);
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isTabActive, currentPage, recognizedTexts, saveToSupabase]);


  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    startPeriodicSave();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [handleVisibilityChange, handleWindowFocus, startPeriodicSave]);

  const saveQueue = useRef<{ page: number; text: string }[]>([]);

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      toast.error('Unable to connect to the database. Please refresh the page.');
    }
  }, [supabase]);


  if (user === null) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <Login onLogin={(user) => {
            setUser(user)
            loadFromSupabase()
          }} />
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster position="top-right" />
      <div className="space-y-4 p-4 max-w-2xl mx-auto dark:bg-gray-800 dark:text-gray-100">
        {saveStatus.error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow">
            Error: {saveStatus.error}
          </div>
        )}
        <Card>
          <CardContent className="p-4">
            <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
  <div className="flex items-center space-x-2 flex-grow">
    <Button
      onClick={() => setCurrentPage(prev => (prev > 0 ? prev - 1 : numberOfPages - 1))}
      variant="ghost"
      size="icon"
      className="w-8 h-8 p-0"
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
    <span className="text-sm font-medium">{pageTitles[currentPage]}</span>
    <Button
      onClick={() => setCurrentPage(prev => (prev < numberOfPages - 1 ? prev + 1 : 0))}
      variant="ghost"
      size="icon"
      className="w-8 h-8 p-0"
    >
      <ChevronRight className="h-5 w-5" />
    </Button>
    <div className="flex items-center space-x-2 ml-auto">
      <RecordingControls
        isMicMuted={isMicMuted}
        setIsMicMuted={setIsMicMuted}
        isListening={isListening}
        startListening={handleStartRecording}
        stopListening={handleStopRecording}
      />
      <SettingsDialog
        usePunctuation={usePunctuation}
        setUsePunctuation={setUsePunctuation}
        useQuestionMark={useQuestionMark}
        setUseQuestionMark={setUseQuestionMark}
        useArabicNumerals={useArabicNumerals}
        setUseArabicNumerals={setUseArabicNumerals}
        insertLineBreaks={insertLineBreaks}
        setInsertLineBreaks={setInsertLineBreaks}
        useDoubleLineBreaks={useDoubleLineBreaks}
        setUseDoubleLineBreaks={setUseDoubleLineBreaks}
        showInterimResults={showInterimResults}
        setShowInterimResults={setShowInterimResults}
        customWords={customWords}
        setCustomWords={setCustomWords}
        numberOfPages={numberOfPages}
        setNumberOfPages={setNumberOfPages}
        availableMicrophones={availableMicrophones}
        selectedMicrophone={selectedMicrophone}
        setSelectedMicrophone={setSelectedMicrophone}
      />
      <Button onClick={() => supabase.auth.signOut()} variant="outline" size="icon" className="w-8 h-8 p-0">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  </div>
  <div className="w-full sm:w-auto order-last sm:order-none mt-2 sm:mt-0">
    <AudioVisualizer audioData={audioData} isMicMuted={isMicMuted} isListening={isListening} />
  </div>
</header>


            <TextArea
              recognizedTexts={recognizedTexts}
              setRecognizedTexts={setRecognizedTexts}
              interimResult={interimResult}
              interimResultPage={currentPage} // Added interimResultPage prop
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageTitles={pageTitles}
              numberOfPages={numberOfPages}
              copyToClipboard={copyToClipboard}
              clearText={clearText}
              downloadAsTextFile={downloadAsTextFile}
              onTextChange={handleTextChange}
              onTextBlur={handleTextBlur}
            />
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-4">
            <CommandSection
              savedCommands={savedCommands}
              isLoading={isLoading}
              newCommandName={newCommandName}
              setNewCommandName={setNewCommandName}
              newCommandText={newCommandText}
              setNewCommandText={setNewCommandText}
              saveCommand={saveCommand}
              updateCommand={updateCommand}
              deleteCommand={deleteCommand}
              editingCommandId={editingCommandId}
              setEditingCommandId={setEditingCommandId}
              setSavedCommands={setSavedCommands}
              generateCommandName={generateCommandName}
              executeCommand={executeCommand}
              aiOutput={aiOutput}
              setAiOutput={setAiOutput}
              copyToClipboard={copyToClipboard}
            />
          </CardContent>
        </Card>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}

