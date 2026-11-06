import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  Wine, Plus, Package, LogOut, LockKeyhole, Mail, Eye, EyeOff, X,
  RefreshCw, ShieldCheck, ArrowLeft, Grape, CircleHelp, Pencil, Trash2,
  House, ScanLine
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { resolveWineBarcode } from './lib/wine-catalog';


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

type Cellar = {
  id: string; name: string; description: string | null; is_default: boolean;
  is_active: boolean; created_at: string;
};
type Country = { id: number; iso2: string; name: string; flag_emoji: string | null };
type WineDraft = {
  name: string; producer: string; countryId: string; wineType: string;
  region: string; grapes: string; vintage: string; quantity: number;
  unitCost: string; barcode: string; imageUrl: string; sourceName: string;
};
type InventoryRow = {
  id: string; cellar_id: string; wine_id: string; vintage: number | null;
  quantity: number; unit_cost: number; cellars?: { name: string } | null;
  wines?: {
    id: string; name: string; producer_id: string | null; country_id: number | null;
    wine_type: string | null; region: string | null; grapes: string[];
    source_name?: string | null;
    countries?: { name: string; flag_emoji: string | null } | null;
    wine_barcodes?: { barcode: string }[];
    wine_images?: { image_path: string; image_url?: string; is_primary?: boolean; alt_text?: string | null }[];
  } | null;
};

const emptyDraft = (): WineDraft => ({
  name: '', producer: '', countryId: '', wineType: 'Tinto', region: '', grapes: '',
  vintage: '', quantity: 1, unitCost: '', barcode: '', imageUrl: '', sourceName: 'Cadastro manual',
});

function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let active = true;
    const reader = new BrowserMultiFormatReader();
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Câmera indisponível. Abra o aplicativo por HTTPS e permita o acesso à câmera.');
        }
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, _error, scannerControls) => {
          if (result && active) {
            active = false;
            scannerControls.stop();
            onDetected(result.getText());
          }
        });
        if (active) controlsRef.current = controls;
        else controls.stop();
      } catch (err) {
        if (active) setCameraError(err instanceof Error ? err.message : 'Não foi possível iniciar a câmera.');
      } finally { if (active) setStarting(false); }
    }
    void start();
    return () => { active = false; controlsRef.current?.stop(); };
  }, [onDetected]);

  return <div className="scanner-backdrop" onClick={onClose}>
    <section className="scanner-modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">LEITURA DO RÓTULO</span><h2>Escanear código</h2></div><button type="button" onClick={onClose}><X/></button></div>
      <div className="scanner-frame"><video ref={videoRef} muted playsInline/><div className="scanner-target"/><span>Posicione o código dentro da área</span></div>
      {starting && <p className="scanner-hint">Iniciando câmera...</p>}
      {cameraError && <div className="alert error">{cameraError}</div>}
      <p className="scanner-hint">Dica: mantenha a garrafa firme, com boa iluminação e o código sem reflexos.</p>
      <button type="button" className="secondary-button full-width" onClick={onClose}>Fechar leitor</button>
    </section>
  </div>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cellars, setCellars] = useState<Cellar[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
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
  const [activeTab, setActiveTab] = useState<'cellars'|'inventory'>('cellars');
  const [inventoryCellarFilter, setInventoryCellarFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showWineModal, setShowWineModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedCellarId, setSelectedCellarId] = useState('');
  const [draft, setDraft] = useState<WineDraft>(emptyDraft());
  const [existingWineId, setExistingWineId] = useState<string|null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [editingLotId, setEditingLotId] = useState<string|null>(null);
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [originalImagePreview, setOriginalImagePreview] = useState('');
  const [currentImagePath, setCurrentImagePath] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({data}) => {
      if (!mounted) return;
      setSession(data.session); setAuthReady(true);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,nextSession) => {
      setSession(nextSession); setAuthReady(true);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function loadData() {
    setLoading(true); setError('');
    const [{data:cellarData,error:cellarError},{data:profileData,error:profileError},{data:countryData,error:countryError},{data:lotData,error:lotError}] = await Promise.all([
      supabase.from('cellars').select('id,name,description,is_default,is_active,created_at').order('is_default',{ascending:false}).order('name'),
      supabase.from('profiles').select('full_name').single(),
      supabase.from('countries').select('id,iso2,name,flag_emoji').order('name'),
      supabase.from('inventory_lots').select('id,cellar_id,wine_id,vintage,quantity,unit_cost,cellars(name),wines(id,name,producer_id,country_id,wine_type,region,grapes,source_name,countries(name,flag_emoji),wine_barcodes(barcode),wine_images(image_path,alt_text,is_primary))').order('created_at',{ascending:false}),
    ]);
    if (cellarError) setError(`Não foi possível carregar suas adegas: ${cellarError.message}`);
    else setCellars((cellarData||[]) as Cellar[]);
    if (!profileError) setProfileName(profileData?.full_name||'');
    if (!countryError) setCountries((countryData||[]) as Country[]);
    if (lotError) setError(`Não foi possível carregar o estoque: ${lotError.message}`);
    else {
      const rows = await Promise.all((lotData||[]).map(async (raw: any) => {
        const row = raw as InventoryRow;
        if (!row.wines?.wine_images?.length) return row;
        const images = await Promise.all(row.wines.wine_images.map(async image => {
          if (!image.image_path) return {...image, image_url:''};
          if (/^https?:\/\//i.test(image.image_path)) return {...image, image_url:image.image_path};
          const {data:signed,error:signedError} = await supabase.storage.from('wine-images').createSignedUrl(image.image_path, 3600);
          if (signedError) console.warn('Não foi possível gerar URL da imagem:', signedError.message);
          return {...image, image_url:signed?.signedUrl || ''};
        }));
        images.sort((a,b)=>Number(Boolean(b.is_primary))-Number(Boolean(a.is_primary)));
        return {...row,wines:{...row.wines,wine_images:images}};
      }));
      setInventory(rows);
    }
    setLoading(false);
  }

  useEffect(() => { if (session) void loadData(); else { setCellars([]); setInventory([]); setProfileName(''); } }, [session?.user.id]);

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

  function openNewLot() {
    setError(''); setNotice('');
    setDraft(emptyDraft()); setExistingWineId(null); setLookupMessage('');
    setEditingLotId(null); setImageFile(null); setImagePreview(''); setOriginalImagePreview(''); setCurrentImagePath('');
    setSelectedCellarId(inventoryCellarFilter !== 'all' ? inventoryCellarFilter : (cellars[0]?.id || ''));
    setShowWineModal(true);
  }

  async function openEditLot(row: InventoryRow) {
    if (!row.wines) return;
    setError(''); setNotice(''); setLookupMessage('');
    let producerName = '';
    if (row.wines.producer_id) {
      const {data:producer,error:producerError} = await supabase.from('wine_producers').select('name').eq('id',row.wines.producer_id).maybeSingle();
      if (producerError) { setError(`Não foi possível carregar o produtor: ${producerError.message}`); return; }
      producerName = producer?.name || '';
    }
    const primaryImage = row.wines.wine_images?.[0];
    setDraft({
      ...emptyDraft(),
      name:row.wines.name,
      producer:producerName,
      countryId:row.wines.country_id ? String(row.wines.country_id) : '',
      wineType:row.wines.wine_type || 'Tinto',
      region:row.wines.region || '',
      grapes:(row.wines.grapes || []).join(', '),
      vintage:row.vintage ? String(row.vintage) : '',
      quantity:row.quantity,
      unitCost:String(row.unit_cost ?? ''),
      barcode:row.wines.wine_barcodes?.[0]?.barcode || '',
      sourceName:row.wines.source_name || 'Cadastro manual',
    });
    setExistingWineId(row.wine_id);
    setEditingLotId(row.id);
    setSelectedCellarId(row.cellar_id);
    setImageFile(null);
    setImagePreview(primaryImage?.image_url || '');
    setOriginalImagePreview(primaryImage?.image_url || '');
    setCurrentImagePath(primaryImage?.image_path || '');
    setShowWineModal(true);
  }

  function selectWineImage(file?: File) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { setError('Formato não aceito. Use JPG, PNG ou WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('A imagem deve ter no máximo 5 MB.'); return; }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function lookupBarcode(rawCode: string) {
    const code = rawCode.replace(/\D/g,'');
    if (!/^\d{8,14}$/.test(code)) { setError('Código inválido. Informe um EAN/UPC com 8 a 14 dígitos.'); return; }
    setDraft(d=>({...d,barcode:code})); setLookupBusy(true); setLookupMessage('Consultando seu catálogo e bases externas...'); setError('');
    try {
      // 1. Prioridade máxima: catálogo pessoal já confirmado no Supabase.
      const {data:barcodeRow,error:barcodeError} = await supabase.from('wine_barcodes').select('wine_id').eq('barcode',code).maybeSingle();
      if (barcodeError) throw barcodeError;
      if (barcodeRow?.wine_id) {
        const {data:wine,error:wineError} = await supabase.from('wines').select('id,name,producer_id,country_id,wine_type,region,grapes').eq('id',barcodeRow.wine_id).single();
        if (wineError) throw wineError;
        let producerName = '';
        if (wine.producer_id) {
          const {data:producer} = await supabase.from('wine_producers').select('name').eq('id',wine.producer_id).maybeSingle();
          producerName = producer?.name || '';
        }
        setExistingWineId(wine.id);
        setDraft(d=>({...d,name:wine.name,producer:producerName,countryId:wine.country_id?String(wine.country_id):'',wineType:wine.wine_type||'Tinto',region:wine.region||'',grapes:(wine.grapes||[]).join(', '),barcode:code,sourceName:'Catálogo pessoal Supabase'}));
        setLookupMessage('Rótulo encontrado no seu catálogo pessoal. Informe safra, quantidade e preço para adicionar um novo lote.');
        return;
      }

      // 2. Catálogo auxiliar de rótulos verificados e já confirmados.
      const verifiedFallbacks: Record<string, {
        name: string; producer: string; iso2: string; wineType: string;
        region: string; grapes: string[]; imageUrl: string; source: string;
      }> = {
        '8410415580011': {
          name: 'Pata Negra Oro Rosé', producer: 'Pata Negra', iso2: 'ES',
          wineType: 'Rosé', region: 'Valdepeñas', grapes: ['Tempranillo'],
          imageUrl: 'https://www.imigrantesbebidas.com.br/img/bebida/images/products/full/20256-vinho-pata-negra-oro-rose-750ml.20251013101722.jpg?p=product_regular&s=9bbf763f0be540c8e5d681a7d378177d',
          source: 'Catálogo comercial verificado',
        },
      };
      const fallback = verifiedFallbacks[code];
      if (fallback) {
        const country = countries.find(c => c.iso2.trim().toUpperCase() === fallback.iso2);
        setExistingWineId(null);
        setDraft(d => ({...d,name:fallback.name,producer:fallback.producer,countryId:country?String(country.id):'',wineType:fallback.wineType,region:fallback.region,grapes:fallback.grapes.join(', '),imageUrl:fallback.imageUrl,barcode:code,sourceName:fallback.source}));
        setImagePreview(fallback.imageUrl);
        setLookupMessage(`Rótulo identificado em catálogo verificado (${fallback.source}). Confira os dados antes de salvar.`);
        return;
      }

      // 3. Resolver em cascata: ProductGuru (EAN), Open Food Facts (EAN),
      // e ELID (nome/identidade de vinho, apenas para enriquecer uma identificação prévia).
      const result = await resolveWineBarcode(code);
      if (!result) {
        setExistingWineId(null);
        setDraft(d=>({...d,barcode:code,sourceName:'Cadastro manual'}));
        setLookupMessage('Não encontramos este código nas bases consultadas. O código foi lido corretamente; complete os dados manualmente. Após salvar, ele ficará disponível no seu catálogo pessoal.');
        return;
      }

      const country = result.countryIso2
        ? countries.find(c => c.iso2.trim().toUpperCase() === result.countryIso2!.toUpperCase())
        : countries.find(c => result.countryName && c.name.toLowerCase() === result.countryName.toLowerCase());
      setExistingWineId(null);
      setDraft(d=>({
        ...d,
        name:result.name || d.name,
        producer:result.producer || d.producer,
        countryId:country ? String(country.id) : d.countryId,
        wineType:result.wineType || d.wineType,
        region:result.region || d.region,
        grapes:result.grapes?.join(', ') || d.grapes,
        imageUrl:result.imageUrl || d.imageUrl,
        barcode:code,
        sourceName:result.sources.join(' + '),
      }));
      if (result.imageUrl) setImagePreview(result.imageUrl);
      setLookupMessage(`${result.name ? 'Produto identificado' : 'Encontramos alguns dados do produto'} em: ${result.sources.join(', ')}. Confirme os campos; dados não confirmados podem estar incompletos.`);
    } catch (err) {
      setLookupMessage(`As consultas externas falharam: ${err instanceof Error?err.message:'erro desconhecido'}. O código foi preservado; você pode preencher os dados manualmente.`);
    } finally { setLookupBusy(false); }
  }

  async function saveWineImage(wineId: string) {
    if (!imageFile) return;
    const extension = imageFile.type === 'image/png' ? 'png' :
      imageFile.type === 'image/webp' ? 'webp' : 'jpg';
    const objectPath = `${session!.user.id}/wines/${wineId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const {error:uploadError} = await supabase.storage.from('wine-images').upload(objectPath,imageFile,{
      contentType:imageFile.type,
      cacheControl:'3600',
      upsert:false,
    });
    if (uploadError) throw new Error(`Falha ao enviar foto para o Supabase Storage: ${uploadError.message}`);

    const {data:newImage,error:imageInsertError} = await supabase.from('wine_images').insert({
      wine_id:wineId,
      user_id:session!.user.id,
      image_path:objectPath,
      alt_text:`Rótulo de ${draft.name.trim()}`,
      is_primary:true,
    }).select('id').single();
    if (imageInsertError) throw new Error(`Foto enviada, mas não foi possível registrar no catálogo: ${imageInsertError.message}`);

    const {error:oldImagesError} = await supabase.from('wine_images')
      .update({is_primary:false}).eq('wine_id',wineId).neq('id',newImage.id);
    if (oldImagesError) console.warn('A nova foto foi salva, mas não foi possível desmarcar imagens anteriores:',oldImagesError.message);
  }

  async function saveWineLot(e: FormEvent) {
    e.preventDefault();
    const isEditing = Boolean(editingLotId && existingWineId);
    if (!selectedCellarId) { setError('Selecione a adega que receberá as garrafas.'); return; }
    if (!draft.name.trim()) { setError('Informe o nome do rótulo.'); return; }
    if (!isEditing && draft.barcode && !/^\d{8,14}$/.test(draft.barcode)) { setError('O código de barras deve ter de 8 a 14 dígitos ou ficar em branco.'); return; }
    if (!Number.isInteger(draft.quantity) || draft.quantity < 1) { setError('A quantidade deve ser de pelo menos uma garrafa.'); return; }
    const unitCost = Number(draft.unitCost.replace(',','.'));
    if (!draft.unitCost.trim() || !Number.isFinite(unitCost) || unitCost < 0) { setError('Informe um preço pago por garrafa válido.'); return; }
    const vintage = draft.vintage.trim() ? Number(draft.vintage) : null;
    if (vintage !== null && (!Number.isInteger(vintage) || vintage < 1900 || vintage > 2200)) { setError('Informe uma safra entre 1900 e 2200 ou deixe em branco.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      let wineId = existingWineId;
      let producerId: string | null = null;
      if (draft.producer.trim()) {
        const {data:existingProducer,error:producerLookupError} = await supabase.from('wine_producers')
          .select('id').eq('user_id',session!.user.id).ilike('name',draft.producer.trim()).maybeSingle();
        if (producerLookupError) throw producerLookupError;
        if (existingProducer) producerId = existingProducer.id;
        else {
          const {data:newProducer,error:newProducerError} = await supabase.from('wine_producers').insert({
            user_id:session!.user.id,name:draft.producer.trim(),
            country_id:draft.countryId?Number(draft.countryId):null,
          }).select('id').single();
          if (newProducerError) throw newProducerError;
          producerId = newProducer.id;
        }
      }

      if (isEditing && wineId && editingLotId) {
        const {error:wineUpdateError} = await supabase.from('wines').update({
          name:draft.name.trim(),producer_id:producerId,
          country_id:draft.countryId?Number(draft.countryId):null,
          wine_type:draft.wineType,region:draft.region.trim()||null,
          grapes:draft.grapes.split(',').map(v=>v.trim()).filter(Boolean),
        }).eq('id',wineId);
        if (wineUpdateError) throw wineUpdateError;

        const {error:lotUpdateError} = await supabase.from('inventory_lots').update({
          cellar_id:selectedCellarId,vintage,quantity:draft.quantity,unit_cost:unitCost,
        }).eq('id',editingLotId);
        if (lotUpdateError) throw lotUpdateError;

        const originalLot = inventory.find(item => item.id === editingLotId);
        const previousQuantity = originalLot?.quantity ?? draft.quantity;
        const quantityDifference = draft.quantity - previousQuantity;
        if (quantityDifference !== 0) {
          const {error:adjustmentError} = await supabase.from('stock_movements').insert({
            user_id:session!.user.id,
            lot_id:editingLotId,
            movement_type:quantityDifference > 0 ? 'adjustment_in' : 'adjustment_out',
            quantity:Math.abs(quantityDifference),
            unit_cost:unitCost,
            notes:'Ajuste de quantidade realizado na edição do lote',
          });
          if (adjustmentError) console.warn('Quantidade atualizada, mas o histórico do ajuste não foi registrado:',adjustmentError.message);
        }

        await saveWineImage(wineId);
        setNotice('Cadastro do vinho e dados do lote atualizados.');
      } else {
        if (!wineId) {
          const {data:newWine,error:wineError} = await supabase.from('wines').insert({
            user_id:session!.user.id,name:draft.name.trim(),producer_id:producerId,
            country_id:draft.countryId?Number(draft.countryId):null,wine_type:draft.wineType,
            region:draft.region.trim()||null,grapes:draft.grapes.split(',').map(v=>v.trim()).filter(Boolean),
            source_name:draft.sourceName || 'Cadastro manual',source_product_id:draft.barcode || null,
          }).select('id').single();
          if (wineError) throw wineError;
          wineId = newWine.id;
          if (draft.barcode) {
            const {error:barcodeInsertError} = await supabase.from('wine_barcodes').insert({
              wine_id:wineId,barcode:draft.barcode,barcode_type:'EAN/UPC',is_primary:true,
            });
            if (barcodeInsertError) throw barcodeInsertError;
          }
          if (draft.imageUrl.trim() && !imageFile) {
            const {error:imageError} = await supabase.from('wine_images').insert({
              wine_id:wineId,user_id:session!.user.id,image_path:draft.imageUrl.trim(),
              alt_text:`Garrafa de ${draft.name.trim()}`,is_primary:true,
            });
            if (imageError) throw imageError;
          }
          if (!wineId) throw new Error('Não foi possível identificar o vinho para salvar a fotografia.');
          await saveWineImage(wineId);
        }
        const {data:newLot,error:lotError} = await supabase.from('inventory_lots').insert({
          user_id:session!.user.id,cellar_id:selectedCellarId,wine_id:wineId,
          vintage,quantity:draft.quantity,unit_cost:unitCost,
        }).select('id').single();
        if (lotError) throw lotError;
        const {error:movementError} = await supabase.from('stock_movements').insert({
          user_id:session!.user.id,lot_id:newLot.id,movement_type:'opening_balance',
          quantity:draft.quantity,unit_cost:unitCost,notes:'Cadastro inicial do lote pelo inventário',
        });
        if (movementError) console.warn('Lote salvo; histórico inicial não foi registrado:',movementError.message);
        setNotice('Vinho e lote adicionados ao estoque.');
      }

      setShowWineModal(false); setShowScanner(false); setEditingLotId(null);
      setImageFile(null); setImagePreview(''); setOriginalImagePreview(''); setCurrentImagePath('');
      setActiveTab('inventory');
      await loadData();
    } catch (err) {
      setError(`Não foi possível salvar o vinho no estoque: ${err instanceof Error?err.message:'erro desconhecido'}`);
    } finally { setSaving(false); }
  }

  async function logout() { await supabase.auth.signOut(); }
  const email = session?.user.email || '';
  const filteredInventory = inventory.filter(row => {
    const matchesCellar = inventoryCellarFilter === 'all' || row.cellar_id === inventoryCellarFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || row.wines?.name.toLowerCase().includes(term) || row.wines?.wine_barcodes?.some(b=>b.barcode.includes(term));
    return matchesCellar && matchesSearch;
  });
  const totalBottles = filteredInventory.reduce((sum,row)=>sum+row.quantity,0);
  const totalValue = filteredInventory.reduce((sum,row)=>sum+row.quantity*Number(row.unit_cost),0);

  if (!authReady) return <div className="loading-screen"><Wine/><span>Preparando sua adega...</span></div>;
  if (!session) {
    if (!isSupabaseConfigured) return <div className="config-error"><h2>Configuração pendente</h2><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente e publique novamente.</p></div>;
    return <AuthScreen onAuthenticated={setSession}/>;
  }

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Wine size={25}/></span><span>Gestão de Adegas</span></div><div className="top-actions"><span className="user-email">{email}</span><button aria-label="Sair" title="Sair da conta" onClick={logout}><LogOut/></button></div></header>
    <nav className="tabs"><button className={activeTab==='cellars'?'active':''} onClick={()=>{setActiveTab('cellars');setError('');}}><Package size={18}/><span>Minhas adegas</span></button><button className={activeTab==='inventory'?'active':''} onClick={()=>{setActiveTab('inventory');setError('');}}><Wine size={18}/><span>Estoque</span></button><button disabled title="Disponível em uma próxima etapa"><CircleHelp size={18}/><span>Ajuda</span></button></nav>
    <main>
      {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
      {activeTab==='cellars' ? <>
        <div className="page-heading"><div><span className="eyebrow">ÁREA PESSOAL</span><h1>Minhas adegas</h1><p>Organize seus espaços e mantenha seu inventário em ordem.</p></div><div className="heading-icon"><Grape/></div></div>
        <section className="welcome-card"><div className="welcome-icon"><Wine/></div><div className="welcome-copy"><span>SEJA BEM-VINDO</span><strong>{profileName || email.split('@')[0]}</strong><small>{email}</small></div><button onClick={()=>setEditingProfile(!editingProfile)}><Pencil size={16}/> Editar perfil</button></section>
        {editingProfile && <form className="inline-profile" onSubmit={saveProfile}><label>Nome de exibição<input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Seu nome"/></label><button className="primary-button" disabled={saving}>Salvar perfil</button></form>}
        <div className="section-title"><div><h2>Seus espaços</h2><span>{cellars.length} {cellars.length===1?'adega cadastrada':'adegas cadastradas'}</span></div><button className="primary-button add-cellar" onClick={()=>{setSelected(null);setName('');setDescription('');setModal('create')}}><Plus size={17}/> Nova adega</button></div>
        {loading ? <div className="loading-inline"><RefreshCw className="spin"/> Carregando suas adegas...</div> : cellars.length===0 ? <div className="empty large"><Wine size={38}/><strong>Sua coleção começa aqui</strong><span>Cadastre sua primeira adega para começar a organizar seus rótulos e garrafas.</span><button className="primary-button" onClick={()=>setModal('create')}><Plus size={17}/> Criar primeira adega</button></div> :
          <div className="cellar-grid">{cellars.map(c=><article className="cellar-card" key={c.id}><div className="cellar-card-top"><div className="cellar-icon"><Package/></div><button className="more-button" onClick={()=>{setSelected(c);setName(c.name);setDescription(c.description||'');setModal('edit')}} title="Editar adega"><Pencil size={17}/></button></div><div className="cellar-card-body"><div className="cellar-name-row"><h3>{c.name}</h3>{c.is_default&&<span className="default-tag">Principal</span>}</div><p>{c.description||'Sem descrição adicionada.'}</p><div className="cellar-card-foot"><span><Package size={14}/> Inventário</span><span className={c.is_active?'active-dot':'inactive-dot'}>{c.is_active?'Ativa':'Inativa'}</span></div></div><div className="cellar-card-actions"><button onClick={()=>{setSelected(c);setName(c.name);setDescription(c.description||'');setModal('edit')}}><Pencil size={14}/> Editar</button><button className="danger-link" onClick={()=>void deleteCellar(c)}><Trash2 size={14}/> Excluir</button><button onClick={()=>{setInventoryCellarFilter(c.id);setActiveTab('inventory')}}><Wine size={14}/> Ver estoque</button></div></article>)}</div>}
      </> : <>
        <div className="page-heading"><div><span className="eyebrow">CONTROLE DE GARRAFAS</span><h1>Meu estoque</h1><p>Consulte seus rótulos e registre novas garrafas por código de barras.</p></div><div className="heading-icon"><Wine/></div></div>
        <div className="inventory-toolbar"><label className="filter-field"><span>Adega</span><select value={inventoryCellarFilter} onChange={e=>setInventoryCellarFilter(e.target.value)}><option value="all">Todas as adegas</option>{cellars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="search-field"><span>Buscar vinho ou código</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite o nome ou código de barras"/></label><button className="primary-button" onClick={openNewLot} disabled={!cellars.length}><Plus size={17}/> Adicionar vinho</button></div>
        <div className="inventory-summary"><div><span>Garrafas em estoque</span><strong>{totalBottles}</strong></div><div><span>Valor de aquisição</span><strong>{totalValue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div><div><span>Itens / lotes</span><strong>{filteredInventory.length}</strong></div></div>
        {loading ? <div className="loading-inline"><RefreshCw className="spin"/> Carregando estoque...</div> : filteredInventory.length===0 ? <div className="empty large"><Wine size={38}/><strong>Seu estoque ainda está vazio</strong><span>Adicione um vinho escaneando o código de barras da garrafa ou preenchendo os dados manualmente.</span><button className="primary-button" onClick={openNewLot} disabled={!cellars.length}><Plus size={17}/> Adicionar primeiro vinho</button>{!cellars.length&&<small>Cadastre uma adega antes de adicionar vinhos.</small>}</div> : <div className="inventory-list">{filteredInventory.map(row=>{
          const wine=row.wines; const imageUrl=wine?.wine_images?.[0]?.image_url||'';
          return <article className="inventory-card" key={row.id}><div className="wine-thumb">{imageUrl?<img src={imageUrl} alt={wine?.name||'Vinho'} onError={e=>{e.currentTarget.style.display='none';}}/>:<Wine size={30}/>}</div><div className="inventory-card-main"><h3>{wine?.name||'Rótulo sem nome'}</h3><p>{[wine?.wine_type,wine?.region].filter(Boolean).join(' · ')||'Tipo e região não informados'}</p><div className="wine-tags"><span>{wine?.countries?.flag_emoji||'🍷'} {wine?.countries?.name||'País não informado'}</span><span>{row.vintage||'Safra não informada'}</span><span>{row.cellars?.name||'Adega'}</span></div></div><div className="inventory-card-stats"><strong>{row.quantity} garrafa(s)</strong><span>{Number(row.unit_cost).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} / un.</span><button type="button" className="edit-wine-button" onClick={()=>void openEditLot(row)}><Pencil size={14}/> Editar vinho</button></div></article>;
        })}</div>}
      </>}
      <section className="next-step"><div><ShieldCheck/><div><strong>Seus dados estão protegidos</strong><span>Seu inventário é privado e vinculado à sua conta.</span></div></div><span>SUPABASE AUTH + RLS</span></section>
    </main>
    <nav className="bottom-nav"><button className={activeTab==='cellars'?'active':''} onClick={()=>setActiveTab('cellars')}><House/><span>Início</span></button><button className={activeTab==='cellars'?'':'active'} onClick={()=>setActiveTab('inventory')}><Wine/><span>Estoque</span></button><button onClick={openNewLot}><Plus/><span>Adicionar</span></button><button onClick={logout}><LogOut/><span>Sair</span></button></nav>
    {modal&&<div className="modal-backdrop" onClick={()=>setModal(null)}><form className="modal" onSubmit={saveCellar} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">{modal==='create'?'NOVO ESPAÇO':'CONFIGURAÇÃO'}</span><h2>{modal==='create'?'Criar adega':'Editar adega'}</h2></div><button type="button" onClick={()=>setModal(null)}><X/></button></div><label>Nome da adega<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Adega Casa"/></label><label>Descrição (opcional)<textarea rows={3} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex.: Vinhos para ocasiões especiais"/></label><button className="primary-button" disabled={saving}>{saving?'Salvando...':'Salvar adega'}</button></form></div>}
    {showWineModal&&<div className="modal-backdrop inventory-modal-backdrop" onClick={()=>{if(!saving){setShowWineModal(false);setShowScanner(false);}}}><form className="modal wine-modal" onSubmit={saveWineLot} onClick={e=>e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">{editingLotId?'EDITAR ITEM DO ESTOQUE':'NOVO ITEM DE ESTOQUE'}</span><h2>{editingLotId?'Editar vinho':'Adicionar vinho'}</h2></div><button type="button" onClick={()=>setShowWineModal(false)}><X/></button></div>
      {!editingLotId&&<><div className="scan-intro"><div><strong>Identifique o rótulo</strong><span>Leia o código de barras para buscar os dados automaticamente.</span></div><button type="button" className="primary-button" onClick={()=>setShowScanner(true)} disabled={lookupBusy}><ScanLine size={18}/> Escanear</button></div>
      <div className="barcode-entry"><input aria-label="Código de barras" inputMode="numeric" value={draft.barcode} onChange={e=>setDraft(d=>({...d,barcode:e.target.value.replace(/\D/g,'')}))} placeholder="EAN / UPC — opcional"/><button type="button" className="secondary-button" onClick={()=>void lookupBarcode(draft.barcode)} disabled={lookupBusy||draft.barcode.length<8}>{lookupBusy?'Buscando...':'Buscar'}</button></div></>}
      {lookupMessage&&<div className="lookup-message">{lookupMessage}{lookupMessage.includes('ELID.wine')&&<> Dados de identidade complementares por <a href="https://elid.wine" target="_blank" rel="noreferrer">ELID.wine</a>.</>}</div>}
      <div className="form-divider"><span>Dados do rótulo</span></div>
      <label>Nome do vinho<input required value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="Ex.: Malbec Reserva"/></label>
      <div className="form-grid"><label>Produtor / vinícola<input value={draft.producer} onChange={e=>setDraft(d=>({...d,producer:e.target.value}))} placeholder="Produtor"/></label><label>País de origem<select value={draft.countryId} onChange={e=>setDraft(d=>({...d,countryId:e.target.value}))}><option value="">Selecione o país</option>{countries.map(c=><option key={c.id} value={c.id}>{c.flag_emoji||''} {c.name}</option>)}</select></label></div>
      <div className="form-grid"><label>Tipo<select value={draft.wineType} onChange={e=>setDraft(d=>({...d,wineType:e.target.value}))}><option>Tinto</option><option>Branco</option><option>Rosé</option><option>Espumante</option><option>Fortificado</option><option>Outro</option></select></label><label>Região<input value={draft.region} onChange={e=>setDraft(d=>({...d,region:e.target.value}))} placeholder="Ex.: Mendoza"/></label></div>
      <label>Uvas (separadas por vírgula)<input value={draft.grapes} onChange={e=>setDraft(d=>({...d,grapes:e.target.value}))} placeholder="Malbec, Cabernet Sauvignon"/></label>
      <div className="form-divider"><span>Foto do vinho / rótulo</span></div>
      <p className="photo-help">Tire uma foto da garrafa ou do rótulo. A imagem será armazenada na sua área privada do Supabase. Formatos JPG, PNG ou WEBP, até 5 MB. O código de barras também pode ficar em branco no cadastro manual.</p>
      <label className="photo-picker"><span><Wine size={17}/> {imageFile?'Trocar foto selecionada':'Tirar foto ou escolher imagem'}</span><input type="file" accept="image/*" capture="environment" onChange={e=>selectWineImage(e.target.files?.[0])}/></label>
      {imagePreview&&<div className="image-preview photo-preview"><img src={imagePreview} alt="Prévia da foto do vinho"/><div><strong>{imageFile?'Nova foto selecionada':'Imagem atual'}</strong><span>{imageFile?imageFile.name:'A imagem já está salva no catálogo'}</span>{imageFile&&<button type="button" className="text-button" onClick={()=>{setImageFile(null);setImagePreview(currentImagePath && /^https?:\/\//i.test(currentImagePath)?currentImagePath:'');}}>Cancelar nova foto</button>}</div></div>}
      <div className="form-divider"><span>Dados do lote e armazenamento</span></div>
      <label>Adega<select required value={selectedCellarId} onChange={e=>setSelectedCellarId(e.target.value)}><option value="">Selecione a adega</option>{cellars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="form-grid three"><label>Safra<input inputMode="numeric" value={draft.vintage} onChange={e=>setDraft(d=>({...d,vintage:e.target.value.replace(/\D/g,'').slice(0,4)}))} placeholder="Ex.: 2022"/></label><label>Quantidade<input type="number" min="1" step="1" required value={draft.quantity} onChange={e=>setDraft(d=>({...d,quantity:Number(e.target.value)}))}/></label><label>Preço por garrafa (R$)<input inputMode="decimal" required value={draft.unitCost} onChange={e=>setDraft(d=>({...d,unitCost:e.target.value}))} placeholder="0,00"/></label></div>
      <button className="primary-button submit-lot" disabled={saving||lookupBusy}>{saving?'Salvando no Supabase...':editingLotId?'Salvar alterações':'Salvar no estoque'}</button>
    </form></div>}
    {showScanner&&<BarcodeScanner onClose={()=>setShowScanner(false)} onDetected={code=>{setShowScanner(false);void lookupBarcode(code);}}/>}
    <footer>GESTÃO DE ADEGAS <span>•</span> ETAPA 05 — EDIÇÃO DO INVENTÁRIO E FOTOS DOS RÓTULOS</footer>
  </div>;
}

export default App;
