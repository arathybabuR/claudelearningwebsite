export const topics = [
  {
    id: 'models',
    title: 'Models & Pricing',
    description: 'The current Claude model lineup with their IDs, context windows, pricing, and when to use each.',
    models: [
      { name: 'Claude Fable 5.1', id: 'claude-fable-5-1', context: '1M', input: '$10.00', output: '$50.00', note: 'Most capable; thinking always on; effort-only control' },
      { name: 'Claude Opus 5.5', id: 'claude-opus-5-5', context: '1M', input: '$4.00', output: '$20.00', note: 'Default model; effort default: medium' },
      { name: 'Claude Opus 5', id: 'claude-opus-5', context: '1M', input: '$5.00', output: '$25.00', note: 'Effort default: high' },
      { name: 'Claude Sonnet 5.5', id: 'claude-sonnet-5-5', context: '1M', input: '$2.00', output: '$10.00', note: 'Speed + capability; effort default: high' },
      { name: 'Claude Sonnet 5', id: 'claude-sonnet-5', context: '1M', input: '$2.00', output: '$10.00', note: '' },
      { name: 'Claude Sonnet 4.6', id: 'claude-sonnet-4-6', context: '1M', input: '$3.00', output: '$15.00', note: '' },
      { name: 'Claude Haiku 4.5', id: 'claude-haiku-4-5', context: '200K', input: '$1.00', output: '$5.00', note: 'Uses budget_tokens for thinking (not adaptive)' },
    ],
    keyPoints: [
      { title: 'Always use exact model IDs', content: 'Never append date suffixes. Use "claude-opus-5-5" not "claude-opus-5-5-20260401".' },
      { title: 'Default to claude-opus-5-5', content: 'Use Opus 5.5 unless the user explicitly names a different model. Never downgrade for cost — that is the user\'s decision.' },
      { title: 'Haiku uses budget_tokens', content: 'Claude Haiku 4.5 still uses {type:"enabled", budget_tokens: N} for thinking. All other current models use adaptive thinking.' },
      { title: 'Cache reads pricing', content: 'Opus 5.5: $0.20/MTok reads. Fable 5.1: $0.25/MTok reads.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

# Default — always Opus 5.5 unless told otherwise
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.content[0].text)`,
    quiz: [
      { q: 'What is the default model to use?', a: 'claude-opus-5-5 (Claude Opus 5.5)' },
      { q: 'What is Claude Haiku 4.5\'s context window size?', a: '200K tokens' },
      { q: 'What is Opus 5.5\'s default effort level?', a: 'medium (unlike other models that default to high)' },
      { q: 'How should you specify model versions?', a: 'Use the exact ID from the table with no date suffix appended.' },
    ]
  },
  {
    id: 'messages-api',
    title: 'Messages API',
    description: 'Everything goes through POST /v1/messages. Understanding the request and response structure is foundational.',
    keyPoints: [
      { title: 'Required fields', content: 'model (string), max_tokens (int), messages (array). system is optional but recommended.' },
      { title: 'Message structure', content: '[{role: "user"|"assistant", content: "string" or content block array}]' },
      { title: 'Response stop_reason', content: '"end_turn" | "max_tokens" | "tool_use" | "pause_turn" | "refusal". Always check stop_reason before reading content.' },
      { title: 'No prefill on modern models', content: 'Assistant message prefills return 400 on Fable 5, Opus 5/5.5, Sonnet 5/5.5, and 4.6/4.7/4.8 family. Use system prompts or structured outputs instead.' },
      { title: 'Roles in messages', content: 'Only "user" and "assistant" are valid roles in the messages array. System prompt goes in the top-level "system" field.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "What is 2+2?"},
        {"role": "assistant", "content": "2+2 equals 4."},
        {"role": "user", "content": "And 4+4?"},
    ]
)

# Always check stop_reason first
if response.stop_reason == "end_turn":
    print(response.content[0].text)
elif response.stop_reason == "refusal":
    print("Request was refused:", response.stop_details)`,
    quiz: [
      { q: 'What are the three required fields in a Messages API request?', a: 'model, max_tokens, messages' },
      { q: 'What stop_reason indicates the model finished normally?', a: '"end_turn"' },
      { q: 'Where does the system prompt go in the request?', a: 'Top-level "system" field, not inside messages array' },
      { q: 'What does stop_reason "refusal" mean?', a: 'Safety classifiers declined the request (still HTTP 200). Check stop_details.category.' },
    ]
  },
  {
    id: 'parameters',
    title: 'Key Parameters',
    description: 'Important request parameters that control model behavior, output length, and sampling.',
    keyPoints: [
      { title: 'max_tokens (required)', content: 'Default to ~16K for non-streaming, ~64K for streaming. Never lowball — truncation mid-thought requires a retry.' },
      { title: 'temperature / top_p / top_k', content: 'REMOVED on Fable 5, Opus 5/5.5/4.7/4.8, Sonnet 5/5.5 — returns 400 if sent. Allowed on Haiku 4.5 and Opus/Sonnet 4.6.' },
      { title: 'output_config.effort', content: 'GA (no beta header). Values: "low"|"medium"|"high"|"xhigh"|"max". Placed inside output_config, not top-level.' },
      { title: 'stop_sequences', content: 'Array of strings where Claude will stop generating. Still available on all models.' },
      { title: '128K max output', content: 'Fable 5, Opus 5/5.5/4.6/4.7/4.8, Sonnet 5/5.5/4.6 support 128K max_tokens. Streaming is REQUIRED for large values to avoid HTTP timeouts.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

# Effort is inside output_config, not top-level
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    output_config={"effort": "high"},
    system="You are a coding expert.",
    messages=[{"role": "user", "content": "Write a sorting algorithm."}]
)

# For large outputs, use streaming
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=64000,
    output_config={"effort": "xhigh"},
    messages=[{"role": "user", "content": "Write detailed docs."}]
) as stream:
    response = stream.get_final_message()`,
    quiz: [
      { q: 'Where does the "effort" parameter go?', a: 'Inside output_config: {"output_config": {"effort": "high"}} — not at the top level' },
      { q: 'What happens if you send temperature to Claude Opus 5.5?', a: 'Returns a 400 error — sampling parameters are removed on modern models' },
      { q: 'When is streaming required?', a: 'When using large max_tokens values (e.g. 128K) to avoid HTTP timeouts' },
      { q: 'What is the recommended max_tokens default for non-streaming requests?', a: '~16,000 tokens' },
    ]
  },
  {
    id: 'thinking',
    title: 'Thinking & Effort',
    description: 'Adaptive thinking replaces fixed budget_tokens. Effort controls depth and cost across all modern models.',
    keyPoints: [
      { title: 'Adaptive thinking', content: '{type: "adaptive"} — Claude decides when and how much to think. Use on all models except Haiku 4.5.' },
      { title: 'Omitting thinking param', content: 'On Fable 5/5.1 and Opus 5.5: runs adaptive by default. On Opus 4.8/4.7: runs WITHOUT thinking — set it explicitly.' },
      { title: 'budget_tokens deprecated', content: 'Removed on Fable 5/5.1, Opus 5.5/5/4.7/4.8, Sonnet 5/5.5 — returns 400. Only functional on Opus/Sonnet 4.6 as an escape hatch.' },
      { title: 'Fable 5.1 special rules', content: 'Thinking is always on. {type:"disabled"} returns 400. {type:"enabled", budget_tokens:N} returns 400. Only use {type:"adaptive"} or omit the param.' },
      { title: 'Effort levels', content: '"low" | "medium" | "high" | "xhigh" | "max". Opus 5.5 defaults to "medium". All others default to "high". xhigh best for coding/agentic work.' },
      { title: 'thinking.display', content: '"omitted" (default on Fable/Opus 5.x/Sonnet 5.x) — looks like a long pause. Set display:"summarized" to show readable reasoning to users.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

# Correct: adaptive thinking with effort
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "Solve this complex problem..."}]
)

# Haiku 4.5 still uses budget_tokens
haiku_response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=8000,
    thinking={"type": "enabled", "budget_tokens": 2000},
    messages=[{"role": "user", "content": "Think through this..."}]
)`,
    quiz: [
      { q: 'What thinking config should you use on Claude Opus 5.5?', a: '{type: "adaptive"} or omit the thinking parameter' },
      { q: 'What happens if you omit the thinking param on Claude Opus 4.8?', a: 'Thinking runs WITHOUT being enabled — must set {type: "adaptive"} explicitly' },
      { q: 'Which model still requires budget_tokens for thinking?', a: 'Claude Haiku 4.5' },
      { q: 'What is the best effort level for coding and agentic work?', a: '"xhigh" — between high and max' },
    ]
  },
  {
    id: 'tool-use',
    title: 'Tool Use & Function Calling',
    description: 'Define tools that Claude can call. The SDK tool runner handles the loop automatically.',
    keyPoints: [
      { title: 'Tool definition fields', content: 'name, description, input_schema (JSON Schema with type, properties, required). Add strict:true to guarantee schema-valid inputs.' },
      { title: 'Parallel tool use (default on)', content: 'One assistant turn may have multiple tool_use blocks. Execute concurrently, return ALL tool_result blocks in one user message.' },
      { title: 'Forced tool use removed', content: 'tool_choice:{type:"any"} and {type:"tool"} return 400 on Fable 5.1, Opus 5.5, Sonnet 5.5. Use {type:"auto"} + prompt instruction instead.' },
      { title: 'Tool Runner (SDK beta)', content: 'client.beta.messages.tool_runner(...) drives the loop for you. Python: @beta_tool decorator. TypeScript: betaZodTool().' },
      { title: 'Error handling', content: 'For a failed tool, return tool_result with is_error:true — never drop it. Splitting parallel results across messages trains Claude to stop making parallel calls.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City name"}
            },
            "required": ["location"]
        },
        "strict": True  # Guarantees schema-valid inputs
    }
]

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in Paris?"}]
)

if response.stop_reason == "tool_use":
    tool_call = next(b for b in response.content if b.type == "tool_use")
    # Execute your function here
    result = get_weather(tool_call.input["location"])

    # Return ALL results in one message
    messages = [
        {"role": "user", "content": "What's the weather in Paris?"},
        {"role": "assistant", "content": response.content},
        {"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": tool_call.id, "content": result}
        ]}
    ]`,
    quiz: [
      { q: 'How should you return multiple parallel tool results?', a: 'All tool_result blocks in a single user message — never split across multiple messages' },
      { q: 'What is the effect of strict:true on a tool?', a: 'Guarantees tool_use.input validates exactly against the schema' },
      { q: 'What replaces tool_choice:{type:"any"} on Opus 5.5?', a: 'Use tool_choice:{type:"auto"} plus an explicit prompt instruction naming the tool' },
      { q: 'What should you send for a failed tool call?', a: 'A tool_result with is_error:true — never drop failed results' },
    ]
  },
  {
    id: 'prompt-caching',
    title: 'Prompt Caching',
    description: 'Cache stable content to reduce costs on repeated requests. Cache is a prefix match — any change invalidates everything after it.',
    keyPoints: [
      { title: 'Render order matters', content: 'tools → system → messages. Put stable content first (frozen system prompt, deterministic tool list), volatile content last.' },
      { title: 'cache_control placement', content: 'Add {cache_control: {type:"ephemeral"}} to the last content block you want cached. Up to 4 breakpoints per request.' },
      { title: 'Minimum cacheable prefix', content: '512–4096 tokens depending on model. Shorter prefixes silently will not cache.' },
      { title: 'Verify hits', content: 'Check usage.cache_read_input_tokens > 0 after repeated requests. If zero, a silent invalidator is at work.' },
      { title: 'Common invalidators', content: 'datetime.now() in system prompt, unsorted JSON, varying tool set order, modifying any byte before the last breakpoint.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are an expert. Here is the large stable document: " + large_document,
            "cache_control": {"type": "ephemeral"}  # Cache everything up to here
        }
    ],
    messages=[
        {"role": "user", "content": "Question about the document?"}
    ]
)

# Verify the cache is working
print("Cache read tokens:", response.usage.cache_read_input_tokens)
print("Cache created tokens:", response.usage.cache_creation_input_tokens)`,
    quiz: [
      { q: 'What is the render order for prompt caching prefix matching?', a: 'tools → system → messages' },
      { q: 'How many cache breakpoints can you have per request?', a: 'Up to 4' },
      { q: 'How do you verify cache hits are occurring?', a: 'Check usage.cache_read_input_tokens > 0 on the response' },
      { q: 'What is a common silent cache invalidator?', a: 'Dynamic content (e.g., datetime.now()) before the breakpoint, or unsorted tool definitions' },
    ]
  },
  {
    id: 'streaming',
    title: 'Streaming',
    description: 'Use streaming for real-time output, large responses, and to avoid HTTP timeouts on long requests.',
    keyPoints: [
      { title: 'When to stream', content: 'Long inputs, long outputs, high max_tokens, chat UIs. Required for 128K max_tokens on current models.' },
      { title: 'get_final_message()', content: 'Use .get_final_message() / .finalMessage() helper to get the complete response without handling individual events.' },
      { title: 'Task Budgets require streaming', content: 'task_budget must be used with client.beta.messages.stream(...) — not .create()' },
      { title: 'TS timeout difference', content: 'TypeScript SDK scales default timeout up to 60 min for large max_tokens on non-streaming requests.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

# Simple streaming — get full message at end
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=64000,
    messages=[{"role": "user", "content": "Write a long story..."}]
) as stream:
    # Option 1: Get final message
    response = stream.get_final_message()

# Option 2: Real-time streaming to user
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Explain quantum computing"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`,
    quiz: [
      { q: 'What helper gets the full response without handling stream events?', a: '.get_final_message() (Python) / .finalMessage() (TypeScript)' },
      { q: 'When is streaming required?', a: 'When max_tokens is very large (e.g. 128K) to avoid HTTP timeouts' },
      { q: 'What SDK feature requires streaming in its usage?', a: 'Task Budgets (task_budget inside output_config with client.beta.messages.stream)' },
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Refusals',
    description: 'Modern Claude models include safety classifiers. Understanding refusal handling is essential for production apps.',
    keyPoints: [
      { title: 'Refusal = HTTP 200', content: 'A refused request returns HTTP 200 with stop_reason:"refusal" and stop_details.category. Always check stop_reason BEFORE reading content.' },
      { title: 'Refusal categories', content: '"cyber", "bio", "reasoning_extraction", "frontier_llm", "general_harms". Category can also be null.' },
      { title: 'stop_details only on refusal', content: 'response.stop_details is null for all other stop reasons (end_turn, max_tokens, tool_use). Guard before reading.' },
      { title: 'Server-side fallbacks', content: 'Add betas:["server-side-fallback-2026-07-01"] + fallbacks:"default" to auto-route around refusals. Include this by default on Fable 5.1, Opus 5.5, Opus 5, Sonnet 5.5.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    # Include fallbacks by default on modern models
    betas=["server-side-fallback-2026-07-01"],
    fallbacks="default",
    messages=[{"role": "user", "content": "Help me with this task"}]
)

# ALWAYS check stop_reason first
if response.stop_reason == "refusal":
    category = response.stop_details.category if response.stop_details else None
    print(f"Request refused. Category: {category}")
elif response.stop_reason == "end_turn":
    print(response.content[0].text)
elif response.stop_reason == "max_tokens":
    print("Response truncated — increase max_tokens")`,
    quiz: [
      { q: 'What HTTP status code does a Claude refusal return?', a: 'HTTP 200 — not a 4xx error' },
      { q: 'When is response.stop_details populated?', a: 'Only when stop_reason == "refusal". It is null for all other stop reasons.' },
      { q: 'What parameter enables automatic fallback routing on refusals?', a: 'betas:["server-side-fallback-2026-07-01"] + fallbacks:"default"' },
    ]
  },
  {
    id: 'batch-api',
    title: 'Message Batches',
    description: 'Process large volumes asynchronously at 50% cost. No beta header required.',
    keyPoints: [
      { title: '50% cost reduction', content: 'Batches run asynchronously and are billed at half the standard rate.' },
      { title: 'custom_id is essential', content: 'Results arrive in ANY order — always key results by custom_id, never by position.' },
      { title: 'Poll for completion', content: 'Poll retrieve(id).processing_status until "ended". Then stream results.' },
      { title: 'Result types', content: '"succeeded" | "errored" | "canceled" | "expired". Check .result.type before reading .result.message.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

# Create batch
batch = client.messages.batches.create(
    requests=[
        anthropic.Request(
            custom_id="request-1",
            params=anthropic.MessageCreateParamsNonStreaming(
                model="claude-opus-5-5",
                max_tokens=1024,
                messages=[{"role": "user", "content": "Hello!"}]
            )
        ),
        anthropic.Request(
            custom_id="request-2",
            params=anthropic.MessageCreateParamsNonStreaming(
                model="claude-opus-5-5",
                max_tokens=1024,
                messages=[{"role": "user", "content": "How are you?"}]
            )
        )
    ]
)

# Poll until done
import time
while True:
    batch = client.messages.batches.retrieve(batch.id)
    if batch.processing_status == "ended":
        break
    time.sleep(60)

# Stream results — key by custom_id, not position
results = {}
for result in client.messages.batches.results(batch.id):
    if result.result.type == "succeeded":
        results[result.custom_id] = result.result.message.content[0].text`,
    quiz: [
      { q: 'What is the cost reduction for using the Batches API?', a: '50% — half the standard rate' },
      { q: 'Why must you key batch results by custom_id?', a: 'Results arrive in ANY order, not the order submitted' },
      { q: 'What processing_status value means the batch finished?', a: '"ended"' },
    ]
  },
  {
    id: 'server-tools',
    title: 'Server Tools',
    description: 'Anthropic-hosted tools that run on their infrastructure. No client-side execution loop needed.',
    keyPoints: [
      { title: 'Web search', content: 'type:"web_search_20260209" on Opus 5.5/5/4.8/4.7/4.6, Sonnet 5.5/5/4.6. Older models use web_search_20250305.' },
      { title: 'Web fetch', content: 'type:"web_fetch_20260209". Only fetches URLs already present in the conversation.' },
      { title: 'Code execution', content: 'type:"code_execution_20260521". Results come back as bash_code_execution_tool_result blocks (not code_execution_tool_result).' },
      { title: 'No beta header', content: 'Server tools require NO beta header. Results arrive as content blocks in the same response.' },
      { title: 'No separate code execution', content: 'The 20260209 web search/fetch variants have built-in dynamic filtering (runs code internally). Do NOT add a separate code_execution tool.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    tools=[
        {
            "type": "web_search_20260209",
            "name": "web_search",
            "max_uses": 5,
            "allowed_domains": ["wikipedia.org", "docs.anthropic.com"]
        }
    ],
    messages=[{"role": "user", "content": "What is the latest Claude model?"}]
)

# Server tool errors return HTTP 200 — check content type
for block in response.content:
    if block.type == "web_search_tool_result":
        # Success: content is a LIST
        # Error: content is an OBJECT with error_code
        if isinstance(block.content, list):
            for result in block.content:
                print(result.title, result.url)
        else:
            print("Search error:", block.content.error_code)`,
    quiz: [
      { q: 'What result block type does code_execution_20260521 return?', a: '"bash_code_execution_tool_result" — NOT "code_execution_tool_result"' },
      { q: 'Do server tools require a beta header?', a: 'No — no beta header required' },
      { q: 'What does a web_search error response look like?', a: 'HTTP 200 with content as an object with error_code (not a raised exception)' },
      { q: 'Which web search type should you use for Opus 5.5?', a: 'web_search_20260209 (the dynamic filtering variant)' },
    ]
  },
  {
    id: 'compaction',
    title: 'Compaction & Context',
    description: 'Handle long conversations that may exceed the context window with server-side compaction.',
    keyPoints: [
      { title: 'Beta header required', content: 'Beta: compact-2026-01-12. Available on Fable 5/5.1, Opus 5.5/5/4.8/4.7/4.6, Sonnet 5.5/5/4.6.' },
      { title: 'Append response.content not just text', content: 'Compaction blocks in the response MUST be preserved. Extracting only text silently loses compaction state.' },
      { title: 'Auto-trigger threshold', content: 'Default trigger at 150K tokens. API automatically summarizes earlier context when approaching this.' },
      { title: 'Compaction vs context editing', content: 'Compaction summarizes. Context editing (context-management-2025-06-27) clears specific blocks without summarizing.' },
    ],
    codeExample: `import anthropic

client = anthropic.Anthropic()

messages = []

def chat(user_message):
    messages.append({"role": "user", "content": user_message})

    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=8096,
        betas=["compact-2026-01-12"],
        messages=messages
    )

    # CRITICAL: append full response.content, not just text
    # This preserves compaction blocks
    messages.append({"role": "assistant", "content": response.content})

    return response.content[0].text

# Long conversation that may exceed context
for i in range(100):
    reply = chat(f"Message {i}: Tell me about topic {i}")
    print(reply[:100])`,
    quiz: [
      { q: 'What beta header enables server-side compaction?', a: '"compact-2026-01-12"' },
      { q: 'What must you append to preserve compaction state?', a: 'The full response.content array — not just the text string' },
      { q: 'What is the default compaction trigger threshold?', a: '150K tokens' },
    ]
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Multiple credential sources. The SDK resolves them automatically — you rarely need to set ANTHROPIC_API_KEY explicitly.',
    keyPoints: [
      { title: 'Credential resolution order', content: 'ANTHROPIC_API_KEY → ANTHROPIC_AUTH_TOKEN → ANTHROPIC_PROFILE OAuth → Workload Identity Federation → default profile on disk' },
      { title: 'ant auth login', content: 'Stores a profile under ~/.config/anthropic/. Zero-arg client constructor picks it up automatically — no env var needed.' },
      { title: 'OAuth tokens use Authorization: Bearer', content: 'NOT x-api-key. Also requires anthropic-beta: oauth-2025-04-20 header.' },
      { title: 'API key shadows OAuth', content: 'A set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN takes priority over an active OAuth profile — a common trap.' },
    ],
    codeExample: `import anthropic
import os

# Option 1: API key from env (explicit)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Option 2: Zero-arg — SDK auto-detects credentials
# Works after "ant auth login" with no env var needed
client = anthropic.Anthropic()

# Option 3: Check current credential status first
# $ ant auth status
# Shows which credential source and profile is active`,
    quiz: [
      { q: 'What is the first credential source the SDK checks?', a: 'ANTHROPIC_API_KEY environment variable' },
      { q: 'What header format do OAuth tokens use?', a: 'Authorization: Bearer <token> (not x-api-key)' },
      { q: 'What command stores an OAuth profile the SDK auto-detects?', a: 'ant auth login' },
    ]
  },
];
