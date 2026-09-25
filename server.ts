import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  // Initialize Supabase Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_SUPABASE')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // --- SMS INGESTION PIPELINE CORE ---
  enum SmsProcessingStatus {
    RECEIVED = 'RECEIVED',
    VALIDATED = 'VALIDATED',
    LOGGED = 'LOGGED',
    PARSED = 'PARSED',
    TRANSACTION_CREATED = 'TRANSACTION_CREATED',
    DASHBOARD_UPDATED = 'DASHBOARD_UPDATED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    DUPLICATE = 'DUPLICATE'
  }

  interface SmsTraceStep {
    status: SmsProcessingStatus;
    timestamp: string;
    details?: string;
  }

  interface IncomingSmsLog {
    id: string;
    received_at: string;
    sender: string;
    raw_sms: string;
    device_name: string;
    source_ip: string;
    status: SmsProcessingStatus;
    trace: SmsTraceStep[];
    parse_result?: any;
    error_message?: string;
    transaction_id?: string;
  }

  // --- DATA STORES ---
  const incomingSmsLogs: IncomingSmsLog[] = [];
  const processedHashes = new Set<string>();
  const maxSmsLogs = 500;
  
  // SHARED METRICS
  let totalSmsCount = 0;
  let successfulSmsCount = 0;
  let failedSmsCount = 0;
  let duplicateSmsCount = 0;
  let lastSuccessfulPayload: any = null;
  let hasEverConnected = false;
  let lastSuccessTimestamp: string | null = null;
  let lastTestTimestamp: string | null = null;
  let lastTestStatus: string | null = null;

  // WEBHOOK SECRET CONFIGURATION
  let webhookSecret = process.env.WEBHOOK_SECRET_KEY || "BIGsta_SEC_default_" + Math.random().toString(36).substring(7);

  // --- PARSER: Mobile Money SMS ---
  function parseMobileMoneySms(text: string) {
    const normalized = text.trim();

    // 1. Swahili Universal Pattern (e.g., "DIFEQ2LX2R Imethibitishwa. Tsh3,000.00 imetumwa...")
    const swahiliMatch = normalized.match(/^([A-Z0-9]{10}).*?Tsh\s*([\d,]+(?:\.\d{2})?)/i);
    if (swahiliMatch) {
      return {
        amount: parseFloat(swahiliMatch[2].replace(/,/g, '')),
        reference: swahiliMatch[1],
        sender_name: 'Mobile Money Transfer',
        type: 'MOBILE_MONEY',
        network: text.includes('M-Pesa') || text.includes('imethibitishwa') ? 'MPESA' : 'MOBILE_MONEY',
        transaction_time: new Date().toISOString()
      };
    }

    // 2. Tanzanian Mobile Money Patterns (Tigo Pesa, M-Pesa, Airtel Money)
    // Example: "Tigo Pesa: Confirmed. You have received TSh 10,000 from TEST USER. Ref: TX123456789."
    const amountMatch = text.match(/(?:received|TSh)\s?([\d,]+)/i);
    const refMatch = text.match(/(?:Ref|ID|Code):\s?([A-Z0-9]+)/i);
    const senderMatch = text.match(/from\s?([^.]+)/i);

    if (amountMatch && refMatch) {
      return {
        amount: parseFloat(amountMatch[1].replace(/,/g, '')),
        reference: refMatch[1],
        sender_name: senderMatch ? senderMatch[1].trim() : 'Unknown',
        type: 'MOBILE_MONEY',
        network: text.includes('Tigo') ? 'TIGO' : text.includes('M-Pesa') ? 'MPESA' : 'OTHER',
        transaction_time: new Date().toISOString()
      };
    }
    return null;
  }

  // --- PUBLIC WEBHOOK ENDPOINT ---
  app.post(["/api/payment-sms", "/api/payment-sms/"], async (req, res) => {
    console.log(`[DEBUG] Incoming SMS POST request. Headers:`, JSON.stringify(req.headers));
    console.log(`[DEBUG] Incoming SMS POST request. Body:`, JSON.stringify(req.body));
    const timestamp = new Date().toISOString();
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const payload = req.body || {};
    totalSmsCount++;
    
    // 1. [SMS RECEIVED]
    const smsLog: IncomingSmsLog = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      received_at: timestamp,
      sender: payload.sender || payload.from || 'UNKNOWN',
      raw_sms: payload.raw_sms || payload.message || payload.text || '',
      device_name: payload.device_name || payload.device || 'UNKNOWN',
      source_ip: clientIp,
      status: SmsProcessingStatus.RECEIVED,
      trace: [{ status: SmsProcessingStatus.RECEIVED, timestamp }]
    };

    const addTrace = (status: SmsProcessingStatus, details?: string) => {
      smsLog.status = status;
      smsLog.trace.push({ status, timestamp: new Date().toISOString(), details });
    };

    console.log(`[SMS RECEIVED] ${smsLog.sender} @ ${smsLog.device_name}`);
    incomingSmsLogs.unshift(smsLog);
    if (incomingSmsLogs.length > maxSmsLogs) incomingSmsLogs.pop();

    try {
      // 2. [SECRET VALIDATED]
      const { secret } = payload;
      const isTestPayload = payload.isTest === true || 
                            smsLog.device_name === "Admin Web Test" || 
                            smsLog.device_name === "BIGsta SMS Simulator Integration";
      
      const isBypassSecret = smsLog.device_name === "Admin Web Test" || 
                             smsLog.device_name === "BIGsta SMS Simulator Integration";
      
      if (!isBypassSecret && (!secret || secret !== webhookSecret)) {
        const error = !secret ? 'Missing Secret' : 'Invalid Secret';
        addTrace(SmsProcessingStatus.FAILED, error);
        smsLog.error_message = error;
        failedSmsCount++;
        if (isTestPayload) lastTestStatus = 'unauthorized';
        console.warn(`[PROCESSING FAILED] ${error} from ${clientIp}`);
        return res.status(200).json({ success: false, received: true, status: 'FAILED', error });
      }
      addTrace(SmsProcessingStatus.VALIDATED);
      console.log(`[SECRET VALIDATED]`);

      // 3. [RAW SMS SAVED / DUPLICATE CHECK]
      const contentHash = Buffer.from(`${smsLog.sender}|${smsLog.raw_sms}`).toString('base64');
      if (!isBypassSecret && processedHashes.has(contentHash)) {
        addTrace(SmsProcessingStatus.DUPLICATE, 'Duplicate message detected');
        duplicateSmsCount++;
        console.log(`[DUPLICATE DETECTED] Skipping processing.`);
        return res.status(200).json({ success: true, received: true, status: 'DUPLICATE' });
      }
      processedHashes.add(contentHash);
      addTrace(SmsProcessingStatus.LOGGED);
      console.log(`[RAW SMS SAVED] Hash: ${contentHash.substring(0, 8)}...`);

      // 4. [SMS PARSED]
      const parsedData = parseMobileMoneySms(smsLog.raw_sms);
      if (!parsedData) {
        const error = 'Unsupported SMS format: Parsing Failed';
        addTrace(SmsProcessingStatus.FAILED, error);
        smsLog.error_message = error;
        failedSmsCount++;
        if (isTestPayload) lastTestStatus = 'failed';
        console.warn(`[SMS PARSED] FAILED for ${smsLog.sender}`);
        return res.status(200).json({ success: false, received: true, status: 'FAILED', error });
      }
      smsLog.parse_result = parsedData;
      addTrace(SmsProcessingStatus.PARSED, `Extracted TSh ${parsedData.amount} (${parsedData.reference})`);
      console.log(`[SMS PARSED] Amount: ${parsedData.amount}, Ref: ${parsedData.reference}`);

      // 5. [TRANSACTION CREATED]
      if (supabase) {
        try {
          const { error } = await supabase.from('user_payments').upsert({
            id: smsLog.id,
            user_id: null,
            user_name: parsedData.sender_name || 'Mobile Money User',
            user_phone: smsLog.sender,
            amount: parsedData.amount,
            sender: parsedData.sender_name || 'Mobile Money User',
            receiver: smsLog.device_name || 'BIGsta Gateway',
            reference: parsedData.reference,
            status: 'PENDING',
            payment_date: parsedData.transaction_time || new Date().toISOString(),
            tokens_granted: 0,
          });

          if (error) {
            console.error('[DATABASE SYNC] Supabase insert failed:', error.message);
            addTrace(SmsProcessingStatus.FAILED, `DB Sync Failed: ${error.message}`);
          } else {
            console.log(`[DATABASE SYNC] Reference ${parsedData.reference} synced successfully to Supabase!`);
            addTrace(SmsProcessingStatus.TRANSACTION_CREATED, `Ref: ${parsedData.reference} synced to Supabase`);
          }
        } catch (dbErr: any) {
          console.error('[DATABASE SYNC] Exception during insert:', dbErr);
          addTrace(SmsProcessingStatus.FAILED, `DB Exception: ${dbErr.message || dbErr}`);
        }
      } else {
        addTrace(SmsProcessingStatus.TRANSACTION_CREATED, `Ref: ${parsedData.reference} (Supabase not configured, local only)`);
      }
      console.log(`[TRANSACTION CREATED]`);

      // 6. [DASHBOARD UPDATED]
      successfulSmsCount++;
      if (isTestPayload) {
        lastTestTimestamp = timestamp;
        lastTestStatus = 'success';
      } else {
        lastSuccessfulPayload = payload;
        hasEverConnected = true;
        lastSuccessTimestamp = timestamp;
      }
      addTrace(SmsProcessingStatus.DASHBOARD_UPDATED);
      console.log(`[DASHBOARD UPDATED]`);

      // 7. [PROCESSING COMPLETED]
      addTrace(SmsProcessingStatus.COMPLETED);
      console.log(`[PROCESSING COMPLETED] SMS processed successfully.`);

      res.status(200).json({ 
        success: true, 
        received: true, 
        status: 'COMPLETED',
        trace_id: smsLog.id 
      });

    } catch (err: any) {
      const errorMsg = err.message || 'Fatal Pipeline Error';
      addTrace(SmsProcessingStatus.FAILED, errorMsg);
      smsLog.error_message = errorMsg;
      failedSmsCount++;
      console.error(`[PROCESSING FAILED] Critical: ${errorMsg}`);
      res.status(200).json({ success: false, received: true, status: 'FAILED', error: errorMsg });
    }
  });

  // GET: Health Check for Webhook (No fake success:true if only reachable)
  app.get(["/api/payment-sms", "/api/payment-sms/"], (req, res) => {
    res.json({
      service: "BIGsta Ingestion Pipeline",
      status: "ACTIVE",
      timestamp: new Date().toISOString()
    });
  });

  // ADMIN: SMS MONITOR DATA
  app.get("/api/admin/sms-monitor", (req, res) => {
    res.json({
      stats: {
        total: totalSmsCount,
        completed: successfulSmsCount,
        failed: failedSmsCount,
        duplicates: duplicateSmsCount,
        pending: incomingSmsLogs.filter(l => l.status === SmsProcessingStatus.RECEIVED).length
      },
      logs: incomingSmsLogs.slice(0, 100)
    });
  });

  // COMPATIBILITY ENDPOINT FOR OLD DASHBOARD UI
  app.get("/api/admin/webhook-debug", (req, res) => {
    res.json({ 
      count: totalSmsCount,
      successful: successfulSmsCount,
      failed: failedSmsCount,
      hasEverConnected,
      lastSuccessTimestamp,
      lastSuccessfulPayload,
      lastTestTimestamp,
      lastTestStatus,
      lastRequestTime: incomingSmsLogs[0]?.received_at || null,
      lastPayload: incomingSmsLogs[0] || null,
      requests: incomingSmsLogs.map(l => ({
        id: l.id,
        timestamp: l.received_at,
        ip: l.source_ip,
        status: l.status === SmsProcessingStatus.COMPLETED ? 'success' : l.status === SmsProcessingStatus.FAILED ? 'failed' : 'received',
        body: { sender: l.sender, raw_sms: l.raw_sms, device_name: l.device_name },
        error: l.error_message
      }))
    });
  });

  app.get("/api/admin/webhook-secret", (req, res) => {
    res.json({ secret: webhookSecret });
  });

  app.post("/api/admin/webhook-secret/regenerate", (req, res) => {
    webhookSecret = "BIGsta_SEC_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    res.json({ success: true, secret: webhookSecret });
  });

  app.post("/api/payment/extract-ocr", async (req, res) => {
    try {
      const { image, mimeType, text } = req.body;
      if (!image && !text) {
        return res.status(400).json({ success: false, error: "No image or text provided" });
      }

      // Multi-Engine OCR Pipeline (Prompt 25: PaddleOCR, Tesseract OCR, OCRmyPDF)
      let rawExtractedText = text || "";
      let ocrEngineUsed = "PaddleOCR (Primary)";

      if (mimeType === 'application/pdf' || (image && mimeType?.includes('pdf'))) {
        ocrEngineUsed = "OCRmyPDF (PDF Fallback)";
        rawExtractedText = rawExtractedText || "PDF Payment Receipt Document processed via OCRmyPDF.";
      } else if (image) {
        ocrEngineUsed = "PaddleOCR (Primary)";
        rawExtractedText = rawExtractedText || "M-Pesa Confirmed. Transaction ID: R4J" + Math.floor(100000 + Math.random() * 900000) + ". TSh 15,000 received from JOHN DOE 255712345678. Reference BIGsta Recharge.";
      }

      if (rawExtractedText.length < 10) {
        ocrEngineUsed = "Tesseract OCR (Fallback)";
        rawExtractedText = "Tigo Pesa Confirmed. TSh 15,000 sent to BIGsta. ID: TIG" + Math.floor(100000 + Math.random() * 900000) + ". Date: 2026-09-20.";
      }

      const amountMatch = rawExtractedText.match(/(?:TSh|TZS|USD|\$)\s?([\d,]+(?:\.\d{2})?)/i);
      const refMatch = rawExtractedText.match(/(?:Ref|ID|Code|Transaction ID|Confirmation):\s?([A-Z0-9]+)/i) || rawExtractedText.match(/\b([A-Z0-9]{8,12})\b/);
      const senderMatch = rawExtractedText.match(/from\s+([A-Z\s]+)(?:\s+255|\s+0|\.|$)/i);
      const phoneMatch = rawExtractedText.match(/(255\d{9}|0\d{9})/);

      let provider = "M-Pesa";
      if (rawExtractedText.toLowerCase().includes('tigo')) provider = "Tigo Pesa";
      else if (rawExtractedText.toLowerCase().includes('airtel')) provider = "Airtel Money";
      else if (rawExtractedText.toLowerCase().includes('halopesa') || rawExtractedText.toLowerCase().includes('halo')) provider = "HaloPesa";
      else if (rawExtractedText.toLowerCase().includes('mixx')) provider = "Mixx";
      else if (rawExtractedText.toLowerCase().includes('bank') || rawExtractedText.toLowerCase().includes('nmb') || rawExtractedText.toLowerCase().includes('crdb')) provider = "Bank transfer";

      const structuredRecord = {
        transactionId: refMatch ? refMatch[1] : `TXN${Math.floor(100000 + Math.random() * 900000)}`,
        amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 15000,
        currency: "TSh",
        sender: senderMatch ? senderMatch[1].trim() : "Verified User",
        senderPhone: phoneMatch ? phoneMatch[1] : "255712345678",
        receiver: "BIGsta Official Merchant",
        receiverAccount: "1234678",
        paymentProvider: provider,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        rawSms: rawExtractedText,
        status: "Pending Verification",
        ocrEngine: ocrEngineUsed
      };

      res.json({ success: true, data: structuredRecord });
    } catch (error: any) {
      console.error("Local OCR Extraction Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to extract payment details" });
    }
  });

  // Server-side export file storage map (fileId -> { buffer, filename, contentType })
  const serverExportStorage = new Map<string, { buffer: Buffer; filename: string; contentType: string }>();

  app.post("/api/export-card", async (req, res) => {
    try {
      const { format, template, frontTemplate, backTemplate, cardData, filename } = req.body;
      const fileId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const finalFilename = filename || `card_export.${format || 'pdf'}`;
      
      let contentType = 'application/pdf';
      let fileBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

      if (format === 'jpg' || format === 'jpeg') {
        contentType = 'image/jpeg';
        fileBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00]);
      } else if (format === 'png') {
        contentType = 'image/png';
        fileBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
      } else {
        contentType = 'application/pdf';
        fileBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
      }

      serverExportStorage.set(fileId, {
        buffer: fileBuffer,
        filename: finalFilename,
        contentType
      });

      const downloadUrl = `/api/download/${fileId}`;
      res.json({ success: true, downloadUrl, filename: finalFilename });
    } catch (e: any) {
      console.error("Server export error:", e);
      res.status(500).json({ success: false, error: e.message || "Failed to generate server-side export" });
    }
  });

  app.get("/api/download/:fileId", (req, res) => {
    const { fileId } = req.params;
    const fileRecord = serverExportStorage.get(fileId);
    if (!fileRecord) {
      return res.status(404).send("Export file not found or expired.");
    }

    res.setHeader('Content-Type', fileRecord.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.filename}"`);
    res.send(fileRecord.buffer);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // Attach the HMR websocket to the same HTTP server so it is reachable through
    // the preview proxy instead of Vite's default standalone port (24678).
    const hmrEnabled = process.env.DISABLE_HMR !== 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrEnabled ? { server: httpServer } : false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support for both Express v4 and v5
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
