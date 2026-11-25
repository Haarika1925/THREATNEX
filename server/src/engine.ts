import { randomUUID } from 'node:crypto'

export type ScanType = 'email' | 'sms' | 'url' | 'voice'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type Indicator = { label: string; detail: string; severity: RiskLevel }

const patterns: Array<{ label: string; detail: string; regex: RegExp; weight: number }> = [
  { label: 'Credential or OTP request', detail: 'Requests for passwords, PINs, or one-time codes are a common account takeover tactic.', regex: /\b(?:otp|one[\s-]?time (?:password|code)|verification code|password|passcode|pin)\b/i, weight: 28 },
  { label: 'Urgent or threatening language', detail: 'Pressure to act immediately or threats of account suspension can bypass careful review.', regex: /\b(?:urgent|immediately|act now|within \d+ hours?|suspended|suspension|blocked|final warning|expire[sd]? today)\b/i, weight: 19 },
  { label: 'Payment or money transfer request', detail: 'Unexpected requests to transfer money or make a payment can indicate financial fraud.', regex: /\b(?:transfer|wire|send money|payment|pay now|bank details|refund fee|processing fee)\b/i, weight: 23 },
  { label: 'Prize or lottery claim', detail: 'Unexpected prizes that require fees or personal details are a frequent scam pattern.', regex: /\b(?:you(?:'|’)ve won|winner|lottery|prize|claim your reward|congratulations)\b/i, weight: 20 },
  { label: 'Impersonation or authority claim', detail: 'Messages claiming to be from a bank, government, or support team can be used to build false trust.', regex: /\b(?:bank|government|tax department|police|customer support|security team|official notice)\b/i, weight: 14 },
  { label: 'Personal information request', detail: 'Requests for sensitive personal or financial information should be independently verified.', regex: /\b(?:national id|social security|account number|card number|date of birth|personal information)\b/i, weight: 18 },
  { label: 'Suspicious or shortened link', detail: 'Shortened links obscure their final destination. Avoid opening unexpected links.', regex: /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly)\b/i, weight: 18 },
  { label: 'Remote access or secrecy request', detail: 'Requests to install remote access software or keep a transaction secret are high-risk behaviors.', regex: /\b(?:remote access|anydesk|teamviewer|do not tell|keep this secret|share your screen)\b/i, weight: 24 },
]

function urlIndicators(raw: string): Indicator[] {
  const findings: Indicator[] = []
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Enter a valid URL including its protocol, such as https://example.com.')
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs can be analyzed.')
  const hostname = url.hostname.toLowerCase()
  const bareHost = hostname.replace(/^www\./, '')
  if (url.protocol === 'http:') findings.push({ label: 'Unencrypted HTTP connection', detail: 'This URL uses HTTP rather than HTTPS. Information exchanged with the site may not be encrypted.', severity: 'MEDIUM' })
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) findings.push({ label: 'IP address used as hostname', detail: 'The link points directly to an IP address rather than a recognizable domain.', severity: 'HIGH' })
  if (hostname.split('.').length > 4) findings.push({ label: 'Unusually nested subdomains', detail: 'Multiple subdomain levels can obscure the domain that actually controls this link.', severity: 'MEDIUM' })
  if (hostname.includes('xn--')) findings.push({ label: 'Internationalized domain encoding', detail: 'Punycode can represent lookalike characters in domain names. Verify the destination carefully.', severity: 'MEDIUM' })
  if (/@/.test(url.href.split('/').slice(0, 3).join('/'))) findings.push({ label: 'Misleading user information', detail: 'The URL includes an @ symbol in its authority section, which can disguise the actual destination.', severity: 'HIGH' })
  if (bareHost.split('.').length === 2 && bareHost.split('.')[0].length > 22) findings.push({ label: 'Unusually long domain name', detail: 'Long domain labels can be used to imitate trusted organizations or hide the real domain.', severity: 'MEDIUM' })
  if (/\b(?:login|verify|secure|account|update|banking|wallet|confirm)\b/i.test(`${hostname}${url.pathname}`)) findings.push({ label: 'Account-action wording in URL', detail: 'The URL contains account or verification terms. This is not proof of malicious activity, but warrants caution.', severity: 'MEDIUM' })
  if (hostname.split('.').length >= 3 && /\b(?:paypal|microsoft|apple|google|amazon|bank|gov)\b/i.test(hostname.split('.').slice(0, -2).join('.'))) findings.push({ label: 'Brand name in subdomain', detail: 'A familiar brand name appears before the registrable domain; it may not belong to that brand.', severity: 'HIGH' })
  return findings
}

export function analyzeContent(type: ScanType, rawInput: string) {
  const input = rawInput.trim()
  if (!input) throw new Error('Enter content to analyze.')
  if (input.length > (type === 'url' ? 2048 : 10000)) throw new Error('Input exceeds the maximum allowed length.')
  let indicators: Indicator[]
  if (type === 'url') {
    indicators = urlIndicators(input)
  } else {
    indicators = patterns.filter((pattern) => pattern.regex.test(input)).map((pattern) => ({
      label: pattern.label,
      detail: pattern.detail,
      severity: pattern.weight >= 23 ? 'HIGH' : 'MEDIUM',
    }))
    if (/https?:\/\/[^\s]+/i.test(input) && !indicators.some((item) => item.label === 'Suspicious or shortened link')) {
      const links = input.match(/https?:\/\/[^\s]+/ig) ?? []
      for (const link of links) {
        try {
          const parsed = new URL(link)
          if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsed.hostname) || parsed.hostname.includes('xn--')) {
            indicators.push({ label: 'Unusual link destination', detail: 'A link uses an IP address or encoded domain. Verify its destination independently.', severity: 'HIGH' })
            break
          }
        } catch { /* Invalid embedded links remain covered by surrounding message indicators. */ }
      }
    }
  }
  const weights = indicators.reduce((total, item) => {
    const matched = patterns.find((pattern) => pattern.label === item.label)
    return total + (matched?.weight ?? (item.severity === 'HIGH' ? 28 : 15))
  }, 0)
  const score = Math.min(100, weights)
  const level: RiskLevel = score >= 55 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'
  const explanation = indicators.length
    ? `Found ${indicators.length} signal${indicators.length === 1 ? '' : 's'} commonly associated with suspicious content. These heuristic matches are not proof of fraud.`
    : 'No strong suspicious patterns matched the checks used in this scan. This does not guarantee the content is safe.'
  const recommendation = level === 'HIGH'
    ? 'Do not click links, reply, share codes, or send money. Verify the request using the organization’s official app or a trusted contact method.'
    : level === 'MEDIUM'
      ? 'Pause before responding. Verify the sender and destination independently; never share passwords or one-time codes.'
      : 'No strong signals were found, but stay cautious. Confirm unexpected requests through a trusted channel.'
  return {
    id: randomUUID(),
    type,
    input,
    score,
    level,
    indicators,
    explanation,
    recommendation,
    method: type === 'url' ? 'URL STRUCTURE HEURISTICS · NO REPUTATION API' : 'TRANSPARENT TEXT HEURISTICS',
    createdAt: new Date().toISOString(),
  }
}
