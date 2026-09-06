function buildInstructionPrefix({ audioProfile, directorStyle, directorPace, directorAccent, directorCustom }) {
    const parts = [];
    if (audioProfile) parts.push(audioProfile.trim());

    const descriptors = [];
    if (directorStyle) descriptors.push(`${directorStyle} tone`);
    if (directorPace) descriptors.push(`${directorPace} pace`);
    if (directorAccent) descriptors.push(`${directorAccent} accent`);
    if (descriptors.length) parts.push(`Speak with a ${descriptors.join(', ')}.`);

    if (directorCustom) parts.push(directorCustom.trim());

    return parts.filter(Boolean).join(' ');
}

function buildRequestBody({ text, voice, instructionPrefix }) {
    const finalText = instructionPrefix ? `${instructionPrefix}\n\n${text}` : text;
    return {
        contents: [{ parts: [{ text: finalText }] }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
        },
    };
}

class TTSApiError extends Error {
    constructor(message, { status, kind } = {}) {
        super(message);
        this.status = status;
        // kind: 'rate_limit' | 'invalid_key' | 'transient' | 'fatal'
        this.kind = kind || 'fatal';
    }
}

async function callGeminiOnce({ apiKey, model, requestBody, signal }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(requestBody),
            signal,
        });
    } catch (networkErr) {
        throw new TTSApiError(`Lỗi mạng: ${networkErr.message}`, { kind: 'transient' });
    }

    if (!res.ok) {
        let bodyText = '';
        try {
            bodyText = await res.text();
        } catch (_) {}
        if (res.status === 429) {
            throw new TTSApiError(`Bị giới hạn tốc độ (429)`, { status: 429, kind: 'rate_limit' });
        }
        if (res.status === 401 || res.status === 403) {
            throw new TTSApiError(`API key không hợp lệ/hết quyền (${res.status})`, { status: res.status, kind: 'invalid_key' });
        }
        if (res.status >= 500) {
            throw new TTSApiError(`Lỗi server Google (${res.status})`, { status: res.status, kind: 'transient' });
        }
        throw new TTSApiError(`Lỗi API (${res.status}): ${bodyText.slice(0, 300)}`, { status: res.status, kind: 'fatal' });
    }

    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find((p) => p.inlineData?.data);
    if (!audioPart) {
        const finishReason = json?.candidates?.[0]?.finishReason;
        throw new TTSApiError(
            `Model không trả về audio (finishReason: ${finishReason || 'unknown'}) — lỗi tạm thời từ Gemini TTS, thử lại sau...`,
            { kind: 'empty_audio' }
        );
    }

    const base64 = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || 'audio/L16;rate=24000';
    const sampleRate = parseSampleRateFromMime(mimeType, 24000);
    const pcmBytes = base64ToUint8Array(base64);

    return { pcmBytes, sampleRate };
}

async function synthesizeLine({ text, settings, keyManager, onAttemptLog, signal }) {
    if (!keyManager.hasAnyKey()) {
        throw new TTSApiError('Chưa có API key nào.', { kind: 'fatal' });
    }

    const instructionPrefix = buildInstructionPrefix(settings);
    const requestBody = buildRequestBody({ text, voice: settings.voice, instructionPrefix });

    const maxAttempts = Math.max(1, settings.maxRetriesPerLine);
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (signal?.aborted) throw new TTSApiError('Đã huỷ.', { kind: 'aborted' });

        let keyObj = keyManager.getNextAvailable();

        if (!keyObj) {
            if (keyManager.allDisabled()) {
                throw new TTSApiError('Tất cả API key đều đã bị vô hiệu hoá.', { kind: 'fatal' });
            }
            const waitMs = Math.min(keyManager.msUntilNextAvailable(), settings.rateLimitCooldownMs);
            onAttemptLog?.(`Tất cả key đang nghỉ, chờ ${Math.ceil(waitMs / 1000)}s...`);
            await sleep(waitMs || 1000);
            continue;
        }

        try {
            onAttemptLog?.(`Đang gửi (key ${maskKey(keyObj.key)}, lần ${attempt}/${maxAttempts})...`);
            const { pcmBytes, sampleRate } = await callGeminiOnce({
                apiKey: keyObj.key,
                model: settings.model,
                requestBody,
                signal,
            });
            keyManager.markSuccess(keyObj);
            return { pcmBytes, sampleRate };
        } catch (err) {
            lastError = err;
            if (err.kind === 'rate_limit') {
                keyManager.markRateLimited(keyObj, settings.rateLimitCooldownMs);
                onAttemptLog?.(`Key ${maskKey(keyObj.key)} bị giới hạn, chuyển key khác...`);
            } else if (err.kind === 'invalid_key') {
                keyManager.markInvalid(keyObj);
                onAttemptLog?.(`Key ${maskKey(keyObj.key)} không hợp lệ, đã vô hiệu hoá.`);
            } else if (err.kind === 'empty_audio') {
                keyManager.markSuccess(keyObj);
                onAttemptLog?.(`Gemini không trả audio lần này (lỗi tạm thời từ Google), đang thử lại...`);
                await sleep(Math.min(settings.betweenRequestsMs * 3, 6000));
            } else if (err.kind === 'transient') {
                keyManager.markTransientError(keyObj, settings.rateLimitCooldownMs);
                onAttemptLog?.(`Lỗi tạm thời: ${err.message}. Thử lại...`);
                await sleep(Math.min(settings.betweenRequestsMs * 2, 4000));
            } else {

                onAttemptLog?.(`Lỗi: ${err.message}`);
                await sleep(settings.betweenRequestsMs);
            }
        }
    }

    throw lastError || new TTSApiError('Không rõ lỗi.', { kind: 'fatal' });
}