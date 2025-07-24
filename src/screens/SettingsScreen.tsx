import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Switch,
  Divider,
  Chip,
  TextInput,
  Portal,
  Dialog,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { useFinance } from '../context/FinanceContext';

const SettingsScreen: React.FC = () => {
  const { state, deleteExpense } = useFinance();
  const navigation = useNavigation();
  
  // Estados locais para teste
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [categories, setCategories] = useState([
    { id: '1', name: 'Alimentação', icon: 'restaurant' },
    { id: '2', name: 'Transporte', icon: 'car' },
    { id: '3', name: 'Moradia', icon: 'home' },
    { id: '4', name: 'Saúde', icon: 'medical' },
    { id: '5', name: 'Educação', icon: 'school' },
    { id: '6', name: 'Lazer', icon: 'game-controller' },
    { id: '7', name: 'Vestuário', icon: 'shirt' },
    { id: '8', name: 'Financiamento', icon: 'card' },
    { id: '9', name: 'Outros', icon: 'ellipsis-horizontal' },
  ]);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('tag');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const handleExportData = async () => {
    try {
      const exportData = {
        expenses: state.expenses,
        exportDate: new Date().toISOString(),
        totalExpenses: state.totalExpenses,
        monthlyExpenses: state.monthlyExpenses,
      };

      const dataString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: `Dados do Controle Financeiro\n\n${dataString}`,
        title: 'Exportar Dados Financeiros',
      });
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar dados. Tente novamente.');
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Esta ação irá excluir permanentemente todas as despesas registradas. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação Final',
              'Tem certeza que deseja excluir todos os dados? Esta ação é irreversível.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sim, Excluir Tudo',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Excluir todas as despesas
                      for (const expense of state.expenses) {
                        if (expense.id) {
                          await deleteExpense(expense.id);
                        }
                      }
                      Alert.alert('Sucesso', 'Todos os dados foram excluídos.');
                    } catch (error) {
                      Alert.alert('Erro', 'Erro ao limpar dados. Tente novamente.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para a categoria.');
      return;
    }

    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryIcon('tag');
    setShowAddCategoryModal(false);
    Alert.alert('Sucesso', 'Categoria adicionada com sucesso!');
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Excluir Categoria',
      `Deseja realmente excluir a categoria "${categoryName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setCategories(categories.filter(cat => cat.id !== categoryId));
            Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    navigation.navigate('About' as never);
  };

  const formatCurrency = (value: number) => {
    // Converter de centavos para reais
    const valueInReais = value / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInReais);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Estatísticas Rápidas */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Estatísticas</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="wallet" size={24} color="#2196F3" />
                <Paragraph style={styles.statValue}>
                  {formatCurrency(state.totalExpenses)}
                </Paragraph>
                <Paragraph style={styles.statLabel}>Total Geral</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
                <Paragraph style={styles.statValue}>
                  {formatCurrency(state.monthlyExpenses)}
                </Paragraph>
                <Paragraph style={styles.statLabel}>Este Mês</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="list" size={24} color="#FF9800" />
                <Paragraph style={styles.statValue}>
                  {state.expenses.length}
                </Paragraph>
                <Paragraph style={styles.statLabel}>Despesas</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Configurações Gerais */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Configurações Gerais</Title>
            
            <List.Item
              title="Notificações"
              description="Receber lembretes de despesas"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(value) => {
                    setNotificationsEnabled(value);
                    Alert.alert('Sucesso', `Notificações ${value ? 'ativadas' : 'desativadas'}!`);
                  }}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Backup Automático"
              description="Fazer backup automático dos dados"
              left={(props) => <List.Icon {...props} icon="cloud-sync" />}
              right={() => (
                <Switch
                  value={autoBackupEnabled}
                  onValueChange={(value) => {
                    setAutoBackupEnabled(value);
                    Alert.alert('Sucesso', `Backup automático ${value ? 'ativado' : 'desativado'}!`);
                  }}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Modo Escuro"
              description="Alternar entre tema claro e escuro"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={darkModeEnabled}
                  onValueChange={(value) => {
                    setDarkModeEnabled(value);
                    Alert.alert('Sucesso', `Modo escuro ${value ? 'ativado' : 'desativado'}!`);
                  }}
                />
              )}
              onPress={() => Alert.alert('Modo Escuro', 'Funcionalidade em desenvolvimento.')}
              style={styles.settingItem}
            />
          </Card.Content>
        </Card>

        {/* Dados */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Gerenciar Dados</Title>
            
            <List.Item
              title="Exportar Dados"
              description="Salvar backup dos dados"
              left={(props) => <List.Icon {...props} icon="download" />}
              onPress={handleExportData}
            />
            
            <Divider />
            
            <List.Item
              title="Limpar Todos os Dados"
              description="Excluir todas as despesas"
              left={(props) => <List.Icon {...props} icon="delete" />}
              onPress={handleClearData}
              titleStyle={{ color: '#d32f2f' }}
            />
          </Card.Content>
        </Card>

        {/* Categorias */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Categorias</Title>
            <Paragraph style={styles.description}>
              Gerenciar categorias de despesas personalizadas
            </Paragraph>
            
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  icon={category.icon}
                  style={styles.categoryChip}
                  onPress={() => handleDeleteCategory(category.id, category.name)}
                >
                  {category.name}
                </Chip>
              ))}
            </View>
            
            <Button
              mode="outlined"
              onPress={() => setShowAddCategoryModal(true)}
              style={styles.button}
              icon="plus"
            >
              Adicionar Nova Categoria
            </Button>
          </Card.Content>
        </Card>

        {/* Backup e Sincronização */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Backup e Sincronização</Title>
            
            <List.Item
              title="Fazer Backup Agora"
              description="Criar backup manual dos dados"
              left={(props) => <List.Icon {...props} icon="cloud-upload" />}
              onPress={() => Alert.alert('Backup', 'Backup realizado com sucesso!')}
            />
            
            <Divider />
            
            <List.Item
              title="Restaurar Backup"
              description="Restaurar dados de backup anterior"
              left={(props) => <List.Icon {...props} icon="cloud-download" />}
              onPress={() => Alert.alert('Restaurar', 'Funcionalidade em desenvolvimento.')}
            />
            
            <Divider />
            
            <List.Item
              title="Sincronizar com Nuvem"
              description="Sincronizar dados com Google Drive"
              left={(props) => <List.Icon {...props} icon="google" />}
              onPress={() => Alert.alert('Sincronizar', 'Funcionalidade em desenvolvimento.')}
            />
          </Card.Content>
        </Card>

        {/* Suporte e Informações */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Suporte e Informações</Title>
            
            <List.Item
              title="Tutorial"
              description="Como usar o aplicativo"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => Alert.alert('Tutorial', 'Tutorial em desenvolvimento.')}
            />
            
            <Divider />
            
            <List.Item
              title="Política de Privacidade"
              description="Como seus dados são protegidos"
              left={(props) => <List.Icon {...props} icon="shield" />}
              onPress={() => Alert.alert('Privacidade', 'Política de privacidade em desenvolvimento.')}
            />
            
            <Divider />
            
            <List.Item
              title="Termos de Uso"
              description="Termos e condições do aplicativo"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => Alert.alert('Termos', 'Termos de uso em desenvolvimento.')}
            />
            
            <Divider />
            
            <List.Item
              title="Sobre"
              description="Informações sobre o aplicativo"
              left={(props) => <List.Icon {...props} icon="information" />}
              onPress={handleAbout}
            />
          </Card.Content>
        </Card>

        {/* Versão */}
        <View style={styles.versionContainer}>
          <Paragraph style={styles.versionText}>
            Versão 1.0.0
          </Paragraph>
        </View>
      </ScrollView>

      {/* Modal para adicionar categoria */}
      <Modal
        visible={showAddCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Adicionar Nova Categoria</Title>
            
            <TextInput
              label="Nome da Categoria"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={styles.modalInput}
              mode="outlined"
            />
            
            <TextInput
              label="Ícone (nome do ícone)"
              value={newCategoryIcon}
              onChangeText={setNewCategoryIcon}
              style={styles.modalInput}
              mode="outlined"
              placeholder="Ex: car, home, restaurant"
            />
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowAddCategoryModal(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleAddCategory}
                style={styles.modalButton}
              >
                Adicionar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 90,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  settingItem: {
    paddingVertical: 8,
  },
});

export default SettingsScreen; 