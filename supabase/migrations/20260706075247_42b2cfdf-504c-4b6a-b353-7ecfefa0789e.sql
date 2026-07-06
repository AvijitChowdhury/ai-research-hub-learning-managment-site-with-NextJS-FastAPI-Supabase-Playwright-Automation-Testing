-- Courses catalog schema
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  students_count INTEGER NOT NULL DEFAULT 0,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  lessons_count INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'English',
  tag TEXT,
  thumbnail_gradient TEXT,
  instructor_name TEXT NOT NULL,
  instructor_title TEXT,
  instructor_bio TEXT,
  instructor_avatar TEXT,
  what_you_will_learn TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published courses are viewable by everyone" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX modules_course_id_idx ON public.modules(course_id);
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules of published courses are viewable" ON public.modules FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true));
CREATE POLICY "Admins manage modules" ON public.modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_secs INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'video',
  free_preview BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content_url TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX lessons_module_id_idx ON public.lessons(module_id);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons of published courses are viewable" ON public.lessons FOR SELECT USING (EXISTS (SELECT 1 FROM public.modules m JOIN public.courses c ON c.id=m.course_id WHERE m.id=module_id AND c.is_published=true));
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);
CREATE INDEX enrollments_user_idx ON public.enrollments(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own enrollments" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own enrollments" ON public.enrollments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all enrollments" ON public.enrollments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  position_secs INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX lesson_progress_user_course_idx ON public.lesson_progress(user_id, course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.courses (slug,title,subtitle,description,category,level,price_cents,currency,rating,reviews_count,students_count,duration_hours,lessons_count,language,tag,thumbnail_gradient,instructor_name,instructor_title,instructor_bio,instructor_avatar,what_you_will_learn,requirements,is_published,sort_order) VALUES ($sql$transformers-from-scratch$sql$,$sql$Transformers From Scratch$sql$,$sql$Build a decoder-only LLM in PyTorch, one matrix multiply at a time.$sql$,$sql$A rigorous, from-the-ground-up implementation of the transformer architecture. We derive attention on paper, then build tokenization, embeddings, multi-head attention, positional encodings, and training loops without any high-level framework abstractions. By the end you can read any modern language-model paper and reimplement it.$sql$,$sql$LLMs & NLP$sql$,$sql$Intermediate$sql$,14900,$sql$USD$sql$,4.9,1284,8420,22,48,$sql$English$sql$,$sql$arxiv:1706.03762$sql$,$sql$from-emerald-500/30 via-cyan-500/10 to-transparent$sql$,$sql$Dr. Ada Voss$sql$,$sql$Research Scientist, formerly DeepMind$sql$,$sql$Ada worked on the Chinchilla scaling paper and has taught deep learning at ETH Zürich for six years.$sql$,$sql$AV$sql$,ARRAY[$sql$Derive scaled dot-product attention from first principles$sql$,$sql$Implement multi-head attention with einsum in pure PyTorch$sql$,$sql$Train a 30M-parameter decoder-only model on TinyStories$sql$,$sql$Reproduce KV-caching and rotary position embeddings$sql$,$sql$Read and reimplement papers from arXiv in under a day$sql$,$sql$Diagnose training instabilities using loss and gradient telemetry$sql$]::text[],ARRAY[$sql$Comfort with Python and NumPy$sql$,$sql$Linear algebra (matrix multiplication, eigenvectors)$sql$,$sql$Basic PyTorch — tensors, autograd, nn.Module$sql$]::text[],true,0);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$transformers-from-scratch$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$01 · Foundations of Attention$sql$,0 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Why sequence models need attention$sql$,720,$sql$video$sql$,true),(1,$sql$Deriving softmax attention on paper$sql$,1140,$sql$video$sql$,true),(2,$sql$Implementing dot-product attention in NumPy$sql$,1620,$sql$video$sql$,false),(3,$sql$Numerical stability & scaling by √dk$sql$,900,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$transformers-from-scratch$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$02 · The Transformer Block$sql$,1 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Multi-head attention with einsum$sql$,1980,$sql$video$sql$,false),(1,$sql$Position-wise feed-forward networks$sql$,900,$sql$video$sql$,false),(2,$sql$Residual streams & pre-norm vs post-norm$sql$,1320,$sql$video$sql$,false),(3,$sql$Positional encodings: sinusoidal, learned, RoPE$sql$,1740,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$transformers-from-scratch$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$03 · Training a Small LLM$sql$,2 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Tokenization with BPE$sql$,1500,$sql$video$sql$,false),(1,$sql$The training loop, gradient accumulation, mixed precision$sql$,2100,$sql$video$sql$,false),(2,$sql$Debugging with weights & activation histograms$sql$,1620,$sql$video$sql$,false),(3,$sql$Sampling: greedy, top-k, top-p, temperature$sql$,1200,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$transformers-from-scratch$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$04 · Modern Variants$sql$,3 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$KV-cache and inference-time optimizations$sql$,1560,$sql$video$sql$,false),(1,$sql$Grouped-query and multi-query attention$sql$,1080,$sql$video$sql$,false),(2,$sql$Sliding window & long-context tricks$sql$,1440,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
INSERT INTO public.courses (slug,title,subtitle,description,category,level,price_cents,currency,rating,reviews_count,students_count,duration_hours,lessons_count,language,tag,thumbnail_gradient,instructor_name,instructor_title,instructor_bio,instructor_avatar,what_you_will_learn,requirements,is_published,sort_order) VALUES ($sql$rlhf-and-alignment$sql$,$sql$RLHF & Modern Alignment$sql$,$sql$PPO, DPO, and the mechanics of instruction-tuning frontier models.$sql$,$sql$A practical tour of the alignment stack used at frontier labs: supervised fine-tuning, reward modeling, PPO, and the newer preference-optimization family (DPO, IPO, KTO). Every technique is paired with runnable code on open-weight models.$sql$,$sql$Alignment & Safety$sql$,$sql$Advanced$sql$,19900,$sql$USD$sql$,4.8,642,3120,18,36,$sql$English$sql$,$sql$arxiv:2203.02155$sql$,$sql$from-purple-500/30 via-fuchsia-500/10 to-transparent$sql$,$sql$Prof. Miguel Ortiz$sql$,$sql$Berkeley CHAI · Alignment Researcher$sql$,$sql$Miguel co-authored foundational work on reward hacking and has advised alignment teams at Anthropic and OpenAI.$sql$,$sql$MO$sql$,ARRAY[$sql$Fine-tune a 7B model with SFT and evaluate with held-out sets$sql$,$sql$Train a reward model from human preference pairs$sql$,$sql$Implement PPO with KL-control from scratch$sql$,$sql$Compare PPO, DPO, and KTO on the same base model$sql$,$sql$Diagnose and mitigate reward hacking$sql$]::text[],ARRAY[$sql$Familiarity with transformer architectures$sql$,$sql$Comfort with PyTorch training loops$sql$,$sql$One GPU with ≥24GB VRAM (or access to a rented one)$sql$]::text[],true,1);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$rlhf-and-alignment$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$01 · The Alignment Problem$sql$,0 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$What alignment means, operationally$sql$,900,$sql$video$sql$,true),(1,$sql$Specification gaming: a taxonomy$sql$,1200,$sql$video$sql$,true)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$rlhf-and-alignment$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$02 · Supervised Fine-Tuning$sql$,1 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Dataset curation and instruction formats$sql$,1620,$sql$video$sql$,false),(1,$sql$LoRA vs full fine-tuning: cost and quality$sql$,1440,$sql$video$sql$,false),(2,$sql$Evaluation harnesses: MT-Bench, AlpacaEval$sql$,1080,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$rlhf-and-alignment$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$03 · Reward Modeling$sql$,2 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Collecting preference data at scale$sql$,1320,$sql$video$sql$,false),(1,$sql$Bradley-Terry loss and pairwise ranking$sql$,1500,$sql$video$sql$,false),(2,$sql$Failure modes: length bias, sycophancy$sql$,1740,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$rlhf-and-alignment$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$04 · PPO and DPO$sql$,3 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$PPO from scratch with KL control$sql$,2400,$sql$video$sql$,false),(1,$sql$DPO: the closed-form derivation$sql$,1620,$sql$video$sql$,false),(2,$sql$IPO, KTO and the preference-optimization zoo$sql$,1500,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
INSERT INTO public.courses (slug,title,subtitle,description,category,level,price_cents,currency,rating,reviews_count,students_count,duration_hours,lessons_count,language,tag,thumbnail_gradient,instructor_name,instructor_title,instructor_bio,instructor_avatar,what_you_will_learn,requirements,is_published,sort_order) VALUES ($sql$diffusion-models$sql$,$sql$Diffusion Models In Depth$sql$,$sql$Score matching, DDPM, DDIM, and the math behind Stable Diffusion.$sql$,$sql$Diffusion models power modern image, video, and audio generation. This course goes deep into the mathematics — SDEs, score matching, and variational bounds — then implements DDPM, DDIM, and classifier-free guidance in clean PyTorch.$sql$,$sql$Computer Vision$sql$,$sql$Advanced$sql$,17900,$sql$USD$sql$,4.9,921,5210,20,42,$sql$English$sql$,$sql$arxiv:2006.11239$sql$,$sql$from-cyan-500/30 via-blue-500/10 to-transparent$sql$,$sql$Dr. Hana Sato$sql$,$sql$Generative Models · Sony AI$sql$,$sql$Hana leads work on efficient sampling and has published at NeurIPS, ICML, and ICLR on diffusion theory.$sql$,$sql$HS$sql$,ARRAY[$sql$Understand the forward and reverse SDE formulation$sql$,$sql$Implement DDPM training on CIFAR-10$sql$,$sql$Add classifier-free guidance and see it in latent space$sql$,$sql$Convert DDPM to DDIM for 20-step sampling$sql$,$sql$Read Stable Diffusion's UNet code without getting lost$sql$]::text[],ARRAY[$sql$Calculus & probability$sql$,$sql$PyTorch fundamentals$sql$]::text[],true,2);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$diffusion-models$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$01 · The Math$sql$,0 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Forward diffusion as a Markov chain$sql$,1200,$sql$video$sql$,true),(1,$sql$Score matching, ELBO, and the reverse process$sql$,1800,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$diffusion-models$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$02 · DDPM$sql$,1 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$The UNet backbone$sql$,1500,$sql$video$sql$,false),(1,$sql$Training loop, EMA, and sampling$sql$,2100,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$diffusion-models$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$03 · DDIM and Guidance$sql$,2 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Deterministic sampling with DDIM$sql$,1620,$sql$video$sql$,false),(1,$sql$Classifier-free guidance from scratch$sql$,1500,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
INSERT INTO public.courses (slug,title,subtitle,description,category,level,price_cents,currency,rating,reviews_count,students_count,duration_hours,lessons_count,language,tag,thumbnail_gradient,instructor_name,instructor_title,instructor_bio,instructor_avatar,what_you_will_learn,requirements,is_published,sort_order) VALUES ($sql$ml-systems-engineering$sql$,$sql$ML Systems Engineering$sql$,$sql$Train, serve, and scale models across GPUs without the ops nightmare.$sql$,$sql$The bridge between research code and production-grade systems. Covers distributed training (FSDP, tensor parallel), inference serving (vLLM, TensorRT-LLM), profiling, and cost analysis.$sql$,$sql$ML Systems$sql$,$sql$Intermediate$sql$,18900,$sql$USD$sql$,4.7,512,2410,16,34,$sql$English$sql$,$sql$systems$sql$,$sql$from-orange-500/25 via-amber-500/10 to-transparent$sql$,$sql$Ken Adegbite$sql$,$sql$Infra Lead · Mistral AI$sql$,$sql$Ken has scaled training clusters from 8 to 8,192 GPUs and writes the widely-cited 'How to think about GPUs' series.$sql$,$sql$KA$sql$,ARRAY[$sql$Profile a training run and find the actual bottleneck$sql$,$sql$Shard a 30B model across 8 GPUs with FSDP$sql$,$sql$Serve an LLM at 2000 tok/s with vLLM$sql$,$sql$Estimate cost per million tokens correctly$sql$]::text[],ARRAY[$sql$Comfort with PyTorch$sql$,$sql$Basic Linux / SSH$sql$]::text[],true,3);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$ml-systems-engineering$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$01 · The GPU as a Computer$sql$,0 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Memory hierarchy, kernels, and bandwidth$sql$,1500,$sql$video$sql$,true),(1,$sql$Reading Nsight and torch.profiler$sql$,1800,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$ml-systems-engineering$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$02 · Distributed Training$sql$,1 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Data parallel, tensor parallel, pipeline parallel$sql$,1980,$sql$video$sql$,false),(1,$sql$FSDP in practice$sql$,1620,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$ml-systems-engineering$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$03 · Serving$sql$,2 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$vLLM & continuous batching$sql$,1500,$sql$video$sql$,false),(1,$sql$Quantization: INT8, FP8, AWQ, GPTQ$sql$,1740,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
INSERT INTO public.courses (slug,title,subtitle,description,category,level,price_cents,currency,rating,reviews_count,students_count,duration_hours,lessons_count,language,tag,thumbnail_gradient,instructor_name,instructor_title,instructor_bio,instructor_avatar,what_you_will_learn,requirements,is_published,sort_order) VALUES ($sql$reading-ai-papers$sql$,$sql$How To Read AI Papers$sql$,$sql$A repeatable method for extracting signal from arXiv every week.$sql$,$sql$You do not have time to read 200 papers a week. You do have time to read three, deeply. This course teaches the triage, note-taking, and reimplementation habits used by research engineers at frontier labs.$sql$,$sql$Research Methods$sql$,$sql$All Levels$sql$,7900,$sql$USD$sql$,4.8,2104,14320,6,18,$sql$English$sql$,$sql$meta$sql$,$sql$from-pink-500/25 via-rose-500/10 to-transparent$sql$,$sql$Elena Marchetti$sql$,$sql$Research Engineer · Independent$sql$,$sql$Elena writes 'The Gradient Digest' — a weekly newsletter read by 60k+ researchers.$sql$,$sql$EM$sql$,ARRAY[$sql$Triage 100 arXiv titles in 20 minutes$sql$,$sql$Extract the core contribution in three sentences$sql$,$sql$Reimplement a paper's key figure in an afternoon$sql$,$sql$Build a personal literature graph with backlinks$sql$]::text[],ARRAY[$sql$A curiosity for ML research$sql$]::text[],true,4);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$reading-ai-papers$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$01 · Triage$sql$,0 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$The 3-pass method$sql$,900,$sql$video$sql$,true),(1,$sql$Reading abstracts like a reviewer$sql$,720,$sql$video$sql$,true)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$reading-ai-papers$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$02 · Depth$sql$,1 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Diagramming the method section$sql$,1200,$sql$video$sql$,false),(1,$sql$Reproducing the headline figure$sql$,1500,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
INSERT INTO public.courses (slug,title,subtitle,description,category,level,price_cents,currency,rating,reviews_count,students_count,duration_hours,lessons_count,language,tag,thumbnail_gradient,instructor_name,instructor_title,instructor_bio,instructor_avatar,what_you_will_learn,requirements,is_published,sort_order) VALUES ($sql$reinforcement-learning-fundamentals$sql$,$sql$Reinforcement Learning: Fundamentals$sql$,$sql$From bandits to policy gradients, taught the Sutton & Barto way.$sql$,$sql$A modern, code-forward retelling of the classical RL curriculum: MDPs, dynamic programming, Monte Carlo, TD-learning, function approximation, and policy gradients. Ends with a working PPO agent on MuJoCo.$sql$,$sql$Reinforcement Learning$sql$,$sql$Beginner$sql$,12900,$sql$USD$sql$,4.7,738,4820,14,32,$sql$English$sql$,$sql$arxiv:1707.06347$sql$,$sql$from-lime-500/25 via-emerald-500/10 to-transparent$sql$,$sql$Dr. Priya Iyer$sql$,$sql$Robotics & RL · Carnegie Mellon$sql$,$sql$Priya's dissertation on model-based RL is a common reference in the field.$sql$,$sql$PI$sql$,ARRAY[$sql$Frame problems as MDPs correctly$sql$,$sql$Implement Q-learning and SARSA$sql$,$sql$Derive REINFORCE and actor-critic$sql$,$sql$Train PPO on continuous control tasks$sql$]::text[],ARRAY[$sql$Python$sql$,$sql$Basic probability$sql$]::text[],true,5);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$reinforcement-learning-fundamentals$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$01 · The MDP Framework$sql$,0 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$States, actions, rewards, returns$sql$,1080,$sql$video$sql$,true),(1,$sql$Bellman equations$sql$,1500,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$reinforcement-learning-fundamentals$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$02 · Tabular Methods$sql$,1 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$Monte Carlo methods$sql$,1320,$sql$video$sql$,false),(1,$sql$Temporal-difference learning$sql$,1620,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);
WITH co AS (SELECT id FROM public.courses WHERE slug=$sql$reinforcement-learning-fundamentals$sql$), mo AS (INSERT INTO public.modules (course_id,title,sort_order) SELECT id,$sql$03 · Deep RL$sql$,2 FROM co RETURNING id)
INSERT INTO public.lessons (module_id,sort_order,title,duration_secs,type,free_preview) SELECT mo.id,v.sort_order,v.title,v.duration_secs,v.type,v.free_preview FROM mo, (VALUES (0,$sql$DQN and its tricks$sql$,1800,$sql$video$sql$,false),(1,$sql$Policy gradients and PPO$sql$,2100,$sql$video$sql$,false)) AS v(sort_order,title,duration_secs,type,free_preview);