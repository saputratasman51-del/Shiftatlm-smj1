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
  }
};
