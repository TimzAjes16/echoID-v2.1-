import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Consent } from '../state/useStore';
import { deriveChatKey, encryptBytes, decryptBytes } from '../lib/crypto';
import { useStore } from '../state/useStore';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  encrypted: boolean;
}

interface ChatProps {
  consent: Consent;
}

const db = SQLite.openDatabase('echoid_chat.db');

export default function Chat({ consent }: ChatProps) {
  const { wallet, deviceKeypair } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionKey, setSessionKey] = useState<Uint8Array | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initDatabase();
    loadMessages();
    initSession();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  function initDatabase() {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          consent_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          encrypted_data TEXT NOT NULL,
          nonce TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        )`
      );
    });
  }

  async function initSession() {
    if (!deviceKeypair || !wallet.address) return;

    // In a real implementation, you would exchange pubkeys with counterparty
    // For MVP, we'll use a placeholder counterparty pubkey
    const counterpartyPubKey = new Uint8Array(32); // Placeholder
    const key = deriveChatKey(
      deviceKeypair.publicKey,
      counterpartyPubKey,
      consent.id
    );
    setSessionKey(key);
  }

  async function loadMessages() {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM messages WHERE consent_id = ? ORDER BY timestamp ASC',
        [consent.id],
        (_, { rows }) => {
          const loadedMessages: Message[] = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            // Decrypt message
            if (sessionKey) {
              try {
                const encryptedData = Uint8Array.from(JSON.parse(row.encrypted_data));
                const nonce = Uint8Array.from(JSON.parse(row.nonce));
                const decrypted = decryptBytes(encryptedData, sessionKey, nonce);
                const text = new TextDecoder().decode(decrypted);
                loadedMessages.push({
                  id: row.id,
                  sender: row.sender,
                  text,
                  timestamp: row.timestamp,
                  encrypted: true,
                });
              } catch (error) {
                console.error('Failed to decrypt message:', error);
              }
            }
          }
          setMessages(loadedMessages);
        }
      );
    });
  }

  async function sendMessage() {
    if (!inputText.trim() || !sessionKey || !wallet.address) return;

    const messageId = `${Date.now()}-${Math.random()}`;
    const textBytes = new TextEncoder().encode(inputText);
    const { ciphertext, nonce } = encryptBytes(textBytes, sessionKey);

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO messages (id, consent_id, sender, encrypted_data, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [
          messageId,
          consent.id,
          wallet.address,
          JSON.stringify(Array.from(ciphertext)),
          JSON.stringify(Array.from(nonce)),
          Date.now(),
        ],
        () => {
          const newMessage: Message = {
            id: messageId,
            sender: wallet.address!,
            text: inputText,
            timestamp: Date.now(),
            encrypted: true,
          };
          setMessages((prev) => [...prev, newMessage]);
          setInputText('');
        }
      );
    });
  }

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.sender === wallet.address;
    
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

