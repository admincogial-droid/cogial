import {
  Newspaper, Zap, PenLine, ListTree, BookUser, Star, Repeat2, SpellCheck2,
  HelpCircle, AlignLeft, FlagTriangleRight, Tags, Radar, Compass, Globe2,
  Handshake, Users, IdCard, UserCog, Plug, Rss, ShoppingCart,
} from "lucide-react";

export const featureCategories = [
  {
    id: "create",
    label: "Content Creation Tools",
    title: "Write like a pro, every time",
    blurb: "Generate high-quality, SEO-optimized articles in minutes and elevate your affiliate marketing game with AI-driven content solutions.",
    tools: [
      { icon: Zap, name: "AI Bulk Article Generation", desc: "Write up to 1k blog articles just in 1-click also Publish to your WordPress & Blogger site automatically." },
      { icon: Newspaper, name: "Short Info Article Generator", desc: "Just input your keywords, Cogial will write contents and publish to your website automatically." },
      { icon: PenLine, name: "Human-Like Mode", desc: "Modify and edit your outline and get article generated with AI depending on that outline in an interactive editor." },
      { icon: ListTree, name: "Blog Article Outline Generator", desc: "The Blog Article Outline Generator simplifies creating structured and organized blog outlines quickly." },
      { icon: BookUser, name: "Biography Article Editor", desc: "Write your keywords here. You can write multiple keyword line by line. One keyword per line." },
      { icon: Star, name: "Amazon Review Article", desc: "Just input your keywords, Cogial will write contents and publish review article to your website automatically." },
    ],
  },
  {
    id: "refine",
    label: "Content Optimization Tools",
    title: "Perfect your sentences and structure",
    blurb: "Tighten sentences, fix grammar, and shape the pieces every article needs to feel complete.",
    tools: [
      { icon: Repeat2, name: "Rewrite Paragraph", desc: "Rewrite Paragraph helps rephrase text while keeping its original meaning intact." },
      { icon: SpellCheck2, name: "Sentence Correction", desc: "Perfect your sentences with our Sentence Correction tool with Cogial Ai tools." },
      { icon: HelpCircle, name: "Generate FAQs", desc: "Write comprehensive and tailored Frequently Asked Questions sections for your website or business." },
      { icon: AlignLeft, name: "Generate Introduction", desc: "Craft compelling introductions that capture your audience's attention from the start." },
      { icon: FlagTriangleRight, name: "Generate Conclusion", desc: "Generate Conclusion helps create concise and effective conclusions for any content." },
    ],
  }
];

export const workflowSteps = [
  { step: "Set", title: "Select your tool", desc: "Pick a tool from our intelligent workspace and provide your initial keywords or topic." },
  { step: "Run", title: "Generate content", desc: "Cogial drafts, structures and formats the piece against your chosen tone and length." },
  { step: "Proof", title: "Refine and edit", desc: "Review inline, use the Human-Like Mode to modify outlines, or approve it as-is." },
  { step: "Ship", title: "Publish automatically", desc: "Publish straight to WordPress or Blogger with zero friction." },
];
