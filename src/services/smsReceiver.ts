import { supabase } from './supabase';
import { parseSms } from '../utils/smsParser';

export const SMS_TABLE = 'sms_logs';

export type SmsReviewStatus = 'UNREVIEWED' | 'REVIEWED' | 'IGNORED';
export type SmsProcessingState = 'PARSED' | 'PARSE_FAILED';

export interface SmsTransaction {
  id: string;
  sms_hash: string;
  sender: string;
  raw_sms: string;
  received_at: string;
  device_id: string;
  network: string | null;
  amount: number | null;
  reference: string | null;
  receiver: string | null;
  balance: number | null;
  transaction_id: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  status: SmsReviewStatus;
  processing_state: SmsProcessingState;
  source: string;
  created_at?: string;
}

export interface SmsDiagnostics {
  receiverRegisteredAt: string | null;
  nativeInterfaceDetected: boolean;
  lastSmsReceivedAt: string | null;
  lastSmsSender: string | null;
  lastSmsSavedAt: string | null;
  lastSupabaseInsertAt: string | null;
  lastSupabaseInsertId: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  pendingOutbox: number;
  totalReceived: number;
  totalSaved: number;
  totalFailed: number;
}

const DIAG_KEY = 'bigsta_sms_receiver_diagnostics';
const OUTBOX_KEY = 'bigsta_sms_receiver_outbox';
const DEVICE_KEY = 'bigsta_sms_device_id';
const DIAG_EVENT = 'bigsta:sms-diagnostics';

const emptyDiagnostics = (): SmsDiagnostics => ({
  receiverRegisteredAt: null,
  nativeInterfaceDetected: false,
  lastSmsReceivedAt: null,
  lastSmsSender: null,
  lastSmsSavedAt: null,
  lastSupabaseInsertAt: null,
  lastSupabaseInsertId: null,
  lastErrorAt: null,
  lastError: null,
  pendingOutbox: 0,
  totalReceived: 0,
  totalSaved: 0,
  totalFailed: 0,
});

function getNativeInterface(): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.AndroidInterface || w.Android || w.JSInterface || null;
}

export function getSmsDiagnostics(): SmsDiagnostics {
  try {
    const raw = localStorage.getItem(DIAG_KEY);
    const parsed = raw ? { ...emptyDiagnostics(), ...JSON.parse(raw) } : emptyDiagnostics();
    parsed.nativeInterfaceDetected = Boolean(getNativeInterface());
    parsed.pendingOutbox = readOutbox().length;
    return parsed;
  } catch {
    return emptyDiagnostics();
  }
}

function updateDiagnostics(patch: Partial<SmsDiagnostics>) {
  const next = { ...getSmsDiagnostics(), ...patch };
  try {
    localStorage.setItem(DIAG_KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new CustomEvent(DIAG_EVENT));
}

export function subscribeSmsDiagnostics(callback: () => void): () => void {
  window.addEventListener(DIAG_EVENT, callback);
  return () => window.removeEventListener(DIAG_EVENT, callback);
}

function recordError(message: string) {
  console.error('[BIGsta SMS Receiver]', message);
  updateDiagnostics({ lastError: message, lastErrorAt: new Date().toISOString() });
}

export function getDeviceId(): string {
  const native = getNativeInterface();
  if (native && typeof native.getDeviceId === 'function') {
    try {
      const id = String(native.getDeviceId() || '').trim();
      if (id) return id;
    } catch {}
  }
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev_${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function detectNetwork(sender: string, text: string): string | null {
  const hay = `${sender} ${text}`.toLowerCase();
  if (hay.includes('m-pesa') || hay.includes('mpesa') || hay.includes('vodacom')) return 'M-Pesa';
  if (hay.includes('mixx') || hay.includes('yas')) return 'Mixx by Yas';
  if (hay.includes('tigo')) return 'Tigo Pesa';
  if (hay.includes('airtel')) return 'Airtel Money';
  if (hay.includes('halo')) return 'HaloPesa';
  if (hay.includes('t-pesa') || hay.includes('ttcl')) return 'T-Pesa';
  if (hay.includes('crdb') || hay.includes('nmb') || hay.includes('bank')) return 'Bank';
  return null;
}

const toNumber = (v?: string | null) => {
  if (!v) return null;
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

export interface ExtractedPayment {
  amount: number | null;
  reference: string | null;
  transactionId: string | null;
  payerName: string | null;
  payerPhone: string | null;
  receiver: string | null;
  balance: number | null;
  network: string | null;
}

export function extractPaymentFields(sender: string, rawSms: string): ExtractedPayment {
  const text = rawSms.trim();
  const structured = parseSms(text);

  const amountMatch = text.match(/(?:TSh|Tsh|TZS)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const refMatch =
    text.match(/(?:Ref(?:erence)?|Kumbukumbu|Muamala|Transaction\s*ID|TxnID|ID)\s*(?:No\.?|namba)?\s*[:.]?\s*([A-Z0-9]{6,20})/i) ||
    text.match(/^([A-Z0-9]{8,12})\b/);
  const phoneMatch = text.match(/\b(255\d{9}|0[67]\d{8})\b/);
  const balanceMatch = text.match(/(?:balance|salio)[^\d]{0,40}([\d,]+(?:\.\d{1,2})?)/i);
  const fromMatch = text.match(/(?:from|kutoka\s+kwa|kutoka)\s+([A-Z][A-Z .'-]{2,40}?)(?=\s*(?:\(|\d|on\b|mnamo|\.|,|$))/i);
  const toMatch = text.match(/(?:sent\s+to|to|kwenda\s+kwa|kwa)\s+([A-Z][A-Z .'-]{2,40}?)(?=\s*(?:\(|\d|on\b|mnamo|\.|,|$))/i);

  const reference = structured?.transactionReference || refMatch?.[1] || null;
  return {
    amount: structured?.amount ?? toNumber(amountMatch?.[1]),
    reference,
    transactionId: reference,
    payerName: structured?.senderName && structured.senderName !== 'Mobile Payment Transfer' ? structured.senderName : fromMatch?.[1]?.trim() || null,
    payerPhone: structured?.senderPhone || phoneMatch?.[1] || null,
    receiver: toMatch?.[1]?.trim() || null,
    balance: structured?.newBalance || toNumber(balanceMatch?.[1]),
    network: detectNetwork(sender, text) || (structured?.network && structured.network !== 'Mobile Money Gateway' ? structured.network : null),
  };
}

interface OutboxItem {
  sender: string;
  rawSms: string;
  receivedAt: string;
  attempts: number;
}

function readOutbox(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

export interface SmsSaveResult {
  ok: boolean;
  duplicate?: boolean;
  id?: string;
  error?: string;
}

async function persistSms(sender: string, rawSms: string, receivedAt: string): Promise<SmsSaveResult> {
  if (!supabase) return { ok: false, error: 'Supabase client not configured' };

  const deviceId = getDeviceId();
  const smsHash = await sha256(`${sender}|${rawSms}|${receivedAt}`);
  const fields = extractPaymentFields(sender, rawSms);
  const parsed = fields.amount !== null && fields.reference !== null;

  const row = {
    sms_hash: smsHash,
    sender,
    raw_sms: rawSms,
    received_at: receivedAt,
    device_id: deviceId,
    network: fields.network,
    amount: fields.amount,
    reference: fields.reference,
    receiver: fields.receiver,
    balance: fields.balance,
    transaction_id: fields.transactionId,
    payer_name: fields.payerName,
    payer_phone: fields.payerPhone,
    status: 'UNREVIEWED' as SmsReviewStatus,
    processing_state: (parsed ? 'PARSED' : 'PARSE_FAILED') as SmsProcessingState,
    source: 'bigsta_apk',
  };

  const { data, error } = await supabase.from(SMS_TABLE).insert(row).select('id').single();

  if (error) {
    if (error.code === '23505') return { ok: true, duplicate: true };
    return { ok: false, error: `${error.code || 'ERR'}: ${error.message}` };
  }
  if (!data?.id) return { ok: false, error: 'Insert returned no row; record not confirmed' };
  return { ok: true, id: data.id };
}

export async function receiveNativeSms(senderInput: string, rawInput: string, timestamp?: string | number): Promise<SmsSaveResult> {
  const now = new Date().toISOString();
  const sender = String(senderInput || '').trim() || 'UNKNOWN';
  const rawSms = String(rawInput ?? '');
  const parsedTs = timestamp !== undefined && timestamp !== null && timestamp !== '' ? new Date(Number(timestamp) || timestamp) : null;
  const receivedAt = parsedTs && !Number.isNaN(parsedTs.getTime()) ? parsedTs.toISOString() : now;

  const diag = getSmsDiagnostics();
  updateDiagnostics({
    lastSmsReceivedAt: now,
    lastSmsSender: sender,
    totalReceived: diag.totalReceived + 1,
  });

  if (!rawSms.trim()) {
    recordError(`Rejected empty SMS body from ${sender}`);
    updateDiagnostics({ totalFailed: getSmsDiagnostics().totalFailed + 1 });
    return { ok: false, error: 'Empty SMS body' };
  }

  let result: SmsSaveResult;
  try {
    result = await persistSms(sender, rawSms, receivedAt);
  } catch (err: any) {
    result = { ok: false, error: err?.message || String(err) };
  }

  if (result.ok) {
    const saveTime = new Date().toISOString();
    updateDiagnostics({
      lastSmsSavedAt: saveTime,
      lastSupabaseInsertAt: result.duplicate ? getSmsDiagnostics().lastSupabaseInsertAt : saveTime,
      lastSupabaseInsertId: result.id ?? getSmsDiagnostics().lastSupabaseInsertId,
      totalSaved: getSmsDiagnostics().totalSaved + (result.duplicate ? 0 : 1),
    });
  } else {
    const outbox = readOutbox();
    outbox.push({ sender, rawSms, receivedAt, attempts: 1 });
    writeOutbox(outbox);
    recordError(`Supabase insert failed (queued for retry): ${result.error}`);
    updateDiagnostics({ totalFailed: getSmsDiagnostics().totalFailed + 1 });
  }
  return result;
}

let flushing = false;
export async function flushSmsOutbox(): Promise<{ saved: number; remaining: number }> {
  if (flushing) return { saved: 0, remaining: readOutbox().length };
  flushing = true;
  let saved = 0;
  try {
    const items = readOutbox();
    const remaining: OutboxItem[] = [];
    for (const item of items) {
      const res = await persistSms(item.sender, item.rawSms, item.receivedAt).catch((e) => ({ ok: false, error: String(e) }) as SmsSaveResult);
      if (res.ok) {
        saved++;
        const t = new Date().toISOString();
        updateDiagnostics({
          lastSmsSavedAt: t,
          lastSupabaseInsertAt: res.duplicate ? getSmsDiagnostics().lastSupabaseInsertAt : t,
          lastSupabaseInsertId: res.id ?? getSmsDiagnostics().lastSupabaseInsertId,
          totalSaved: getSmsDiagnostics().totalSaved + (res.duplicate ? 0 : 1),
        });
      } else {
        remaining.push({ ...item, attempts: item.attempts + 1 });
        recordError(`Outbox retry failed: ${res.error}`);
      }
    }
    writeOutbox(remaining);
    updateDiagnostics({});
    return { saved, remaining: remaining.length };
  } finally {
    flushing = false;
  }
}

export function markReceiverRegistered() {
  updateDiagnostics({ receiverRegisteredAt: new Date().toISOString() });
}

export type SmsTableHealth = { ok: true } | { ok: false; error: string; missingTable: boolean };

export async function checkSmsTable(): Promise<SmsTableHealth> {
  if (!supabase) return { ok: false, error: 'Supabase client not configured', missingTable: false };
  const { error } = await supabase.from(SMS_TABLE).select('id', { head: true, count: 'exact' }).limit(1);
  if (error) {
    const missing = error.code === 'PGRST205' || error.code === '42P01' || /could not find the table|does not exist/i.test(error.message);
    return { ok: false, error: `${error.code || 'ERR'}: ${error.message}`, missingTable: missing };
  }
  return { ok: true };
}

export async function fetchSmsTransactions(limit = 200): Promise<SmsTransaction[]> {
  if (!supabase) throw new Error('Supabase client not configured');
  const { data, error } = await supabase.from(SMS_TABLE).select('*').order('received_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`${error.code || 'ERR'}: ${error.message}`);
  return (data || []) as SmsTransaction[];
}

export async function fetchLatestSavedSms(): Promise<SmsTransaction | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(SMS_TABLE).select('*').order('created_at', { ascending: false }).limit(1);
  if (error) throw new Error(`${error.code || 'ERR'}: ${error.message}`);
  return (data?.[0] as SmsTransaction) || null;
}

export async function countUnreviewedSms(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(SMS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'UNREVIEWED');
  if (error) return 0;
  return count || 0;
}

export async function updateSmsStatus(id: string, status: SmsReviewStatus): Promise<void> {
  if (!supabase) throw new Error('Supabase client not configured');
  const { data, error } = await supabase.from(SMS_TABLE).update({ status }).eq('id', id).select('id').single();
  if (error) throw new Error(`${error.code || 'ERR'}: ${error.message}`);
  if (!data) throw new Error('Update not confirmed');
}

export function subscribeSmsTransactions(onChange: () => void): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel(`realtime_${SMS_TABLE}_${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: SMS_TABLE }, onChange)
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

export const SMS_TABLE_SQL = `CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_hash TEXT UNIQUE NOT NULL,
  sender TEXT NOT NULL,
  raw_sms TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,
  network TEXT,
  amount NUMERIC,
  reference TEXT,
  receiver TEXT,
  balance NUMERIC,
  transaction_id TEXT,
  payer_name TEXT,
  payer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'UNREVIEWED',
  processing_state TEXT NOT NULL DEFAULT 'PARSE_FAILED',
  source TEXT NOT NULL DEFAULT 'bigsta_apk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sms_logs_received_at_idx ON public.sms_logs (received_at DESC);
CREATE INDEX IF NOT EXISTS sms_logs_status_idx ON public.sms_logs (status);
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access sms_logs" ON public.sms_logs;
CREATE POLICY "Allow public access sms_logs" ON public.sms_logs FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_logs;
NOTIFY pgrst, 'reload schema';`;
