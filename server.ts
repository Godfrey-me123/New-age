import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    // Tanzanian Mobile Money Patterns (Tigo Pesa, M-Pesa, Airtel Money)
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
        network: text.includes('Tigo') ? 'TIGO' : text.includes('M-Pesa') ? 'MPESA' : 'OTHER'
      };
    }
    return null;
  }

  // --- PUBLIC WEBHOOK ENDPOINT ---
  app.post(["/api/payment-sms", "/api/payment-sms/"], async (req, res) => {
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
      const isTestPayload = payload.isTest === true || smsLog.device_name === "Admin Web Test";
      
      if (!secret || secret !== webhookSecret) {
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
      if (processedHashes.has(contentHash)) {
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
      // Note: In production, this would trigger an DB insert to Transaction table
      addTrace(SmsProcessingStatus.TRANSACTION_CREATED, `Ref: ${parsedData.reference}`);
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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
