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

export default function TimePickerModal({ 
  visible, 
  onClose, 
  onSave, 
  initialMinutes = 1,
  initialSeconds = 0,
  title = "Set Time"
}) {
  const theme = useTheme();
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  const handleSave = () => {
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    onSave(timeString);
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
          
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Minutes
              </Text>
              <Picker
                selectedValue={minutes}
                onValueChange={setMinutes}
                style={[styles.picker, { color: theme.colors.text }]}
                itemStyle={{ color: theme.colors.text }}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item 
                    key={i} 
                    label={i.toString().padStart(2, '0')} 
                    value={i} 
                  />
                ))}
              </Picker>
            </View>

            <Text style={[styles.separator, { color: theme.colors.text }]}>:</Text>

            <View style={styles.pickerColumn}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                Seconds
              </Text>
              <Picker
                selectedValue={seconds}
                onValueChange={setSeconds}
                style={[styles.picker, { color: theme.colors.text }]}
                itemStyle={{ color: theme.colors.text }}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item 
                    key={i} 
                    label={i.toString().padStart(2, '0')} 
                    value={i} 
                  />
                ))}
              </Picker>
            </View>
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
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.large,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  label: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  picker: {
    width: 100,
    height: 200,
  },
  separator: {
    fontSize: 40,
    fontFamily: Typography.fonts.bold,
    marginHorizontal: Layout.spacing.medium,
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