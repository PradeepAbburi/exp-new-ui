import { useState, useRef, useEffect } from "react";
import { Upload, X, Plus, Image as ImageIcon, FileText, Code as CodeIcon, Type, ArrowUp, ArrowDown, GripVertical, CheckSquare, Minus, MonitorPlay, ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Strikethrough, Heading, List, Quote, Columns, PanelLeft, PanelRight, Link as LinkIcon, Code2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import clsx from "clsx";
import { ImageCropper } from "./ImageCropper";

// Types matching DB jsonb structure
export type BlockType = 'text' | 'media' | 'code' | 'document' | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: any;
  attrs?: {
    width?: number; // percentage
    align?: 'left' | 'center' | 'right';
    layout?: 'center' | 'media-left' | 'media-right'; // new layout mode
    sideText?: string; // Content for the side text editor
    splitRatio?: number; // percentage for the split (default 50)
    [key: string]: any;
  };
}

interface EditorProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[]) => void;
  onCoverImageChange: (url: string) => void;
  coverImage?: string;
  title: string;
  onTitleChange: (title: string) => void;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export function Editor({ initialBlocks, onChange, onCoverImageChange, coverImage, title, onTitleChange, tags, onTagsChange }: EditorProps) {
  // Map legacy 'image' or 'video' types to 'media' if existing data is loaded
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks?.map(b => (b.type as any) === 'image' || (b.type as any) === 'video' ? { ...b, type: 'media' } : (b as Block)) ||
    [{ id: '1', type: 'text', content: '' }]
  );
  const { uploadFile, isUploading, progress } = useUpload();
  const [isLocalUploading, setIsLocalUploading] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: BlockType, index: number = blocks.length) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      attrs: { width: 100, align: 'center', layout: 'center', splitRatio: 50 }
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];

    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadFile(file);
    if (res) {
      onCoverImageChange(res.uploadURL);
    }
  };

  return (
    <div className="pb-32">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setSelectedImage(reader.result as string);
              setCropperOpen(true);
            };
            reader.readAsDataURL(file);
          }
          e.target.value = '';
        }}
      />

      {/* Full-Width Header Banner */}
      <div className="w-full aspect-[4/1] bg-muted relative group overflow-hidden border-b border-border shadow-md mb-12">
        {coverImage ? (
          <>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className={clsx(
              "absolute inset-0 transition-colors flex items-center justify-center",
              (isUploading || isLocalUploading) ? "bg-black/40" : "bg-black/0 group-hover:bg-black/20"
            )}>
              {(isUploading || isLocalUploading) ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-bold text-sm">Processing...</span>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-black px-4 py-2 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl"
                >
                  Upload
                </button>
              )}
            </div>
            {!(isUploading || isLocalUploading) && (
              <button
                onClick={() => onCoverImageChange('')}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-muted to-secondary/5">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {(isUploading || isLocalUploading) ? <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ImageIcon className="w-8 h-8 text-primary" />}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary px-6 py-2 rounded-xl font-bold shadow-lg"
              disabled={isUploading || isLocalUploading}
            >
              {(isUploading || isLocalUploading) ? "Processing..." : "Upload"}
            </button>
            <p className="text-xs text-muted-foreground mt-3 italic">Recommended: Wide rectangular image (4:1 ratio)</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <ImageCropper
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={selectedImage}
          onCropComplete={async (blob: Blob) => {
            setIsLocalUploading(true);
            try {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                onCoverImageChange(base64data);
                setIsLocalUploading(false);
              };
              reader.readAsDataURL(blob);
            } catch (err) {
              console.error("Base64 conversion failed:", err);
              setIsLocalUploading(false);
            }
          }}
          aspectRatio={4}
          title="Crop Article Banner"
          description="Drag to adjust your panoramic banner. 4:1 ratio works best."
        />

        {/* Title */}
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Page Title..."
          className="w-full bg-transparent text-4xl md:text-5xl font-display font-bold text-foreground placeholder:text-muted-foreground/50 border-none outline-none mb-8"
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-8 pl-1">
          {tags?.map(tag => (
            <span key={tag} className="px-3 py-1 bg-muted/50 border border-border rounded-full text-xs font-medium flex items-center gap-1.5 animate-in zoom-in-50 duration-200">
              #{tag}
              <button onClick={() => onTagsChange?.(tags.filter(t => t !== tag))} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <input
            placeholder="Add tags... (Press Enter)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = e.currentTarget.value.trim();
                if (val && !tags?.includes(val)) {
                  onTagsChange?.([...(tags || []), val]);
                  e.currentTarget.value = '';
                }
              }
            }}
            className="bg-transparent outline-none text-sm font-medium text-muted-foreground placeholder:text-muted-foreground/50 min-w-[150px]"
          />
        </div>

        {/* Blocks */}
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id} className="group relative">
              {/* Divider / Add new block bar */}
              <div className="h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity py-1 z-10 absolute left-0 right-0 -top-4">
                <div className="flex items-center gap-1 bg-card/90 backdrop-blur border border-border rounded-full shadow-sm px-2 py-0.5 scale-90 hover:scale-100 transition-transform">
                  <button onClick={() => addBlock('text', index)} title="Add Text" className="p-1.5 hover:text-primary hover:bg-muted rounded-full transition-colors"><Type className="w-3.5 h-3.5" /></button>
                  <button onClick={() => addBlock('media', index)} title="Add Media" className="p-1.5 hover:text-primary hover:bg-muted rounded-full transition-colors"><MonitorPlay className="w-3.5 h-3.5" /></button>
                  <button onClick={() => addBlock('code', index)} title="Add Code" className="p-1.5 hover:text-primary hover:bg-muted rounded-full transition-colors"><CodeIcon className="w-3.5 h-3.5" /></button>
                  <button onClick={() => addBlock('document', index)} title="Add Document" className="p-1.5 hover:text-primary hover:bg-muted rounded-full transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-3 bg-border mx-0.5" />
                  <button onClick={() => addBlock('divider', index)} title="Add Divider" className="p-1.5 hover:text-primary hover:bg-muted rounded-full transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="relative pl-10 pr-4">
                {/* Reorder Controls */}
                <div className="absolute left-0 top-1.5 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <button
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete Control */}
                <div className="absolute right-0 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button onClick={() => removeBlock(block.id)} className="p-1 text-muted-foreground hover:text-destructive bg-card/50 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <BlockEditor
                  block={block}
                  onChange={(updates) => updateBlock(block.id, updates)}
                  uploadFile={uploadFile}
                  isUploading={isUploading}
                  onUploadStart={() => setUploadingBlockId(block.id)}
                  onUploadComplete={() => setUploadingBlockId(null)}
                />

                {/* Upload Progress Overlay */}
                {uploadingBlockId === block.id && isUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-30">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
                      <div className="flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <p className="text-center text-sm font-medium mb-4">Uploading...</p>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-center text-xs text-muted-foreground font-mono">{Math.round(progress)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Block Controls (Bottom) */}
        <div className="mt-8 flex items-center gap-2 justify-center py-4 border-t border-border border-dashed">
          <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">Add:</span>
          <AddBlockBtn icon={Type} label="Text" onClick={() => addBlock('text')} />
          <AddBlockBtn icon={MonitorPlay} label="Media" onClick={() => addBlock('media')} />
          <AddBlockBtn icon={CodeIcon} label="Code" onClick={() => addBlock('code')} />
          <AddBlockBtn icon={FileText} label="Document" onClick={() => addBlock('document')} />
          <AddBlockBtn icon={Minus} label="Divider" onClick={() => addBlock('divider')} />
        </div>
      </div>
    </div>
  );
}

function AddBlockBtn({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-2.5 rounded-xl bg-secondary hover:bg-primary/20 hover:text-primary transition-all hover:scale-110 active:scale-95"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function BlockEditor({
  block,
  onChange,
  onUploadStart,
  onUploadComplete,
  uploadFile,
  isUploading
}: {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  uploadFile?: (file: File) => Promise<any>;
  isUploading?: boolean;
}) {
  const [showInput, setShowInput] = useState(!block.content);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Ref for the flex container to calculate drag percentages
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadFile) return;

    // File size limits (in bytes)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_VIDEO_SIZE = 45 * 1024 * 1024; // 45 MB
    const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB

    // Check file size
    let maxSize = MAX_IMAGE_SIZE;
    let fileType = 'file';

    if (file.type.startsWith('image/')) {
      maxSize = MAX_IMAGE_SIZE;
      fileType = 'Image';
    } else if (file.type.startsWith('video/')) {
      maxSize = MAX_VIDEO_SIZE;
      fileType = 'Video';
    } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('word') || file.type.includes('sheet')) {
      maxSize = MAX_DOCUMENT_SIZE;
      fileType = 'Document';
    }

    if (file.size > maxSize) {
      alert(`${fileType} size exceeds limit! Maximum allowed: ${Math.round(maxSize / 1024 / 1024)} MB`);
      e.target.value = ''; // Reset file input
      return;
    }

    onUploadStart?.();
    const res = await uploadFile(file);
    onUploadComplete?.();

    if (res) {
      onChange({ content: res.uploadURL });
      setShowInput(false);
    }
  };

  const updateWidth = (delta: number) => {
    const currentWidth = block.attrs?.width || 100;
    const newWidth = Math.max(25, Math.min(100, currentWidth + delta));
    onChange({ attrs: { ...block.attrs, width: newWidth } });
  };

  const updateLayout = (layout: 'center' | 'media-left' | 'media-right') => {
    onChange({ attrs: { ...block.attrs, layout } });
  };

  const updateAlign = (align: 'left' | 'center' | 'right') => {
    onChange({ attrs: { ...block.attrs, align } });
  }

  const insertTextFormat = (ref: React.RefObject<HTMLTextAreaElement>, val: string, setter: (v: string) => void, prefix: string, suffix: string = '') => {
    if (!ref.current) return;
    const start = ref.current.selectionStart;
    const end = ref.current.selectionEnd;
    const text = val || '';
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    setter(newText);

    setTimeout(() => {
      ref.current?.focus();
      const newPos = start + prefix.length + selection.length + (suffix ? 0 : 0);
      ref.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const getMediaComponent = (url: string) => {
    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
    const width = block.attrs?.width || 100;
    const layout = block.attrs?.layout || 'center';

    // In side-by-side mode, media takes relative width within the flex container
    // If layout is 'center', width is relative to parent block
    // If layout is side-by-side, width is 100% of its split pane
    const style = layout === 'center' ? { width: `${width}%` } : { width: '100%', height: '100%', objectFit: 'cover' as const };

    const wrapperClass = clsx(
      "relative group/media transition-all duration-300",
      layout === 'center' && (block.attrs?.align === 'left' ? "mr-auto" : (block.attrs?.align === 'right' ? "ml-auto" : "mx-auto")),
      layout !== 'center' && "h-full"
    );

    if (isVideo) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be')) videoId = url.split('/').pop() || '';
        else videoId = new URL(url).searchParams.get('v') || '';
        return (
          <div style={layout === 'center' ? style : { width: '100%', height: '100%' }} className={clsx("rounded-lg shadow-sm bg-black/10 overflow-hidden", wrapperClass)}>
            <iframe className="w-full h-full aspect-video" src={`https://www.youtube.com/embed/${videoId}`} allowFullScreen title="YouTube video player" />
          </div>
        );
      }
      if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return (
          <div style={layout === 'center' ? style : { width: '100%', height: '100%' }} className={clsx("rounded-lg shadow-sm bg-black/10 overflow-hidden", wrapperClass)}>
            <iframe className="w-full h-full aspect-video" src={`https://player.vimeo.com/video/${videoId}`} allowFullScreen title="Vimeo video player" />
          </div>
        );
      }
      return <video src={url} controls style={style} className={clsx("rounded-lg shadow-sm", wrapperClass)} />;
    }
    return <img src={url} alt="Content" style={style} className={clsx("rounded-lg shadow-sm", wrapperClass)} />;
  };

  // Text inputs need separate refs if multiple exist
  const sideTextRef = useRef<HTMLTextAreaElement>(null);

  // Resize Handler
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRatio = block.attrs?.splitRatio || 50;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / width) * 100;

      let newRatio = startRatio + (block.attrs?.layout === 'media-right' ? -deltaPercent : deltaPercent);
      // Clamp between 20% and 80% to avoid breaking UI
      newRatio = Math.max(20, Math.min(80, newRatio));

      onChange({ attrs: { ...block.attrs, splitRatio: newRatio } });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  switch (block.type) {
    case 'text':
      return (
        <div className="relative group/text pt-2">
          {/* Text Format Toolbar */}
          <div className="absolute -top-10 left-0 flex gap-1 bg-card border border-border rounded-lg shadow-sm p-1 opacity-0 group-focus-within/text:opacity-100 transition-opacity z-20 pointer-events-none group-focus-within/text:pointer-events-auto flex-wrap max-w-[90vw] sm:max-w-none">
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '# '); }} className="p-1.5 hover:bg-muted rounded text-xs px-2 font-bold" title="Heading 1">H1</button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '## '); }} className="p-1.5 hover:bg-muted rounded text-xs px-2 font-bold" title="Heading 2">H2</button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '### '); }} className="p-1.5 hover:bg-muted rounded text-xs px-2 font-bold" title="Heading 3">H3</button>
            <div className="w-px h-4 bg-border my-auto mx-1" />
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '**', '**'); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="Bold"><Bold className="w-3 h-3" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '*', '*'); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="Italic"><Italic className="w-3 h-3" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '~~', '~~'); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="Strikethrough"><Strikethrough className="w-3 h-3" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '`', '`'); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="Inline Code"><Code2 className="w-3 h-3" /></button>
            <div className="w-px h-4 bg-border my-auto mx-1" />
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '[', '](url)'); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="Link"><LinkIcon className="w-3 h-3" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '> '); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="Quote"><Quote className="w-3 h-3" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(textRef, block.content, (v) => onChange({ content: v }), '- '); }} className="p-1.5 hover:bg-muted rounded text-xs px-2" title="List"><List className="w-3 h-3" /></button>
          </div>
          <textarea
            ref={textRef}
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Start writing..."
            className="w-full bg-transparent resize-none outline-none text-lg leading-relaxed text-foreground min-h-[50px] focus:min-h-[100px] transition-all"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
      );
    case 'divider':
      return <div className="py-4"><hr className="border-border" /></div>;
    case 'media':
    // @ts-ignore
    case 'image':
      const layout = block.attrs?.layout || 'center';
      const splitRatio = block.attrs?.splitRatio || 50;

      return (
        <div className="rounded-xl bg-muted/30 border border-border p-4">
          {block.content && !showInput ? (
            <div className="relative w-full">
              <div
                ref={containerRef}
                className={clsx("flex gap-0 items-stretch transition-all", layout === 'media-right' ? "flex-row-reverse" : "flex-row")}
              >
                {/* Media Column */}
                <div
                  className={clsx("transition-all duration-75 relative", layout !== 'center' ? "" : "w-full")}
                  style={layout !== 'center' ? { width: `${splitRatio}%` } : {}}
                >
                  {getMediaComponent(block.content)}
                </div>

                {/* Resizer Handle */}
                {layout !== 'center' && (
                  <div
                    className="w-4 flex items-center justify-center cursor-col-resize hover:bg-primary/10 group/resizer z-10 -ml-2 -mr-2 relative"
                    onMouseDown={startResize}
                  >
                    <div className="w-1 h-8 bg-border rounded-full group-hover/resizer:bg-primary transition-colors" />
                  </div>
                )}

                {/* Side Text Editor Column */}
                {layout !== 'center' && (
                  <div
                    className="relative group/sidetext"
                    style={{ width: `${100 - splitRatio}%` }}
                  >
                    {/* Mini Toolbar for Side Text */}
                    <div className="absolute -top-10 left-0 flex gap-1 bg-card border border-border rounded-lg shadow-sm p-1 opacity-0 group-focus-within/sidetext:opacity-100 transition-opacity z-20 pointer-events-none group-focus-within/sidetext:pointer-events-auto flex-wrap max-w-[200px] sm:max-w-none">
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '# '); }} className="p-1 hover:bg-muted rounded text-[10px] font-bold px-1.5" title="H1">H1</button>
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '## '); }} className="p-1 hover:bg-muted rounded text-[10px] font-bold px-1.5" title="H2">H2</button>
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '### '); }} className="p-1 hover:bg-muted rounded text-[10px] font-bold px-1.5" title="H3">H3</button>
                      <div className="w-px h-3 bg-border my-auto mx-0.5" />
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '**', '**'); }} className="p-1 hover:bg-muted rounded"><Bold className="w-3 h-3" /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '*', '*'); }} className="p-1 hover:bg-muted rounded"><Italic className="w-3 h-3" /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '~~', '~~'); }} className="p-1 hover:bg-muted rounded"><Strikethrough className="w-3 h-3" /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '`', '`'); }} className="p-1 hover:bg-muted rounded"><Code2 className="w-3 h-3" /></button>
                      <div className="w-px h-3 bg-border my-auto mx-0.5" />
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '[', '](url)'); }} className="p-1 hover:bg-muted rounded"><LinkIcon className="w-3 h-3" /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); insertTextFormat(sideTextRef, block.attrs?.sideText || '', (v) => onChange({ attrs: { ...block.attrs, sideText: v } }), '- '); }} className="p-1 hover:bg-muted rounded"><List className="w-3 h-3" /></button>
                    </div>
                    <textarea
                      ref={sideTextRef}
                      value={block.attrs?.sideText || ''}
                      onChange={(e) => onChange({ attrs: { ...block.attrs, sideText: e.target.value } })}
                      placeholder="Describe this media..."
                      className="w-full h-full bg-transparent resize-none outline-none text-base text-foreground min-h-[150px] p-4 border border-transparent focus:border-border rounded-lg transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Controls Overlay */}
              <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                <div className="flex bg-black/50 text-white rounded-lg p-1 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                  {/* Zoom Controls (only meaningful if center layout usually, but kept for consistency) */}
                  {layout === 'center' && (
                    <>
                      <button onClick={() => updateWidth(-25)} className="p-1 hover:bg-white/20 rounded" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                      <span className="text-xs px-2 flex items-center tabular-nums">{block.attrs?.width || 100}%</span>
                      <button onClick={() => updateWidth(25)} className="p-1 hover:bg-white/20 rounded" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                      <div className="w-px h-4 bg-white/20 mx-1" />
                      <button onClick={() => updateAlign('left')} className={clsx("p-1 hover:bg-white/20 rounded", block.attrs?.align === 'left' && "bg-white/20")} title="Align Left"><AlignLeft className="w-4 h-4" /></button>
                      <button onClick={() => updateAlign('center')} className={clsx("p-1 hover:bg-white/20 rounded", (!block.attrs?.align || block.attrs?.align === 'center') && "bg-white/20")} title="Align Center"><AlignCenter className="w-4 h-4" /></button>
                      <button onClick={() => updateAlign('right')} className={clsx("p-1 hover:bg-white/20 rounded", block.attrs?.align === 'right' && "bg-white/20")} title="Align Right"><AlignRight className="w-4 h-4" /></button>
                      <div className="w-px h-4 bg-white/20 mx-1" />
                    </>
                  )}

                  {/* Layout Controls */}
                  <button onClick={() => updateLayout('center')} className={clsx("p-1 hover:bg-white/20 rounded", layout === 'center' && "bg-white/20")} title="Full Width / Center"><Columns className="w-4 h-4" /></button>
                  <button onClick={() => updateLayout('media-left')} className={clsx("p-1 hover:bg-white/20 rounded", layout === 'media-left' && "bg-white/20")} title="Media Left, Text Right"><PanelLeft className="w-4 h-4" /></button>
                  <button onClick={() => updateLayout('media-right')} className={clsx("p-1 hover:bg-white/20 rounded", layout === 'media-right' && "bg-white/20")} title="Text Left, Media Right"><PanelRight className="w-4 h-4" /></button>
                </div>
                <button
                  onClick={() => { setShowInput(true); onChange({ content: '' }); }}
                  className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-red-500 transition-colors backdrop-blur-sm opacity-0 hover:opacity-100"
                  title="Remove Media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4 w-full">
              <div className="flex flex-col items-center gap-2 mb-4">
                <MonitorPlay className="w-8 h-8 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">Add Media</span>
              </div>

              <div className="flex items-center gap-2 max-w-sm mx-auto w-full">
                <input
                  type="text"
                  placeholder="Paste image or video link..."
                  className="input-field flex-1 text-sm bg-background border px-3 py-2 rounded-md"
                  value={block.content}
                  onChange={(e) => onChange({ content: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setShowInput(false);
                  }}
                />
                <button onClick={() => setShowInput(false)} disabled={!block.content} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted-foreground/20" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-muted/50 px-2 text-muted-foreground">Or</span></div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-secondary px-4 py-2 rounded-lg text-sm text-center hover:bg-secondary/80 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
              </label>
              {isUploading && <span className="text-xs text-muted-foreground ml-2">Uploading...</span>}
            </div>
          )}
        </div>
      );
    case 'code':
      return (
        <div className="rounded-xl overflow-hidden bg-black/50 border border-border p-4 font-mono">
          <textarea
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="// Paste your code here..."
            className="w-full bg-transparent resize-none outline-none text-sm text-green-400 min-h-[100px]"
            spellCheck={false}
          />
        </div>
      );
    case 'document':
      return (
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
            <button onClick={() => onChange({ content: '' })} className="p-2 text-muted-foreground hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    default:
      return <div>Unknown block type</div>;
  }
}
