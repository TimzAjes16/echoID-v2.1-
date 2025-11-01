import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Modal,
  useColorScheme,
  Alert
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Consent } from '../state/useStore';
import { deriveChatKey, encryptBytes, decryptBytes } from '../lib/crypto';
import { useStore } from '../state/useStore';
import { resolveHandle } from '../lib/handles';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../lib/theme';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

const emojiData = ['😀', '😂', '😍', '🥰', '😘', '😗', '😙', '😚', '☺️', '🙂', '🙃', '😉', '😊', '😋', '😎', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙁', '☹️', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '💪', '✍️', '🙏', '💍', '💄', '💋', '👄', '👅', '👂', '👃', '👍', '👎', '👏', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👊', '✊', '👋', '🤚', '🤝', '🙌', '👐', '👈', '👉', '👆', '👇'];

dayjs.extend(relativeTime);

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  encrypted: boolean;
}

interface ChatScreenProps {
  consent: Consent;
  visible: boolean;
  onClose: () => void;
}

export default function ChatScreen({ consent, visible, onClose }: ChatScreenProps) {
  const { wallet, deviceKeypair, profile, themeMode } = useStore();
  const systemColorScheme = useColorScheme();
  const colors = getThemeColors(themeMode, systemColorScheme);
  const styles = createStyles(colors);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionKey, setSessionKey] = useState<Uint8Array | null>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setupChat();
    }
  }, [visible, consent]);

  useEffect(() => {
    if (db && sessionKey) {
      loadMessages(db);
      setIsLoading(false);
    }
  }, [db, sessionKey]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  async function setupChat() {
    setIsLoading(true);
    try {
      const database = await SQLite.openDatabaseAsync('echoid_chat.db');
      setDb(database);
      await initDatabase(database);
      await initSession();
    } catch (error) {
      console.error('Failed to setup chat:', error);
      setIsLoading(false);
    }
  }

  async function initDatabase(database: SQLite.SQLiteDatabase) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        consent_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        encrypted_data TEXT NOT NULL,
        nonce TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_consent_timestamp ON messages(consent_id, timestamp);
    `);
  }

  async function initSession() {
    if (!deviceKeypair || !wallet.address) {
      setIsLoading(false);
      return;
    }

    try {
      // Get counterparty device pubkey from handle
      let counterpartyPubKey: Uint8Array | null = null;
      
      if (consent.counterpartyHandle) {
        const mapping = await resolveHandle(consent.counterpartyHandle);
        if (mapping?.devicePubKey) {
          // Decode base64 devicePubKey to Uint8Array
          const binaryString = atob(mapping.devicePubKey);
          counterpartyPubKey = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            counterpartyPubKey[i] = binaryString.charCodeAt(i);
          }
        }
      }

      // Fallback: Generate deterministic pubkey from counterparty address for mock mode
      if (!counterpartyPubKey || counterpartyPubKey.length === 0) {
        console.warn('[Chat] Using mock counterparty pubkey');
        // Use a deterministic derivation from counterparty address
        const addressBytes = new TextEncoder().encode(consent.counterparty);
        const combined = new Uint8Array([
          ...addressBytes,
          ...new TextEncoder().encode(consent.consentId.toString()),
        ]);
        const hash = new Uint8Array(32);
        for (let i = 0; i < Math.min(combined.length, 32); i++) {
          hash[i] = combined[i % combined.length];
        }
        counterpartyPubKey = hash;
      }

      const key = deriveChatKey(
        deviceKeypair.publicKey,
        counterpartyPubKey,
        consent.id
      );
      setSessionKey(key);
      console.log('[Chat] Session key derived successfully');
    } catch (error) {
      console.error('[Chat] Failed to init session:', error);
      setIsLoading(false);
    }
  }

  async function loadMessages(database: SQLite.SQLiteDatabase) {
    if (!database || !sessionKey) return;
    
    try {
      const result = await database.getAllAsync(
        'SELECT * FROM messages WHERE consent_id = ? ORDER BY timestamp ASC',
        [consent.id]
      );
      
      const loadedMessages: Message[] = [];
      for (const row of result as any[]) {
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
          console.error('[Chat] Failed to decrypt message:', error);
        }
      }
      setMessages(loadedMessages);
    } catch (error) {
      console.error('[Chat] Failed to load messages:', error);
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || !sessionKey || !wallet.address || !db) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const textBytes = new TextEncoder().encode(textToSend);
      const { ciphertext, nonce } = encryptBytes(textBytes, sessionKey);

      await db.runAsync(
        'INSERT INTO messages (id, consent_id, sender, encrypted_data, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [
          messageId,
          consent.id,
          wallet.address,
          JSON.stringify(Array.from(ciphertext)),
          JSON.stringify(Array.from(nonce)),
          Date.now(),
        ]
      );

      const newMessage: Message = {
        id: messageId,
        sender: wallet.address,
        text: textToSend,
        timestamp: Date.now(),
        encrypted: true,
      };
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      setInputText(textToSend); // Restore text on error
    }
  }

  function formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return dayjs(timestamp).format('h:mm A');
    return dayjs(timestamp).format('MMM D, h:mm A');
  }

  function insertEmoji(emoji: string) {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  function handleMenuPress() {
    setShowMenu(true);
  }

  function handleRequestPayment() {
    setShowMenu(false);
    setShowPaymentModal(true);
  }

  async function sendPaymentRequest() {
    if (!paymentAmount.trim()) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    try {
      // Send payment request as a special encrypted message
      const paymentMessage = `💸 Payment Request: ${amount} ETH\n\nRequest ID: ${Date.now()}`;
      
      if (!sessionKey || !wallet.address || !db) {
        Alert.alert('Error', 'Chat not initialized');
        return;
      }

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const textBytes = new TextEncoder().encode(paymentMessage);
      const { ciphertext, nonce } = encryptBytes(textBytes, sessionKey);

      await db.runAsync(
        'INSERT INTO messages (id, consent_id, sender, encrypted_data, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [
          messageId,
          consent.id,
          wallet.address,
          JSON.stringify(Array.from(ciphertext)),
          JSON.stringify(Array.from(nonce)),
          Date.now(),
        ]
      );

      const newMessage: Message = {
        id: messageId,
        sender: wallet.address,
        text: paymentMessage,
        timestamp: Date.now(),
        encrypted: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      
      const amountStr = paymentAmount;
      setPaymentAmount('');
      setShowPaymentModal(false);
      Alert.alert('Payment Request Sent', `${amountStr} ETH payment request sent to ${counterpartyName}`);
    } catch (error) {
      console.error('[Chat] Failed to send payment request:', error);
      Alert.alert('Error', 'Failed to send payment request');
    }
  }

  function handleViewConsentDetails() {
    setShowMenu(false);
    onClose();
  }

  function handleClearChat() {
    setShowMenu(false);
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to delete all messages in this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!db) return;
              await db.runAsync('DELETE FROM messages WHERE consent_id = ?', [consent.id]);
              setMessages([]);
              Alert.alert('Chat Cleared', 'All messages have been deleted');
            } catch (error) {
              console.error('[Chat] Failed to clear chat:', error);
              Alert.alert('Error', 'Failed to clear chat');
            }
          }
        }
      ]
    );
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMe = item.sender === wallet.address;
    const showAvatar = index === 0 || messages[index - 1].sender !== item.sender;
    const showDate = index === 0 || 
      (item.timestamp - messages[index - 1].timestamp) > 300000; // 5 minutes

    return (
      <View key={item.id}>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{dayjs(item.timestamp).format('MMMM D, YYYY')}</Text>
          </View>
        )}
        <View style={[
          styles.messageRow,
          isMe ? styles.myMessageRow : styles.theirMessageRow
        ]}>
          {!isMe && showAvatar && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {consent.counterpartyHandle?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.theirBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.text}
            </Text>
            <Text style={[
              styles.messageTime,
              isMe ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          {isMe && showAvatar && (
            <View style={[styles.avatar, styles.myAvatar]}>
              <Text style={styles.avatarText}>
                {profile?.handle?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  const counterpartyName = consent.counterpartyHandle 
    ? `@${consent.counterpartyHandle}`
    : `${consent.counterparty.slice(0, 6)}...${consent.counterparty.slice(-4)}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {counterpartyName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              End-to-end encrypted
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={handleMenuPress}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showMenu && (
          <View style={[styles.menuOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
            <TouchableOpacity
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            >
              <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleRequestPayment}
                >
                  <Ionicons name="wallet" size={20} color={colors.primary} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Request Payment</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleViewConsentDetails}
                >
                  <Ionicons name="document-text" size={20} color={colors.textSecondary} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>View Consent Details</Text>
                </TouchableOpacity>
                
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleClearChat}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.menuItemText, { color: colors.error }]}>Clear Chat</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Request Modal */}
        {showPaymentModal && (
          <View style={[styles.menuOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
            <TouchableOpacity
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={() => setShowPaymentModal(false)}
            >
              <View style={[styles.paymentModal, { backgroundColor: colors.surface }]}>
                <View style={styles.paymentHeader}>
                  <Text style={[styles.paymentTitle, { color: colors.text }]}>Request Payment</Text>
                  <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.paymentBody}>
                  <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                    Request ETH from {counterpartyName}
                  </Text>
                  
                  <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.amountInputText, { color: colors.text }]}
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <Text style={[styles.amountUnit, { color: colors.textSecondary }]}>ETH</Text>
                  </View>
                  
                  <Text style={[styles.paymentHint, { color: colors.textSecondary }]}>
                    The recipient will be notified and can approve the payment
                  </Text>
                </View>
                
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: colors.border }]}
                    onPress={() => setShowPaymentModal(false)}
                  >
                    <Text style={[styles.paymentButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: colors.primary }]}
                    onPress={sendPaymentRequest}
                    disabled={!paymentAmount.trim()}
                  >
                    <Text style={[styles.paymentButtonText, styles.paymentButtonPrimary]}>Request Payment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Setting up encrypted chat...
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              inverted={false}
              showsVerticalScrollIndicator={false}
            />

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <View style={[styles.emojiPicker, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <FlatList
                  data={emojiData}
                  numColumns={8}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.emojiItem}
                      onPress={() => insertEmoji(item)}
                    >
                      <Text style={styles.emojiText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  style={styles.emojiList}
                  contentContainerStyle={styles.emojiListContent}
                />
              </View>
            )}

            {/* Input Area */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.emojiButton}
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Text style={styles.emojiButtonText}>😊</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={1000}
                />
                <View style={styles.inputActions}>
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                    disabled={!inputText.trim()}
                  >
                    <Ionicons 
                      name="send" 
                      size={24} 
                      color={inputText.trim() ? colors.primary : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      paddingTop: Platform.OS === 'ios' ? 50 : 12,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    headerSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    moreButton: {
      padding: 8,
    },
    keyboardView: {
      flex: 1,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
    },
    dateSeparator: {
      alignItems: 'center',
      marginVertical: 16,
    },
    dateText: {
      fontSize: 12,
      color: colors.textSecondary,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    messageRow: {
      flexDirection: 'row',
      marginBottom: 4,
      alignItems: 'flex-end',
    },
    myMessageRow: {
      justifyContent: 'flex-end',
    },
    theirMessageRow: {
      justifyContent: 'flex-start',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
    },
    myAvatar: {
      backgroundColor: colors.success,
    },
    avatarText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    messageBubble: {
      maxWidth: '75%',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    myBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    theirBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
      marginBottom: 4,
    },
    myMessageText: {
      color: '#fff',
    },
    theirMessageText: {
      color: colors.text,
    },
    messageTime: {
      fontSize: 11,
      alignSelf: 'flex-end',
    },
    myMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    theirMessageTime: {
      color: colors.textSecondary,
    },
    inputContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? 32 : 12,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    emojiPicker: {
      maxHeight: 200,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    emojiList: {
      maxHeight: 200,
    },
    emojiListContent: {
      padding: 8,
    },
    emojiItem: {
      width: '12.5%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiText: {
      fontSize: 24,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 44,
    },
    emojiButton: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    emojiButtonText: {
      fontSize: 24,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingHorizontal: 8,
      paddingVertical: 8,
      minHeight: 36,
      maxHeight: 100,
      borderRadius: 12,
    },
    inputActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    sendButton: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    menuBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    menuContainer: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === 'ios' ? 20 : 16,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuItemText: {
      fontSize: 16,
      marginLeft: 12,
    },
    menuDivider: {
      height: 1,
      marginVertical: 4,
    },
    paymentModal: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === 'ios' ? 32 : 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
      maxHeight: '70%',
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    paymentTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    paymentBody: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    paymentLabel: {
      fontSize: 14,
      marginBottom: 12,
    },
    amountInput: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 8,
    },
    amountInputText: {
      flex: 1,
      fontSize: 24,
      fontWeight: '600',
    },
    amountUnit: {
      fontSize: 16,
      marginLeft: 8,
    },
    paymentHint: {
      fontSize: 12,
      fontStyle: 'italic',
    },
    paymentActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 12,
    },
    paymentButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    paymentButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    paymentButtonPrimary: {
      color: '#fff',
    },
  });
}

