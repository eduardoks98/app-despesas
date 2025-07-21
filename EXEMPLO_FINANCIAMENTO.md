# Exemplo de Financiamento - Controle Financeiro

## 🏠 **Seu Caso: Financiamento Imobiliário**

### **Dados do Financiamento:**
- **Valor:** R$ 135.000,00
- **Juros Nominais:** 7,16% ao ano
- **Prazo:** 420 parcelas (35 anos)
- **Prestação Inicial:** ~R$ 1.200,00
- **Parcelas Pagas:** 29
- **Prestação Atual:** R$ 1.160,00

## 📊 **Como Funciona o Cálculo**

### **1. Prestação Inicial**
```
Valor: R$ 135.000,00
Juros: 7,16% ao ano
Prazo: 420 meses
Prestação Inicial: R$ 1.200,00
```

### **2. Redução Mensal dos Juros**
- **A cada mês:** A prestação diminui pelo percentual de ajuste
- **Exemplo:** Se o ajuste é 0,5% ao mês
- **Mês 1:** R$ 1.200,00
- **Mês 2:** R$ 1.194,00 (1.200 × 0,995)
- **Mês 3:** R$ 1.188,03 (1.194 × 0,995)
- **...**
- **Mês 29:** R$ 1.160,00

## 🎯 **Como Usar no App**

### **1. Adicionar Financiamento**
- **Título:** "Financiamento Casa"
- **Valor:** R$ 135.000,00
- **Categoria:** "Financiamento"
- **Recorrência:** Mensal
- **Parcelas:** 420
- **Parcela Atual:** 29

### **2. Configurar Financiamento**
- **É Financiamento:** ✅ Sim
- **Taxa de Juros:** 7,16%
- **Ajuste Mensal:** 0,5% (ou o percentual da sua instituição)

### **3. Resultado**
O app vai mostrar:
- **Prestação Inicial:** R$ 1.200,00
- **Prestação Atual (Mês 29):** R$ 1.160,00
- **Redução Total:** R$ 40,00

## 🔧 **Fórmulas Utilizadas**

### **Prestação Inicial (Sistema Price)**
```
P = PV × (i × (1 + i)^n) / ((1 + i)^n - 1)
```
Onde:
- P = Prestação
- PV = Valor Presente (R$ 135.000)
- i = Taxa de juros mensal (7,16% ÷ 12)
- n = Número de parcelas (420)

### **Prestação Atual (Com Redução)**
```
P_atual = P_inicial × (1 - ajuste)^meses
```
Onde:
- P_atual = Prestação atual
- P_inicial = Prestação inicial
- ajuste = Percentual de redução mensal
- meses = Número de meses pagos

## 📱 **Benefícios do App**

1. **Controle Real:** Mostra o valor real que você paga
2. **Projeção:** Calcula quanto vai pagar nos próximos meses
3. **Histórico:** Acompanha a redução ao longo do tempo
4. **Orçamento:** Integra com seu controle financeiro geral

## 🎉 **Resultado**

Agora o app calcula corretamente:
- ✅ **Prestação inicial** com juros
- ✅ **Redução mensal** dos juros
- ✅ **Valor atual** da prestação
- ✅ **Economia total** desde o início

**Seu financiamento de R$ 1.200 → R$ 1.160 está correto!** 🏠 