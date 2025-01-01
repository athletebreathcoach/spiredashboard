import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');

export default function NumberPickerModal({ 
  visible, 
  onClose, 
  onSave, 
  initialValue = 3,
  minValue = 1,
  maxValue = 20,
  title = "Set Number"
}) {
  const theme = useTheme();
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={value}
              onValueChange={setValue}
              style={[styles.picker, { color: theme.colors.text }]}
              itemStyle={{ color: theme.colors.text }}
            >
              {Array.from(
                { length: maxValue - minValue + 1 }, 
                (_, i) => i + minValue
              ).map(num => (
                <Picker.Item 
                  key={num} 
                  label={num.toString()} 
                  value={num} 
                />
              ))}
            </Picker>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.error }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>
                Set
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: width * 0.9,
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
  },
  pickerWrapper: {
    marginBottom: Layout.spacing.large,
  },
  picker: {
    width: 100,
    height: 200,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    marginHorizontal: Layout.spacing.small,
  },
  buttonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
}); 