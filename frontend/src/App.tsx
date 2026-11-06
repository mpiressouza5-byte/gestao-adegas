import { useEffect, useState, type FormEvent } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  Wine, Bell, Settings, Plus, Package, LogOut, LockKeyhole,
  Mail, Eye, EyeOff, ChevronRight, Pencil, Trash2, X, House,
  RefreshCw, ShieldCheck, ArrowLeft, Grape, CircleHelp
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Cellar = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
};

type AuthMode = 'login' | 'signup' | 'forgot' | 'update-password';

function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update-password');
      if (session && event !== 'PASSWORD_RECOVERY') onAuthenticated(session);
    });
    return () => data.subscription.unsubscribe();
  }, [onAuthenticated]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (data.session) onAuthenticated(data.session);
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (data.session) onAuthenticated(data.session);
        else setMessage('Cadastro recebido. Confira seu e-mail para confirmar a conta antes de entrar.');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.');
      } else {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setMessage('Senha atualizada. Você já pode continuar.');
        setMode('login'); setPassword(''); setNewPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir a operação.');
    } finally { setBusy(false); }
  }

  const title = mode === 'login' ? 'Bem-vindo de volta' :
    mode === 'signup' ? 'Crie sua conta' :
    mode === 'forgot' ? 'Recuperar senha' : 'Defina uma nova senha';

  return <div className="auth-page">
    <div className="auth-art">
      <div className="auth-brand"><span><Wine size={28}/></span><b>Gestão de Adegas</b></div>
      <div className="auth-art-copy">
        <span className="eyebrow light">SEU INVENTÁRIO, SOB SEU CONTROLE</span>
        <h1>Seus vinhos.<br/>Sua adega.<br/><i>Sua história.</i></h1>
        <p>Organize seus rótulos, acompanhe seu estoque e tenha todas as informações em um só lugar.</p>
      </div>
      <div className="auth-art-foot">GESTÃO PESSOAL DE VINHOS</div>
    </div>
    <div className="auth-panel">
      <div className="auth-form-wrap">
        <div className="auth-mobile-brand"><Wine/> Gestão de Adegas</div>
        <span className="eyebrow">ÁREA DO PROPRIETÁRIO</span>
        <h2>{title}</h2>
        <p className="auth-subtitle">{mode === 'login' ? 'Entre para acessar suas adegas e seu inventário.' :
          mode === 'signup' ? 'Seus dados serão usados para criar seu perfil pessoal.' :
          mode === 'forgot' ? 'Informe seu e-mail para receber o link de recuperação.' :
          'Escolha uma senha nova para sua conta.'}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <label>Seu nome<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Como gostaria de ser chamado" required autoComplete="name"/></label>}
          {mode !== 'update-password' && <label>E-mail<div className="input-icon"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email"/></div></label>}
          {(mode === 'login' || mode === 'signup') && <label>Senha<div className="input-icon"><LockKeyhole size={17}/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" required minLength={6} autoComplete={mode==='login'?'current-password':'new-password'}/><button type="button" className="reveal" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
          {mode === 'update-password' && <label>Nova senha<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={6} required autoComplete="new-password" placeholder="Mínimo de 6 caracteres"/></label>}
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}
          <button className="primary-button" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar':mode==='signup'?'Criar minha conta':mode==='forgot'?'Enviar instruções':'Salvar nova senha'}</button>
        </form>
        <div className="auth-links">
          {mode === 'login' && <><button onClick={()=>{setMode('forgot');setError('');setMessage('')}}>Esqueci minha senha</button><span>Não tem conta? <button onClick={()=>{setMode('signup');setError('');setMessage('')}}>Criar conta</button></span></>}
          {mode === 'signup' && <span>Já possui uma conta? <button onClick={()=>{setMode('login');setError('');setMessage('')}}>Fazer login</button></span>}
          {mode === 'forgot' && <button onClick={()=>{setMode('login');setError('');setMessage('')}}><ArrowLeft size={14}/> Voltar ao login</button>}
          {mode === 'update-password' && <button onClick={()=>{setMode('login');setError('');setMessage('')}}>Voltar ao login</button>}
        </div>
        <div className="secure-note"><ShieldCheck size={15}/> Seus dados são protegidos por autenticação e políticas individuais de acesso.</div>
      </div>
    </div>
  </div>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cellars, setCellars] = useState<Cellar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [selected, setSelected] = useState<Cellar|null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({data}) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function loadData() {
    setLoading(true); setError('');
    const [{data:cellarData,error:cellarError},{data:profileData,error:profileError}] = await Promise.all([
      supabase.from('cellars').select('id,name,description,is_default,is_active,created_at').order('is_default',{ascending:false}).order('name'),
      supabase.from('profiles').select('full_name').single()
    ]);
    if (cellarError) setError(`Não foi possível carregar suas adegas: ${cellarError.message}`);
    else setCellars((cellarData||[]) as Cellar[]);
    if (!profileError) setProfileName(profileData?.full_name||'');
    setLoading(false);
  }

  useEffect(() => { if (session) void loadData(); else { setCellars([]); setProfileName(''); } }, [session?.user.id]);

  async function saveCellar(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = { name: name.trim(), description: description.trim() || null };
    const result = modal === 'edit' && selected
      ? await supabase.from('cellars').update(payload).eq('id',selected.id)
      : await supabase.from('cellars').insert(payload);
    if (result.error) setError(`Não foi possível salvar a adega: ${result.error.message}`);
    else { setModal(null); setSelected(null); setName(''); setDescription(''); setNotice('Adega salva com sucesso.'); await loadData(); }
    setSaving(false);
  }

  async function deleteCellar(cellar: Cellar) {
    if (!window.confirm(`Deseja excluir a adega "${cellar.name}"? Esta ação não poderá ser desfeita.`)) return;
    setError(''); setNotice('');
    const {count,error:countError} = await supabase.from('inventory_lots').select('id',{count:'exact',head:true}).eq('cellar_id',cellar.id);
    if (countError) { setError(`Não foi possível verificar o estoque: ${countError.message}`); return; }
    if ((count||0)>0) { setError('Esta adega possui lotes de estoque. Transfira ou retire as garrafas antes de excluí-la.'); return; }
    const {error:deleteError} = await supabase.from('cellars').delete().eq('id',cellar.id);
    if (deleteError) setError(`Não foi possível excluir: ${deleteError.message}`);
    else { setNotice('Adega excluída.'); await loadData(); }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setNotice('');
    const {error} = await supabase.from('profiles').update({full_name:profileName.trim()||null}).eq('id',session!.user.id);
    if (error) setError(`Não foi possível atualizar o perfil: ${error.message}`);
    else { setNotice('Perfil atualizado.'); setEditingProfile(false); }
    setSaving(false);
  }

  async function logout() { await supabase.auth.signOut(); }

  if (!authReady) return <div className="loading-screen"><Wine/><span>Preparando sua adega...</span></div>;
  if (!session) {
    if (!isSupabaseConfigured) return <div className="config-error"><h2>Configuração pendente</h2><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente e publique novamente.</p></div>;
    return <AuthScreen onAuthenticated={setSession}/>;
  }

  const email = session.user.email || '';
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Wine size={25}/></span><span>Gestão de Adegas</span></div>
      <div className="top-actions"><span className="user-email">{email}</span><button aria-label="Sair" title="Sair da conta" onClick={logout}><LogOut/></button></div>
    </header>
    <nav className="tabs"><button className="active"><Package size={18}/><span>Minhas adegas</span></button><button disabled title="Disponível na próxima etapa"><Wine size={18}/><span>Estoque</span></button><button disabled title="Disponível na próxima etapa"><CircleHelp size={18}/><span>Ajuda</span></button></nav>
    <main>
      <div className="page-heading"><div><span className="eyebrow">ÁREA PESSOAL</span><h1>Minhas adegas</h1><p>Organize seus espaços e mantenha seu inventário em ordem.</p></div><div className="heading-icon"><Grape/></div></div>
      <section className="welcome-card"><div className="welcome-icon"><Wine/></div><div className="welcome-copy"><span>SEJA BEM-VINDO</span><strong>{profileName || email.split('@')[0]}</strong><small>{email}</small></div><button onClick={()=>setEditingProfile(!editingProfile)}><Pencil size={16}/> Editar perfil</button></section>
      {editingProfile && <form className="inline-profile" onSubmit={saveProfile}><label>Nome de exibição<input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Seu nome"/></label><button className="primary-button" disabled={saving}>Salvar perfil</button></form>}
      {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
      <div className="section-title"><div><h2>Seus espaços</h2><span>{cellars.length} {cellars.length===1?'adega cadastrada':'adegas cadastradas'}</span></div><button className="primary-button add-cellar" onClick={()=>{setSelected(null);setName('');setDescription('');setModal('create')}}><Plus size={17}/> Nova adega</button></div>
      {loading ? <div className="loading-inline"><RefreshCw className="spin"/> Carregando suas adegas...</div> :
       cellars.length===0 ? <div className="empty large"><Wine size={38}/><strong>Sua coleção começa aqui</strong><span>Cadastre sua primeira adega para começar a organizar seus rótulos e garrafas.</span><button className="primary-button" onClick={()=>setModal('create')}><Plus size={17}/> Criar primeira adega</button></div> :
       <div className="cellar-grid">{cellars.map(c=><article className="cellar-card" key={c.id}><div className="cellar-card-top"><div className="cellar-icon"><Package/></div><button className="more-button" onClick={()=>{setSelected(c);setName(c.name);setDescription(c.description||'');setModal('edit')}} title="Editar adega"><Pencil size={17}/></button></div><div className="cellar-card-body"><div className="cellar-name-row"><h3>{c.name}</h3>{c.is_default&&<span className="default-tag">Principal</span>}</div><p>{c.description||'Sem descrição adicionada.'}</p><div className="cellar-card-foot"><span><Package size={14}/> Inventário</span><span className={c.is_active?'active-dot':'inactive-dot'}>{c.is_active?'Ativa':'Inativa'}</span></div></div><div className="cellar-card-actions"><button onClick={()=>{setSelected(c);setName(c.name);setDescription(c.description||'');setModal('edit')}}><Pencil size={14}/> Editar</button><button className="danger-link" onClick={()=>void deleteCellar(c)}><Trash2 size={14}/> Excluir</button></div></article>)}</div>}
      <section className="next-step"><div><ShieldCheck/><div><strong>Seus dados estão protegidos</strong><span>Seu inventário é privado e vinculado à sua conta.</span></div></div><span>SUPABASE AUTH + RLS</span></section>
    </main>
    <nav className="bottom-nav"><button className="active"><House/><span>Início</span></button><button><Package/><span>Adegas</span></button><button disabled><Wine/><span>Estoque</span></button><button onClick={logout}><LogOut/><span>Sair</span></button></nav>
    {modal&&<div className="modal-backdrop" onClick={()=>setModal(null)}><form className="modal" onSubmit={saveCellar} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">{modal==='create'?'NOVO ESPAÇO':'CONFIGURAÇÃO'}</span><h2>{modal==='create'?'Criar adega':'Editar adega'}</h2></div><button type="button" onClick={()=>setModal(null)}><X/></button></div><label>Nome da adega<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Adega Casa"/></label><label>Descrição (opcional)<textarea rows={3} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex.: Vinhos para ocasiões especiais"/></label><button className="primary-button" disabled={saving}>{saving?'Salvando...':'Salvar adega'}</button></form></div>}
    <footer>GESTÃO DE ADEGAS <span>•</span> ETAPA 03 — AUTENTICAÇÃO E ADEGAS</footer>
  </div>;
}

export default App;
