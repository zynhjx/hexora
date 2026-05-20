"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Brain, CheckCircle2, XCircle, Trophy, Gem, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { supabase } from "@/supabaseClient";

const DIFFICULTY_CONFIG = {
  easy:         { duration: 120, pts: 10 },
  intermediate: { duration: 90,  pts: 15 },
  advanced:     { duration: 60,  pts: 20 },
} as const;

type Difficulty = keyof typeof DIFFICULTY_CONFIG;

interface Question {
  id: number;
  question: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
  source: string;
}

const QUESTION_POOL: Question[] = [
  {
    id: 1,
    question: "What attack type sends fake emails pretending to be from a trusted source to steal your credentials?",
    options: ["Phishing", "Spoofing", "Pharming", "Vishing"],
    answer: "Phishing",
    explanation: "Phishing uses deceptive emails that appear to come from trusted sources — banks, coworkers, or popular services — to trick victims into clicking malicious links or entering credentials. It's the most common entry point for data breaches. Always verify the sender address and avoid clicking unexpected links.",
    source: "SANS Institute",
  },
  {
    id: 2,
    question: "Which OWASP Top 10 risk involves injecting malicious scripts into web pages viewed by other users?",
    options: ["SQL Injection", "CSRF", "SSRF", "XSS"],
    answer: "XSS",
    explanation: "Per OWASP, Cross-Site Scripting (XSS) occurs when an application includes unvalidated user-supplied data in a web page, allowing attackers to execute scripts in a victim's browser. Unlike SQL injection which attacks the database layer, XSS targets the end user's browser. Output encoding and Content Security Policy (CSP) headers are the primary defenses.",
    source: "OWASP Top 10",
  },
  {
    id: 3,
    question: "What type of malware locks your files and demands payment to restore access?",
    options: ["Spyware", "Adware", "Ransomware", "Rootkit"],
    answer: "Ransomware",
    explanation: "Ransomware encrypts a victim's files or entire drive and demands payment — usually in cryptocurrency — in exchange for the decryption key. Paying does not guarantee recovery. Regular offline backups and up-to-date software are the most effective defenses against ransomware.",
    source: "CISA",
  },
  {
    id: 4,
    question: "What attack floods a target server with traffic from a single source to make it unavailable?",
    options: ["DDoS", "Man-in-the-Middle", "DoS", "Replay attack"],
    answer: "DoS",
    explanation: "A Denial of Service (DoS) attack sends overwhelming traffic or requests from one machine to a target, consuming its resources until it becomes unavailable. Unlike DDoS which uses many distributed sources, a DoS originates from a single attacker. Rate limiting and traffic filtering are common mitigations.",
    source: "SANS Institute",
  },
  {
    id: 5,
    question: "What do you call malware that secretly watches and records everything you type, including passwords?",
    options: ["Spyware", "Adware", "Worm", "Keylogger"],
    answer: "Keylogger",
    explanation: "A keylogger is malware — or hardware device — that silently records every keystroke made on a device and sends the data to the attacker. This exposes passwords, credit card numbers, and messages without any visible signs to the victim. Anti-malware software and on-screen keyboards can help defend against software keyloggers.",
    source: "NIST SP 800-83",
  },
  {
    id: 6,
    question: "Which type of attack intercepts communication between two parties without either knowing?",
    options: ["Phishing", "Replay attack", "Man-in-the-Middle", "Eavesdropping"],
    answer: "Man-in-the-Middle",
    explanation: "A Man-in-the-Middle (MitM) attack occurs when an attacker secretly intercepts and possibly alters communication between two parties who believe they are communicating directly. Common examples include ARP spoofing on local networks and SSL stripping on HTTPS. Using encrypted connections (TLS) and certificate pinning helps prevent MitM attacks.",
    source: "SANS Institute",
  },
  {
    id: 7,
    question: "What type of phishing attack targets a specific named person or organization using personalized details?",
    options: ["Vishing", "Whaling", "Smishing", "Spear phishing"],
    answer: "Spear phishing",
    explanation: "Spear phishing is a targeted phishing attack that uses personal information about the victim — their name, job title, coworkers — to appear more convincing. Unlike mass phishing campaigns, spear phishing focuses on one specific target. It is responsible for a large percentage of successful corporate data breaches.",
    source: "SANS Institute",
  },
  {
    id: 8,
    question: "What malware disguises itself as legitimate software but runs hidden malicious actions in the background?",
    options: ["Worm", "Virus", "Rootkit", "Trojan"],
    answer: "Trojan",
    explanation: "A Trojan horse is malware that pretends to be a useful application — a game, utility, or update — to trick users into installing it. Once installed, it can open backdoors, steal data, or download additional malware. Unlike worms, Trojans do not self-replicate; they rely on users running them voluntarily.",
    source: "NIST SP 800-83",
  },
  {
    id: 9,
    question: "Which attack spreads itself automatically across a network by exploiting security vulnerabilities without any user action?",
    options: ["Virus", "Trojan", "Rootkit", "Worm"],
    answer: "Worm",
    explanation: "A worm is self-replicating malware that spreads across networks by automatically exploiting vulnerabilities — no user click or interaction is needed. Famous examples include WannaCry and Conficker, which spread globally in hours. Unlike a virus, a worm does not need to attach itself to an existing file.",
    source: "NIST SP 800-83",
  },
  {
    id: 10,
    question: "What do attackers use a botnet for?",
    options: ["Encrypting legitimate files", "Monitoring network logs", "Launching DDoS attacks and sending spam at scale", "Patching vulnerable servers"],
    answer: "Launching DDoS attacks and sending spam at scale",
    explanation: "A botnet is a network of infected computers (bots) under an attacker's remote control. Attackers use botnets to send spam, launch large-scale DDoS attacks, mine cryptocurrency, or steal credentials — all without the device owners' knowledge. Keeping systems patched and using antivirus software helps avoid becoming part of a botnet.",
    source: "SANS Institute",
  },
  {
    id: 11,
    question: "What type of social engineering attack uses phone calls to trick victims into giving up sensitive information?",
    options: ["Smishing", "Pretexting", "Phishing", "Vishing"],
    answer: "Vishing",
    explanation: "Vishing (voice phishing) uses phone calls where attackers impersonate banks, tech support, or government agencies to pressure victims into revealing credentials or financial information. It often creates urgency — 'your account will be locked!' — to prevent the victim from thinking critically. Hang up and call the organization back using their official number.",
    source: "SANS Institute",
  },
  {
    id: 12,
    question: "What is a phishing attack sent via SMS text message called?",
    options: ["Vishing", "Whaling", "Smishing", "Spear phishing"],
    answer: "Smishing",
    explanation: "Smishing (SMS phishing) delivers malicious links or requests through text messages, often pretending to be a delivery service, bank, or government agency. Many people trust text messages more than email, making smishing effective. Never click links in unexpected texts — go directly to the official website instead.",
    source: "CISA",
  },
  {
    id: 13,
    question: "What attack silently redirects your browser to a fake website by corrupting DNS records?",
    options: ["Typosquatting", "DNS tunneling", "Session hijacking", "Pharming"],
    answer: "Pharming",
    explanation: "Pharming corrupts DNS records so that a legitimate domain name resolves to an attacker-controlled IP address. Unlike phishing, the victim does not need to click any malicious link — just typing a real URL sends them to the fake site. DNSSEC and checking for HTTPS certificates help detect pharming attacks.",
    source: "SANS Institute",
  },
  {
    id: 14,
    question: "What type of malware secretly collects data about your browsing habits and sends it to a third party?",
    options: ["Ransomware", "Adware", "Keylogger", "Spyware"],
    answer: "Spyware",
    explanation: "Spyware runs silently in the background and collects sensitive information — browsing history, login credentials, financial data — without the user's knowledge or consent. It is commonly bundled with free downloads. Regular malware scans and downloading software only from trusted sources help prevent spyware infections.",
    source: "NIST SP 800-83",
  },
  {
    id: 15,
    question: "What attack registers misspelled versions of popular website names to catch users who mistype the URL?",
    options: ["DNS hijacking", "Watering hole", "Pharming", "Typosquatting"],
    answer: "Typosquatting",
    explanation: "Typosquatting registers domain names that look like common misspellings of legitimate websites (e.g. 'goggle.com' instead of 'google.com'). Visitors who mistype the URL land on pages that may serve ads, steal credentials, or install malware. Always double-check the URL in your address bar before entering any information.",
    source: "SANS Institute",
  },
  {
    id: 16,
    question: "Which attack embeds malicious code into a website frequently visited by a target group?",
    options: ["Spear phishing", "Drive-by download", "Typosquatting", "Watering hole attack"],
    answer: "Watering hole attack",
    explanation: "A watering hole attack compromises a website that the target group regularly visits, then infects visitors with malware. The attacker 'poisons the watering hole' — a trusted source — rather than sending suspicious emails. These attacks are especially effective against well-trained employees who avoid phishing emails.",
    source: "SANS Institute",
  },
  {
    id: 17,
    question: "What term describes malware that hides deep inside the operating system to avoid detection and maintain persistent access?",
    options: ["Backdoor", "Spyware", "Adware", "Rootkit"],
    answer: "Rootkit",
    explanation: "A rootkit is malware designed to hide itself and other malicious programs from the operating system and security tools. It often gains administrator-level ('root') access and can hide files, processes, and network connections. Removing a rootkit often requires booting from a clean external drive because it hides from running system tools.",
    source: "SANS Institute",
  },
  {
    id: 18,
    question: "What is a 'backdoor' in the context of malware?",
    options: ["A vulnerability in web application login pages", "A hidden method giving an attacker remote access to a system without normal authentication", "A type of firewall rule allowing all inbound traffic", "An unused admin account left by developers"],
    answer: "A hidden method giving an attacker remote access to a system without normal authentication",
    explanation: "A backdoor is a covert way for an attacker to access a compromised system — bypassing normal authentication — at any time. Trojans and rootkits commonly install backdoors. Attackers use backdoors for persistent access even after the original vulnerability is patched, making full incident response critical after any breach.",
    source: "NIST SP 800-83",
  },
  {
    id: 19,
    question: "What type of attack injects malicious SQL commands into an input field to manipulate or extract database data?",
    options: ["XSS", "CSRF", "Command injection", "SQL injection"],
    answer: "SQL injection",
    explanation: "SQL injection inserts malicious SQL code into user input fields — such as login forms — that gets executed by the database. Attackers can dump entire databases, bypass authentication, or delete records. Using parameterized queries and prepared statements prevents SQL injection by separating code from data.",
    source: "OWASP Top 10",
  },
  {
    id: 20,
    question: "What attack tricks a logged-in user's browser into sending unauthorized requests to a site they're authenticated on?",
    options: ["XSS", "Clickjacking", "Session fixation", "CSRF"],
    answer: "CSRF",
    explanation: "Cross-Site Request Forgery (CSRF) abuses an authenticated user's browser to send forged requests — like changing a password or making a payment — to a trusted site without the user's knowledge. The site trusts the request because it comes with the user's valid session cookie. Anti-CSRF tokens prevent this attack.",
    source: "OWASP Top 10",
  },
  {
    id: 21,
    question: "Which attack captures and retransmits a valid authentication message to log in as a legitimate user?",
    options: ["Credential stuffing", "Password spraying", "Pass-the-hash", "Replay attack"],
    answer: "Replay attack",
    explanation: "A replay attack captures a valid authentication credential or session token and retransmits it later to impersonate the original user. Nonces (one-time values) and timestamps in authentication protocols prevent replay attacks by ensuring credentials expire after a single use or within a short time window.",
    source: "NIST SP 800-63",
  },
  {
    id: 22,
    question: "What attack automatically tests large lists of stolen username and password pairs from past breaches against other websites?",
    options: ["Brute force", "Password spraying", "Dictionary attack", "Credential stuffing"],
    answer: "Credential stuffing",
    explanation: "Credential stuffing uses leaked username/password pairs from one breached service and tries them on other websites, exploiting the fact that many people reuse passwords. It is automated and can test millions of combinations. Using a unique password for every account and enabling MFA stops credential stuffing effectively.",
    source: "OWASP",
  },
  {
    id: 23,
    question: "What attack tries one commonly-used password against many different user accounts to avoid triggering lockouts?",
    options: ["Brute force", "Credential stuffing", "Dictionary attack", "Password spraying"],
    answer: "Password spraying",
    explanation: "Password spraying tries a single common password — like 'Summer2024!' — across a large number of accounts rather than many passwords against one account. This avoids account lockout thresholds triggered by too many failed attempts on one account. Organizations should block commonly-used passwords and enable lockout policies.",
    source: "CISA",
  },
  {
    id: 24,
    question: "What type of attack tries every possible combination of characters to guess a password?",
    options: ["Credential stuffing", "Dictionary attack", "Password spraying", "Brute force"],
    answer: "Brute force",
    explanation: "A brute force attack systematically tries every possible character combination until the correct password is found. Short or simple passwords can be cracked in seconds. Long, complex passphrases and account lockout policies make brute force attacks computationally infeasible.",
    source: "SANS Institute",
  },
  {
    id: 25,
    question: "What do you call malware that stays hidden and triggers only when a specific condition is met, like a certain date?",
    options: ["Trojan", "Ransomware", "Spyware", "Logic bomb"],
    answer: "Logic bomb",
    explanation: "A logic bomb is malicious code that remains dormant until a predefined condition is met — such as a date, a file deletion, or an employee being removed from the system. It is often planted by disgruntled insiders. Once triggered, it can delete files, corrupt data, or exfiltrate information.",
    source: "NIST SP 800-83",
  },
  {
    id: 26,
    question: "Which type of attack uses fake scenarios or impersonation to psychologically manipulate people into giving up sensitive information?",
    options: ["Baiting", "Tailgating", "Dumpster diving", "Social engineering"],
    answer: "Social engineering",
    explanation: "Social engineering manipulates human psychology — trust, urgency, fear, or authority — to get victims to reveal credentials, grant access, or transfer money. It exploits people rather than technology, making security awareness training the primary defense. All phishing, vishing, and pretexting attacks are forms of social engineering.",
    source: "SANS Institute",
  },
  {
    id: 27,
    question: "What is 'pretexting' in a social engineering attack?",
    options: ["Sending phishing emails with fake subject lines", "Creating a fabricated scenario to gain a victim's trust and extract information", "Planting malware inside a gift USB drive", "Eavesdropping on network communications"],
    answer: "Creating a fabricated scenario to gain a victim's trust and extract information",
    explanation: "Pretexting involves an attacker inventing a believable story — such as posing as IT support, a vendor, or an auditor — to manipulate a victim into providing information or access. The 'pretext' makes the request seem legitimate. Verifying identity through official channels before sharing sensitive information is the best defense.",
    source: "SANS Institute",
  },
  {
    id: 28,
    question: "What is 'baiting' in social engineering?",
    options: ["Sending a fraudulent invoice by email", "Leaving an infected USB drive in a public place hoping someone will plug it in", "Calling a victim and pretending to be IT support", "Sending a phishing SMS message"],
    answer: "Leaving an infected USB drive in a public place hoping someone will plug it in",
    explanation: "Baiting exploits human curiosity by leaving infected USB drives or other media in visible locations — parking lots, lobbies — hoping someone will pick them up and plug them in. Once connected, the drive automatically installs malware. Organizations should enforce policies against using unknown external media.",
    source: "SANS Institute",
  },
  {
    id: 29,
    question: "What physical attack allows an unauthorized person to enter a restricted area by following closely behind an authorized person?",
    options: ["Pretexting", "Shoulder surfing", "Dumpster diving", "Tailgating"],
    answer: "Tailgating",
    explanation: "Tailgating (or piggybacking) occurs when an unauthorized person follows an authorized employee through a secured door without using their own credentials. It is a physical security attack that bypasses electronic access controls entirely. Security awareness training and mantrap entry systems help prevent tailgating.",
    source: "SANS Institute",
  },
  {
    id: 30,
    question: "An attacker stands behind you in a public place and watches you enter your PIN. What attack is this?",
    options: ["Tailgating", "Pretexting", "Dumpster diving", "Shoulder surfing"],
    answer: "Shoulder surfing",
    explanation: "Shoulder surfing is observing someone's screen, keyboard, or keypad to steal credentials, PINs, or sensitive information. It can be done directly or using a camera. Being aware of your surroundings, using screen privacy filters, and shielding keypads when entering PINs are effective countermeasures.",
    source: "SANS Institute",
  },
  {
    id: 31,
    question: "What attack involves searching through trash or discarded materials to find sensitive information like passwords or account numbers?",
    options: ["Shoulder surfing", "Tailgating", "Baiting", "Dumpster diving"],
    answer: "Dumpster diving",
    explanation: "Dumpster diving involves searching through discarded trash for sensitive documents — printed passwords, account statements, org charts, or old hard drives. Information found can be used directly for attacks or to craft convincing social engineering scenarios. Shredding all sensitive documents before disposal is the main defense.",
    source: "SANS Institute",
  },
  {
    id: 32,
    question: "What is a distributed denial of service (DDoS) attack?",
    options: ["An attack that encrypts your files from a remote server", "An attack using many compromised computers to flood a target with traffic until it becomes unavailable", "An attack that intercepts traffic between two users", "An attack that guesses passwords using a distributed cluster"],
    answer: "An attack using many compromised computers to flood a target with traffic until it becomes unavailable",
    explanation: "A DDoS attack uses a large number of compromised machines — often a botnet — to simultaneously send traffic to a target, overwhelming it until it cannot respond to legitimate users. DDoS attacks are hard to stop because traffic comes from thousands of different IP addresses. CDNs, rate limiting, and DDoS protection services help mitigate them.",
    source: "SANS Institute",
  },
  {
    id: 33,
    question: "What is an exploit in cybersecurity?",
    options: ["A software update released to fix a security bug", "A fake login page used to steal credentials", "Code or a technique that takes advantage of a vulnerability to cause unintended behavior", "A log of suspicious activity detected by a firewall"],
    answer: "Code or a technique that takes advantage of a vulnerability to cause unintended behavior",
    explanation: "An exploit is a piece of code, software, or technique that leverages a security vulnerability — a bug or misconfiguration — to gain unauthorized access or execute malicious actions. Exploits are used to install malware, escalate privileges, or steal data. Keeping software patched removes the vulnerabilities that exploits rely on.",
    source: "NIST CSRC",
  },
  {
    id: 34,
    question: "What type of malware secretly shows or downloads unwanted advertisements on your device?",
    options: ["Spyware", "Ransomware", "Adware", "Keylogger"],
    answer: "Adware",
    explanation: "Adware automatically displays or downloads advertisements without the user's consent, often bundled with free software. While less dangerous than ransomware, aggressive adware tracks browsing behavior and can slow devices significantly. It may also install additional malware. Downloading software only from official sources reduces adware risk.",
    source: "NIST SP 800-83",
  },
  {
    id: 35,
    question: "What attack fakes the sender address of an email to make it appear to come from a trusted source?",
    options: ["Phishing", "Vishing", "Spoofing", "Pharming"],
    answer: "Spoofing",
    explanation: "Email spoofing forges the 'From' field of an email to make it appear it was sent by a trusted person or organization. This is commonly used in phishing campaigns to increase credibility. Email authentication protocols like SPF, DKIM, and DMARC help detect and block spoofed emails.",
    source: "SANS Institute",
  },
  {
    id: 36,
    question: "What attack targets a company's vendors or software suppliers to compromise the company indirectly?",
    options: ["Watering hole attack", "Man-in-the-Middle", "Insider threat", "Supply chain attack"],
    answer: "Supply chain attack",
    explanation: "A supply chain attack compromises a vendor, software provider, or hardware manufacturer that the target organization trusts, then uses that access to reach the end target. The SolarWinds attack is a famous example — attackers inserted malicious code into a software update distributed to thousands of organizations. Vendor vetting and software integrity checks are key defenses.",
    source: "CISA",
  },
  {
    id: 37,
    question: "What is a zero-day vulnerability?",
    options: ["A vulnerability that has already been patched", "A vulnerability with a CVSS score of zero", "A vulnerability that is unknown to the vendor and has no available patch yet", "A vulnerability only exploitable on day zero of a software release"],
    answer: "A vulnerability that is unknown to the vendor and has no available patch yet",
    explanation: "A zero-day vulnerability is a security flaw that the software vendor does not yet know about — so there are 'zero days' of protection available. Attackers who discover zero-days can exploit them freely until the vendor releases a patch. Zero-days are extremely valuable and often sold on dark web markets.",
    source: "CISA",
  },
  {
    id: 38,
    question: "What term describes an attacker gaining more system permissions than they were originally given?",
    options: ["Lateral movement", "Persistence", "Defense evasion", "Privilege escalation"],
    answer: "Privilege escalation",
    explanation: "Privilege escalation occurs when an attacker elevates their access level — from a normal user to administrator, or from one account to a higher-value account — by exploiting a vulnerability or misconfiguration. This gives them greater control over the system. Limiting user privileges and patching vulnerabilities reduce this risk.",
    source: "MITRE ATT&CK",
  },
  {
    id: 39,
    question: "What do attackers call moving through a network from one compromised system to other systems after initial access?",
    options: ["Privilege escalation", "Persistence", "Defense evasion", "Lateral movement"],
    answer: "Lateral movement",
    explanation: "Lateral movement describes an attacker's techniques for moving through a network after gaining initial access — jumping from one system to another to reach higher-value targets like domain controllers or sensitive data stores. Network segmentation and monitoring for unusual internal traffic help detect and limit lateral movement.",
    source: "MITRE ATT&CK",
  },
  {
    id: 40,
    question: "What is a 'drive-by download' attack?",
    options: ["Malware delivered via a malicious USB drive left in a public area", "Malware automatically downloaded and installed when a user visits a compromised website", "A file downloaded from an email attachment", "An attacker downloading data from an unencrypted network"],
    answer: "Malware automatically downloaded and installed when a user visits a compromised website",
    explanation: "A drive-by download silently installs malware on a visitor's device when they land on a compromised or malicious website — no click or download confirmation required. The attack exploits vulnerabilities in browsers or plugins. Keeping browsers and plugins updated and using web filtering tools significantly reduces drive-by download risk.",
    source: "SANS Institute",
  },
  {
    id: 41,
    question: "What type of malware operates entirely in memory and uses built-in system tools like PowerShell — leaving no files on disk?",
    options: ["Rootkit", "Spyware", "Adware", "Fileless malware"],
    answer: "Fileless malware",
    explanation: "Fileless malware resides only in a system's memory and uses legitimate built-in tools — PowerShell, WMI, command prompt — to carry out attacks without writing malicious files to disk. Because no malicious files exist, traditional signature-based antivirus tools often cannot detect it. Behavioral analysis and memory scanning are required.",
    source: "MITRE ATT&CK",
  },
  {
    id: 42,
    question: "Which attack targets the most senior executives of a company with highly personalized phishing messages?",
    options: ["Spear phishing", "Credential stuffing", "Business Email Compromise", "Whaling"],
    answer: "Whaling",
    explanation: "Whaling is a spear phishing attack specifically targeting C-suite executives — CEOs, CFOs, and board members — who have authority to approve large transactions. Attackers research the executive's communication style and business dealings to craft convincing messages. Multi-factor authentication and strict wire transfer verification procedures help prevent whaling attacks.",
    source: "SANS Institute",
  },
  {
    id: 43,
    question: "What fraud scheme involves attackers impersonating a company executive via email to instruct employees to transfer money or share sensitive data?",
    options: ["Whaling", "Smishing", "Vishing", "Business Email Compromise"],
    answer: "Business Email Compromise",
    explanation: "Business Email Compromise (BEC) is a targeted fraud where attackers compromise or spoof an executive's email account to send convincing requests for wire transfers or sensitive information. BEC has caused billions in global losses. Verifying transfer requests through a second communication channel and enabling MFA on email accounts are key defenses.",
    source: "FBI / CISA",
  },
  {
    id: 44,
    question: "What term describes an attacker gaining a foothold in a system and installing tools to return even after a reboot or password change?",
    options: ["Lateral movement", "Privilege escalation", "Exfiltration", "Persistence"],
    answer: "Persistence",
    explanation: "Persistence refers to techniques attackers use to maintain their foothold in a compromised system across reboots, credential changes, or other disruptions — such as adding startup scripts, scheduled tasks, or hidden user accounts. Detecting persistence mechanisms is a key goal of incident response and threat hunting.",
    source: "MITRE ATT&CK",
  },
  {
    id: 45,
    question: "What do you call a decoy system set up to attract and monitor attackers?",
    options: ["Sandbox", "DMZ", "Firewall", "Honeypot"],
    answer: "Honeypot",
    explanation: "A honeypot is a decoy system or server designed to look like a real target to lure attackers. When an attacker interacts with it, their activity is logged for analysis and threat intelligence. Honeypots help security teams learn attacker techniques and provide early warning of intrusions without putting real systems at risk.",
    source: "SANS Institute",
  },
  {
    id: 46,
    question: "What attack intercepts network traffic on a local network by sending fake ARP messages to associate the attacker's MAC address with another host's IP?",
    options: ["DNS spoofing", "IP spoofing", "Session hijacking", "ARP poisoning"],
    answer: "ARP poisoning",
    explanation: "ARP poisoning (or ARP spoofing) sends fake Address Resolution Protocol messages on a local network to link the attacker's MAC address with a legitimate IP address. This causes traffic intended for that IP to be sent to the attacker instead, enabling man-in-the-middle attacks. Using dynamic ARP inspection (DAI) on switches helps prevent it.",
    source: "SANS Institute",
  },
  {
    id: 47,
    question: "What is a computer virus?",
    options: ["Malware that spreads without any host file by exploiting network vulnerabilities", "Malware that attaches to a legitimate file and spreads when that file is executed or shared", "Malware that disguises itself as legitimate software", "Malware that encrypts files and demands payment"],
    answer: "Malware that attaches to a legitimate file and spreads when that file is executed or shared",
    explanation: "A virus attaches itself to a legitimate file or program and spreads when that infected file is executed or shared with other systems. Unlike worms, viruses require user interaction — opening an infected file — to propagate. Antivirus software detects known virus signatures and behavioral patterns to prevent infection.",
    source: "NIST SP 800-83",
  },
  {
    id: 48,
    question: "What attack secretly steals data from a compromised network and sends it to the attacker's external server?",
    options: ["Lateral movement", "Persistence", "Reconnaissance", "Data exfiltration"],
    answer: "Data exfiltration",
    explanation: "Data exfiltration is the unauthorized transfer of data from inside an organization to an attacker's external location. Attackers may exfiltrate files over encrypted channels, disguised in normal-looking traffic, or via cloud storage. Data Loss Prevention (DLP) tools, network monitoring, and egress filtering help detect and block exfiltration attempts.",
    source: "MITRE ATT&CK",
  },
  {
    id: 49,
    question: "What is the first phase of most cyberattacks where the attacker gathers information about the target?",
    options: ["Exploitation", "Persistence", "Lateral movement", "Reconnaissance"],
    answer: "Reconnaissance",
    explanation: "Reconnaissance is the information-gathering phase where attackers research a target — scanning for open ports, finding employee names on LinkedIn, discovering software versions, and identifying vulnerabilities — before launching an attack. It can be passive (monitoring public data) or active (scanning systems directly). Limiting publicly available information helps reduce reconnaissance effectiveness.",
    source: "MITRE ATT&CK",
  },
  {
    id: 50,
    question: "Which type of attack exploits trust between websites by sending malicious requests from one site to another where the victim is logged in?",
    options: ["XSS", "Clickjacking", "SQL injection", "CSRF"],
    answer: "CSRF",
    explanation: "Cross-Site Request Forgery (CSRF) tricks an authenticated user's browser into sending unwanted requests to a web application they're logged into — like changing their email or transferring funds — without the user's knowledge. The site can't distinguish the forged request from a legitimate one. Anti-CSRF tokens and SameSite cookie attributes are the primary defenses.",
    source: "OWASP Top 10",
  },
  {
    id: 51,
    question: "What is a 'man-in-the-browser' attack?",
    options: ["An attacker controlling a victim's browser remotely via a RAT", "Malware that intercepts and modifies transactions directly inside a victim's browser", "A script injected into a webpage that reads form input", "An attacker monitoring unencrypted web traffic on a shared network"],
    answer: "Malware that intercepts and modifies transactions directly inside a victim's browser",
    explanation: "A man-in-the-browser (MitB) attack uses malware installed inside the browser to intercept and silently modify transactions — like changing a bank transfer recipient — before they're sent to the server. The victim sees the correct information on screen while the attacker sees something different. Hardware tokens and out-of-band transaction verification help counter MitB.",
    source: "SANS Institute",
  },
  {
    id: 52,
    question: "What type of cyberattack targets Industrial Control Systems (ICS) and critical infrastructure like power grids and water treatment plants?",
    options: ["APT", "Ransomware", "DDoS", "OT attack"],
    answer: "OT attack",
    explanation: "Operational Technology (OT) attacks target Industrial Control Systems — SCADA, PLCs, and other systems that control physical infrastructure like power grids, pipelines, and factories. The Stuxnet worm is a famous example. OT systems were historically air-gapped but are increasingly connected, making them vulnerable to cyberattacks with real-world physical consequences.",
    source: "CISA",
  },
  {
    id: 53,
    question: "What attack uses malicious macros hidden inside seemingly normal documents — like Word files or spreadsheets — to execute malware?",
    options: ["Drive-by download", "Fileless malware", "Watering hole", "Macro malware"],
    answer: "Macro malware",
    explanation: "Macro malware hides malicious code inside macros embedded in Office documents. When the victim opens the file and enables macros, the malware executes — downloading ransomware, opening backdoors, or stealing credentials. Disabling macros by default and enabling them only from trusted sources greatly reduces this risk.",
    source: "NIST SP 800-83",
  },
  {
    id: 54,
    question: "What is 'session hijacking'?",
    options: ["Guessing a user's session token through brute force", "Stealing or forging an active session token to take over an authenticated user's session", "Forcing a user to authenticate to a fake login page", "Injecting malicious scripts into a session cookie"],
    answer: "Stealing or forging an active session token to take over an authenticated user's session",
    explanation: "Session hijacking steals or forges a victim's session token — the credential that keeps them logged in — allowing the attacker to take over their active session without needing a password. Common methods include XSS attacks, network sniffing, or cookie theft. HTTPS and HttpOnly/Secure cookie flags help protect session tokens.",
    source: "OWASP",
  },
  {
    id: 55,
    question: "What is a 'RAT' in cybersecurity?",
    options: ["A network scanner tool used by penetration testers", "Malware that gives attackers full remote control over a victim's computer", "A type of ransomware that targets cloud storage", "An automated phishing email campaign tool"],
    answer: "Malware that gives attackers full remote control over a victim's computer",
    explanation: "A Remote Access Trojan (RAT) is malware that gives an attacker complete hidden control over a victim's computer — allowing them to access files, activate the webcam, log keystrokes, and install additional malware. RATs are often delivered via phishing emails or malicious downloads and run invisibly in the background.",
    source: "NIST SP 800-83",
  },
  {
    id: 56,
    question: "Which type of attack floods a network with ICMP echo requests (ping) from a spoofed source IP, causing the target to be overwhelmed by responses?",
    options: ["SYN flood", "ARP poisoning", "DNS amplification", "Smurf attack"],
    answer: "Smurf attack",
    explanation: "A Smurf attack sends ICMP echo requests with the victim's spoofed IP address to a broadcast network address. All devices on the network reply to the victim, amplifying the traffic into a DoS attack. Modern networks disable IP broadcast forwarding by default, making Smurf attacks much rarer today.",
    source: "SANS Institute",
  },
  {
    id: 57,
    question: "What attack exploits the TCP three-way handshake by sending many connection requests without completing the handshake, exhausting server resources?",
    options: ["Smurf attack", "DNS amplification", "UDP flood", "SYN flood"],
    answer: "SYN flood",
    explanation: "A SYN flood sends a large number of TCP SYN (synchronize) requests to a server but never completes the three-way handshake. The server reserves resources for each half-open connection until they fill up, preventing real users from connecting. SYN cookies and rate limiting on firewalls are standard mitigations.",
    source: "SANS Institute",
  },
  {
    id: 58,
    question: "What kind of attack uses small DNS queries to generate very large responses, directing the amplified traffic at a victim?",
    options: ["SYN flood", "Smurf attack", "Ping of Death", "DNS amplification"],
    answer: "DNS amplification",
    explanation: "DNS amplification sends small DNS queries with the victim's spoofed IP address to open DNS resolvers. The resolvers send large responses to the victim, amplifying the traffic volume — sometimes by a factor of 50x or more. This is used to launch large DDoS attacks. Disabling open DNS resolvers and using rate limiting reduces this threat.",
    source: "CISA",
  },
  {
    id: 59,
    question: "What is an Advanced Persistent Threat (APT)?",
    options: ["A highly advanced piece of ransomware with AI-powered evasion", "A critical vulnerability with a CVSS score above 9.0", "An automated scanning tool used in penetration testing", "A long-term stealthy attack campaign by a skilled adversary targeting a specific organization"],
    answer: "A long-term stealthy attack campaign by a skilled adversary targeting a specific organization",
    explanation: "An APT is a sophisticated, long-term cyberattack where a well-resourced adversary — often nation-state sponsored — infiltrates a target network and maintains access for months or years to gather intelligence or cause strategic damage. APT actors move quietly to avoid detection, making them especially dangerous. Network monitoring, threat hunting, and zero-trust principles help defend against APTs.",
    source: "NIST SP 800-39 / MITRE ATT&CK",
  },
  {
    id: 60,
    question: "What attack involves inserting malicious code into a third-party library or component used by a target application?",
    options: ["SQL injection", "Watering hole attack", "Macro malware", "Supply chain attack"],
    answer: "Supply chain attack",
    explanation: "A supply chain attack compromises a trusted third-party component — open source library, software update, or vendor tool — to reach the end target. When the victim installs the update or imports the library, the malicious code executes in their environment. Auditing dependencies, using software bills of materials (SBOMs), and verifying package integrity are key defenses.",
    source: "CISA / NIST SP 800-161",
  },
  {
    id: 61,
    question: "What attack tricks a web server into making HTTP requests to internal resources that are not normally accessible from the outside?",
    options: ["CSRF", "XXE", "IDOR", "SSRF"],
    answer: "SSRF",
    explanation: "Server-Side Request Forgery (SSRF) forces a server to make requests to internal services — cloud metadata APIs, admin panels, or internal databases — on the attacker's behalf. Because the request originates from the trusted server, internal firewalls allow it. Validating and allowlisting permitted destination URLs prevents SSRF.",
    source: "OWASP Top 10",
  },
  {
    id: 62,
    question: "What attack injects malicious external entity declarations into XML input to read local server files or trigger internal requests?",
    options: ["SQL injection", "SSRF", "XSS", "XXE"],
    answer: "XXE",
    explanation: "XML External Entity (XXE) injection exploits XML parsers that process external entity references, allowing attackers to read local files, perform SSRF, or cause denial of service. Per OWASP, the fix is to disable external entity processing in XML parsers — a feature rarely needed in modern applications.",
    source: "OWASP Top 10",
  },
  {
    id: 63,
    question: "What vulnerability exposes internal object references — like database record IDs — in URLs without verifying the requester's authorization to access them?",
    options: ["Broken authentication", "XSS", "Path traversal", "IDOR"],
    answer: "IDOR",
    explanation: "Insecure Direct Object Reference (IDOR) occurs when an application uses user-controlled input to access objects without verifying authorization. Changing a URL from /invoice/100 to /invoice/101 may expose another user's data. Per OWASP, every object access must enforce authorization server-side, not just authentication.",
    source: "OWASP",
  },
  {
    id: 64,
    question: "What security control requires users to provide two or more independent factors to verify their identity before gaining access?",
    options: ["SSO", "PAM", "RBAC", "MFA"],
    answer: "MFA",
    explanation: "Multi-Factor Authentication (MFA) requires at least two independent factors: something you know (password), something you have (authenticator app or hardware token), or something you are (biometric). Per CISA, enabling MFA is one of the single most impactful security actions an individual or organization can take to prevent account compromise.",
    source: "NIST SP 800-63B / CISA",
  },
  {
    id: 65,
    question: "What technology creates an encrypted tunnel to securely transmit data over an untrusted public network like the internet?",
    options: ["Proxy", "Firewall", "DMZ", "VPN"],
    answer: "VPN",
    explanation: "A Virtual Private Network (VPN) creates an encrypted tunnel between a user's device and a trusted network over the internet. Per NIST SP 800-77, VPNs protect data confidentiality and integrity in transit. However, compromised VPN credentials give attackers broad network access, making strong authentication essential for VPN users.",
    source: "NIST SP 800-77",
  },
  {
    id: 66,
    question: "What network zone separates publicly accessible servers from the internal private network, acting as a buffer between the internet and internal systems?",
    options: ["VPN", "VLAN", "Subnet", "DMZ"],
    answer: "DMZ",
    explanation: "A Demilitarized Zone (DMZ) is a network segment hosting public-facing services — web servers, email gateways — separated from the internal corporate network by a firewall. If a DMZ server is compromised, the attacker faces another firewall barrier before reaching internal systems. It limits the blast radius of a perimeter breach.",
    source: "SANS Institute",
  },
  {
    id: 67,
    question: "What security tool monitors network traffic for suspicious activity and generates alerts — but does NOT actively block threats by itself?",
    options: ["Firewall", "SIEM", "IPS", "IDS"],
    answer: "IDS",
    explanation: "An Intrusion Detection System (IDS) passively monitors network or host activity for signs of known attacks and policy violations, generating alerts for analysts. Per NIST SP 800-94, an IDS does not block traffic — it observes and reports. It must be paired with human review or automated blocking tools to stop threats.",
    source: "NIST SP 800-94",
  },
  {
    id: 68,
    question: "What inline security tool actively detects AND automatically blocks malicious network traffic in real time?",
    options: ["IDS", "WAF", "SIEM", "IPS"],
    answer: "IPS",
    explanation: "An Intrusion Prevention System (IPS) is an inline device that monitors traffic and automatically blocks or resets connections matching known attack signatures or anomalous behavior. Per NIST SP 800-94, unlike a passive IDS, an IPS takes active enforcement action — dropping malicious packets before they reach their target.",
    source: "NIST SP 800-94",
  },
  {
    id: 69,
    question: "What platform aggregates and correlates security logs from across an IT environment to detect threats and support incident response?",
    options: ["EDR", "SOAR", "NAC", "SIEM"],
    answer: "SIEM",
    explanation: "A Security Information and Event Management (SIEM) system collects centralized log data from firewalls, servers, and endpoints, then uses correlation rules and analytics to surface threats. Per NIST SP 800-92, SIEM is a cornerstone of security operations centers (SOCs). It provides visibility needed to detect multi-stage attacks spanning many systems.",
    source: "NIST SP 800-92",
  },
  {
    id: 70,
    question: "What security model assumes no user, device, or network segment is inherently trustworthy — even if they are already inside the corporate network?",
    options: ["Defense in depth", "Least privilege", "Network segmentation", "Zero Trust"],
    answer: "Zero Trust",
    explanation: "Zero Trust is a security architecture that eliminates implicit trust and requires continuous verification of every access request, regardless of where it originates. Per NIST SP 800-207, it is built on three principles: verify explicitly, use least privilege, and assume breach. It replaces the outdated model of trusting everything inside the firewall.",
    source: "NIST SP 800-207",
  },
  {
    id: 71,
    question: "What security strategy uses multiple overlapping layers of controls so that if one layer fails, others continue to protect the system?",
    options: ["Zero Trust", "Least privilege", "Compartmentalization", "Defense in depth"],
    answer: "Defense in depth",
    explanation: "Defense in depth applies independent security controls at every layer — physical, network, host, application, and data — so an attacker who bypasses one must defeat additional barriers. Per SANS Institute, no single control is sufficient; layered defenses ensure failures are contained rather than catastrophic.",
    source: "SANS Institute / NIST",
  },
  {
    id: 72,
    question: "What security principle states that users and processes should be granted only the minimum permissions needed to perform their tasks?",
    options: ["Zero Trust", "Need-to-know", "Segregation of duties", "Least privilege"],
    answer: "Least privilege",
    explanation: "The principle of least privilege limits access rights to only what is necessary for a specific job function. Per NIST SP 800-53, restricting privileges reduces the blast radius of a compromised account. Regularly reviewing and revoking unnecessary permissions — known as privilege creep — is a critical security hygiene practice.",
    source: "NIST SP 800-53",
  },
  {
    id: 73,
    question: "What access control model assigns permissions to users based on their defined job role rather than their individual identity?",
    options: ["DAC", "MAC", "ABAC", "RBAC"],
    answer: "RBAC",
    explanation: "Role-Based Access Control (RBAC) grants permissions to roles — 'admin', 'analyst', 'developer' — and assigns users to those roles instead of managing permissions per individual. Per NIST SP 800-53, RBAC simplifies administration and enforces least privilege at scale. It is the most widely used access control model in enterprise environments.",
    source: "NIST SP 800-53",
  },
  {
    id: 74,
    question: "Which OWASP Top 10 category describes users acting outside their intended permissions — accessing other users' data, admin panels, or altering records they should not?",
    options: ["Broken authentication", "Security misconfiguration", "XSS", "Broken access control"],
    answer: "Broken access control",
    explanation: "Broken access control is the #1 OWASP risk (2021). It occurs when restrictions on what authenticated users can do are not properly enforced server-side. Every function and data access must validate authorization — client-side controls alone are insufficient because attackers can bypass them entirely.",
    source: "OWASP Top 10",
  },
  {
    id: 75,
    question: "Which OWASP category covers issues like default credentials, open cloud storage, unnecessary services enabled, and verbose error messages left in production?",
    options: ["Broken access control", "Injection", "Insecure design", "Security misconfiguration"],
    answer: "Security misconfiguration",
    explanation: "Security misconfiguration occurs when security settings are not properly defined or maintained — leaving default passwords unchanged, unnecessary features enabled, or cloud storage publicly accessible. Per OWASP, it is consistently one of the most prevalent vulnerabilities because it requires ongoing diligence. Automated configuration scanning helps detect misconfigurations continuously.",
    source: "OWASP Top 10",
  },
  {
    id: 76,
    question: "What cryptographic protocol secures web communications (HTTPS), email, and VPN tunnels — and replaced the deprecated SSL protocol?",
    options: ["IPsec", "SSH", "SSL 3.0", "TLS"],
    answer: "TLS",
    explanation: "Transport Layer Security (TLS) provides encrypted, authenticated communication channels over the internet. Per NIST SP 800-52, TLS 1.2 and 1.3 are the currently approved versions. Older versions — SSL 3.0, TLS 1.0, and TLS 1.1 — are deprecated due to known vulnerabilities and must not be used in new or updated systems.",
    source: "NIST SP 800-52",
  },
  {
    id: 77,
    question: "Why must passwords be stored as hashed values rather than encrypted text in a database?",
    options: ["Because encryption is too slow for high-traffic login systems", "Because hashes are one-way and irreversible — even if the database is breached, the original password cannot be recovered", "Because hash algorithms are more widely supported across database platforms", "Because encryption requires passwords to be at least 16 characters long"],
    answer: "Because hashes are one-way and irreversible — even if the database is breached, the original password cannot be recovered",
    explanation: "Per NIST SP 800-63B, passwords must be stored using salted cryptographic hashes — not encryption. Encryption can be reversed with the key; hashes cannot. If an attacker steals a database and the encryption key, all passwords are immediately exposed. A properly salted hash forces the attacker to crack each password individually.",
    source: "NIST SP 800-63B",
  },
  {
    id: 78,
    question: "What are the three core properties of information security known as the CIA triad?",
    options: ["Compliance, Identity, and Accountability", "Confidentiality, Identity, and Authentication", "Control, Integrity, and Access", "Confidentiality, Integrity, and Availability"],
    answer: "Confidentiality, Integrity, and Availability",
    explanation: "The CIA triad is the foundational model of information security. Per NIST FIPS 199: Confidentiality ensures data is accessible only to authorized parties; Integrity ensures data has not been altered without authorization; Availability ensures authorized users have reliable access to systems and data. Security controls are designed to protect one or more of these properties.",
    source: "NIST FIPS 199",
  },
  {
    id: 79,
    question: "What is the primary security benefit of using a dedicated password manager?",
    options: ["It encrypts the hard drive automatically when the screen locks", "It allows reuse of one strong master password safely across all sites", "It enables a unique, complex password for every account without requiring you to memorize them all", "It prevents keyloggers from recording your passwords as you type"],
    answer: "It enables a unique, complex password for every account without requiring you to memorize them all",
    explanation: "Per NIST SP 800-63B and CISA, password managers generate and store unique, strong passwords for every account — eliminating password reuse, the primary driver of credential stuffing attacks. The user only needs to remember one strong master password. Security-focused password managers use end-to-end encryption so even the provider cannot read stored passwords.",
    source: "NIST SP 800-63B / CISA",
  },
  {
    id: 80,
    question: "In the NIST SP 800-61 incident response lifecycle, which phase immediately follows Detection and Analysis?",
    options: ["Post-Incident Activity", "Preparation", "Recovery", "Containment, Eradication, and Recovery"],
    answer: "Containment, Eradication, and Recovery",
    explanation: "Per NIST SP 800-61, the incident response lifecycle has four phases: (1) Preparation, (2) Detection and Analysis, (3) Containment, Eradication, and Recovery, and (4) Post-Incident Activity. After detecting and analyzing an incident, the priority shifts to limiting damage, removing the attacker, and restoring normal operations.",
    source: "NIST SP 800-61",
  },
  {
    id: 81,
    question: "What is OAuth 2.0 primarily designed to do?",
    options: ["Encrypt API payloads end-to-end in transit", "Securely store and manage user passwords on a server", "Allow a third-party application to access user resources without exposing the user's password", "Generate one-time passwords for multi-factor authentication"],
    answer: "Allow a third-party application to access user resources without exposing the user's password",
    explanation: "OAuth 2.0 (IETF RFC 6749) is an authorization framework that lets users grant third-party applications limited access to their resources without sharing credentials. For example, a fitness app can read your Google Calendar without knowing your Google password. Authorization is delegated through short-lived access tokens rather than passwords.",
    source: "IETF RFC 6749",
  },
  {
    id: 82,
    question: "Why is timely patch management one of the most critical security practices an organization can perform?",
    options: ["Patches improve application performance and reduce support calls", "Patches remove known vulnerabilities that attackers actively exploit", "Patches automatically detect and remove malware from infected systems", "Patches prevent social engineering attacks against employees"],
    answer: "Patches remove known vulnerabilities that attackers actively exploit",
    explanation: "Per CISA's Known Exploited Vulnerabilities (KEV) catalog, unpatched vulnerabilities are among the most commonly exploited attack vectors. Applying patches promptly — especially for internet-facing systems — removes the weaknesses attackers depend on. Per NIST SP 800-40, a mature patch management program prioritizes critical patches within days of release.",
    source: "CISA / NIST SP 800-40",
  },
  {
    id: 83,
    question: "What is an insider threat in cybersecurity?",
    options: ["A threat originating from a foreign nation-state hacking group", "A malware strain that spreads laterally to internal systems after initial infection", "A risk posed by individuals with authorized access — employees, contractors, or partners — who misuse it", "An attack targeting internal servers rather than public-facing infrastructure"],
    answer: "A risk posed by individuals with authorized access — employees, contractors, or partners — who misuse it",
    explanation: "Per CISA, an insider threat occurs when a person with authorized access — employee, contractor, business partner — uses that access to cause harm, whether intentionally (malicious insider) or accidentally (negligent insider). Insider threats are difficult to detect because access is legitimate. User behavior analytics and least privilege access reduce insider risk.",
    source: "CISA",
  },
  {
    id: 84,
    question: "What does non-repudiation mean in cybersecurity?",
    options: ["The ability to prevent data from being modified in transit", "Preventing unauthorized users from impersonating legitimate accounts", "Encrypting data so only the intended recipient can read it", "Ensuring a party cannot deny having performed a specific action, such as sending a message or completing a transaction"],
    answer: "Ensuring a party cannot deny having performed a specific action, such as sending a message or completing a transaction",
    explanation: "Per NIST SP 800-53, non-repudiation is the property that a party cannot deny having performed an action. Digital signatures provide non-repudiation — they cryptographically prove the signer's identity and that the content was not altered. It is essential in legal and financial contexts where proof of transaction authenticity is required.",
    source: "NIST SP 800-53",
  },
  {
    id: 85,
    question: "What is the primary purpose of security awareness training for employees?",
    options: ["To teach employees penetration testing and ethical hacking techniques", "To train employees on using the IT helpdesk ticketing system efficiently", "To fulfill compliance audits without changing day-to-day employee behavior", "To help employees recognize threats and reduce human error as an attack vector"],
    answer: "To help employees recognize threats and reduce human error as an attack vector",
    explanation: "Per NIST SP 800-50, security awareness training reduces the risk that employees will fall victim to phishing, social engineering, or other human-targeted attacks. Human error is a factor in the vast majority of data breaches. Effective programs include simulated phishing exercises, regular short modules, and clear reporting procedures.",
    source: "NIST SP 800-50 / SANS Institute",
  },
  {
    id: 86,
    question: "In cybersecurity risk management, what is the correct relationship between vulnerability, threat, and risk?",
    options: ["Risk = Vulnerability × Impact; Threat is a separate concept", "Threat and vulnerability mean the same thing; risk is the financial cost", "Risk is a vulnerability already exploited; threat is a potential future one", "Vulnerability is a weakness; threat is a potential danger that exploits it; risk is the likelihood and impact of that exploitation occurring"],
    answer: "Vulnerability is a weakness; threat is a potential danger that exploits it; risk is the likelihood and impact of that exploitation occurring",
    explanation: "Per NIST SP 800-30, a vulnerability is a weakness in a system; a threat is a potential event that could exploit it; and risk is the combination of likelihood and impact. Risk = Likelihood × Impact. Understanding these distinctions guides prioritized security investment — fixing the vulnerabilities most likely to be exploited with the highest potential damage first.",
    source: "NIST SP 800-30",
  },
  {
    id: 87,
    question: "Why is secure cryptographic key management so critical to encryption security?",
    options: ["Because longer keys always provide stronger security regardless of storage", "Because if an encryption key is compromised, all data encrypted with it can be decrypted by the attacker", "Because cryptographic algorithms are public and key management keeps the algorithm secret", "Because key management prevents brute-force attacks on hashed passwords"],
    answer: "Because if an encryption key is compromised, all data encrypted with it can be decrypted by the attacker",
    explanation: "Per NIST SP 800-57, the security of an encrypted system ultimately depends on the secrecy of its keys — not the algorithm. If a key is stolen, all data encrypted with it is exposed. Key management practices include rotation, hardware security modules (HSMs) for storage, strict access controls, and automatic expiration to limit the impact of a key compromise.",
    source: "NIST SP 800-57",
  },
  {
    id: 88,
    question: "Which indicator is the most reliable sign that a link in an email is malicious?",
    options: ["The company logo in the email looks slightly off or pixelated", "The email was received outside of normal business hours", "The email contains a PDF attachment rather than inline content", "The URL in the link points to a different domain than the organization that sent the email"],
    answer: "The URL in the link points to a different domain than the organization that sent the email",
    explanation: "Per CISA phishing guidance, the actual link destination — visible by hovering before clicking — is the most reliable indicator. Attackers can perfectly replicate logos, formatting, and writing style, but they cannot own the real domain. Always verify the full URL domain before clicking any link in an unexpected email.",
    source: "CISA",
  },
  {
    id: 89,
    question: "What type of malware secretly uses a victim's CPU and electricity to mine cryptocurrency for the attacker?",
    options: ["Ransomware", "Spyware", "Adware", "Cryptojacking malware"],
    answer: "Cryptojacking malware",
    explanation: "Cryptojacking installs malware or runs browser-based scripts that hijack the victim's processing power to mine cryptocurrency for the attacker. Victims notice slowed device performance and increased energy bills. Unlike ransomware, cryptojacking aims to stay hidden as long as possible. Endpoint protection and browser security extensions detect cryptojacking activity.",
    source: "CISA / SANS Institute",
  },
  {
    id: 90,
    question: "What does EDR (Endpoint Detection and Response) do that traditional antivirus cannot?",
    options: ["EDR scans email attachments for known malware signatures", "EDR replaces the need for firewalls on endpoint devices", "EDR provides only scheduled scans of files stored on disk", "EDR continuously monitors endpoint behavior, detects advanced threats, records telemetry for forensics, and can isolate compromised devices automatically"],
    answer: "EDR continuously monitors endpoint behavior, detects advanced threats, records telemetry for forensics, and can isolate compromised devices automatically",
    explanation: "Per CISA, Endpoint Detection and Response (EDR) solutions continuously monitor endpoint activity — processes, network connections, file changes — to detect behavioral threats that signature-based antivirus misses. EDR records detailed telemetry for forensic investigation and can automatically isolate a compromised endpoint from the network to contain a breach.",
    source: "CISA",
  },
  {
    id: 91,
    question: "What is a Security Operations Center (SOC)?",
    options: ["A physical vault storing cryptographic keys and hardware tokens", "A compliance framework defining minimum security standards", "An automated tool that generates and applies security patches across a network", "A centralized team and facility that continuously monitors, detects, and responds to cybersecurity threats"],
    answer: "A centralized team and facility that continuously monitors, detects, and responds to cybersecurity threats",
    explanation: "Per NIST, a Security Operations Center (SOC) is a dedicated team — supported by SIEM, EDR, and threat intelligence tools — that monitors an organization's security posture around the clock. SOC analysts triage alerts, investigate incidents, distinguish true positives from false positives, and coordinate response to confirmed threats.",
    source: "NIST / SANS Institute",
  },
  {
    id: 92,
    question: "What is a digital certificate and what does it verify?",
    options: ["A file containing an encrypted user password for remote authentication", "A one-time passcode generated by a hardware MFA token", "A firewall log file recording all authorized inbound connections", "An electronic credential issued by a trusted Certificate Authority that verifies an entity's identity and contains its public key"],
    answer: "An electronic credential issued by a trusted Certificate Authority that verifies an entity's identity and contains its public key",
    explanation: "Per SANS Institute, a digital certificate is an electronic document issued by a trusted Certificate Authority (CA) that binds a public key to an identity. TLS certificates allow browsers to verify they are communicating with the legitimate server and establish an encrypted HTTPS session. Expired, self-signed, or revoked certificates indicate potential security risks.",
    source: "SANS Institute / NIST SP 800-32",
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q: Question): Question {
  const shuffled = shuffleArray([...q.options]) as [string, string, string, string];
  return { ...q, options: shuffled };
}

const SESSION_KEY       = "hexora:hq:startTime";
const SESSION_ORDER_KEY = "hexora:hq:order";
const SESSION_INDEX_KEY = "hexora:hq:index";
const SESSION_TIME_KEY  = "hexora:hq:timeLeft";
const SESSION_PTS_KEY   = "hexora:hq:pts";
const SESSION_CORRECT_KEY = "hexora:hq:correct";
const SESSION_WRONG_KEY   = "hexora:hq:wrong";
const DIFFICULTY_KEY    = "hexora:hq:difficulty";
const HQ_PAID_KEY       = "hexora:paid:/home/games/hexo-quiz";

type Phase = "ready" | "playing" | "feedback" | "done";

export default function HexoQuizPage() {
  const router = useRouter();
  const { profile, setOrbs, refreshProfile } = useUser();
  const [phase, setPhase] = useState<Phase>("ready");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(DIFFICULTY_CONFIG.intermediate.duration);
  const [pts, setPts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAt, setSelectedAt] = useState<number | null>(null);
  const [checkReady, setCheckReady] = useState(false);
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: gate check + resume if refreshed mid-game
  useEffect(() => {
    const alreadyPlaying    = sessionStorage.getItem(SESSION_KEY);
    const storedDifficulty  = sessionStorage.getItem(DIFFICULTY_KEY) as Difficulty | null;
    const paid              = sessionStorage.getItem(HQ_PAID_KEY);

    if (!alreadyPlaying && !(storedDifficulty && paid)) {
      router.replace("/home/games/hexo-quiz/difficulty");
      return;
    }

    const resolvedDifficulty: Difficulty =
      storedDifficulty && storedDifficulty in DIFFICULTY_CONFIG
        ? storedDifficulty
        : "intermediate";
    setDifficulty(resolvedDifficulty);

    if (alreadyPlaying) {
      const storedTime = parseInt(sessionStorage.getItem(SESSION_TIME_KEY) ?? "0", 10);
      if (storedTime <= 0) {
        setPts(parseInt(sessionStorage.getItem(SESSION_PTS_KEY) ?? "0", 10));
        setCorrectCount(parseInt(sessionStorage.getItem(SESSION_CORRECT_KEY) ?? "0", 10));
        setWrongCount(parseInt(sessionStorage.getItem(SESSION_WRONG_KEY) ?? "0", 10));
        clearSession();
        setPhase("done");
      } else {
        const storedOrder = sessionStorage.getItem(SESSION_ORDER_KEY);
        const storedIndex = sessionStorage.getItem(SESSION_INDEX_KEY);
        const orderedIds: number[] = storedOrder ? JSON.parse(storedOrder) : [];
        const baseQuestions =
          orderedIds.length > 0
            ? orderedIds.map((id) => QUESTION_POOL.find((q) => q.id === id)!).filter(Boolean)
            : shuffleArray(QUESTION_POOL);
        setQuestions(baseQuestions.map(shuffleOptions));
        setQIndex(storedIndex ? parseInt(storedIndex, 10) : 0);
        setPts(parseInt(sessionStorage.getItem(SESSION_PTS_KEY) ?? "0", 10));
        setCorrectCount(parseInt(sessionStorage.getItem(SESSION_CORRECT_KEY) ?? "0", 10));
        setWrongCount(parseInt(sessionStorage.getItem(SESSION_WRONG_KEY) ?? "0", 10));
        setTimeLeft(storedTime);
        setPhase("playing");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_ORDER_KEY);
    sessionStorage.removeItem(SESSION_INDEX_KEY);
    sessionStorage.removeItem(SESSION_TIME_KEY);
    sessionStorage.removeItem(SESSION_PTS_KEY);
    sessionStorage.removeItem(SESSION_CORRECT_KEY);
    sessionStorage.removeItem(SESSION_WRONG_KEY);
    sessionStorage.removeItem(DIFFICULTY_KEY);
    sessionStorage.removeItem(HQ_PAID_KEY);
  }

  useEffect(() => {
    if (phase === "done") {
      supabase.rpc("submit_game_result", {
        p_game_id: "hexo-quiz",
        p_score: pts,
        p_correct_answers: correctCount,
        p_total_questions: correctCount + wrongCount,
        p_duration_seconds: DIFFICULTY_CONFIG[difficulty].duration,
      }).then(() => refreshProfile());
      clearSession();
    }
  }, [phase]);

  // Countdown timer — only ticks when actively playing
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        sessionStorage.setItem(SESSION_TIME_KEY, next.toString());
        if (next <= 0) {
          clearInterval(id);
          setPhase("done");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Focus the Next button when feedback appears
  useEffect(() => {
    if (phase === "feedback") {
      nextBtnRef.current?.focus();
    }
  }, [phase]);

  function startGame() {
    const config = DIFFICULTY_CONFIG[difficulty];
    const shuffled = shuffleArray(QUESTION_POOL);
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(shuffled.map((q) => q.id)));
    sessionStorage.setItem(SESSION_INDEX_KEY, "0");
    sessionStorage.setItem(SESSION_TIME_KEY, config.duration.toString());
    sessionStorage.setItem(SESSION_PTS_KEY, "0");
    sessionStorage.setItem(SESSION_CORRECT_KEY, "0");
    sessionStorage.setItem(SESSION_WRONG_KEY, "0");
    setQuestions(shuffled.map(shuffleOptions));
    setQIndex(0);
    setTimeLeft(config.duration);
    setPts(0);
    setCorrectCount(0);
    setWrongCount(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setSelectedAt(null);
    setPhase("playing");
  }

  // Start 2s cooldown whenever a new question is shown
  useEffect(() => {
    if (phase !== "playing") return;
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    if (cooldownTickRef.current) clearInterval(cooldownTickRef.current);

    setCheckReady(false);
    setCooldownSecs(2);

    // Tick down the visible counter every second
    cooldownTickRef.current = setInterval(() => {
      setCooldownSecs((s) => {
        if (s <= 1) {
          clearInterval(cooldownTickRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // Enable the button after 2s
    cooldownRef.current = setTimeout(() => setCheckReady(true), 2000);

    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (cooldownTickRef.current) clearInterval(cooldownTickRef.current);
    };
  }, [phase, qIndex]);

  function handleSelect(option: string) {
    if (phase !== "playing") return;
    setSelectedAnswer(option);
    setSelectedAt(Date.now());
  }

  const handleCheck = useCallback(() => {
    if (!checkReady || !selectedAnswer || phase !== "playing" || !questions.length) return;
    const isCorrect = selectedAnswer === questions[qIndex].answer;

    if (isCorrect) {
      const newPts = pts + DIFFICULTY_CONFIG[difficulty].pts;
      const newCorrect = correctCount + 1;
      setPts(newPts);
      setCorrectCount(newCorrect);
      sessionStorage.setItem(SESSION_PTS_KEY, newPts.toString());
      sessionStorage.setItem(SESSION_CORRECT_KEY, newCorrect.toString());
      setFeedback("correct");
    } else {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      sessionStorage.setItem(SESSION_WRONG_KEY, newWrong.toString());
      setFeedback("wrong");
    }
    setPhase("feedback");
  }, [checkReady, selectedAnswer, phase, questions, qIndex, pts, correctCount, wrongCount, difficulty]);

  function handleSkip() {
    if (phase !== "playing") return;
    setSelectedAnswer(null);
    setSelectedAt(null);
    const next = (qIndex + 1) % questions.length;
    sessionStorage.setItem(SESSION_INDEX_KEY, next.toString());
    setQIndex(next);
  }

  // Keyboard shortcuts — placed after handleCheck to avoid TDZ
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        if (phase === "feedback") handleNext();
        else if (phase === "playing" && checkReady) handleCheck();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, questions.length, checkReady, handleCheck]);

  function handleNext() {
    const next = (qIndex + 1) % questions.length;
    sessionStorage.setItem(SESSION_INDEX_KEY, next.toString());
    setQIndex(next);
    setFeedback(null);
    setSelectedAnswer(null);
    setSelectedAt(null);
    setPhase("playing");
  }

  const timerColor =
    timeLeft > 20 ? "text-green-400" : timeLeft > 10 ? "text-yellow-400" : "text-red-400";

  const currentQ = questions[qIndex];
  const optionLabels = ["A", "B", "C", "D"];

  // ─── Ready screen ────────────────────────────────────────────────────────────
  if (phase === "ready") {
    const config = DIFFICULTY_CONFIG[difficulty];
    const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return (
      <main className="h-full flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">HexoQuiz</h1>
            <p className="text-white/50 text-sm">
              {diffLabel} · {config.duration}s · +{config.pts} pts per correct answer
            </p>
          </div>

          <div className="w-full rounded-xl border border-white/8 bg-white/3 p-5 text-left space-y-3">
            <p className="text-white/70 text-sm font-medium">How to play</p>
            <ul className="text-white/50 text-sm space-y-1.5 list-disc list-inside">
              <li>Read the question and pick the best answer from 4 options</li>
              <li>All options are real cybersecurity terms — choose carefully</li>
              <li>Each correct answer earns <span className="text-amber-400">+{config.pts} pts</span></li>
              <li>A 2-second cooldown prevents accidental submits on each question</li>
              <li>See an explanation with source after each answer</li>
              <li>Answer as many as you can before the timer runs out</li>
            </ul>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Start Quiz
          </Button>

          <button
            onClick={() => router.push("/home/games/hexo-quiz/difficulty")}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change difficulty
          </button>
        </div>
      </main>
    );
  }

  // ─── Playing screen ───────────────────────────────────────────────────────────
  if (phase === "playing" && currentQ) {
    return (
      <main className="h-full overflow-hidden flex flex-col px-4 py-6">
        <div className="w-full max-w-xl mx-auto flex flex-col h-full gap-4">
          {/* Header row */}
          <div className="shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-white/70 text-sm font-medium">HexoQuiz</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold">{pts} pts</span>
              </div>
              <div className={`text-sm font-bold tabular-nums ${timerColor}`}>
                {timeLeft}s
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="shrink-0 w-full h-1 rounded-full bg-white/8">
            <div
              className="h-1 rounded-full bg-purple-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / DIFFICULTY_CONFIG[difficulty].duration) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/8 bg-white/3 p-5">
            <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Options */}
          <div className="shrink-0 grid grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors group ${
                    isSelected
                      ? "border-purple-500/70 bg-purple-500/15"
                      : "border-white/8 bg-white/3 hover:bg-white/6 hover:border-purple-500/40"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs font-semibold transition-colors ${
                      isSelected
                        ? "border-purple-400/70 bg-purple-500/20 text-purple-300"
                        : "border-white/15 bg-white/5 text-white/50 group-hover:border-purple-500/60 group-hover:text-purple-300"
                    }`}>
                      {optionLabels[idx]}
                    </span>
                    <span className={`text-sm leading-relaxed ${isSelected ? "text-white" : "text-white/80"}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex gap-3">
            <Button
              onClick={handleCheck}
              disabled={!selectedAnswer || !checkReady}
              className="flex-1 h-14 text-base bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!checkReady
                ? <span className="tabular-nums text-xl font-bold">{cooldownSecs}</span>
                : <>Check <span className="ml-1.5 text-white/40 text-xs font-normal">↵</span></>
              }
            </Button>
            <Button
              onClick={handleSkip}
              className="h-14 px-7 text-base border border-white/10 bg-transparent text-white/45 hover:bg-white/5 hover:text-white/70 rounded-xl"
            >
              Skip
            </Button>
          </div>

          {/* Score summary */}
          <div className="shrink-0 flex items-center gap-4 text-sm text-white/30">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400/60" />
              <span>{correctCount} correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400/60" />
              <span>{wrongCount} wrong</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Feedback screen ──────────────────────────────────────────────────────────
  if (phase === "feedback" && currentQ) {
    const isCorrect = feedback === "correct";
    return (
      <main className="h-full overflow-hidden flex flex-col px-4 py-6">
        <div className="w-full max-w-xl mx-auto flex flex-col h-full gap-4 min-h-0">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-white/70 text-sm font-medium">HexoQuiz</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold">{pts} pts</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs font-semibold text-yellow-400 tabular-nums">
                  {timeLeft}s · Paused
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">

          {/* Question recap */}
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="text-white/40 text-xs mb-2">Question</p>
            <p className="text-white/80 text-sm leading-relaxed">{currentQ.question}</p>
          </div>

          {/* Options recap with highlighting */}
          <div className="grid grid-cols-1 gap-2">
            {currentQ.options.map((option, idx) => {
              const isAnswer = option === currentQ.answer;
              const isSelected = option === selectedAnswer;
              let cls =
                "w-full text-left rounded-xl border px-4 py-3 transition-none pointer-events-none";
              if (isAnswer) {
                cls += " border-green-500/40 bg-green-500/8";
              } else if (isSelected && !isAnswer) {
                cls += " border-red-500/40 bg-red-500/8";
              } else {
                cls += " border-white/6 bg-white/2 opacity-50";
              }
              return (
                <div key={idx} className={cls}>
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs font-semibold transition-none ${
                        isAnswer
                          ? "border-green-500/50 text-green-400"
                          : isSelected
                          ? "border-red-500/50 text-red-400"
                          : "border-white/10 text-white/30"
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        isAnswer ? "text-green-300" : isSelected ? "text-red-300" : "text-white/40"
                      }`}
                    >
                      {option}
                    </span>
                    {isAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 ml-auto mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-2">
            <p className="text-white/40 text-xs font-medium">Explanation</p>
            <p className="text-white/70 text-sm leading-relaxed">{currentQ.explanation}</p>
            <p className="text-white/30 text-xs">
              Source: <span className="text-purple-400/70">{currentQ.source}</span>
            </p>
          </div>

          </div>{/* end scrollable content */}

          {/* Next button — pinned at bottom */}
          <Button
            ref={nextBtnRef}
            onClick={handleNext}
            className="shrink-0 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Next Question
            <span className="ml-2 text-white/40 text-xs font-normal">↵ Enter</span>
          </Button>
        </div>
      </main>
    );
  }

  // ─── Done screen ──────────────────────────────────────────────────────────────
  if (phase === "done") {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <main className="h-full flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Time&apos;s Up!</h1>
            <p className="text-white/40 text-sm">Here&apos;s how you did on HexoQuiz</p>
          </div>

          {/* Featured points */}
          <div className="w-full rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5 text-center">
            <p className="text-4xl font-bold text-amber-400">{pts}</p>
            <p className="mt-1 text-sm text-white/40">Points earned</p>
          </div>

          {/* Breakdown */}
          <div className="w-full grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 flex flex-col items-center gap-1">
              <p className="text-2xl font-bold text-emerald-400">{correctCount}</p>
              <p className="text-white/40 text-xs">Correct</p>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 flex flex-col items-center gap-1">
              <p className="text-2xl font-bold text-red-400">{wrongCount}</p>
              <p className="text-white/40 text-xs">Wrong</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 flex flex-col items-center gap-1">
              <p className="text-2xl font-bold text-white">{accuracy}%</p>
              <p className="text-white/40 text-xs">Accuracy</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => router.push("/home")}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => router.push("/home/leaderboard")}
              className="w-full border border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white font-medium py-3 rounded-xl transition-colors"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
