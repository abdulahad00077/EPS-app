import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface CustomDropdownProps {
  label: string;
  data: string[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomDropdown({ label, data, selectedValue, onSelect, placeholder = 'Select...', disabled = false }: CustomDropdownProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TouchableOpacity 
        style={[
          styles.dropdownButton, 
          { backgroundColor: colors.surface, borderColor: colors.border },
          disabled && { opacity: 0.5 }
        ]} 
        onPress={() => !disabled && setModalVisible(true)}
      >
        <Text style={[styles.dropdownText, { color: selectedValue ? colors.text : colors.textSecondary }]}>
          {selectedValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select {label}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={[null, ...data]}
                  keyExtractor={(item, index) => item ? item : `all-${index}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.modalItem, 
                        { borderBottomColor: colors.border },
                        selectedValue === item && { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }
                      ]}
                      onPress={() => {
                        onSelect(item);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.itemText, 
                        { color: colors.text },
                        selectedValue === item && { color: colors.primary, fontWeight: 'bold' }
                      ]}>
                        {item ? item : 'All'}
                      </Text>
                      {selectedValue === item && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
  }
});
