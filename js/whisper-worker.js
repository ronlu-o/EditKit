import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.allowLocalModels = false;
env.useBrowserCache  = true;

let asr         = null;
let loadedModel = null;

self.onmessage = async ({ data }) => {
    const { audioData, modelSize, language } = data;
    const modelId = `Xenova/whisper-${modelSize}`;

    try {
        if (!asr || loadedModel !== modelId) {
            post('status', 'Downloading model…', 'First run only — cached afterwards');

            asr = await pipeline('automatic-speech-recognition', modelId, {
                progress_callback: (p) => {
                    if (p.status === 'progress') {
                        self.postMessage({ type: 'dl-progress', file: p.file, pct: p.progress });
                    } else if (p.status === 'ready') {
                        post('status', 'Model loaded — starting transcription…', '');
                    }
                }
            });

            loadedModel = modelId;
        }

        post('status', 'Transcribing audio…', 'Longer files may take a moment');

        const output = await asr(audioData, {
            language:          language === 'auto' ? undefined : language,
            task:              'transcribe',
            return_timestamps: true,
            chunk_length_s:    30,
            stride_length_s:   5,
        });

        self.postMessage({ type: 'result', output });

    } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
    }
};

function post(type, text, sub) {
    self.postMessage({ type, text, sub });
}
