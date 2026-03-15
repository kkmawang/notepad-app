"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Search, Star, MoreVertical, LayoutGrid, CheckSquare, Settings, Bell, MessageSquare, Menu, Plus, Trash2, X, LogOut, ChevronDown } from "lucide-react";

type NoteColor = 'white' | 'yellow' | 'green' | 'blue';

interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isStarred: boolean;
  folder: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const colorMap = {
  white: 'bg-white border-gray-200',
  yellow: 'bg-[#fff59d] border-[#fff59d]',
  green: 'bg-[#a5d6a7] border-[#a5d6a7]',
  blue: 'bg-[#b3e5fc] border-[#b3e5fc]'
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'important' | string>('all');
  const [folders, setFolders] = useState<string[]>(['내 메모', '일기', '인테리어', '여행']);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load notes from Supabase on mount
  useEffect(() => {
    if (!mounted || !session) return;
    
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('Note')
          .select('*')
          .order('updatedAt', { ascending: false });
        
        if (error) throw error;
        if (data) setNotes(data as Note[]);
      } catch (e) {
        console.error("Failed to fetch notes", e);
      }
    };

    fetchNotes();

    const savedFolders = localStorage.getItem("notepad-folders");
    if (savedFolders) {
      try { setFolders(JSON.parse(savedFolders)); } catch (e) { console.error("Failed to parse folders", e); }
    }
  }, [mounted, session]);

  // Save folders to local storage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("notepad-folders", JSON.stringify(folders));
  }, [folders, mounted]);

  const createNewNote = async () => {
    if (!session?.user) return;

    const defaultFolder = (activeFilter !== 'all' && activeFilter !== 'important') 
      ? activeFilter 
      : (folders.length > 0 ? folders[0] : '내 메모');

    try {
      const { data, error } = await supabase
        .from('Note')
        .insert({
          id: crypto.randomUUID(), // Using UUID for consistency with previous CUID-like behavior
          title: "",
          content: "",
          color: "white",
          folder: defaultFolder,
          isStarred: false,
          userId: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const newNote = data as Note;
        setNotes([newNote, ...notes]);
        setActiveNote(newNote);
        setIsEditing(true);
      }
    } catch (e) {
      console.error("Failed to create note", e);
    }
  };

  const saveNote = async () => {
    if (!activeNote) return;
    
    try {
      const { data, error } = await supabase
        .from('Note')
        .update({
          title: activeNote.title,
          content: activeNote.content,
          color: activeNote.color,
          folder: activeNote.folder,
          isStarred: activeNote.isStarred,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', activeNote.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const updatedNote = data as Note;
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
        setIsEditing(false);
        setActiveNote(null);
      }
    } catch (e) {
      console.error("Failed to save note", e);
    }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('Note')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNotes(notes.filter((n) => n.id !== id));
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    try {
      const { data, error } = await supabase
        .from('Note')
        .update({ isStarred: !note.isStarred, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const updatedNote = data as Note;
        setNotes(notes.map(n => n.id === id ? updatedNote : n));
      }
    } catch (e) {
      console.error("Failed to toggle star", e);
    }
  };

  const filteredNotes = notes.filter(n => {
    // 1. Text Search Filter
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Sidebar Categories Filter
    let matchesCategory = true;
    if (activeFilter === 'important') {
      matchesCategory = n.isStarred;
    } else if (activeFilter !== 'all') {
      // Future-proofing for folder or tag filters
      matchesCategory = n.folder === activeFilter;
    }

    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (!mounted) {
    return <div className="flex h-screen w-full bg-[#f4f5f7]"></div>;
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f5f7] overflow-hidden text-[#333]">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10 transition-all">
        {/* App Logo Area */}
        <div className="h-14 flex items-center px-6 font-bold text-xl text-[#00c73c] tracking-tight">
          <span className="bg-[#00c73c] text-white w-6 h-6 rounded-md flex items-center justify-center mr-2 text-sm">N</span>
          메모
        </div>

        <div className="p-4 pt-2">
          <button 
            onClick={createNewNote}
            className="w-full bg-[#00c73c] hover:bg-[#00b336] text-white font-medium rounded-md py-3 transition-colors shadow-sm flex items-center justify-center gap-1"
          >
            메모 쓰기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="mb-6">
            <div 
              onClick={() => setActiveFilter('all')}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md font-medium cursor-pointer mb-1 transition-colors ${activeFilter === 'all' ? 'bg-[#e8f5e9] text-[#00c73c]' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2"><CheckSquare size={16} />전체</span>
              <span>{notes.length}</span>
            </div>
            <div 
              onClick={() => setActiveFilter('important')}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${activeFilter === 'important' ? 'bg-[#e8f5e9] text-[#00c73c]' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2"><Star size={16} />중요</span>
              <span>{notes.filter(n => n.isStarred).length}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-2 flex justify-between items-center">
              <span>폴더</span>
              <button onClick={() => setIsAddingFolder(true)} className="cursor-pointer hover:text-gray-600"><Plus size={14}/></button>
            </h3>
            <ul className="space-y-0.5 text-sm text-gray-600">
              {folders.map((folder) => (
                <li 
                  key={folder} 
                  onClick={() => setActiveFilter(folder)}
                  className={`px-2 py-1.5 rounded-md cursor-pointer flex items-center justify-between group transition-colors ${activeFilter === folder ? 'bg-[#e8f5e9] text-[#00c73c] font-medium' : 'hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${folder === '내 메모' ? 'bg-yellow-400' : folder === '일기' ? 'bg-green-400' : folder === '인테리어' ? 'bg-blue-400' : folder === '여행' ? 'bg-purple-400' : 'bg-gray-400'}`}></div>
                    <span>{folder}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`'${folder}' 폴더를 삭제하시겠습니까?`)) {
                        setFolders(folders.filter(f => f !== folder));
                        if (activeFilter === folder) setActiveFilter('all');
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-400 transition-opacity"
                  >
                    <Trash2 size={12}/>
                  </button>
                </li>
              ))}
              {isAddingFolder && (
                <li className="px-2 py-1.5">
                  <input 
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        if (!folders.includes(newFolderName.trim())) setFolders([...folders, newFolderName.trim()]);
                        setNewFolderName('');
                        setIsAddingFolder(false);
                      } else if (e.key === 'Escape') {
                        setNewFolderName('');
                        setIsAddingFolder(false);
                      }
                    }}
                    onBlur={() => {
                      if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
                        setFolders([...folders, newFolderName.trim()]);
                      }
                      setNewFolderName('');
                      setIsAddingFolder(false);
                    }}
                    className="w-full bg-white border border-[#00c73c] rounded px-2 py-1 text-xs focus:outline-none"
                    placeholder="폴더명 입력"
                  />
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-2"># 태그</h3>
            <div className="flex flex-wrap gap-1.5 px-2">
              {['모든 태그', '경제', '계좌번호', '다이어트', '독서', '레퍼런스', '맛집', '미팅', '쇼핑몰', '식단', '아이디어', '취미', '위시'].map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 cursor-pointer border border-gray-200">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#00c73c]/10 flex items-center justify-center text-[#00c73c] font-bold text-xs">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-gray-800 truncate">{session?.user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium"
          >
            <LogOut size={14} /> 로그아웃
          </button>
          <div className="pt-2 space-y-2 opacity-60">
            <div className="cursor-pointer hover:text-gray-800 text-[11px]">환경설정</div>
            <div className="cursor-pointer hover:text-gray-800 text-[11px]">고객센터</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0 bg-white">
        
        {/* Top Header */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex gap-2 text-sm font-medium">
              {['전체', '중요', '내 메모', '일기', '#맛집', '#여행'].map((tab, i) => (
                <div key={tab} className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors ${i === 0 ? 'border border-[#00c73c] text-[#00c73c]' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="flex items-center text-gray-400 cursor-pointer hover:text-gray-600">
              <LayoutGrid size={18} />
              <Menu size={18} className="ml-2" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="메모 검색" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-100 border-none rounded-full py-1.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#00c73c] w-64"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <div className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800 flex items-center">
              상세 <ChevronDown className="ml-1" size={14}/>
            </div>
          </div>
        </header>

        {/* Note Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>메모가 없습니다.</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => { setActiveNote(note); setIsEditing(true); }}
                  className={`break-inside-avoid rounded-xl p-5 border shadow-sm cursor-pointer transition-all hover:shadow-md relative group ${colorMap[note.color]}`}
                >
                  <div className="mb-3 pr-6">
                    {note.title && <h3 className="font-bold text-gray-800 mb-1 leading-snug">{note.title}</h3>}
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {note.content || (!note.title && <span className="text-gray-400 italic">빈 메모</span>)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-black/40 mt-6 font-medium">
                    <span className="flex items-center gap-1.5">
                      {note.folder} <span className="w-1 h-1 rounded-full bg-black/20"></span> {formatDate(note.updatedAt)}
                    </span>
                    <button 
                      onClick={(e) => toggleStar(note.id, e)}
                      className={`transition-colors ${note.isStarred ? 'text-yellow-500' : 'hover:text-black/60'}`}
                    >
                      <Star size={16} fill={note.isStarred ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <button 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="absolute top-4 right-4 text-black/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Editor Modal Overlay */}
      {isEditing && activeNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${colorMap[activeNote.color].replace('border-', '')}`}>
            <div className="h-12 border-b border-black/5 flex items-center justify-between px-4 bg-white/30 backdrop-blur-md">
              <div className="flex gap-2">
                {(['white', 'yellow', 'green', 'blue'] as NoteColor[]).map(c => (
                  <button 
                    key={c}
                    onClick={() => setActiveNote({...activeNote, color: c})}
                    className={`w-6 h-6 rounded-full border-2 ${c === 'white' ? 'bg-white border-gray-200' : c === 'yellow' ? 'bg-[#fff59d] border-transparent' : c === 'green' ? 'bg-[#a5d6a7] border-transparent' : 'bg-[#b3e5fc] border-transparent'} ${activeNote.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => saveNote()} className="bg-white/50 hover:bg-white border border-black/10 px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors text-gray-700">저장</button>
                <button onClick={() => {setIsEditing(false); setActiveNote(null);}} className="p-1.5 text-black/50 hover:text-black hover:bg-black/5 rounded-md transition-colors"><X size={20}/></button>
              </div>
            </div>
            
            <div className="flex-1 p-6 flex flex-col min-h-[400px]">
              <input 
                type="text" 
                value={activeNote.title}
                onChange={(e) => setActiveNote({...activeNote, title: e.target.value})}
                placeholder="제목을 입력하세요"
                className="text-2xl font-bold bg-transparent border-none focus:outline-none mb-4 text-gray-800 placeholder:text-gray-400"
              />
              <textarea 
                value={activeNote.content}
                onChange={(e) => setActiveNote({...activeNote, content: e.target.value})}
                placeholder="메모를 작성하세요"
                className="flex-1 bg-transparent border-none focus:outline-none resize-none text-gray-700 leading-relaxed custom-scrollbar placeholder:text-gray-400"
              />
            </div>
            <div className="px-6 py-3 border-t border-black/5 flex justify-between items-center text-sm text-black/50 bg-white/20 backdrop-blur-md">
              <select 
                value={activeNote.folder} 
                onChange={(e) => setActiveNote({...activeNote, folder: e.target.value})}
                className="bg-transparent border-none focus:outline-none font-medium text-gray-700 cursor-pointer"
              >
                {!folders.includes(activeNote.folder) && (
                  <option value={activeNote.folder}>{activeNote.folder}</option>
                )}
                {folders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <span>수정일: {formatDate(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}

// Note: ChevronDown is now imported from lucide-react
