type InquiryNotice = {
  email: string;
  whatsapp: string;
  whatsappKey: string;
  studioName: string;
  serviceName: string;
  actionLabel: string;
  device: string;
  name: string;
  contact: string;
  note: string;
};

export async function notifyInquiry(notice: InquiryNotice): Promise<void> {
  const jobs: Promise<unknown>[] = [];
  if (isEmail(notice.email)) jobs.push(sendEmail(notice));
  const phone = notice.whatsapp.replace(/\D/g, "");
  if (phone && notice.whatsappKey.trim()) jobs.push(sendWhatsApp(phone, notice));
  await Promise.allSettled(jobs);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function sendEmail(notice: InquiryNotice): Promise<Response> {
  const subject = `New enquiry: ${notice.serviceName || notice.studioName} — ${notice.name}`;
  return fetch(`https://formsubmit.co/ajax/${encodeURIComponent(notice.email.trim())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      Name: notice.name,
      Contact: notice.contact,
      Service: notice.serviceName || "—",
      Action: notice.actionLabel || "Request",
      Device: notice.device || "—",
      Note: notice.note || "—",
    }),
    signal: AbortSignal.timeout(8000),
  });
}

function sendWhatsApp(phone: string, notice: InquiryNotice): Promise<Response> {
  const text = [
    `New enquiry for ${notice.studioName}`,
    notice.serviceName ? `Service: ${notice.serviceName}` : "",
    notice.actionLabel ? `Action: ${notice.actionLabel}` : "",
    notice.device ? `Device: ${notice.device}` : "",
    `Name: ${notice.name}`,
    `Contact: ${notice.contact}`,
    notice.note ? `Note: ${notice.note}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 900);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(notice.whatsappKey.trim())}`;
  return fetch(url, { signal: AbortSignal.timeout(8000) });
}
