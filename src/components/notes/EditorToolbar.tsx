'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  CheckSquare, Quote, Minus, Link as LinkIcon, Heading1, Heading2, Heading3, 
  Table as TableIcon, Palette, Highlighter,
  FileCode, ChevronDown, Eraser, RowsIcon, Columns, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, Trash2, Type, AlignLeft, AlignCenter, AlignRight, ImageIcon
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarDivider } from './ToolbarDivider';
import { DropdownMenu } from './DropdownMenu';
import { CELL_COLORS, HIGHLIGHT_COLORS } from './constants';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);

  // Add link
  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  // Set cell background color
  const setCellColor = useCallback((color: string | null) => {
    if (!editor) return;
    if (color === null) {
      editor.chain().focus().setCellAttribute('backgroundColor', null).run();
    } else {
      editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    }
    setShowColorPicker(false);
  }, [editor]);

  // Set text highlight color
  const setHighlightColor = useCallback((color: string | null) => {
    if (!editor) return;
    if (color === null) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setShowHighlightPicker(false);
  }, [editor]);

  // Toggle code block
  const toggleCodeBlock = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCodeBlock().run();
  }, [editor]);

  // Delete current node/selection
  const deleteNode = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('table')) {
      editor.chain().focus().deleteTable().run();
    } else {
      editor.chain().focus().deleteSelection().run();
    }
  }, [editor]);

  // Insert image upload placeholder
  const insertImageUpload = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertImageUpload().run();
  }, [editor]);

  // Get current heading level or paragraph
  const getCurrentBlockType = () => {
    if (!editor) return 'Paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Paragraph';
  };

  // Get current alignment
  const getCurrentAlignment = () => {
    if (!editor) return 'left';
    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    return 'left';
  };

  if (!editor) return null;

  return (
    <div className="sticky top-0 z-10 bg-background pb-3 border-b border-border mb-4">
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* Block type dropdown (Heading/Paragraph) */}
        <DropdownMenu
          trigger={
            <button
              title="Block type"
              className={`px-2 py-1.5 rounded transition-colors flex items-center gap-1 text-sm ${
                editor.isActive('heading')
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {getCurrentBlockType() === 'Paragraph' ? (
                <Type className="w-4 h-4" />
              ) : getCurrentBlockType() === 'Heading 1' ? (
                <Heading1 className="w-4 h-4" />
              ) : getCurrentBlockType() === 'Heading 2' ? (
                <Heading2 className="w-4 h-4" />
              ) : (
                <Heading3 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{getCurrentBlockType()}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }
          isOpen={showHeadingDropdown}
          onOpenChange={setShowHeadingDropdown}
        >
          <div className="py-1">
            <button
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setShowHeadingDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                !editor.isActive('heading') ? 'bg-accent' : ''
              }`}
            >
              <Type className="w-4 h-4" />
              Paragraph
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setShowHeadingDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''
              }`}
            >
              <Heading1 className="w-4 h-4" />
              Heading 1
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setShowHeadingDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''
              }`}
            >
              <Heading2 className="w-4 h-4" />
              Heading 2
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                setShowHeadingDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''
              }`}
            >
              <Heading3 className="w-4 h-4" />
              Heading 3
            </button>
          </div>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Text alignment dropdown */}
        <DropdownMenu
          trigger={
            <button
              title="Text alignment"
              className="p-1.5 rounded transition-colors flex items-center gap-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {getCurrentAlignment() === 'left' ? (
                <AlignLeft className="w-4 h-4" />
              ) : getCurrentAlignment() === 'center' ? (
                <AlignCenter className="w-4 h-4" />
              ) : (
                <AlignRight className="w-4 h-4" />
              )}
              <ChevronDown className="w-3 h-3" />
            </button>
          }
          isOpen={showAlignDropdown}
          onOpenChange={setShowAlignDropdown}
        >
          <div className="py-1">
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('left').run();
                setShowAlignDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                getCurrentAlignment() === 'left' ? 'bg-accent' : ''
              }`}
            >
              <AlignLeft className="w-4 h-4" />
              Align left
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('center').run();
                setShowAlignDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                getCurrentAlignment() === 'center' ? 'bg-accent' : ''
              }`}
            >
              <AlignCenter className="w-4 h-4" />
              Align center
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('right').run();
                setShowAlignDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                getCurrentAlignment() === 'right' ? 'bg-accent' : ''
              }`}
            >
              <AlignRight className="w-4 h-4" />
              Align right
            </button>
          </div>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        {/* Highlight color picker */}
        <DropdownMenu
          trigger={
            <button
              title="Highlight text"
              className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
                editor.isActive('highlight')
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Highlighter className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
          }
          isOpen={showHighlightPicker}
          onOpenChange={setShowHighlightPicker}
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 px-1">Highlight</div>
            <div className="grid grid-cols-4 gap-1.5">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setHighlightColor(color.value)}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <button
              onClick={() => setHighlightColor(null)}
              className="w-full mt-2 px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded flex items-center gap-1.5 justify-center"
            >
              <Eraser className="w-3 h-3" />
              Remove highlight
            </button>
          </div>
        </DropdownMenu>

        <ToolbarDivider />

        {/* List dropdown */}
        <DropdownMenu
          trigger={
            <button
              title="Lists"
              className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
                editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <List className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
          }
          isOpen={showListDropdown}
          onOpenChange={setShowListDropdown}
        >
          <div className="py-1">
            <button
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                setShowListDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                editor.isActive('bulletList') ? 'bg-accent' : ''
              }`}
            >
              <List className="w-4 h-4" />
              Bullet list
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                setShowListDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                editor.isActive('orderedList') ? 'bg-accent' : ''
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Numbered list
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleTaskList().run();
                setShowListDropdown(false);
              }}
              className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted ${
                editor.isActive('taskList') ? 'bg-accent' : ''
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Task list
            </button>
          </div>
        </DropdownMenu>

        <ToolbarDivider />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleCodeBlock}
          isActive={editor.isActive('codeBlock')}
          title="Code block"
        >
          <FileCode className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Insert elements */}
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Add link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
          disabled={editor.isActive('table')}
        >
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={insertImageUpload}
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* Table row/column controls - only show when in table */}
        {editor.isActive('table') && (
          <>
            <ToolbarDivider />
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add row above"
            >
              <div className="flex items-center gap-0.5">
                <RowsIcon className="w-3 h-3" />
                <ArrowUp className="w-2.5 h-2.5" />
              </div>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add row below"
            >
              <div className="flex items-center gap-0.5">
                <RowsIcon className="w-3 h-3" />
                <ArrowDown className="w-2.5 h-2.5" />
              </div>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete row"
            >
              <div className="flex items-center gap-0.5">
                <RowsIcon className="w-3 h-3" />
                <Trash2 className="w-2.5 h-2.5" />
              </div>
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add column left"
            >
              <div className="flex items-center gap-0.5">
                <Columns className="w-3 h-3" />
                <ArrowLeft className="w-2.5 h-2.5" />
              </div>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add column right"
            >
              <div className="flex items-center gap-0.5">
                <Columns className="w-3 h-3" />
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete column"
            >
              <div className="flex items-center gap-0.5">
                <Columns className="w-3 h-3" />
                <Trash2 className="w-2.5 h-2.5" />
              </div>
            </ToolbarButton>
          </>
        )}

        <ToolbarDivider />

        {/* Cell background color picker */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Cell background color"
            disabled={!editor.isActive('tableCell') && !editor.isActive('tableHeader')}
          >
            <Palette className="w-4 h-4" />
          </ToolbarButton>
          
          {showColorPicker && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowColorPicker(false)} 
              />
              <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-2 min-w-[120px]">
                <div className="text-xs text-muted-foreground mb-2 px-1">Cell color</div>
                <div className="grid grid-cols-4 gap-1">
                  {CELL_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setCellColor(color.value)}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color.value || 'transparent',
                        backgroundImage: color.value === null ? 'linear-gradient(135deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)' : undefined
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Delete node button */}
        <ToolbarButton
          onClick={deleteNode}
          title="Delete selection"
        >
          <Trash2 className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </div>
  );
};

