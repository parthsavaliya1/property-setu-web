import { MobilePageHeader } from "./mobile";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { useEffect, useRef, useState } from "react";
import { Paperclip, Reply, Send, X, MoreVertical } from "lucide-react";
import { dateTime, productRequest, uploadFile } from "@/lib/explorer";
import type { ChatMessage, ChatThread } from "@/lib/explorer-types";
import { useAction, useProduct, useResource } from "./context";
import { ActionError, ConfirmAction, ExploreLink, Field, PageHeading, RemoteState } from "./ui";
export function ChatsPage() {
  const app = useProduct();
  const list = useResource<ChatThread[]>("/chats", app.token, app.refresh);
  return (
    <div className="xp-page">
      <MobilePageHeader
        title="Messages"
        subtitle={
          list.data?.length
            ? `${list.data.length} conversation${list.data.length === 1 ? "" : "s"}`
            : "Your conversations"
        }
      />
      <PageHeading title="Messages" description="Every new beginning starts with a conversation." />
      <RemoteState {...list} empty={list.data?.length === 0} emptyText="No conversations yet">
        <div className="xp-list">
          {list.data?.map((chat) => (
            <ExploreLink
              view="chat"
              id={chat.id}
              key={chat.id}
              className="xp-panel xp-chat-preview"
            >
              <span className="xp-avatar">
                {chat.other_avatar ? (
                  <img src={chat.other_avatar} alt="" />
                ) : (
                  (chat.other_name || "P").charAt(0)
                )}
              </span>
              <div>
                <h2>{chat.other_name || "PropertySetu member"}</h2>
                <strong>{chat.property_title}</strong>
                <p>{chat.last_message || "Start a conversation"}</p>
              </div>
              <small>{chat.last_at ? dateTime(chat.last_at) : ""}</small>
            </ExploreLink>
          ))}
        </div>
      </RemoteState>
    </div>
  );
}
export function ChatPage({ id }: { id: string }) {
  const app = useProduct();
  const thread = useResource<ChatThread>(
    `/chats/${encodeURIComponent(id)}`,
    app.token,
    app.refresh,
  );
  const action = useAction();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    kind: "image" | "document";
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  useEffect(() => {
    let active = true;
    let running = false;
    async function load() {
      if (running || document.hidden) return;
      running = true;
      try {
        const next = await productRequest<ChatMessage[]>(
          `/chats/${encodeURIComponent(id)}/messages`,
          app.token,
        );
        if (active) {
          setMessages(Array.isArray(next) ? next : []);
          setLoadError("");
        }
      } catch (error) {
        if (active)
          setLoadError(error instanceof Error ? error.message : "Could not load messages.");
      } finally {
        if (active) setLoading(false);
        running = false;
      }
    }
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, app.token, revision]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  const other =
    thread.data?.buyer_id === app.session?.user.id ? thread.data?.owner_id : thread.data?.buyer_id;
  return (
    <div className={`xp-page xp-chat-page ${optionsOpen ? "xp-chat-options-open" : ""}`}>
      <RemoteState {...thread}>
        {thread.data && (
          <>
            <MobilePageHeader
              title={thread.data.other_name || "Conversation"}
              subtitle={thread.data.property_title}
              onBack={() => app.go("chats")}
              right={
                <button
                  type="button"
                  className="xp-native-back"
                  aria-label="Conversation options"
                  aria-expanded={optionsOpen}
                  onClick={() => setOptionsOpen((value) => !value)}
                >
                  <MoreVertical size={22} />
                </button>
              }
            />
            <PageHeading
              title={thread.data.other_name || "Conversation"}
              description={thread.data.property_title}
              action={
                <ExploreLink
                  className="xp-button secondary"
                  view="details"
                  id={thread.data.property_id}
                >
                  View property
                </ExploreLink>
              }
            />
            <ActionError error={action.error} />
            <div className="xp-chat-layout">
              <section className="xp-chat-room">
                <div className="xp-chat-messages" aria-live="polite">
                  <RemoteState
                    loading={loading}
                    error={messages.length ? "" : loadError}
                    retry={() => setRevision((v) => v + 1)}
                    empty={!messages.length}
                    emptyText="Say hello to start the conversation"
                  >
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`xp-message ${message.sender_id === app.session?.user.id ? "mine" : ""}`}
                      >
                        <div className="xp-message-bubble">
                          {message.reply_to_id && (
                            <blockquote>
                              {message.reply_deleted
                                ? "Deleted message"
                                : message.reply_body || message.reply_name || "Attachment"}
                            </blockquote>
                          )}
                          {message.deleted ? (
                            <em>Message deleted</em>
                          ) : (
                            <>
                              {message.body && <p>{message.body}</p>}
                              {message.attachment_url && (
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {message.attachment_kind === "image" ? (
                                    <img
                                      src={message.attachment_url}
                                      alt={message.attachment_name || "Shared photo"}
                                    />
                                  ) : (
                                    <span>📎 {message.attachment_name || "Document"}</span>
                                  )}
                                </a>
                              )}
                            </>
                          )}
                          <small>{dateTime(message.created_at)}</small>
                        </div>
                        {!message.deleted && (
                          <div className="xp-message-actions">
                            <button onClick={() => setReply(message)} aria-label="Reply to message">
                              <Reply size={13} />
                            </button>
                            {["👍", "❤️"].map((emoji) => (
                              <button
                                key={emoji}
                                disabled={action.busy}
                                aria-label={`React ${emoji}`}
                                onClick={() =>
                                  void action.run(async () => {
                                    await productRequest(
                                      `/chats/${id}/messages/${message.id}/reactions`,
                                      app.token,
                                      "POST",
                                      { emoji },
                                    );
                                    setRevision((v) => v + 1);
                                  })
                                }
                              >
                                {emoji}
                              </button>
                            ))}
                            {message.sender_id === app.session?.user.id && (
                              <ConfirmAction
                                label="Delete"
                                danger
                                title="Delete this message?"
                                description="The message will be removed for both participants."
                                onConfirm={async () => {
                                  await productRequest(
                                    `/chats/${id}/messages/${message.id}`,
                                    app.token,
                                    "DELETE",
                                  );
                                  setRevision((v) => v + 1);
                                }}
                              />
                            )}
                          </div>
                        )}
                        {message.reactions?.length ? (
                          <div className="xp-reactions">
                            {message.reactions.map((reaction) => (
                              <span key={reaction.emoji} className={reaction.mine ? "mine" : ""}>
                                {reaction.emoji} {reaction.count}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </RemoteState>
                  <div ref={bottom} />
                </div>
                {loadError && messages.length > 0 && (
                  <p className="xp-error" role="alert">
                    {loadError} Retrying automatically.
                  </p>
                )}
                {thread.data.messaging_blocked ? (
                  <div className="xp-notice">
                    Messaging is unavailable because one of the participants is blocked.
                  </div>
                ) : (
                  <form
                    className="xp-chat-compose"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void action.run(async () => {
                        if (!body.trim() && !attachment)
                          throw new Error("Write a message or attach a file.");
                        await productRequest(`/chats/${id}/messages`, app.token, "POST", {
                          body: body.trim(),
                          ...(reply ? { reply_to_id: reply.id } : {}),
                          ...(attachment
                            ? {
                                attachment_url: attachment.url,
                                attachment_name: attachment.name,
                                attachment_kind: attachment.kind,
                              }
                            : {}),
                        });
                        setBody("");
                        setReply(null);
                        setAttachment(null);
                        setRevision((v) => v + 1);
                      });
                    }}
                  >
                    {reply && (
                      <div className="xp-compose-preview">
                        <span>
                          Replying to: {reply.body || reply.attachment_name || "Attachment"}
                        </span>
                        <button
                          type="button"
                          aria-label="Cancel reply"
                          onClick={() => setReply(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {attachment && (
                      <div className="xp-compose-preview">
                        <span>{attachment.name}</span>
                        <button
                          type="button"
                          aria-label="Remove attachment"
                          onClick={() => setAttachment(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="xp-compose-row">
                      <label className="xp-attach" aria-label="Attach photo or document">
                        <Paperclip size={21} />
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          disabled={action.busy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file)
                              void action.run(async () => {
                                const kind = file.type.startsWith("image/") ? "image" : "document";
                                const url = await uploadFile(file, app.token!, kind);
                                setAttachment({ url, name: file.name, kind });
                              });
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <textarea
                        aria-label="Message"
                        rows={1}
                        maxLength={2000}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Write a message…"
                      />
                      <button
                        className="xp-button"
                        disabled={action.busy}
                        aria-label="Send message"
                      >
                        {action.busy ? (
                          <AnimatedLoader size="small" color="currentColor" />
                        ) : (
                          <Send size={19} />
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </section>
              <aside className="xp-panel xp-chat-safety">
                <ExploreLink
                  view="details"
                  id={thread.data.property_id}
                  className="xp-chat-property-link"
                >
                  View property
                </ExploreLink>
                <h2>A safe conversation</h2>
                <p>
                  Keep your personal information private. Always verify property details before
                  sending money.
                </p>
                {other && (
                  <>
                    <ConfirmAction
                      label={thread.data.blocked_by_me ? "Unblock user" : "Block user"}
                      title={
                        thread.data.blocked_by_me ? "Unblock this person?" : "Block this person?"
                      }
                      description="You can manage blocked users from your profile."
                      onConfirm={async () => {
                        await productRequest(
                          `/users/${other}/block`,
                          app.token,
                          thread.data?.blocked_by_me ? "DELETE" : "PUT",
                        );
                        app.changed();
                      }}
                    />
                    <button className="xp-text-button" onClick={() => setReport(!report)}>
                      Report user
                    </button>
                    {report && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          void action.run(async () => {
                            await productRequest(`/users/${other}/reports`, app.token, "POST", {
                              reason: form.get("reason"),
                              description: form.get("description"),
                              conversation_id: id,
                            });
                            setReport(false);
                            app.notify("Your report has been submitted.");
                          });
                        }}
                      >
                        <Field label="Reason">
                          <select name="reason">
                            <option value="fraud">Fraud</option>
                            <option value="inappropriate">Inappropriate content</option>
                            <option value="other">Other</option>
                          </select>
                        </Field>
                        <Field label="Description">
                          <textarea name="description" maxLength={2000} />
                        </Field>
                        <button className="xp-button" disabled={action.busy}>
                          Submit report
                        </button>
                      </form>
                    )}
                  </>
                )}
              </aside>
            </div>
          </>
        )}
      </RemoteState>
    </div>
  );
}
