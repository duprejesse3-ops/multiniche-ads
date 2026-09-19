// Requires AI_GATEWAY_API_KEY in the environment. The `ai` SDK auto-routes a
// plain "<provider>/<model>" string through Vercel AI Gateway when this env
// var is present -- no separate provider package (e.g. @ai-sdk/openai) needed.
//
// Run with the key loaded from a gitignored env file, e.g.:
//   node --env-file=.env.local index.mts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-5.6-sol',
  prompt: 'In one sentence, confirm that AI Gateway text generation is working.'
});

console.log(text);
