import React, { useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import {
  Provider as PaperProvider,
  DefaultTheme as PaperDefaultTheme,
  DarkTheme as PaperDarkTheme,
  Appbar,
  Card,
  Button,
  Chip,
  Paragraph,
  Title,
  Divider,
  List,
  Avatar,
  IconButton,
  FAB,
  Portal,
  Modal,
  TextInput,
  Switch,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// 型定義
interface NavigationProps {
  navigation: any;
}

interface FeatureProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface IntegrationProps {
  title: string;
  icon: string;
  color: string;
}

interface AIFeatureProps {
  title: string;
  icon: string;
  color: string;
}

interface ListIconProps {
  name: string;
  icon: string;
  color: string;
  screen: string;
}

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

// スタックナビゲーター
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// テーマ設定
const CombinedDefaultTheme = {
  ...NavigationDefaultTheme,
  ...PaperDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...PaperDefaultTheme.colors,
    primary: '#0099ff',
    accent: '#00ff99',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
  },
};

const CombinedDarkTheme = {
  ...NavigationDarkTheme,
  ...PaperDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...PaperDarkTheme.colors,
    primary: '#0099ff',
    accent: '#00ff99',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
  },
};

// ダッシュボード画面
const DashboardScreen = ({ navigation }: NavigationProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const features = [
    {
      title: 'AIモデル管理',
      description: '複数のAIモデルを管理・切り替え',
      icon: 'smart-toy',
      color: '#0099ff',
      onPress: () => navigation.navigate('Models'),
    },
    {
      title: 'Google連携',
      description: 'Googleサービスと連携',
      icon: 'cloud',
      color: '#4285f4',
      onPress: () => navigation.navigate('Google'),
    },
    {
      title: 'Discord連携',
      description: 'Discordボットと連携',
      icon: 'chat',
      color: '#5865f2',
      onPress: () => navigation.navigate('Discord'),
    },
    {
      title: 'LINE連携',
      description: 'LINE Messaging APIと連携',
      icon: 'message',
      color: '#00c300',
      onPress: () => navigation.navigate('LINE'),
    },
    {
      title: 'AIドキュメント',
      description: 'AIによるドキュメント生成・管理',
      icon: 'description',
      color: '#ff6b6b',
      onPress: () => navigation.navigate('Documents'),
    },
    {
      title: 'AIロール',
      description: 'AIアシスタントの役割設定',
      icon: 'person',
      color: '#4ecdc4',
      onPress: () => navigation.navigate('Roles'),
    },
    {
      title: 'AIメディア',
      description: '画像・動画・音声生成',
      icon: 'video-library',
      color: '#95e1d3',
      onPress: () => navigation.navigate('Media'),
    },
    {
      title: 'AI会議',
      description: '音声認識・議事録作成',
      icon: 'meeting-room',
      color: '#f38181',
      onPress: () => navigation.navigate('Meeting'),
    },
    {
      title: 'AIチャット',
      description: 'AIとの対話チャット',
      icon: 'chat',
      color: '#aa96da',
      onPress: () => navigation.navigate('Chat'),
    },
    {
      title: 'AI OCR',
      description: '文字認識・データ抽出',
      icon: 'document-scanner',
      color: '#fcbad3',
      onPress: () => navigation.navigate('OCR'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0099ff" />
      
      <LinearGradient
        colors={['#0099ff', '#0077cc']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Title style={styles.headerTitle}>Hyper AI Agent</Title>
            <Paragraph style={styles.headerSubtitle}>
              AIアシスタント統合プラットフォーム
            </Paragraph>
          </View>
          <IconButton
            icon="settings"
            size={24}
            iconColor="white"
            onPress={() => setIsDarkMode(!isDarkMode)}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="smart-toy" size={24} color="#0099ff" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>10</Text>
                <Text style={styles.statLabel}>AIモデル</Text>
              </View>
            </View>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="integration-instructions" size={24} color="#00ff99" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>連携サービス</Text>
              </View>
            </View>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="auto-awesome" size={24} color="#ff6b6b" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>6</Text>
                <Text style={styles.statLabel}>AI機能</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.featuresContainer}>
          <Title style={styles.sectionTitle}>機能一覧</Title>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <TouchableOpacity
                style={styles.featureContent}
                onPress={feature.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Icon name={feature.icon} size={24} color="white" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        <View style={styles.quickActionsContainer}>
          <Title style={styles.sectionTitle}>クイックアクション</Title>
          <View style={styles.quickActions}>
            <Chip
              icon="chat"
              mode="outlined"
              onPress={() => navigation.navigate('Chat')}
              style={styles.quickActionChip}
            >
              AIチャット開始
            </Chip>
            <Chip
              icon="mic"
              mode="outlined"
              onPress={() => navigation.navigate('Meeting')}
              style={styles.quickActionChip}
            >
              会議開始
            </Chip>
            <Chip
              icon="image"
              mode="outlined"
              onPress={() => navigation.navigate('Media')}
              style={styles.quickActionChip}
            >
              画像生成
            </Chip>
          </View>
        </View>
      </ScrollView>

      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => Alert.alert('クイックアクション', '新しいAI機能を追加')}
      />
    </SafeAreaView>
  );
};

// モデル管理画面
const ModelsScreen = () => {
  const models = [
    { name: 'GPT-4', provider: 'OpenAI', status: 'active', description: '高性能言語モデル' },
    { name: 'Claude-2', provider: 'Anthropic', status: 'active', description: '安全な対話モデル' },
    { name: 'Gemini Pro', provider: 'Google', status: 'inactive', description: 'マルチモーダルAI' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => {}} />
        <Appbar.Content title="AIモデル管理" />
        <Appbar.Action icon="plus" onPress={() => {}} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {models.map((model: any, index: number) => (
          <Card key={index} style={styles.listCard}>
            <List.Item
              title={model.name}
              description={`${model.provider} - ${model.description}`}
              left={(props: any) => (
                <Avatar.Icon
                  {...props}
                  icon="smart-toy"
                  style={{ backgroundColor: model.status === 'active' ? '#00ff99' : '#ccc' }}
                />
              )}
              right={(props: any) => (
                <View style={styles.switchContainer}>
                  <Switch
                    value={model.status === 'active'}
                    onValueChange={() => {}}
                  />
                </View>
              )}
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// 連携サービス画面（共通）
const IntegrationScreen = ({ title, icon, color }: IntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => {}} />
        <Appbar.Content title={title} />
        <Appbar.Action icon="settings" onPress={() => setShowSettings(true)} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIcon, { backgroundColor: color }]}>
              <Icon name={icon} size={32} color="white" />
            </View>
            <View style={styles.statusText}>
              <Title>
                {title} {isConnected ? '接続済み' : '未接続'}
              </Title>
              <Paragraph>
                {isConnected ? 'サービスと正常に連携しています' : '接続して機能を有効にしてください'}
              </Paragraph>
            </View>
          </View>
          <Button
            mode={isConnected ? 'outlined' : 'contained'}
            onPress={() => setIsConnected(!isConnected)}
            style={styles.connectButton}
          >
            {isConnected ? '切断' : '接続'}
          </Button>
        </Card>

        <View style={styles.featuresContainer}>
          <Title style={styles.sectionTitle}>連携機能</Title>
          <Card style={styles.featureCard}>
            <List.Item
              title="メッセージ送信"
              description="AI生成結果を送信"
              left={(props: any) => <List.Icon {...props} icon="send" />}
            />
          </Card>
          <Card style={styles.featureCard}>
            <List.Item
              title="通知受信"
              description="リアルタイム通知"
              left={(props: any) => <List.Icon {...props} icon="notifications" />}
            />
          </Card>
          <Card style={styles.featureCard}>
            <List.Item
              title="データ同期"
              description="双方向データ同期"
              left={(props: any) => <List.Icon {...props} icon="sync" />}
            />
          </Card>
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>設定</Title>
          <TextInput
            label="APIキー"
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label="Webhook URL"
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.modalButtons}>
            <Button mode="text" onPress={() => setShowSettings(false)}>
              キャンセル
            </Button>
            <Button mode="contained" onPress={() => setShowSettings(false)}>
              保存
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

// AI機能画面（共通）
const AIFeatureScreen = ({ title, icon, color }: AIFeatureProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

  const handleProcess = async () => {
    setIsProcessing(true);
    // 擬似的な処理
    const timer = setTimeout(() => {
      setResult(`${title}の処理結果がここに表示されます`);
      setIsProcessing(false);
    }, 2000);
    return () => clearTimeout(timer);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => {}} />
        <Appbar.Content title={title} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View style={[styles.featureIcon, { backgroundColor: color }]}>
              <Icon name={icon} size={32} color="white" />
            </View>
            <View style={styles.featureHeaderText}>
              <Title>{title}</Title>
              <Paragraph>AIによる高度な処理を実行</Paragraph>
            </View>
          </View>
        </Card>

        <Card style={styles.processCard}>
          <TextInput
            label="入力"
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="処理するデータを入力..."
          />
          <Button
            mode="contained"
            onPress={handleProcess}
            loading={isProcessing}
            disabled={isProcessing}
            style={styles.processButton}
          >
            {isProcessing ? '処理中...' : '処理開始'}
          </Button>
        </Card>

        {result ? (
          <Card style={styles.resultCard}>
            <Title style={styles.resultTitle}>処理結果</Title>
            <Paragraph>{result}</Paragraph>
            <Button
              mode="outlined"
              icon="share"
              style={styles.shareButton}
              onPress={() => {}}
            >
              結果を共有
            </Button>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

// タブナビゲーター
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          let iconName: string;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Models':
              iconName = 'smart-toy';
              break;
            case 'Integrations':
              iconName = 'hub';
              break;
            case 'AIFeatures':
              iconName = 'auto-awesome';
              break;
            default:
              iconName = 'help';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0099ff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'ホーム' }} />
      <Tab.Screen name="Models" component={ModelsScreen} options={{ title: 'モデル' }} />
      <Tab.Screen name="Integrations" component={IntegrationTabs} options={{ title: '連携' }} />
      <Tab.Screen name="AIFeatures" component={AIFeatureTabs} options={{ title: 'AI機能' }} />
    </Tab.Navigator>
  );
};

// 連携タブ
const IntegrationTabs = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IntegrationList" component={IntegrationListScreen} />
      <Stack.Screen name="Google" component={() => IntegrationScreen({ title: 'Google連携', icon: 'cloud', color: '#4285f4' })} />
      <Stack.Screen name="Discord" component={() => IntegrationScreen({ title: 'Discord連携', icon: 'chat', color: '#5865f2' })} />
      <Stack.Screen name="LINE" component={() => IntegrationScreen({ title: 'LINE連携', icon: 'message', color: '#00c300' })} />
    </Stack.Navigator>
  );
};

// AI機能タブ
const AIFeatureTabs = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AIFeatureList" component={AIFeatureListScreen} />
      <Stack.Screen name="Documents" component={() => AIFeatureScreen({ title: 'AIドキュメント', icon: 'description', color: '#ff6b6b' })} />
      <Stack.Screen name="Media" component={() => AIFeatureScreen({ title: 'AIメディア', icon: 'video-library', color: '#95e1d3' })} />
      <Stack.Screen name="Meeting" component={() => AIFeatureScreen({ title: 'AI会議', icon: 'meeting-room', color: '#f38181' })} />
      <Stack.Screen name="Chat" component={() => AIFeatureScreen({ title: 'AIチャット', icon: 'chat', color: '#aa96da' })} />
      <Stack.Screen name="OCR" component={() => AIFeatureScreen({ title: 'AI OCR', icon: 'document-scanner', color: '#fcbad3' })} />
    </Stack.Navigator>
  );
};

// 連携一覧画面
const IntegrationListScreen = ({ navigation }: NavigationProps) => {
  const integrations: ListIconProps[] = [
    { name: 'Google', icon: 'cloud', color: '#4285f4', screen: 'Google' },
    { name: 'Discord', icon: 'chat', color: '#5865f2', screen: 'Discord' },
    { name: 'LINE', icon: 'message', color: '#00c300', screen: 'LINE' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="連携サービス" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {integrations.map((integration: ListIconProps, index: number) => (
          <Card key={index} style={styles.listCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate(integration.screen)}
              style={styles.listItem}
            >
              <View style={[styles.listIcon, { backgroundColor: integration.color }]}>
                <Icon name={integration.icon} size={24} color="white" />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{integration.name}連携</Text>
                <Text style={styles.listDescription}>設定と管理</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// AI機能一覧画面
const AIFeatureListScreen = ({ navigation }: NavigationProps) => {
  const features: ListIconProps[] = [
    { name: 'AIドキュメント', icon: 'description', color: '#ff6b6b', screen: 'Documents' },
    { name: 'AIメディア', icon: 'video-library', color: '#95e1d3', screen: 'Media' },
    { name: 'AI会議', icon: 'meeting-room', color: '#f38181', screen: 'Meeting' },
    { name: 'AIチャット', icon: 'chat', color: '#aa96da', screen: 'Chat' },
    { name: 'AI OCR', icon: 'document-scanner', color: '#fcbad3', screen: 'OCR' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="AI機能" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {features.map((feature: ListIconProps, index: number) => (
          <Card key={index} style={styles.listCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate(feature.screen)}
              style={styles.listItem}
            >
              <View style={[styles.listIcon, { backgroundColor: feature.color }]}>
                <Icon name={feature.icon} size={24} color="white" />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{feature.name}</Text>
                <Text style={styles.listDescription}>AI機能を利用</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// メインアプリ
const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <MainTabs />
      </NavigationContainer>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statText: {
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  featureCard: {
    marginBottom: 12,
    elevation: 2,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionChip: {
    marginBottom: 8,
    width: '48%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0099ff',
  },
  listCard: {
    marginBottom: 8,
    elevation: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listText: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  switchContainer: {
    justifyContent: 'center',
  },
  statusCard: {
    marginBottom: 24,
    elevation: 2,
  },
  statusContent: {
    padding: 20,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    alignItems: 'center',
  },
  connectButton: {
    margin: 16,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  featureHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  processCard: {
    marginBottom: 24,
    elevation: 2,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  processButton: {
    marginBottom: 8,
  },
  resultCard: {
    marginBottom: 24,
    elevation: 2,
    padding: 16,
  },
  resultTitle: {
    marginBottom: 8,
  },
  shareButton: {
    marginTop: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    elevation: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

export default App;
