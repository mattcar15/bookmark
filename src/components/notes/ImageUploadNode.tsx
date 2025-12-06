'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';

// React component for the image upload node view
const ImageUploadComponent = ({ node, updateAttributes, deleteNode, selected }: {
  node: { attrs: { src: string | null; uploading: boolean; width: number | null; height: number | null } };
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
  selected: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState(1);
  
  const { src, uploading, width, height } = node.attrs;

  // Calculate aspect ratio when image loads
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setAspectRatio(ratio);
    
    // Set initial size if not set
    if (!width && !height) {
      const maxWidth = Math.min(img.naturalWidth, 600);
      updateAttributes({ 
        width: maxWidth, 
        height: Math.round(maxWidth / ratio) 
      });
    }
  }, [width, height, updateAttributes]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: width || 300, height: height || 200 });
  }, [width, height]);

  // Handle resize move
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      
      // Calculate new dimensions based on resize direction
      if (resizeDirection?.includes('right')) {
        newWidth = Math.max(100, startSize.width + deltaX);
      } else if (resizeDirection?.includes('left')) {
        newWidth = Math.max(100, startSize.width - deltaX);
      }
      
      if (resizeDirection?.includes('bottom')) {
        newHeight = Math.max(100, startSize.height + deltaY);
      } else if (resizeDirection?.includes('top')) {
        newHeight = Math.max(100, startSize.height - deltaY);
      }
      
      // Maintain aspect ratio for corner handles
      if (resizeDirection?.includes('-')) {
        // Corner handle - maintain aspect ratio
        const widthRatio = newWidth / startSize.width;
        const heightRatio = newHeight / startSize.height;
        const ratio = Math.max(widthRatio, heightRatio);
        newWidth = Math.max(100, Math.round(startSize.width * ratio));
        newHeight = Math.max(100, Math.round(startSize.height * ratio));
      }
      
      updateAttributes({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, startPos, startSize, aspectRatio, updateAttributes]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    updateAttributes({ uploading: true });
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        updateAttributes({ src: result, uploading: false });
      }
    };
    reader.onerror = () => {
      updateAttributes({ uploading: false });
    };
    reader.readAsDataURL(file);
  }, [updateAttributes]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Resize handle component
  const ResizeHandle = ({ position, cursor }: { position: string; cursor: string }) => (
    <div
      onMouseDown={(e) => handleResizeStart(e, position)}
      className={`
        absolute w-3 h-3 bg-primary rounded-full border-2 border-background
        opacity-0 group-hover:opacity-100 transition-opacity z-10
        ${isResizing ? 'opacity-100' : ''}
      `}
      style={{
        cursor,
        ...(position.includes('top') ? { top: -6 } : {}),
        ...(position.includes('bottom') ? { bottom: -6 } : {}),
        ...(position.includes('left') ? { left: -6 } : {}),
        ...(position.includes('right') ? { right: -6 } : {}),
        ...(position === 'top' || position === 'bottom' ? { left: '50%', transform: 'translateX(-50%)' } : {}),
        ...(position === 'left' || position === 'right' ? { top: '50%', transform: 'translateY(-50%)' } : {}),
      }}
    />
  );

  // If we have a source, show the image with resize handles
  if (src) {
    return (
      <NodeViewWrapper className="my-4">
        <div 
          ref={containerRef}
          className={`relative inline-block group ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          style={{ 
            width: width ? `${width}px` : 'auto',
            maxWidth: '100%',
          }}
        >
          <img 
            ref={imageRef}
            src={src} 
            alt="Uploaded image" 
            className="block w-full h-auto rounded-lg"
            style={{ 
              width: width ? `${width}px` : 'auto',
              height: height ? `${height}px` : 'auto',
            }}
            onLoad={handleImageLoad}
            draggable={false}
          />
          
          {/* Delete button */}
          <button
            onClick={deleteNode}
            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Resize handles */}
          <ResizeHandle position="top-left" cursor="nw-resize" />
          <ResizeHandle position="top-right" cursor="ne-resize" />
          <ResizeHandle position="bottom-left" cursor="sw-resize" />
          <ResizeHandle position="bottom-right" cursor="se-resize" />
          <ResizeHandle position="top" cursor="n-resize" />
          <ResizeHandle position="bottom" cursor="s-resize" />
          <ResizeHandle position="left" cursor="w-resize" />
          <ResizeHandle position="right" cursor="e-resize" />

          {/* Size indicator */}
          {(isResizing || selected) && width && height && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
              {Math.round(width)} × {Math.round(height)}
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  // Show upload placeholder
  return (
    <NodeViewWrapper className="my-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-sm">Processing image...</span>
            </>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-full">
                {isDragOver ? (
                  <Upload className="w-8 h-8 text-primary" />
                ) : (
                  <ImageIcon className="w-8 h-8" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragOver ? 'Drop image here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs mt-1">PNG, JPG, GIF, WebP supported</p>
              </div>
            </>
          )}
        </div>

        {/* Delete button */}
        {!uploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode();
            }}
            className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// TipTap extension
export const ImageUploadNode = Node.create({
  name: 'imageUpload',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      uploading: {
        default: false,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload"]',
      },
      {
        tag: 'img[data-image-upload]',
        getAttrs: (dom) => {
          const element = dom as HTMLImageElement;
          return {
            src: element.getAttribute('src'),
            width: element.getAttribute('width') ? parseInt(element.getAttribute('width')!) : null,
            height: element.getAttribute('height') ? parseInt(element.getAttribute('height')!) : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // If there's a src, render as an img tag for HTML export
    if (HTMLAttributes.src) {
      return ['img', mergeAttributes({ 
        src: HTMLAttributes.src, 
        class: 'editor-image',
        'data-image-upload': 'true',
        ...(HTMLAttributes.width ? { width: HTMLAttributes.width } : {}),
        ...(HTMLAttributes.height ? { height: HTMLAttributes.height } : {}),
      })];
    }
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadComponent);
  },

  addCommands() {
    return {
      insertImageUpload: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});

// Declare module augmentation for TypeScript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      insertImageUpload: () => ReturnType;
    };
  }
}
