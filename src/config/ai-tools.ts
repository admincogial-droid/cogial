export interface AIToolConfig {
  id: string;
  name: string;
  category: 'writing' | 'marketing' | 'social' | 'youtube' | 'video' | 'seo' | 'creative' | 'voice' | 'images';
  description: string;
  creditCost: number;
  provider: 'openrouter' | 'media';
  inputs: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number';
    placeholder?: string;
    options?: { label: string; value: string }[];
    required?: boolean;
    defaultValue?: any;
  }>;
  systemPrompt?: string;
}

export const AI_TOOLS: Record<string, AIToolConfig> = {
  // ─── WRITING TOOLS ────────────────────────────────────────────────
  'cold-email': {
    id: 'cold-email',
    name: 'Cold Email Outreach',
    category: 'writing',
    description: 'Generate high-converting cold outreach sequences that get opened and replied to.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an elite B2B sales copywriter. Output JSON with `subject_lines` (array of 3 variations), `email_body`, `follow_up_email`, and `call_to_action`.',
    inputs: [
      { name: 'product', label: 'Product / Offer', type: 'text', placeholder: 'e.g. AI-powered SEO content platform', required: true },
      { name: 'recipientRole', label: 'Target Prospect Role', type: 'text', placeholder: 'e.g. Head of Growth or VP Marketing', required: true },
      { name: 'painPoint', label: 'Core Problem / Pain Point', type: 'textarea', placeholder: 'e.g. Writers spending 15+ hours on drafts with poor organic rank', required: true },
      { name: 'tone', label: 'Tone', type: 'select', options: [{ label: 'Professional', value: 'professional' }, { label: 'Conversational', value: 'conversational' }, { label: 'Direct & Punchy', value: 'direct' }] },
    ],
  },
  'article-rewriter': {
    id: 'article-rewriter',
    name: 'Article Rewriter & Polisher',
    category: 'writing',
    description: 'Rewrite existing articles for clarity, modern flow, or higher engagement.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a master editor. Rewrite the provided text. Output JSON with `rewritten_content`, `key_improvements_made` (array of strings), and `estimated_readability_grade`.',
    inputs: [
      { name: 'article', label: 'Original Content', type: 'textarea', placeholder: 'Paste text or draft to rewrite…', required: true },
      { name: 'mode', label: 'Rewrite Style', type: 'select', options: [{ label: 'Make More Engaging', value: 'engaging' }, { label: 'Simplify & Clarify', value: 'simplify' }, { label: 'Executive / Authoritative', value: 'authoritative' }, { label: 'SEO-Optimized', value: 'seo' }] },
    ],
  },
  'paraphraser': {
    id: 'paraphraser',
    name: 'Instant Paraphraser',
    category: 'writing',
    description: 'Restructure and rephrase sentences without changing core meaning.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are an advanced linguist. Output JSON with `variations` (array of 4 paraphrased versions: casual, formal, concise, creative).',
    inputs: [
      { name: 'text', label: 'Sentence or Paragraph', type: 'textarea', placeholder: 'Enter sentence to paraphrase…', required: true },
    ],
  },
  'summarizer': {
    id: 'summarizer',
    name: 'Executive Summarizer',
    category: 'writing',
    description: 'Condense long articles, reports, or transcripts into key takeaways.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a research analyst. Output JSON with `one_sentence_summary`, `bullet_takeaways` (array of strings), and `actionable_next_steps`.',
    inputs: [
      { name: 'text', label: 'Content to Summarize', type: 'textarea', placeholder: 'Paste article or transcript…', required: true },
    ],
  },
  'grammar-improver': {
    id: 'grammar-improver',
    name: 'Grammar & Style Fixer',
    category: 'writing',
    description: 'Fix syntax, grammar, spelling, and passive voice issues.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a senior copyeditor. Output JSON with `corrected_text`, `corrections` (array of objects with `issue` and `fix`), and `overall_notes`.',
    inputs: [
      { name: 'text', label: 'Draft Text', type: 'textarea', placeholder: 'Paste text to inspect…', required: true },
    ],
  },
  'newsletter-generator': {
    id: 'newsletter-generator',
    name: 'Email Newsletter Writer',
    category: 'writing',
    description: 'Draft engaging, high-open-rate weekly newsletters with sections and CTAs.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a professional newsletter writer. Output JSON with `subject_line`, `preview_text`, `intro_hook`, `body_story`, `takeaways`, and `cta`.',
    inputs: [
      { name: 'topic', label: 'Newsletter Topic / Theme', type: 'text', placeholder: 'e.g. The Future of AI in Search Engines', required: true },
      { name: 'keyPoints', label: 'Key Stories or Updates', type: 'textarea', placeholder: 'List 2-3 main takeaways to cover…', required: true },
      { name: 'cta', label: 'Call to Action / Link', type: 'text', placeholder: 'e.g. Check out our new case study' },
    ],
  },
  'faq-generator': {
    id: 'faq-generator',
    name: 'FAQ Generator',
    category: 'writing',
    description: 'Generate comprehensive, relevant FAQs based on your product or topic.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a customer experience copywriter. Output JSON with `faqs` (array of objects with `question` and `answer`).',
    inputs: [
      { name: 'topic', label: 'Product / Subject', type: 'text', placeholder: 'e.g. PressLine Content Automation', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g. Small business marketing teams' },
    ],
  },

  // ─── MARKETING TOOLS ──────────────────────────────────────────────
  'ad-copy': {
    id: 'ad-copy',
    name: 'Omnichannel Ad Copy',
    category: 'marketing',
    description: 'Generate high-CTR ad copy tailored for Facebook, Google, or LinkedIn.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a world-class performance marketing copywriter. Output JSON with `headlines` (array of 5 options), `primary_text_variations` (array of 3), `descriptions` (array of 3), and `call_to_action`.',
    inputs: [
      { name: 'product', label: 'Product / Service Name', type: 'text', placeholder: 'e.g. PressLine AI', required: true },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'e.g. Content creators & affiliate marketers', required: true },
      { name: 'valueProp', label: 'Unique Value Proposition', type: 'textarea', placeholder: 'e.g. Rank faster on Google without writing for 20 hours', required: true },
      { name: 'platform', label: 'Ad Platform', type: 'select', options: [{ label: 'Facebook / Instagram', value: 'meta' }, { label: 'Google Search Ads', value: 'google' }, { label: 'LinkedIn Ads', value: 'linkedin' }] },
    ],
  },
  'landing-page-copy': {
    id: 'landing-page-copy',
    name: 'Landing Page Hero & Copy',
    category: 'marketing',
    description: 'Create high-converting landing page headlines, subheads, and benefit sections.',
    creditCost: 3,
    provider: 'openrouter',
    systemPrompt: 'You are a conversion rate optimization specialist. Output JSON with `hero_headline`, `hero_subheadline`, `primary_cta`, `feature_bullets` (array of objects with `title` and `description`), and `social_proof_prompt`.',
    inputs: [
      { name: 'product', label: 'Product Name & Category', type: 'text', placeholder: 'e.g. PressLine SaaS Content Studio', required: true },
      { name: 'benefit', label: 'Main Customer Benefit', type: 'textarea', placeholder: 'e.g. Turn raw keywords into fully published articles in minutes', required: true },
      { name: 'targetMarket', label: 'Target Customer', type: 'text', placeholder: 'e.g. Digital marketing agencies and creators' },
    ],
  },
  'pas-copywriter': {
    id: 'pas-copywriter',
    name: 'PAS Framework Copywriter',
    category: 'marketing',
    description: 'Use the proven Problem-Agitation-Solution marketing formula.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a direct-response marketing master. Output JSON with `problem`, `agitation`, `solution`, and `call_to_action`.',
    inputs: [
      { name: 'topic', label: 'Product / Problem', type: 'text', placeholder: 'e.g. Maintaining a consistent blog publishing schedule', required: true },
      { name: 'solution', label: 'Your Solution', type: 'text', placeholder: 'e.g. Automated AI article generation pipeline', required: true },
    ],
  },
  'customer-persona': {
    id: 'customer-persona',
    name: 'Buyer Persona Generator',
    category: 'marketing',
    description: 'Generate detailed customer avatars with pain points, objections, and triggers.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a customer research strategist. Output JSON with `persona_name`, `role`, `demographics`, `core_goals`, `biggest_pains`, `common_objections`, and `trigger_events`.',
    inputs: [
      { name: 'industry', label: 'Industry / Niche', type: 'text', placeholder: 'e.g. E-commerce apparel', required: true },
      { name: 'productPrice', label: 'Price Range', type: 'text', placeholder: 'e.g. Mid-range ($50-$150)' },
    ],
  },

  // ─── SOCIAL MEDIA ─────────────────────────────────────────────────
  'social-posts': {
    id: 'social-posts',
    name: 'Social Media Multi-Post',
    category: 'social',
    description: 'Create tailored posts for LinkedIn, X (Twitter), and Instagram.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an organic social media growth consultant. Output JSON with `post`, `alternative_versions` (array of strings), `call_to_action`, and `hashtags` (array).',
    inputs: [
      { name: 'topic', label: 'Topic or Article to Share', type: 'textarea', placeholder: 'Describe what you want to post about…', required: true },
      { name: 'platform', label: 'Target Platform', type: 'select', options: [{ label: 'LinkedIn', value: 'LinkedIn' }, { label: 'X (Twitter)', value: 'X' }, { label: 'Instagram', value: 'Instagram' }, { label: 'Threads', value: 'Threads' }] },
      { name: 'tone', label: 'Tone', type: 'select', options: [{ label: 'Thought Leadership', value: 'leadership' }, { label: 'Casual & Storytelling', value: 'storytelling' }, { label: 'Punchy & Provocative', value: 'punchy' }] },
    ],
  },
  'hooks': {
    id: 'hooks',
    name: 'Viral Hook Generator',
    category: 'social',
    description: 'Craft curiosity-inducing opening lines that stop the scroll.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a short-form content retention specialist. Output JSON with `question_hooks` (array), `contrarian_hooks` (array), `statistic_hooks` (array), and `story_hooks` (array).',
    inputs: [
      { name: 'topic', label: 'Subject / Video Concept', type: 'text', placeholder: 'e.g. Why most blogs get zero traffic', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: [{ label: 'X / Twitter', value: 'Twitter' }, { label: 'LinkedIn', value: 'LinkedIn' }, { label: 'TikTok / Reels', value: 'Shorts' }] },
    ],
  },
  'social-tags': {
    id: 'social-tags',
    name: 'Hashtag & Tag Generator',
    category: 'social',
    description: 'Generate high-relevance tags and hashtags for organic discoverability.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'Output JSON with `primary_hashtags` (array), `niche_hashtags` (array), and `trending_context_tags` (array).',
    inputs: [
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g. Remote work tips and productivity', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: [{ label: 'Instagram', value: 'Instagram' }, { label: 'LinkedIn', value: 'LinkedIn' }, { label: 'YouTube Shorts', value: 'YouTube' }] },
    ],
  },

  // ─── YOUTUBE ──────────────────────────────────────────────────────
  'youtube-description': {
    id: 'youtube-description',
    name: 'YouTube SEO Description',
    category: 'youtube',
    description: 'Rank higher with optimized YouTube descriptions, chapter markers, and links.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a YouTube SEO strategist. Output JSON with `title_suggestions` (array), `video_description`, `chapter_timestamps` (array), `tags` (array), and `cta`.',
    inputs: [
      { name: 'title', label: 'Video Title', type: 'text', placeholder: 'e.g. How to Build a SaaS in 2025', required: true },
      { name: 'summary', label: 'Video Summary or Key Points', type: 'textarea', placeholder: 'Brief overview of what happens in the video…', required: true },
      { name: 'keywords', label: 'Target Search Keywords', type: 'text', placeholder: 'e.g. saas, indie hacker, build in public' },
    ],
  },
  'youtube-titles': {
    id: 'youtube-titles',
    name: 'High-CTR YouTube Titles',
    category: 'youtube',
    description: 'Generate click-worthy YouTube titles with high Curiosity Gap scores.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a MrBeast-style YouTube title strategist. Output JSON with `curiosity_titles` (array of 5), `search_optimized_titles` (array of 5), and `short_punchy_titles` (array of 5).',
    inputs: [
      { name: 'topic', label: 'Video Topic', type: 'text', placeholder: 'e.g. How I built a $10k/mo side project', required: true },
    ],
  },

  // ─── VIDEO ────────────────────────────────────────────────────────
  'video-script': {
    id: 'video-script',
    name: 'Full Video Scriptwriter',
    category: 'video',
    description: 'Draft complete spoken scripts with scene directions, b-roll cues, and pacing.',
    creditCost: 4,
    provider: 'openrouter',
    systemPrompt: 'You are a professional video scriptwriter. Output JSON with `hook`, `intro`, `scenes` (array of objects with `scene_number`, `visual_cue`, `narration`, `b_roll`), and `outro_cta`.',
    inputs: [
      { name: 'topic', label: 'Video Concept', type: 'text', placeholder: 'e.g. Why Python is still dominating AI in 2025', required: true },
      { name: 'targetDuration', label: 'Target Duration', type: 'select', options: [{ label: 'Short (60 seconds / Reel)', value: '60s' }, { label: 'Medium (3-5 minutes)', value: '4m' }, { label: 'Long (8-12 minutes)', value: '10m' }] },
      { name: 'tone', label: 'Presenter Tone', type: 'text', placeholder: 'e.g. Energetic and accessible' },
    ],
  },
  'b-roll-generator': {
    id: 'b-roll-generator',
    name: 'B-Roll Shotlist Generator',
    category: 'video',
    description: 'Generate cinematic b-roll suggestions and visual cues for video editors.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a video director. Output JSON with `b_roll_cues` (array of objects with `scene`, `camera_movement`, `lighting`, `description`).',
    inputs: [
      { name: 'script', label: 'Script or Video Concept', type: 'textarea', placeholder: 'Paste your narration or scene outline…', required: true },
    ],
  },

  // ─── SEO TOOLS ────────────────────────────────────────────────────
  'meta-title': {
    id: 'meta-title',
    name: 'Meta Title & Description',
    category: 'seo',
    description: 'Generate Google-compliant meta titles (under 60 chars) and descriptions (under 160 chars).',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are an on-page SEO expert. Output JSON with `meta_titles` (array of objects with `title` and `character_count`), `meta_descriptions` (array of objects with `description` and `character_count`), and `primary_keyword_placement`.',
    inputs: [
      { name: 'topic', label: 'Page Topic', type: 'text', placeholder: 'e.g. Best Ergonomic Office Chairs', required: true },
      { name: 'primaryKeyword', label: 'Target Keyword', type: 'text', placeholder: 'e.g. best ergonomic chair', required: true },
      { name: 'brand', label: 'Brand Name (Optional)', type: 'text', placeholder: 'e.g. PressLine' },
    ],
  },
  'seo-brief': {
    id: 'seo-brief',
    name: 'SEO Content Brief',
    category: 'seo',
    description: 'Generate an exhaustive content brief with search intent, headers, and semantic keywords.',
    creditCost: 3,
    provider: 'openrouter',
    systemPrompt: 'You are a senior SEO strategist. Output JSON with `target_keyword`, `search_intent`, `recommended_word_count`, `h2_headings` (array), `h3_subheadings` (array), `semantic_entities` (array), and `internal_linking_suggestions` (array).',
    inputs: [
      { name: 'keyword', label: 'Target Keyword', type: 'text', placeholder: 'e.g. cloud database migration', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g. DevOps and backend engineers' },
    ],
  },

  // ─── CREATIVE ─────────────────────────────────────────────────────
  'creative-metaphors': {
    id: 'creative-metaphors',
    name: 'Metaphor & Analogy Generator',
    category: 'creative',
    description: 'Explain complex concepts simply with memorable metaphors and analogies.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are an educational communicator. Output JSON with `analogies` (array of objects with `analogy_title`, `explanation`, `why_it_works`).',
    inputs: [
      { name: 'concept', label: 'Concept to Explain', type: 'text', placeholder: 'e.g. How Supabase Row Level Security works', required: true },
      { name: 'audience', label: 'Audience Background', type: 'text', placeholder: 'e.g. Beginners with no technical knowledge' },
    ],
  },
  'story-outline': {
    id: 'story-outline',
    name: 'Story Arc & Narrative Plan',
    category: 'creative',
    description: 'Outline brand stories, case studies, or fiction narratives.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a narrative architect. Output JSON with `premise`, `inciting_incident`, `rising_action`, `climax`, `resolution`, and `thematic_takeaway`.',
    inputs: [
      { name: 'premise', label: 'Premise or Real Scenario', type: 'textarea', placeholder: 'Describe the core situation…', required: true },
    ],
  },

  // ─── VOICE ────────────────────────────────────────────────────────
  'voice-script': {
    id: 'voice-script',
    name: 'Voiceover Audio Script',
    category: 'voice',
    description: 'Format scripts specifically for voice actors or text-to-speech engines with pause cues.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an audio producer. Output JSON with `voiceover_script` (with [pause], [emphasis], and inflection tags), `tone_notes`, and `estimated_read_time_seconds`.',
    inputs: [
      { name: 'topic', label: 'Topic or Draft Text', type: 'textarea', placeholder: 'Enter text to adapt for audio speech…', required: true },
      { name: 'pace', label: 'Pacing', type: 'select', options: [{ label: 'Normal / Natural', value: 'normal' }, { label: 'Fast & Energetic', value: 'fast' }, { label: 'Deliberate & Calm', value: 'calm' }] },
    ],
  },
  'podcast-outline': {
    id: 'podcast-outline',
    name: 'Podcast Episode Guide',
    category: 'voice',
    description: 'Structured outlines for solo podcasts or guest interviews.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a podcast producer. Output JSON with `episode_title`, `guest_intro`, `segment_breakdown` (array with `segment_title` and `talking_points`), and `closing_wrap`.',
    inputs: [
      { name: 'topic', label: 'Episode Topic', type: 'text', placeholder: 'e.g. Bootstrapping AI SaaS to $50k MRR', required: true },
      { name: 'guest', label: 'Guest Name / Background (Optional)', type: 'text', placeholder: 'e.g. Founder of an AI startup' },
    ],
  },

  // ─── IMAGES ───────────────────────────────────────────────────────
  'image-prompt': {
    id: 'image-prompt',
    name: 'AI Image Prompt Generator',
    category: 'images',
    description: 'Create detailed prompts for Midjourney, DALL-E 3, Stable Diffusion, or Flux.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are an AI prompt engineer. Output JSON with `midjourney_prompt`, `flux_prompt`, `dall_e_prompt`, `suggested_aspect_ratio`, and `style_keywords` (array).',
    inputs: [
      { name: 'concept', label: 'Image Concept', type: 'textarea', placeholder: 'e.g. Futuristic workspace with holographic analytics dashboards and sleek lighting', required: true },
      { name: 'artStyle', label: 'Visual Style', type: 'select', options: [{ label: 'Photorealistic / Cinematic', value: 'cinematic' }, { label: '3D Render / Modern Tech', value: '3d' }, { label: 'Minimalist Vector Illustration', value: 'vector' }, { label: 'Editorial Magazine Photography', value: 'editorial' }] },
    ],
  },
  'thumbnail-concept': {
    id: 'thumbnail-concept',
    name: 'Thumbnail Visual Blueprint',
    category: 'images',
    description: 'High-contrast visual concepts for YouTube thumbnails with text placement.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a visual YouTube director. Output JSON with `primary_visual_subject`, `facial_expression_or_focus`, `background_elements`, `text_overlay_words` (max 3-4 words), and `color_contrast_palette`.',
    inputs: [
      { name: 'videoTitle', label: 'Video Title or Hook', type: 'text', placeholder: 'e.g. Why Everyone Is Quitting Remote Work', required: true },
    ],
  },
};
