/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataService, getPontianakDateString } from './dataService';

export const pushNotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  },

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  async showShiftNotification(title: string, body: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'shift-reminder',
          vibrate: [200, 100, 200, 100, 200],
          data: { url: window.location.origin }
        } as any);
      } else {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png'
        });
      }
    } catch (e) {
      console.warn('Error showing push notification:', e);
    }
  },

  async checkAndTriggerShiftAlert(profileId: string) {
    if (!profileId || Notification.permission !== 'granted') return;
    
    try {
      const todayStr = getPontianakDateString();
      const assignments = await dataService.getAssignments({ date: todayStr });
      const mine = assignments.find(
        (a) => a.profile_id === profileId && a.status !== 'cancelled'
      );

      if (mine && mine.shift) {
        const shiftName = mine.shift.name;
        const startTime = mine.shift.start_time.slice(0, 5);
        const endTime = mine.shift.end_time.slice(0, 5);

        const notifKey = `shift_pushed_${profileId}_${todayStr}`;
        if (!localStorage.getItem(notifKey)) {
          await this.showShiftNotification(
            `⏰ Peringatan Jadwal Shift: ${shiftName}`,
            `Hari ini (${todayStr}) Anda bertugas pukul ${startTime} - ${endTime} WIB. Siapkan diri dan serah terima!`
          );
          localStorage.setItem(notifKey, 'true');
        }
      }
    } catch (e) {
      console.warn('Check shift alert error:', e);
    }
  },

  /**
   * Notifikasi Broadcast ke Seluruh Petugas saat pertukaran shift disetujui
   */
  async notifySwapApproved(swap: any) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const requesterName = swap.requester?.full_name || 'Petugas ATLM';
      const targetName = swap.target_profile?.full_name || 'Rekan ATLM';
      const shiftName = swap.shift?.name || 'Shift Jaga';
      const dateStr = swap.shift_date;

      await this.showShiftNotification(
        `🔄 Info Tukar Shift Disetujui (Seluruh Petugas)`,
        `Pemberitahuan: ${requesterName} bertukar shift dengan ${targetName} pada tanggal ${dateStr} (${shiftName}). Jadwal telah disesuaikan.`
      );
    } catch (e) {
      console.warn('Error sending swap approved push:', e);
    }
  },

  /**
   * Notifikasi Pengingat Pertukaran Shift sampai Hari H Pertukaran
   */
  async checkAndTriggerSwapReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const todayStr = getPontianakDateString();
      const swaps = await dataService.getShiftSwaps();
      const approvedSwaps = swaps.filter((s) => s.status === 'approved' && s.shift_date >= todayStr);

      for (const s of approvedSwaps) {
        const targetDate = s.shift_date;
        const todayDate = new Date(todayStr);
        const swapDate = new Date(targetDate);
        const diffDays = Math.ceil((swapDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        const notifKey = `swap_remind_${s.id}_${todayStr}_h${diffDays}`;
        if (localStorage.getItem(notifKey)) continue;

        const reqName = s.requester?.full_name || 'Petugas';
        const targetName = s.target_profile?.full_name || 'Rekan';
        const shiftName = s.shift?.name || 'Shift Jaga';

        let title = '';
        let body = '';

        if (diffDays === 0) {
          title = `🔥 HARI H: Pengingat Tukar Shift Hari Ini!`;
          body = `Hari ini (${targetDate}), ${targetName} menggantikan ${reqName} pada ${shiftName}. Mohon perhatikan serah terima tugas.`;
        } else if (diffDays === 1) {
          title = `⏰ H-1: Pengingat Tukar Shift Besok!`;
          body = `Besok (${targetDate}), ${targetName} menggantikan ${reqName} pada ${shiftName}. Harap bersiap.`;
        } else if (diffDays <= 7) {
          title = `📅 H-${diffDays}: Pengingat Tukar Shift Mendatang`;
          body = `Pengingat H-${diffDays} (${targetDate}): ${targetName} menggantikan ${reqName} pada ${shiftName}.`;
        }

        if (title && body) {
          await this.showShiftNotification(title, body);
          localStorage.setItem(notifKey, 'true');
        }
      }
    } catch (e) {
      console.warn('Error checking swap reminders:', e);
    }
  }
};
