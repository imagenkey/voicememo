import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Play, X, Edit, Copy } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { ConfirmDialog } from './ConfirmDialog'

interface SavedCommand {
  id: string
  name: string
  command: string
}

interface CommandSectionProps {
  savedCommands: SavedCommand[]
  isLoading: boolean
  newCommandName: string
  setNewCommandName: (name: string) => void
  newCommandText: string
  setNewCommandText: (text: string) => void
  saveCommand: (name: string, command: string) => Promise<void>
  updateCommand: (id: string, name: string, command: string) => void
  deleteCommand: (id: string) => void
  editingCommandId: string | null
  setEditingCommandId: (id: string | null) => void
  setSavedCommands: (commands: SavedCommand[]) => void
  executeCommand: (command: string) => Promise<string>
  aiOutput: string;
  setAiOutput: React.Dispatch<React.SetStateAction<string>>;
  copyToClipboard: (text: string) => void;
  generateCommandName: (command: string) => Promise<string>;
}

export const CommandSection: React.FC<CommandSectionProps> = ({
  savedCommands,
  isLoading,
  newCommandName,
  setNewCommandName,
  newCommandText,
  setNewCommandText,
  saveCommand,
  updateCommand,
  deleteCommand,
  editingCommandId,
  setEditingCommandId,
  setSavedCommands,
  executeCommand,
  aiOutput,
  setAiOutput,
  copyToClipboard,
  generateCommandName
}) => {
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [commandToDelete, setCommandToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (editingCommandId) {
      const commandToEdit = savedCommands.find(cmd => cmd.id === editingCommandId);
      if (commandToEdit) {
        setNewCommandName(commandToEdit.name);
        setNewCommandText(commandToEdit.command);
      }
    } else {
      setNewCommandName('');
      setNewCommandText('');
    }
  }, [editingCommandId, savedCommands]);

  const handleExecuteCommand = async (command: string) => {
    const result = await executeCommand(command);
    setAiOutput(result);
  }

  const handleDeleteCommand = (id: string) => {
    setCommandToDelete(id);
    setIsDeleteDialogOpen(true);
  }

  const confirmDeleteCommand = () => {
    if (commandToDelete) {
      deleteCommand(commandToDelete);
      setIsDeleteDialogOpen(false);
      setCommandToDelete(null);
    }
  }

  const handleSaveCommand = async () => {
    if (newCommandName.trim() === '' || newCommandText.trim() === '') {
      toast.error('Command name and text cannot be empty');
      return;
    }

    if (editingCommandId) {
      updateCommand(editingCommandId, newCommandName, newCommandText);
    } else {
      const generatedName = newCommandName.trim() === '' 
        ? await generateCommandName(newCommandText)
        : newCommandName;
      await saveCommand(generatedName, newCommandText);
    }
    setEditingCommandId(null);
    setNewCommandName('');
    setNewCommandText('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Saved Commands</Label>
        {savedCommands.length === 0 ? (
          <p className="text-sm text-gray-500">No saved commands yet.</p>
        ) : (
          <div className="space-y-2">
            {savedCommands.map((cmd) => (
              <div key={cmd.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg transition-all duration-300 ease-in-out">
                <span className="text-sm truncate max-w-[calc(100%-100px)]">{cmd.name}</span>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => handleExecuteCommand(cmd.command)}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCommandId(cmd.id);
                      setNewCommandName(cmd.name);
                      setNewCommandText(cmd.command);
                    }}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCommand(cmd.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">AI Output</Label>
        <Textarea
          value={aiOutput}
          readOnly
          className="w-full min-h-[100px] resize-none dark:bg-gray-700 dark:text-gray-100"
          placeholder="AI output will appear here after executing a command."
        />
        <Button 
          onClick={() => copyToClipboard(aiOutput)}
          variant="ghost"
          size="sm"
          className="mt-2"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy AI Output
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">
            {editingCommandId ? 'Edit Command' : 'New Command'}
          </Label>
          <div className="flex justify-between items-center mt-2">
            <Button onClick={handleSaveCommand} disabled={isLoading} className="text-xs px-2 py-1">
              {editingCommandId ? 'Update' : 'Save'}
            </Button>
            {editingCommandId && (
              <Button onClick={() => setEditingCommandId(null)} variant="secondary" className="text-xs px-2 py-1">
                Cancel Editing
              </Button>
            )}
          </div>
        </div>
        <Input
          placeholder="Command Name"
          value={newCommandName}
          onChange={(e) => setNewCommandName(e.target.value)}
          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 text-sm"
        />
        <Textarea
          placeholder="Command Text"
          value={newCommandText}
          onChange={(e) => setNewCommandText(e.target.value)}
          className="w-full min-h-[120px] resize-none dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 text-sm"
        />
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteCommand}
        title="Delete Command"
        message="Are you sure you want to delete this command? This action cannot be undone."
      />
    </div>
  )
}

