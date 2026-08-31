import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SpeakingTopic,
  SpeakingPrompt,
  SpeakingAttempt,
  UserSpeakingStats,
} from '../services/speakingService';
import { speakingService, getLevelFromPoints, getProgressToNextLevel, SPEAKING_LEVELS } from '../services/speakingService';
import { toast } from 'react-toastify';

interface SpeakingPracticeProps {
  spaceId: number;
}

export default function SpeakingPractice({ spaceId: _spaceId }: SpeakingPracticeProps) {
  const [topics, setTopics] = useState<SpeakingTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopic | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<SpeakingPrompt | null>(null);
  const [prompts, setPrompts] = useState<SpeakingPrompt[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [stats, setStats] = useState<UserSpeakingStats | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [attempts, setAttempts] = useState<SpeakingAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<SpeakingAttempt | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(undefined);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      const data = await speakingService.getTopics(selectedDifficulty);
      setTopics(data);
    } catch (error) {
      console.error('Failed to load topics:', error);
      setTopics([]); // Set empty array on error
    }
  }, [selectedDifficulty]);

  const loadStats = useCallback(async () => {
    try {
      const data = await speakingService.getMyStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats on error
      setStats({
        totalAttempts: 0,
        totalTimeMinutes: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        currentLevel: 1,
        nextLevelPoints: 100,
        topicsCompleted: 0,
        totalTopics: 0,
        weeklyGoalMinutes: 0,
        weeklyProgressMinutes: 0,
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadTopics(), loadStats()]);
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadTopics, loadStats]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const selectTopic = async (topic: SpeakingTopic) => {
    setSelectedTopic(topic);
    setPrompts(topic.prompts || []);
    setCurrentPromptIndex(0);
    setCurrentPrompt(topic.prompts?.[0] || null);
    setShowResult(false);
    setLastAttempt(null);

    try {
      const myAttempts = await speakingService.getMyAttempts(topic.id);
      setAttempts(myAttempts);
    } catch (error) {
      console.error('Failed to load attempts:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await saveAttempt(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (currentPrompt && prev >= currentPrompt.maxDurationSeconds - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const saveAttempt = async (audioBlob: Blob) => {
    if (!selectedTopic || !currentPrompt) return;

    try {
      const attempt = await speakingService.saveAttempt({
        topicId: selectedTopic.id,
        promptId: currentPrompt.id,
        audioBlob,
        durationSeconds: recordingTime,
      });
      setLastAttempt(attempt);
      setShowResult(true);
      toast.success('Đã lưu bài luyện nói!');
      await loadStats();
    } catch (error) {
      toast.error('Không thể lưu bài luyện nói. Vui lòng thử lại.');
      console.error('Failed to save attempt:', error);
    }
  };

  const playLastRecording = () => {
    if (lastAttempt?.audioUrl) {
      const audio = new Audio(lastAttempt.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingBack(false);
      audio.play();
      setIsPlayingBack(true);
    }
  };

  const nextPrompt = () => {
    if (currentPromptIndex < prompts.length - 1) {
      const nextIndex = currentPromptIndex + 1;
      setCurrentPromptIndex(nextIndex);
      setCurrentPrompt(prompts[nextIndex]);
      setShowResult(false);
      setLastAttempt(null);
    } else {
      toast.success('Bạn đã hoàn thành tất cả các câu hỏi trong chủ đề này!');
    }
  };

  const goBackToTopics = () => {
    setSelectedTopic(null);
    setCurrentPrompt(null);
    setPrompts([]);
    setShowResult(false);
    setLastAttempt(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#06b6d4';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const currentLevel = stats ? getLevelFromPoints(stats.totalPoints) : SPEAKING_LEVELS[0];
  const progress = stats ? getProgressToNextLevel(stats.totalPoints) : { current: 0, required: 100, percentage: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level Progress Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white animate-float" style={{ filter: 'blur(40px)' }} />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentLevel.icon}</span>
              <div>
                <p className="text-sm text-white/70">Cấp độ hiện tại</p>
                <h3 className="text-xl font-bold">Level {currentLevel.level}: {currentLevel.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Điểm</p>
              <p className="text-2xl font-bold">{stats?.totalPoints || 0} XP</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/70 mb-2">
              <span>{progress.current} / {progress.required === Infinity ? '∞' : progress.required} XP</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {currentLevel.maxPoints !== Infinity && (
              <p className="text-xs text-white/60 mt-2">
                Cần {currentLevel.maxPoints - (stats?.totalPoints || 0)} XP để lên level {currentLevel.level + 1}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.totalAttempts || 0}</p>
              <p className="text-xs text-white/70">Bài luyện</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.topicsCompleted || 0}</p>
              <p className="text-xs text-white/70">Chủ đề</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(stats?.averageScore || 0)}</p>
              <p className="text-xs text-white/70">Điểm TB</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
              <p className="text-xs text-white/70">Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Filter */}
      {!selectedTopic && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 font-medium">Độ khó:</span>
          <button
            onClick={() => setSelectedDifficulty(undefined)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedDifficulty === undefined
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setSelectedDifficulty(level)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedDifficulty === level
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cấp {level}
            </button>
          ))}
        </div>
      )}

      {/* Topic Selection */}
      {!selectedTopic ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => {
            const topicLevel = getLevelFromPoints(topic.difficulty * 100);
            return (
              <button
                key={topic.id}
                onClick={() => selectTopic(topic)}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: `${topicLevel.color}20` }}
                  >
                    {topicLevel.icon}
                  </span>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${topicLevel.color}20`, color: topicLevel.color }}
                  >
                    Level {topicLevel.level}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{topic.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {topic.prompts?.length || 0} câu
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {topic.estimatedMinutes} phút
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Speaking Practice Area */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goBackToTopics}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h3 className="font-bold text-white">{selectedTopic.title}</h3>
                <p className="text-sm text-white/70">
                  Câu {currentPromptIndex + 1} / {prompts.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                ⏱️ {formatTime(recordingTime)} / {formatTime(currentPrompt?.maxDurationSeconds || 60)}
              </span>
            </div>
          </div>

          {/* Prompt Area */}
          <div className="p-6">
            {showResult && lastAttempt ? (
              /* Results */
              <div className="animate-fade-in-up">
                <div className="text-center mb-6">
                  <div
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
                    style={{ background: `${getScoreColor(lastAttempt.score || 0)}20` }}
                  >
                    <span className="text-3xl font-bold" style={{ color: getScoreColor(lastAttempt.score || 0) }}>
                      {lastAttempt.score || 0}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Kết quả luyện nói</h3>
                  <p className="text-slate-500">Phản hồi chi tiết từ chuyên gia</p>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Phát âm', score: lastAttempt.pronunciationScore },
                    { label: 'Tốc độ', score: lastAttempt.fluencyScore },
                    { label: 'Ngữ pháp', score: lastAttempt.grammarScore },
                    { label: 'Từ vựng', score: lastAttempt.vocabularyScore },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold" style={{ color: getScoreColor(item.score || 0) }}>
                        {item.score || 0}
                      </p>
                      <p className="text-sm text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                {lastAttempt.feedback && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Nhận xét
                    </h4>
                    <p className="text-indigo-700">{lastAttempt.feedback}</p>
                  </div>
                )}

                {/* Play recording */}
                {lastAttempt.audioUrl && (
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                      onClick={playLastRecording}
                      disabled={isPlayingBack}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {isPlayingBack ? 'Đang phát...' : 'Nghe lại'}
                    </button>
                  </div>
                )}

                {/* Next button */}
                <div className="flex justify-center">
                  <button
                    onClick={nextPrompt}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/30"
                  >
                    {currentPromptIndex < prompts.length - 1 ? 'Câu tiếp theo →' : 'Hoàn thành ✓'}
                  </button>
                </div>
              </div>
            ) : currentPrompt ? (
              /* Practice prompt */
              <div className="animate-fade-in-up">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-6 text-center">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4 font-[family-name:var(--font-display)]">
                    {currentPrompt.question}
                  </h2>
                  {currentPrompt.hint && (
                    <p className="text-slate-600 mb-4">
                      <span className="font-medium">Gợi ý:</span> {currentPrompt.hint}
                    </p>
                  )}
                  {currentPrompt.suggestedVocabulary && currentPrompt.suggestedVocabulary.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentPrompt.suggestedVocabulary.map((word, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm text-indigo-600 border border-indigo-200">
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recording controls */}
                <div className="flex flex-col items-center">
                  {/* Recording indicator */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all ${
                    isRecording
                      ? 'bg-gradient-to-br from-red-500 to-rose-500 animate-pulse shadow-lg shadow-red-500/50'
                      : 'bg-slate-100'
                  }`}>
                    {isRecording ? (
                      <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </div>
                    ) : (
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </div>

                  <p className="text-lg font-medium text-slate-600 mb-6">
                    {isRecording ? 'Đang ghi âm...' : 'Nhấn để bắt đầu nói'}
                  </p>

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-48 py-4 rounded-2xl font-semibold text-lg transition-all ${
                      isRecording
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30'
                    }`}
                  >
                    {isRecording ? '⏹️ Dừng ghi' : '🎤 Bắt đầu nói'}
                  </button>

                  <p className="text-sm text-slate-400 mt-4">
                    Thời gian tối đa: {formatTime(currentPrompt.maxDurationSeconds)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">Không có câu hỏi nào</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent attempts */}
      {!selectedTopic && attempts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-800 mb-4">Bài luyện gần đây</h3>
          <div className="space-y-3">
            {attempts.slice(0, 5).map(attempt => (
              <div key={attempt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">Câu #{attempt.promptId}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(attempt.completedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full font-semibold"
                  style={{ background: `${getScoreColor(attempt.score || 0)}20`, color: getScoreColor(attempt.score || 0) }}
                >
                  {attempt.score || 0} điểm
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
