import React from 'react';
import { View, ScrollView, Linking, StyleSheet } from 'react-native';
import { Text, Button, Card, Divider, useTheme } from 'react-native-paper';
import { Container } from '../../components/common/Container';

export function AboutScreen() {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    card: {
      marginBottom: 16,
    },
    section: {
      marginTop: 8,
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 8,
    },
    versionText: {
      color: theme.colors.onSurfaceVariant,
    },
  });

  const openGitHub = () => {
    Linking.openURL('https://github.com/eduardoks98/app-despesas');
  };

  const openLicense = () => {
    Linking.openURL('https://github.com/eduardoks98/app-despesas/blob/main/LICENSE');
  };

  const openBuildGuide = () => {
    Linking.openURL('https://github.com/eduardoks98/app-despesas/blob/main/docs/BUILD_GUIDE.md');
  };

  const openSupport = () => {
    Linking.openURL('mailto:eduardoks1998@gmail.com');
  };

  const openPix = () => {
    // Copia a chave PIX para a área de transferência
    // Linking.openURL('pix://4c988627-0741-4136-b6a4-8c2f793d21b1'); // Alguns bancos suportam
    Linking.openURL('mailto:eduardoks1998@gmail.com?subject=PIX Apoio App Despesas&body=Chave PIX: 4c988627-0741-4136-b6a4-8c2f793d21b1');
  };

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium">App Despesas</Text>
            <Text variant="bodyMedium" style={styles.versionText}>
              Versão 1.0.0
            </Text>
            
            <Divider style={{ marginVertical: 16 }} />
            
            <Text variant="titleMedium">Licença Open Source</Text>
            <Text variant="bodyMedium" style={styles.section}>
              Este app é software livre licenciado sob a GNU Affero General 
              Public License v3.0 (AGPL-3.0). Você pode usar, modificar e 
              distribuir livremente.
            </Text>
            
            <View style={styles.buttonRow}>
              <Button 
                mode="outlined" 
                onPress={openGitHub}
                style={{ flex: 1 }}
              >
                Ver Código
              </Button>
              <Button 
                mode="outlined" 
                onPress={openLicense}
                style={{ flex: 1 }}
              >
                Licença
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Compile Você Mesmo</Text>
            <Text variant="bodyMedium" style={styles.section}>
              Quer compilar sua própria versão? É 100% gratuito! 
              Veja nosso guia completo no GitHub.
            </Text>
            
            <Button 
              mode="contained" 
              style={{ marginTop: 16 }}
              onPress={openBuildGuide}
            >
              Guia de Compilação
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">💚 Apoie via PIX</Text>
            <Text variant="bodyMedium" style={styles.section}>
              Gostou do app? Apoie o desenvolvimento!
            </Text>
            
            <Text variant="bodyMedium" style={styles.section}>
              **Chave PIX**: 4c988627-0741-4136-b6a4-8c2f793d21b1{'\n\n'}
              ☕ Café: R$ 5/mês{'\n'}
              🍕 Pizza: R$ 20/mês{'\n'}
              🚀 Foguete: R$ 50/mês
            </Text>
            
            <Button 
              mode="contained" 
              style={{ marginTop: 16 }}
              onPress={openPix}
            >
              💚 PIX Aleatório
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Outras Formas de Apoiar</Text>
            <Text variant="bodyMedium" style={styles.section}>
              ⭐ Dar uma estrela no GitHub{'\n'}
              🐛 Reportar bugs ou sugerir melhorias{'\n'}
              💻 Contribuir com código{'\n'}
              📱 Aguardar a versão paga nas lojas (em breve)
            </Text>
            
            <View style={styles.buttonRow}>
              <Button 
                mode="contained" 
                onPress={openGitHub}
                style={{ flex: 1 }}
              >
                ⭐ GitHub
              </Button>
              <Button 
                mode="outlined"
                onPress={openSupport}
                style={{ flex: 1 }}
              >
                📧 Contato
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Informações Legais</Text>
            <Text variant="bodyMedium" style={styles.section}>
              • "App Despesas" é marca registrada{'\n'}
              • Código disponível sob AGPL-3.0{'\n'}
              • Versões modificadas devem usar outro nome{'\n'}
              • Dados ficam apenas no seu dispositivo
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Desenvolvedor</Text>
            <Text variant="bodyMedium" style={styles.section}>
              Eduardo Kunst Steffens{'\n'}
              eduardoks1998@gmail.com
            </Text>
            
            <Text variant="bodySmall" style={{ marginTop: 16, textAlign: 'center' }}>
              Desenvolvido com ❤️ para ajudar você a controlar suas finanças!
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </Container>
  );
}