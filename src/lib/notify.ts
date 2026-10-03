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
    result.detail = "Add the full WhatsApp alert key on the main page.";
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
  if (key.replace(/-/g, "").length < 24) {
    throw new Error("The WhatsApp key looks cut off. Copy the whole key from the Whatabot chat — it is usually five groups, like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.");
  }
  const payload = { ApiKey: key, Text: text.slice(0, 200), Phone: phone };
  const posted = await fetch("https://apiv2.whatabot.net/Whatsapp/RequestSendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  const postedBody = await posted.text();
  if (posted.ok && /enqueued/i.test(postedBody)) return;
  if (!/invalid phone or api key/i.test(postedBody) && posted.ok && !/error/i.test(postedBody)) return;

  const params = new URLSearchParams({ apikey: key, text: text.slice(0, 200), phone });
  const gotten = await fetch(`https://api.whatabot.net/whatsapp/sendMessage?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  const gottenBody = await gotten.text();
  if (gotten.ok && /enqueued/i.test(gottenBody)) return;
  const err = [postedBody, gottenBody].find((line) => line.trim()) || "WhatsApp was not accepted.";
  if (/invalid phone or api key/i.test(err)) {
    throw new Error("Whatabot rejected the key or number. Open the Whatabot chat, copy the full key, and keep WhatsApp as 233541719097.");
  }
  if (/quota exceeded|rate.?limit/i.test(err)) {
    throw new Error("WhatsApp is rate limited. Wait 5 seconds and try again.");
  }
  if (/not enabled/i.test(err)) {
    throw new Error("Whatabot says this number is not enabled. Send “I allow whatabot to send me messages” to +54 9 11 3270-4925 again.");
  }
  throw new Error(err.slice(0, 180));
}
