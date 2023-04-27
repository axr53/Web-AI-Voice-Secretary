// DOM 요소를 가져옵니다.
const startRecordBtn = document.getElementById("start-record");
const stopRecordBtn = document.getElementById("stop-record");
const recognizedText = document.getElementById("recognized-text");
const gptResponse = document.getElementById("gpt-response");
const ttsAudio = document.getElementById("tts-audio");

// MediaRecorder 객체와 오디오 청크 배열을 초기화합니다.
let mediaRecorder;
let audioChunks = [];

// 시작 버튼 클릭 이벤트 리스너를 설정합니다.
startRecordBtn.addEventListener("click", () => {
  // 미디어 장치를 사용하여 오디오 스트림을 가져옵니다.
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // MediaRecorder 객체를 생성하고 시작합니다.
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start(1000); // 1초의 타임 슬라이스를 추가합니다.

      // 버튼 상태를 업데이트합니다.
      startRecordBtn.disabled = true;
      stopRecordBtn.disabled = false;

      // 20초 후에 녹음을 자동으로 중지합니다.
      setTimeout(() => {
        if (mediaRecorder) {
          mediaRecorder.stop();
          startRecordBtn.disabled = false;
          stopRecordBtn.disabled = true;
        }
      }, 20000);

      // 데이터가 사용 가능한 경우 오디오 청크를 저장합니다.
      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      // 녹음이 중지되면 오디오 데이터를 처리합니다.
      mediaRecorder.addEventListener("stop", () => {
        // Blob 객체를 생성하고 파일을 읽어옵니다.
        const audioBlob = new Blob(audioChunks);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          // Base64 형식의 오디오 데이터를 가져옵니다.
          const base64data = reader.result;
          // 오디오 데이터를 처리하는 함수를 호출합니다.
          processAudio(base64data);
        };
        // 오디오 청크 배열을 초기화합니다.
        audioChunks = [];
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

// 중지 버튼 클릭 이벤트 리스너를 설정합니다.
stopRecordBtn.addEventListener("click", () => {
  // MediaRecorder 객체가 있는 경우 중지합니다.
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
  // 버튼 상태를 업데이트합니다.
  startRecordBtn.disabled = false;
  stopRecordBtn.disabled = true;
});

// 오디오 데이터를 처리하는 비동기 함수입니다.
async function processAudio(base64data) {
  // 오디오를 텍스트로 변환합니다.
  const text = await speechToText(base64data);
  // 인식된 텍스트를 표시합니다.
  recognizedText.innerText = `인식된 텍스트: ${text}`;

  // GPT-3 API로 응답을 가져옵니다.
  const gptAnswer = await fetchGptResponse(text);
  // GPT-3 응답을 표시합니다.
  gptResponse.innerText = `GPT-3 응답: ${gptAnswer}`;

  // 응답을 음성으로 변환합니다.
  const audioUrl = await textToSpeech(gptAnswer);
  // 오디오 요소에 변환된 음성을 설정하고 자동으로 재생합니다.
  ttsAudio.src = audioUrl;
  ttsAudio.play();
}

// Google Speech-to-Text API를 사용하여 오디오를 텍스트로 변환하는 비동기 함수입니다.
async function speechToText(base64audio) {
  // Google Speech-to-Text API 호출을 위한 설정
  // 여기에 Google Speech-to-Text API 키를 입력하세요.
  const response = await fetch("input your API Key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: "ko-KR"
      },
      audio: {
        content: base64audio.split(",")[1]
      }
    })
  });

  // API 응답을 JSON으로 변환합니다.
  const data = await response.json();
  // 결과를 반환하거나, 인식할 수 없는 경우에 대비한 기본값을 반환합니다.
  return data.results?.[0]?.alternatives?.[0]?.transcript || "인식할 수 없음";
}

// OpenAI GPT-3 API를 사용하여 입력 텍스트에 대한 응답을 가져오는 비동기 함수입니다.
async function fetchGptResponse(inputText) {
  // OpenAI GPT-3 API 호출을 위한 설정
  // 여기에 OpenAI GPT-3 API 키를 입력하세요.
  const response = await fetch("input your API Key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_OPENAI_API_KEY"
    },
    body: JSON.stringify({
      prompt: inputText,
      max_tokens: 50,
      n: 1,
      stop: null,
      temperature: 0.7
    })
  });

  // API 응답을 JSON으로 변환합니다.
  const data = await response.json();
  // 결과를 반환하거나, 응답할 수 없는 경우에 대비한 기본값을 반환합니다.
  return data.choices?.[0]?.text?.trim() || "응답할 수 없음";
}

// Google Text-to-Speech API를 사용하여 텍스트를 음성으로 변환하는 비동기 함수입니다.
async function textToSpeech(text) {
  // Google Text-to-Speech API 호출을 위한 설정
  // 여기에 Google Text-to-Speech API 키를 입력하세요.
  const response = await fetch("input your API Key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: {
        text: text
      },
      voice: {
        languageCode: "ko-KR",
        name: "ko-KR-Standard-A"
      },
      audioConfig: {
        audioEncoding: "MP3"
      }
    })
  });

  // API 응답을 JSON으로 변환합니다.
  const data = await response.json();
  // Base64 인코딩된 오디오 데이터를 반환합니다.
  return `data:audio/mp3;base64,${data.audioContent}`;
}
