export interface AIToolConfig {
  id: string;
  name: string;
  category: string;
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
  'cold-email': {
    id: 'cold-email',
    name: 'Cold Email Script',
    category: 'writing',
    description: 'Generate highly-converting cold outreach emails.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an expert copywriter. Output JSON with `subject`, `preview_text`, `email_body`, `follow_up_email`, `alternative_subjects`, and `personalization_notes`.',
    inputs: [
      { name: 'product', label: 'Product/Service', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'industry', label: 'Target Industry', type: 'text', required: true },
      { name: 'recipientRole', label: 'Recipient Role', type: 'text', required: true },
      { name: 'painPoint', label: 'Pain Point', type: 'textarea', required: true },
      { name: 'offer', label: 'Offer/Value Prop', type: 'textarea', required: true },
      { name: 'tone', label: 'Tone', type: 'select', options: [{label: 'Professional', value: 'Professional'}, {label: 'Conversational', value: 'Conversational'}] },
    ]
  },
  'social-posts': {
    id: 'social-posts',
    name: 'Social Media Posts',
    category: 'social',
    description: 'Create tailored posts for various platforms.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an expert social media manager. Output JSON with `post`, `alternative_versions` (array of strings), `cta`, and `hashtags`.',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'textarea', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: [{label: 'LinkedIn', value: 'LinkedIn'}, {label: 'X/Twitter', value: 'X'}, {label: 'Instagram', value: 'Instagram'}, {label: 'Facebook', value: 'Facebook'}] },
      { name: 'audience', label: 'Audience', type: 'text', required: true },
      { name: 'goal', label: 'Goal', type: 'text', required: true },
      { name: 'tone', label: 'Tone', type: 'select', options: [{label: 'Professional', value: 'professional'}, {label: 'Educational', value: 'educational'}, {label: 'Storytelling', value: 'storytelling'}] },
    ]
  },
  'youtube-description': {
    id: 'youtube-description',
    name: 'YouTube Description',
    category: 'youtube',
    description: 'SEO-friendly descriptions with timestamps.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a YouTube SEO expert. Output JSON with `title_suggestion`, `short_description`, `full_description`, `chapters` (if timestamps given), `keywords`, `hashtags`, and `cta`.',
    inputs: [
      { name: 'title', label: 'Video Title', type: 'text', required: true },
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'summary', label: 'Transcript/Summary', type: 'textarea', required: true },
      { name: 'keywords', label: 'Keywords', type: 'text', required: true },
      { name: 'channelName', label: 'Channel Name', type: 'text' },
      { name: 'links', label: 'Links (Socials/Promos)', type: 'textarea' },
    ]
  },
  'product-description': {
    id: 'product-description',
    name: 'Product Description',
    category: 'writing',
    description: 'Compelling descriptions for your products.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an e-commerce copywriter. Output JSON with `short_description`, `long_description`, `bullet_benefits`, `features`, `seo_description`, and `cta`.',
    inputs: [
      { name: 'productName', label: 'Product Name', type: 'text', required: true },
      { name: 'category', label: 'Product Category', type: 'text', required: true },
      { name: 'features', label: 'Features', type: 'textarea', required: true },
      { name: 'benefits', label: 'Benefits', type: 'textarea', required: true },
      { name: 'targetCustomer', label: 'Target Customer', type: 'text', required: true },
      { name: 'brand', label: 'Brand', type: 'text' },
    ]
  },
  'article-rewriter': {
    id: 'article-rewriter',
    name: 'Article Rewriter',
    category: 'writing',
    description: 'Rewrite articles for clarity or different tone.',
    creditCost: 3,
    provider: 'openrouter',
    systemPrompt: 'You are an expert editor. Rewrite the article. Output JSON with `rewritten_article`, `summary`, and `seo_notes`. Ensure meaning is kept while changing tone or readability as requested.',
    inputs: [
      { name: 'article', label: 'Paste Article', type: 'textarea', required: true },
      { name: 'mode', label: 'Rewrite Mode', type: 'select', options: [{label: 'Professional', value: 'professional'}, {label: 'Conversational', value: 'conversational'}, {label: 'Simplify', value: 'simplify'}, {label: 'SEO Optimize', value: 'seo'}] },
    ]
  },
  'video-script': {
    id: 'video-script',
    name: 'Video Script Generator',
    category: 'video',
    description: 'Full video scripts with hooks and outlines.',
    creditCost: 5,
    provider: 'openrouter',
    systemPrompt: 'You are a master scriptwriter. Output JSON with `hook`, `intro`, `body`, `transitions`, `examples`, `cta`, `outro`, `b_roll_suggestions`, and `on_screen_text`.',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'platform', label: 'Platform (e.g. YouTube, TikTok)', type: 'text', required: true },
      { name: 'audience', label: 'Audience', type: 'text', required: true },
      { name: 'duration', label: 'Duration', type: 'text' },
      { name: 'outline', label: 'Outline/Research (Optional)', type: 'textarea' },
    ]
  },
  'paragraph-writer': {
    id: 'paragraph-writer',
    name: 'Paragraph Writer',
    category: 'writing',
    description: 'Generate quick paragraphs on any topic.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a versatile writer. Output JSON with `paragraphs` (array of strings) and `alternatives` (array of strings).',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true },
      { name: 'tone', label: 'Tone', type: 'text', required: true },
    ]
  },
  'social-tags': {
    id: 'social-tags',
    name: 'Social Tags Generator',
    category: 'social',
    description: 'Relevant hashtags and tags for your posts.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are a social media growth expert. Output JSON with `primary_tags`, `secondary_tags`, `niche_tags`, and `trending_style_suggestions` (all string arrays). Do not claim tags are definitively trending unless it is universally true.',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: [{label: 'Instagram', value: 'Instagram'}, {label: 'TikTok', value: 'TikTok'}, {label: 'YouTube', value: 'YouTube'}] },
    ]
  },
  'meta-title': {
    id: 'meta-title',
    name: 'Meta Title Generator',
    category: 'seo',
    description: 'SEO-optimized meta titles and descriptions.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are an SEO expert. Output JSON with `title_options` (array of strings), `character_counts`, `keyword_placement_analysis`, and `seo_notes`.',
    inputs: [
      { name: 'topic', label: 'Page Topic', type: 'text', required: true },
      { name: 'primaryKeyword', label: 'Primary Keyword', type: 'text', required: true },
      { name: 'secondaryKeyword', label: 'Secondary Keyword', type: 'text' },
      { name: 'brand', label: 'Brand', type: 'text' },
    ]
  },
  'hooks': {
    id: 'hooks',
    name: 'Hook Generator',
    category: 'social',
    description: 'Catchy hooks to grab your audience\'s attention.',
    creditCost: 1,
    provider: 'openrouter',
    systemPrompt: 'You are an attention-retention expert. Output JSON with `question_hooks`, `curiosity_hooks`, `story_hooks`, `contrarian_hooks`, `problem_hooks`, and `benefit_hooks` (each an array of strings).',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'platform', label: 'Platform', type: 'text', required: true },
      { name: 'audience', label: 'Audience', type: 'text', required: true },
    ]
  },
  'topic-research': {
    id: 'topic-research',
    name: 'Topic Research',
    category: 'seo',
    description: 'Detailed research overview and angles.',
    creditCost: 5,
    provider: 'openrouter',
    systemPrompt: 'You are a research analyst. Output JSON with `topic_overview`, `subtopics`, `key_questions`, `audience_questions`, `search_intent`, `content_angles`, `potential_article_ideas`, `faq_ideas`, `content_gaps`, and `outline_suggestions`. Clarify that AI research is not live web search.',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'audience', label: 'Audience', type: 'text', required: true },
      { name: 'industry', label: 'Industry', type: 'text' },
    ]
  },
  'script-outline': {
    id: 'script-outline',
    name: 'Script Outline',
    category: 'video',
    description: 'Structured outlines for your videos.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a video strategist. Output JSON with `hook`, `opening`, `main_sections` (array of objects with title, points, estimated_timing), `transitions`, `cta`, and `ending`.',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'duration', label: 'Duration (e.g. 5 mins)', type: 'text' },
      { name: 'audience', label: 'Audience', type: 'text' },
    ]
  },
  'metadata': {
    id: 'metadata',
    name: 'Metadata Generator',
    category: 'seo',
    description: 'Comprehensive metadata for your content.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an SEO metadata specialist. Output JSON with `title_suggestions`, `description`, `keywords`, `tags`, `hashtags`, `category_suggestions`, `cta`, and `seo_notes`.',
    inputs: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'topic', label: 'Topic', type: 'textarea', required: true },
      { name: 'platform', label: 'Platform', type: 'text' },
    ]
  },
  'script-summarizer': {
    id: 'script-summarizer',
    name: 'Script Summarizer',
    category: 'video',
    description: 'Summarize long scripts into key points.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are an expert summarizer. Output JSON with `short_summary`, `detailed_summary`, `key_points`, `main_argument`, `important_quotes`, `chapters`, `social_snippets`, and `youtube_description_idea`.',
    inputs: [
      { name: 'script', label: 'Paste Script', type: 'textarea', required: true },
    ]
  },
  'documentary': {
    id: 'documentary',
    name: 'Documentary Script',
    category: 'video',
    description: 'Long-form, detailed documentary scripts.',
    creditCost: 10,
    provider: 'openrouter',
    systemPrompt: 'You are a professional documentary filmmaker. Output JSON with `cold_open`, `narrator_introduction`, `historical_context`, `chapter_structure`, `narration`, `scene_descriptions`, `interview_placeholders`, `b_roll_suggestions`, and `conclusion`.',
    inputs: [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'period', label: 'Historical Period', type: 'text' },
      { name: 'style', label: 'Narrative Style', type: 'text' },
      { name: 'research', label: 'Research/Sources', type: 'textarea' },
    ]
  },
  'community-post': {
    id: 'community-post',
    name: 'Community Post Generator',
    category: 'social',
    description: 'Engaging posts for community tabs and groups.',
    creditCost: 2,
    provider: 'openrouter',
    systemPrompt: 'You are a community manager. Output JSON with `post`, `question`, `discussion_starter`, `poll_idea`, and `follow_up_comments`.',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'communityType', label: 'Community Type', type: 'select', options: [{label: 'YouTube Community', value: 'YouTube'}, {label: 'Facebook Group', value: 'Facebook'}, {label: 'Discord', value: 'Discord'}, {label: 'Reddit', value: 'Reddit'}] },
    ]
  },
  'thumbnail-generator': {
    id: 'thumbnail-generator',
    name: 'Thumbnail Generator',
    category: 'creative',
    description: 'AI-generated image thumbnails.',
    creditCost: 5,
    provider: 'media',
    inputs: [
      { name: 'videoTitle', label: 'Video Title', type: 'text', required: true },
      { name: 'style', label: 'Visual Style', type: 'text' },
    ]
  },
  'text-to-voice': {
    id: 'text-to-voice',
    name: 'Text to Voiceover',
    category: 'voice',
    description: 'Realistic AI voiceovers for your scripts.',
    creditCost: 4,
    provider: 'media',
    inputs: [
      { name: 'text', label: 'Text/Script', type: 'textarea', required: true },
      { name: 'voice', label: 'Voice Style', type: 'select', options: [{label: 'Professional', value: 'pro'}, {label: 'Energetic', value: 'energetic'}] },
    ]
  },
  'thumbnail-downloader': {
    id: 'thumbnail-downloader',
    name: 'Thumbnail Downloader',
    category: 'creative',
    description: 'Download public video thumbnails.',
    creditCost: 1,
    provider: 'media',
    inputs: [
      { name: 'url', label: 'Public URL', type: 'text', required: true },
    ]
  },
};
