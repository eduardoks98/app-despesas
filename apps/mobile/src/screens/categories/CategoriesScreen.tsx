import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { CardHeader } from '../../components/common/CardHeader';
import { TabSelector } from '../../components/common/TabSelector';
import { Button } from '../../components/common/Button';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/core';
import { ErrorHandler } from '../../services/utils';
import { HapticService } from '../../services/platform';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useRefresh } from '../../hooks/useRefresh';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface CategoriesScreenProps {
  navigation: any;
}

interface CategoryLocal {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isDefault: boolean;
}

type CategoryType = 'income' | 'expense';

const DEFAULT_EXPENSE_CATEGORIES: Omit<CategoryLocal, 'id'>[] = [
  { name: 'Alimentação', icon: 'restaurant', color: '#FF6B6B', type: 'expense', isDefault: true },
  { name: 'Transporte', icon: 'car', color: '#4ECDC4', type: 'expense', isDefault: true },
  { name: 'Moradia', icon: 'home', color: '#45B7D1', type: 'expense', isDefault: true },
  { name: 'Saúde', icon: 'medical', color: '#96CEB4', type: 'expense', isDefault: true },
  { name: 'Educação', icon: 'school', color: '#FECA57', type: 'expense', isDefault: true },
  { name: 'Lazer', icon: 'game-controller', color: '#9C88FF', type: 'expense', isDefault: true },
  { name: 'Compras', icon: 'bag', color: '#FD79A8', type: 'expense', isDefault: true },
  { name: 'Assinaturas', icon: 'repeat', color: '#74B9FF', type: 'expense', isDefault: true },
  { name: 'Parcelamentos', icon: 'card', color: '#FD79A8', type: 'expense', isDefault: true },
];

const DEFAULT_INCOME_CATEGORIES: Omit<CategoryLocal, 'id'>[] = [
  { name: 'Salário', icon: 'briefcase', color: '#4ECDC4', type: 'income', isDefault: true },
  { name: 'Freelance', icon: 'laptop', color: '#45B7D1', type: 'income', isDefault: true },
  { name: 'Investimentos', icon: 'trending-up', color: '#96CEB4', type: 'income', isDefault: true },
  { name: 'Vendas', icon: 'storefront', color: '#FECA57', type: 'income', isDefault: true },
  { name: 'Presente', icon: 'gift', color: '#9C88FF', type: 'income', isDefault: true },
  { name: 'Prêmio', icon: 'trophy', color: '#FD79A8', type: 'income', isDefault: true },
];

const AVAILABLE_ICONS = [
  'restaurant', 'car', 'home', 'medical', 'school', 'game-controller', 'bag', 'shirt',
  'phone-portrait', 'flower', 'paw', 'airplane', 'car-sport', 'receipt',
  'storefront', 'repeat', 'card', 'folder', 'briefcase', 'laptop', 'trending-up',
  'gift', 'trophy', 'stats-chart', 'people', 'star', 'cash', 'heart',
  'fitness', 'library', 'camera', 'musical-notes', 'wine', 'cafe'
];

const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#9C88FF',
  '#FD79A8', '#6C5CE7', '#A29BFE', '#74B9FF', '#00B894', '#00CECA',
  '#E17055', '#FDCB6E', '#E84393', '#55A3FF', '#81C784', '#2D3436'
];

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<CategoryLocal[]>([]);
  const [selectedType, setSelectedType] = useState<CategoryType>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryLocal | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#96CEB4');
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);
  const { refreshing, onRefresh } = useRefresh({ onRefresh: () => loadCategories(true) });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    }

    try {
      let storedCategories = await StorageService.getCategories();
      
      // Se não há categorias salvas, inicializar com as padrões
      if (!storedCategories || storedCategories.length === 0) {
        const defaultCategories = [
          ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ ...cat, id: `exp_${Date.now()}_${Math.random()}` })),
          ...DEFAULT_INCOME_CATEGORIES.map(cat => ({ ...cat, id: `inc_${Date.now()}_${Math.random()}` }))
        ];
        
        await StorageService.saveCategories(defaultCategories);
        storedCategories = defaultCategories;
      }

      setCategories(storedCategories);
      
      if (!isRefresh) {
        stopLoading();
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      if (!isRefresh) {
        setErrorState('Não foi possível carregar as categorias');
      }
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === selectedType);

  const openAddModal = async () => {
    await HapticService.buttonPress();
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIcon('folder');
    setSelectedColor('#96CEB4');
    setShowModal(true);
  };

  const openEditModal = async (category: CategoryLocal) => {
    await HapticService.buttonPress();
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Erro', 'Nome da categoria é obrigatório');
      return;
    }

    await HapticService.buttonPress();

    try {
      const newCategory: CategoryLocal = {
        id: editingCategory?.id || `${selectedType}_${Date.now()}_${Math.random()}`,
        name: categoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
        isDefault: editingCategory?.isDefault || false
      };

      let updatedCategories;
      if (editingCategory) {
        updatedCategories = categories.map(cat => 
          cat.id === editingCategory.id ? newCategory : cat
        );
      } else {
        updatedCategories = [...categories, newCategory];
      }

      await StorageService.saveCategories(updatedCategories);
      setCategories(updatedCategories);
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      Alert.alert('Erro', 'Não foi possível salvar a categoria');
    }
  };

  const deleteCategory = async (category: CategoryLocal) => {
    if (category.isDefault) {
      Alert.alert('Erro', 'Não é possível excluir categorias padrão');
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir a categoria "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await HapticService.buttonPress();
            try {
              const updatedCategories = categories.filter(cat => cat.id !== category.id);
              await StorageService.saveCategories(updatedCategories);
              setCategories(updatedCategories);
            } catch (error) {
              console.error('Erro ao excluir categoria:', error);
              Alert.alert('Erro', 'Não foi possível excluir a categoria');
            }
          }
        }
      ]
    );
  };

  const renderCategory = (category: CategoryLocal, index: number) => (
    <TouchableOpacity 
      key={category.id}
      style={[
        styles.timelineItemCompact,
        index !== filteredCategories.length - 1 && styles.timelineItemBorder
      ]}
      onPress={() => openEditModal(category)}
    >
      <View style={[
        styles.timelineIcon,
        { backgroundColor: category.color + '20' }
      ]}>
        <Ionicons 
          name={category.icon as any} 
          size={16} 
          color={category.color} 
        />
      </View>
      
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{category.name}</Text>
        <Text style={styles.timelineDate}>
          {category.isDefault ? 'Categoria padrão' : 'Personalizada'}
        </Text>
      </View>
      
      <View style={styles.timelineActions}>
        {!category.isDefault && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteCategory(category)}
          >
            <Ionicons name="trash" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadCategories}
        empty={!loading && !error && categories.length === 0}
        emptyTitle="Nenhuma categoria"
        emptyMessage="Adicione categorias para organizar suas transações"
        emptyIcon="folder"
      >
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Categorias</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Type Selector */}
              <TabSelector
                options={[
                  { 
                    key: 'expense', 
                    label: 'Despesas', 
                    icon: 'trending-down',
                    color: colors.danger
                  },
                  { 
                    key: 'income', 
                    label: 'Receitas', 
                    icon: 'trending-up',
                    color: colors.success
                  }
                ]}
                selectedValue={selectedType}
                onValueChange={async (value) => {
                  await HapticService.buttonPress();
                  setSelectedType(value as 'expense' | 'income');
                }}
              />

              {/* Section Header */}
              <View style={styles.section}>
                <View style={styles.cardContainer}>
                  <CardHeader 
                    title={selectedType === 'expense' ? 'Categorias de Despesas' : 'Categorias de Receitas'}
                    subtitle={`${filteredCategories.length} categoria${filteredCategories.length !== 1 ? 's' : ''}`}
                    icon={selectedType === 'expense' ? 'trending-down' : 'trending-up'}
                  />
                  
                  {/* Categories Timeline */}
                  <View style={styles.cardBody}>
                    {filteredCategories.map((category, index) => renderCategory(category, index))}
                  </View>
                </View>
              </View>
            </>
          )}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        {/* FAB */}
        <FAB
          icon="add"
          onPress={openAddModal}
        />

        {/* Add/Edit Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                {/* Nome */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    style={styles.textInput}
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="Nome da categoria"
                    autoFocus
                  />
                </View>

                {/* Ícone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ícone</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.iconSelector}
                  >
                    {AVAILABLE_ICONS.map((icon, index) => (
                      <TouchableOpacity
                        key={`icon-${index}-${icon}`}
                        style={[
                          styles.iconOption,
                          selectedIcon === icon && styles.iconOptionSelected
                        ]}
                        onPress={() => setSelectedIcon(icon)}
                      >
                        <Ionicons 
                          name={icon as any} 
                          size={20} 
                          color={selectedIcon === icon ? colors.white : colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Cor */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cor</Text>
                  <View style={styles.colorSelector}>
                    {AVAILABLE_COLORS.map((color, index) => (
                      <TouchableOpacity
                        key={`color-${index}-${color}`}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.colorOptionSelected
                        ]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {selectedColor === color && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Preview */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preview</Text>
                  <View style={styles.previewContainer}>
                    <View style={[
                      styles.previewIcon,
                      { backgroundColor: selectedColor + '20' }
                    ]}>
                      <Ionicons 
                        name={selectedIcon as any} 
                        size={24} 
                        color={selectedColor} 
                      />
                    </View>
                    <Text style={styles.previewText}>{categoryName || 'Nome da categoria'}</Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Button
                    title="Cancelar"
                    onPress={closeModal}
                    variant="outline"
                    style={styles.modalButton}
                  />
                  <Button
                    title={editingCategory ? 'Salvar' : 'Adicionar'}
                    onPress={saveCategory}
                    style={styles.modalButton}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LoadingWrapper>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: {
    backgroundColor: colors.white,
  },
  timelineItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
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
  modalScrollView: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  iconSelector: {
    maxHeight: 60,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});

export default CategoriesScreen;