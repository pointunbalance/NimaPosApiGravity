type QueryFeedbackProps = {
  title: string;
  message: string;
  tone?: "neutral" | "error";
};

export function QueryFeedback({ title, message, tone = "neutral" }: QueryFeedbackProps) {
  return (
    <div className={`feedback-panel ${tone === "error" ? "error-panel" : ""}`}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
