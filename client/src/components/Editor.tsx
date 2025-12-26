import { useState, useRef } from "react";
import { Upload, X, Plus, Image as ImageIcon, FileText, Code as CodeIcon, Type } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import clsx from "clsx";

// Types matching DB jsonb structure
export type BlockType = 'text' | 'image' | 'code' | 'document';

export interface Block {
  id: string;
  type: BlockType;
  content: any;
}

interface EditorProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[]) => void;
  onCoverImageChange: (url: string) => void;
  coverImage?: string;
  title: string;
  onTitleChange: (title: string) => void;
}

export function Editor({ initialBlocks, onChange, onCoverImageChange, coverImage, title, onTitleChange }: EditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks || [{ id: '1', type: 'text', content: '' }]);
  const { uploadFile, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateBlock = (id: string, content: any) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, content } : b);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: ''
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const res = await uploadFile(file);
    if (res) {
      onCoverImageChange(res.uploadURL); // Note: Assuming uploadURL is public or proxied correctly
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {/* Cover Image */}
      <div className="relative group mb-8 rounded-2xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
        {coverImage ? (
          <>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <button 
              onClick={() => onCoverImageChange('')}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:underline font-medium"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Add Cover Image"}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleCoverUpload}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Article Title..."
        className="w-full bg-transparent text-4xl md:text-5xl font-display font-bold text-foreground placeholder:text-muted-foreground/50 border-none outline-none mb-8"
      />

      {/* Blocks */}
      <div className="space-y-6">
        {blocks.map((block) => (
          <BlockEditor 
            key={block.id} 
            block={block} 
            onChange={(content) => updateBlock(block.id, content)}
            onDelete={() => removeBlock(block.id)}
          />
        ))}
      </div>

      {/* Add Block Controls */}
      <div className="mt-8 flex items-center gap-2 justify-center py-4 border-t border-border border-dashed">
        <span className="text-sm text-muted-foreground mr-2">Add block:</span>
        <AddBlockBtn icon={Type} label="Text" onClick={() => addBlock('text')} />
        <AddBlockBtn icon={ImageIcon} label="Image" onClick={() => addBlock('image')} />
        <AddBlockBtn icon={CodeIcon} label="Code" onClick={() => addBlock('code')} />
        <AddBlockBtn icon={FileText} label="Doc" onClick={() => addBlock('document')} />
      </div>
    </div>
  );
}

function AddBlockBtn({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary transition-colors text-sm font-medium"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function BlockEditor({ block, onChange, onDelete }: { block: Block, onChange: (val: any) => void, onDelete: () => void }) {
  const { uploadFile, isUploading } = useUpload();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadFile(file);
    if (res) onChange(res.uploadURL);
  };

  return (
    <div className="group relative pl-8">
      <div className="absolute left-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {block.type === 'text' && (
        <textarea
          value={block.content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing..."
          className="w-full bg-transparent resize-none outline-none text-lg leading-relaxed text-foreground min-h-[100px]"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
      )}

      {block.type === 'image' && (
        <div className="rounded-xl overflow-hidden bg-muted/50 border border-border">
          {block.content ? (
            <div className="relative">
              <img src={block.content} alt="Content" className="w-full" />
              <button 
                onClick={() => onChange('')}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-12 text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <label className="cursor-pointer text-primary hover:underline font-medium">
                Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          )}
        </div>
      )}

      {block.type === 'code' && (
        <div className="rounded-xl overflow-hidden bg-black/50 border border-border p-4 font-mono">
          <textarea
            value={block.content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="// Paste your code here..."
            className="w-full bg-transparent resize-none outline-none text-sm text-green-400 min-h-[100px]"
            spellCheck={false}
          />
        </div>
      )}

      {block.type === 'document' && (
        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            {block.content ? (
              <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                {block.content.split('/').pop() || 'Download Document'}
              </a>
            ) : (
              <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                {isUploading ? "Uploading..." : "Click to upload document (PDF, DOCX)"}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            )}
          </div>
          {block.content && (
             <button onClick={() => onChange('')} className="p-2 text-muted-foreground hover:text-destructive">
               <X className="w-4 h-4" />
             </button>
          )}
        </div>
      )}
    </div>
  );
}
