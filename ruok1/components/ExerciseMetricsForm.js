export default function ActivityMetricsForm({ visible, onClose, onSubmit, activity }) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    sets: '',
    reps: '',
    weights: '',
    rir: '', // Reps In Reserve
    time: '',
    distance: '',
    calories: '',
    oneRmPercentage: '', // %1RM
    completed: false,
    streak: 0,
    priority: 'medium',
  });

  // ... existing code ...

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Set {activity?.type || 'Activity'} Metrics
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {/* Render fields in pairs */}
            {Array.from({ length: Math.ceil(visibleFields.length / 2) }).map((_, index) => (
              <View style={styles.inputRow} key={index}>
                {renderField(visibleFields[index * 2])}
                {visibleFields[index * 2 + 1] && renderField(visibleFields[index * 2 + 1])}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { color: theme.colors.background }]}>
              Schedule {activity?.type || 'Activity'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.large,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.semibold,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  form: {
    padding: Layout.spacing.large,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.medium,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: Layout.spacing.xsmall,
  },
  label: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  input: {
    height: Layout.minTouchSize,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  submitButton: {
    margin: Layout.spacing.large,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
}); 