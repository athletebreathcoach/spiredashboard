import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import TimePickerModal from './TimePickerModal';
import NumberPickerModal from './NumberPickerModal';
import ApneaTablePreview from './ApneaTablePreview';

const { width } = Dimensions.get('window');

export default function ApneaTableSetup({ navigation, route }) {
  const theme = useTheme();
  const { tableType, title } = route.params || {};
  const [tableName, setTableName] = useState(title || `New ${tableType === 'co2' ? 'CO2' : 'O2'} Table`);
  const [breathHolds, setBreathHolds] = useState('3');
  const [apneaTime, setApneaTime] = useState('01:50');
  const [restStartTime, setRestStartTime] = useState('01:20');
  const [restDecrement, setRestDecrement] = useState('00:10');
  const [cooldownTime, setCooldownTime] = useState('01:00');

  // Time picker state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [numberPickerVisible, setNumberPickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState(null);
  const [activeTimeValue, setActiveTimeValue] = useState('');

  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    setShowPreview(true);
  };

  const handleStartTable = () => {
    // Navigate to breath guide with the table settings
    navigation.navigate('BreathGuide', {
      settings: {
        name: tableName,
        breathHolds: parseInt(breathHolds),
        apneaTime,
        restStartTime,
        restDecrement,
        cooldownTime,
        type: tableType,
      }
    });
  };

  const openTimePicker = (field, currentValue) => {
    setActiveTimeField(field);
    setActiveTimeValue(currentValue);
    setTimePickerVisible(true);
  };

  const handleTimeSet = (timeString) => {
    switch (activeTimeField) {
      case 'apnea':
        setApneaTime(timeString);
        break;
      case 'restStart':
        setRestStartTime(timeString);
        break;
      case 'restDecrement':
        setRestDecrement(timeString);
        break;
      case 'cooldown':
        setCooldownTime(timeString);
        break;
    }
    setTimePickerVisible(false);
  };

  const TimeInput = ({ label, value, onSet, color = theme.colors.text }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.timeInputRow}>
        <Text style={[styles.timeText, { color }]}>{value}</Text>
        <TouchableOpacity 
          style={[styles.setButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={onSet}
        >
          <Text style={[styles.setButtonText, { color: theme.colors.text }]}>set</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getInitialMinutesAndSeconds = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return { minutes, seconds };
  };

  if (showPreview) {
    return (
      <ApneaTablePreview
        settings={{
          tableName,
          breathHolds: parseInt(breathHolds),
          apneaTime,
          restStartTime,
          restDecrement,
          cooldownTime,
        }}
        onStart={handleStartTable}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            NAME OF THE TABLE
          </Text>
          <TextInput
            style={[styles.nameInput, { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: theme.colors.text 
            }]}
            value={tableName}
            onChangeText={setTableName}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            NUMBER OF BREATHHOLDS
          </Text>
          <View style={styles.timeInputRow}>
            <Text style={[styles.numberText, { color: theme.colors.text }]}>
              {breathHolds}
            </Text>
            <TouchableOpacity 
              style={[styles.setButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
              onPress={() => setNumberPickerVisible(true)}
            >
              <Text style={[styles.setButtonText, { color: theme.colors.text }]}>set</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TimeInput
          label="APNEA TIME"
          value={apneaTime}
          onSet={() => openTimePicker('apnea', apneaTime)}
          color="#FF6B6B"  // Red color for hold times
        />

        <TimeInput
          label="REST START TIME"
          value={restStartTime}
          onSet={() => openTimePicker('restStart', restStartTime)}
          color="#4CD964"  // Green color for rest times
        />

        <TimeInput
          label="REST TIME DECREMENT"
          value={restDecrement}
          onSet={() => openTimePicker('restDecrement', restDecrement)}
          color="#4CD964"  // Green color for rest times
        />

        <TimeInput
          label="COOLDOWN TIME"
          value={cooldownTime}
          onSet={() => openTimePicker('cooldown', cooldownTime)}
          color="#4CD964"  // Green color for rest times
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSave}
      >
        <Text style={[styles.saveButtonText, { color: theme.colors.background }]}>
          Save
        </Text>
      </TouchableOpacity>

      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onSave={handleTimeSet}
        {...getInitialMinutesAndSeconds(activeTimeValue)}
        title={`Set ${activeTimeField?.charAt(0).toUpperCase()}${activeTimeField?.slice(1)} Time`}
      />

      <NumberPickerModal
        visible={numberPickerVisible}
        onClose={() => setNumberPickerVisible(false)}
        onSave={(value) => {
          setBreathHolds(value.toString());
          setNumberPickerVisible(false);
        }}
        initialValue={parseInt(breathHolds)}
        minValue={1}
        maxValue={20}
        title="Set Number of Breath Holds"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Layout.spacing.xlarge,
  },
  label: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  nameInput: {
    height: 50,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.regular,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 48,
    fontFamily: Typography.fonts.medium,
  },
  numberText: {
    fontSize: 64,
    fontFamily: Typography.fonts.medium,
  },
  setButton: {
    paddingHorizontal: Layout.spacing.large,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.large,
  },
  setButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  saveButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    marginTop: Layout.spacing.large,
  },
  saveButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
}); 