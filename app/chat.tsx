import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { socket } from '../src/api/client';
import { globalStore } from '../src/store';

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([
    { id: '0', text: 'Halo! Ada yang bisa kami bantu?', isAdmin: true, timestamp: new Date().toISOString() }
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Hubungkan socket saat masuk ke halaman ini
    socket.connect();

    // Dengarkan balasan dari admin
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receive_message');
      socket.disconnect(); // Putuskan koneksi saat keluar untuk menghemat memori
    };
  }, []);

  const quickReplies = [
    "Saya ingin membatalkan pesanan (Refund)",
    "Berapa lama proses refund?",
    "Bagaimana cara reschedule pesanan?"
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      userId: globalStore.userId,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      isAdmin: false
    };

    // Tambahkan ke UI lokal langsung
    setMessages((prev) => [...prev, newMessage]);
    
    // Kirim ke server
    socket.emit('send_message', newMessage);
    
    setInputText('');
    Keyboard.dismiss();
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Customer Service</Text>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea} 
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.bubbleWrapper, msg.isAdmin ? styles.bubbleAdminWrapper : styles.bubbleUserWrapper]}>
              <View style={[styles.bubble, msg.isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
                <Text style={[styles.msgText, msg.isAdmin ? styles.msgTextAdmin : styles.msgTextUser]}>{msg.text}</Text>
                <Text style={[styles.timeText, msg.isAdmin ? styles.timeTextAdmin : styles.timeTextUser]}>{formatTime(msg.timestamp)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplyContainer} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 10 }}>
            {quickReplies.map((reply, idx) => (
              <TouchableOpacity key={idx} style={styles.quickReplyBtn} onPress={() => setInputText(reply)}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, inputText.trim().length > 0 && styles.sendBtnActive]} 
              onPress={handleSend}
              disabled={inputText.trim().length === 0}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fbfc' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 5 },
  quickReplyContainer: {
    marginBottom: 10,
    marginHorizontal: -15,
  },
  quickReplyBtn: {
    backgroundColor: '#e8f4f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d0e8e3',
  },
  quickReplyText: {
    color: '#43a08d',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50', marginRight: 5 },
  onlineText: { fontSize: 12, color: '#4caf50', fontWeight: '600' },
  
  chatArea: { flex: 1 },
  bubbleWrapper: { marginBottom: 15, maxWidth: '80%' },
  bubbleAdminWrapper: { alignSelf: 'flex-start' },
  bubbleUserWrapper: { alignSelf: 'flex-end' },
  bubble: {
    padding: 15,
    borderRadius: 20,
  },
  bubbleAdmin: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  bubbleUser: {
    backgroundColor: '#43a08d',
    borderBottomRightRadius: 5,
  },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextAdmin: { color: '#333' },
  msgTextUser: { color: '#fff' },
  timeText: { fontSize: 11, marginTop: 5, alignSelf: 'flex-end' },
  timeTextAdmin: { color: '#aaa' },
  timeTextUser: { color: '#e8f4f1' },

  inputArea: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 5,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
    color: '#111'
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnActive: {
    backgroundColor: '#43a08d',
  }
});
