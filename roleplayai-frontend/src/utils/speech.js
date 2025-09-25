// 语音识别和TTS工具

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

export const speakText = (text) => {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    window.speechSynthesis.speak(utterance)
    
    utterance.onend = () => {
      console.log('语音播报完成')
    }
    
    utterance.onerror = (event) => {
      console.error('语音播报错误:', event)
    }
  } else {
    console.warn('浏览器不支持语音合成')
  }
}