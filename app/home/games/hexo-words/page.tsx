"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/supabaseClient";
import { useUser } from "@/context/user-context";

const GAME_DURATION = 60;
const PTS_PER_CORRECT = 10;


interface Question {
  id: number;
  answer: string;
  scrambled: string;
  hint: string;
  explanation: string;
  source: string;
}

const QUESTION_POOL: Question[] = [
  {
    id: 1,
    answer: "PASSWORD",
    scrambled: "DROWSSAP",
    hint: "Your secret key to access an account",
    explanation: "A password is a memorized secret used to authenticate a user. Per NIST SP 800-63B, passwords should be at least 8 characters and users should never be forced to reuse them. Reusing the same password across multiple sites is a primary driver of credential stuffing attacks.",
    source: "NIST SP 800-63B",
  },
  {
    id: 2,
    answer: "FIREWALL",
    scrambled: "LLAWERIF",
    hint: "A barrier that filters incoming network traffic",
    explanation: "Per SANS Institute, a firewall is a logical or physical discontinuity in a network to prevent unauthorized access to data or resources. It examines traffic against configured rules, blocking what doesn't match. Personal firewalls protect individual devices; enterprise firewalls protect entire networks.",
    source: "SANS Institute",
  },
  {
    id: 3,
    answer: "PHISHING",
    scrambled: "GNIHSIHP",
    hint: "A scam that tricks you into revealing personal data",
    explanation: "Per SANS Institute, phishing is the use of emails that appear to originate from a trusted source to trick a user into entering valid credentials at a fake website. Look for mismatched URLs, urgent language, and unexpected requests. Always verify sender identity before clicking any links.",
    source: "SANS Institute",
  },
  {
    id: 4,
    answer: "MALWARE",
    scrambled: "ERAWLAM",
    hint: "Harmful software designed to damage systems",
    explanation: "Per SANS Institute, malware is a generic term for a number of different types of malicious code, including viruses, worms, trojans, ransomware, and spyware. It is typically delivered via email attachments, malicious downloads, or compromised websites. Antivirus software and user awareness are the primary defenses.",
    source: "SANS Institute",
  },
  {
    id: 5,
    answer: "ENCRYPTION",
    scrambled: "NOITPYRCNE",
    hint: "Converting data into a secret, unreadable code",
    explanation: "Per SANS Institute, encryption is the cryptographic transformation of data (plaintext) into a form (ciphertext) that conceals its original meaning. Only the holder of the correct key can decrypt it. HTTPS uses encryption to protect data in transit; encrypted storage protects data at rest.",
    source: "SANS Institute",
  },
  {
    id: 6,
    answer: "HACKER",
    scrambled: "REKCAH",
    hint: "Someone who exploits weaknesses in computer systems",
    explanation: "Per NIST CSRC, a hacker is a person who gains unauthorized access to a computer system. White-hat hackers do this legally to improve security; black-hat hackers act maliciously for personal gain. Ethical hacking (penetration testing) is a formal, authorized practice used to find vulnerabilities before attackers do.",
    source: "NIST CSRC",
  },
  {
    id: 7,
    answer: "VIRUS",
    scrambled: "SURIV",
    hint: "Self-replicating malicious code that spreads between files",
    explanation: "Per SANS Institute, a virus is a hidden, self-replicating section of software, usually malicious, that propagates by inserting a copy of itself into another program. A virus cannot run by itself — it requires its host program to be executed to activate. Antivirus software detects and removes known virus signatures.",
    source: "SANS Institute",
  },
  {
    id: 8,
    answer: "TROJAN",
    scrambled: "NAJORT",
    hint: "Malware that disguises itself as legitimate software",
    explanation: "Per SANS Institute, a Trojan horse is a computer program that appears to have a useful function but also has a hidden and potentially malicious function that evades security mechanisms. Unlike viruses, Trojans do not self-replicate — they rely on users installing them voluntarily.",
    source: "SANS Institute",
  },
  {
    id: 9,
    answer: "BACKUP",
    scrambled: "PUKCAB",
    hint: "A copy of data stored for recovery purposes",
    explanation: "Per NIST SP 800-34, a backup is a copy of files and programs made to facilitate recovery if the originals are lost or damaged. The 3-2-1 rule recommends 3 copies on 2 different media types with 1 stored offsite or in the cloud. Backups are the most reliable defense against ransomware data loss.",
    source: "NIST SP 800-34",
  },
  {
    id: 10,
    answer: "SPYWARE",
    scrambled: "ERAWYPS",
    hint: "Software that secretly monitors your activity",
    explanation: "Per NIST SP 800-83, spyware is a type of malware that covertly collects user information and sends it to a third party without the user's knowledge. It often bundles with free software and can capture credentials, browsing habits, and financial data. It is a leading cause of identity theft.",
    source: "NIST SP 800-83",
  },
  {
    id: 11,
    answer: "NETWORK",
    scrambled: "KROWTEN",
    hint: "A group of interconnected computers sharing resources",
    explanation: "Per SANS Institute, a computer network is a collection of host computers together with the sub-network through which they can exchange data. Every connected device is a potential entry point for attackers. Network segmentation and access controls limit the blast radius of a breach.",
    source: "SANS Institute",
  },
  {
    id: 12,
    answer: "RANSOMWARE",
    scrambled: "ERAWMOSNAR",
    hint: "Locks your files and demands payment to unlock them",
    explanation: "Per SANS Institute, ransomware is a type of malware that is a form of extortion — it encrypts a victim's hard drive, denying access to files until a ransom is paid. Paying the ransom does not guarantee file recovery. Offline backups and patched systems are the most effective defenses.",
    source: "SANS Institute",
  },
  {
    id: 13,
    answer: "ANTIVIRUS",
    scrambled: "SURIVITNA",
    hint: "Software that detects and removes malicious programs",
    explanation: "Per NIST SP 800-83, antivirus software detects, prevents, and removes malware by comparing files against a database of known malicious signatures and using heuristic analysis. Regular definition updates are critical because new threats emerge daily. It is a foundational layer of endpoint security.",
    source: "NIST SP 800-83",
  },
  {
    id: 14,
    answer: "BREACH",
    scrambled: "HCAERB",
    hint: "An unauthorized access or exposure of sensitive data",
    explanation: "Per SANS Institute, a data breach is a security incident in which sensitive, protected, or confidential information is accessed, stolen, or disclosed without authorization. Many jurisdictions legally require organizations to notify affected individuals within a set timeframe after discovery.",
    source: "SANS Institute",
  },
  {
    id: 15,
    answer: "KEYLOGGER",
    scrambled: "REGGOLYEK",
    hint: "Silently records every keystroke you type",
    explanation: "Per NIST SP 800-83, a keylogger is a type of monitoring software or hardware that records keystrokes and transmits them to an attacker. Hardware keyloggers plug between the keyboard and computer; software keyloggers run invisibly as background processes. Both can expose passwords and sensitive communications.",
    source: "NIST SP 800-83",
  },
  {
    id: 16,
    answer: "BOTNET",
    scrambled: "TENTOB",
    hint: "A network of infected computers controlled by an attacker",
    explanation: "Per SANS Institute, a botnet is a large number of compromised computers used to send spam or viruses, or flood a network with messages as a denial-of-service attack. The attacker (botmaster) controls the bots via command-and-control servers, often without device owners' knowledge.",
    source: "SANS Institute",
  },
  {
    id: 17,
    answer: "COOKIE",
    scrambled: "EIKOOC",
    hint: "Small data stored by websites to track your browsing session",
    explanation: "Per SANS Institute, a cookie is data exchanged between an HTTP server and a browser to store state information on the client side and retrieve it later for server use. Session cookies expire when the browser closes; persistent cookies remain longer. Stolen session cookies can be used to hijack active authenticated sessions.",
    source: "SANS Institute",
  },
  {
    id: 18,
    answer: "EXPLOIT",
    scrambled: "TIOLPXE",
    hint: "Code that takes advantage of a software vulnerability",
    explanation: "Per NIST CSRC, an exploit is a technique that takes advantage of a vulnerability or security flaw in software or hardware to cause unintended behavior. Zero-day exploits target vulnerabilities unknown to the vendor. Exploits are commonly used to install malware or gain unauthorized access to systems.",
    source: "NIST CSRC",
  },
  {
    id: 19,
    answer: "HONEYPOT",
    scrambled: "TOPYNOH",
    hint: "A decoy system set up to lure and observe attackers",
    explanation: "Per SANS Institute, a honeypot simulates one or more network services on designated ports so that attackers assume they are exploiting vulnerable services. It logs attacker activity and keystrokes, providing early warning of attacks and valuable threat intelligence without risking real systems.",
    source: "SANS Institute",
  },
  {
    id: 20,
    answer: "INJECTION",
    scrambled: "NOITCEJNI",
    hint: "Inserting malicious code into a query or input field",
    explanation: "Per SANS Institute, SQL injection is a type of input validation attack where SQL code is inserted into application queries to manipulate the database. It is one of the OWASP Top 10 most critical web application security risks. Parameterized queries and input validation are the primary defenses.",
    source: "SANS Institute / OWASP",
  },
  {
    id: 21,
    answer: "PATCH",
    scrambled: "HCTAP",
    hint: "An update released to fix a known software security flaw",
    explanation: "Per SANS Institute, a patch is a small update released by a software manufacturer to fix bugs in existing programs. Per CISA guidance, timely patching of known exploited vulnerabilities is one of the most impactful security actions an organization can take to reduce breach risk.",
    source: "SANS Institute / CISA",
  },
  {
    id: 22,
    answer: "ROOTKIT",
    scrambled: "TIKROOT",
    hint: "Malware that hides deep in the OS to maintain stealthy access",
    explanation: "Per SANS Institute, a rootkit is a collection of tools that a hacker uses to mask intrusion and obtain administrator-level access to a computer or network. Rootkits hide files, processes, and network connections from normal detection tools. Removal often requires booting from a clean external drive.",
    source: "SANS Institute",
  },
  {
    id: 23,
    answer: "SANDBOX",
    scrambled: "XOBDNAS",
    hint: "An isolated environment to safely analyze suspicious code",
    explanation: "Per NIST SP 800-177, a sandbox is an isolated execution environment that restricts access to real system resources. Security researchers use sandboxes to safely run and analyze malware samples. Modern browsers and operating systems use sandboxing to contain the damage from malicious web content.",
    source: "NIST SP 800-177",
  },
  {
    id: 24,
    answer: "SPOOFING",
    scrambled: "GNIFOOPS",
    hint: "Faking an identity to deceive systems or users",
    explanation: "Per SANS Institute, spoofing is an attempt by an unauthorized entity to gain access to a system by posing as an authorized user. Email spoofing fakes the sender address; IP spoofing forges source IP addresses. It is a common component of phishing and man-in-the-middle attacks.",
    source: "SANS Institute",
  },
  {
    id: 25,
    answer: "THREAT",
    scrambled: "TAERHT",
    hint: "A potential danger or risk to information security",
    explanation: "Per SANS Institute, a threat is a potential for violation of security — a circumstance, capability, action, or event that could breach security and cause harm. Threats can be intentional (attackers), accidental (human error), or environmental (natural disasters). Risk assessments evaluate the likelihood and impact of each threat.",
    source: "SANS Institute",
  },
  {
    id: 26,
    answer: "TOKEN",
    scrambled: "NEKOT",
    hint: "A digital credential used for authentication",
    explanation: "Per NIST SP 800-63B, an authenticator token generates or contains authentication credentials that prove identity. Hardware tokens produce time-based one-time passwords (TOTP); software tokens run as apps. If a token is stolen, an attacker can impersonate the user until it is revoked or expires.",
    source: "NIST SP 800-63B",
  },
  {
    id: 27,
    answer: "ADWARE",
    scrambled: "ERAWDA",
    hint: "Software that displays unwanted advertisements on your device",
    explanation: "Per NIST SP 800-83, adware is a type of software that automatically displays or downloads advertising material without explicit user consent. Aggressive adware tracks browsing habits and may install additional unwanted programs. It is frequently bundled with free software downloaded from the internet.",
    source: "NIST SP 800-83",
  },
  {
    id: 28,
    answer: "BIOMETRIC",
    scrambled: "CIRTEMOIB",
    hint: "Authentication using physical traits such as fingerprints",
    explanation: "Per SANS Institute, biometrics use physical characteristics of users to determine access. Per NIST SP 800-63B, biometrics should be used as part of multi-factor authentication rather than as a standalone credential, since biometric data cannot be changed if it is compromised.",
    source: "SANS Institute / NIST SP 800-63B",
  },
  {
    id: 29,
    answer: "CREDENTIAL",
    scrambled: "LAITNEDERC",
    hint: "A username and password pair used to log into a system",
    explanation: "Per NIST SP 800-63B, a credential is an object or data structure that authoritatively binds an identity to an authenticator. Username and password pairs are the most common form. Credential stuffing attacks automate the use of leaked credential pairs from one breached site against many others.",
    source: "NIST SP 800-63B",
  },
  {
    id: 30,
    answer: "FORENSICS",
    scrambled: "SCISNEROF",
    hint: "Digital investigation of evidence after a security incident",
    explanation: "Per NIST SP 800-86, digital forensics involves the collection, preservation, examination, and analysis of digital evidence following a security incident. Maintaining a proper chain of custody ensures evidence integrity and legal admissibility. Investigators examine logs, memory dumps, and disk images to reconstruct events.",
    source: "NIST SP 800-86",
  },
  {
    id: 31,
    answer: "GATEWAY",
    scrambled: "YAWETAG",
    hint: "A node that connects and controls traffic between two networks",
    explanation: "Per SANS Institute, a gateway is a network point that acts as an entrance to another network. In security, gateways enforce access policies, filter malicious traffic, and log connections between network segments. Your home router acts as a gateway between your local network and the internet.",
    source: "SANS Institute",
  },
  {
    id: 32,
    answer: "INCIDENT",
    scrambled: "TNEDICNI",
    hint: "A security event that causes or could cause harm",
    explanation: "Per SANS Institute, an incident is an adverse network event in an information system or the threat of such an event. Per NIST SP 800-61, incident response follows six phases: Preparation, Detection, Containment, Eradication, Recovery, and Lessons Learned.",
    source: "SANS Institute / NIST SP 800-61",
  },
  {
    id: 33,
    answer: "PENTEST",
    scrambled: "TSETNEP",
    hint: "Authorized simulation of an attack to find security weaknesses",
    explanation: "Per SANS Institute, penetration testing is used to test the external perimeter security of a network or facility by simulating real-world attacks under a formal authorization agreement. The goal is to find vulnerabilities before real attackers do. Findings drive prioritized security remediation.",
    source: "SANS Institute",
  },
  {
    id: 34,
    answer: "PHARMING",
    scrambled: "GNIMRAHP",
    hint: "Silently redirecting users to fake malicious websites",
    explanation: "Per SANS Institute, pharming is a sophisticated man-in-the-middle attack where a user's session is redirected to a masquerading website by corrupting a DNS server and pointing the URL to the fake site's IP. Unlike phishing, no malicious link click is required. HTTPS and DNSSEC help detect and prevent it.",
    source: "SANS Institute",
  },
  {
    id: 35,
    answer: "PLAINTEXT",
    scrambled: "TXETNIALP",
    hint: "Data that is readable and has not been encrypted",
    explanation: "Per SANS Institute, plaintext is ordinary readable text before being encrypted into ciphertext or after being decrypted. Storing passwords or sensitive data in plaintext is a critical security error — a database breach immediately exposes all credentials without any additional effort by the attacker.",
    source: "SANS Institute",
  },
  {
    id: 36,
    answer: "PROXY",
    scrambled: "YXORP",
    hint: "A server acting as an intermediary between you and the internet",
    explanation: "Per SANS Institute, a proxy server acts as an intermediary between a workstation user and the internet, enabling security enforcement, administrative control, and caching. Forward proxies provide anonymity and bypass restrictions; reverse proxies protect back-end servers. Security proxies inspect traffic for threats.",
    source: "SANS Institute",
  },
  {
    id: 37,
    answer: "TUNNELING",
    scrambled: "GNILENNUT",
    hint: "Encapsulating one network protocol inside another",
    explanation: "Per SANS Institute, tunneling creates a communication channel by encapsulating one protocol's data packets inside another protocol. VPNs use tunneling to encrypt traffic across the internet. Attackers also abuse tunneling to hide command-and-control traffic inside legitimate protocols such as DNS or HTTPS.",
    source: "SANS Institute",
  },
  {
    id: 38,
    answer: "DARKWEB",
    scrambled: "BEWKRAD",
    hint: "Hidden internet layer unreachable by standard browsers",
    explanation: "Per NIST CSRC, the dark web refers to internet content only accessible through special overlay networks such as Tor that anonymize users by routing traffic through multiple encrypted nodes. While it has legitimate privacy uses, it also hosts markets for stolen credentials, malware-as-a-service, and other illicit goods.",
    source: "NIST CSRC",
  },
  {
    id: 39,
    answer: "PAYLOAD",
    scrambled: "DAOLYAP",
    hint: "The malicious component delivered by an attack or malware",
    explanation: "Per SANS Institute, payload is the actual application data a packet contains. In a security context, the malicious payload is the component that carries out the attack — encrypting files, opening a backdoor, or stealing data. The delivery mechanism only transports it; the payload causes the harm.",
    source: "SANS Institute",
  },
  {
    id: 40,
    answer: "PROTOCOL",
    scrambled: "LOCOTORP",
    hint: "A set of rules governing data communication between devices",
    explanation: "Per SANS Institute, a protocol is a formal specification for communicating — the special set of rules that endpoints in a telecommunications connection use when they communicate. HTTPS secures web traffic; SSH secures remote access. Attackers exploit weak protocol implementations to intercept or manipulate communications.",
    source: "SANS Institute",
  },
  {
    id: 41,
    answer: "CYBERCRIME",
    scrambled: "EMIRCREBYC",
    hint: "Criminal activity carried out using computers or the internet",
    explanation: "Per NIST CSRC, cybercrime encompasses illegal acts that use computers or the internet as instruments. Examples include fraud, identity theft, ransomware attacks, and unauthorized system access. International frameworks such as the Budapest Convention enable cross-border law enforcement cooperation against cybercrime.",
    source: "NIST CSRC",
  },
  {
    id: 42,
    answer: "HASHING",
    scrambled: "GNIHSAH",
    hint: "Converting data into a fixed-length digest for verification",
    explanation: "Per SANS Institute, cryptographic hash functions generate a one-way checksum for data that cannot be trivially reversed. Per NIST SP 800-107, passwords must be stored as salted hashes using algorithms like SHA-3 or bcrypt. Adding a unique random salt to each password before hashing defeats rainbow table attacks.",
    source: "SANS Institute / NIST SP 800-107",
  },
  {
    id: 43,
    answer: "IDENTITY",
    scrambled: "YTITNEDI",
    hint: "Your digital representation used for account verification",
    explanation: "Per SANS Institute, identity is who someone is — the name by which something is known. Per NIST SP 800-63, digital identity is the online representation of a person used to access digital services. Identity theft occurs when an attacker steals personal details to impersonate a victim.",
    source: "SANS Institute / NIST SP 800-63",
  },
  {
    id: 44,
    answer: "MALICIOUS",
    scrambled: "SUOICILAM",
    hint: "Designed or intended to cause harm to systems or data",
    explanation: "Per SANS Institute, malicious code is software that appears to perform a useful or desirable function but actually gains unauthorized access to system resources or tricks a user into executing harmful logic. Distinguishing malicious from accidental actions is central to incident investigation and response.",
    source: "SANS Institute",
  },
  {
    id: 45,
    answer: "PENETRATION",
    scrambled: "NOITARTENEP",
    hint: "Authorized attempt to break into a system to find weaknesses",
    explanation: "Per SANS Institute, penetration is the act of gaining logical access to sensitive data by circumventing a system's protections. Authorized penetration tests help organizations discover these weaknesses under a formal agreement before real attackers do. Scope and rules of engagement must be documented in advance.",
    source: "SANS Institute",
  },
  {
    id: 46,
    answer: "QUARANTINE",
    scrambled: "ENITNARAUQ",
    hint: "Isolating a suspicious file to prevent it from spreading",
    explanation: "Per NIST SP 800-83, quarantine moves a suspicious or detected malicious file to an isolated location where it cannot execute or spread, allowing administrators time to analyze it safely. Items may be restored if they are confirmed false positives. It is a standard automated response action in antivirus and EDR tools.",
    source: "NIST SP 800-83",
  },
  {
    id: 47,
    answer: "SECURITY",
    scrambled: "YTIRUCES",
    hint: "The practice of protecting systems from unauthorized access",
    explanation: "Per NIST FIPS 199, information security encompasses the protection of information and systems from unauthorized access, use, disclosure, disruption, modification, or destruction. The three core properties are confidentiality, integrity, and availability — known as the CIA triad.",
    source: "NIST FIPS 199",
  },
  {
    id: 48,
    answer: "SIGNATURE",
    scrambled: "ERUTANGIS",
    hint: "A unique pattern used to identify malware or verify files",
    explanation: "Per SANS Institute, a signature is a distinct pattern in network traffic or a file that can be identified to a specific tool or exploit. Antivirus tools compare files against signature databases to detect known malware. Digital signatures use asymmetric cryptography to verify sender identity and that data has not been tampered with.",
    source: "SANS Institute",
  },
  {
    id: 49,
    answer: "INTEGRITY",
    scrambled: "YTIRGETNI",
    hint: "Ensuring data has not been altered or tampered with",
    explanation: "Per SANS Institute, integrity is the need to ensure that information has not been changed accidentally or deliberately, and that it is accurate and complete. It is one of the three core properties of the CIA triad. Checksums, hashes, and digital signatures are used to verify that data remains unmodified.",
    source: "SANS Institute",
  },
  {
    id: 50,
    answer: "EXPOSURE",
    scrambled: "ERUSOPXE",
    hint: "When sensitive data is accidentally made accessible to others",
    explanation: "Per SANS Institute, exposure is a threat action whereby sensitive data is directly released to an unauthorized entity. Common causes include misconfigured cloud storage, verbose error messages, and accidentally committing secrets to public code repositories. Regular security audits and secret scanning tools detect these issues proactively.",
    source: "SANS Institute",
  },
  {
    id: 51,
    answer: "BOTMASTER",
    scrambled: "RETSAMTOB",
    hint: "A criminal who remotely controls a network of infected computers",
    explanation: "Per SANS Institute, a botmaster controls a botnet by issuing commands via command-and-control (C2) servers to thousands of compromised machines simultaneously. Botnets are used for spam, DDoS attacks, cryptocurrency mining, and credential theft. Law enforcement efforts focus on dismantling C2 infrastructure to neutralize botnets.",
    source: "SANS Institute",
  },
  {
    id: 52,
    answer: "NONCE",
    scrambled: "ECNON",
    hint: "A one-time random value used in cryptography to prevent replay attacks",
    explanation: "Per NIST SP 800-90A, a nonce is a value used in security protocols that must never be reused for the same key or purpose. Including a nonce in authentication challenges prevents replay attacks, where an attacker records and retransmits a valid credential exchange to gain unauthorized access.",
    source: "NIST SP 800-90A",
  },
  {
    id: 53,
    answer: "DIGITAL",
    scrambled: "LATIGID",
    hint: "Relating to systems or data stored in a computer-based format",
    explanation: "Per NIST CSRC, digital systems store and process information as discrete binary values. Digital assets — credentials, intellectual property, financial records — require protection through access controls and encryption. The broad shift from physical to digital records has dramatically expanded the attack surface organizations must defend.",
    source: "NIST CSRC",
  },
  {
    id: 54,
    answer: "CERTIFICATE",
    scrambled: "ETACIFITEC",
    hint: "A digital document that verifies the identity of a website or user",
    explanation: "Per SANS Institute, a digital certificate is an electronic credential that establishes your identity when doing business on the web. It is issued by a trusted Certificate Authority (CA) and contains your public key and a digital signature from the CA. TLS certificates allow browsers to verify server identity and establish HTTPS connections.",
    source: "SANS Institute",
  },
  {
    id: 55,
    answer: "ACCESS",
    scrambled: "SSECCA",
    hint: "The ability or permission to use a computer system or data",
    explanation: "Per SANS Institute, access control ensures that resources are only granted to users who are entitled to them. Per CISA guidance, enforcing strong access controls — including multi-factor authentication — is among the most impactful security actions an organization can take. The principle of least privilege limits permissions to the minimum necessary.",
    source: "SANS Institute / CISA",
  },
  {
    id: 56,
    answer: "CIPHER",
    scrambled: "REHPIC",
    hint: "An algorithm used to encrypt and decrypt data",
    explanation: "Per SANS Institute, a cipher is a cryptographic algorithm for encryption and decryption. AES is the current NIST-recommended symmetric cipher (FIPS 197); RSA and ECC are common asymmetric algorithms. Outdated ciphers such as DES have been deprecated by NIST and should not be used in new systems.",
    source: "SANS Institute / NIST FIPS 197",
  },
  {
    id: 57,
    answer: "WORM",
    scrambled: "MROW",
    hint: "Self-spreading malware that replicates without needing a host file",
    explanation: "Per SANS Institute, a worm is a computer program that can run independently and propagate a complete working version of itself onto other hosts on a network, potentially consuming resources destructively. Unlike viruses, worms spread without user interaction by automatically exploiting network vulnerabilities.",
    source: "SANS Institute",
  },
  {
    id: 58,
    answer: "FRAUD",
    scrambled: "DUARF",
    hint: "Deceptive actions used to gain unauthorized access or financial gain",
    explanation: "Per NIST CSRC, cyber fraud involves deliberate deception using digital means to steal money, data, or access. Common forms include business email compromise (BEC), credit card fraud, and identity theft. Per CISA, multi-factor authentication and transaction anomaly detection are key defenses against financial cyber fraud.",
    source: "NIST CSRC / CISA",
  },
  {
    id: 59,
    answer: "PHREAKING",
    scrambled: "GNIKAERHP",
    hint: "Manipulating phone networks to make unauthorized calls",
    explanation: "Per NIST historical documentation, phreaking is the practice of exploiting telephone network signaling to make unauthorized calls. It emerged in the 1960s with analog switching systems manipulated using audio tones. Phreaking culture is historically significant as a direct precursor to modern computer hacking communities.",
    source: "NIST CSRC",
  },
  {
    id: 60,
    answer: "BRUTEFORCE",
    scrambled: "ECROFETURB",
    hint: "An attack that tries all possible combinations to crack a password",
    explanation: "Per SANS Institute, a brute-force attack is a cryptanalysis technique involving an exhaustive procedure that tries all possibilities one-by-one until the correct value is found. Defenses include account lockout policies, CAPTCHAs, rate limiting, and long passphrases that make exhaustive search computationally infeasible.",
    source: "SANS Institute",
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

function scrambleWord(word: string): string {
  const letters = word.split("");
  let shuffled: string[];
  let attempts = 0;
  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (shuffled.join("") === word && attempts < 20);
  return shuffled.join("");
}

const SESSION_KEY = "hexora:jl:startTime";
const SESSION_ORDER_KEY = "hexora:jl:order";
const SESSION_INDEX_KEY = "hexora:jl:index";
const SESSION_TIME_KEY = "hexora:jl:timeLeft";
const SESSION_PTS_KEY = "hexora:jl:pts";

const SESSION_CORRECT_KEY = "hexora:jl:correct";
const SESSION_WRONG_KEY = "hexora:jl:wrong";

type Phase = "ready" | "playing" | "feedback" | "done";

export default function JumbledLettersPage() {
  const router = useRouter();
  const { refreshProfile } = useUser();
  const [phase, setPhase] = useState<Phase>("ready");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [pts, setPts] = useState(0);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState("");
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const PAID_KEY = "hexora:paid:/home/games/hexo-words";

  // On mount: gate check + resume if refreshed mid-game
  useEffect(() => {
    const alreadyPlaying = sessionStorage.getItem(SESSION_KEY);
    const paid = sessionStorage.getItem(PAID_KEY);

    if (!alreadyPlaying && !paid) {
      // Not mid-game and didn't pay — redirect away
      router.replace("/home");
      return;
    }

    if (alreadyPlaying) {
      const storedTime = parseInt(sessionStorage.getItem(SESSION_TIME_KEY) ?? "0", 10);
      if (storedTime <= 0) {
        // Timer ran out
        setPts(parseInt(sessionStorage.getItem(SESSION_PTS_KEY) ?? "0", 10));
        setCorrectCount(parseInt(sessionStorage.getItem(SESSION_CORRECT_KEY) ?? "0", 10));
        setWrongCount(parseInt(sessionStorage.getItem(SESSION_WRONG_KEY) ?? "0", 10));
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_ORDER_KEY);
        sessionStorage.removeItem(SESSION_INDEX_KEY);
        sessionStorage.removeItem(SESSION_TIME_KEY);
        sessionStorage.removeItem(SESSION_PTS_KEY);
        sessionStorage.removeItem(SESSION_CORRECT_KEY);
        sessionStorage.removeItem(SESSION_WRONG_KEY);
        sessionStorage.removeItem(PAID_KEY);
        setPhase("done");
      } else {
        const storedOrder = sessionStorage.getItem(SESSION_ORDER_KEY);
        const storedIndex = sessionStorage.getItem(SESSION_INDEX_KEY);
        const orderedIds: number[] = storedOrder ? JSON.parse(storedOrder) : [];
        const restored =
          orderedIds.length > 0
            ? orderedIds.map((id) => QUESTION_POOL.find((q) => q.id === id)!).filter(Boolean)
            : shuffleArray(QUESTION_POOL);
        setQuestions(restored);
        setScrambledWords(restored.map((q) => scrambleWord(q.answer)));
        setQIndex(storedIndex ? parseInt(storedIndex, 10) : 0);
        setPts(parseInt(sessionStorage.getItem(SESSION_PTS_KEY) ?? "0", 10));
        setCorrectCount(parseInt(sessionStorage.getItem(SESSION_CORRECT_KEY) ?? "0", 10));
        setWrongCount(parseInt(sessionStorage.getItem(SESSION_WRONG_KEY) ?? "0", 10));
        // Restore timeLeft directly — unaffected by feedback pause durations
        setTimeLeft(storedTime);
        setPhase("playing");
      }
    }
    // If paid but not yet started, stay on ready screen — startGame() will consume the token
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear session and submit result when game ends
  useEffect(() => {
    if (phase === "done") {
      // pts/correctCount/wrongCount are committed in the same batch as setPhase("done")
      supabase.rpc("submit_game_result", {
        p_game_id: "hexo-words",
        p_score: pts,
        p_correct_answers: correctCount,
        p_total_questions: correctCount + wrongCount,
        p_duration_seconds: GAME_DURATION,
      }).then(() => refreshProfile());
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_ORDER_KEY);
      sessionStorage.removeItem(SESSION_INDEX_KEY);
      sessionStorage.removeItem(SESSION_TIME_KEY);
      sessionStorage.removeItem(SESSION_PTS_KEY);
      sessionStorage.removeItem(SESSION_CORRECT_KEY);
      sessionStorage.removeItem(SESSION_WRONG_KEY);
      sessionStorage.removeItem(PAID_KEY);
    }
  }, [phase]);

  // Countdown timer — only ticks when actively playing (paused during feedback)
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

  // Auto-focus input when returning to playing phase
  useEffect(() => {
    if (phase === "playing") {
      inputRef.current?.focus();
    }
  }, [phase, qIndex]);

  function startGame() {
    const shuffled = shuffleArray(QUESTION_POOL);
    // Consume the paid entry token
    sessionStorage.removeItem(PAID_KEY);
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(shuffled.map((q) => q.id)));
    sessionStorage.setItem(SESSION_INDEX_KEY, "0");
    sessionStorage.setItem(SESSION_TIME_KEY, GAME_DURATION.toString());
    sessionStorage.setItem(SESSION_PTS_KEY, "0");
    sessionStorage.setItem(SESSION_CORRECT_KEY, "0");
    sessionStorage.setItem(SESSION_WRONG_KEY, "0");
    setQuestions(shuffled);
    setScrambledWords(shuffled.map((q) => scrambleWord(q.answer)));
    setQIndex(0);
    setInput("");
    setTimeLeft(GAME_DURATION);
    setPts(0);
    setCorrectCount(0);
    setWrongCount(0);
    setFeedback(null);
    setWrongAnswer("");
    setPhase("playing");
  }

  function handleSubmit() {
    if (!questions.length || phase !== "playing") return;
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;

    const isCorrect = trimmed === questions[qIndex].answer;

    if (isCorrect) {
      const newPts = pts + PTS_PER_CORRECT;
      const newCorrect = correctCount + 1;
      setPts(newPts);
      setCorrectCount(newCorrect);
      sessionStorage.setItem(SESSION_PTS_KEY, newPts.toString());
      sessionStorage.setItem(SESSION_CORRECT_KEY, newCorrect.toString());
      setFeedback("correct");
    } else {
      const newWrong = wrongCount + 1;
      setWrongAnswer(questions[qIndex].answer);
      setWrongCount(newWrong);
      sessionStorage.setItem(SESSION_WRONG_KEY, newWrong.toString());
      setFeedback("wrong");
    }

    setInput("");
    setPhase("feedback");
  }

  function handleNext() {
    const next = (qIndex + 1) % questions.length;
    sessionStorage.setItem(SESSION_INDEX_KEY, next.toString());
    setQIndex(next);
    setFeedback(null);
    setWrongAnswer("");
    setPhase("playing");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (phase === "playing") handleSubmit();
      else if (phase === "feedback") handleNext();
    }
  }

  const currentQ = questions[qIndex];

  const timerColor =
    timeLeft > 30
      ? "text-emerald-400"
      : timeLeft > 15
        ? "text-amber-400"
        : "text-red-400";

  const timerBorder =
    timeLeft > 30
      ? "border-emerald-500/30 bg-emerald-500/8"
      : timeLeft > 15
        ? "border-amber-500/30 bg-amber-500/8"
        : "border-red-500/30 bg-red-500/8";

  // ── Ready screen ─────────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600">
              <Shuffle className="h-9 w-9 text-white" />
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-white">
            HexoWords
          </h1>
          <p className="mb-8 text-white/45">
            Unscramble cybersecurity terms before the clock hits zero. The more
            you get right, the more you earn!
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{GAME_DURATION}s</p>
              <p className="mt-0.5 text-xs text-white/40">Timer</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-300">
                +{PTS_PER_CORRECT} pts
              </p>
              <p className="mt-0.5 text-xs text-white/40">Per correct</p>
            </div>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-blue-600 py-6 text-base font-semibold text-white hover:bg-blue-500"
          >
            Start Game
          </Button>

          <button
            onClick={() => router.back()}
            className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/65"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────────
  if (phase === "done") {
    const accuracy =
      correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
        : 0;

    return (
      <main className="h-full flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Time&apos;s Up!</h1>
            <p className="text-white/40 text-sm">Here&apos;s how you did on HexoWords</p>
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
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

  // ── Feedback slide ────────────────────────────────────────────────────────────
  if (phase === "feedback") {
    const isCorrect = feedback === "correct";
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-start pt-16 px-6 pb-8">
      <div className="w-full max-w-2xl">
        {/* Top bar — timer paused indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className={cn("rounded-xl border px-4 py-2", timerBorder)}>
            <span className={cn("text-xl font-bold tabular-nums", timerColor)}>
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
              <span className="ml-2 text-sm font-normal text-white/30">paused</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 font-medium text-amber-400">
              <Zap className="h-3.5 w-3.5" />
              {pts} pts
            </span>

          </div>
        </div>

        {/* Feedback card */}
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            isCorrect
              ? "border-emerald-500/30 bg-emerald-500/6"
              : "border-red-500/30 bg-red-500/6",
          )}
        >
          <div className="mb-5 flex justify-center">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl",
                isCorrect ? "bg-emerald-500/15" : "bg-red-500/15",
              )}
            >
              {isCorrect ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
            </div>
          </div>

          <h2
            className={cn(
              "mb-1 text-2xl font-bold",
              isCorrect ? "text-emerald-400" : "text-red-400",
            )}
          >
            {isCorrect ? "Correct!" : "Wrong!"}
          </h2>

          {isCorrect ? (
            <p className="mb-3 text-white/50">
              You earned{" "}
              <span className="font-semibold text-amber-400">+{PTS_PER_CORRECT} pts</span>.
            </p>
          ) : (
            <p className="mb-3 text-white/50">
              The correct answer was{" "}
              <span className="font-semibold text-white">{wrongAnswer}</span>.
            </p>
          )}

          {/* Explanation */}
          <div className="mb-6 rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/30">Explanation</p>
            <p className="text-sm leading-relaxed text-white/60">
              {currentQ?.explanation}
            </p>
            <p className="mt-2 text-xs text-white/25">Source: {currentQ?.source}</p>
          </div>

          <Button
            onClick={handleNext}
            className={cn(
              "w-full py-5 text-sm font-semibold text-white",
              isCorrect ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500",
            )}
          >
            Next →
          </Button>
          <p className="mt-2 text-xs text-white/20">or press Enter</p>
        </div>

        {/* Progress row */}
        <div className="mt-4 flex items-center justify-between text-xs text-white/25">
          <span>{correctCount} correct · {wrongCount} wrong</span>
          <span>{correctCount + wrongCount} answered</span>
        </div>
      </div>
      </div>
    );
  }

  // ── Playing screen ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-start pt-16 px-6 pb-8">
    <div className="w-full max-w-2xl">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <div
          className={cn(
            "rounded-xl border px-4 py-2",
            timerBorder,
          )}
        >
          <span className={cn("text-xl font-bold tabular-nums", timerColor)}>
            {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
            {String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 font-medium text-amber-400">
            <Zap className="h-3.5 w-3.5" />
            {pts} pts
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-10">
        {/* Scrambled letter tiles */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {(scrambledWords[qIndex] ?? "").split("").map((letter, i) => (
            <div
              key={i}
              className="flex h-14 w-12 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-xl font-bold text-white"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Hint */}
        <p className="mb-6 text-center text-sm leading-relaxed text-white/45">
          {currentQ?.hint}
        </p>

        {/* Input row */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            autoComplete="off"
            className="border-white/10 bg-white/5 uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-white/25 focus-visible:border-blue-500/50 focus-visible:ring-0"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40"
          >
            Go
          </Button>
        </div>
      </div>

      {/* Progress row */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/25">
        <span>
          {correctCount} correct · {wrongCount} wrong
        </span>
        <span>{correctCount + wrongCount} answered</span>
      </div>
    </div>
    </div>
  );
}
