import React, { useState, useEffect, useCallback } from 'react';
import { 
  Book, 
  Plus, 
  ChevronRight, 
  Folder, 
  FileText, 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  Save, 
  Brain,
  MoreVertical,
  Pencil,
  GraduationCap,
  Feather
} from 'lucide-react';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Subject, Chapter, Note, ViewState, AIActionType } from './types';
import { generateAIResponse } from './services/geminiService';
import { getRandomColor } from './constants';

function App() {
  // --- State Management ---
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('nexus_notes_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewState, setViewState] = useState<ViewState>('SUBJECTS');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Modal States
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // Editor & AI State
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<AIActionType | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('nexus_notes_data', JSON.stringify(subjects));
  }, [subjects]);

  // --- Helpers ---
  const getSelectedSubject = () => subjects.find(s => s.id === selectedSubjectId);
  const getSelectedChapter = () => getSelectedSubject()?.chapters.find(c => c.id === selectedChapterId);
  const getSelectedNote = () => getSelectedChapter()?.notes.find(n => n.id === selectedNoteId);

  // --- CRUD Operations ---
  
  const handleCreateSubject = () => {
    if (!newSubjectTitle.trim()) return;
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      title: newSubjectTitle,
      code: newSubjectCode,
      color: getRandomColor(),
      chapters: [],
      createdAt: Date.now()
    };
    setSubjects([...subjects, newSubject]);
    setNewSubjectTitle('');
    setNewSubjectCode('');
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure? All chapters and notes in this subject will be lost.')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleCreateChapter = () => {
    if (!newChapterTitle.trim() || !selectedSubjectId) return;
    
    setSubjects(prevSubjects => prevSubjects.map(sub => {
      if (sub.id === selectedSubjectId) {
        return {
          ...sub,
          chapters: [...sub.chapters, {
            id: crypto.randomUUID(),
            title: newChapterTitle,
            notes: [],
            createdAt: Date.now()
          }]
        };
      }
      return sub;
    }));
    
    setNewChapterTitle('');
    setIsChapterModalOpen(false);
  };

  const handleDeleteChapter = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    if (!selectedSubjectId) return;
    if (confirm('Delete this chapter and all its notes?')) {
      setSubjects(prev => prev.map(s => {
        if (s.id === selectedSubjectId) {
          return { ...s, chapters: s.chapters.filter(c => c.id !== chapterId) };
        }
        return s;
      }));
    }
  };

  const openNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setAiResult(null);
    setViewState('NOTES');
  };

  const handleCreateNote = () => {
    if (!selectedSubjectId || !selectedChapterId) return;
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    setSubjects(prev => prev.map(s => {
      if (s.id === selectedSubjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === selectedChapterId) {
              return { ...c, notes: [...c.notes, newNote] };
            }
            return c;
          })
        };
      }
      return s;
    }));

    // Immediately open the new note
    openNote(newNote);
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!selectedSubjectId || !selectedChapterId) return;
    if (confirm('Delete this note?')) {
      setSubjects(prev => prev.map(s => {
        if (s.id === selectedSubjectId) {
          return {
            ...s,
            chapters: s.chapters.map(c => {
              if (c.id === selectedChapterId) {
                return { ...c, notes: c.notes.filter(n => n.id !== noteId) };
              }
              return c;
            })
          };
        }
        return s;
      }));
    }
  };

  const handleSaveNote = () => {
    if (!selectedSubjectId || !selectedChapterId || !selectedNoteId) return;

    setSubjects(prev => prev.map(s => {
      if (s.id === selectedSubjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === selectedChapterId) {
              return {
                ...c,
                notes: c.notes.map(n => {
                  if (n.id === selectedNoteId) {
                    return { ...n, title: editorTitle, content: editorContent, lastModified: Date.now() };
                  }
                  return n;
                })
              };
            }
            return c;
          })
        };
      }
      return s;
    }));
  };

  // --- AI Operations ---
  const handleAiAction = async (action: AIActionType) => {
    if (!editorContent.trim()) return;
    
    setIsAiLoading(true);
    setAiMode(action);
    setAiResult(null);
    
    const result = await generateAIResponse(editorContent, action);
    
    setAiResult(result);
    setIsAiLoading(false);
  };

  // --- Navigation Helpers ---
  const navigateToSubjects = () => {
    setViewState('SUBJECTS');
    setSelectedSubjectId(null);
    setSelectedChapterId(null);
    setSelectedNoteId(null);
  };

  const navigateToChapters = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setViewState('CHAPTERS');
  };

  // --- Render Views ---

  // 1. Subjects Grid
  const renderSubjectsView = () => (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-10 border-b border-vintage-border pb-4">
        <div>
          <h1 className="text-4xl font-bold font-serif text-ink">My Library</h1>
          <p className="text-secondary mt-2 italic font-serif">"The foundation of knowledge."</p>
        </div>
        <Button onClick={() => setIsSubjectModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map(subject => (
          <div 
            key={subject.id}
            onClick={() => navigateToChapters(subject.id)}
            className="group relative bg-surface rounded shadow-md border border-vintage-border hover:shadow-xl hover:border-primary transition-all cursor-pointer overflow-hidden flex flex-col"
          >
            {/* Spine */}
            <div className={`h-2 w-full ${subject.color}`} />
            
            <div className="p-6 flex-1 flex flex-col relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-full ${subject.color} bg-opacity-15 text-${subject.color.replace('bg-', '')}`}>
                  <Book className="w-6 h-6" />
                </div>
                <button 
                  onClick={(e) => handleDeleteSubject(e, subject.id)}
                  className="text-vintage-border hover:text-red-800 p-1 rounded hover:bg-surface-accent opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold font-serif text-ink mb-1">{subject.title}</h3>
              {subject.code && <p className="text-xs font-bold tracking-widest text-secondary uppercase mb-4">{subject.code}</p>}
              
              <div className="mt-auto pt-4 border-t border-vintage-border/50 flex items-center text-sm text-secondary font-medium">
                <Folder className="w-4 h-4 mr-2" />
                {subject.chapters.length} {subject.chapters.length === 1 ? 'Chapter' : 'Chapters'}
              </div>
            </div>
            {/* Paper stack effect */}
            <div className="h-1 bg-vintage-border/50 w-[96%] mx-auto rounded-b-sm"></div>
            <div className="h-1 bg-vintage-border/30 w-[92%] mx-auto rounded-b-sm mb-1"></div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-surface rounded border border-dashed border-vintage-border">
            <div className="p-4 bg-surface-accent rounded-full mb-4">
              <Feather className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-serif text-ink mb-2">The library is empty</h3>
            <p className="text-secondary mb-6 italic">Begin your collection by adding a subject.</p>
            <Button onClick={() => setIsSubjectModalOpen(true)} variant="secondary">
              Create Subject
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // 2. Chapters List
  const renderChaptersView = () => {
    const subject = getSelectedSubject();
    if (!subject) return null;

    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-8 text-sm text-secondary font-medium tracking-wide uppercase">
          <button onClick={navigateToSubjects} className="hover:text-primary flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Library
          </button>
          <ChevronRight className="w-4 h-4 mx-2 text-vintage-border" />
          <span className="text-ink font-bold">{subject.title}</span>
        </div>

        <div className="flex justify-between items-center mb-8 border-b border-vintage-border pb-4">
          <div className="flex items-center">
             <div className={`w-2 h-10 ${subject.color} mr-4 rounded-sm`}></div>
             <div>
                <h2 className="text-3xl font-bold font-serif text-ink">{subject.title}</h2>
                <p className="text-sm text-secondary">Table of Contents</p>
             </div>
          </div>
          <Button onClick={() => setIsChapterModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Chapter
          </Button>
        </div>

        {/* Chapters Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {subject.chapters.map(chapter => (
             <div key={chapter.id} className="bg-surface rounded shadow-sm border border-vintage-border flex flex-col h-96 transition-all hover:shadow-md">
                <div className="p-4 border-b border-vintage-border flex justify-between items-center bg-surface-accent/30 rounded-t">
                   <h3 className="font-bold font-serif text-lg text-ink truncate pr-2" title={chapter.title}>{chapter.title}</h3>
                   <div className="flex items-center space-x-2">
                     <button 
                        onClick={(e) => handleDeleteChapter(e, chapter.id)}
                        className="text-secondary hover:text-red-800 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                
                {/* Notes List inside Chapter Card */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-surface relative">
                  {/* Lined paper effect */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 24px' }}></div>
                  
                  {chapter.notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-vintage-border">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm font-serif italic">Empty page</span>
                    </div>
                  ) : (
                    <div className="space-y-3 relative z-10">
                      {chapter.notes.map(note => (
                        <div 
                          key={note.id}
                          onClick={() => {
                            setSelectedChapterId(chapter.id);
                            openNote(note);
                          }}
                          className="p-3 bg-white border border-vintage-border/50 shadow-sm hover:shadow hover:border-primary/30 rounded cursor-pointer group transition-all"
                        >
                          <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center overflow-hidden">
                                <span className="text-sm font-bold text-ink font-serif truncate">{note.title}</span>
                             </div>
                             <span className="text-[10px] text-secondary uppercase tracking-wider">
                               {new Date(note.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                          </div>
                          <p className="text-xs text-secondary font-mono truncate pl-0">
                            {note.content.substring(0, 40) || "No content..."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-vintage-border bg-surface-accent/30 rounded-b">
                  <button 
                    onClick={() => {
                      setSelectedChapterId(chapter.id);
                      handleCreateNote();
                    }}
                    className="w-full py-2 text-sm text-primary font-bold uppercase tracking-wide hover:bg-surface-accent rounded transition-colors flex items-center justify-center border border-dashed border-primary/30"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Note
                  </button>
                </div>
             </div>
           ))}

           {subject.chapters.length === 0 && (
             <div className="col-span-full py-16 text-center bg-surface rounded border border-vintage-border border-dashed">
                <Folder className="w-12 h-12 text-vintage-border mx-auto mb-3" />
                <p className="text-secondary font-serif italic">Create a chapter to start organizing notes.</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  // 3. Note Editor View
  const renderNoteEditor = () => {
    const subject = getSelectedSubject();
    const chapter = getSelectedChapter();
    
    if (!subject || !chapter) return null;

    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Editor Header */}
        <header className="bg-surface border-b border-vintage-border px-6 py-3 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setViewState('CHAPTERS')} 
               className="p-2 hover:bg-surface-accent rounded-full text-secondary transition-colors"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="flex flex-col">
               <div className="flex items-center text-xs text-secondary uppercase tracking-wider space-x-2">
                 <span>{subject.title}</span>
                 <ChevronRight className="w-3 h-3" />
                 <span>{chapter.title}</span>
               </div>
               <input 
                 type="text"
                 value={editorTitle}
                 onChange={(e) => setEditorTitle(e.target.value)}
                 className="text-xl font-bold font-serif text-ink border-none focus:ring-0 p-0 hover:bg-surface-accent/50 bg-transparent rounded px-1 -ml-1 w-64 md:w-96 placeholder-gray-400"
                 placeholder="Note Title"
               />
             </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <span className="text-xs text-secondary font-mono hidden sm:inline border-r border-vintage-border pr-3">
               {editorContent.length} chars
             </span>
             <Button onClick={handleSaveNote} size="sm">
               <Save className="w-4 h-4 mr-2" />
               Save
             </Button>
          </div>
        </header>

        {/* Main Content Area: Split View */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Editor Input */}
          <div className={`flex-1 flex flex-col h-full bg-[#fcfbf8] relative ${aiResult ? 'lg:w-1/2 border-r border-vintage-border' : 'w-full'}`}>
             {/* Typewriter/Paper Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: "radial-gradient(#8b5e3c 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}></div>

            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Start typing your notes here..."
              className="flex-1 w-full p-8 resize-none focus:outline-none text-ink leading-loose custom-scrollbar text-lg font-mono bg-transparent relative z-0"
              style={{ lineHeight: '1.8' }}
            />
            
            {/* AI Toolbar floating at bottom */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-surface shadow-xl border border-vintage-border rounded px-3 py-2 flex items-center space-x-2 z-10">
              <span className="pr-2 text-xs font-bold text-primary flex items-center uppercase tracking-widest border-r border-vintage-border">
                <Sparkles className="w-3 h-3 mr-2" /> AI Assistant
              </span>
              <button 
                onClick={() => handleAiAction(AIActionType.SUMMARIZE)}
                disabled={isAiLoading}
                className="p-2 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors tooltip"
                title="Summarize"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleAiAction(AIActionType.QUIZ)}
                disabled={isAiLoading}
                className="p-2 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors"
                title="Generate Quiz"
              >
                <Brain className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleAiAction(AIActionType.ELABORATE)}
                disabled={isAiLoading}
                className="p-2 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors"
                title="Elaborate"
              >
                <Book className="w-4 h-4" />
              </button>
               <button 
                onClick={() => handleAiAction(AIActionType.FIX_GRAMMAR)}
                disabled={isAiLoading}
                className="p-2 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors"
                title="Fix Grammar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Result Panel */}
          {aiResult && (
            <div className="lg:w-1/2 h-1/2 lg:h-full bg-surface-accent/30 flex flex-col border-t lg:border-t-0 border-vintage-border animate-slide-in-right">
              <div className="flex items-center justify-between p-4 border-b border-vintage-border bg-surface">
                <div className="flex items-center text-primary font-bold font-serif">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {aiMode === AIActionType.SUMMARIZE ? 'Summary' : aiMode === AIActionType.QUIZ ? 'Quiz' : 'Insight'}
                </div>
                <button onClick={() => setAiResult(null)} className="text-secondary hover:text-ink">
                   <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-surface">
                <div className="prose prose-stone max-w-none font-serif text-ink">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {aiResult}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-vintage-border bg-surface flex justify-end">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => {
                    setEditorContent(prev => prev + "\n\n--- AI Generated ---\n" + aiResult);
                    setAiResult(null);
                  }}
                >
                  Append to Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper component for X icon locally
  const XIcon = ({className}:{className?:string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );

  return (
    <div className="min-h-screen bg-background text-ink font-sans selection:bg-[#dcd7c9] selection:text-black">
      
      {viewState !== 'NOTES' && (
        <nav className="bg-surface border-b border-vintage-border px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center">
            <div className="bg-primary p-2 rounded mr-4 shadow-sm">
              <Book className="w-6 h-6 text-[#fcfbf8]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-serif text-ink tracking-tight">
                Nexus Notes
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Est. 2025 • by Sree
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center text-xs font-bold text-secondary uppercase tracking-widest border border-vintage-border rounded px-3 py-1 bg-surface-accent/20">
            {subjects.reduce((acc, s) => acc + s.chapters.reduce((cAcc, c) => cAcc + c.notes.length, 0), 0)} Notes Collected
          </div>
        </nav>
      )}

      {/* Main Content Router */}
      <main>
        {viewState === 'SUBJECTS' && renderSubjectsView()}
        {viewState === 'CHAPTERS' && renderChaptersView()}
        {viewState === 'NOTES' && renderNoteEditor()}
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isSubjectModalOpen} 
        onClose={() => setIsSubjectModalOpen(false)} 
        title="New Subject"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-1">Subject Title</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded border-vintage-border bg-[#fcfbf8] shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 text-ink font-serif"
              placeholder="e.g. Ancient History"
              value={newSubjectTitle}
              onChange={(e) => setNewSubjectTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-1">Course Code</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded border-vintage-border bg-[#fcfbf8] shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 text-ink font-serif"
              placeholder="e.g. HIS101"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
             <Button variant="ghost" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
             <Button onClick={handleCreateSubject}>Create Subject</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isChapterModalOpen} 
        onClose={() => setIsChapterModalOpen(false)} 
        title="New Chapter"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-secondary mb-1">Chapter Title</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded border-vintage-border bg-[#fcfbf8] shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 text-ink font-serif"
              placeholder="e.g. The Renaissance"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
             <Button variant="ghost" onClick={() => setIsChapterModalOpen(false)}>Cancel</Button>
             <Button onClick={handleCreateChapter}>Create Chapter</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default App;