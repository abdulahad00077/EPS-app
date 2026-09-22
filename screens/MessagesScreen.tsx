import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStudent } from '../hooks/useStudent';
import { useAuth } from '../hooks/useAuth';
import { getStudentMessages, sendMessage } from '../services/messages';
import { supabase } from '../services/supabase';
import { Message } from '../types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';
import { useRealtimeData } from '../hooks/useRealtimeData';

const MessageItem = ({ msg, isMe, cardColor, altTextColor, subtextColor, styles }: any) => {
  const transMessage = useTransliteration(msg.message_text);

  return (
    <View 
      style={[
        styles.messageWrapper,
        isMe ? styles.messageWrapperMe : styles.messageWrapperThem
      ]}
    >
      {!isMe && (
        <View style={styles.avatarMini}>
          <Text style={styles.avatarTextMini}>T</Text>
        </View>
      )}
      <View style={[
        styles.messageBubble,
        isMe ? styles.messageBubbleMe : [styles.messageBubbleThem, { backgroundColor: cardColor, borderColor: '#F1F5F9' }] // hardcoded border for now to avoid passing too many props
      ]}>
        <Text style={[
          styles.messageText,
          isMe ? styles.messageTextMe : [styles.messageTextThem, { color: altTextColor }]
        ]}>
          {transMessage}
        </Text>
        <Text style={[
          styles.messageTime,
          isMe ? styles.messageTimeMe : [styles.messageTimeThem, { color: subtextColor }]
        ]}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MessagesScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const { user } = useAuth();
  
  const { data: allMessages, loading } = useRealtimeData<Message>('messages', selectedStudent?.school_id);

  const { isDark } = useTheme();
  const { t } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const altTextColor = isDark ? '#FFFFFF' : '#334155';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  // Filter messages specifically for the selected student
  const messages = allMessages
    .filter(m => m.recipient_id === selectedStudent?.id || (m as any).student_id === selectedStudent?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Premium Chat Header */}
      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={[styles.headerTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={[styles.headerContent, { flexDirection: 'row', alignItems: 'center' }]}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.1)' }} 
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View style={styles.profileSection}>
                <View style={styles.avatarBg}>
                  <MaterialCommunityIcons name="school" size={24} color="white" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.teacherName, { color: textColor }]}>{t('classTeacher')}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.onlineDot} />
                    <Text style={[styles.statusText, { color: subtextColor }]}>{t('respondsFast')}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              
              <TouchableOpacity
                style={[styles.menuButton, { marginLeft: 15 }]}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Feather name="menu" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={[styles.chatArea, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]} 
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#F0F9FF' }]}>
                <Feather name="send" size={32} color="#0284C7" />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>{t('teacherMessages')}</Text>
              <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('noMessagesYet')}</Text>
            </View>
          </View>
        ) : (
          messages.slice().reverse().map((msg: any) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    cardColor={cardColor}
                    altTextColor={altTextColor}
                    subtextColor={subtextColor}
                    styles={styles}
                  />
                );
              })
        )}
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#64748B',
    fontWeight: '700',
  },
  headerWrapper: {
    zIndex: 10,
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
  },
  menuButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBg: {
    backgroundColor: '#0284C7',
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInfo: {
    marginLeft: 15,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreButton: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatContent: {
    paddingHorizontal: 25,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 35,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
    width: '100%',
  },
  emptyIconBg: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  messageWrapper: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageWrapperThem: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  avatarTextMini: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0284C7',
  },
  messageBubble: {
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  messageBubbleMe: {
    backgroundColor: '#0284C7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextThem: {
    color: '#334155',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 6,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  messageTimeThem: {
    color: '#94A3B8',
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
});

export default MessagesScreen;
