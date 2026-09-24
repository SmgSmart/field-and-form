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

function enquiryText(notice: InquiryNotice): string {
  return [
    `New enquiry for ${notice.studioName}`,
    notice.serviceName ? `Service: ${notice.serviceName}` : "",
    notice.actionLabel ? `Action: ${notice.actionLabel}` : "",
    notice.device ? `Device: ${notice.device}` : "",
    `Name: ${notice.name}`,
    `Contact: ${notice.contact}`,
    notice.note ? `Note: ${notice.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail(notice: InquiryNotice): Promise<void> {
  const body = new URLSearchParams({
    to: notice.email.trim(),
    subject: `New enquiry: ${notice.serviceName || notice.studioName} — ${notice.name}`,
    name: notice.name,
    email: notice.contact.includes("@") ? notice.contact.trim() : notice.email.trim(),
    message: enquiryText(notice),
    hp_email: "",
  });
  const response = await fetch("https://email.gosecureserver.in/api/send.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(12000),
  });
  if (response.status >= 400) {
    throw new Error(`Email was not accepted (${response.status}).`);
  }
}

async function sendWhatsApp(phone: string, notice: InquiryNotice): Promise<void> {
  const key = notice.whatsappKey.trim();
  const short = enquiryText(notice).slice(0, 180);
  const whatabot = await fetch("https://api.whatabot.io/Whatsapp/RequestSendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ApiKey: key, Text: short, Phone: phone }),
    signal: AbortSignal.timeout(8000),
  });
  if (whatabot.ok) return;
  const callmebot = await fetch(
    `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(enquiryText(notice).slice(0, 900))}&apikey=${encodeURIComponent(key)}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!callmebot.ok) throw new Error("WhatsApp was not accepted.");
}
