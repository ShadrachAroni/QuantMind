'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Save, Monitor, Smartphone, Globe, Send, ShieldCheck, Clock } from 'lucide-react';
import { AdminLayout } from '../../../components/ui/AdminLayout';
import { GlassCard } from '../../../components/ui/GlassCard';
import { supabase } from '../../../lib/supabase';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    subject_a: '',
    subject_b: '',
    ab_test_ratio: 0.5,
    scheduled_at: '',
    expires_at: '',
    target_segmentation: { tiers: ['free', 'plus', 'pro'], last_active_days: 30 }
  });

  useEffect(() => {
    async function fetchTemplates() {
      const { data } = await supabase.from('email_templates').select('*');
      if (data) setTemplates(data);
    }
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('email_campaigns').insert([{
      ...formData,
      status: 'pending_approval'
    }]);

    if (!error) {
      router.push('/campaigns');
    } else {
      alert('FAILED_TO_INITIALIZE_CAMPAIGN: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <header className="top-bar">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={16} /> BACK_TO_CONSOLE
        </button>
        <div className="header-title">
          <span className="breadcrumb">TERMINAL // CAMPAIGNS // INITIALIZE</span>
          <h1>NEW_MARKETING_PROTOCOL</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="create-grid">
        <div className="form-main">
          <GlassCard className="form-section">
            <div className="section-header">
              <Mail size={18} color="var(--accent-cyan)" />
              <h2>CAMPAIGN_SPECIFICATIONS</h2>
            </div>
            <div className="inputs">
              <div className="input-group">
                <label>INTERNAL_NAME</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q2_PLUS_UPGRADE_OFFER_v1" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="input-group">
                <label>BASE_HTML_TEMPLATE</label>
                <select 
                  value={formData.template_id}
                  onChange={e => setFormData({...formData, template_id: e.target.value})}
                  required
                >
                  <option value="">SELECT_CORE_ASSET...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="ab-testing-section">
                <div className="input-group">
                  <label>SUBJECT_LINE_VARIANT_A (CONTROL)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Unlock 20% off QuantMind Plus" 
                    value={formData.subject_a}
                    onChange={e => setFormData({...formData, subject_a: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>SUBJECT_LINE_VARIANT_B (EXPERIMENTAL)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Final Call: Your Institutional Discount Expires Today" 
                    value={formData.subject_b}
                    onChange={e => setFormData({...formData, subject_b: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="form-section">
            <div className="section-header">
              <ShieldCheck size={18} color="var(--accent-purple)" />
              <h2>TARGET_SEGMENTATION_MATRIX</h2>
            </div>
            <div className="segmentation-controls">
              <div className="tier-selector">
                <label>SUBSCRIPTION_TIERS</label>
                <div className="chips">
                  {['free', 'plus', 'pro', 'student'].map(tier => (
                    <button 
                      key={tier}
                      type="button"
                      className={`tier-chip ${formData.target_segmentation.tiers.includes(tier) ? 'active' : ''}`}
                      onClick={() => {
                        const newTiers = formData.target_segmentation.tiers.includes(tier)
                          ? formData.target_segmentation.tiers.filter(t => t !== tier)
                          : [...formData.target_segmentation.tiers, tier];
                        setFormData({...formData, target_segmentation: {...formData.target_segmentation, tiers: newTiers}});
                      }}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="form-sidebar">
          <GlassCard className="sidebar-card">
            <div className="section-header">
              <Clock size={16} color="var(--accent-cyan)" />
              <h2>SCHEDULING_KERNEL</h2>
            </div>
            <div className="sidebar-inputs">
              <div className="input-group">
                <label>DISPATCH_TIMESTAMP</label>
                <input 
                  type="datetime-local" 
                  value={formData.scheduled_at}
                  onChange={e => setFormData({...formData, scheduled_at: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label>EXPIRATION_THRESHOLD</label>
                <input 
                  type="datetime-local" 
                  value={formData.expires_at}
                  onChange={e => setFormData({...formData, expires_at: e.target.value})}
                />
              </div>
            </div>
            <button className="submit-btn" type="submit" disabled={loading}>
              <Save size={16} /> {loading ? 'SIGNAL_PROCESSING...' : 'INITIALIZE_PROTOCOL'}
            </button>
          </GlassCard>

          <GlassCard className="preview-card">
             <div className="preview-header">
                <Monitor size={12} />
                <Smartphone size={12} />
                <Globe size={12} />
             </div>
             <p className="preview-text mono">PROTOTYPE_PREVIEW_GENERATING...</p>
          </GlassCard>
        </div>
      </form>

      <style jsx>{`
        .top-bar { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
        .back-btn { background: transparent; border: none; color: var(--text-muted); font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .header-title h1 { font-size: 2.2rem; font-weight: 800; color: #fff; }
        .breadcrumb { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 2px; }
        
        .create-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        .form-main { display: flex; flex-direction: column; gap: 2rem; }
        .form-section { padding: 0; }
        .section-header { padding: 1.5rem 2rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .section-header h2 { font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); }
        
        .inputs { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: var(--text-muted); letter-spacing: 1px; }
        
        input, select { 
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); 
          color: #fff; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; transition: border-color 0.2s;
        }
        input:focus { border-color: var(--accent-cyan); outline: none; }
        
        .ab-testing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        
        .segmentation-controls { padding: 2rem; }
        .chips { display: flex; gap: 0.75rem; margin-top: 1rem; }
        .tier-chip { 
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); 
          color: var(--text-muted); padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer;
        }
        .tier-chip.active { background: var(--accent-purple); color: #fff; border-color: var(--accent-purple); box-shadow: 0 0 15px rgba(124, 58, 237, 0.3); }
        
        .form-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
        .sidebar-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .sidebar-inputs { display: flex; flex-direction: column; gap: 1.25rem; }
        
        .submit-btn { 
          width: 100%; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple)); 
          color: #fff; border: none; padding: 1rem; border-radius: 10px; font-weight: 800; font-size: 0.8rem; 
          display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 217, 255, 0.2); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .preview-card { padding: 1.5rem; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .preview-header { display: flex; gap: 1rem; color: var(--text-muted); opacity: 0.4; margin-bottom: 1.5rem; }
        .preview-text { font-size: 0.6rem; color: var(--text-muted); letter-spacing: 1px; }
      `}</style>
    </AdminLayout>
  );
}
