import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { cardsByLanguage, languages } from './src/data/cards';
import { theme } from './src/theme';
import { FlashCard, LanguageKey, LanguageMeta, RouteKey } from './src/types';

type LanguageProgress = Record<
  LanguageKey,
  {
    progress: number;
    completedLevels: number[];
    activeLevel: number;
  }
>;

const levelCount = 6;

const initialProgress: LanguageProgress = {
  python: { progress: 75, completedLevels: [1, 2], activeLevel: 3 },
  java: { progress: 40, completedLevels: [1], activeLevel: 2 },
  cpp: { progress: 15, completedLevels: [], activeLevel: 1 },
};

export default function App() {
  const [route, setRoute] = useState<RouteKey>('login');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>('python');
  const [authName, setAuthName] = useState('Олена');
  const [authNickname, setAuthNickname] = useState('stackly_user');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [languageProgress, setLanguageProgress] = useState<LanguageProgress>(initialProgress);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [sessionStartIndex, setSessionStartIndex] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [languageUi, setLanguageUi] = useState<'Українська' | 'English'>('Українська');

  const selectedMeta =
    languages.find((language) => language.key === selectedLanguage) ?? languages[0];
  const allCards = cardsByLanguage[selectedLanguage];
  const sessionCards = useMemo(() => {
    const normalizedStart = Math.min(sessionStartIndex, Math.max(0, allCards.length - 10));
    return allCards.slice(normalizedStart, normalizedStart + 10);
  }, [allCards, sessionStartIndex]);
  const currentCard = sessionCards[flashIndex] ?? sessionCards[0];

  const overallProgress = Math.round(
    (languageProgress.python.progress +
      languageProgress.java.progress +
      languageProgress.cpp.progress) /
      3
  );

  const openLanguage = (language: LanguageKey) => {
    setSelectedLanguage(language);
    setCurrentLevel(languageProgress[language].activeLevel);
    setSessionStartIndex(0);
    setFlashIndex(0);
    setKnownCount(0);
    setFlipped(false);
    setRoute('levels');
  };

  const startDeck = (startIndex = 0, level = currentLevel) => {
    setCurrentLevel(level);
    setSessionStartIndex(startIndex);
    setFlashIndex(0);
    setKnownCount(0);
    setFlipped(false);
    setRoute('flash');
  };

  const finishSession = (score: number) => {
    setLanguageProgress((current) => {
      const active = current[selectedLanguage];
      const nextProgress = Math.min(100, active.progress + Math.round((score / sessionCards.length) * 15));
      const completed = active.completedLevels.includes(currentLevel)
        ? active.completedLevels
        : [...active.completedLevels, currentLevel].sort((a, b) => a - b);

      return {
        ...current,
        [selectedLanguage]: {
          progress: nextProgress,
          completedLevels: completed,
          activeLevel: Math.min(levelCount, Math.max(active.activeLevel, currentLevel + 1)),
        },
      };
    });

    setKnownCount(score);
    setRoute('result');
  };

  const answerCard = (known: boolean) => {
    const nextKnownCount = known ? knownCount + 1 : knownCount;
    const isLastCard = flashIndex === sessionCards.length - 1;
    if (isLastCard) {
      finishSession(nextKnownCount);
      return;
    }

    setKnownCount(nextKnownCount);
    setFlashIndex((value) => value + 1);
    setFlipped(false);
  };

  const profileRows = languages.map((language) => ({
    key: language.key,
    label: language.label,
    progress: languageProgress[language.key].progress,
    description: `${languageProgress[language.key].progress}% завершено • ${languageProgress[language.key].completedLevels.length}/${levelCount} рівнів пройдено • активний рівень ${languageProgress[language.key].activeLevel}`,
  }));

  const handleProfilePhotoPick = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Доступ потрібен', 'Дозволь доступ до фото, щоб оновити аватар.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setProfilePhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Не вдалося завантажити фото', 'Спробуй ще раз.');
    }
  };

  return (
    <SafeAreaView style={styles.app}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" />

      {route === 'login' && (
        <AuthScreen
          mode="login"
          nickname={authNickname}
          name={authName}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onNicknameChange={setAuthNickname}
          onNameChange={setAuthName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirmPassword}
          onPrimary={() => setRoute('language')}
          onSwitch={() => setRoute('signup')}
        />
      )}

      {route === 'signup' && (
        <AuthScreen
          mode="signup"
          nickname={authNickname}
          name={authName}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onNicknameChange={setAuthNickname}
          onNameChange={setAuthName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirmPassword}
          onPrimary={() => setRoute('language')}
          onSwitch={() => setRoute('login')}
        />
      )}

      {route === 'language' && (
        <LanguageSelectScreen
          selectedLanguage={selectedLanguage}
          onSelect={setSelectedLanguage}
          onContinue={() => openLanguage(selectedLanguage)}
        />
      )}

      {route === 'levels' && (
        <LevelsScreen
          language={selectedMeta}
          progress={languageProgress[selectedLanguage]}
          onBack={() => setRoute('language')}
          onOpenDeck={() => setRoute('deck')}
          onOpenLevel={(level) => {
            setCurrentLevel(level);
            startDeck(levelToStartIndex(level, allCards.length), level);
          }}
        />
      )}

      {route === 'deck' && (
        <DeckScreen
          language={selectedMeta}
          cards={allCards}
          progress={languageProgress[selectedLanguage].progress}
          onBack={() => setRoute('levels')}
          onStart={() => startDeck(levelToStartIndex(currentLevel, allCards.length), currentLevel)}
          onPreview={(index) => startDeck(index, currentLevel)}
        />
      )}

      {route === 'flash' && currentCard && (
        <FlashScreen
          language={selectedMeta}
          card={currentCard}
          index={flashIndex}
          total={sessionCards.length}
          flipped={flipped}
          onToggleFlip={() => setFlipped((value) => !value)}
          onKnow={() => answerCard(true)}
          onRetry={() => answerCard(false)}
          onBack={() => setRoute('deck')}
        />
      )}

      {route === 'result' && (
        <ResultScreen
          language={selectedMeta}
          percent={Math.round((knownCount / sessionCards.length) * 100)}
          progress={languageProgress}
          onContinue={() => setRoute('levels')}
          onRetry={() => startDeck(levelToStartIndex(currentLevel, allCards.length), currentLevel)}
          onLevels={() => setRoute('levels')}
        />
      )}

      {route === 'profile' && (
        <ProfileScreen
          activeLanguage={selectedLanguage}
          nickname={authNickname}
          name={authName}
          photoUri={profilePhotoUri}
          totalProgress={overallProgress}
          rows={profileRows}
          languageUi={languageUi}
          onSaveName={setAuthName}
          onPickPhoto={handleProfilePhotoPick}
          onToggleUi={() =>
            setLanguageUi((value) => (value === 'Українська' ? 'English' : 'Українська'))
          }
          onBack={() => setRoute('levels')}
        />
      )}

      {route !== 'profile' && route !== 'login' && route !== 'signup' && (
        <FloatingProfileButton onPress={() => setRoute('profile')} />
      )}
    </SafeAreaView>
  );
}

function AuthScreen(props: {
  mode: 'login' | 'signup';
  nickname: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  onNicknameChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onPrimary: () => void;
  onSwitch: () => void;
}) {
  const isLogin = props.mode === 'login';
  return (
    <ScreenShell scroll={false}>
      <Hero symbol="S" title="Stackly" subtitle="Ваш шлях до коду" />
      <GlowDivider />
      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>{isLogin ? 'Увійти' : 'Зареєструватися'}</Text>
        <Text style={styles.bodyText}>
          {isLogin
            ? 'Продовжуй навчання з картками та рівнями.'
            : 'Створи акаунт і почни проходити картки по Python, Java та C++.'}
        </Text>
        {!isLogin && (
          <InputField
            value={props.nickname}
            onChangeText={props.onNicknameChange}
            placeholder="Нікнейм"
            autoCapitalize="none"
          />
        )}
        {!isLogin && (
          <InputField value={props.name} onChangeText={props.onNameChange} placeholder="Ім’я" />
        )}
        <InputField
          value={props.email}
          onChangeText={props.onEmailChange}
          placeholder="Електронна пошта"
        />
        <InputField
          value={props.password}
          onChangeText={props.onPasswordChange}
          placeholder="Пароль"
          secureTextEntry
        />
        {!isLogin && (
          <InputField
            value={props.confirmPassword}
            onChangeText={props.onConfirmChange}
            placeholder="Підтвердження пароля"
            secureTextEntry
          />
        )}
        <PrimaryButton label={isLogin ? 'Увійти' : 'Зареєструватися'} onPress={props.onPrimary} />
        <Text style={styles.captionText}>{isLogin ? 'Немає акаунта?' : 'Вже маєш акаунт?'}</Text>
        <SecondaryLink label={isLogin ? 'Зареєструватися' : 'Увійти'} onPress={props.onSwitch} />
      </View>
    </ScreenShell>
  );
}

function LanguageSelectScreen(props: {
  selectedLanguage: LanguageKey;
  onSelect: (language: LanguageKey) => void;
  onContinue: () => void;
}) {
  return (
    <ScreenShell scroll={false}>
      <Hero symbol="S" title="Stackly" subtitle="Яку мову будемо вивчати?" />
      <GlowDivider />
      <View style={styles.languageRow}>
        {languages.map((language) => (
          <LanguageCard
            key={language.key}
            language={language}
            selected={language.key === props.selectedLanguage}
            onPress={() => props.onSelect(language.key)}
          />
        ))}
      </View>
      <Text style={styles.selectedText}>
        Обрано: {languages.find((language) => language.key === props.selectedLanguage)?.label}
      </Text>
      <PrimaryButton label="Продовжити" onPress={props.onContinue} />
    </ScreenShell>
  );
}

function LevelsScreen(props: {
  language: LanguageMeta;
  progress: LanguageProgress[LanguageKey];
  onOpenLevel: (level: number) => void;
  onOpenDeck: () => void;
  onBack: () => void;
}) {
  const unlockedUntil = Math.max(3, props.progress.activeLevel);
  return (
    <ScreenShell>
      <Hero symbol={props.language.symbol} title={props.language.label} subtitle={props.language.profileSummary} />
      <GlowDivider />
      <View style={styles.listPanel}>
        <Text style={styles.screenTitle}>Рівні</Text>
        <Panel>
          <Text style={styles.panelTitle}>Прогрес відкриття</Text>
          <ProgressBar value={props.progress.progress / 100} />
          <Text style={styles.captionText}>Перші 3 рівні вже доступні</Text>
        </Panel>
        {props.language.levelTopics.map((topic, index) => {
          const level = index + 1;
          const completed = props.progress.completedLevels.includes(level);
          const active = level === props.progress.activeLevel || (level === 3 && props.progress.activeLevel < 3);
          const unlocked = level <= unlockedUntil;
          return (
            <LevelRow
              key={level}
              number={level}
              title={`Рівень ${level}`}
              subtitle={topic}
              state={completed ? 'completed' : active ? 'active' : unlocked ? 'open' : 'locked'}
              onPress={() => {
                if (unlocked) {
                  props.onOpenLevel(level);
                }
              }}
            />
          );
        })}
        <PrimaryButton label="Продовжити навчання" onPress={props.onOpenDeck} />
        <SecondaryLink label="Змінити мову" onPress={props.onBack} />
      </View>
    </ScreenShell>
  );
}

function DeckScreen(props: {
  language: LanguageMeta;
  cards: FlashCard[];
  progress: number;
  onStart: () => void;
  onPreview: (index: number) => void;
  onBack: () => void;
}) {
  return (
    <ScreenShell>
      <Hero symbol={props.language.symbol} title={props.language.label} subtitle="20 карток для повторення" />
      <GlowDivider />
      <View style={styles.listPanel}>
        <Text style={styles.screenTitle}>Картки</Text>
        <Panel>
          <Text style={styles.panelTitle}>Огляд deck</Text>
          <ProgressBar value={props.progress / 100} />
          <Text style={styles.captionText}>20 карток для {props.language.label}</Text>
        </Panel>
        {props.cards.map((card, index) => (
          <DeckRow
            key={card.id}
            index={index + 1}
            title={`Картка ${index + 1}`}
            subtitle={compactSubtitle(card.question)}
            onPress={() => props.onPreview(index)}
          />
        ))}
        <PrimaryButton label="Почати deck" onPress={props.onStart} />
        <SecondaryLink label="До рівнів" onPress={props.onBack} />
      </View>
    </ScreenShell>
  );
}

function FlashScreen(props: {
  language: LanguageMeta;
  card: FlashCard;
  index: number;
  total: number;
  flipped: boolean;
  onToggleFlip: () => void;
  onKnow: () => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <ScreenShell>
      <View style={styles.flashHeader}>
        <Text style={styles.screenTitle}>
          {props.language.label}: Картка {props.index + 1}
        </Text>
        <Text style={styles.bodyText}>
          {props.flipped
            ? `Відповідь ${props.index + 1} / ${props.total}`
            : `Картка ${props.index + 1} / ${props.total}`}
        </Text>
        <ProgressBar value={(props.index + 1) / props.total} />
        <Text style={styles.tapText}>
          {props.flipped
            ? 'Картка перевернулась. Торкнись ще раз, щоб повернути.'
            : 'Натисни на картку, щоб побачити відповідь'}
        </Text>
      </View>
      <FlashCardView
        question={props.card.question}
        answer={props.card.answer}
        hint={props.card.hint}
        flipped={props.flipped}
        onToggleFlip={props.onToggleFlip}
        onKnow={props.onKnow}
        onRetry={props.onRetry}
      />
      <SecondaryLink label="До deck" onPress={props.onBack} />
    </ScreenShell>
  );
}

function ResultScreen(props: {
  language: LanguageMeta;
  percent: number;
  progress: LanguageProgress;
  onContinue: () => void;
  onRetry: () => void;
  onLevels: () => void;
}) {
  return (
    <ScreenShell>
      <View style={styles.centeredHeader}>
        <Text style={styles.screenTitle}>Результат рівня</Text>
        <Text style={styles.bodyText}>Ти завершив 10 flash cards</Text>
      </View>
      <ProgressRing value={props.percent} />
      <View style={styles.resultMessageWrap}>
        <Text style={styles.resultTitle}>Чудова робота!</Text>
        <Text style={styles.selectedText}>Ти прогресуєш!</Text>
      </View>
      <Panel>
        <Text style={styles.panelTitle}>Загальний прогрес</Text>
        <Text style={styles.bodyText}>
          Так тримати! {props.percent}% відповідей були правильними.
        </Text>
        <View style={styles.miniProgressRow}>
          {languages.map((language) => (
            <MiniStat
              key={language.key}
              label={language.label}
              value={`${props.progress[language.key].progress}%`}
              active={language.key === props.language.key}
            />
          ))}
        </View>
      </Panel>
      <PrimaryButton label="Далі" onPress={props.onContinue} />
      <SecondaryButton label="Спробувати ще раз" onPress={props.onRetry} />
      <SecondaryButton label="До рівнів" onPress={props.onLevels} />
    </ScreenShell>
  );
}

function ProfileScreen(props: {
  activeLanguage: LanguageKey;
  nickname: string;
  name: string;
  photoUri: string | null;
  totalProgress: number;
  rows: { key: LanguageKey; label: string; progress: number; description: string }[];
  languageUi: 'Українська' | 'English';
  onSaveName: (value: string) => void;
  onPickPhoto: () => void;
  onToggleUi: () => void;
  onBack: () => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(props.name);

  useEffect(() => {
    setDraftName(props.name);
  }, [props.name]);

  const initials = props.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || props.nickname.slice(0, 2).toUpperCase();

  return (
    <ScreenShell>
      <Text style={styles.screenTitle}>Профіль</Text>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            {props.photoUri ? (
              <Image source={{ uri: props.photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
        </View>
        <Text style={styles.profileName}>{props.name}</Text>
        <Text style={styles.profileHandle}>@{props.nickname}</Text>
        <Text style={styles.captionText}>Початківець у програмуванні</Text>
      </View>
      <Panel>
        <Text style={styles.panelTitle}>Загальний прогрес</Text>
        <ProgressBar value={props.totalProgress / 100} />
        <Text style={styles.selectedText}>{props.totalProgress}% завершено</Text>
      </Panel>
      <View style={styles.profileActionRow}>
        <SmallAction
          label={isEditingName ? 'Скасувати' : "Редагувати ім'я"}
          onPress={() => {
            setDraftName(props.name);
            setIsEditingName((value) => !value);
          }}
        />
        <SmallAction label="Змінити фото" onPress={props.onPickPhoto} />
      </View>
      {isEditingName && (
        <Panel style={styles.panelActive}>
          <Text style={styles.panelTitle}>Нове ім’я профілю</Text>
          <InputField value={draftName} onChangeText={setDraftName} placeholder="Введи ім’я" />
          <View style={styles.profileEditorActions}>
            <SecondaryButton
              label="Скасувати"
              onPress={() => {
                setDraftName(props.name);
                setIsEditingName(false);
              }}
            />
            <PrimaryButton
              label="Зберегти"
              onPress={() => {
                const normalizedName = draftName.trim();
                if (!normalizedName) {
                  Alert.alert("Ім'я порожнє", "Введи ім'я, яке хочеш бачити в профілі.");
                  return;
                }

                props.onSaveName(normalizedName);
                setIsEditingName(false);
              }}
            />
          </View>
        </Panel>
      )}
      <Panel>
        <Text style={styles.panelTitle}>Мова інтерфейсу</Text>
        <View style={styles.miniProgressRow}>
          <LanguageToggle
            label="Українська"
            active={props.languageUi === 'Українська'}
            onPress={props.onToggleUi}
          />
          <LanguageToggle
            label="English"
            active={props.languageUi === 'English'}
            onPress={props.onToggleUi}
          />
        </View>
      </Panel>
      {props.rows.map((row) => (
        <Panel key={row.key} style={row.key === props.activeLanguage ? styles.panelActive : undefined}>
          <Text style={styles.panelTitle}>{row.label}</Text>
          <ProgressBar value={row.progress / 100} />
          <Text style={row.key === props.activeLanguage ? styles.selectedText : styles.bodyText}>
            {row.description}
          </Text>
        </Panel>
      ))}
      <SecondaryLink label="Назад" onPress={props.onBack} />
    </ScreenShell>
  );
}

function FlashCardView(props: {
  question: string;
  answer: string;
  hint?: string;
  flipped: boolean;
  onToggleFlip: () => void;
  onKnow: () => void;
  onRetry: () => void;
}) {
  const { width } = useWindowDimensions();
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: props.flipped ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [flipAnim, props.flipped]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 90) {
            props.onKnow();
          } else if (gesture.dx < -90) {
            props.onRetry();
          }
        },
      }),
    [props]
  );

  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const cardWidth = Math.min(width - 48, 360);

  return (
    <>
      <View style={[styles.cardStackBack, { width: cardWidth - 20 }]} />
      <Pressable onPress={props.onToggleFlip} {...panResponder.panHandlers}>
        <View style={[styles.flashCardShell, { width: cardWidth }]}>
          <Animated.View
            style={[
              styles.flipFace,
              {
                transform: [{ rotateY: frontRotation }],
                opacity: props.flipped ? 0 : 1,
              },
            ]}>
            <View style={styles.cardChip}>
              <Text style={styles.cardChipText}>Питання</Text>
            </View>
            <Text style={styles.flashQuestion}>{props.question}</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{props.hint ?? 'Подумай над відповіддю.'}</Text>
            </View>
            <Text style={styles.bodyText}>Торкнись картки, щоб побачити відповідь.</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.flipFace,
              styles.flipFaceBack,
              {
                transform: [{ rotateY: backRotation }],
                opacity: props.flipped ? 1 : 0,
              },
            ]}>
            <View style={styles.cardChip}>
              <Text style={styles.cardChipText}>Відповідь</Text>
            </View>
            <Text style={styles.flashQuestion}>{props.question}</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{props.answer}</Text>
            </View>
            <Text style={styles.bodyText}>{props.hint ?? 'Відповідь показана.'}</Text>
          </Animated.View>
        </View>
      </Pressable>
      <View style={styles.gestureRow}>
        <ActionChip
          title="← Повторити"
          subtitle="Не знаєш відповідь"
          variant="secondary"
          onPress={props.onRetry}
        />
        <ActionChip
          title={props.flipped ? 'Далі →' : 'Знаю →'}
          subtitle={props.flipped ? 'Наступна картка' : 'Свайп праворуч'}
          variant="primary"
          onPress={props.onKnow}
        />
      </View>
      <Text style={styles.footerHint}>{props.flipped ? 'Відповідь показана' : 'Торкнись картки'}</Text>
    </>
  );
}

function ScreenShell(props: { children: React.ReactNode; scroll?: boolean }) {
  const content = (
    <View style={styles.shell}>
      <StatusBarRow />
      <BackgroundLines />
      <View style={styles.contentWrap}>{props.children}</View>
    </View>
  );

  if (props.scroll === false) {
    return content;
  }

  return (
    <ScrollView
      style={styles.shell}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <StatusBarRow />
      <BackgroundLines />
      <View style={styles.contentWrap}>{props.children}</View>
    </ScrollView>
  );
}

function StatusBarRow() {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusTime}>9:41</Text>
      <Text style={styles.statusDots}>● ● ●</Text>
    </View>
  );
}

function BackgroundLines() {
  return (
    <>
      <View style={styles.glowOrb} />
      <View style={styles.horizontalLine} />
      <View style={styles.sideConnector} />
      <View style={styles.dot} />
    </>
  );
}

function Hero(props: { symbol: string; title: string; subtitle: string }) {
  return (
    <View style={styles.heroWrap}>
      <Text style={styles.heroSymbol}>{props.symbol}</Text>
      <Text style={styles.heroTitle}>{props.title}</Text>
      <Text style={styles.heroSubtitle}>{props.subtitle}</Text>
    </View>
  );
}

function GlowDivider() {
  return <View style={styles.divider} />;
}

function InputField(props: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <TextInput
      value={props.value}
      onChangeText={props.onChangeText}
      placeholder={props.placeholder}
      placeholderTextColor={theme.colors.locked}
      secureTextEntry={props.secureTextEntry}
      autoCapitalize={props.autoCapitalize ?? 'sentences'}
      style={styles.input}
    />
  );
}

function PrimaryButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.buttonPrimary, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{props.label}</Text>
    </Pressable>
  );
}

function SecondaryButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{props.label}</Text>
    </Pressable>
  );
}

function SecondaryLink(props: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress}>
      <Text style={styles.linkText}>{props.label}</Text>
    </Pressable>
  );
}

function LanguageCard(props: {
  language: LanguageMeta;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.languageCard,
        props.selected && styles.languageCardSelected,
        pressed && styles.buttonPressed,
      ]}>
      <Text style={styles.languageSymbol}>{props.language.symbol}</Text>
      <Text style={styles.languageTitle}>{props.language.label}</Text>
      <Text style={[styles.languageDescription, props.selected && styles.languageDescriptionSelected]}>
        {props.language.description}
      </Text>
    </Pressable>
  );
}

function LevelRow(props: {
  number: number;
  title: string;
  subtitle: string;
  state: 'completed' | 'active' | 'open' | 'locked';
  onPress: () => void;
}) {
  const locked = props.state === 'locked';
  const active = props.state === 'active';

  return (
    <Pressable
      disabled={locked}
      onPress={props.onPress}
      style={[
        styles.levelRow,
        active && styles.levelRowActive,
        locked && styles.levelRowLocked,
      ]}>
      <View style={[styles.levelBadge, active && styles.levelBadgeActive, locked && styles.levelBadgeLocked]}>
        <Text style={styles.levelBadgeText}>{props.number}</Text>
      </View>
      <View style={styles.levelCopy}>
        <Text style={styles.levelTitle}>{props.title}</Text>
        <Text style={[styles.levelSubtitle, active && styles.levelSubtitleActive, locked && styles.levelSubtitleLocked]}>
          {props.subtitle}
        </Text>
      </View>
      <Text style={[styles.levelState, locked && styles.levelStateLocked]}>
        {props.state === 'completed' ? '✓' : props.state === 'active' || props.state === 'open' ? '→' : '🔒'}
      </Text>
    </Pressable>
  );
}

function DeckRow(props: { index: number; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.deckRow}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelBadgeText}>{props.index}</Text>
      </View>
      <View style={styles.levelCopy}>
        <Text style={styles.levelTitle}>{props.title}</Text>
        <Text style={styles.levelSubtitle}>{props.subtitle}</Text>
      </View>
      <Text style={styles.levelState}>→</Text>
    </Pressable>
  );
}

function ProgressBar(props: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(props.value * 100, 100))}%` }]} />
    </View>
  );
}

function ProgressRing(props: { value: number }) {
  return (
    <View style={styles.ringWrap}>
      <View style={styles.ringOuter}>
        <View style={[styles.ringArc, { transform: [{ rotate: `${(props.value / 100) * 360}deg` }] }]} />
        <View style={styles.ringInner}>
          <Text style={styles.ringText}>{props.value}%</Text>
        </View>
      </View>
    </View>
  );
}

function MiniStat(props: { label: string; value: string; active?: boolean }) {
  return (
    <View style={[styles.miniStat, props.active && styles.miniStatActive]}>
      <Text style={styles.miniStatTitle}>{props.label}</Text>
      <Text style={props.active ? styles.selectedText : styles.bodyText}>{props.value}</Text>
    </View>
  );
}

function Panel(props: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.panel, props.style]}>{props.children}</View>;
}

function ActionChip(props: {
  title: string;
  subtitle: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        styles.actionChip,
        props.variant === 'primary' ? styles.actionChipPrimary : styles.actionChipSecondary,
      ]}>
      <Text style={styles.actionTitle}>{props.title}</Text>
      <Text style={props.variant === 'primary' ? styles.selectedText : styles.captionText}>{props.subtitle}</Text>
    </Pressable>
  );
}

function SmallAction(props: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [styles.smallAction, pressed && styles.buttonPressed]}>
      <Text style={styles.smallActionText}>{props.label}</Text>
    </Pressable>
  );
}

function LanguageToggle(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleChip, props.active && styles.toggleChipActive]}>
      <Text style={props.active ? styles.toggleTextActive : styles.toggleText}>{props.label}</Text>
    </Pressable>
  );
}

function FloatingProfileButton(props: { onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.profileFab}>
      <Text style={styles.profileFabText}>Профіль</Text>
    </Pressable>
  );
}

function compactSubtitle(value: string) {
  return value.length > 28 ? `${value.slice(0, 28)}...` : value;
}

function levelToStartIndex(level: number, totalCards: number) {
  const chunkCount = Math.max(1, Math.ceil(totalCards / 10));
  const chunkIndex = (level - 1) % chunkCount;
  return chunkIndex * 10;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: theme.colors.bg },
  shell: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { paddingBottom: 120 },
  contentWrap: { paddingHorizontal: 24, paddingBottom: 40, gap: 16 },
  statusRow: {
    height: 62,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTime: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  statusDots: { color: theme.colors.text, fontSize: 11, fontWeight: '700' },
  glowOrb: {
    position: 'absolute',
    top: 80,
    left: 110,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(79, 212, 255, 0.12)',
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 32,
  },
  horizontalLine: {
    position: 'absolute',
    top: 310,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(111, 214, 255, 0.5)',
  },
  sideConnector: {
    position: 'absolute',
    top: 330,
    left: 0,
    width: 78,
    height: 2,
    backgroundColor: 'rgba(95, 212, 255, 0.65)',
  },
  dot: {
    position: 'absolute',
    top: 300,
    left: 30,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.glow,
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  heroWrap: { alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 12 },
  heroSymbol: {
    color: theme.colors.text,
    fontSize: 54,
    fontWeight: '700',
    textShadowColor: 'rgba(106, 221, 255, 0.6)',
    textShadowRadius: 16,
  },
  heroTitle: { color: theme.colors.text, fontSize: 34, fontWeight: '700' },
  heroSubtitle: { color: theme.colors.muted, fontSize: 18, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(111, 214, 255, 0.55)', marginBottom: 12 },
  formSection: { gap: 14 },
  screenTitle: { color: theme.colors.text, fontSize: theme.type.title, fontWeight: '700' },
  bodyText: { color: theme.colors.muted, fontSize: theme.type.body, lineHeight: 22 },
  captionText: { color: theme.colors.muted, fontSize: 13 },
  selectedText: { color: theme.colors.border, fontSize: theme.type.body, fontWeight: '600' },
  linkText: {
    color: theme.colors.border,
    fontSize: 17,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  tapText: { color: theme.colors.border, fontSize: 13, fontWeight: '500' },
  input: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#6FCFFF',
    backgroundColor: 'rgba(18, 33, 58, 0.9)',
    paddingHorizontal: 18,
    color: theme.colors.text,
    fontSize: 16,
  },
  buttonPrimary: {
    height: 62,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panelMuted,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  buttonSecondary: {
    height: 56,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#6E7A8B',
    backgroundColor: '#1E2733',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  buttonText: { color: theme.colors.text, fontSize: 18, fontWeight: '600' },
  languageRow: { flexDirection: 'row', gap: 10 },
  languageCard: {
    flex: 1,
    minHeight: 220,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  languageCardSelected: {
    backgroundColor: 'rgba(24, 49, 75, 0.9)',
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  languageSymbol: { color: theme.colors.text, fontSize: 34, fontWeight: '700' },
  languageTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  languageDescription: { color: theme.colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  languageDescriptionSelected: { color: theme.colors.text },
  listPanel: { gap: 10 },
  panel: {
    gap: 10,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
  },
  panelActive: { backgroundColor: 'rgba(23, 50, 75, 0.92)' },
  panelTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: '#1A2A3E', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: theme.colors.accent },
  levelRow: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(23, 50, 75, 0.9)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelRowActive: {
    backgroundColor: 'rgba(26, 53, 80, 0.94)',
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  levelRowLocked: { backgroundColor: 'rgba(43, 49, 61, 0.85)', borderColor: '#6E7A8B' },
  deckRow: {
    minHeight: 54,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(23, 50, 75, 0.9)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#1E425F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeActive: { backgroundColor: '#214B6C' },
  levelBadgeLocked: { backgroundColor: '#3A404C' },
  levelBadgeText: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  levelCopy: { flex: 1, gap: 2 },
  levelTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  levelSubtitle: { color: theme.colors.muted, fontSize: 14 },
  levelSubtitleActive: { color: theme.colors.text },
  levelSubtitleLocked: { color: theme.colors.locked },
  levelState: { color: theme.colors.border, fontSize: 22, fontWeight: '700' },
  levelStateLocked: { color: theme.colors.locked },
  flashHeader: { gap: 8 },
  cardStackBack: {
    height: 336,
    borderRadius: 30,
    backgroundColor: 'rgba(19, 35, 60, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(124, 215, 255, 0.55)',
    position: 'absolute',
    top: 270,
    alignSelf: 'center',
    transform: [{ rotate: '4deg' }],
  },
  flashCardShell: { height: 364, alignSelf: 'center', marginTop: 24, position: 'relative' },
  flipFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 30,
    padding: 22,
    gap: 18,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    backfaceVisibility: 'hidden',
  },
  flipFaceBack: { backgroundColor: 'rgba(24, 49, 75, 0.92)' },
  cardChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.chip,
  },
  cardChipText: { color: theme.colors.border, fontSize: 13, fontWeight: '600' },
  flashQuestion: { color: theme.colors.text, fontSize: 24, lineHeight: 28, fontWeight: '700' },
  codeBlock: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#335A7A',
    backgroundColor: '#0D1727',
    padding: 16,
  },
  codeText: { color: theme.colors.text, fontSize: 20, lineHeight: 28 },
  gestureRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionChip: { flex: 1, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 16, gap: 6 },
  actionChipPrimary: {
    backgroundColor: 'rgba(23, 50, 75, 0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  actionChipSecondary: {
    backgroundColor: '#1E2733',
    borderWidth: 1,
    borderColor: '#6E7A8B',
  },
  actionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  footerHint: {
    color: theme.colors.muted,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  centeredHeader: { alignItems: 'center', gap: 8 },
  ringWrap: { alignItems: 'center', marginVertical: 12 },
  ringOuter: {
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#17304A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringArc: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 999,
    borderWidth: 18,
    borderColor: theme.colors.accent,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringInner: {
    width: 138,
    height: 138,
    borderRadius: 999,
    backgroundColor: '#09131F',
    borderWidth: 1,
    borderColor: '#325C7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { color: theme.colors.text, fontSize: 42, fontWeight: '700' },
  resultMessageWrap: { alignItems: 'center', gap: 4 },
  resultTitle: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  miniProgressRow: { flexDirection: 'row', gap: 10 },
  miniStat: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    gap: 4,
  },
  miniStatActive: { backgroundColor: 'rgba(23, 50, 75, 0.92)' },
  miniStatTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  avatarWrap: { alignItems: 'center', gap: 10 },
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#14324A',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: '#09131F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  profileName: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  profileHandle: { color: theme.colors.border, fontSize: 16, fontWeight: '600' },
  profileActionRow: { flexDirection: 'row', gap: 10 },
  profileEditorActions: { flexDirection: 'row', gap: 10 },
  smallAction: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(23, 50, 75, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallActionText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  toggleChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#45637F',
    backgroundColor: '#111C2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleChipActive: { backgroundColor: 'rgba(23, 50, 75, 0.92)', borderColor: theme.colors.border },
  toggleText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  profileFab: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(23, 50, 75, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: theme.colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  profileFabText: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
});
