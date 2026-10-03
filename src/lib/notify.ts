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

export type NotifyResult = {
  whatsapp: "sent" | "skipped" | "failed";
  email: "sent" | "skipped" | "failed";
  detail: string;
};

export async function notifyInquiry(notice: InquiryNotice): Promise<NotifyResult> {
  const result: NotifyResult = { whatsapp: "skipped", email: "skipped", detail: "" };
  const phone = digitsPhone(notice.whatsapp);
  const key = notice.whatsappKey.trim();

  if (phone && key) {
    try {
      await sendWhatsApp(phone, key, enquiryText(notice));
      result.whatsapp = "sent";
    } catch (cause) {
      result.whatsapp = "failed";
      result.detail = cause instanceof Error ? cause.message : "WhatsApp failed.";
    }
  } else if (phone && !key) {
    result.detail = "Add the WhatsApp alert key on the main page.";
  }

  if (isEmail(notice.email)) {
    try {
      await sendEmail(notice);
      result.email = "sent";
    } catch (cause) {
      result.email = "failed";
      if (!result.detail) {
        result.detail = cause instanceof Error ? cause.message : "Email failed.";
      }
    }
  }

  return result;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function digitsPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = `233${digits.slice(1)}`;
  return digits;
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
    .join("\n")
    .slice(0, 200);
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
    signal: AbortSignal.timeout(4000),
  });
  if (response.status >= 400) {
    throw new Error(`Email was not accepted (${response.status}).`);
  }
}

async function sendWhatsApp(phone: string, key: string, text: string): Promise<void> {
  const response = await fetch("https://api.whatabot.io/Whatsapp/RequestSendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ApiKey: key, Text: text.slice(0, 200), Phone: phone }),
    signal: AbortSignal.timeout(5000),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body.slice(0, 160) || `WhatsApp was not accepted (${response.status}).`);
  }
  if (/rate.?limit|too many/i.test(body)) {
    throw new Error("WhatsApp is rate limited. Wait 5 seconds and try again.");
  }
}
