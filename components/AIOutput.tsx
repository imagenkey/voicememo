interface AIOutputProps {
  aiOutputs: string[];
  aiPrompts: string[];
  currentAiPage: number;
  setCurrentAiPage: (page: number) => void;
  clearAiOutput: (index: number) => void;
  copyToClipboard: (text: string) => void;
  onSummarize: () => void;
  onUpdatePrompt: (index: number, prompt: string) => void;
  onSavePrompt: (index: number, prompt: string) => Promise<void>;
}

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Trash2, Copy, Brain, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

export const AIOutput: React.FC<AIOutputProps> = ({ 
  aiOutputs, 
  aiPrompts, 
  currentAiPage, 
  setCurrentAiPage, 
  clearAiOutput, 
  copyToClipboard, 
  onSummarize, 
  onUpdatePrompt, 
  onSavePrompt 
}) => {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState(aiPrompts[currentAiPage])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditedPrompt(aiPrompts[currentAiPage])
  }, [currentAiPage, aiPrompts])

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePrompt(currentAiPage, editedPrompt);
      toast.success('AI Instruction saved successfully');
    } catch (error) {
      console.error('Error saving AI prompt:', error);
      toast.error('Failed to save AI Instruction');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Button onClick={() => setCurrentAiPage(prev => (prev > 0 ? prev - 1 : 2))} variant="ghost" size="sm" className="p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium">AI Output {currentAiPage + 1}</span>
        <Button onClick={() => setCurrentAiPage(prev => (prev < 2 ? prev + 1 : 0))} variant="ghost" size="sm" className="p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex space-x-1">
          <Button 
            onClick={onSummarize}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <Brain className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => clearAiOutput(currentAiPage)}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => copyToClipboard(aiOutputs[currentAiPage])}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center justify-between w-full py-0.5 text-xs"
        onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
      >
        {isInstructionsOpen ? "Hide AI Instructions" : "Show AI Instructions"}
        {isInstructionsOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
      </Button>
      {isInstructionsOpen && (
        <div className="space-y-1">
          <Textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="min-h-[60px] w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 text-sm"
            placeholder="Edit AI instructions here"
          />
          <div className="flex justify-between">
            <Button 
              onClick={() => onUpdatePrompt(currentAiPage, editedPrompt)}
              size="sm"
              variant="outline"
            >
              Update without saving
            </Button>
            <Button 
              onClick={handleSave}
              size="sm"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save AI Instruction'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="flex-grow">
        <Textarea
          id={`aiOutput${currentAiPage}`}
          value={aiOutputs[currentAiPage]}
          readOnly
          className="min-h-[80px] w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200 text-sm"
          placeholder="AI processing results will appear here"
        />
      </div>
    </div>
  )
}

