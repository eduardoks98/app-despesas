# 🏦 Cálculos de Financiamento

Este documento explica como o aplicativo calcula financiamentos e reajustes, especialmente para casos como a Caixa Econômica Federal.

## 📊 Fórmulas Utilizadas

### 1. Juros Compostos
```
Valor Final = Principal × (1 + Taxa)^Períodos
```

**Exemplo:**
- Principal: R$ 100.000
- Taxa mensal: 1% (0.01)
- Períodos: 360 meses
- Valor Final = 100.000 × (1 + 0.01)^360 = R$ 3.594.964,00

### 2. Prestação Mensal (Sistema Price)
```
Prestação = Principal × [Taxa × (1 + Taxa)^Períodos] / [(1 + Taxa)^Períodos - 1]
```

**Exemplo:**
- Principal: R$ 100.000
- Taxa mensal: 1% (0.01)
- Períodos: 360 meses
- Prestação = R$ 1.028,61

### 3. Reajuste Mensal
```
Valor Ajustado = Valor Original × (1 - Reajuste)^Meses
```

**Exemplo:**
- Valor Original: R$ 100.000
- Reajuste mensal: 0.5% (0.005)
- Meses decorridos: 12
- Valor Ajustado = 100.000 × (1 - 0.005)^12 = R$ 94.118,00

## 🏛️ Caso Específico: Caixa Econômica Federal

### Características do Financiamento Caixa

1. **Reajuste Mensal**: A Caixa aplica reajustes mensais que reduzem o valor da dívida
2. **Taxa de Juros**: Varia conforme o tipo de financiamento
3. **Prazo**: Até 360 meses para imóveis

### Exemplo Prático

**Financiamento Imobiliário:**
- Valor do imóvel: R$ 300.000
- Entrada: R$ 60.000 (20%)
- Valor financiado: R$ 240.000
- Taxa de juros: 1.2% ao mês
- Prazo: 360 meses
- Reajuste mensal: 0.5%

**Cálculos:**

1. **Total com Juros:**
   ```
   Total = 240.000 × (1 + 0.012)^360 = R$ 8.627.913,60
   ```

2. **Prestação Inicial:**
   ```
   Prestação = 240.000 × [0.012 × (1 + 0.012)^360] / [(1 + 0.012)^360 - 1]
   Prestação = R$ 2.468,69
   ```

3. **Valor Após 12 Meses:**
   ```
   Valor Ajustado = 240.000 × (1 - 0.005)^12 = R$ 225.883,20
   ```

## 🔧 Implementação no App

### Código de Cálculo

```typescript
const calculateFinancingAdjustment = (expense: Expense, months: number): number => {
  if (!expense.isFinancing || !expense.interestRate || !expense.monthlyAdjustment) {
    return expense.amount;
  }

  let adjustedAmount = expense.amount;
  for (let i = 0; i < months; i++) {
    adjustedAmount = adjustedAmount * (1 - expense.monthlyAdjustment / 100);
  }
  
  return adjustedAmount;
};
```

### Campos do Financiamento

1. **Taxa de Juros Mensal (%)**: Taxa de juros aplicada mensalmente
2. **Reajuste Mensal (%)**: Percentual de redução mensal da dívida
3. **Número de Parcelas**: Total de parcelas do financiamento
4. **Parcela Atual**: Parcela atual para cálculo do reajuste

## 📈 Benefícios do Sistema

### Para o Usuário

1. **Controle Realista**: Cálculos baseados em financiamentos reais
2. **Projeção Futura**: Visualização do valor da dívida ao longo do tempo
3. **Planejamento**: Ajuda no planejamento financeiro
4. **Comparação**: Possibilidade de comparar diferentes financiamentos

### Para Financiamentos

1. **Caixa Econômica**: Reajustes mensais automáticos
2. **Outros Bancos**: Configuração personalizada de taxas
3. **Simulações**: Teste de diferentes cenários

## 🎯 Casos de Uso

### 1. Financiamento Imobiliário
- **Prazo**: 360 meses
- **Taxa**: 1.2% ao mês
- **Reajuste**: 0.5% ao mês

### 2. Financiamento Veicular
- **Prazo**: 60 meses
- **Taxa**: 1.8% ao mês
- **Reajuste**: 0.3% ao mês

### 3. Financiamento Pessoal
- **Prazo**: 24 meses
- **Taxa**: 2.5% ao mês
- **Reajuste**: 0% (sem reajuste)

## ⚠️ Considerações Importantes

1. **Taxas Reais**: As taxas podem variar conforme o banco e o tipo de financiamento
2. **Reajustes**: Nem todos os financiamentos têm reajustes mensais
3. **IOF**: Imposto sobre Operações Financeiras não incluído nos cálculos
4. **Seguros**: Custos de seguros não considerados
5. **Taxas Administrativas**: Taxas adicionais podem ser aplicadas

## 🔄 Atualizações Futuras

- [ ] Cálculo de IOF
- [ ] Inclusão de seguros
- [ ] Taxas administrativas
- [ ] Simulação de refinanciamento
- [ ] Comparação entre bancos
- [ ] Histórico de reajustes

## 📚 Referências

- [Caixa Econômica Federal - Financiamento Imobiliário](https://www.caixa.gov.br/voce/habitacao/financiamento-imobiliario)
- [Sistema Price de Amortização](https://pt.wikipedia.org/wiki/Sistema_price)
- [Juros Compostos](https://pt.wikipedia.org/wiki/Juros_compostos) 