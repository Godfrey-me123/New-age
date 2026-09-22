import { paymentDb } from './paymentDb';
import { parseSms } from '../utils/smsParser';
import { PaymentRecord, VerificationLog, TokenTransaction, ServiceUnlock, PaymentStatus, VerificationType } from '../types';
import { useTemplateStore } from '../store/useTemplateStore';

export class PaymentService {
  async receiveSms(payload: { raw_sms: string; sender: string; received_at: string; device_name: string }): Promise<PaymentRecord> {
    const { raw_sms, sender, received_at, device_name } = payload;
    
    const parsed = parseSms(raw_sms);
    
    // Check for duplicate reference
    if (parsed?.transactionReference) {
      const isDup = await this.isReferenceDuplicate(parsed.transactionReference);
      if (isDup) {
        throw new Error('Duplicate transaction reference detected.');
      }
    }

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rawSms: raw_sms,
      sender: sender,
      receivedAt: received_at,
      deviceName: device_name,
      status: 'pending',
      used: false,
      ...parsed,
    };

    // Calculate previous balance
    if (payment.newBalance !== undefined && payment.amount !== undefined) {
      payment.previousBalance = payment.newBalance - payment.amount;
    }

    await paymentDb.addPayment(payment);
    await this.logAction(payment.id, 'received', `SMS received from ${sender} via ${device_name}`);
    
    // Sync to Supabase cloud!
    try {
      const { syncPaymentRecordSupabase } = await import('./supabase');
      await syncPaymentRecordSupabase(payment);
    } catch (e) {
      console.warn('Failed to sync incoming SMS payment to Supabase:', e);
    }

    return payment;
  }

  /**
   * User provides a reference and amount to auto-verify their payment or submit a claim
   */
  async autoConfirmWithReference(reference: string, amountInput: number, passkeyId: string): Promise<{ success: boolean; message: string; status: 'verified' | 'submitted' }> {
    // 1. Fetch from Supabase as first choice for cross-device connectivity
    let all: PaymentRecord[] = [];
    try {
      const { fetchAllPaymentsSupabase } = await import('./supabase');
      all = await fetchAllPaymentsSupabase();
    } catch (e) {
      console.warn('Failed to fetch payments from Supabase, falling back to local DB:', e);
      try {
        all = await paymentDb.getAllPayments();
      } catch (err) {}
    }

    const cleanRef = reference.trim().toUpperCase();

    // 2. Find matching reference in database
    const match = all.find(p => 
      p.transactionReference?.toUpperCase() === cleanRef && 
      !p.used
    );

    const store = useTemplateStore.getState();
    const tokenPrice = store.adminSettings?.tokenPriceTsh || 2000;
    const computedTokens = Math.max(1, Math.floor(amountInput / tokenPrice));

    if (match) {
      // Found pre-synced transaction! Instant auto-confirm
      // Determine token grant based on match amount or user-claimed amount
      const finalAmount = match.amount || amountInput;
      const tokens = Math.max(1, Math.floor(finalAmount / tokenPrice));

      store.addUsagesToPasskey(passkeyId, tokens, `${tokens} Tokens Recharged (Ref: ${cleanRef})`);

      // Update payment record status
      match.status = 'verified';
      match.used = true;
      match.verificationType = 'auto';
      match.verifiedAt = new Date().toISOString();
      match.verifiedBy = 'auto';
      match.tokensGranted = tokens;
      match.passkeyId = passkeyId;

      try {
        await paymentDb.updatePayment(match);
      } catch (e) {}

      await this.logAction(match.id, 'auto_confirm', `Auto-confirmed via reference matching for passkey ${passkeyId}. Granted ${tokens} tokens.`);

      // Sync updated verification to Supabase!
      try {
        const { syncPaymentRecordSupabase } = await import('./supabase');
        await syncPaymentRecordSupabase(match);
      } catch (e) {}

      return { success: true, message: `Successfully verified! ${tokens} tokens have been added to your account.`, status: 'verified' };
    }

    // 3. If no pre-synced SMS transaction matches, create a REAL user payment submission in Supabase
    // This allows the admin on the other side of the BIGsta app to instantly review and approve it!
    const newClaimId = 'claim_' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const activeUser = store.activePasskeys.find(p => p.id === passkeyId);

    const newClaim: PaymentRecord = {
      id: newClaimId,
      rawSms: '',
      sender: activeUser?.key || 'User Claim',
      receivedAt: new Date().toISOString(),
      deviceName: 'BIGsta Manual Entry',
      status: 'pending',
      used: false,
      transactionReference: cleanRef,
      senderName: activeUser?.description || activeUser?.key || 'User Claim',
      senderPhone: activeUser?.key || '',
      amount: amountInput,
      tokensGranted: computedTokens,
      passkeyId: passkeyId,
    };

    try {
      // Save local DB
      await paymentDb.addPayment(newClaim);
    } catch (e) {}

    // Push to Supabase user_payments table so the Admin Panel on the other side sees it!
    try {
      const { syncPaymentRecordSupabase } = await import('./supabase');
      await syncPaymentRecordSupabase(newClaim);
    } catch (e) {
      console.warn('Failed to publish manual claim to Supabase:', e);
    }

    await this.logAction(newClaimId, 'claim_submitted', `User submitted payment claim for Ref: ${cleanRef}, Amount: Tsh ${amountInput}. Awaiting Admin confirmation.`);

    return { 
      success: true, 
      message: `No pre-recorded SMS matches code ${cleanRef} yet. We have submitted your payment details (TSh ${amountInput.toLocaleString()}) to our Admin Panel. The admin will verify and grant your tokens shortly!`, 
      status: 'submitted' 
    };
  }

  async verifyPaymentManually(paymentId: string, adminId: string, tokens?: number, passkeyId?: string): Promise<void> {
    const payment = await paymentDb.getPayment(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.used) throw new Error('Payment already used');

    payment.status = 'verified';
    payment.verificationType = 'manual';
    payment.verifiedAt = new Date().toISOString();
    payment.verifiedBy = adminId;
    
    // Grant tokens if passkeyId is linked
    const targetPasskeyId = passkeyId || payment.passkeyId;
    if (targetPasskeyId && tokens && tokens > 0) {
      payment.tokensGranted = tokens;
      const store = useTemplateStore.getState();
      store.addUsagesToPasskey(targetPasskeyId, tokens, `Manual Admin Activation: ${tokens} tokens`);
    }

    await paymentDb.updatePayment(payment);
    await this.logAction(paymentId, 'verified_manual', `Payment verified manually by ${adminId}${targetPasskeyId ? ` for passkey ${targetPasskeyId}` : ''}`, adminId);

    // Sync manually verified status to Supabase
    try {
      const { syncPaymentRecordSupabase } = await import('./supabase');
      await syncPaymentRecordSupabase(payment);
    } catch (e) {}
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string): Promise<void> {
    const payment = await paymentDb.getPayment(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = 'rejected';
    payment.verificationType = 'manual';
    await paymentDb.updatePayment(payment);
    await this.logAction(paymentId, 'rejected', `Payment rejected by ${adminId}: ${reason}`, adminId);

    // Sync rejected status to Supabase
    try {
      const { syncPaymentRecordSupabase } = await import('./supabase');
      await syncPaymentRecordSupabase(payment);
    } catch (e) {}
  }

  async suspendPayment(paymentId: string, adminId: string): Promise<void> {
    const payment = await paymentDb.getPayment(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = 'suspended';
    await paymentDb.updatePayment(payment);
    await this.logAction(paymentId, 'suspended', `Payment suspended by ${adminId}`, adminId);
  }

  async resetPaymentStatus(paymentId: string, adminId: string): Promise<void> {
    const payment = await paymentDb.getPayment(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = 'pending';
    payment.used = false;
    payment.verificationType = undefined;
    await paymentDb.updatePayment(payment);
    await this.logAction(paymentId, 'reset', `Payment status reset to pending by ${adminId}`, adminId);
  }

  async updatePaymentRecord(paymentId: string, updates: Partial<PaymentRecord>, adminId: string): Promise<void> {
    const payment = await paymentDb.getPayment(paymentId);
    if (!payment) throw new Error('Payment not found');

    const updatedPayment = { ...payment, ...updates };
    await paymentDb.updatePayment(updatedPayment);
    await this.logAction(paymentId, 'admin_edit', `Payment record edited by ${adminId}. Changes: ${Object.keys(updates).join(', ')}`, adminId);
  }

  async reactivatePayment(paymentId: string, adminId: string): Promise<void> {
    const payment = await paymentDb.getPayment(paymentId);
    if (!payment) throw new Error('Payment not found');

    payment.status = 'verified';
    payment.used = false; // Allow it to be used again if it was exhausted or restricted
    await paymentDb.updatePayment(payment);
    await this.logAction(paymentId, 'reactivated', `Payment reactivated by ${adminId}`, adminId);
  }

  async logAction(paymentId: string, action: string, details: string, adminId?: string): Promise<void> {
    const log: VerificationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentId,
      timestamp: new Date().toISOString(),
      action,
      details,
      adminId,
    };
    await paymentDb.addLog(log);
  }

  async getAllPayments(): Promise<PaymentRecord[]> {
    return paymentDb.getAllPayments();
  }

  async getPaymentRecords(): Promise<PaymentRecord[]> {
    return this.getAllPayments();
  }

  async getWebhookLogs(): Promise<any[]> {
    return paymentDb.getAllWebhookLogs();
  }

  async getPaymentsByStatus(status: PaymentStatus): Promise<PaymentRecord[]> {
    return paymentDb.getPaymentsByStatus(status);
  }

  async getLogs(paymentId: string): Promise<VerificationLog[]> {
    return paymentDb.getLogs(paymentId);
  }

  async getVerificationLogs(): Promise<VerificationLog[]> {
    return paymentDb.getAllLogs();
  }

  async isReferenceDuplicate(reference: string): Promise<boolean> {
    const all = await paymentDb.getAllPayments();
    return all.some(p => p.transactionReference?.toUpperCase() === reference.toUpperCase());
  }

  async getStats() {
    const all = await this.getAllPayments();
    const stats = {
      total: all.length,
      pending: all.filter(p => p.status === 'pending').length,
      verified: all.filter(p => p.status === 'verified').length,
      rejected: all.filter(p => p.status === 'rejected').length,
      used: all.filter(p => p.used).length,
      totalAmount: all.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0),
      networkBreakdown: {} as Record<string, number>,
    };

    all.forEach(p => {
      if (p.network) {
        stats.networkBreakdown[p.network] = (stats.networkBreakdown[p.network] || 0) + 1;
      }
    });

    return stats;
  }

  async getPaymentSettings(): Promise<any> {
    const saved = localStorage.getItem('payment_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fetch current status from server or local state
      try {
        const response = await fetch('/api/admin/webhook-debug');
        const debugData = await response.json();
        return {
          ...parsed,
          connectionStatus: debugData.status || 'OFFLINE',
          lastSmsReceived: debugData.lastSmsReceived || '',
          lastSmsTime: debugData.lastSmsTime || '',
        };
      } catch (e) {
        return parsed;
      }
    }
    
    const defaultSettings = {
      webhookSecret: '',
      autoVerification: true,
      connectionStatus: 'OFFLINE',
      lastSmsReceived: '',
      lastSmsTime: '',
      webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/payment-sms` : ''
    };
    return defaultSettings;
  }

  async saveWebhookSettings(settings: any): Promise<void> {
    localStorage.setItem('payment_settings', JSON.stringify(settings));
    // Also sync to server if needed
    try {
      await fetch('/api/admin/webhook-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (e) {
      console.error('Failed to sync settings to server');
    }
  }

  async updatePaymentSettings(settings: any): Promise<void> {
    localStorage.setItem('payment_settings', JSON.stringify(settings));
  }
}

export const paymentService = new PaymentService();
