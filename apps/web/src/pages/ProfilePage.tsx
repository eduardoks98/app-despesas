import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'billing'>('profile');

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Perfil</h1>
        <p className={styles.subtitle}>
          Gerencie sua conta e configurações
        </p>
      </div>

      {/* User Card */}
      <div className={styles.userCard}>
        <div className={styles.userAvatar}>
          <span className={styles.avatarInitials}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className={styles.userInfo}>
          <h2 className={styles.userName}>{user?.name || 'Usuário'}</h2>
          <p className={styles.userEmail}>{user?.email || 'email@exemplo.com'}</p>
          <div className={styles.userPlan}>
            <span className={styles.planBadge}>
              ✨ Premium
            </span>
            <span className={styles.planStatus}>Ativo até 25/01/2025</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Perfil
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Configurações
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'billing' ? styles.active : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Cobrança
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'profile' && (
          <div className={styles.profileContent}>
            {/* Personal Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Informações Pessoais</h3>
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome completo</label>
                  <input
                    type="text"
                    className={styles.input}
                    defaultValue={user?.name || ''}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    defaultValue={user?.email || ''}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Telefone</label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <button className={styles.saveButton}>
                  Salvar Alterações
                </button>
              </div>
            </div>

            {/* Security */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Segurança</h3>
              <div className={styles.securityList}>
                <div className={styles.securityItem}>
                  <div className={styles.securityInfo}>
                    <span className={styles.securityLabel}>Senha</span>
                    <span className={styles.securityStatus}>
                      Última alteração há 30 dias
                    </span>
                  </div>
                  <button className={styles.securityButton}>
                    Alterar Senha
                  </button>
                </div>
                <div className={styles.securityItem}>
                  <div className={styles.securityInfo}>
                    <span className={styles.securityLabel}>Autenticação de dois fatores</span>
                    <span className={styles.securityStatus}>
                      Não configurada
                    </span>
                  </div>
                  <button className={styles.securityButton}>
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsContent}>
            {/* App Preferences */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Preferências do App</h3>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Tema</span>
                    <span className={styles.settingDescription}>
                      Escolha entre claro, escuro ou automático
                    </span>
                  </div>
                  <select className={styles.settingSelect}>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Moeda</span>
                    <span className={styles.settingDescription}>
                      Moeda padrão para exibição
                    </span>
                  </div>
                  <select className={styles.settingSelect}>
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Formato de data</span>
                    <span className={styles.settingDescription}>
                      Como as datas são exibidas
                    </span>
                  </div>
                  <select className={styles.settingSelect}>
                    <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                    <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                    <option value="yyyy-mm-dd">AAAA-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Notificações</h3>
              <div className={styles.notificationsList}>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationLabel}>Lembretes de gastos</span>
                    <span className={styles.notificationDescription}>
                      Receba lembretes quando atingir limites de gastos
                    </span>
                  </div>
                  <div className={styles.toggle}>
                    <input type="checkbox" className={styles.toggleInput} defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </div>
                </div>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationLabel}>Relatórios mensais</span>
                    <span className={styles.notificationDescription}>
                      Receba um resumo mensal por email
                    </span>
                  </div>
                  <div className={styles.toggle}>
                    <input type="checkbox" className={styles.toggleInput} defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </div>
                </div>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationLabel}>Dicas financeiras</span>
                    <span className={styles.notificationDescription}>
                      Receba dicas para melhorar suas finanças
                    </span>
                  </div>
                  <div className={styles.toggle}>
                    <input type="checkbox" className={styles.toggleInput} />
                    <span className={styles.toggleSlider}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className={styles.billingContent}>
            {/* Current Plan */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Plano Atual</h3>
              <div className={styles.currentPlan}>
                <div className={styles.planCard}>
                  <div className={styles.planHeader}>
                    <h4 className={styles.planName}>Premium</h4>
                    <span className={styles.planPrice}>R$ 9,90/mês</span>
                  </div>
                  <div className={styles.planFeatures}>
                    <div className={styles.feature}>✅ Sincronização em nuvem</div>
                    <div className={styles.feature}>✅ Acesso web e mobile</div>
                    <div className={styles.feature}>✅ Conta conjunta/família</div>
                    <div className={styles.feature}>✅ Relatórios avançados</div>
                    <div className={styles.feature}>✅ Backup automático</div>
                  </div>
                  <div className={styles.planActions}>
                    <button className={styles.cancelButton}>
                      Cancelar Assinatura
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Método de Pagamento</h3>
              <div className={styles.paymentMethod}>
                <div className={styles.paymentCard}>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardType}>💳 Visa</span>
                    <span className={styles.cardNumber}>**** **** **** 1234</span>
                    <span className={styles.cardExpiry}>Exp: 12/25</span>
                  </div>
                  <button className={styles.changeButton}>
                    Alterar
                  </button>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Histórico de Cobrança</h3>
              <div className={styles.billingHistory}>
                {[
                  { date: '01/01/2025', amount: 'R$ 9,90', status: 'Pago', invoice: '#001' },
                  { date: '01/12/2024', amount: 'R$ 9,90', status: 'Pago', invoice: '#002' },
                  { date: '01/11/2024', amount: 'R$ 9,90', status: 'Pago', invoice: '#003' },
                ].map((billing, index) => (
                  <div key={index} className={styles.billingItem}>
                    <div className={styles.billingInfo}>
                      <span className={styles.billingDate}>{billing.date}</span>
                      <span className={styles.billingAmount}>{billing.amount}</span>
                      <span className={`${styles.billingStatus} ${styles.paid}`}>
                        {billing.status}
                      </span>
                    </div>
                    <button className={styles.downloadButton}>
                      📄 Baixar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Zona de Perigo</h3>
        <div className={styles.dangerActions}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Sair da Conta
          </button>
          <button className={styles.deleteButton}>
            Excluir Conta
          </button>
        </div>
      </div>
    </div>
  );
};