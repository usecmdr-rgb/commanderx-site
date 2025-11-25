import { NextResponse } from "next/server";

import { openai } from "@/lib/openai";
import { getModelForTask } from "@/lib/agents/router";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { AgentKey, TaskType } from "@/lib/agents/config";
import type {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from "openai/resources/chat/completions";

type AgentId = AgentKey;

const MAX_CONTEXT_MESSAGES = 20;
const RECENT_CONVERSATION_WINDOW_HOURS = 12;
const FOLLOWUP_CONTEXT_SOURCES = ["aloha", "sync"];

const SYSTEM_PROMPTS: Record<AgentId, string> = {
  aloha: `
You are ALOHA, the CommanderX call assistant. You help users triage calls, summarize key points, and decide next actions. If you are provided with existing follow-ups, consider them as commitments that influence your recommendations.

Each reply MUST end with:
CALL_OUTCOME:
- outcome: <short text such as "resolved", "needs_followup", "scheduled", etc.>
- followup_title: <short title or "none">
- followup_description: <sentence or "none">
- followup_due_at: <ISO date-time or "none">
`.trim(),

  insight: `
You are INSIGHT, the analytics agent ...
`.trim(),

  sync: `
You are SYNC, the CommanderX email + calendar agent. Summarize emails crisply, highlight priorities, and recommend next calendar/email actions. Use any provided follow-up list to avoid duplicating tasks.

Each reply MUST end with:
EMAIL_OUTCOME:
- importance: <"low" | "normal" | "high">
- followup_title: <short title or "none">
- followup_description: <sentence or "none">
- followup_due_at: <ISO date-time or "none">
`.trim(),

  studio: `
You are Studio, CMDᴿ's visual design and content assistant.

Your job is to help the user edit their media. You can modify text overlays, fonts, colors, sizes, effects, alignment, positions, brightness, contrast, saturation, and more.

When the user asks for a change, DO NOT reply with plain text unless they explicitly ask for advice or explanation.

Instead, ALWAYS respond using the proper tool call to update the editor state directly.

Examples of user requests you MUST convert into tool actions:
- "brighten image" or "make it brighter" → update_adjustments with brightness: 120 (increase from current)
- "darken image" or "make it darker" → update_adjustments with brightness: 80 (decrease from current)
- "increase brightness" → update_adjustments with brightness: 120
- "decrease brightness" → update_adjustments with brightness: 80
- "more contrast" or "increase contrast" → update_adjustments with contrast: 120
- "less contrast" or "decrease contrast" → update_adjustments with contrast: 80
- "more saturation" or "increase saturation" → update_adjustments with saturation: 120
- "less saturation" or "decrease saturation" → update_adjustments with saturation: 80
- "Make the title bigger" → update_text_item with fontSize increase (e.g., fontSize: 48 if current is 32)
- "Change it to gold letters" → update_text_item with color "#FFD700"
- "Add a glowing subtitle saying 'Grand Opening'" → add_text_item with content "Grand Opening" and effectType "glow"
- "Move the text higher" → update_text_item with position.y decrease (e.g., position: { x: 50, y: 30 })
- "Add new text: Only 3 left in stock" → add_text_item with content "Only 3 left in stock"
- "Make background darker" → update_adjustments with brightness decrease
- "Add outline to the text" → update_text_item with effectType "outline"
- "Change font to Roboto" → update_text_item with fontFamily "Roboto, sans-serif"
- "Make text bolder" → update_text_item with bold: true
- "Make text bigger and bolder" → update_text_item with fontSize increase AND bold: true

IMPORTANT: For brightness/contrast/saturation adjustments:
- Current default/neutral values are: brightness: 100, contrast: 100, saturation: 100
- To "brighten" or "increase brightness", set brightness to 120-150
- To "darken" or "decrease brightness", set brightness to 50-80
- To "increase contrast", set contrast to 120-150
- To "decrease contrast", set contrast to 50-80
- Always provide the absolute value, not a relative change

You have access to the current editor state through the context. Use it to understand what text items exist and their current properties.

ALWAYS use tool calls to make changes. Only provide text responses when the user asks for explanations, suggestions, or advice.
`.trim(),
};

type StructuredFields = Record<string, string>;

function extractStructuredSection(reply: string, marker: string) {
  const needle = `${marker}:`;
  const upper = reply.toUpperCase();
  const idx = upper.lastIndexOf(needle.toUpperCase());
  if (idx === -1) {
    return { cleaned: reply.trim(), fields: {} as StructuredFields };
  }
  const cleaned = reply.slice(0, idx).trim();
  const block = reply.slice(idx + needle.length).trim();
  const fields: StructuredFields = {};
  block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(/^-?\s*([^:]+):\s*(.*)$/i);
      if (match) {
        const key = match[1].trim().toLowerCase();
        fields[key] = match[2].trim();
      }
    });
  return { cleaned, fields };
}

function normalizeValue(value?: string) {
  if (!value) return "";
  if (value.toLowerCase() === "none" || value.toLowerCase() === "null") return "";
  return value;
}

async function loadOpenFollowups(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  sources: string[]
) {
  const { data, error } = await supabase
    .from("followups")
    .select("id, title, description, due_at, source_agent")
    .eq("user_id", userId)
    .eq("status", "open")
    .in("source_agent", sources)
    .order("due_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Followup fetch failed:", error);
    return null;
  }

  if (!data?.length) return null;

  const bullets = data
    .map((f) => {
      const due =
        f.due_at != null ? ` (due ${new Date(f.due_at).toLocaleString()})` : "";
      return `- [${f.source_agent}] ${f.title}${due}`;
    })
    .join("\n");

  return `Here are this user's open follow-ups from Alpha/Xi:\n${bullets}`;
}

async function buildBetaStatsContext(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string
) {
  const [
    totalCallsResult,
    needsFollowupCallsResult,
    openFollowupsResult,
    emailRowsResult,
  ] = await Promise.all([
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("outcome", "needs_followup"),
    supabase
      .from("followups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "open"),
    supabase
      .from("email_summaries")
      .select("importance")
      .eq("user_id", userId),
  ]);

  if (
    totalCallsResult.error ||
    needsFollowupCallsResult.error ||
    openFollowupsResult.error ||
    emailRowsResult.error
  ) {
    console.error("Beta stats lookup failed", {
      totalCallsError: totalCallsResult.error,
      needsFollowupError: needsFollowupCallsResult.error,
      openFollowupsError: openFollowupsResult.error,
      emailError: emailRowsResult.error,
    });
    return null;
  }

  const importanceCounts = { high: 0, normal: 0, low: 0 };
  emailRowsResult.data?.forEach((row) => {
    const key = (row.importance ?? "normal").toLowerCase();
    if (key === "high" || key === "low" || key === "normal") {
      importanceCounts[key as keyof typeof importanceCounts]++;
    } else {
      importanceCounts.normal++;
    }
  });

  return `User analytics snapshot:
- Calls: ${totalCallsResult.count ?? 0} total (${needsFollowupCallsResult.count ?? 0} needing follow-up)
- Open follow-ups: ${openFollowupsResult.count ?? 0}
- Email summaries by importance: high ${importanceCounts.high}, normal ${importanceCounts.normal}, low ${importanceCounts.low}`;
}

function safeDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message as string | undefined;
    const agent = (body?.agent as AgentId | undefined) ?? "sync";
    const taskType = (body?.taskType as TaskType | undefined) ?? "default";
    const callContext = body?.callContext ?? {};
    const emailContext = body?.emailContext ?? {};
    const context = body?.context ?? {}; // Studio context with imagePreviewUrl

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing 'message' string in body" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.match(/^Bearer\s+(.*)$/i)?.[1]?.trim();

    let effectiveUserId: string | null = null;

    // Dev-only bypass: Allow Studio to work without auth in development
    if (!accessToken && process.env.NODE_ENV !== "production") {
      console.warn("[/api/brain] No access token found, using dev fallback user in development.");
      effectiveUserId = "dev-user";
    } else if (accessToken) {
      const { data: userResult, error: userError } =
        await supabase.auth.getUser(accessToken);

      if (userError || !userResult?.user) {
        // In production, return Unauthorized. In dev, use fallback.
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        } else {
          console.warn("[/api/brain] User auth failed, using dev fallback user in development.");
          effectiveUserId = "dev-user";
        }
      } else {
        effectiveUserId = userResult.user.id;
      }
    } else {
      // No access token and in production - return Unauthorized
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // At this point, effectiveUserId is guaranteed to be a string
    // (either from auth or dev fallback "dev-user")
    if (!effectiveUserId) {
      // This should never happen, but TypeScript safety check
      return NextResponse.json(
        { error: "Internal error: No user ID available" },
        { status: 500 }
      );
    }

    // From this point on, use userId (which is guaranteed to be a string)
    const userId = effectiveUserId;

    const { data: agentRecord, error: agentLookupError } = await supabase
      .from("agents")
      .select("id, key")
      .eq("key", agent)
      .maybeSingle();

    let agentId: string | null = null;
    if (agentLookupError || !agentRecord?.id) {
      console.error("Agent lookup failed:", { agent, agentLookupError, agentRecord });
      // In development, allow the request to proceed even if agent doesn't exist in DB
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[/api/brain] Agent "${agent}" not found in database, proceeding in development mode.`);
        // Use a dummy agent ID for dev mode
        agentId = "dev-agent-id";
      } else {
        return NextResponse.json(
          { error: `Unknown agent: ${agent}` },
          { status: 400 }
        );
      }
    } else {
      agentId = agentRecord.id;
    }

    const cutoff = new Date(
      Date.now() - RECENT_CONVERSATION_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    // Skip conversation lookup in dev mode if using dummy agent ID
    let existingConversation = null;
    let conversationLookupError = null;
    if (agentId !== "dev-agent-id") {
      const result = await supabase
        .from("agent_conversations")
        .select("id, created_at")
        .eq("user_id", userId)
        .eq("agent_id", agentId)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      existingConversation = result.data;
      conversationLookupError = result.error;
    }

    if (conversationLookupError) {
      console.error("Conversation lookup failed:", conversationLookupError);
      return NextResponse.json(
        { error: "Failed to load conversation" },
        { status: 500 }
      );
    }

    let conversationId = existingConversation?.id ?? null;

    if (!conversationId && agentId !== "dev-agent-id") {
      const { data: newConversation, error: conversationCreateError } =
        await supabase
          .from("agent_conversations")
          .insert({
            user_id: userId,
            agent_id: agentId,
          })
          .select("id")
          .single();

      if (conversationCreateError || !newConversation?.id) {
        console.error("Conversation create failed:", conversationCreateError);
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
    } else if (!conversationId && agentId === "dev-agent-id") {
      // In dev mode, use a dummy conversation ID
      conversationId = "dev-conversation-id";
    } else if (!conversationId && agentId === "dev-agent-id") {
      // In dev mode, use a dummy conversation ID
      conversationId = "dev-conversation-id";
    }

    const { data: historicalMessages, error: historyError } = await supabase
      .from("agent_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(MAX_CONTEXT_MESSAGES);

    if (historyError) {
      console.error("Conversation history load failed:", historyError);
      return NextResponse.json(
        { error: "Failed to load conversation history" },
        { status: 500 }
      );
    }

    const orderedHistory =
      historicalMessages?.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) ?? [];

    const systemPrompt = SYSTEM_PROMPTS[agent];
    const model = getModelForTask(agent, taskType);
    // Use ChatCompletionMessageParam[] to support multi-part content (text + images) for Studio
    const openAiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    if (agent === "aloha" || agent === "sync") {
      const followupContext = await loadOpenFollowups(
        supabase,
        userId,
        FOLLOWUP_CONTEXT_SOURCES
      );
      if (followupContext) {
        openAiMessages.push({
          role: "assistant",
          content: followupContext,
        });
      }
    }

    if (agent === "insight") {
      const statsContext = await buildBetaStatsContext(supabase, userId);
      if (statsContext) {
        openAiMessages.push({
          role: "assistant",
          content: statsContext,
        });
      }
    }

    openAiMessages.push(
      ...orderedHistory.map((msg) => ({
        role: msg.role as "assistant" | "user",
        content: msg.content,
      }))
    );

    // For Studio agent, send plain text messages only (no image_url for now)
    // Vision support disabled to avoid "Unauthorized" errors with local/blob URLs
    if (agent === "studio") {
      openAiMessages.push({
        role: "user",
        content: message,
      });
    } else {
      // For all other agents, send plain text messages
      openAiMessages.push({ role: "user", content: message });
    }

    // Define tools for Studio agent
    const studioTools = agent === "studio" ? [
      {
        type: "function" as const,
        function: {
          name: "update_text_item",
          description: "Update an existing text overlay item. Use this to change content, color, font, size, position, effects, etc.",
          parameters: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID of the text item to update. If not provided, update the first/selected item.",
              },
              updates: {
                type: "object",
                description: "The properties to update",
                properties: {
                  content: { type: "string", description: "The text content" },
                  color: { type: "string", description: "Color in HEX format (e.g., '#FFFFFF', '#FFD700')" },
                  fontFamily: { type: "string", description: "Font family (e.g., 'Roboto, sans-serif', 'Inter, sans-serif')" },
                  fontSize: { type: "number", description: "Font size in pixels (12-72)" },
                  bold: { type: "boolean", description: "Make text bold" },
                  italic: { type: "boolean", description: "Make text italic" },
                  underline: { type: "boolean", description: "Underline text" },
                  position: {
                    type: "object",
                    description: "Position as percentage (0-100)",
                    properties: {
                      x: { type: "number", description: "Horizontal position (0-100)" },
                      y: { type: "number", description: "Vertical position (0-100)" },
                    },
                  },
                  alignment: { type: "string", enum: ["center", "left", "right"], description: "Text alignment" },
                  effectType: { type: "string", enum: ["none", "glow", "outline", "highlight", "shadow"], description: "Text effect type" },
                  effectColor: { type: "string", description: "Effect color in HEX format" },
                  effectIntensity: { type: "number", description: "Effect intensity (0-100)" },
                  effectThickness: { type: "number", description: "Outline thickness in pixels (0-10)" },
                  highlightPadding: { type: "number", description: "Highlight padding in pixels (0-20)" },
                },
              },
            },
            required: ["updates"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "add_text_item",
          description: "Add a new text overlay item to the image",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The text content to display",
              },
              color: {
                type: "string",
                description: "Text color in HEX format (default: '#FFFFFF')",
                default: "#FFFFFF",
              },
              fontFamily: {
                type: "string",
                description: "Font family (default: 'Inter, sans-serif')",
                default: "Inter, sans-serif",
              },
              fontSize: {
                type: "number",
                description: "Font size in pixels (default: 32)",
                default: 32,
              },
              bold: { type: "boolean", description: "Make text bold (default: false)", default: false },
              italic: { type: "boolean", description: "Make text italic (default: false)", default: false },
              underline: { type: "boolean", description: "Underline text (default: false)", default: false },
              position: {
                type: "object",
                description: "Position as percentage (default: center {x: 50, y: 50})",
                properties: {
                  x: { type: "number", description: "Horizontal position (0-100)", default: 50 },
                  y: { type: "number", description: "Vertical position (0-100)", default: 50 },
                },
                default: { x: 50, y: 50 },
              },
              alignment: { type: "string", enum: ["center", "left", "right"], description: "Text alignment (default: 'center')", default: "center" },
              effectType: { type: "string", enum: ["none", "glow", "outline", "highlight", "shadow"], description: "Text effect type (default: 'none')", default: "none" },
              effectColor: { type: "string", description: "Effect color in HEX format (default: '#000000')", default: "#000000" },
              effectIntensity: { type: "number", description: "Effect intensity 0-100 (default: 50)", default: 50 },
              effectThickness: { type: "number", description: "Outline thickness in pixels 0-10 (default: 2)", default: 2 },
              highlightPadding: { type: "number", description: "Highlight padding in pixels 0-20 (default: 4)", default: 4 },
            },
            required: ["content"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "update_adjustments",
          description: "Update image adjustments like brightness, contrast, saturation, warmth, shadows, highlights, or zoom",
          parameters: {
            type: "object",
            properties: {
              brightness: { type: "number", description: "Brightness percentage (0-200, default: 100)" },
              contrast: { type: "number", description: "Contrast percentage (0-200, default: 100)" },
              saturation: { type: "number", description: "Saturation percentage (0-200, default: 100)" },
              warmth: { type: "number", description: "Temperature/warmth (-50 to 50, default: 0)" },
              shadows: { type: "number", description: "Shadow adjustment (-50 to 50, default: 0)" },
              highlights: { type: "number", description: "Highlight adjustment (-50 to 50, default: 0)" },
              zoom: { type: "number", description: "Zoom level (-50 to 100, default: 0)" },
            },
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "set_filter",
          description: "Apply a preset filter to the image",
          parameters: {
            type: "object",
            properties: {
              filter: {
                type: "string",
                enum: ["Monochrome", "B&W", "Sepia", "Vintage", "Dramatic", "Cool", "Warm", "Cinematic", "Soft", "Vivid"],
                description: "The filter name to apply. Pass null to remove filter.",
              },
            },
            required: ["filter"],
          },
        },
      },
    ] : undefined;

    const response = await openai.chat.completions.create({
      model,
      messages: openAiMessages,
      ...(studioTools && { tools: studioTools, tool_choice: "auto" }),
    });

    // Check if Studio agent returned a tool call
    if (agent === "studio" && response.choices[0]?.message?.tool_calls && response.choices[0].message.tool_calls.length > 0) {
      const toolCall = response.choices[0].message.tool_calls[0];
      if (toolCall.type === "function") {
        return NextResponse.json({
          ok: true,
          agent,
          tool: {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments || "{}"),
          },
          conversationId,
        });
      }
    }

    const text =
      response.choices[0]?.message?.content ?? "No response from model";

    const now = Date.now();

    // Skip message inserts in dev mode when using dummy conversation ID
    if (conversationId !== "dev-conversation-id") {
      const messageInserts = [
        {
          conversation_id: conversationId,
          role: "user",
          content: message,
          created_at: new Date(now).toISOString(),
        },
        {
          conversation_id: conversationId,
          role: "assistant",
          content: text,
          created_at: new Date(now + 1).toISOString(),
        },
      ];

      const { error: insertError } = await supabase
        .from("agent_messages")
        .insert(messageInserts);

      if (insertError) {
        console.error("Message insert failed:", insertError);
        return NextResponse.json(
          { error: "Failed to store conversation" },
          { status: 500 }
        );
      }
    }

    let metadata: Record<string, string> | undefined;

    if (agent === "aloha" && agentId !== "dev-agent-id") {
      const { cleaned, fields } = extractStructuredSection(
        text,
        "CALL_OUTCOME"
      );
      const outcome = normalizeValue(fields["outcome"]) || "unspecified";
      const { data: callInsert, error: callError } = await supabase
        .from("calls")
        .insert({
          user_id: userId,
          agent_id: agentId,
          summary: cleaned,
          outcome,
          started_at: safeDate(callContext.started_at) ?? new Date(now).toISOString(),
          ended_at: safeDate(callContext.ended_at) ?? new Date(now).toISOString(),
        })
        .select("id")
        .single();

      if (callError) {
        console.error("Call insert failed:", callError);
      } else if (callInsert?.id) {
        metadata = { ...metadata, callId: callInsert.id };
        const followupTitle = normalizeValue(fields["followup_title"]);
        if (followupTitle) {
          const { error: followupError, data: followupInsert } = await supabase
            .from("followups")
            .insert({
              user_id: userId,
              source_agent: "aloha",
              related_call_id: callInsert.id,
              title: followupTitle,
              description:
                normalizeValue(fields["followup_description"]) || followupTitle,
              due_at: safeDate(fields["followup_due_at"] ?? undefined),
              status: "open",
            })
            .select("id")
            .single();

          if (followupError) {
            console.error("Aloha followup insert failed:", followupError);
          } else if (followupInsert?.id) {
            metadata = { ...metadata, followupId: followupInsert.id };
          }
        }

        // If Aloha created an appointment, sync it to Google Calendar
        if (outcome === "scheduled" || fields["followup_title"]?.toLowerCase().includes("appointment")) {
          try {
            const followupTitle = normalizeValue(fields["followup_title"]);
            const followupDescription = normalizeValue(fields["followup_description"]);
            const followupDueAt = safeDate(fields["followup_due_at"] ?? undefined);

            if (followupDueAt && followupTitle) {
              // Calculate end time (default 1 hour duration)
              const startTime = new Date(followupDueAt);
              const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

              // Sync to calendar (async, don't wait)
              // Use internal fetch with proper URL construction
              const calendarSyncUrl = new URL("/api/calendar/aloha-sync", 
                process.env.NEXT_PUBLIC_APP_URL || 
                (req.headers.get("host") ? `https://${req.headers.get("host")}` : "http://localhost:3001")
              );
              
              fetch(calendarSyncUrl.toString(), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  action: "create",
                  callId: callInsert.id,
                  appointmentData: {
                    summary: followupTitle,
                    description: followupDescription || `Appointment scheduled from call`,
                    start: startTime.toISOString(),
                    end: endTime.toISOString(),
                    notes: cleaned, // Call summary as notes
                  },
                }),
              }).catch((err) => {
                console.error("Failed to sync appointment to calendar:", err);
                // Don't fail the request if calendar sync fails
              });
            }
          } catch (err) {
            console.error("Error syncing appointment to calendar:", err);
            // Don't fail the request if calendar sync fails
          }
        }
      }
    } else if (agent === "sync") {
      const { cleaned, fields } = extractStructuredSection(
        text,
        "EMAIL_OUTCOME"
      );
      const importance =
        normalizeValue(fields["importance"])?.toLowerCase() || "normal";
      const { data: emailInsert, error: emailError } = await supabase
        .from("email_summaries")
        .insert({
          user_id: userId,
          agent_id: agentId,
          email_id: emailContext.emailId ?? null,
          subject: emailContext.subject ?? null,
          from_address: emailContext.fromAddress ?? null,
          importance,
          summary: cleaned,
        })
        .select("id")
        .single();

      if (emailError) {
        console.error("Email summary insert failed:", emailError);
      } else if (emailInsert?.id) {
        metadata = { ...metadata, emailSummaryId: emailInsert.id };
        const followupTitle = normalizeValue(fields["followup_title"]);
        if (followupTitle) {
          const { error: followupError, data: followupInsert } = await supabase
            .from("followups")
            .insert({
              user_id: userId,
              source_agent: "sync",
              related_email_id: emailInsert.id,
              title: followupTitle,
              description:
                normalizeValue(fields["followup_description"]) || followupTitle,
              due_at: safeDate(fields["followup_due_at"] ?? undefined),
              status: "open",
            })
            .select("id")
            .single();

          if (followupError) {
            console.error("Sync followup insert failed:", followupError);
          } else if (followupInsert?.id) {
            metadata = { ...metadata, followupId: followupInsert.id };
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      agent,
      reply: text,
      conversationId,
      metadata,
    });
  } catch (error) {
    console.error("Error in /api/brain:", error);
    return NextResponse.json(
      { error: "Error talking to OpenAI" },
      { status: 500 }
    );
  }
}

