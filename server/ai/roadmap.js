/** AI Learning Roadmap – a personalized plan from the learner's real progress. */
import { callStructured } from './client.js';
import { roadmapSystem, LANGUAGE_NAMES } from './prompts.js';

// JSON Schema for the response (sent as output_config.format; see client.js)
const FORMAT = {
  name: 'roadmap',
  description: 'Submit the personalized learning roadmap.',
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: '2-3 sentences: where the learner is and what this plan achieves.' },
      focusAreas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            reason: { type: 'string' },
          },
          required: ['topic', 'priority', 'reason'],
        },
      },
      weeks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            week: { type: 'integer' },
            title: { type: 'string' },
            topics: { type: 'array', items: { type: 'string' } },
            goals: { type: 'array', items: { type: 'string' } },
            practice: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  problemId: { type: ['string', 'null'], description: 'Exact AlgoVerse catalog id, or null for an external/self-made exercise.' },
                  title: { type: 'string' },
                  difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
                  why: { type: 'string' },
                },
                required: ['problemId', 'title', 'difficulty', 'why'],
              },
            },
            milestone: { type: 'string', description: 'How the learner knows the week went well.' },
          },
          required: ['week', 'title', 'topics', 'goals', 'practice', 'milestone'],
        },
      },
      tips: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'focusAreas', 'weeks', 'tips'],
  },
};

const list = (items) => (items.length ? items.join(', ') : 'none');

export function buildRoadmap(input, signal) {
  const { skillLevel, targetDifficulty, weeks, hoursPerWeek, language, goals, completedTopics, inProgressTopics, weakAreas, solved, catalog } =
    input;

  const solvedByTopic = Object.entries(solved.byTopic)
    .map(([topic, n]) => `${topic}: ${n}`)
    .join(', ');

  const prompt = `Create a ${weeks}-week DSA learning roadmap.

<learner>
Skill level: ${skillLevel}
Target difficulty: ${targetDifficulty}
Time available: about ${hoursPerWeek} hours per week
Preferred language: ${LANGUAGE_NAMES[language]}
Goals: ${goals || 'not specified'}
Completed lessons (topics): ${list(completedTopics)}
Lessons in progress: ${list(inProgressTopics)}
Weak areas: ${list(weakAreas)}
Problems solved: ${solved.total} (Easy ${solved.easy}, Medium ${solved.medium}, Hard ${solved.hard})
Solved by topic: ${solvedByTopic || 'none'}
Solved problem ids: ${list(solved.ids)}
</learner>

<algoverse_catalog>
${catalog.map((p) => `${p.id} | ${p.title} | ${p.difficulty} | ${p.topic}`).join('\n')}
</algoverse_catalog>

Return exactly ${weeks} weeks.`;
  return callStructured({ system: roadmapSystem(), prompt, format: FORMAT, maxTokens: 1500 * weeks + 1500, signal });
}
