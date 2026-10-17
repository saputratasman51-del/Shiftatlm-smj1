/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Pin,
  Bell,
  AlertTriangle,
  Megaphone,
  Paperclip,
  Smile,
  CheckCheck,
  ChevronRight,
  ArrowLeft,
  Users,
  Hash,
  Activity,
  Droplet,
  FlaskConical,
  Eye,
  HeartPulse,
  Wrench,
  Package,
  Plus,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { ChatRoom, ChatMessage, Announcement } from '../types';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';

export default function ChatLab() {
  const { activeProfile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<'rooms' | 'announcements' | 'priority'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState<'text' | 'important' | 'urgent'>('text');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRoomsAndAnnouncements();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom.id);
    }
  }, [activeRoom]);

  const loadRoomsAndAnnouncements = async () => {
    setLoading(true);
    try {
      const [roomList, announcementList] = await Promise.all([
        dataService.getChatRooms(),
        dataService.getAnnouncements(),
      ]);
      setRooms(roomList);
      if (roomList.length > 0 && !activeRoom) {
        setActiveRoom(roomList[0]);
      }
      setAnnouncements(announcementList);
    } catch (e) {
      console.error('Error loading chat rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const msgs = await dataService.getChatMessages(roomId);
      setMessages(msgs);
      scrollToBottom();
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const sent = await dataService.sendChatMessage({
        room_id: activeRoom.id,
        sender_id: activeProfile.id,
        content,
        message_type: messageType,
      });

      if (sent) {
        setMessages((prev) => [...prev, sent]);
        scrollToBottom();
        setMessageType('text');
      }
    } catch (e) {
      showToast('Gagal Mengirim', 'Pesan gagal dikirim, silakan coba lagi.', 'error');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const success = await dataService.addChatReaction(messageId, activeProfile.id, emoji);
    if (success && activeRoom) {
      loadMessages(activeRoom.id);
    }
  };

  const getRoomIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-5 h-5" />;
      case 'Droplet': return <Droplet className="w-5 h-5" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5" />;
      case 'Eye': return <Eye className="w-5 h-5" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5" />;
      case 'Wrench': return <Wrench className="w-5 h-5" />;
      case 'Package': return <Package className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
      {/* Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            💬
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Chat Lab & Koordinasi</h1>
            <p className="text-xs text-slate-500">Komunikasi operasional terstruktur RSUD Sultan Muhammad Jamaludin I</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'rooms' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}
          >
            Ruang Diskusi
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'announcements' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Pengumuman</span>
          </button>
          <button
            onClick={() => setActiveTab('priority')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'priority' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Prioritas</span>
          </button>
        </div>
      </div>

      {/* Main Chat Layout */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Rooms List Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ruang chat atau topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {rooms
                .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.topic.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((room) => {
                  const isActive = activeRoom?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoom(room)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${isActive ? 'bg-teal-50/70 border-l-4 border-teal-600' : 'hover:bg-slate-50'}`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white"
                        style={{ backgroundColor: room.color_code || '#0d9488' }}
                      >
                        {getRoomIcon(room.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-xs font-bold text-slate-900 truncate">{room.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">{room.topic}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{room.description}</p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Active Room Messages Area */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {activeRoom ? (
              <>
                {/* Room Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: activeRoom.color_code || '#0d9488' }}
                    >
                      {getRoomIcon(activeRoom.icon)}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{activeRoom.name}</span>
                        <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-mono">{activeRoom.topic}</span>
                      </h2>
                      <p className="text-[11px] text-slate-500">{activeRoom.description}</p>
                    </div>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">Belum Ada Percakapan</p>
                      <p className="text-xs max-w-xs text-slate-500">Mulai diskusi operasional atau koordinasi shift di ruang {activeRoom.name} ini.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === activeProfile.id;
                      const isUrgent = msg.message_type === 'urgent';
                      const isImportant = msg.message_type === 'important';

                      return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar src={msg.sender?.avatar_url} name={msg.sender?.full_name || 'Petugas'} className="w-8 h-8 rounded-full shrink-0" />
                          <div className={`max-w-md sm:max-w-lg rounded-2xl p-3.5 shadow-xs border ${
                            isUrgent
                              ? 'bg-rose-50 border-rose-300 text-rose-950'
                              : isImportant
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : isMe
                              ? 'bg-teal-600 text-white border-teal-700'
                              : 'bg-white text-slate-800 border-slate-200'
                          }`}>
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <span className={`text-[11px] font-bold ${isMe ? 'text-teal-100' : 'text-slate-900'}`}>
                                {msg.sender?.full_name || 'Petugas ATLM'}
                              </span>
                              <span className={`text-[10px] font-mono ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {isUrgent && (
                              <div className="mb-1.5 inline-flex items-center gap-1 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>URGENT / DARURAT</span>
                              </div>
                            )}

                            {isImportant && (
                              <div className="mb-1.5 inline-flex items-center gap-1 bg-amber-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                                <Pin className="w-3 h-3" />
                                <span>IMPORTANT / PENTING</span>
                              </div>
                            )}

                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                            {/* Quick Reactions Bar */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex items-center gap-1 text-[11px]">
                              <button
                                onClick={() => handleReaction(msg.id, '👍')}
                                className="hover:bg-slate-100/50 px-1.5 py-0.5 rounded-md transition flex items-center gap-1 text-slate-600"
                              >
                                <span>👍</span>
                              </button>
                              <button
                                onClick={() => handleReaction(msg.id, '✅')}
                                className="hover:bg-slate-100/50 px-1.5 py-0.5 rounded-md transition flex items-center gap-1 text-slate-600"
                              >
                                <span>✅</span>
                              </button>
                              <button
                                onClick={() => handleReaction(msg.id, '⚠️')}
                                className="hover:bg-slate-100/50 px-1.5 py-0.5 rounded-md transition flex items-center gap-1 text-slate-600"
                              >
                                <span>⚠️</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                  <select
                    value={messageType}
                    onChange={(e: any) => setMessageType(e.target.value)}
                    className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2.5 font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="text">Pesan Normal</option>
                    <option value="important">📌 Important</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>

                  <input
                    type="text"
                    placeholder={`Ketik pesan di ${activeRoom.name}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Pilih salah satu ruang chat di sebelah kiri.</div>
            )}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengumuman Resmi Laboratorium</h2>
              <p className="text-xs text-slate-500">Informasi penting dari kepala instalasi & koordinator shift</p>
            </div>
            {isAdmin && (
              <button
                onClick={async () => {
                  const title = prompt('Judul Pengumuman:');
                  const content = prompt('Isi Pengumuman:');
                  if (title && content) {
                    await dataService.saveAnnouncement({ title, content, priority: 'important', created_by: activeProfile.id });
                    loadRoomsAndAnnouncements();
                    showToast('Berhasil', 'Pengumuman baru berhasil diterbitkan');
                  }
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum Ada Pengumuman</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-gradient-to-r from-teal-50/50 to-white rounded-2xl p-4 border border-teal-200/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-[10px] text-slate-400 pt-1">Diterbitkan oleh: <strong className="text-slate-700">{ann.creator?.full_name || 'Admin'}</strong></p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Priority Tab */}
      {activeTab === 'priority' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 overflow-y-auto space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Pesan & Informasi Prioritas (Important / Urgent)</h2>
            <p className="text-xs text-slate-500">Daftar pesan operasional yang memerlukan perhatian khusus atau tindakan segera</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Peringatan Operasional Cito</p>
              <p className="mt-0.5 text-rose-700">Setiap pesan bertanda Urgent atau Important di ruang diskusi mana pun otomatis masuk ke dalam daftar prioritas ini agar tidak ada kendala alat atau reagen yang terlewat.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
