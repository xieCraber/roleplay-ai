// 语音识别和TTS工具
let currentUtterance = null;
let isMuted = false;

export const isSpeechMuted = () => isMuted;

export const muteSpeech = () => {
  isMuted = true;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};

export const unmuteSpeech = () => {
  isMuted = false;
};

export const stopAllSpeech = () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
};

export const startSpeechRecognition = (onResult, onError) => {
  if (!('webkitSpeechRecognition' in window)) {
    alert('您的浏览器不支持语音识别，请使用Chrome浏览器')
    if (onError) onError()
    return null
  }

  const recognition = new webkitSpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'zh-CN'

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    onResult(transcript)
  }

  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error)
    if (onError) onError()
  }

  recognition.onend = () => {
    console.log('语音识别结束')
  }

  recognition.start()
  return recognition
}

export const speakText = (text, onEnd, onError) => {
  if (isMuted) return;
  
  if ('speechSynthesis' in window) {
    // 停止当前语音
    if (currentUtterance && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    // 存儲當前語音對象以便控制
    currentUtterance = utterance;
    
    window.speechSynthesis.speak(utterance)
    
    utterance.onend = () => {
      console.log('语音播报完成')
      if (onEnd) onEnd();
      currentUtterance = null;
    }
    
    utterance.onerror = (event) => {
      console.error('语音播报错误:', event)
      if (onError) onError(event);
      currentUtterance = null;
    }
  } else {
    console.warn('浏览器不支持语音合成')
  }
}

export const toggleSpeech = () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  } else if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}