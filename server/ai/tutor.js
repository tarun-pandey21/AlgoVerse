/**
 * AI Tutor – multi-turn chat streamed to the browser with Server-Sent Events.
 *
 * Events written to the response:
 *   event: start  data: { model }
 *   event: delta  data: { text }
 *   event: done   data: { stopReason, truncated, usage }
 *   event: error  data: { error, message }
 */
import { getClient, model, mapAnthropicError, notConfiguredError, AIError } from './client.js';
import { tutorSystem } from './prompts.js';

const MAX_TOKENS = 2048;

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function streamTutorReply({ messages, language, context }, req, res) {
  const anthropic = getClient();
  if (!anthropic) throw notConfiguredError();

  const stream = anthropic.messages.stream({
    model: model(),
    max_tokens: MAX_TOKENS,
    system: tutorSystem({ language, context }),
    messages,
  });

  // Stop paying for tokens if the learner closes the tab or presses Stop.
  let clientGone = false;
  res.on('close', () => {
    if (!res.writableFinished) {
      clientGone = true;
      stream.abort();
    }
  });

  let started = false;
  let text = '';
  const startStreaming = () => {
    if (started) return;
    started = true;
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    sse(res, 'start', { model: model() });
  };

  stream.on('text', (delta) => {
    startStreaming();
    text += delta;
    sse(res, 'delta', { text: delta });
  });

  try {
    const final = await stream.finalMessage();
    if (clientGone) return;
    if (!text.trim()) {
      throw new AIError(
        502,
        final.stop_reason === 'refusal' ? 'refused' : 'empty_response',
        final.stop_reason === 'refusal' ? 'Claude declined to answer this message.' : 'Claude returned an empty response. Please try again.',
      );
    }
    sse(res, 'done', {
      stopReason: final.stop_reason,
      truncated: final.stop_reason === 'max_tokens',
      usage: { input: final.usage?.input_tokens, output: final.usage?.output_tokens },
    });
    res.end();
  } catch (error) {
    if (clientGone) return;
    const mapped = mapAnthropicError(error);
    if (!started) throw mapped; // nothing streamed yet → normal JSON error response
    sse(res, 'error', { error: mapped.code, message: mapped.message });
    res.end();
  }
}
