import React from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Trash2, Download } from 'lucide-react'

interface TextAreaProps {
  recognizedTexts: string[]
  setRecognizedTexts: React.Dispatch<React.SetStateAction<string[]>>
  interimResult: string
  currentPage: number
  copyToClipboard: (text: string) => void
  clearText: (index: number) => void
  downloadAsTextFile: (text: string, index: number) => void
  onTextChange: (text: string, index: number) => void
  onTextBlur: (index: number) => void
  interimResultPage: number
}

export const TextArea: React.FC<TextAreaProps> = ({
  recognizedTexts,
  setRecognizedTexts,
  interimResult,
  currentPage,
  copyToClipboard,
  clearText,
  downloadAsTextFile,
  onTextChange,
  onTextBlur,
  interimResultPage
}) => {
  return (
    <div className="space-y-2">
      <Textarea
        value={recognizedTexts[currentPage] + (currentPage === interimResultPage ? interimResult : '')}
        onChange={(e) => {
          const newText = e.target.value;
          onTextChange(newText, currentPage);
        }}
        onBlur={() => onTextBlur(currentPage)}
        className="min-h-[200px] resize-none w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 text-sm"
        placeholder={`テキストエリア ${currentPage + 1}`}
      />
      <div className="flex justify-end space-x-1">
        <Button 
          onClick={() => copyToClipboard(recognizedTexts[currentPage])} 
          variant="ghost"
          size="sm"
          className="p-1"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => clearText(currentPage)}
          variant="ghost"
          size="sm"
          className="p-1"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => downloadAsTextFile(recognizedTexts[currentPage], currentPage)}
          variant="ghost"
          size="sm"
          className="p-1"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

