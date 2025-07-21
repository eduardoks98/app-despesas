import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { colors } from '../../styles/colors';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Selecione uma data'
}) => {
  const [show, setShow] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value);
  const [selectedDate, setSelectedDate] = useState(value);

  const handleConfirm = () => {
    onChange(selectedDate);
    setShow(false);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Adicionar dias vazios no início para alinhar com os dias da semana
    const firstDayOfWeek = getDay(start);
    const emptyDays = Array(firstDayOfWeek).fill(null);

    return [...emptyDays, ...days];
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShow(true)}
      >
        <Ionicons name="calendar" size={20} color={colors.textSecondary} />
        <Text style={styles.dateText}>
          {format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={show}
        transparent
        animationType="slide"
        onRequestClose={() => setShow(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Selecionar Data</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.calendarContainer}>
              {/* Header do Mês */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
                  <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                
                <Text style={styles.monthTitle}>
                  {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
                
                <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Dias da Semana */}
              <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                  <Text key={index} style={styles.weekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendário */}
              <View style={styles.calendarGrid}>
                {generateCalendarDays().map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      date && isSameDay(date, selectedDate) && styles.selectedDay,
                      date && isSameDay(date, new Date()) && styles.today,
                      !date && styles.emptyDay
                    ]}
                    onPress={() => date && selectDate(date)}
                    disabled={!date}
                  >
                    {date && (
                      <Text style={[
                        styles.dayText,
                        isSameDay(date, selectedDate) && styles.selectedDayText,
                        isSameDay(date, new Date()) && styles.todayText
                      ]}>
                        {format(date, 'd')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Data Selecionada */}
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateLabel}>Data Selecionada:</Text>
                <Text style={styles.selectedDateText}>
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.textSecondary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.danger,
  },
  modalConfirm: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  calendarContainer: {
    padding: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  today: {
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  todayText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  selectedDateContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedDateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
}); 