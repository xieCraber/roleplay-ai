// 语音识别和TTS工具
let currentUtterance = null;
let isMuted = false;
let recognitionInstance = null;
let isRecognizing = false;
let speechEnabled = true;

export const isSpeechMuted = () => isMuted;
export const isSpeechEnabled = () => speechEnabled;

export const muteSpeech = () => {
  isMuted = true;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};

export const unmuteSpeech = () => {
  isMuted = false;
};

export const toggleMute = () => {
  if (isMuted) {
    unmuteSpeech();
  } else {
    muteSpeech();
  }
};

export const stopAllSpeech = () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
};

// 修复1：增强浏览器兼容性检查
const getSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || 
                           window.webkitSpeechRecognition || 
                           window.mozSpeechRecognition || 
                           window.msSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }
  
  return SpeechRecognition;
};

// 修复2：添加详细的错误处理和具体指导
const handleRecognitionError = (error, onError) => {
  console.error('语音识别错误:', error);
  
  let errorMessage = '语音识别失败';
  let instructions = '';
  
  switch (error) {
    case 'not-allowed':
      errorMessage = '无法访问麦克风';
      instructions = '请检查浏览器设置并允许麦克风权限。';
      if (navigator.userAgent.includes('Chrome')) {
        instructions += '在Chrome中，点击地址栏左侧的🔒图标，然后允许麦克风权限。';
      } else if (navigator.userAgent.includes('Firefox')) {
        instructions += '在Firefox中，点击地址栏左侧的摄像头图标，然后允许麦克风权限。';
      }
      break;
    case 'aborted':
      errorMessage = '语音识别被中止';
      break;
    case 'audio-capture':
      errorMessage = '无法访问麦克风';
      instructions = '请确保麦克风已连接并设置为默认设备。';
      break;
    case 'network':
      errorMessage = '网络连接问题，请检查网络';
      break;
    case 'no-speech':
      // 这不是错误，只是没有检测到语音
      return null;
    case 'language-not-supported':
      errorMessage = '不支持的语言';
      break;
    default:
      errorMessage = `语音识别失败: ${error}`;
  }
  
  const fullMessage = instructions ? `${errorMessage} - ${instructions}` : errorMessage;
  
  if (onError) {
    onError(fullMessage);
  }
  
  return fullMessage;
};

export const checkMicrophonePermission = async () => {
  try {
    // 1. 检查是否在安全上下文
    if (!window.isSecureContext) {
      throw new Error('需要HTTPS或localhost环境');
    }

    // 2. 检查现代API
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
    
    // 3. 尝试旧版API
    const getUserMedia = navigator.getUserMedia || 
                         navigator.webkitGetUserMedia || 
                         navigator.mozGetUserMedia;
                         
    if (getUserMedia) {
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, { audio: true }, (stream) => {
          stream.getTracks().forEach(track => track.stop());
          resolve(true);
        }, reject);
      });
    }
    
    throw new Error('浏览器不支持麦克风访问');
    
  } catch (error) {
    console.error('麦克风权限检查失败:', error);
    
    // 提供具体错误信息
    let errorMessage = '麦克风访问失败';
    if (error.message.includes('HTTPS')) {
      errorMessage = '请使用HTTPS或localhost环境';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = '请允许麦克风权限（检查浏览器地址栏权限设置）';
    }
    
    return false;
  }
};

export const startSpeechRecognition = async (onResult, onError, onEnd) => {
  // 修复4：防止重复调用
  if (isRecognizing) {
    console.warn('语音识别已在进行中');
    if (onError) onError('语音识别已在进行中');
    return null;
  }
  
  // 修复5：添加权限检查
  const hasPermission = await checkMicrophonePermission();
  if (!hasPermission) {
    const errorMsg = '请允许使用麦克风权限';
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return null;
  }

  // 修复1：增强浏览器兼容性检查
  const SpeechRecognition = getSpeechRecognition();
  
  if (!SpeechRecognition) {
    const errorMsg = '您的浏览器不支持语音识别，请使用Chrome浏览器';
    alert(errorMsg);
    if (onError) onError(errorMsg);
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';
    
    isRecognizing = true;
    recognitionInstance = recognition;
    
    // 修复6：移除重复的onresult处理
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      // 修复2：传递详细的错误信息
      const errorMessage = handleRecognitionError(event.error, onError);
      if (errorMessage) {
        console.error(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('语音识别结束');
      isRecognizing = false;
      recognitionInstance = null;
      
      // 修复4：添加onEnd回调
      if (onEnd) onEnd();
    };
    
    // 修复7：添加超时机制，防止无响应
    const timeoutId = setTimeout(() => {
      if (recognitionInstance === recognition) {
        recognition.stop();
        if (onError) onError('语音识别超时，请重试');
      }
    }, 10000); // 10秒超时
    
    recognition.onend = () => {
      clearTimeout(timeoutId);
      recognition.onend(); // 调用原始的onend处理
    };
    
    recognition.start();
    return recognition;
  } catch (error) {
    isRecognizing = false;
    const errorMsg = `创建语音识别实例失败: ${error.message}`;
    console.error(errorMsg);
    if (onError) onError(errorMsg);
    return null;
  }
};

// 修复8：添加停止语音识别功能
export const stopSpeechRecognition = () => {
  if (isRecognizing && recognitionInstance) {
    recognitionInstance.stop();
    isRecognizing = false;
    recognitionInstance = null;
  }
};

export const speakText = (text, onEnd, onError) => {
  if (isMuted || !speechEnabled) return;
  
  if ('speechSynthesis' in window) {
    // 停止當前語音
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
    if (onError) onError('浏览器不支持语音合成');
  }
}

export const toggleSpeech = () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  } else if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}