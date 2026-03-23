'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Mail, Send, Eye, Code, Save, 
  BarChart3, Users, Clock, AlertTriangle, CheckCircle2,
  Search, Filter, MoreVertical, X, Plus, Copy,
  ArrowRight, MousePointer2, Smartphone, Monitor,
  Layout, Type, Image as ImageIcon, Trash2,
  History as LucideHistory
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlowEffect } from '../../../components/ui/GlowEffect';
import { useToast } from '../../../components/ui/ToastProvider';
import { HoloLoader } from '../../../components/ui/HoloLoader';

export default function AdminCommunicationsPage() {
  return (
    <Suspense fallback={<div className="loading mono p-24 text-center">SYNCHRONIZING_COMM_STREAMS...</div>}>
      <CommunicationsContent />
    </Suspense>
  );
}

function CommunicationsContent() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editHtml, setEditHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const { success, error, info } = useToast();

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoaderProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  async function fetchTemplates() {
    const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
    setLoading(false);
  }

  async function fetchLogs() {
    // Assuming transactional logs are in email_campaigns or similar
    const { data } = await supabase.from('email_campaigns').select('*, email_templates(name)').limit(20).order('created_at', { ascending: false });
    if (data) setLogs(data);
  }

  const handleTemplateSelect = (temp: any) => {
    setSelectedTemplate(temp);
    setEditHtml(temp.html_content);
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    const { error: err } = await supabase
      .from('email_templates')
      .update({ html_content: editHtml, updated_at: new Date().toISOString() })
      .eq('id', selectedTemplate.id);
    
    if (!err) {
      success('TEMPLATE_SYNCHRONIZED', 'Email structural parameters updated safely.');
      fetchTemplates();
    }
  };

  if (loading) return (
    <HoloLoader 
      progress={loaderProgress} 
      phase="INIT_COMM_INTERFACE" 
      isMuted={isMuted} 
      onToggleMute={() => setIsMuted(!isMuted)} 
    />
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="mono text-[10px] text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Terminal // Communications</span>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight uppercase font-jetbrains">Comm Center</h1>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] mono text-gray-400 hover:text-white transition-all">
              <LucideHistory size={14} />
              AUDIT_LOGS
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[10px] mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Plus size={14} />
              NEW_TEMPLATE
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Template Sidebar */}
         <div className="xl:col-span-1 space-y-6">
            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-cyan-400 uppercase mb-6 flex items-center gap-2">
                  <Layout size={14} />
                  Structural_Blueprints
               </h3>
               
               <div className="space-y-3">
                  {templates.map((temp) => (
                    <button 
                      key={temp.id}
                      onClick={() => handleTemplateSelect(temp)}
                      className={`w-full p-4 border rounded-2xl flex items-center justify-between group transition-all text-left ${selectedTemplate?.id === temp.id ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                       <div>
                          <div className={`text-[11px] font-bold ${selectedTemplate?.id === temp.id ? 'text-white' : 'text-gray-300'}`}>{temp.name}</div>
                          <div className="text-[8px] mono text-gray-600 uppercase">Ver: 2.1.0</div>
                       </div>
                       <ArrowRight size={14} className={`transition-transform ${selectedTemplate?.id === temp.id ? 'text-cyan-400 translate-x-1' : 'text-gray-700 group-hover:text-gray-400'}`} />
                    </button>
                  ))}
               </div>
            </GlassCard>

            <GlassCard className="p-6" intensity="low">
               <h3 className="mono text-[10px] font-black tracking-widest text-yellow-400 uppercase mb-6 flex items-center gap-2">
                  <BarChart3 size={14} />
                  Delivery_Pulse
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'Open_Rate', value: '42.8%', color: 'text-green-400' },
                    { label: 'Bounce_Rate', value: '0.4%', color: 'text-red-400' },
                    { label: 'Complaint_Rate', value: '0.01%', color: 'text-yellow-400' },
                  ].map(stat => (
                    <div key={stat.label} className="flex justify-between items-center text-[10px] mono">
                       <span className="text-gray-500 uppercase">{stat.label}</span>
                       <span className={`font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
               </div>
            </GlassCard>
         </div>

         {/* Editor Area */}
         <div className="xl:col-span-3 space-y-8">
            {selectedTemplate ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
                 {/* Code Editor */}
                 <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Code size={16} className="text-gray-400" />
                          <span className="mono text-[10px] text-gray-400 uppercase tracking-widest">Source_Overlay</span>
                       </div>
                       <button onClick={saveTemplate} className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-[9px] mono hover:bg-cyan-500/20 transition-all">
                          <Save size={14} />
                          COMMIT_CHANGES
                       </button>
                    </div>
                    <textarea 
                      value={editHtml}
                      onChange={(e) => setEditHtml(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-6 text-[11px] mono text-gray-300 focus:outline-none focus:border-cyan-500/30 resize-none custom-scrollbar font-jetbrains"
                      spellCheck={false}
                    />
                 </div>

                 {/* Live Preview */}
                 <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <Eye size={16} className="text-gray-400" />
                          <span className="mono text-[10px] text-gray-400 uppercase tracking-widest">Visual_Projection</span>
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-gray-600 hover:text-white'}`}
                          >
                             <Smartphone size={14} />
                          </button>
                          <button 
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-gray-600 hover:text-white'}`}
                          >
                             <Monitor size={14} />
                          </button>
                       </div>
                    </div>
                    
                    <div className={`flex-1 bg-white rounded-3xl overflow-hidden transition-all duration-500 mx-auto ${previewMode === 'mobile' ? 'w-[320px]' : 'w-full'}`}>
                       <iframe 
                         srcDoc={editHtml} 
                         title="Template Preview"
                         className="w-full h-full border-none"
                       />
                    </div>
                 </div>
              </div>
            ) : (
              <GlassCard className="h-[700px] flex items-center justify-center border-dashed border-white/10" intensity="low">
                 <div className="text-center group">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:border-cyan-500/30 transition-all">
                       <Mail size={24} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="mono text-[10px] text-gray-500 uppercase tracking-widest">Select_Blueprint_For_Analysis</p>
                 </div>
              </GlassCard>
            )}
         </div>
      </div>

      <style jsx>{`
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
