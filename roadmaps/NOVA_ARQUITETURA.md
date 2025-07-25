# 🏗️ Nova Arquitetura - Clean Architecture + DDD

## 📋 Status da Implementação

### ✅ Concluído
- [x] **Monorepo Setup**: Estrutura com workspaces configurada
- [x] **TypeScript**: Configuração strict com paths mapeados
- [x] **Domain Layer**: Entidades e Value Objects implementados
- [x] **Application Layer**: Use Cases principais criados
- [x] **Data Layer**: Repositórios mock implementados
- [x] **Dependency Injection**: Container simples funcionando
- [x] **Hooks React**: Integração com a nova arquitetura

### 🚧 Em Progresso
- [ ] **Migration**: Migração das telas existentes
- [ ] **SQLite Real**: Implementação real do SQLite
- [ ] **Tests**: Testes unitários e de integração

### 📅 Próximos Passos
- [ ] **Web App**: Implementação da versão web
- [ ] **Sync**: Sincronização entre plataformas
- [ ] **CI/CD**: Pipeline automatizado

## 🎯 Como Usar a Nova Arquitetura

### 1. Estrutura do Projeto

```
app-despesas/
├── apps/
│   ├── mobile/          # App React Native
│   └── web/             # App Web (futuro)
├── packages/
│   ├── core/            # Lógica de negócio
│   └── shared/          # Componentes compartilhados
```

### 2. Usando Use Cases nos Componentes

#### Hook para Transações
```typescript
import { useTransactions } from '../hooks/useTransactions';

function TransactionScreen() {
  const { 
    transactions, 
    loading, 
    error, 
    addTransaction,
    refresh 
  } = useTransactions();

  const handleAddTransaction = async () => {
    await addTransaction({
      amount: 100,
      description: 'Almoço',
      date: new Date(),
      type: 'expense',
      categoryId: 'food'
    });
  };

  return (
    // Sua UI aqui
  );
}
```

#### Hook para Categorias
```typescript
import { useCategories } from '../hooks/useCategories';

function CategorySelector() {
  const { categories, loading } = useCategories();

  return (
    // Renderizar categorias
  );
}
```

### 3. Trabalhando com Entidades

#### Criando uma Transação
```typescript
import { Transaction, TransactionType } from '@app-despesas/core';

const transaction = new Transaction({
  amount: 50.99,
  description: 'Supermercado',
  date: new Date(),
  type: TransactionType.EXPENSE,
  categoryId: 'food',
  tags: ['mercado', 'alimentação']
});

// Entidade é imutável - use métodos para alterar
transaction.updateAmount(75.50);
transaction.addTag('promocao');
```

#### Usando Value Objects
```typescript
import { Money, DateRange } from '@app-despesas/core';

// Money com validações
const price = new Money(99.90, 'BRL');
const discount = new Money(10.00, 'BRL');
const total = price.subtract(discount); // R$ 89,90

// DateRange para filtros
const thisMonth = DateRange.currentMonth();
const customRange = new DateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### 4. Container de Dependências

```typescript
import { appContainer } from '../services/AppContainer';

// Use Cases estão disponíveis globalmente
const addTransactionUseCase = appContainer.addTransactionUseCase;
const getTransactionsUseCase = appContainer.getTransactionsUseCase;

// Exemplo de uso direto
const result = await addTransactionUseCase.execute({
  amount: 100,
  description: 'Teste',
  date: new Date(),
  type: 'expense',
  categoryId: 'other-expense'
});
```

## 🧪 Exemplo Completo - Tela de Transações

Veja o arquivo: `apps/mobile/src/screens/NewArchitecture/TransactionListScreen.tsx`

Esta tela demonstra:
- ✅ Uso dos hooks customizados
- ✅ Integração com a nova arquitetura
- ✅ Separação de responsabilidades
- ✅ Estado reativo
- ✅ Tratamento de erros

## 🔄 Migração Gradual

### Etapa 1: Usar Novos Hooks
Substitua contextos antigos pelos novos hooks:

```typescript
// ❌ Antes (Context antigo)
const { transactions } = useContext(FinanceContext);

// ✅ Depois (Nova arquitetura)
const { transactions } = useTransactions();
```

### Etapa 2: Remover Código Legado
Após validar que a nova implementação funciona:

1. Remover contextos antigos
2. Remover services antigos
3. Atualizar imports

### Etapa 3: Adicionar Funcionalidades
Novos recursos devem ser implementados seguindo a nova arquitetura:

1. Criar entidade (se necessário)
2. Criar use case
3. Registrar no container
4. Criar hook
5. Usar na UI

## 🎨 Benefícios da Nova Arquitetura

### 🧪 Testabilidade
```typescript
// Use cases são fáceis de testar
const mockRepo = new MockTransactionRepository();
const useCase = new AddTransactionUseCase(mockRepo, mockCategoryRepo);

const result = await useCase.execute({
  amount: 100,
  description: 'Test',
  date: new Date(),
  type: 'expense',
  categoryId: 'test'
});

expect(result.transaction.amount).toBe(100);
```

### 🔄 Reutilização
```typescript
// Mesma lógica para mobile e web
export function useTransactions() {
  // Implementação compartilhada
}

// apps/mobile/components/TransactionList.tsx
// apps/web/components/TransactionList.tsx
// Ambos usam o mesmo hook!
```

### 🔧 Manutenibilidade
```typescript
// Mudanças na lógica de negócio ficam isoladas
// UI não é afetada por mudanças no banco de dados
// Fácil trocar SQLite por outro storage
```

## 🚀 Performance

### Lazy Loading
```typescript
// Use cases só são criados quando necessários
const useCase = appContainer.addTransactionUseCase; // Criado aqui
```

### Memoização
```typescript
// Hooks usam useCallback e useMemo automaticamente
const { transactions } = useTransactions(filter); // Re-executa só se filter mudar
```

## 📚 Recursos Adicionais

- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## 🤝 Contribuindo

Para adicionar uma nova funcionalidade:

1. **Domain**: Criar entidade e value objects necessários
2. **Application**: Implementar use case
3. **Infrastructure**: Criar repositório (se necessário)
4. **DI**: Registrar no container
5. **Presentation**: Criar hook e usar na UI
6. **Tests**: Adicionar testes unitários

---

**📝 Nota**: Esta é uma implementação progressiva. O código antigo continuará funcionando enquanto migramos gradualmente para a nova arquitetura.