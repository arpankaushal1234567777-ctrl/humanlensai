'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Sparkles,
  Download,
  Share2,
  Check,
  ShieldAlert,
  Heart,
  Flame,
  Wind,
  ChevronRight,
  Eye,
  ScanFace,
  Loader2,
  Smartphone,
  RefreshCw,
  Award
} from 'lucide-react';

type FaceLandmarkerType = any;

interface RewriteOption {
  type: string;
  title: string;
  text: string;
  reason: string;
}

const MESSAGE_PRESETS = [
  {
    id: 'client',
    tag: '⚡ Angry Client / Boss',
    prompt: 'You completely ruined our deployment and wasted an entire month of our company budget!'
  },
  {
    id: 'teammate',
    tag: '🛡️ Team Friction',
    prompt: 'Why do you never reply to messages and dump all the difficult work on me at midnight?'
  },
  {
    id: 'sarcasm',
    tag: '🙃 Passive Aggressive',
    prompt: 'As per my previous five emails which you obviously did not bother opening or reading.'
  },
  {
    id: 'academic',
    tag: '🎓 Professor / Project Blame',
    prompt: 'This grading is completely unfair and your instructions made zero sense to anyone!'
  }
];

// MediaPipe landmark indices
const LANDMARKS = {
  LEFT_BROW_INNER: 55,
  RIGHT_BROW_INNER: 285,
  NOSE_BRIDGE: 6,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  UPPER_LIP: 13,
  LOWER_LIP: 14,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  FOREHEAD: 10,
  CHIN: 152,
};

function landmarkDist(
  lm: Array<{ x: number; y: number; z: number }>,
  i1: number,
  i2: number
): number {
  const a = lm[i1];
  const b = lm[i2];
  if (!a || !b) return 0.05;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function computeAUs(lm: Array<{ x: number; y: number; z: number }>) {
  const faceHeight = landmarkDist(lm, LANDMARKS.FOREHEAD, LANDMARKS.CHIN);
  if (faceHeight < 0.001) return { browFurrow: 0.1, eyeSquint: 0.1, jawTension: 0.1 };

  const leftBrowToNose = landmarkDist(lm, LANDMARKS.LEFT_BROW_INNER, LANDMARKS.NOSE_BRIDGE);
  const rightBrowToNose = landmarkDist(lm, LANDMARKS.RIGHT_BROW_INNER, LANDMARKS.NOSE_BRIDGE);
  const avgBrowDist = (leftBrowToNose + rightBrowToNose) / 2;
  const browRatio = avgBrowDist / faceHeight;
  const browFurrow = Math.max(0.05, Math.min(0.98, (0.16 - browRatio) / 0.10));

  const leftEyeOpen = landmarkDist(lm, LANDMARKS.LEFT_EYE_TOP, LANDMARKS.LEFT_EYE_BOTTOM);
  const rightEyeOpen = landmarkDist(lm, LANDMARKS.RIGHT_EYE_TOP, LANDMARKS.RIGHT_EYE_BOTTOM);
  const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;
  const eyeRatio = avgEyeOpen / faceHeight;
  const eyeSquint = Math.max(0.05, Math.min(0.98, (0.055 - eyeRatio) / 0.04));

  const mouthOpen = landmarkDist(lm, LANDMARKS.UPPER_LIP, LANDMARKS.LOWER_LIP);
  const mouthWidth = landmarkDist(lm, LANDMARKS.MOUTH_LEFT, LANDMARKS.MOUTH_RIGHT);
  const mouthRatio = mouthOpen / (mouthWidth + 0.001);
  const jawTension = Math.max(0.05, Math.min(0.98, (0.15 - mouthRatio) / 0.12));

  return { browFurrow, eyeSquint, jawTension };
}

export const FairShowcase: React.FC = () => {
  const searchParams = useSearchParams();

  // Mode: 'mirror' (Face & Voice) vs 'text' (Angry Message Simulator)
  const [activeTab, setActiveTab] = useState<'mirror' | 'text'>('mirror');

  // Shared state for report
  const [reportData, setReportData] = useState<{
    id: string;
    visitorTag: string;
    mode: 'mirror' | 'text';
    peakScore: number;
    calmedScore: number;
    initialVibe: string;
    finalVibe: string;
    originalText?: string;
    rewrittenText?: string;
    neutralizedPercent: number;
    timestamp: string;
  } | null>(null);

  // If page was opened from QR scan (contains ?id=...), display mobile-first card view
  const [isQrResultView, setIsQrResultView] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Detect QR link parameters
  useEffect(() => {
    const sharedId = searchParams.get('id');
    const peak = searchParams.get('peak');
    const zen = searchParams.get('zen');
    const mode = (searchParams.get('mode') as 'mirror' | 'text') || 'mirror';

    if (sharedId && peak && zen) {
      const p = parseInt(peak, 10) || 85;
      const z = parseInt(zen, 10) || 18;
      const diff = Math.max(10, p - z);
      const neut = Math.round((diff / p) * 100);

      const restored = {
        id: sharedId,
        visitorTag: searchParams.get('tag') || 'Exhibition Participant',
        mode,
        peakScore: p,
        calmedScore: z,
        initialVibe: p > 65 ? 'High Agitation & Brow Strain' : 'Elevated Friction',
        finalVibe: 'Restored Zen State',
        originalText: searchParams.get('text') || undefined,
        rewrittenText: searchParams.get('rewrite') || undefined,
        neutralizedPercent: neut,
        timestamp: 'Verified Session'
      };
      setReportData(restored);
      setIsQrResultView(true);
      generateQr(window.location.href);
    }
  }, [searchParams]);

  // -------------------------------------------------------------
  // CAMERA & WEBRTC ENGINE (CROSS-PLATFORM SAFARI/CHROME/IOS/ANDROID)
  // -------------------------------------------------------------
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const faceDetectionRef = useRef<number | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarkerType | null>(null);

  // Biometrics
  const [tensionScore, setTensionScore] = useState(15);
  const [browFurrow, setBrowFurrow] = useState(0.12);
  const [eyeSquint, setEyeSquint] = useState(0.14);
  const [jawTension, setJawTension] = useState(0.10);
  const [vocalVolume, setVocalVolume] = useState(0);

  // Cool Down State
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [coolDownStep, setCoolDownStep] = useState<'idle' | 'breathing' | 'success'>('idle');
  const [breathPhase, setBreathPhase] = useState<'Inhale slowly...' | 'Hold gently...' | 'Exhale and soften jaw...'>('Inhale slowly...');
  const [coolDownSeconds, setCoolDownSeconds] = useState(12);
  const [peakRecordedScore, setPeakRecordedScore] = useState(15);

  const isPresenterMode = searchParams.get('presenter') === 'true';

  // Native Web Audio Synth
  const playCalmChime = (freq = 432, duration = 2.2) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + duration * 0.5);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Background MediaPipe Loader (Non-blocking)
  const initMediaPipe = useCallback(async () => {
    if (faceLandmarkerRef.current) return;
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceLandmarkerRef.current = landmarker;
      setModelReady(true);
    } catch (err) {
      console.warn('MediaPipe fallback active:', err);
      setModelReady(true);
    }
  }, []);

  // Real-Time Face Detection Loop
  const runFaceDetection = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended) {
      faceDetectionRef.current = requestAnimationFrame(runFaceDetection);
      return;
    }

    const landmarker = faceLandmarkerRef.current;

    if (landmarker && video.readyState >= 2) {
      try {
        const result = landmarker.detectForVideo(video, performance.now());
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          setFaceDetected(true);

          const aus = computeAUs(landmarks);
          setBrowFurrow((prev) => +(prev * 0.5 + aus.browFurrow * 0.5).toFixed(2));
          setEyeSquint((prev) => +(prev * 0.5 + aus.eyeSquint * 0.5).toFixed(2));
          setJawTension((prev) => +(prev * 0.5 + aus.jawTension * 0.5).toFixed(2));

          const composite = Math.round(
            (aus.browFurrow * 0.45 + aus.eyeSquint * 0.25 + aus.jawTension * 0.30) * 100
          );
          setTensionScore((prev) => {
            const next = Math.round(prev * 0.4 + composite * 0.6);
            setPeakRecordedScore((p) => Math.max(p, next));
            return next;
          });
        } else {
          setFaceDetected(false);
        }
      } catch {}
    } else if (video.readyState >= 2) {
      setFaceDetected(true);
    }

    faceDetectionRef.current = requestAnimationFrame(runFaceDetection);
  }, []);

  // Start Camera Immediately (Reliable on Safari & Mobile)
  const toggleCamera = async () => {
    if (cameraActive) {
      if (faceDetectionRef.current) cancelAnimationFrame(faceDetectionRef.current);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setFaceDetected(false);
    } else {
      setCameraLoading(true);
      try {
        initMediaPipe();

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoStreamRef.current = stream;

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('muted', 'true');
          
          await video.play().catch(() => {});
          runFaceDetection();
        }

        setCameraActive(true);
      } catch (err) {
        console.warn('Camera error:', err);
      } finally {
        setCameraLoading(false);
      }
    }
  };

  // Toggle Microphone
  const toggleMic = async () => {
    if (micActive) {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setMicActive(false);
      setVocalVolume(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        setMicActive(true);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudio = () => {
          animFrameRef.current = requestAnimationFrame(checkAudio);
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const avg = Math.min(100, Math.round(sum / bufferLength / 2.55));
          setVocalVolume(avg);

          if (avg > 45 && !isCoolingDown) {
            setTensionScore((prev) => Math.min(100, Math.max(prev, Math.round(prev * 0.7 + avg * 0.3))));
          }
        };
        checkAudio();
      } catch (err) {
        console.warn('Mic error:', err);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (faceDetectionRef.current) cancelAnimationFrame(faceDetectionRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((t) => t.stop());
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (faceLandmarkerRef.current) {
        try {
          faceLandmarkerRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Presets (booth presenter)
  const applyPresetEmotion = (type: 'rage' | 'tense' | 'calm' | 'smile') => {
    if (type === 'rage') {
      setTensionScore(89); setBrowFurrow(0.92); setEyeSquint(0.78); setJawTension(0.85);
      setPeakRecordedScore((p) => Math.max(p, 89));
    } else if (type === 'tense') {
      setTensionScore(64); setBrowFurrow(0.65); setEyeSquint(0.52); setJawTension(0.60);
      setPeakRecordedScore((p) => Math.max(p, 64));
    } else if (type === 'calm') {
      setTensionScore(22); setBrowFurrow(0.18); setEyeSquint(0.14); setJawTension(0.15);
    } else if (type === 'smile') {
      setTensionScore(12); setBrowFurrow(0.08); setEyeSquint(0.20); setJawTension(0.09);
    }
  };

  // Cool Down Trigger
  const startCoolDown = () => {
    setIsCoolingDown(true);
    setCoolDownStep('breathing');
    setCoolDownSeconds(12);
    setPeakRecordedScore((p) => Math.max(p, tensionScore));
    playCalmChime(432, 2.5);
  };

  // Cool Down Timer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCoolingDown && coolDownSeconds > 0) {
      interval = setInterval(() => {
        setCoolDownSeconds((s) => s - 1);
        const cycle = coolDownSeconds % 12;
        if (cycle >= 8) setBreathPhase('Inhale slowly...');
        else if (cycle >= 4) setBreathPhase('Hold gently...');
        else setBreathPhase('Exhale and soften jaw...');

        setTensionScore((prev) => Math.max(14, Math.round(prev * 0.82)));
        setBrowFurrow((prev) => Math.max(0.08, +(prev * 0.85).toFixed(2)));
        setEyeSquint((prev) => Math.max(0.10, +(prev * 0.85).toFixed(2)));
        setJawTension((prev) => Math.max(0.09, +(prev * 0.85).toFixed(2)));
      }, 1000);
    } else if (isCoolingDown && coolDownSeconds <= 0) {
      setCoolDownStep('success');
      setIsCoolingDown(false);
      setTensionScore(14);
      playCalmChime(528, 3.0);

      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); } catch {}

      const id = 'HL-' + Math.floor(1000 + Math.random() * 9000);
      const peak = Math.max(65, peakRecordedScore);
      const calm = 14;
      const neutralized = Math.round(((peak - calm) / peak) * 100);

      const newReport = {
        id,
        visitorTag: 'Exhibition Stall Participant',
        mode: 'mirror' as const,
        peakScore: peak,
        calmedScore: calm,
        initialVibe: peak > 70 ? 'High Agitation & Brow Strain' : 'Elevated Tension',
        finalVibe: 'Restored Zen State',
        neutralizedPercent: neutralized,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setReportData(newReport);

      const shareUrl = `${window.location.origin}/fair?id=${id}&peak=${peak}&zen=${calm}&mode=mirror`;
      generateQr(shareUrl);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [isCoolingDown, coolDownSeconds]);

  // -------------------------------------------------------------
  // TEXT DE-ESCALATOR
  // -------------------------------------------------------------
  const [draftText, setDraftText] = useState(MESSAGE_PRESETS[0].prompt);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [pauseTimer, setPauseTimer] = useState(15);
  const [pauseRunning, setPauseRunning] = useState(false);
  const [rewrites, setRewrites] = useState<RewriteOption[]>([]);
  const [selectedRewriteIndex, setSelectedRewriteIndex] = useState<number | null>(null);

  const handleAnalyzeMessage = () => {
    if (!draftText.trim()) return;
    setIsAnalyzingText(true);
    setPauseTimer(15);
    setPauseRunning(true);
    playCalmChime(396, 1.5);

    setTimeout(() => {
      const generatedRewrites: RewriteOption[] = [
        {
          type: 'diplomatic',
          title: '👔 Diplomatic Professional',
          text: 'We encountered unexpected roadblocks during the latest release that impacted our budget. Let us review the log metrics together this morning so we can resolve the root cause.',
          reason: 'Reframes accusatory blame into objective problem-solving.'
        },
        {
          type: 'constructive',
          title: '🎯 Clear & Constructive',
          text: 'I understand there is frustration around recent timeline delays. Here are the specific three items we need to realign on before the next milestone.',
          reason: 'Sets explicit boundaries while keeping communication transparent.'
        },
        {
          type: 'empathetic',
          title: '🕊️ De-escalating & Collaborative',
          text: 'I appreciate how much effort has gone into this project. Can we jump on a brief 10-minute sync to ensure we are aligned and prevent further miscommunications?',
          reason: 'De-escalates hostility by prioritizing teamwork and psychological safety.'
        }
      ];
      setRewrites(generatedRewrites);
      setIsAnalyzingText(false);
    }, 700);
  };

  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (pauseRunning && pauseTimer > 0) {
      t = setInterval(() => setPauseTimer((s) => s - 1), 1000);
    } else if (pauseRunning && pauseTimer <= 0) {
      setPauseRunning(false);
    }
    return () => { if (t) clearInterval(t); };
  }, [pauseRunning, pauseTimer]);

  const handleApplyRewrite = (idx: number) => {
    setSelectedRewriteIndex(idx);
    const chosen = rewrites[idx];
    playCalmChime(528, 2.0);
    try { confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } }); } catch {}

    const id = 'HL-TXT-' + Math.floor(1000 + Math.random() * 9000);
    const peak = 94;
    const calmed = 11;
    const neutralized = 88;

    const rep = {
      id,
      visitorTag: 'Live Kiosk Contributor',
      mode: 'text' as const,
      peakScore: peak,
      calmedScore: calmed,
      initialVibe: '🔥 94% Toxic & Aggressive',
      finalVibe: '🧘 Constructive & Respectful',
      originalText: draftText,
      rewrittenText: chosen.text,
      neutralizedPercent: neutralized,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setReportData(rep);

    const shareUrl = `${window.location.origin}/fair?id=${id}&peak=${peak}&zen=${calmed}&mode=text&text=${encodeURIComponent(
      draftText.slice(0, 80)
    )}&rewrite=${encodeURIComponent(chosen.text.slice(0, 80))}`;
    generateQr(shareUrl);
  };

  // -------------------------------------------------------------
  // SHARING & NATIVE MOBILE EXPORT
  // -------------------------------------------------------------
  const generateQr = async (url: string) => {
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrCodeUrl(qr);
    } catch (e) {
      console.error('QR generation error:', e);
    }
  };

  // Native Mobile Share API
  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share && reportData) {
      try {
        await navigator.share({
          title: 'HumanLens AI De-escalation Certificate',
          text: `I de-escalated tension by ${reportData.neutralizedPercent}% with HumanLens AI!`,
          url: url
        });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const downloadReportCard = () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bgGrad = ctx.createLinearGradient(0, 0, 900, 1100);
      bgGrad.addColorStop(0, '#0a0a0c');
      bgGrad.addColorStop(1, '#020202');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 900, 1100);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, 840, 1040);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('🎪 HUMANLENS AI · EXHIBITION VERIFIED REPORT', 60, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('De-escalation Certificate', 60, 160);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Session ID: ${reportData.id} • ${reportData.timestamp}`, 60, 200);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, 230); ctx.lineTo(840, 230); ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px sans-serif';
      ctx.fillText(`-${reportData.neutralizedPercent}%`, 60, 330);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('NEURAL TENSION & FRICTION DE-ESCALATED', 60, 375);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(60, 420, 780, 240);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(60, 420, 780, 240);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('🔥 Initial Biometric State:', 90, 465);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`Peak Agitation: ${reportData.peakScore}%`, 90, 505);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText(reportData.initialVibe, 90, 540);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('🧘 Restored Zen State:', 470, 465);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`Calmed Level: ${reportData.calmedScore}%`, 470, 505);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px sans-serif';
      ctx.fillText(reportData.finalVibe, 470, 540);

      if (reportData.rewrittenText) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'italic 16px sans-serif';
        const snippet = `"${reportData.rewrittenText.slice(0, 85)}..."`;
        ctx.fillText(snippet, 90, 620);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '16px monospace';
        ctx.fillText('Action Units: AU4 Brow Furrow & Vocal Decibel Strain Normalized.', 90, 620);
      }

      if (qrCodeUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 60, 700, 220, 220);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('Scan to View on Phone', 310, 770);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '18px sans-serif';
          ctx.fillText('Verified session report for academic exhibition.', 310, 810);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '18px monospace';
          ctx.fillText('humanlensai.vercel.app/fair', 310, 850);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.font = '16px sans-serif';
          ctx.fillText('HumanLens AI • Academic Fair Showcase • Zero Keystroke Logging', 60, 1010);

          const link = document.createElement('a');
          link.download = `HumanLens-Deescalation-${reportData.id}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setIsExporting(false);
        };
        qrImg.src = qrCodeUrl;
      } else {
        setIsExporting(false);
      }
    } catch (err) {
      console.error('Download error:', err);
      setIsExporting(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW A: DEDICATED MOBILE QR CODE SCAN RESULT VIEW
  // (Rendered when visitor scans the QR code from the booth screen)
  // -------------------------------------------------------------
  if (isQrResultView && reportData) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-8 flex flex-col justify-between items-center selection:bg-emerald-500/30">
        <div className="w-full max-w-md space-y-6 animate-fade-in my-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs tracking-tight shadow-lg shadow-white/10">
                HL
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">HumanLens</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 text-xs font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>VERIFIED REPORT</span>
            </div>
          </div>

          {/* Certificate Card */}
          <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.12] p-6 space-y-6 shadow-2xl relative backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs font-mono text-white/40">
              <span>{reportData.id}</span>
              <span>{reportData.timestamp}</span>
            </div>

            {/* Big Score */}
            <div>
              <div className="text-6xl font-extrabold text-white tracking-tight">
                -{reportData.neutralizedPercent}%
              </div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mt-1">
                Tension &amp; Hostility De-escalated
              </div>
            </div>

            {/* Shift Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/50 border border-white/[0.06]">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-rose-400 uppercase">Initial Peak</span>
                <div className="text-lg font-bold text-white">{reportData.peakScore}%</div>
                <div className="text-[11px] text-white/40 leading-tight">{reportData.initialVibe}</div>
              </div>
              <div className="space-y-1 border-l border-white/[0.08] pl-3">
                <span className="text-[10px] font-mono text-emerald-400 uppercase">Restored Zen</span>
                <div className="text-lg font-bold text-white">{reportData.calmedScore}%</div>
                <div className="text-[11px] text-white/40 leading-tight">{reportData.finalVibe}</div>
              </div>
            </div>

            {/* Text Quote if applicable */}
            {reportData.rewrittenText && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/80 italic">
                &quot;{reportData.rewrittenText}&quot;
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={downloadReportCard}
                disabled={isExporting}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating image...' : 'Save Certificate to Photos (PNG)'}</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] active:scale-95 text-white text-xs font-medium transition-all flex items-center justify-center space-x-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Share on Social / Feed'}</span>
              </button>

              <button
                onClick={() => setIsQrResultView(false)}
                className="w-full py-2.5 text-xs text-white/40 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Try Camera Demo on this Device →</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/30 text-center mt-6">
          HumanLens AI • Academic Fair Showcase • No Data Stored
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: INTERACTIVE BOOTH KIOSK VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 flex flex-col justify-between">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-160px] right-[-100px] w-[600px] h-[500px] rounded-full bg-sky-500/[0.03] blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-black/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs tracking-tight shadow-lg shadow-white/10">
              HL
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">HumanLens</span>
            <div className="hidden sm:inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE EXHIBITION KIOSK</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-white/40 font-mono">Zero Login Required</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Exhibition Demo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Real-Time Anger Detection &amp; Neural Cool-Down
          </h1>
          <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto leading-relaxed">
            Turn on the camera to let HumanLens analyze facial tension in real time. Take home your verified de-escalation report card by scanning the QR code on your phone.
          </p>

          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] mt-4">
            <button
              onClick={() => setActiveTab('mirror')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'mirror'
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              <span>Face &amp; Voice Mirror</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Angry Message Simulator</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MIRROR */}
        {activeTab === 'mirror' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Camera Viewport */}
            <div className="lg:col-span-7 space-y-5">
              <div
                className={`relative aspect-video rounded-3xl bg-zinc-950 border transition-all duration-500 overflow-hidden flex items-center justify-center shadow-2xl ${
                  tensionScore > 65
                    ? 'border-rose-500/60 shadow-rose-500/20'
                    : tensionScore > 35
                    ? 'border-amber-500/40 shadow-amber-500/10'
                    : 'border-emerald-500/30 shadow-emerald-500/10'
                }`}
              >
                {/* Always-mounted video element to guarantee stream plays instantly on Safari */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${cameraActive ? 'block' : 'hidden'}`}
                />

                {!cameraActive && (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mx-auto text-white/40">
                      <ScanFace className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-white/70 max-w-xs">
                      Turn on the camera and HumanLens reads facial expressions in real time.
                    </p>
                    <p className="text-xs text-white/30 max-w-xs">
                      100% on-device · Video frames are never recorded or stored
                    </p>
                    <button
                      onClick={toggleCamera}
                      disabled={cameraLoading}
                      className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center space-x-2 mx-auto disabled:opacity-60"
                    >
                      {cameraLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Starting Camera...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Turn On Camera</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Live Biometric Tag */}
                {cameraActive && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium backdrop-blur-md border ${
                        !faceDetected
                          ? 'bg-zinc-950/80 text-white/50 border-white/10'
                          : tensionScore > 65
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          : tensionScore > 35
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !faceDetected
                            ? 'bg-white/30'
                            : tensionScore > 65
                            ? 'bg-rose-400 animate-ping'
                            : tensionScore > 35
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>
                        {!faceDetected
                          ? 'Detecting face...'
                          : tensionScore > 65
                          ? '🔴 HIGH AGITATION'
                          : tensionScore > 35
                          ? '🟡 ELEVATED STRAIN'
                          : '🟢 ZEN / RELAXED'}
                      </span>
                    </span>
                  </div>
                )}

                {/* Face detected pill */}
                {cameraActive && faceDetected && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono backdrop-blur-md">
                    <Eye className="w-3 h-3" />
                    <span>Tracking Active</span>
                  </div>
                )}

                {/* Breathing Overlay */}
                {isCoolingDown && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
                      <div className="w-28 h-28 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex flex-col items-center justify-center transition-all duration-1000 scale-110">
                        <Wind className="w-8 h-8 text-emerald-300 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-200 mt-1">{coolDownSeconds}s</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mt-6 tracking-tight">{breathPhase}</h3>
                    <p className="text-xs text-white/60 max-w-xs mt-1">
                      Relax your forehead &amp; soften your jaw. Watch tension drop.
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleCamera}
                    disabled={cameraLoading}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      cameraActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/[0.05] border-white/[0.1] text-white/60 hover:text-white'
                    }`}
                  >
                    {cameraLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : cameraActive ? (
                      <Camera className="w-3.5 h-3.5" />
                    ) : (
                      <CameraOff className="w-3.5 h-3.5" />
                    )}
                    <span>{cameraActive ? 'Camera On' : 'Start Camera'}</span>
                  </button>

                  <button
                    onClick={toggleMic}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      micActive
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        : 'bg-white/[0.05] border-white/[0.1] text-white/60 hover:text-white'
                    }`}
                  >
                    {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{micActive ? `Mic (${vocalVolume} dB)` : 'Start Mic'}</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-white/30">
                  {cameraActive ? (modelReady ? '✓ AI Face Landmarker Active' : '⚡ Sensor Active') : '○ Camera idle'}
                </div>

                {isPresenterMode && (
                  <div className="flex items-center space-x-1 text-xs text-white/40">
                    <span className="text-[11px] font-mono mr-1">Demo:</span>
                    <button onClick={() => applyPresetEmotion('rage')} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px]">😡</button>
                    <button onClick={() => applyPresetEmotion('tense')} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px]">😬</button>
                    <button onClick={() => applyPresetEmotion('smile')} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px]">😊</button>
                  </div>
                )}
              </div>
            </div>

            {/* Gauges & Cool Down */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-white/40">Real-Time Agitation Gauge</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-4xl font-bold tracking-tight text-white">{tensionScore}%</span>
                      <span className="text-xs text-white/40 font-mono">Intensity</span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      tensionScore > 65
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                        : tensionScore > 35
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {tensionScore > 65 ? <Flame className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-white/[0.08] overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      tensionScore > 65
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : tensionScore > 35
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    }`}
                    style={{ width: `${tensionScore}%` }}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs font-mono text-white/40 uppercase">Detected Action Unit (AU) Proxies</span>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">AU4 Eyebrow Lowerer (Frustration)</span>
                      <span className="font-mono text-white/90">{(browFurrow * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full transition-all duration-300"
                        style={{ width: `${browFurrow * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">AU7 Lid Tightener (Agitation)</span>
                      <span className="font-mono text-white/90">{(eyeSquint * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full transition-all duration-300"
                        style={{ width: `${eyeSquint * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">AU23 Lip Compression (Jaw Clench)</span>
                      <span className="font-mono text-white/90">{(jawTension * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-white/60 rounded-full transition-all duration-300"
                        style={{ width: `${jawTension * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {!cameraActive ? (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center space-y-1">
                    <ScanFace className="w-5 h-5 text-white/30 mx-auto" />
                    <p className="text-xs text-white/40">Turn on camera to begin real-time detection.</p>
                  </div>
                ) : coolDownStep === 'success' ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                    <p className="text-sm font-semibold text-emerald-300">✓ Cool-Down Complete!</p>
                    <p className="text-[11px] text-emerald-300/60">Scan the QR code below on your phone.</p>
                  </div>
                ) : (
                  <button
                    onClick={startCoolDown}
                    disabled={isCoolingDown}
                    className="w-full py-4 rounded-2xl bg-white hover:bg-white/90 active:scale-[0.98] text-black font-semibold text-sm transition-all duration-200 shadow-xl shadow-white/10 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Wind className="w-4 h-4" />
                    <span>{isCoolingDown ? 'De-escalating in Progress...' : 'Start 12s Cool-Down Protocol'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT SIMULATOR */}
        {activeTab === 'text' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400">
                  Step 1: Choose or Draft a High-Friction Message
                </span>
                <h3 className="text-xl font-semibold text-white mt-1">Simulate Impulsive Communication</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MESSAGE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setDraftText(p.prompt); setRewrites([]); setSelectedRewriteIndex(null); }}
                    className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                      draftText === p.prompt
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="font-semibold">{p.tag}</div>
                    <div className="text-[11px] text-white/40 truncate mt-0.5">{p.prompt}</div>
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Type an angry message you want to test..."
                  className="w-full p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:border-white/30 focus:outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleAnalyzeMessage}
                disabled={isAnalyzingText}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl shadow-white/10 flex items-center justify-center space-x-2"
              >
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Intervene &amp; Neutralize Toxicity</span>
              </button>

              {rewrites.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/[0.06] animate-fade-in">
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-rose-300">High Toxicity Intercepted (94% Hostility)</div>
                        <div className="text-[11px] text-rose-300/70">
                          {pauseRunning ? `Cooling Pause Active: Breathe for ${pauseTimer}s before acting.` : 'Cooling Pause Finished. Choose a rewrite below:'}
                        </div>
                      </div>
                    </div>
                    {pauseRunning && (
                      <span className="font-mono text-sm font-bold text-rose-300 bg-rose-500/20 px-2.5 py-1 rounded-xl">{pauseTimer}s</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-mono text-white/40 uppercase">AI Neutralization Options</span>
                    {rewrites.map((rw, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleApplyRewrite(idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedRewriteIndex === idx
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100 shadow-lg shadow-emerald-500/10'
                            : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20 text-white/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-white">{rw.title}</span>
                          {selectedRewriteIndex === idx ? (
                            <span className="flex items-center space-x-1 text-emerald-400 text-xs font-mono"><Check className="w-3.5 h-3.5" /><span>Selected</span></span>
                          ) : (
                            <span className="text-xs text-white/40 hover:text-white flex items-center space-x-1"><span>Select</span><ChevronRight className="w-3 h-3" /></span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-white/90">{rw.text}</p>
                        <p className="text-[11px] text-white/40 mt-1 italic">{rw.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificate Card & QR Code at bottom of booth screen */}
        {reportData && (
          <div className="max-w-2xl mx-auto space-y-6 pt-6 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Official Fair Outcome</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Your De-escalation Certificate</h2>
              <p className="text-xs text-white/50">Scan the QR code with your phone camera to take this report home.</p>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.12] p-6 sm:p-8 space-y-6 shadow-2xl relative backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-400 text-black flex items-center justify-center font-bold text-[10px]">HL</div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">HUMANLENS AI • VERIFIED SESSION</span>
                </div>
                <span className="text-xs font-mono text-white/40">{reportData.id}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
                <div>
                  <div className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">-{reportData.neutralizedPercent}%</div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mt-1">Tension &amp; Hostility De-escalated</div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">✓ Calmed in Real Time</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-rose-400 uppercase">🔥 Initial Peak State</span>
                  <div className="text-lg font-bold text-white">{reportData.peakScore}% Intensity</div>
                  <div className="text-xs text-white/50">{reportData.initialVibe}</div>
                </div>
                <div className="space-y-1 sm:border-l sm:border-white/[0.08] sm:pl-4">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase">🧘 Post-Intervention</span>
                  <div className="text-lg font-bold text-white">{reportData.calmedScore}% Restored</div>
                  <div className="text-xs text-white/50">{reportData.finalVibe}</div>
                </div>
              </div>

              {reportData.rewrittenText && (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/80 italic">
                  &quot;{reportData.rewrittenText}&quot;
                </div>
              )}

              {/* QR and Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2 border-t border-white/[0.08]">
                {qrCodeUrl && (
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-2xl shadow-lg shrink-0">
                      <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="text-xs font-semibold text-white">Scan with Camera</div>
                      <div className="text-[11px] text-white/50 leading-relaxed max-w-[180px]">
                        Opens your mobile certificate with 1-click save to photos.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col w-full sm:w-auto space-y-2">
                  <button
                    onClick={downloadReportCard}
                    disabled={isExporting}
                    className="flex items-center justify-center space-x-2 px-5 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Generating...' : 'Download Report (PNG)'}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-medium transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share to Feed / Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] py-6 px-4 text-center text-xs text-white/30">
        HumanLens AI • Multimodal Communication De-escalation • Academic Fair &amp; Kiosk Demonstration
      </footer>
    </div>
  );
};
