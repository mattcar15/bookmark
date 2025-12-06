'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';

import { 
  Note,
  CustomTableCell, 
  CustomTableHeader,
  generateId,
  loadNotes,
  saveNotes,
} from './notes';
import { EditorToolbar } from './notes/EditorToolbar';
import { ImageUploadNode } from './notes/ImageUploadNode';

export default function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Selected note
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Initialize Tiptap editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note... Use markdown shortcuts like # for headings, > for quotes, ``` for code blocks, or ==text== for highlights.',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
        inline: false,
      }),
      ImageUploadNode,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content: selectedNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-1',
      },
    },
    onUpdate: ({ editor }) => {
      if (selectedNoteId) {
        const html = editor.getHTML();
        updateNoteContent(selectedNoteId, html);
      }
    },
  });

  // Load notes on client mount
  useEffect(() => {
    setIsClient(true);
    const loaded = loadNotes();
    setNotes(loaded);
    
    // If there are notes, select the first one; otherwise create a new one
    if (loaded.length > 0) {
      setSelectedNoteId(loaded[0].id);
    } else {
      // Auto-create a note if none exist
      const newNote: Note = {
        id: generateId(),
        title: 'Untitled',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes([newNote]);
      saveNotes([newNote]);
      setSelectedNoteId(newNote.id);
    }
  }, []);

  // Update editor content when selected note changes
  useEffect(() => {
    if (editor && selectedNote) {
      // Only update if content is different to avoid cursor jumps
      if (editor.getHTML() !== selectedNote.content) {
        editor.commands.setContent(selectedNote.content);
      }
    } else if (editor && !selectedNote) {
      editor.commands.setContent('');
    }
  }, [editor, selectedNote]);

  // Update note content
  const updateNoteContent = useCallback((id: string, content: string) => {
    setNotes(prev => {
      const updated = prev.map(note => {
        if (note.id === id) {
          // Extract title from first line of content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          const firstText = tempDiv.textContent?.split('\n')[0]?.trim() || 'Untitled';
          const title = firstText.slice(0, 50) || 'Untitled';
          
          return {
            ...note,
            title,
            content,
            updatedAt: new Date(),
          };
        }
        return note;
      });
      saveNotes(updated);
      return updated;
    });
  }, []);

  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[500px]">
      {selectedNote ? (
        <>
          {/* Toolbar */}
          <EditorToolbar editor={editor} />

          {/* Markdown shortcuts hint */}
          <div className="text-xs text-muted-foreground mb-3 px-1">
            <span className="opacity-70">Shortcuts: </span>
            <code className="bg-muted px-1 rounded text-[10px]">#</code> heading
            <span className="mx-1.5">·</span>
            <code className="bg-muted px-1 rounded text-[10px]">&gt;</code> quote
            <span className="mx-1.5">·</span>
            <code className="bg-muted px-1 rounded text-[10px]">```</code> code
            <span className="mx-1.5">·</span>
            <code className="bg-muted px-1 rounded text-[10px]">*</code> list
            <span className="mx-1.5">·</span>
            <code className="bg-muted px-1 rounded text-[10px]">`code`</code>
            <span className="mx-1.5">·</span>
            <code className="bg-muted px-1 rounded text-[10px]">==highlight==</code>
            <span className="mx-1.5">·</span>
            <code className="bg-muted px-1 rounded text-[10px]">(c)</code> ©
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            <div className="tiptap-editor-wrapper">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <p className="text-lg">Loading...</p>
        </div>
      )}
    </div>
  );
}
