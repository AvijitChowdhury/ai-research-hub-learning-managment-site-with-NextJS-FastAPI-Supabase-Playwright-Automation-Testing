export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: { name: string; title: string; bio: string; avatar: string };
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  price: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  lessonsCount: number;
  language: string;
  updated: string;
  thumbnailGradient: string; // for a synthetic thumbnail
  tag: string;
  whatYouWillLearn: string[];
  requirements: string[];
  modules: Module[];
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  title: string;
  durationSecs: number;
  type: "video" | "text" | "quiz";
  freePreview?: boolean;
};

const mod = (title: string, lessons: Array<[string, number, boolean?]>): Module => ({
  id: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  lessons: lessons.map(([t, d, fp], i) => ({
    id: `${title}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    title: t,
    durationSecs: d,
    type: "video",
    freePreview: fp,
  })),
});

export const CATEGORIES = [
  "Foundations",
  "LLMs & NLP",
  "Alignment & Safety",
  "Reinforcement Learning",
  "Computer Vision",
  "ML Systems",
  "Research Methods",
];

export const COURSES: Course[] = [
  {
    id: "c-01",
    slug: "transformers-from-scratch",
    title: "Transformers From Scratch",
    subtitle: "Build a decoder-only LLM in PyTorch, one matrix multiply at a time.",
    description:
      "A rigorous, from-the-ground-up implementation of the transformer architecture. We derive attention on paper, then build tokenization, embeddings, multi-head attention, positional encodings, and training loops without any high-level framework abstractions. By the end you can read any modern language-model paper and reimplement it.",
    instructor: {
      name: "Dr. Ada Voss",
      title: "Research Scientist, formerly DeepMind",
      bio: "Ada worked on the Chinchilla scaling paper and has taught deep learning at ETH Zürich for six years.",
      avatar: "AV",
    },
    category: "LLMs & NLP",
    level: "Intermediate",
    price: 149,
    currency: "USD",
    rating: 4.9,
    reviewsCount: 1284,
    studentsCount: 8420,
    durationHours: 22,
    lessonsCount: 48,
    language: "English",
    updated: "Jun 2026",
    thumbnailGradient: "from-emerald-500/30 via-cyan-500/10 to-transparent",
    tag: "arxiv:1706.03762",
    whatYouWillLearn: [
      "Derive scaled dot-product attention from first principles",
      "Implement multi-head attention with einsum in pure PyTorch",
      "Train a 30M-parameter decoder-only model on TinyStories",
      "Reproduce KV-caching and rotary position embeddings",
      "Read and reimplement papers from arXiv in under a day",
      "Diagnose training instabilities using loss and gradient telemetry",
    ],
    requirements: [
      "Comfort with Python and NumPy",
      "Linear algebra (matrix multiplication, eigenvectors)",
      "Basic PyTorch — tensors, autograd, nn.Module",
    ],
    modules: [
      mod("01 · Foundations of Attention", [
        ["Why sequence models need attention", 720, true],
        ["Deriving softmax attention on paper", 1140, true],
        ["Implementing dot-product attention in NumPy", 1620],
        ["Numerical stability & scaling by √dk", 900],
      ]),
      mod("02 · The Transformer Block", [
        ["Multi-head attention with einsum", 1980],
        ["Position-wise feed-forward networks", 900],
        ["Residual streams & pre-norm vs post-norm", 1320],
        ["Positional encodings: sinusoidal, learned, RoPE", 1740],
      ]),
      mod("03 · Training a Small LLM", [
        ["Tokenization with BPE", 1500],
        ["The training loop, gradient accumulation, mixed precision", 2100],
        ["Debugging with weights & activation histograms", 1620],
        ["Sampling: greedy, top-k, top-p, temperature", 1200],
      ]),
      mod("04 · Modern Variants", [
        ["KV-cache and inference-time optimizations", 1560],
        ["Grouped-query and multi-query attention", 1080],
        ["Sliding window & long-context tricks", 1440],
      ]),
    ],
  },
  {
    id: "c-02",
    slug: "rlhf-and-alignment",
    title: "RLHF & Modern Alignment",
    subtitle: "PPO, DPO, and the mechanics of instruction-tuning frontier models.",
    description:
      "A practical tour of the alignment stack used at frontier labs: supervised fine-tuning, reward modeling, PPO, and the newer preference-optimization family (DPO, IPO, KTO). Every technique is paired with runnable code on open-weight models.",
    instructor: {
      name: "Prof. Miguel Ortiz",
      title: "Berkeley CHAI · Alignment Researcher",
      bio: "Miguel co-authored foundational work on reward hacking and has advised alignment teams at Anthropic and OpenAI.",
      avatar: "MO",
    },
    category: "Alignment & Safety",
    level: "Advanced",
    price: 199,
    currency: "USD",
    rating: 4.8,
    reviewsCount: 642,
    studentsCount: 3120,
    durationHours: 18,
    lessonsCount: 36,
    language: "English",
    updated: "May 2026",
    thumbnailGradient: "from-purple-500/30 via-fuchsia-500/10 to-transparent",
    tag: "arxiv:2203.02155",
    whatYouWillLearn: [
      "Fine-tune a 7B model with SFT and evaluate with held-out sets",
      "Train a reward model from human preference pairs",
      "Implement PPO with KL-control from scratch",
      "Compare PPO, DPO, and KTO on the same base model",
      "Diagnose and mitigate reward hacking",
    ],
    requirements: [
      "Familiarity with transformer architectures",
      "Comfort with PyTorch training loops",
      "One GPU with ≥24GB VRAM (or access to a rented one)",
    ],
    modules: [
      mod("01 · The Alignment Problem", [
        ["What alignment means, operationally", 900, true],
        ["Specification gaming: a taxonomy", 1200, true],
      ]),
      mod("02 · Supervised Fine-Tuning", [
        ["Dataset curation and instruction formats", 1620],
        ["LoRA vs full fine-tuning: cost and quality", 1440],
        ["Evaluation harnesses: MT-Bench, AlpacaEval", 1080],
      ]),
      mod("03 · Reward Modeling", [
        ["Collecting preference data at scale", 1320],
        ["Bradley-Terry loss and pairwise ranking", 1500],
        ["Failure modes: length bias, sycophancy", 1740],
      ]),
      mod("04 · PPO and DPO", [
        ["PPO from scratch with KL control", 2400],
        ["DPO: the closed-form derivation", 1620],
        ["IPO, KTO and the preference-optimization zoo", 1500],
      ]),
    ],
  },
  {
    id: "c-03",
    slug: "diffusion-models",
    title: "Diffusion Models In Depth",
    subtitle: "Score matching, DDPM, DDIM, and the math behind Stable Diffusion.",
    description:
      "Diffusion models power modern image, video, and audio generation. This course goes deep into the mathematics — SDEs, score matching, and variational bounds — then implements DDPM, DDIM, and classifier-free guidance in clean PyTorch.",
    instructor: {
      name: "Dr. Hana Sato",
      title: "Generative Models · Sony AI",
      bio: "Hana leads work on efficient sampling and has published at NeurIPS, ICML, and ICLR on diffusion theory.",
      avatar: "HS",
    },
    category: "Computer Vision",
    level: "Advanced",
    price: 179,
    currency: "USD",
    rating: 4.9,
    reviewsCount: 921,
    studentsCount: 5210,
    durationHours: 20,
    lessonsCount: 42,
    language: "English",
    updated: "Apr 2026",
    thumbnailGradient: "from-cyan-500/30 via-blue-500/10 to-transparent",
    tag: "arxiv:2006.11239",
    whatYouWillLearn: [
      "Understand the forward and reverse SDE formulation",
      "Implement DDPM training on CIFAR-10",
      "Add classifier-free guidance and see it in latent space",
      "Convert DDPM to DDIM for 20-step sampling",
      "Read Stable Diffusion's UNet code without getting lost",
    ],
    requirements: ["Calculus & probability", "PyTorch fundamentals"],
    modules: [
      mod("01 · The Math", [
        ["Forward diffusion as a Markov chain", 1200, true],
        ["Score matching, ELBO, and the reverse process", 1800],
      ]),
      mod("02 · DDPM", [
        ["The UNet backbone", 1500],
        ["Training loop, EMA, and sampling", 2100],
      ]),
      mod("03 · DDIM and Guidance", [
        ["Deterministic sampling with DDIM", 1620],
        ["Classifier-free guidance from scratch", 1500],
      ]),
    ],
  },
  {
    id: "c-04",
    slug: "ml-systems-engineering",
    title: "ML Systems Engineering",
    subtitle: "Train, serve, and scale models across GPUs without the ops nightmare.",
    description:
      "The bridge between research code and production-grade systems. Covers distributed training (FSDP, tensor parallel), inference serving (vLLM, TensorRT-LLM), profiling, and cost analysis.",
    instructor: {
      name: "Ken Adegbite",
      title: "Infra Lead · Mistral AI",
      bio: "Ken has scaled training clusters from 8 to 8,192 GPUs and writes the widely-cited 'How to think about GPUs' series.",
      avatar: "KA",
    },
    category: "ML Systems",
    level: "Intermediate",
    price: 189,
    currency: "USD",
    rating: 4.7,
    reviewsCount: 512,
    studentsCount: 2410,
    durationHours: 16,
    lessonsCount: 34,
    language: "English",
    updated: "Jun 2026",
    thumbnailGradient: "from-orange-500/25 via-amber-500/10 to-transparent",
    tag: "systems",
    whatYouWillLearn: [
      "Profile a training run and find the actual bottleneck",
      "Shard a 30B model across 8 GPUs with FSDP",
      "Serve an LLM at 2000 tok/s with vLLM",
      "Estimate cost per million tokens correctly",
    ],
    requirements: ["Comfort with PyTorch", "Basic Linux / SSH"],
    modules: [
      mod("01 · The GPU as a Computer", [
        ["Memory hierarchy, kernels, and bandwidth", 1500, true],
        ["Reading Nsight and torch.profiler", 1800],
      ]),
      mod("02 · Distributed Training", [
        ["Data parallel, tensor parallel, pipeline parallel", 1980],
        ["FSDP in practice", 1620],
      ]),
      mod("03 · Serving", [
        ["vLLM & continuous batching", 1500],
        ["Quantization: INT8, FP8, AWQ, GPTQ", 1740],
      ]),
    ],
  },
  {
    id: "c-05",
    slug: "reading-ai-papers",
    title: "How To Read AI Papers",
    subtitle: "A repeatable method for extracting signal from arXiv every week.",
    description:
      "You do not have time to read 200 papers a week. You do have time to read three, deeply. This course teaches the triage, note-taking, and reimplementation habits used by research engineers at frontier labs.",
    instructor: {
      name: "Elena Marchetti",
      title: "Research Engineer · Independent",
      bio: "Elena writes 'The Gradient Digest' — a weekly newsletter read by 60k+ researchers.",
      avatar: "EM",
    },
    category: "Research Methods",
    level: "All Levels",
    price: 79,
    currency: "USD",
    rating: 4.8,
    reviewsCount: 2104,
    studentsCount: 14320,
    durationHours: 6,
    lessonsCount: 18,
    language: "English",
    updated: "Jul 2026",
    thumbnailGradient: "from-pink-500/25 via-rose-500/10 to-transparent",
    tag: "meta",
    whatYouWillLearn: [
      "Triage 100 arXiv titles in 20 minutes",
      "Extract the core contribution in three sentences",
      "Reimplement a paper's key figure in an afternoon",
      "Build a personal literature graph with backlinks",
    ],
    requirements: ["A curiosity for ML research"],
    modules: [
      mod("01 · Triage", [
        ["The 3-pass method", 900, true],
        ["Reading abstracts like a reviewer", 720, true],
      ]),
      mod("02 · Depth", [
        ["Diagramming the method section", 1200],
        ["Reproducing the headline figure", 1500],
      ]),
    ],
  },
  {
    id: "c-06",
    slug: "reinforcement-learning-fundamentals",
    title: "Reinforcement Learning: Fundamentals",
    subtitle: "From bandits to policy gradients, taught the Sutton & Barto way.",
    description:
      "A modern, code-forward retelling of the classical RL curriculum: MDPs, dynamic programming, Monte Carlo, TD-learning, function approximation, and policy gradients. Ends with a working PPO agent on MuJoCo.",
    instructor: {
      name: "Dr. Priya Iyer",
      title: "Robotics & RL · Carnegie Mellon",
      bio: "Priya's dissertation on model-based RL is a common reference in the field.",
      avatar: "PI",
    },
    category: "Reinforcement Learning",
    level: "Beginner",
    price: 129,
    currency: "USD",
    rating: 4.7,
    reviewsCount: 738,
    studentsCount: 4820,
    durationHours: 14,
    lessonsCount: 32,
    language: "English",
    updated: "Mar 2026",
    thumbnailGradient: "from-lime-500/25 via-emerald-500/10 to-transparent",
    tag: "arxiv:1707.06347",
    whatYouWillLearn: [
      "Frame problems as MDPs correctly",
      "Implement Q-learning and SARSA",
      "Derive REINFORCE and actor-critic",
      "Train PPO on continuous control tasks",
    ],
    requirements: ["Python", "Basic probability"],
    modules: [
      mod("01 · The MDP Framework", [
        ["States, actions, rewards, returns", 1080, true],
        ["Bellman equations", 1500],
      ]),
      mod("02 · Tabular Methods", [
        ["Monte Carlo methods", 1320],
        ["Temporal-difference learning", 1620],
      ]),
      mod("03 · Deep RL", [
        ["DQN and its tricks", 1800],
        ["Policy gradients and PPO", 2100],
      ]),
    ],
  },
];

export function courseBySlug(slug: string) {
  return COURSES.find((c) => c.slug === slug);
}

export function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Mock enrolled state for the dashboard
export const ENROLLMENTS = [
  { courseSlug: "transformers-from-scratch", progress: 62, lastLesson: "Multi-head attention with einsum" },
  { courseSlug: "rlhf-and-alignment", progress: 18, lastLesson: "Specification gaming: a taxonomy" },
  { courseSlug: "reading-ai-papers", progress: 100, lastLesson: "Reproducing the headline figure" },
];
