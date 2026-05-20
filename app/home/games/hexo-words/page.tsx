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

const DIFFICULTY_KEY = "hexora:hw:difficulty";
const HW_PAID_KEY    = "hexora:paid:/home/games/hexo-words";

const DIFFICULTY_CONFIG = {
  easy:         { duration: 120, pts: 10,  showHint: true  },
  intermediate: { duration: 90,  pts: 15,  showHint: true  },
  advanced:     { duration: 60,  pts: 40,  showHint: false },
} as const;

type Difficulty = keyof typeof DIFFICULTY_CONFIG;


interface Question {
  id: number;
  answer: string;
  scrambled: string;
  hint: string;
  explanation: string;
  source: string;
}

const ADVANCED_POOL: Question[] = [
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
  {
    id: 61,
    answer: "AUTHENTICATION",
    scrambled: "NOITACITNEHTUA",
    hint: "The process of verifying the identity of a user, device, or system",
    explanation: "Per NIST SP 800-63B, authentication is the process of establishing confidence in the identity of a user or system. The three authentication factors are: something you know (password), something you have (token), and something you are (biometric). Multi-factor authentication combines at least two, significantly raising the bar against account compromise.",
    source: "NIST SP 800-63B",
  },
  {
    id: 62,
    answer: "VULNERABILITY",
    scrambled: "YTILIBARENLUV",
    hint: "A weakness in a system that can be exploited to cause unauthorized harm",
    explanation: "Per NIST SP 800-30, a vulnerability is a weakness in a system, its procedures, or implementation that could be exploited by a threat. The Common Vulnerabilities and Exposures (CVE) system provides public identifiers for known vulnerabilities. Regular vulnerability scanning and timely patching are the primary defenses against exploitation.",
    source: "NIST SP 800-30",
  },
  {
    id: 63,
    answer: "MULTIFACTOR",
    scrambled: "ROTCAFLITUM",
    hint: "Using more than one independent credential type to verify identity",
    explanation: "Per NIST SP 800-63B, multi-factor authentication (MFA) requires users to present two or more independent authentication factors. MFA is one of the most effective controls against account compromise — it stops the vast majority of automated attacks even when passwords are stolen or leaked from another service.",
    source: "NIST SP 800-63B",
  },
  {
    id: 64,
    answer: "CRYPTOGRAPHY",
    scrambled: "YPHARGOTPYRC",
    hint: "The science of securing information using mathematical algorithms",
    explanation: "Per NIST SP 800-175B, cryptography provides information security through confidentiality, data integrity, authentication, and non-repudiation. Modern cryptography relies on computationally hard mathematical problems. Weak or improperly implemented cryptography — such as using deprecated algorithms or short key lengths — can be as dangerous as no encryption at all.",
    source: "NIST SP 800-175B",
  },
  {
    id: 65,
    answer: "ENUMERATION",
    scrambled: "NOITAREMEUN",
    hint: "Systematically listing all accounts, services, or resources discoverable on a system",
    explanation: "Per MITRE ATT&CK, enumeration is an active reconnaissance technique where an attacker queries systems to extract valid usernames, network shares, services, and machine information. Tools like Nmap perform network enumeration to map the attack surface. Limiting information disclosure through proper access controls reduces what attackers can enumerate.",
    source: "MITRE ATT&CK / SANS Institute",
  },
  {
    id: 66,
    answer: "STEGANOGRAPHY",
    scrambled: "YHPARGONAGTES",
    hint: "Hiding secret data inside ordinary-looking files such as images or audio",
    explanation: "Steganography conceals data within other non-secret carriers — hiding a message inside an image's pixel values. Unlike encryption which makes data unreadable, steganography hides its very existence. Attackers use steganography to exfiltrate data or embed command-and-control instructions inside innocent-looking media files to evade detection.",
    source: "NIST CSRC",
  },
  {
    id: 67,
    answer: "OBFUSCATION",
    scrambled: "NOITACSUBFO",
    hint: "Making malicious code or communications deliberately unclear to evade analysis",
    explanation: "Per MITRE ATT&CK, obfuscation is a defense evasion technique where attackers make malicious code, commands, or data intentionally difficult to analyze using Base64 encoding, XOR encryption, or junk code insertion. This helps malware bypass signature-based antivirus tools. Behavioral analysis and deobfuscation tools are required to examine obfuscated threats.",
    source: "MITRE ATT&CK",
  },
  {
    id: 68,
    answer: "IMPERSONATION",
    scrambled: "NOITANOSREPMI",
    hint: "Pretending to be a trusted person or entity to manipulate victims",
    explanation: "Per SANS Institute, impersonation is a social engineering attack where an attacker assumes a trusted identity — IT support, an executive, or a vendor — to manipulate victims into revealing information or granting access. Business email compromise (BEC) relies heavily on executive impersonation. Identity verification procedures help defend against impersonation.",
    source: "SANS Institute",
  },
  {
    id: 69,
    answer: "PERSISTENCE",
    scrambled: "ECNETSISREP",
    hint: "Techniques attackers use to maintain access across reboots and credential changes",
    explanation: "Per MITRE ATT&CK, persistence describes techniques adversaries use to maintain their foothold in compromised systems — startup scripts, scheduled tasks, registry run keys, and hidden user accounts. Detecting persistence mechanisms is a primary goal in incident response and threat hunting. Systems should be hardened against common persistence techniques.",
    source: "MITRE ATT&CK",
  },
  {
    id: 70,
    answer: "EXFILTRATION",
    scrambled: "NOITARTLIFXE",
    hint: "Unauthorized transfer of stolen data from inside a network to an attacker",
    explanation: "Per MITRE ATT&CK, exfiltration involves an adversary stealing data by transferring it to attacker-controlled infrastructure. Attackers disguise exfiltration inside normal-looking traffic — encrypted HTTPS, DNS tunneling, or cloud uploads — to avoid detection. Data Loss Prevention (DLP) tools, egress filtering, and network monitoring help detect and block exfiltration.",
    source: "MITRE ATT&CK",
  },
  {
    id: 71,
    answer: "RECONNAISSANCE",
    scrambled: "NAISSANCEONCER",
    hint: "The first attack phase where information about the target is gathered",
    explanation: "Per MITRE ATT&CK, reconnaissance is the information-gathering phase where attackers research their target — open ports, software versions, employee names, and organizational structure. It can be passive (OSINT, public records) or active (port scanning). Limiting publicly available information and monitoring for scanning activity reduces reconnaissance effectiveness.",
    source: "MITRE ATT&CK",
  },
  {
    id: 72,
    answer: "ZEROTRUST",
    scrambled: "TSURTOZER",
    hint: "A security model that trusts nothing by default — even inside the network",
    explanation: "Per NIST SP 800-207, Zero Trust assumes that a breach has occurred or will occur, and therefore grants no implicit trust to any device, user, or network segment. Every access request must be authenticated, authorized, and continuously validated. It replaces the outdated 'trust but verify' perimeter model with 'never trust, always verify'.",
    source: "NIST SP 800-207",
  },
  {
    id: 73,
    answer: "ESCALATION",
    scrambled: "NOITALASCE",
    hint: "Gaining higher system permissions than originally granted after compromising a system",
    explanation: "Per MITRE ATT&CK, privilege escalation describes techniques attackers use to gain higher-level permissions — from regular user to administrator, or from a workstation to domain controller. Exploiting software vulnerabilities, misconfigurations, and stored credentials are common vectors. Least privilege enforcement and timely patching limit escalation opportunities.",
    source: "MITRE ATT&CK",
  },
  {
    id: 74,
    answer: "COMPROMISE",
    scrambled: "ESIMORPMOC",
    hint: "When a system or account has been successfully breached by an attacker",
    explanation: "Per SANS Institute, a system compromise occurs when an unauthorized party gains access by exploiting a vulnerability, stolen credential, or misconfiguration. A compromised device may be used to attack other systems, exfiltrate data, or install persistent backdoors. Incident response procedures must be triggered immediately upon a confirmed compromise.",
    source: "SANS Institute",
  },
  {
    id: 75,
    answer: "ADVERSARY",
    scrambled: "YRASRAVED",
    hint: "A threat actor who actively seeks to exploit vulnerabilities in a target organization",
    explanation: "Per NIST SP 800-30, an adversary is a threat source — individual, group, or organization — that seeks to exploit vulnerabilities in information systems. Understanding adversary motivations (financial, espionage, disruption) helps defenders prioritize security investments. The MITRE ATT&CK framework documents the actual techniques real adversaries use.",
    source: "NIST SP 800-30 / MITRE ATT&CK",
  },
  {
    id: 76,
    answer: "HARDENING",
    scrambled: "GNIDENRAH",
    hint: "Reducing a system's attack surface by removing vulnerabilities and unnecessary features",
    explanation: "Per CIS Benchmarks and DISA STIGs, system hardening involves disabling unnecessary services, closing unused ports, removing default accounts, applying security patches, and configuring settings to industry security baselines. Hardening reduces the number of ways an attacker can gain initial access. Regular re-hardening is needed as systems change over time.",
    source: "CIS Benchmarks / SANS Institute",
  },
  {
    id: 77,
    answer: "VISHING",
    scrambled: "GNIHSIV",
    hint: "Voice-based phishing attack conducted over a phone call",
    explanation: "Per CISA, vishing (voice phishing) uses phone calls to trick victims into revealing credentials, financial information, or granting remote access. Attackers impersonate banks, government agencies, or IT support. Caller ID spoofing makes calls appear to come from legitimate numbers. Never provide sensitive information to unsolicited callers — always hang up and call back on a verified number.",
    source: "CISA",
  },
  {
    id: 78,
    answer: "SMISHING",
    scrambled: "GNIHSIMS",
    hint: "SMS-based phishing attack sent via text message",
    explanation: "Per CISA, smishing (SMS phishing) delivers malicious links or fraudulent requests via text message. Attackers impersonate delivery services, banks, or government agencies with urgent messages. Mobile users often click links more readily than on desktops. Legitimate organizations will never ask for credentials or payment details via unsolicited text messages.",
    source: "CISA",
  },
  {
    id: 79,
    answer: "WHALING",
    scrambled: "GNILAHW",
    hint: "Highly targeted spear phishing attack aimed at senior executives",
    explanation: "Per SANS Institute, whaling is a highly targeted phishing attack directed at senior executives — CEOs, CFOs, and board members. Because executives have high-value access and authority to approve transactions, successful whaling attacks can cause significant financial damage. Business Email Compromise (BEC) fraud uses whaling to trick executives into authorizing fraudulent wire transfers.",
    source: "SANS Institute",
  },
  {
    id: 80,
    answer: "BAITING",
    scrambled: "GNITAIB",
    hint: "Leaving infected physical media like USB drives for victims to find and plug in",
    explanation: "Per SANS Institute, baiting is a social engineering attack that uses physical media — USB drives, CDs — left in public places to tempt curious victims into plugging them into their computers. Infected media can automatically execute malware when connected. Organizations should disable AutoRun on all endpoints and train employees never to use found storage devices.",
    source: "SANS Institute",
  },
  {
    id: 81,
    answer: "ZERODAY",
    scrambled: "YADOREZ",
    hint: "A vulnerability that is exploited before the vendor has released a patch",
    explanation: "Per NIST CSRC, a zero-day vulnerability is a software flaw unknown to or unpatched by the vendor — giving defenders zero days to remediate before attacks begin. Zero-days are extremely valuable on the exploit market. Defense strategies include behavioral detection (since no signatures exist), network segmentation, and least privilege to limit damage from exploitation.",
    source: "NIST CSRC",
  },
  {
    id: 82,
    answer: "DARKNET",
    scrambled: "TENRKAD",
    hint: "A hidden overlay network requiring special software to access — used for anonymous activity",
    explanation: "Per SANS Institute, the darknet is a part of the internet accessible only through specialized software like Tor that anonymizes user traffic by routing it through multiple encrypted relays. While used by activists and journalists in repressive regimes, it also hosts criminal markets selling stolen credentials, malware, and exploits. Dark web monitoring services alert when credentials appear for sale.",
    source: "SANS Institute",
  },
  {
    id: 83,
    answer: "SHELLCODE",
    scrambled: "EDOCLLEHS",
    hint: "Small machine code payload injected into memory to execute arbitrary commands",
    explanation: "Per SANS Institute, shellcode is a small piece of machine code injected into a vulnerable process — typically to spawn a command shell or establish a reverse connection to the attacker. Shellcode must be position-independent and avoid null bytes that terminate string operations. Modern exploit mitigations like DEP, ASLR, and CFG make reliable shellcode execution significantly harder.",
    source: "SANS Institute",
  },
  {
    id: 84,
    answer: "POLYMORPHIC",
    scrambled: "CIHPROMYLOP",
    hint: "Malware that constantly changes its code signature to evade antivirus detection",
    explanation: "Per NIST SP 800-83, polymorphic malware mutates its code — changing encryption keys, variable names, or instruction order — with each infection while preserving its core function, defeating signature-based antivirus detection. Metamorphic malware goes further by rewriting its entire code logic. Behavioral analysis and heuristic detection are required to identify polymorphic threats.",
    source: "NIST SP 800-83",
  },
  {
    id: 85,
    answer: "FILELESS",
    scrambled: "LLESSIFE",
    hint: "Malware that runs entirely in memory without writing files to disk",
    explanation: "Per MITRE ATT&CK, fileless malware executes entirely in memory using legitimate system tools — PowerShell, WMI, or the Windows Registry — without writing malicious files to disk. This evades file-based antivirus scanners. Detection requires memory analysis, behavioral monitoring, and EDR solutions that track process behavior and script execution rather than file hashes.",
    source: "MITRE ATT&CK",
  },
  {
    id: 86,
    answer: "DROPPER",
    scrambled: "REPPORD",
    hint: "Malware that installs another malicious payload on the infected system",
    explanation: "Per NIST SP 800-83, a dropper is a type of malware designed to install another malicious program — the actual payload — on the victim's system. Droppers often use obfuscation and legitimate-looking installers to bypass security controls. They may download the payload from a C2 server (a downloader variant) or carry it embedded. Removing only the dropper without the payload leaves systems compromised.",
    source: "NIST SP 800-83",
  },
  {
    id: 87,
    answer: "BEACONING",
    scrambled: "GNINOCEAB",
    hint: "Periodic check-in signals that malware sends to its command-and-control server",
    explanation: "Per MITRE ATT&CK, beaconing is the behavior where malware periodically contacts its C2 server at regular intervals to receive commands, report status, or exfiltrate data. Beacon intervals can be randomized to evade time-based detection. Network defenders look for periodic outbound connections, especially to newly registered domains or IP addresses with no legitimate business purpose.",
    source: "MITRE ATT&CK",
  },
  {
    id: 88,
    answer: "PIVOTING",
    scrambled: "GNITOVIP",
    hint: "Using a compromised system as a stepping stone to attack other internal systems",
    explanation: "Per MITRE ATT&CK, pivoting is a lateral movement technique where an attacker uses a compromised host as a relay to reach systems that are otherwise inaccessible from the internet. SSH tunnels, SOCKS proxies, and compromised VPN endpoints are common pivot tools. Network segmentation, micro-segmentation, and zero-trust architectures limit how far attackers can pivot after initial access.",
    source: "MITRE ATT&CK",
  },
  {
    id: 89,
    answer: "STUXNET",
    scrambled: "TENXUTS",
    hint: "State-sponsored malware that physically destroyed Iranian nuclear centrifuges",
    explanation: "Per SANS Institute and CISA, Stuxnet was a sophisticated state-sponsored worm discovered in 2010 that targeted Iranian nuclear enrichment facilities. It spread via USB drives and infected Siemens PLCs, causing centrifuges to spin at damaging speeds while reporting normal operation. Stuxnet demonstrated that malware could cause physical destruction of industrial equipment.",
    source: "SANS Institute / CISA",
  },
  {
    id: 90,
    answer: "WANNACRY",
    scrambled: "YRCANNAW",
    hint: "2017 ransomware worm that spread globally using the EternalBlue SMB exploit",
    explanation: "Per CISA, WannaCry was a ransomware worm that rapidly infected 200,000+ systems across 150 countries in 2017, exploiting the EternalBlue vulnerability in Windows SMB. It encrypted files and demanded Bitcoin ransoms. Unpatched organizations suffered massive disruption including the UK's NHS. The attack demonstrated how quickly unpatched vulnerabilities can be weaponized at global scale.",
    source: "CISA",
  },
  {
    id: 91,
    answer: "HEARTBLEED",
    scrambled: "DEELBTREAH",
    hint: "Critical 2014 OpenSSL vulnerability that leaked server memory including private keys",
    explanation: "Per NIST CVE-2014-0160, Heartbleed was a critical vulnerability in the OpenSSL cryptographic library that allowed attackers to read up to 64KB of server memory — exposing private keys, passwords, and session tokens. It affected an estimated 17% of all TLS-protected servers. The bug existed in a heartbeat protocol extension that failed to validate the requested data length.",
    source: "NIST CVE-2014-0160",
  },
  {
    id: 92,
    answer: "SHELLSHOCK",
    scrambled: "KCOHSLLEHS",
    hint: "2014 Bash vulnerability that allowed remote command execution via environment variables",
    explanation: "Per NIST CVE-2014-6271, Shellshock was a critical vulnerability in the Bash shell that allowed attackers to execute arbitrary commands by embedding them in environment variables. Web servers, DHCP clients, and CGI scripts exposed to user input were immediately exploitable. The vulnerability had existed in Bash for over 20 years before discovery, demonstrating that legacy code can harbor critical flaws.",
    source: "NIST CVE-2014-6271",
  },
  {
    id: 93,
    answer: "MELTDOWN",
    scrambled: "NWODTLEM",
    hint: "CPU hardware vulnerability that allowed reading kernel memory from user processes",
    explanation: "Per NIST CVE-2017-5754, Meltdown was a critical hardware vulnerability in Intel processors that broke the fundamental isolation between user processes and the operating system kernel. It allowed a malicious process to read kernel memory — including passwords and cryptographic keys — using speculative execution side channels. Kernel Page Table Isolation (KPTI) patches mitigated it at a performance cost.",
    source: "NIST CVE-2017-5754",
  },
  {
    id: 94,
    answer: "SPECTRE",
    scrambled: "ERTCEPS",
    hint: "CPU hardware vulnerability that tricks programs into leaking their own memory",
    explanation: "Per NIST CVE-2017-5753, Spectre exploits speculative execution in modern CPUs to trick programs into leaking their own memory to an attacker. Unlike Meltdown, Spectre affects virtually all modern processors and is harder to fully mitigate — it requires changes to compilers, operating systems, and in some cases microcode. It represents a fundamental trade-off between CPU performance and security.",
    source: "NIST CVE-2017-5753",
  },
  {
    id: 95,
    answer: "IMPLANT",
    scrambled: "TNALPMI",
    hint: "Malware installed on a compromised system to provide persistent attacker access",
    explanation: "Per MITRE ATT&CK, an implant is malicious software installed on a compromised host to provide the attacker with persistent remote access and control. Implants communicate with C2 infrastructure, execute commands, and maintain access even after reboots through various persistence mechanisms — registry keys, scheduled tasks, and boot sectors. Advanced implants are custom-built to evade detection on specific targets.",
    source: "MITRE ATT&CK",
  },
  {
    id: 96,
    answer: "AIRGAPPED",
    scrambled: "DEPPAGRIA",
    hint: "A system physically isolated from all external networks for maximum security",
    explanation: "Per NIST SP 800-82, an air-gapped system has no physical network connections — not even indirect ones — to untrusted networks. Used for the most sensitive systems (nuclear controls, classified networks), air gaps prevent remote attacks. However, Stuxnet demonstrated that air gaps can be bridged via infected USB drives, supply chain compromises, or acoustic and electromagnetic covert channels.",
    source: "NIST SP 800-82",
  },
  {
    id: 97,
    answer: "SINKHOLING",
    scrambled: "GNILOHKNIS",
    hint: "Redirecting malicious domain traffic to a controlled server to neutralize a botnet",
    explanation: "Per CISA, DNS sinkholing redirects traffic destined for malicious command-and-control domains to a controlled IP address, effectively cutting off malware from its operators. Law enforcement and researchers use sinkholing to disrupt botnets and measure the scale of infections. Sinkholed traffic provides intelligence on the number and location of infected systems.",
    source: "CISA",
  },
  {
    id: 98,
    answer: "CRYPTOMINER",
    scrambled: "RENIMOTPYRC",
    hint: "Malware that hijacks system resources to mine cryptocurrency for the attacker",
    explanation: "Per CISA, cryptomining malware (cryptojacking) silently runs on compromised systems to mine cryptocurrency — using victim CPU and electricity while the attacker collects the rewards. Signs include high CPU usage, increased electricity costs, and system slowdowns. Cloud environments are prime targets due to their large compute resources and usage-based billing that victims pay.",
    source: "CISA",
  },
  {
    id: 99,
    answer: "TYPOSQUAT",
    scrambled: "TAUQSOPYT",
    hint: "Registering domain names similar to legitimate ones to intercept mistyped traffic",
    explanation: "Per CISA, typosquatting (URL hijacking) registers domains with common typos of legitimate sites — 'gooogle.com', 'amaz0n.com' — to intercept users who mistype addresses. These sites may serve phishing pages, malware, or ads. DNS monitoring, brand protection services, and registering common typos of your own domain proactively reduce typosquatting exposure.",
    source: "CISA",
  },
  {
    id: 100,
    answer: "DEFACEMENT",
    scrambled: "TNEMECAFED",
    hint: "Unauthorized modification of a website's appearance by an attacker",
    explanation: "Per CISA, web defacement replaces or alters a website's content with the attacker's own messaging — often political statements, taunts, or propaganda. It demonstrates successful compromise but may mask more serious damage like data theft. Recovering from defacement requires reverting to clean backups, identifying the entry point, and patching the exploited vulnerability before restoring service.",
    source: "CISA",
  },
  {
    id: 101,
    answer: "CIPHERTEXT",
    scrambled: "TXTEREPHIC",
    hint: "The encrypted, unreadable output produced by applying a cipher to plaintext",
    explanation: "Per NIST FIPS 197, ciphertext is the result of encrypting plaintext using a cryptographic algorithm and key. Ciphertext is unintelligible without the decryption key. The security of well-designed ciphers like AES-256 means ciphertext cannot be practically decrypted by brute force — the attacker must steal the key instead. Key protection is therefore the cornerstone of cryptographic security.",
    source: "NIST FIPS 197",
  },
  {
    id: 102,
    answer: "SPEARPHISH",
    scrambled: "HSIHPRAEPS",
    hint: "A targeted phishing attack customized with personal details about a specific victim",
    explanation: "Per SANS Institute, spear phishing is a highly targeted phishing attack personalized with the victim's name, employer, role, and recent activities gathered from social media and OSINT. The personalization makes it far more convincing than generic phishing. Per IBM research, spear phishing is the initial access vector in the majority of targeted cyber espionage campaigns.",
    source: "SANS Institute",
  },
  {
    id: 103,
    answer: "CATFISHING",
    scrambled: "GNIHSIFTAC",
    hint: "Creating a fake online identity to manipulate and deceive a victim",
    explanation: "Per CISA, catfishing involves creating a fictitious online persona to manipulate victims — building fake relationships to extract sensitive information, money, or access credentials through social engineering. In cybersecurity contexts, catfishing is used in pre-attack reconnaissance and social engineering to gain the trust needed to trick employees into revealing credentials or installing malware.",
    source: "CISA",
  },
  {
    id: 104,
    answer: "METAMORPHIC",
    scrambled: "CIHPROMTAEM",
    hint: "Malware that completely rewrites its own code with each infection to evade detection",
    explanation: "Per NIST SP 800-83, metamorphic malware rewrites its entire code body with each infection — changing instructions, reordering operations, and substituting equivalent code — while preserving the same malicious behavior. This defeats both signature-based and some heuristic detection. Behavioral analysis examining what the code does, not what it looks like, is required to detect metamorphic threats.",
    source: "NIST SP 800-83",
  },
  {
    id: 105,
    answer: "CONTAINMENT",
    scrambled: "TNEMNIATONC",
    hint: "Isolating an affected system to prevent an active incident from spreading further",
    explanation: "Per NIST SP 800-61, containment is the second phase of incident response — stopping an incident from spreading before full eradication. Short-term containment may involve isolating systems; long-term containment implements temporary fixes to allow operations while a permanent solution is prepared. Delayed containment allows attackers more time to exfiltrate data and compromise additional systems.",
    source: "NIST SP 800-61",
  },
  {
    id: 106,
    answer: "ATTRIBUTION",
    scrambled: "NOITUBIRTTA",
    hint: "The process of identifying the threat actor responsible for a cyber attack",
    explanation: "Per MITRE ATT&CK and NIST, attribution is identifying who is behind a cyber attack — individual, criminal group, or nation-state. Attribution uses technical indicators (malware code, C2 infrastructure, TTPs) and intelligence to link attacks to known threat actors. Attribution is inherently uncertain because skilled adversaries use false flags, spoofed infrastructure, and others' tools to mislead investigators.",
    source: "MITRE ATT&CK / NIST",
  },
  {
    id: 107,
    answer: "BLACKLISTING",
    scrambled: "GNITSILKCALB",
    hint: "Blocking known malicious IPs, domains, or files while allowing everything else",
    explanation: "Per NIST SP 800-94, blacklisting (blocklisting) denies access to known-bad entities — malicious IP addresses, domains, file hashes, or applications — while allowing everything else by default. It is reactive — only blocking known threats — and requires constant updates as threat actors continuously change infrastructure. Whitelisting (allowlisting) is the inverse and more secure approach.",
    source: "NIST SP 800-94",
  },
  {
    id: 108,
    answer: "CRYPTOMINING",
    scrambled: "GNINIMOTPYRC",
    hint: "Using computational power to validate blockchain transactions and earn cryptocurrency",
    explanation: "Per CISA, legitimate cryptocurrency mining uses computational resources to solve complex math problems that validate blockchain transactions. Attackers deploy cryptomining malware to hijack others' systems for this purpose — cryptojacking — profiting from victims' electricity and hardware. Cloud environments, web browsers via malicious scripts, and enterprise servers are common cryptomining targets.",
    source: "CISA",
  },
  {
    id: 109,
    answer: "CLICKJACKING",
    scrambled: "GNIKCAJKCILC",
    hint: "Tricking users into clicking hidden malicious elements overlaid on legitimate pages",
    explanation: "Per OWASP, clickjacking (UI redressing) overlays an invisible or transparent malicious page over a legitimate page, tricking users into clicking elements they cannot see — unknowingly authorizing transactions, enabling cameras, or downloading malware. The X-Frame-Options HTTP header and Content Security Policy's frame-ancestors directive prevent pages from being embedded in malicious iframes.",
    source: "OWASP",
  },
  {
    id: 110,
    answer: "MIMIKATZ",
    scrambled: "ZTAKIMIM",
    hint: "Post-exploitation tool that extracts plaintext credentials from Windows memory",
    explanation: "Per MITRE ATT&CK, Mimikatz is a post-exploitation credential harvesting tool that extracts plaintext passwords, NTLM hashes, and Kerberos tickets from Windows LSASS process memory. It is used by attackers after initial access to harvest credentials for lateral movement. Mitigations include Protected Users security group, Credential Guard, and limiting LSASS access to privileged accounts only.",
    source: "MITRE ATT&CK",
  },
  {
    id: 111,
    answer: "METASPLOIT",
    scrambled: "TIOLPSATEM",
    hint: "Open-source penetration testing framework used to develop and execute exploits",
    explanation: "Per SANS Institute, Metasploit is the world's most widely used penetration testing framework, providing a library of exploits, payloads, and post-exploitation modules. Penetration testers use it to simulate real attacks in authorized engagements. Because attackers also use Metasploit, signatures for its payloads are well-known to antivirus vendors — attackers often customize payloads to evade detection.",
    source: "SANS Institute",
  },
  {
    id: 112,
    answer: "REMEDIATION",
    scrambled: "NOITAIDEMER",
    hint: "Fixing or eliminating a vulnerability to remove the risk it poses",
    explanation: "Per NIST SP 800-40, vulnerability remediation involves applying patches, changing configurations, or implementing workarounds to eliminate security vulnerabilities. Remediation should be prioritized by CVSS severity, exploitability, and business impact. Time to remediate is a key security metric — the longer a known vulnerability remains unpatched, the greater the window of opportunity for attackers.",
    source: "NIST SP 800-40",
  },
  {
    id: 113,
    answer: "DOWNLOADER",
    scrambled: "REDALOWOND",
    hint: "Malware that retrieves and installs additional malicious payloads from the internet",
    explanation: "Per NIST SP 800-83, a downloader is malware designed to connect to attacker-controlled servers and download additional malicious components — ransomware, backdoors, or credential stealers. Downloaders are small and simple to evade detection; the main payload is fetched only after initial access is established. Network monitoring for unusual outbound connections is key to detecting downloaders.",
    source: "NIST SP 800-83",
  },
  {
    id: 114,
    answer: "SOCKPUPPET",
    scrambled: "TEPPUPKCOS",
    hint: "A fake online identity created to manipulate public opinion or deceive targets",
    explanation: "Per CISA, sock puppet accounts are fake online personas used in influence operations to create the false impression of widespread support, spread disinformation, or conduct targeted social engineering. Attackers use sock puppets to build fake relationships with employees before requesting sensitive information. Attribution of sock puppet activity uses behavioral analysis, network graph analysis, and metadata examination.",
    source: "CISA",
  },
  {
    id: 115,
    answer: "INDICATORS",
    scrambled: "SROTACDNII",
    hint: "Observables that suggest a system has been breached — often called IOCs",
    explanation: "Per MITRE ATT&CK and NIST SP 800-61, Indicators of Compromise (IOCs) are forensic artifacts — file hashes, IP addresses, domain names, and registry changes — that indicate a system was attacked or compromised. Sharing IOCs between organizations via STIX/TAXII enables collective defense. IOCs become stale quickly as attackers change infrastructure, making behavioral TTPs more durable detection signals.",
    source: "MITRE ATT&CK / NIST SP 800-61",
  },
  {
    id: 116,
    answer: "CYBERTHREAT",
    scrambled: "TAERTHREBYC",
    hint: "Any potential danger to systems, data, or networks originating in cyberspace",
    explanation: "Per NIST SP 800-30, a cyber threat is any circumstance or event with the potential to adversely impact organizational operations — including nation-state actors, cybercriminals, hacktivists, and insiders. Threat intelligence involves collecting, analyzing, and sharing information about active threats to enable proactive defense. Cyber threat information sharing platforms (ISACs) facilitate collective defense across industries.",
    source: "NIST SP 800-30",
  },
  {
    id: 117,
    answer: "CYBERATTACK",
    scrambled: "KCATTAREBCY",
    hint: "A deliberate attempt to exploit systems, steal data, or disrupt operations via digital means",
    explanation: "Per NIST SP 800-30, a cyber attack is a deliberate exploitation of computer systems, technology-dependent enterprises, or networks. Attacks span a spectrum — from opportunistic malware infections to targeted state-sponsored espionage campaigns. Cyber attacks against critical infrastructure — power grids, water systems, financial networks — are a significant national security concern addressed by CISA.",
    source: "NIST SP 800-30 / CISA",
  },
  {
    id: 118,
    answer: "DARKPATTERN",
    scrambled: "NRETTAPKRAD",
    hint: "UI design trick that manipulates users into sharing more data or clicking unintended actions",
    explanation: "Per NIST Privacy Framework, dark patterns are deceptive user interface designs that manipulate users into unintended actions — accepting excessive data collection, subscribing to services, or disabling privacy settings. The FTC and GDPR have taken enforcement actions against dark patterns that undermine informed consent. Privacy-by-design principles explicitly prohibit dark patterns in privacy-focused systems.",
    source: "NIST Privacy Framework / FTC",
  },
  {
    id: 119,
    answer: "WHITELISTING",
    scrambled: "GNITSILETIHW",
    hint: "Allowing only pre-approved applications to run while blocking everything else",
    explanation: "Per NIST SP 800-167, application whitelisting (allowlisting) permits only explicitly approved software to execute, blocking all other applications by default. It is one of the most effective defenses against malware because even unknown zero-day malware is blocked unless it matches an approved application. The challenge is maintaining accurate allowlists in dynamic environments without disrupting operations.",
    source: "NIST SP 800-167",
  },
  {
    id: 120,
    answer: "COUNTERFEIT",
    scrambled: "TIEFRETNUOC",
    hint: "Fraudulent hardware or software that impersonates a legitimate product to compromise security",
    explanation: "Per NIST SP 800-161, counterfeit IT products — fake hardware components, pirated software, or tampered firmware — introduce supply chain risks that are difficult to detect. Counterfeit chips may contain backdoors; pirated software often bundles malware. Supply chain security requires vendor vetting, hardware attestation, and provenance verification throughout the procurement process.",
    source: "NIST SP 800-161",
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

const EASY_POOL: Question[] = [
  {
    id: 1,
    answer: "SPAM",
    scrambled: "MAPS",
    hint: "Unsolicited bulk messages sent to many recipients at once",
    explanation: "Per NIST SP 800-45, spam is unsolicited bulk email, also called junk mail. It is a primary delivery vector for phishing links, malware attachments, and scams. Email filters use heuristics, blocklists, and sender authentication protocols such as SPF and DKIM to detect and quarantine spam before it reaches users.",
    source: "NIST SP 800-45",
  },
  {
    id: 2,
    answer: "WORM",
    scrambled: "MROW",
    hint: "Self-spreading malware that replicates across networks without a host file",
    explanation: "Per SANS Institute, a worm is a computer program that can run independently and propagate a complete working version of itself onto other hosts on a network. Unlike viruses, worms do not need a host file — they spread automatically by exploiting network vulnerabilities, often without any user interaction.",
    source: "SANS Institute",
  },
  {
    id: 3,
    answer: "HACK",
    scrambled: "KACH",
    hint: "Gaining unauthorized access to a computer system",
    explanation: "Per NIST CSRC, hacking refers to gaining unauthorized access to a system by exploiting vulnerabilities or using stolen credentials. Ethical hacking — also known as penetration testing — is an authorized form performed to identify weaknesses before malicious actors can exploit them.",
    source: "NIST CSRC",
  },
  {
    id: 4,
    answer: "SCAM",
    scrambled: "MACS",
    hint: "A deceptive scheme used to trick victims into giving up money or data",
    explanation: "Per CISA guidance, cyber scams are fraudulent schemes carried out digitally to steal money, credentials, or personal information. Common forms include lottery scams, romance scams, and tech support scams. Victims are often pressured to act quickly before they can verify the legitimacy of the request.",
    source: "CISA",
  },
  {
    id: 5,
    answer: "VIRUS",
    scrambled: "SURIV",
    hint: "Self-replicating malicious code that spreads by attaching to files",
    explanation: "Per SANS Institute, a virus is a hidden, self-replicating section of software that propagates by inserting a copy of itself into another program. It cannot run by itself — it requires its host program to execute in order to activate. Antivirus software detects and removes known virus signatures.",
    source: "SANS Institute",
  },
  {
    id: 6,
    answer: "PATCH",
    scrambled: "HCTAP",
    hint: "An update released to fix a known software security flaw",
    explanation: "Per SANS Institute, a patch is a small update released by a software manufacturer to fix bugs or vulnerabilities in existing programs. Per CISA, applying patches promptly for known exploited vulnerabilities is one of the most impactful actions an organization can take to reduce the risk of a breach.",
    source: "SANS Institute / CISA",
  },
  {
    id: 7,
    answer: "TOKEN",
    scrambled: "NEKOT",
    hint: "A digital credential used to prove identity or authorize access",
    explanation: "Per NIST SP 800-63B, a token is a physical or digital device that an individual possesses and controls to prove identity. Hardware tokens generate one-time passwords; software tokens run as mobile apps. If a token is stolen, an attacker can impersonate the user until it is revoked or expires.",
    source: "NIST SP 800-63B",
  },
  {
    id: 8,
    answer: "TROJAN",
    scrambled: "NAJORT",
    hint: "Malware disguised as legitimate software to trick users into installing it",
    explanation: "Per SANS Institute, a Trojan horse is a computer program that appears to have a useful function but also has a hidden and potentially malicious function. Unlike viruses, Trojans do not self-replicate — they rely on users installing them voluntarily, often through deceptive downloads or fake software updates.",
    source: "SANS Institute",
  },
  {
    id: 9,
    answer: "BOTNET",
    scrambled: "TENTOB",
    hint: "A network of infected computers controlled by a single attacker",
    explanation: "Per SANS Institute, a botnet is a large number of compromised computers used to send spam, spread viruses, or flood a network as a denial-of-service attack. The attacker controls the bots via command-and-control servers. Owners of infected machines are often completely unaware their device is part of a botnet.",
    source: "SANS Institute",
  },
  {
    id: 10,
    answer: "BREACH",
    scrambled: "HCAERB",
    hint: "An unauthorized access or exposure of sensitive data",
    explanation: "Per SANS Institute, a data breach is a security incident in which sensitive, protected, or confidential information is accessed, stolen, or disclosed without authorization. Many laws require organizations to notify affected individuals within a specific timeframe after a breach is discovered.",
    source: "SANS Institute",
  },
  {
    id: 11,
    answer: "HACKER",
    scrambled: "REKCAH",
    hint: "Someone who exploits weaknesses in computer systems",
    explanation: "Per NIST CSRC, a hacker is a person who gains unauthorized access to a computer system. White-hat hackers work ethically and legally to improve security; black-hat hackers act maliciously for personal gain. Authorized penetration testing is a formal practice that helps find vulnerabilities before real attackers do.",
    source: "NIST CSRC",
  },
  {
    id: 12,
    answer: "COOKIE",
    scrambled: "EIKOOC",
    hint: "Small data stored by a website to remember your session",
    explanation: "Per SANS Institute, a cookie is data exchanged between an HTTP server and a browser to store state information on the client side. Session cookies expire when the browser closes; persistent cookies remain longer. Stolen session cookies can be used to hijack active authenticated sessions without knowing the password.",
    source: "SANS Institute",
  },
  {
    id: 13,
    answer: "BACKUP",
    scrambled: "PUKCAB",
    hint: "A copy of data stored separately for recovery purposes",
    explanation: "Per NIST SP 800-34, a backup is a copy of files and programs made to facilitate recovery if the originals are lost or damaged. The 3-2-1 rule recommends keeping 3 copies on 2 different media types with 1 stored offsite or in the cloud. Regular backups are the most reliable defense against ransomware data loss.",
    source: "NIST SP 800-34",
  },
  {
    id: 14,
    answer: "ACCESS",
    scrambled: "SSECCA",
    hint: "The ability or permission to use a system or its data",
    explanation: "Per SANS Institute, access control ensures that resources are only granted to users who are entitled to them. The principle of least privilege limits permissions to the minimum necessary for a task. Per CISA, enforcing strong access controls — including multi-factor authentication — is one of the most impactful security actions an organization can take.",
    source: "SANS Institute / CISA",
  },
  {
    id: 15,
    answer: "ADWARE",
    scrambled: "ERAWDA",
    hint: "Software that automatically displays unwanted ads on your device",
    explanation: "Per NIST SP 800-83, adware is a type of software that automatically displays or downloads advertising material without explicit user consent. Aggressive adware tracks browsing habits and may install additional unwanted programs. It is frequently bundled with free software downloaded from unverified internet sources.",
    source: "NIST SP 800-83",
  },
  {
    id: 16,
    answer: "MALWARE",
    scrambled: "ERAWLAM",
    hint: "A general term for any software designed to harm systems",
    explanation: "Per SANS Institute, malware is a generic term for a number of different types of malicious code including viruses, worms, Trojans, ransomware, and spyware. It is typically delivered via email attachments, malicious downloads, or compromised websites. Antivirus software and security awareness training are primary defenses.",
    source: "SANS Institute",
  },
  {
    id: 17,
    answer: "SPYWARE",
    scrambled: "ERAWYPS",
    hint: "Software that secretly monitors and collects your activity",
    explanation: "Per NIST SP 800-83, spyware is a type of malware that covertly collects user information and sends it to a third party without the user's knowledge. It often bundles with free software and can capture credentials, browsing habits, and financial data. Spyware is a leading cause of identity theft.",
    source: "NIST SP 800-83",
  },
  {
    id: 18,
    answer: "FIREWALL",
    scrambled: "LLAWERIF",
    hint: "A system that monitors and filters incoming and outgoing network traffic",
    explanation: "Per SANS Institute, a firewall is a logical or physical discontinuity in a network to prevent unauthorized access to data or resources. It examines traffic against configured rules, blocking what does not match. Personal firewalls protect individual devices; enterprise firewalls protect entire networks from external threats.",
    source: "SANS Institute",
  },
  {
    id: 19,
    answer: "PHISHING",
    scrambled: "GNIHSIHP",
    hint: "A fake email or message designed to trick you into revealing personal data",
    explanation: "Per SANS Institute, phishing is the use of emails that appear to originate from a trusted source to trick a user into entering valid credentials at a fake website. Look for mismatched URLs, urgent language, and unexpected requests for personal information. Always verify sender identity before clicking any link.",
    source: "SANS Institute",
  },
  {
    id: 20,
    answer: "PASSWORD",
    scrambled: "DROWSSAP",
    hint: "A secret string you type to prove who you are to a system",
    explanation: "Per NIST SP 800-63B, a password is a memorized secret used to authenticate a user. Passwords should be at least 8 characters and users should never be forced to reuse them across sites. Reusing the same password is a primary driver of credential stuffing attacks, where leaked credentials from one site are tried on others.",
    source: "NIST SP 800-63B",
  },
  {
    id: 21,
    answer: "RISK",
    scrambled: "KRIS",
    hint: "The chance that a threat exploits a weakness and causes harm",
    explanation: "Per NIST SP 800-30, risk is a measure of the extent to which an entity is threatened by a potential circumstance, combining the likelihood of it occurring and its impact. Risk management involves identifying, assessing, and responding to risks to keep them within acceptable levels. All security decisions involve balancing risk against cost.",
    source: "NIST SP 800-30",
  },
  {
    id: 22,
    answer: "ALERT",
    scrambled: "RATEL",
    hint: "A notification triggered when a security system detects suspicious activity",
    explanation: "Per SANS Institute, a security alert is a notification generated by monitoring systems — firewalls, IDS, SIEM — when suspicious or potentially malicious activity is detected. Alerts require analyst triage to determine if they represent a true threat. High-quality alerting minimizes both false positives and missed incidents.",
    source: "SANS Institute",
  },
  {
    id: 23,
    answer: "CLOUD",
    scrambled: "DOLUC",
    hint: "Computing resources delivered over the internet rather than local hardware",
    explanation: "Per NIST SP 800-145, cloud computing is a model for on-demand network access to a shared pool of configurable computing resources. Cloud environments require careful access control, data encryption, and configuration management. Misconfigurations — such as publicly exposed storage buckets — are a leading cause of cloud data breaches.",
    source: "NIST SP 800-145",
  },
  {
    id: 24,
    answer: "AUDIT",
    scrambled: "DTIUA",
    hint: "A formal review of security practices, controls, and access logs",
    explanation: "Per NIST SP 800-92, a security audit is a systematic evaluation of how well an information system conforms to established security policies and controls. Audits examine access logs, configurations, and procedures to identify weaknesses. Regular auditing is required by compliance frameworks like ISO 27001 and SOC 2.",
    source: "NIST SP 800-92",
  },
  {
    id: 25,
    answer: "BLOCK",
    scrambled: "KCOLB",
    hint: "Denying access or preventing a connection from reaching its destination",
    explanation: "Per CISA guidance, blocking is a fundamental defensive action where a firewall, IPS, or security tool prevents specific traffic, IP addresses, or files from reaching their destination. Threat intelligence feeds and blocklists automate the blocking of known malicious indicators, reducing the manual workload on security analysts.",
    source: "CISA",
  },
  {
    id: 26,
    answer: "FLOOD",
    scrambled: "OFLOD",
    hint: "Overwhelming a system with excessive traffic to make it unavailable",
    explanation: "Per SANS Institute, flooding is a denial-of-service technique that overwhelms a target with traffic — SYN floods, UDP floods, HTTP floods — until it can no longer serve legitimate users. Floods are often amplified using botnets to generate massive traffic volumes. Rate limiting, traffic scrubbing services, and ISP-level filtering are common mitigations.",
    source: "SANS Institute",
  },
  {
    id: 27,
    answer: "GUARD",
    scrambled: "DRAUG",
    hint: "A security control that protects resources from unauthorized access",
    explanation: "Per NIST CSRC, a guard is a mechanism — physical personnel or access control software — that protects resources by verifying authorization before granting entry. In network security, guards are specialized gateways that enforce strict access policies between networks operating at different security classification levels.",
    source: "NIST CSRC",
  },
  {
    id: 28,
    answer: "LOGIN",
    scrambled: "INGOL",
    hint: "The process of authenticating to gain access to a system or application",
    explanation: "Per NIST SP 800-63B, login is the process by which a user presents credentials to authenticate their identity to a system. Failed login attempts should be monitored — they can indicate brute force or credential stuffing attacks. Account lockout policies and MFA significantly reduce the risk of unauthorized login.",
    source: "NIST SP 800-63B",
  },
  {
    id: 29,
    answer: "VAULT",
    scrambled: "TLUAV",
    hint: "A secure storage location for sensitive credentials or encryption keys",
    explanation: "Per SANS Institute, a secrets vault — such as HashiCorp Vault or a hardware security module (HSM) — is a secure repository for sensitive credentials, API keys, and encryption keys. Secrets management ensures credentials are never stored in plain text, in code repositories, or in unprotected environment variables.",
    source: "SANS Institute",
  },
  {
    id: 30,
    answer: "PORT",
    scrambled: "TROP",
    hint: "A numbered endpoint used by protocols to route traffic to specific services",
    explanation: "Per SANS Institute, a port is a logical connection endpoint that identifies a specific network service on a host. Port 80 is HTTP; 443 is HTTPS; 22 is SSH. Attackers use port scanning during reconnaissance to discover open services. Closing unnecessary ports and using firewalls to restrict access are fundamental system hardening steps.",
    source: "SANS Institute",
  },
  {
    id: 31,
    answer: "SCAN",
    scrambled: "NACS",
    hint: "An automated search for open ports, services, or vulnerabilities on a network",
    explanation: "Per SANS Institute, a network scan systematically probes hosts for open ports, running services, and known vulnerabilities. Attackers use scanning tools during the reconnaissance phase; defenders run authorized vulnerability scans to find weaknesses before attackers do. Port scanning without authorization is illegal in many jurisdictions.",
    source: "SANS Institute",
  },
  {
    id: 32,
    answer: "LEAK",
    scrambled: "LAEK",
    hint: "Unintentional exposure of sensitive data outside a secure boundary",
    explanation: "Per SANS Institute, a data leak is the accidental or unauthorized disclosure of sensitive information — via misconfigured cloud storage, unencrypted email, or careless sharing. Unlike a breach involving active exploitation, leaks often result from human error. Data Loss Prevention (DLP) tools help detect and block leaks before they cause harm.",
    source: "SANS Institute",
  },
  {
    id: 33,
    answer: "HASH",
    scrambled: "AHSH",
    hint: "A fixed-length fingerprint produced from data by a one-way function",
    explanation: "Per NIST FIPS 180-4, a hash function maps data of arbitrary size to a fixed-length digest. Hashes verify file integrity — if even one bit changes, the hash changes completely. Password hashing with bcrypt or SHA-3 plus a unique salt prevents rainbow table attacks if a password database is ever breached.",
    source: "NIST FIPS 180-4",
  },
  {
    id: 34,
    answer: "LOCK",
    scrambled: "KCOL",
    hint: "A mechanism that restricts access to an account or resource after failed attempts",
    explanation: "Per NIST SP 800-63B, an account lockout policy automatically disables an account after a defined number of failed authentication attempts, preventing brute force and password spraying attacks. Lockout thresholds must balance security — too low causes user lockouts; too high allows more guessing attempts. MFA reduces reliance on lockouts.",
    source: "NIST SP 800-63B",
  },
  {
    id: 35,
    answer: "ZERO",
    scrambled: "ORZE",
    hint: "Found in 'zero-day' and 'zero trust' — two foundational cybersecurity concepts",
    explanation: "Per NIST and CISA, 'zero' appears in two critical security concepts: a zero-day vulnerability is a flaw with no available patch yet (zero days of protection), and zero trust is a model that grants no implicit trust to any entity by default. Both concepts signal that organizations cannot rely on traditional perimeters to stop modern threats.",
    source: "NIST / CISA",
  },
  {
    id: 36,
    answer: "WIPE",
    scrambled: "PEWI",
    hint: "Securely erasing all data from storage media so it cannot be recovered",
    explanation: "Per NIST SP 800-88, data wiping — media sanitization — involves overwriting, degaussing, or physically destroying storage to render data unrecoverable. Proper wiping is essential before disposing of or reusing hardware. Simply deleting files does not remove data; forensic tools can recover files that were 'deleted' without proper sanitization.",
    source: "NIST SP 800-88",
  },
  {
    id: 37,
    answer: "DATA",
    scrambled: "ATAD",
    hint: "Digital information stored, processed, or transmitted by computers",
    explanation: "Per NIST FIPS 199, data is information that requires protection from unauthorized access, use, disclosure, or destruction. Protecting data confidentiality, integrity, and availability — the CIA triad — is the core mission of cybersecurity. Data can be at rest (stored), in transit (transmitted), or in use (being processed).",
    source: "NIST FIPS 199",
  },
  {
    id: 38,
    answer: "HOST",
    scrambled: "SOHT",
    hint: "A device connected to a network that sends, receives, or routes data",
    explanation: "Per SANS Institute, a host is any computer or device connected to a network — a workstation, server, or printer. Every host is a potential attack target. Securing individual hosts through patching, hardening, and endpoint protection is called host-based security, complementing network-level defenses.",
    source: "SANS Institute",
  },
  {
    id: 39,
    answer: "LOGS",
    scrambled: "SLGO",
    hint: "Recorded entries of events that occurred on a system or network",
    explanation: "Per NIST SP 800-92, logs are time-stamped records of events generated by systems, applications, and network devices. Security teams analyze logs to detect attacks, investigate incidents, and meet compliance requirements. Centralized log management via a SIEM helps correlate events across many systems to find patterns invisible in individual logs.",
    source: "NIST SP 800-92",
  },
  {
    id: 40,
    answer: "NODE",
    scrambled: "EDON",
    hint: "Any device that is a connection point on a network",
    explanation: "Per SANS Institute, a network node is any device that can send, receive, or forward information on a network — routers, switches, servers, and endpoints. Each additional node expands the network's attack surface. Attackers try to compromise nodes to pivot deeper into a network using lateral movement techniques.",
    source: "SANS Institute",
  },
  {
    id: 41,
    answer: "PING",
    scrambled: "GNIP",
    hint: "A command that tests whether a host on a network is reachable",
    explanation: "Per SANS Institute, ping sends ICMP echo request packets to a target host and listens for replies to measure reachability and round-trip time. Attackers use ping during reconnaissance to discover live hosts. Many organizations block ICMP at the perimeter to prevent network mapping, though this can also interfere with legitimate diagnostics.",
    source: "SANS Institute",
  },
  {
    id: 42,
    answer: "ROOT",
    scrambled: "TOOR",
    hint: "The highest-privilege administrator account on a Unix or Linux system",
    explanation: "Per NIST CSRC, root is the superuser account on Unix/Linux systems with unrestricted access to all commands, files, and system settings. Attackers who gain root access have complete control over the system. Best practice is to disable direct root login, use sudo for privilege escalation, and monitor all root-level commands.",
    source: "NIST CSRC",
  },
  {
    id: 43,
    answer: "USER",
    scrambled: "RESU",
    hint: "A person or process that accesses a computer system or application",
    explanation: "Per NIST SP 800-53, a user is an individual or automated process that accesses a system or application. User accounts should follow the principle of least privilege — only granted the minimum access needed. Compromised user credentials are among the most common initial access vectors in cyberattacks.",
    source: "NIST SP 800-53",
  },
  {
    id: 44,
    answer: "WIFI",
    scrambled: "IFIW",
    hint: "Wireless networking technology that lets devices connect to the internet without cables",
    explanation: "Per CISA guidance, Wi-Fi networks can be intercepted if not properly secured. Using WPA3 encryption, disabling broadcasting the default SSID, and avoiding public Wi-Fi for sensitive tasks are key security practices. Attackers set up rogue access points — 'evil twin' attacks — to intercept traffic on unsecured networks.",
    source: "CISA",
  },
  {
    id: 45,
    answer: "DUMP",
    scrambled: "PDUM",
    hint: "A raw copy of memory or data extracted from a system for analysis",
    explanation: "Per SANS Institute, a memory dump captures the entire contents of RAM at a specific moment, including running processes, encryption keys, and credentials. Forensic analysts use memory dumps to investigate attacks. Attackers use credential dumping tools like Mimikatz to extract password hashes directly from memory.",
    source: "SANS Institute",
  },
  {
    id: 46,
    answer: "FLAW",
    scrambled: "WALF",
    hint: "A bug or weakness in software that could be exploited by an attacker",
    explanation: "Per NIST SP 800-30, a security flaw is a weakness in a system that can be exploited to violate security policies. Flaws range from coding errors that enable buffer overflows to design mistakes that allow privilege escalation. Finding and fixing flaws before attackers discover them is the goal of vulnerability management programs.",
    source: "NIST SP 800-30",
  },
  {
    id: 47,
    answer: "WARN",
    scrambled: "NRAW",
    hint: "A security alert notifying users of a detected threat or risky action",
    explanation: "Per NIST SP 800-61, security warnings are notifications that inform users or administrators about detected threats, policy violations, or risky activities. Effective warnings are specific, actionable, and not so frequent that they cause 'alert fatigue' — where analysts start ignoring alerts because there are too many.",
    source: "NIST SP 800-61",
  },
  {
    id: 48,
    answer: "RULE",
    scrambled: "ELUR",
    hint: "A defined condition in a firewall or security system that determines allowed traffic",
    explanation: "Per SANS Institute, a firewall rule specifies what network traffic is permitted or blocked based on source, destination, port, and protocol. Well-designed rule sets follow the principle of least privilege — denying everything by default and only allowing what is explicitly needed. Poorly written rules with excessive permissions are a common misconfiguration.",
    source: "SANS Institute",
  },
  {
    id: 49,
    answer: "SIGN",
    scrambled: "IGNS",
    hint: "Applying a digital signature to verify authenticity and detect tampering",
    explanation: "Per NIST SP 800-89, a digital signature is a cryptographic value computed using a private key that allows anyone with the corresponding public key to verify the signer's identity and that the data has not been altered. Code signing ensures software comes from a trusted publisher and has not been tampered with after release.",
    source: "NIST SP 800-89",
  },
  {
    id: 50,
    answer: "SYNC",
    scrambled: "CNYS",
    hint: "Coordinating data or state between multiple systems so they match",
    explanation: "Per SANS Institute, synchronization ensures consistency between systems — such as keeping credentials in sync across identity providers or replicating security configurations across nodes. Attackers exploit synchronization weaknesses in protocols like DCSync to extract credential hashes from Active Directory domain controllers.",
    source: "SANS Institute",
  },
  {
    id: 51,
    answer: "TRAP",
    scrambled: "PRAT",
    hint: "A decoy or detection mechanism designed to catch attackers in the act",
    explanation: "Per SANS Institute, a trap in cybersecurity is any mechanism designed to detect, deceive, or catch unauthorized activity — such as a honeypot server or canary file that alerts when accessed. Traps help security teams detect intrusions early and learn attacker techniques without risking real systems.",
    source: "SANS Institute",
  },
  {
    id: 52,
    answer: "MASK",
    scrambled: "KSAM",
    hint: "Hiding or obscuring data or an IP address to conceal its true identity",
    explanation: "Per SANS Institute, masking involves hiding or obscuring sensitive information — such as replacing most digits of a credit card number with asterisks, or using NAT to hide internal IP addresses. IP masking is commonly used by both defenders (to hide network structure) and attackers (to conceal their true location).",
    source: "SANS Institute",
  },
  {
    id: 53,
    answer: "AGENT",
    scrambled: "TEGNA",
    hint: "A software program that runs in the background and monitors or performs tasks",
    explanation: "Per CISA, a security agent is lightweight software installed on a device to collect telemetry, enforce policies, and report to a central management platform. Endpoint Detection and Response (EDR) agents, antivirus agents, and vulnerability scanning agents are examples. Attackers also use malicious agents as remote access trojans (RATs) for persistent control.",
    source: "CISA",
  },
  {
    id: 54,
    answer: "CACHE",
    scrambled: "HECAC",
    hint: "Temporary storage that saves data for faster future access",
    explanation: "Per SANS Institute, a cache stores frequently accessed data in fast temporary memory — browsers cache web pages; DNS resolvers cache domain lookups. Cache poisoning attacks corrupt cached data to redirect users to malicious sites. DNS cache poisoning can silently redirect all users of an affected resolver to attacker-controlled addresses.",
    source: "SANS Institute",
  },
  {
    id: 55,
    answer: "CHAIN",
    scrambled: "NAIHC",
    hint: "A sequence of connected steps — as in a kill chain or certificate chain",
    explanation: "Per SANS Institute, the cyber kill chain is a framework describing the seven stages of a cyberattack: Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command and Control, and Actions on Objectives. Defenders use the kill chain to identify where to best interrupt an attack. Breaking even one link can stop the entire attack.",
    source: "SANS Institute / Lockheed Martin",
  },
  {
    id: 56,
    answer: "CHECK",
    scrambled: "KCHEC",
    hint: "Verifying that a system, file, or process meets expected security requirements",
    explanation: "Per NIST SP 800-53, security checks — also called controls assessments — verify that security measures are implemented correctly and operating as intended. Integrity checks using hash values confirm files have not been tampered with. Regular security checks are required by compliance frameworks to ensure controls remain effective over time.",
    source: "NIST SP 800-53",
  },
  {
    id: 57,
    answer: "CLONE",
    scrambled: "ENOCL",
    hint: "An exact copy of a system, disk, or identity used for replication or attack",
    explanation: "Per SANS Institute, cloning creates an exact duplicate of a system or disk. In security contexts, attackers may clone a login page (a phishing clone) or clone a victim's SIM card (SIM cloning) to intercept authentication codes. Defenders use system clones for forensic analysis and safe malware investigation.",
    source: "SANS Institute",
  },
  {
    id: 58,
    answer: "CRYPT",
    scrambled: "TPRYC",
    hint: "Short for cryptography — the science of encrypting and securing data",
    explanation: "Per NIST SP 800-175B, cryptography uses mathematical algorithms to protect information by transforming readable data into an unreadable format that only authorized parties with the correct key can reverse. Modern cryptographic systems underpin HTTPS, digital signatures, and secure communications. Weak or outdated cryptographic algorithms must be replaced promptly when vulnerabilities are discovered.",
    source: "NIST SP 800-175B",
  },
  {
    id: 59,
    answer: "DEBUG",
    scrambled: "GUBED",
    hint: "The process of finding and fixing errors or vulnerabilities in software",
    explanation: "Per SANS Institute, debugging involves identifying and removing errors (bugs) from code. From a security perspective, debuggers can be used both by developers to find vulnerabilities and by attackers to reverse-engineer software, bypass protections, or analyze malware. Anti-debugging techniques are commonly used by malware authors to hinder analysis.",
    source: "SANS Institute",
  },
  {
    id: 60,
    answer: "EMAIL",
    scrambled: "LIAME",
    hint: "Electronic messages sent over the internet — the most common phishing vector",
    explanation: "Per SANS Institute, email is the primary delivery mechanism for phishing, malware, and business email compromise attacks. Per CISA, organizations should implement SPF, DKIM, and DMARC email authentication protocols to detect spoofed senders, and use email security gateways to filter malicious links and attachments before they reach users.",
    source: "SANS Institute / CISA",
  },
  {
    id: 61,
    answer: "ERROR",
    scrambled: "RREOR",
    hint: "A failure in a system that could expose sensitive information if not handled properly",
    explanation: "Per OWASP, improper error handling is a security risk because verbose error messages can reveal internal system details — database names, stack traces, or server versions — that help attackers map the system. Secure error handling logs detailed messages server-side while showing only generic messages to end users.",
    source: "OWASP",
  },
  {
    id: 62,
    answer: "EVENT",
    scrambled: "TNEVE",
    hint: "A recorded occurrence in a system that security tools monitor for threats",
    explanation: "Per NIST SP 800-61, a security event is any observable occurrence in a system or network — a login, file access, or configuration change. Not all events are incidents; security teams triage events to distinguish routine activity from threats. SIEM platforms correlate thousands of events per second to surface suspicious patterns.",
    source: "NIST SP 800-61",
  },
  {
    id: 63,
    answer: "FAULT",
    scrambled: "TLAUF",
    hint: "A hardware or software failure that can be exploited to cause unexpected behavior",
    explanation: "Per NIST SP 800-30, a fault is an error in design, implementation, or operation that may be exploited. Fault injection attacks deliberately cause hardware or software faults — such as power glitches on microcontrollers — to bypass security checks or extract cryptographic keys. Robust error handling and hardware tamper resistance mitigate fault-based attacks.",
    source: "NIST SP 800-30",
  },
  {
    id: 64,
    answer: "FRAME",
    scrambled: "EMARF",
    hint: "A unit of data transmitted on a network, or an HTML element that can be exploited",
    explanation: "Per OWASP, frame-based attacks like clickjacking embed invisible iframes over legitimate buttons to trick users into unintended clicks — authorizing transactions or changing settings without realizing it. The X-Frame-Options and Content-Security-Policy HTTP headers prevent your site's content from being loaded inside a malicious frame.",
    source: "OWASP",
  },
  {
    id: 65,
    answer: "GRANT",
    scrambled: "TRANG",
    hint: "Giving a user or application permission to access a resource or perform an action",
    explanation: "Per NIST SP 800-53, access grants assign permissions to users, roles, or processes to perform specific operations on resources. Overly broad grants violate least privilege and increase attack surface. Access grants should be regularly reviewed and revoked when no longer needed — a practice called privilege hygiene.",
    source: "NIST SP 800-53",
  },
  {
    id: 66,
    answer: "IMAGE",
    scrambled: "EGAMI",
    hint: "A complete copy of a disk or system used for backup, forensics, or deployment",
    explanation: "Per NIST SP 800-86, a disk image is a bit-for-bit copy of storage media used in forensic investigations to preserve evidence without altering the original. System images are also used to deploy standardized secure configurations across many machines. Forensic imaging must maintain chain of custody to ensure evidence admissibility.",
    source: "NIST SP 800-86",
  },
  {
    id: 67,
    answer: "INPUT",
    scrambled: "TUPNI",
    hint: "Data entered by a user — a primary target for injection attacks if not validated",
    explanation: "Per OWASP, improper input validation is a root cause of many critical vulnerabilities including SQL injection, XSS, and command injection. Attackers craft malicious input to manipulate application logic or extract data. All user input must be validated, sanitized, and treated as untrusted — even from logged-in users.",
    source: "OWASP",
  },
  {
    id: 68,
    answer: "LAYER",
    scrambled: "REYAL",
    hint: "One level of the defense-in-depth security strategy or the OSI network model",
    explanation: "Per SANS Institute, defense in depth applies security controls at multiple layers — physical, network, host, application, and data. The OSI model has seven network layers, and attacks can target any of them. Securing each layer independently ensures that a failure at one does not immediately expose all others.",
    source: "SANS Institute",
  },
  {
    id: 69,
    answer: "MACRO",
    scrambled: "ORCAM",
    hint: "An automated script embedded in documents that attackers hide malware inside",
    explanation: "Per NIST SP 800-83, macro malware embeds malicious scripts in Office documents — Word, Excel, or PowerPoint — that execute when the user enables macros. It is a common ransomware and RAT delivery method. Disabling macros by default and enabling them only for verified trusted documents is the most effective defense.",
    source: "NIST SP 800-83",
  },
  {
    id: 70,
    answer: "MEDIA",
    scrambled: "ADIEM",
    hint: "Physical storage devices like USB drives or CDs that can carry malware",
    explanation: "Per CISA guidance, removable media — USB drives, external hard disks, and optical discs — can carry malware that infects systems when connected. Organizations should enforce policies against using unknown external media, disable autorun features, and scan all removable devices before use. Physical media is still a common attack vector in air-gapped environments.",
    source: "CISA",
  },
  {
    id: 71,
    answer: "PROBE",
    scrambled: "BOPER",
    hint: "A scan or test used to discover information about a system or network",
    explanation: "Per SANS Institute, a probe is an active technique where an attacker or security tool sends requests to a target to gather information about open ports, running services, or vulnerabilities. Probing is the active phase of reconnaissance. Intrusion detection systems flag unexpected probes from unknown sources as potential pre-attack activity.",
    source: "SANS Institute",
  },
  {
    id: 72,
    answer: "QUERY",
    scrambled: "YREQU",
    hint: "A request sent to a database to retrieve or modify data",
    explanation: "Per OWASP, database queries are a primary target of SQL injection attacks, where malicious code is embedded in input fields to manipulate the query logic. Parameterized queries and prepared statements prevent SQL injection by treating all user input as data rather than executable code. Never build database queries by concatenating user input.",
    source: "OWASP",
  },
  {
    id: 73,
    answer: "RELAY",
    scrambled: "YALER",
    hint: "Forwarding data between systems — or an attack that intercepts and forwards authentication",
    explanation: "Per NIST SP 800-63B, relay attacks intercept and forward authentication messages in real time — such as NTLM relay attacks in Windows networks, or real-time phishing that relays MFA codes. The attacker sits between victim and server, passing messages through while gaining unauthorized access. Mutual authentication and challenge-response protocols prevent relay attacks.",
    source: "NIST SP 800-63B / SANS Institute",
  },
  {
    id: 74,
    answer: "ROUTE",
    scrambled: "ETUOR",
    hint: "The path data takes through a network from source to destination",
    explanation: "Per SANS Institute, routing determines the path packets take through networks. Route poisoning attacks inject false routing information — via BGP hijacking or OSPF manipulation — to redirect traffic through attacker-controlled infrastructure for interception. Secure routing protocols and route filtering help protect against routing-based attacks.",
    source: "SANS Institute",
  },
  {
    id: 75,
    answer: "SHELL",
    scrambled: "LLHES",
    hint: "A command-line interface for executing system commands — often targeted for remote access",
    explanation: "Per SANS Institute, a shell is an interface for interacting with an operating system via commands — bash on Linux, cmd on Windows. Attackers aim to gain shell access on compromised systems to run commands. A web shell is malicious code uploaded to a web server that provides remote command execution through a browser.",
    source: "SANS Institute",
  },
  {
    id: 76,
    answer: "SNIFF",
    scrambled: "FFINS",
    hint: "Capturing and reading network traffic passing through a device",
    explanation: "Per SANS Institute, packet sniffing intercepts and reads network traffic using tools like Wireshark or tcpdump. On unencrypted networks, sniffing exposes usernames, passwords, and sensitive data. HTTPS and TLS encryption make sniffing useless even if an attacker captures traffic. Wi-Fi networks are especially vulnerable to passive sniffing.",
    source: "SANS Institute",
  },
  {
    id: 77,
    answer: "SPOOF",
    scrambled: "FOOPS",
    hint: "Faking the source of data to deceive systems or users",
    explanation: "Per SANS Institute, spoofing falsifies identifying information — an IP source address, email sender, or MAC address — to impersonate trusted entities. IP spoofing is used in amplification DDoS attacks; email spoofing drives phishing campaigns; caller ID spoofing supports vishing. Authentication protocols like SPF, DKIM, and ARP inspection detect spoofing.",
    source: "SANS Institute",
  },
  {
    id: 78,
    answer: "STACK",
    scrambled: "KCATS",
    hint: "A memory region used by programs — exploitable via buffer overflow attacks",
    explanation: "Per SANS Institute, the call stack is a memory structure programs use to store function calls and local variables. Stack-based buffer overflows occur when a program writes more data to a stack buffer than it can hold, overwriting the return address to redirect execution to malicious code. Stack canaries and ASLR are common mitigations.",
    source: "SANS Institute",
  },
  {
    id: 79,
    answer: "STORE",
    scrambled: "EORTS",
    hint: "A system or location where data is saved and retrieved",
    explanation: "Per NIST SP 800-111, data stores — databases, file systems, cloud storage — must be protected with access controls, encryption at rest, and regular access reviews. Misconfigured cloud data stores exposed to the public internet are among the most common causes of large data breaches. Automated cloud security posture management tools continuously scan for exposed stores.",
    source: "NIST SP 800-111",
  },
  {
    id: 80,
    answer: "TRACE",
    scrambled: "ERACT",
    hint: "Following a path of events through logs to investigate what happened",
    explanation: "Per NIST SP 800-86, forensic tracing follows the digital trail an attacker left across logs, network captures, and file system artifacts to reconstruct the attack timeline. Tracing is a critical step in incident response. Without comprehensive logging, traces may be missing — making it impossible to determine the full scope of a breach.",
    source: "NIST SP 800-86",
  },
  {
    id: 81,
    answer: "TRUST",
    scrambled: "TTSRU",
    hint: "The degree to which a system or entity is considered reliable and safe to interact with",
    explanation: "Per NIST SP 800-207, trust in cybersecurity defines what systems and entities are considered safe to communicate with. Traditional security trusted everything inside the network perimeter; Zero Trust assumes no implicit trust for anyone. Establishing trust through continuous verification and least privilege access is a core principle of modern security architecture.",
    source: "NIST SP 800-207",
  },
  {
    id: 82,
    answer: "ATTACK",
    scrambled: "KCATTA",
    hint: "An attempt to gain unauthorized access to, damage, or disrupt a system",
    explanation: "Per NIST SP 800-30, an attack is an attempt to gain unauthorized access, cause damage, or disrupt an information system or its data. Attacks can be active (modifying data, launching DDoS) or passive (eavesdropping). The MITRE ATT&CK framework catalogs thousands of real-world attack techniques used by known threat actors.",
    source: "NIST SP 800-30 / MITRE ATT&CK",
  },
  {
    id: 83,
    answer: "BYPASS",
    scrambled: "SSAPYB",
    hint: "Circumventing a security control without triggering its detection",
    explanation: "Per MITRE ATT&CK, security bypasses are techniques attackers use to evade or circumvent security controls — disabling antivirus, exploiting misconfigurations, or using living-off-the-land tools that look like legitimate admin activity. Defense in depth ensures that bypassing one control does not immediately give full access.",
    source: "MITRE ATT&CK",
  },
  {
    id: 84,
    answer: "CLIENT",
    scrambled: "TNEILC",
    hint: "A device or program that requests services or data from a server",
    explanation: "Per SANS Institute, in a client-server architecture, clients initiate requests and servers respond with data or services. Client-side security is critical — browsers, email clients, and mobile apps are common attack surfaces. Attackers exploit client vulnerabilities through drive-by downloads, malicious email attachments, and rogue applications.",
    source: "SANS Institute",
  },
  {
    id: 85,
    answer: "CONFIG",
    scrambled: "GIFNOC",
    hint: "Settings and parameters that define how a system or application behaves",
    explanation: "Per OWASP, security misconfiguration — improper or default configuration settings — is one of the most prevalent security risks. Exposed admin interfaces, default credentials, unnecessary services, and open cloud storage buckets are common misconfiguration issues. Automated configuration scanning and hardening baselines help prevent misconfiguration.",
    source: "OWASP",
  },
  {
    id: 86,
    answer: "DAMAGE",
    scrambled: "EGAMAD",
    hint: "Harm caused to data, systems, or reputation by a cyberattack",
    explanation: "Per NIST SP 800-30, damage from cyberattacks can be operational (system downtime), financial (fraud, ransomware payments), reputational (loss of customer trust), or legal (regulatory fines). Incident response plans aim to minimize damage by containing attacks quickly. Business impact analysis (BIA) quantifies potential damage to prioritize protection of critical assets.",
    source: "NIST SP 800-30",
  },
  {
    id: 87,
    answer: "DECODE",
    scrambled: "DEOCED",
    hint: "Converting encoded or encrypted data back into its original readable form",
    explanation: "Per SANS Institute, decoding reverses an encoding process — such as converting Base64 back to plain text. Malware commonly encodes payloads to evade antivirus detection during delivery. Security analysts decode obfuscated scripts and commands during malware analysis to understand what malicious code is actually doing.",
    source: "SANS Institute",
  },
  {
    id: 88,
    answer: "DEFEND",
    scrambled: "DNEFED",
    hint: "Protecting a system or network from unauthorized access or attack",
    explanation: "Per NIST SP 800-53, defense involves implementing security controls — technical, operational, and management — to protect information systems. Effective defense requires understanding attacker techniques, maintaining visibility into system activity, and having plans for rapid response when defenses are breached. Defense is a continuous, adaptive process.",
    source: "NIST SP 800-53",
  },
  {
    id: 89,
    answer: "DELETE",
    scrambled: "ETELED",
    hint: "Removing data from a system — though standard deletion often does not erase it securely",
    explanation: "Per NIST SP 800-88, standard file deletion only removes the file's directory entry — the actual data remains on disk until overwritten. Forensic tools can recover deleted files from storage media. Secure deletion requires overwriting the data or using media sanitization techniques to ensure recovery is impossible before disposal.",
    source: "NIST SP 800-88",
  },
  {
    id: 90,
    answer: "DETECT",
    scrambled: "TCETDE",
    hint: "Identifying the presence of a threat, attack, or security incident",
    explanation: "Per NIST SP 800-61, detection is the second phase of incident response — identifying indicators of compromise in logs, alerts, and system behavior. The faster a breach is detected, the less damage it causes. Per IBM's Cost of a Data Breach report, breaches that go undetected for months cause significantly more harm than those caught quickly.",
    source: "NIST SP 800-61",
  },
  {
    id: 91,
    answer: "DEVICE",
    scrambled: "ECIDEV",
    hint: "Any piece of hardware that connects to a network — a potential attack entry point",
    explanation: "Per CISA, every connected device — laptop, smartphone, smart TV, or IoT sensor — expands an organization's attack surface. Device security involves keeping firmware updated, enforcing strong authentication, and monitoring for anomalous behavior. IoT devices are especially risky because they often ship with weak default credentials and infrequent security updates.",
    source: "CISA",
  },
  {
    id: 92,
    answer: "ENCODE",
    scrambled: "EDOCNE",
    hint: "Converting data into a different format for transmission or obfuscation",
    explanation: "Per SANS Institute, encoding converts data into a different representation — Base64, URL encoding, or hex — for compatibility in transmission. Unlike encryption, encoding is not meant to provide security and is easily reversed. Attackers encode malicious payloads to bypass simple pattern-matching filters. Output encoding is also the primary defense against XSS attacks.",
    source: "SANS Institute",
  },
  {
    id: 93,
    answer: "FILTER",
    scrambled: "RETLIF",
    hint: "A mechanism that blocks or allows data based on defined rules",
    explanation: "Per SANS Institute, filters — in firewalls, email gateways, and web proxies — inspect traffic and block content matching threat signatures or policy rules. Egress filtering blocks outbound traffic to known malicious destinations, preventing malware callbacks. Content filtering at the DNS layer stops users from accessing malicious sites before a connection is even established.",
    source: "SANS Institute",
  },
  {
    id: 94,
    answer: "HIDDEN",
    scrambled: "NEDDIH",
    hint: "Concealed from view — as in hidden malware, files, or network services",
    explanation: "Per MITRE ATT&CK, attackers hide malicious files, processes, and network connections to avoid detection. Rootkits are designed specifically to hide their presence from the operating system. Defenders use integrity monitoring, memory analysis, and behavioral detection tools to find hidden threats that evade standard file-based scans.",
    source: "MITRE ATT&CK",
  },
  {
    id: 95,
    answer: "HIJACK",
    scrambled: "KCAJHI",
    hint: "Taking unauthorized control of a session, connection, or account",
    explanation: "Per OWASP, session hijacking steals or forges a victim's authenticated session token to take over their active session without needing their password. DNS hijacking redirects domain lookups to attacker-controlled servers. BGP hijacking reroutes internet traffic. Using HTTPS, securing session cookies with HttpOnly and Secure flags, and monitoring for anomalous sessions help prevent hijacking.",
    source: "OWASP / SANS Institute",
  },
  {
    id: 96,
    answer: "IMPACT",
    scrambled: "TCAPMI",
    hint: "The harm or damage caused to an organization by a security incident",
    explanation: "Per NIST SP 800-30, impact is the magnitude of harm that could result from a threat exploiting a vulnerability. Assessing impact helps organizations prioritize risks — a vulnerability in a critical payment system has higher impact than one in a test environment. Business impact analysis identifies which systems are most critical to protect.",
    source: "NIST SP 800-30",
  },
  {
    id: 97,
    answer: "INJECT",
    scrambled: "TCEJNI",
    hint: "Inserting malicious data or code into a vulnerable input or process",
    explanation: "Per OWASP, injection attacks — SQL, command, LDAP, and script injection — occur when untrusted data is sent to an interpreter as part of a command or query. Injection has been consistently in OWASP's Top 10 most critical web vulnerabilities for years. The fix is input validation, parameterized queries, and never trusting user-supplied data.",
    source: "OWASP",
  },
  {
    id: 98,
    answer: "KERNEL",
    scrambled: "LNEKRE",
    hint: "The core of an operating system that manages hardware and system resources",
    explanation: "Per NIST CSRC, the kernel is the central component of an operating system that manages hardware resources, memory, and process execution. Kernel-level access gives complete control over a system. Rootkits that achieve kernel-mode access are the most dangerous — they can hide from all user-mode security tools. Secure boot and kernel integrity protection defend against kernel-level attacks.",
    source: "NIST CSRC",
  },
  {
    id: 99,
    answer: "LOGGER",
    scrambled: "REGGOL",
    hint: "A tool or system that records events, actions, or keystrokes for monitoring",
    explanation: "Per NIST SP 800-92, loggers record system and application events to support security monitoring, incident investigation, and compliance auditing. A keylogger specifically records keyboard input to steal passwords. Security loggers in SIEM systems collect and analyze logs from across an environment to detect threats that span multiple systems.",
    source: "NIST SP 800-92",
  },
  {
    id: 100,
    answer: "MIRROR",
    scrambled: "RRORIM",
    hint: "Copying network traffic to a monitoring system for security analysis",
    explanation: "Per SANS Institute, port mirroring (SPAN) copies all traffic passing through a network switch to a monitoring port where security tools — IDS, packet analyzers — can inspect it without interrupting the original flow. Traffic mirroring is used by defenders for threat detection and by attackers (if they gain switch access) to eavesdrop on network communications.",
    source: "SANS Institute",
  },
  {
    id: 101,
    answer: "PACKET",
    scrambled: "TEKPAC",
    hint: "A unit of data transmitted across a network — each one can be intercepted and analyzed",
    explanation: "Per SANS Institute, a packet is the basic unit of data transmission on a network — containing a header (source/destination) and payload (data). Packet analysis reveals the details of network communications. Attackers use packet sniffers to capture credentials on unencrypted networks; defenders use packet analysis in forensic investigations.",
    source: "SANS Institute",
  },
  {
    id: 102,
    answer: "PORTAL",
    scrambled: "LATROP",
    hint: "A web-based interface providing access to systems or services — a common phishing target",
    explanation: "Per CISA, web portals — login pages for email, banking, or corporate systems — are prime targets for phishing attacks that replicate the portal's appearance to steal credentials. Always verify the URL domain before entering credentials into any portal. Multi-factor authentication on portals prevents credential theft from being immediately exploitable.",
    source: "CISA",
  },
  {
    id: 103,
    answer: "RECORD",
    scrambled: "DROCRE",
    hint: "Stored information or a log entry that documents an event or transaction",
    explanation: "Per NIST SP 800-92, security records — logs, audit trails, and transaction records — are essential for incident investigation and compliance. Tamper-evident logging ensures records cannot be altered after creation. Attackers often try to delete or modify logs to erase evidence of their activity, making log protection a critical security control.",
    source: "NIST SP 800-92",
  },
  {
    id: 104,
    answer: "REPLAY",
    scrambled: "YALPRE",
    hint: "Capturing a valid authentication or transaction message and retransmitting it to gain access",
    explanation: "Per NIST SP 800-63B, a replay attack captures a valid authentication token, session credential, or command and retransmits it later to impersonate the original sender. Nonces (one-time values) and timestamps in authentication protocols prevent replay attacks by ensuring each credential is only valid for a single use or a brief time window.",
    source: "NIST SP 800-63B",
  },
  {
    id: 105,
    answer: "REVOKE",
    scrambled: "EKOVRE",
    hint: "Cancelling access rights, certificates, or credentials that are no longer valid",
    explanation: "Per NIST SP 800-57, revoking cryptographic keys, certificates, and access credentials is a critical response action when they are compromised or no longer needed. Certificate revocation via CRL or OCSP prevents browsers from trusting invalidated certificates. Timely access revocation — especially when employees leave — is essential to prevent unauthorized access.",
    source: "NIST SP 800-57",
  },
  {
    id: 106,
    answer: "SECRET",
    scrambled: "TERCES",
    hint: "A password, key, or credential that must be kept confidential to remain secure",
    explanation: "Per SANS Institute, secrets are sensitive credentials — API keys, passwords, cryptographic keys, and tokens — that grant access to systems or resources. Secrets must never be stored in plain text, committed to code repositories, or shared insecurely. Secrets management platforms vault, rotate, and audit access to secrets automatically.",
    source: "SANS Institute",
  },
  {
    id: 107,
    answer: "SERVER",
    scrambled: "REVRES",
    hint: "A computer that provides services, data, or resources to other devices on a network",
    explanation: "Per SANS Institute, servers are high-value targets because they store data, run services, and are accessible over the network. Common server attacks include web server exploits, misconfigured cloud servers, and brute force attacks on remote access services like SSH and RDP. Hardening servers — disabling unused services, applying patches, using firewalls — reduces attack surface.",
    source: "SANS Institute",
  },
  {
    id: 108,
    answer: "SIGNAL",
    scrambled: "LANGIS",
    hint: "An indicator or communication that may reveal a security threat when analyzed",
    explanation: "Per MITRE ATT&CK, signals — network traffic patterns, system call anomalies, or behavioral indicators — help defenders detect threats. Indicators of Compromise (IOCs) are specific signals like known malicious IP addresses or file hashes. Threat intelligence enriches signals with context to reduce false positives and accelerate incident response.",
    source: "MITRE ATT&CK",
  },
  {
    id: 109,
    answer: "SOCKET",
    scrambled: "TEKCOS",
    hint: "A network communication endpoint identified by an IP address and port number",
    explanation: "Per SANS Institute, a socket is the combination of an IP address and port number that uniquely identifies a network connection endpoint. Attackers use socket-level techniques to establish covert communication channels, bind shell payloads, and exfiltrate data. Monitoring for unusual socket connections — especially outbound to unexpected destinations — is a key detection technique.",
    source: "SANS Institute",
  },
  {
    id: 110,
    answer: "SOURCE",
    scrambled: "ECRUOS",
    hint: "The origin of data, traffic, or an attack — or the readable code of a program",
    explanation: "Per SANS Institute, understanding the source of an attack — IP address, country, threat actor group — is essential for incident response and attribution. Source code security reviews identify vulnerabilities before deployment. Open-source software requires careful dependency management because attackers target popular libraries to reach many downstream users simultaneously.",
    source: "SANS Institute",
  },
  {
    id: 111,
    answer: "SPREAD",
    scrambled: "DAERPS",
    hint: "How malware propagates from one system to others across a network",
    explanation: "Per NIST SP 800-83, malware spread describes how malicious code replicates from infected systems to new targets — via network exploits (worms), email attachments (viruses), or USB drives. Network segmentation limits spread by containing infections within zones. Rapid detection and isolation are essential to prevent malware from spreading enterprise-wide.",
    source: "NIST SP 800-83",
  },
  {
    id: 112,
    answer: "STOLEN",
    scrambled: "NELOTS",
    hint: "Credentials, data, or files taken by an attacker without authorization",
    explanation: "Per CISA, stolen credentials — usernames and passwords obtained through phishing, data breaches, or malware — are the primary enabler of unauthorized account access. Credential theft feeds into credential stuffing attacks against other services. Multi-factor authentication ensures stolen passwords alone are not sufficient for account compromise.",
    source: "CISA",
  },
  {
    id: 113,
    answer: "SUBNET",
    scrambled: "TENBUS",
    hint: "A smaller network carved out of a larger one, used to segment and secure traffic",
    explanation: "Per SANS Institute, a subnet divides a larger network into smaller segments, each with its own range of IP addresses. Network segmentation using subnets limits attacker movement — if one subnet is compromised, others remain protected by internal firewalls. DMZs, internal networks, and management networks are typically placed on separate subnets.",
    source: "SANS Institute",
  },
  {
    id: 114,
    answer: "SWITCH",
    scrambled: "HCTIWS",
    hint: "A network device that connects and directs traffic between devices on a local network",
    explanation: "Per SANS Institute, a network switch forwards traffic between devices on a LAN based on MAC addresses. Switch-based attacks include MAC flooding (overloading the MAC table to force broadcasting) and ARP poisoning. Securing switches with port security, dynamic ARP inspection, and 802.1X authentication prevents switch-level attacks.",
    source: "SANS Institute",
  },
  {
    id: 115,
    answer: "TARGET",
    scrambled: "TEGRAT",
    hint: "The specific system, person, or organization an attacker aims to compromise",
    explanation: "Per MITRE ATT&CK, targeted attacks focus on a specific organization or individual rather than opportunistically scanning for any vulnerable system. Nation-state APTs and organized crime groups conduct highly targeted campaigns using customized tools and social engineering. Understanding who is likely to target your organization helps prioritize threat-specific defenses.",
    source: "MITRE ATT&CK",
  },
  {
    id: 116,
    answer: "THREAT",
    scrambled: "TAERHT",
    hint: "Any potential danger that could exploit a vulnerability and cause harm",
    explanation: "Per NIST SP 800-30, a threat is any circumstance or event with the potential to adversely impact an organization through unauthorized access, destruction, disclosure, or modification of information. Threats can be intentional (attackers), accidental (human error), or environmental (natural disasters). Threat modeling helps identify and prioritize the most relevant threats to a specific system.",
    source: "NIST SP 800-30",
  },
  {
    id: 117,
    answer: "TUNNEL",
    scrambled: "LENNUT",
    hint: "An encrypted channel that carries data securely across an untrusted network",
    explanation: "Per SANS Institute, tunneling encapsulates one protocol's traffic inside another to transport it securely or bypass restrictions. VPNs create encrypted tunnels for secure remote access. Attackers abuse tunneling to hide command-and-control traffic inside legitimate protocols like DNS or HTTPS, making it appear as normal business traffic to evade detection.",
    source: "SANS Institute",
  },
  {
    id: 118,
    answer: "UPDATE",
    scrambled: "ETADPU",
    hint: "A software release that adds features or — critically — fixes security vulnerabilities",
    explanation: "Per CISA, applying software updates promptly is one of the most effective security practices. Updates often include patches for known exploited vulnerabilities. Delaying updates leaves systems exposed to attacks that exploit those vulnerabilities. Automatic updates ensure critical security fixes are applied without relying on manual action.",
    source: "CISA",
  },
  {
    id: 119,
    answer: "UPLOAD",
    scrambled: "DALOUP",
    hint: "Sending a file from a local device to a server — a vector for malware injection",
    explanation: "Per OWASP, unrestricted file upload is a high-risk vulnerability where an attacker uploads a malicious file — a web shell or script — to a server and then executes it. Defenses include validating file type and content, storing uploaded files outside the web root, and scanning uploads with antivirus before allowing access.",
    source: "OWASP",
  },
  {
    id: 120,
    answer: "VECTOR",
    scrambled: "ROTCEV",
    hint: "The method or pathway an attacker uses to gain initial access to a system",
    explanation: "Per MITRE ATT&CK, an attack vector is the means by which an attacker gains initial access — phishing email, malicious website, brute-forced credentials, or unpatched software. Understanding the most common attack vectors for your environment lets defenders prioritize controls where they will have the greatest impact on reducing breach risk.",
    source: "MITRE ATT&CK",
  },
];

const INTERMEDIATE_POOL: Question[] = [
  {
    id: 1,
    answer: "PROXY",
    scrambled: "YXORP",
    hint: "A server that acts as an intermediary between you and the internet",
    explanation: "Per SANS Institute, a proxy server acts as an intermediary between a workstation user and the internet, enabling security enforcement, administrative control, and caching. Forward proxies provide anonymity and bypass restrictions; reverse proxies protect back-end servers. Security proxies inspect traffic for malicious content.",
    source: "SANS Institute",
  },
  {
    id: 2,
    answer: "CIPHER",
    scrambled: "REHPIC",
    hint: "A cryptographic algorithm used to encrypt and decrypt data",
    explanation: "Per SANS Institute, a cipher is a cryptographic algorithm for encryption and decryption. AES is the current NIST-recommended symmetric cipher per FIPS 197; RSA and ECC are widely used asymmetric algorithms. Outdated ciphers such as DES have been deprecated by NIST and must not be used in new or updated systems.",
    source: "SANS Institute / NIST FIPS 197",
  },
  {
    id: 3,
    answer: "ROOTKIT",
    scrambled: "TIKROOT",
    hint: "Malware that hides itself deep in the OS to maintain persistent stealth",
    explanation: "Per SANS Institute, a rootkit is a collection of tools a hacker uses to mask intrusion and obtain administrator-level access to a computer or network. Rootkits hide files, processes, and network connections from detection tools. Removal typically requires booting from a clean external drive or fully reinstalling the operating system.",
    source: "SANS Institute",
  },
  {
    id: 4,
    answer: "SANDBOX",
    scrambled: "XOBDNAS",
    hint: "An isolated environment to safely run and analyze suspicious code",
    explanation: "Per NIST SP 800-177, a sandbox is an isolated execution environment that restricts access to real system resources. Security researchers use sandboxes to safely run and observe malware samples without risking production systems. Modern browsers and operating systems use sandboxing to contain damage from malicious web content.",
    source: "NIST SP 800-177",
  },
  {
    id: 5,
    answer: "PAYLOAD",
    scrambled: "DAOLYAP",
    hint: "The malicious part of an attack that actually causes the damage",
    explanation: "Per SANS Institute, payload is the actual data or code a packet carries. In security, the malicious payload is the component that carries out the attack — encrypting files, opening a backdoor, or exfiltrating data. The delivery mechanism only transports it; the payload causes the harm. Payloads are often encrypted to evade detection.",
    source: "SANS Institute",
  },
  {
    id: 6,
    answer: "DARKWEB",
    scrambled: "BEWKRAD",
    hint: "The hidden part of the internet accessible only through special tools like Tor",
    explanation: "Per NIST CSRC, the dark web refers to internet content only accessible through special overlay networks such as Tor that anonymize users by routing traffic through multiple encrypted nodes. While it has legitimate privacy uses, it also hosts markets for stolen credentials, malware-as-a-service, and other illicit goods.",
    source: "NIST CSRC",
  },
  {
    id: 7,
    answer: "GATEWAY",
    scrambled: "YAWETAG",
    hint: "A network node that connects and routes traffic between two different networks",
    explanation: "Per SANS Institute, a gateway is a network point that acts as an entrance to another network. In security, gateways enforce access policies, filter malicious traffic, and log connections between network segments. Your home router acts as a gateway between your local network and the broader internet.",
    source: "SANS Institute",
  },
  {
    id: 8,
    answer: "HASHING",
    scrambled: "GNIHSAH",
    hint: "Converting data into a fixed-length fingerprint that cannot be reversed",
    explanation: "Per SANS Institute, cryptographic hash functions generate a one-way checksum for data that cannot be trivially reversed. Per NIST SP 800-107, passwords must be stored as salted hashes using algorithms such as SHA-3 or bcrypt. Adding a unique random salt to each password before hashing defeats precomputed rainbow table attacks.",
    source: "SANS Institute / NIST SP 800-107",
  },
  {
    id: 9,
    answer: "PENTEST",
    scrambled: "TSETNEP",
    hint: "An authorized simulation of a cyberattack to find security weaknesses",
    explanation: "Per SANS Institute, penetration testing is the formal, authorized practice of simulating real-world attacks against a system to identify vulnerabilities before malicious attackers can exploit them. The scope and rules of engagement must be documented in advance. Findings are used to drive prioritized security remediation.",
    source: "SANS Institute",
  },
  {
    id: 10,
    answer: "PHARMING",
    scrambled: "GNIMRAHP",
    hint: "Silently redirecting users to a fake website without them clicking any link",
    explanation: "Per SANS Institute, pharming is a man-in-the-middle attack where a user's session is redirected to a masquerading website by corrupting a DNS server. Unlike phishing, no malicious link click is required — the victim is redirected simply by typing a legitimate URL. HTTPS certificate validation and DNSSEC help detect and prevent it.",
    source: "SANS Institute",
  },
  {
    id: 11,
    answer: "SPOOFING",
    scrambled: "GNIFOOPS",
    hint: "Faking a source address or identity to deceive systems or users",
    explanation: "Per SANS Institute, spoofing is an attempt by an unauthorized entity to gain access to a system by posing as an authorized user. Email spoofing fakes the sender address; IP spoofing forges source IP addresses. It is a core technique in phishing campaigns and man-in-the-middle attacks.",
    source: "SANS Institute",
  },
  {
    id: 12,
    answer: "INCIDENT",
    scrambled: "TNEDICNI",
    hint: "A security event that causes or could cause harm to a system or data",
    explanation: "Per SANS Institute, an incident is an adverse network event in an information system or the threat of such an event. Per NIST SP 800-61, incident response follows six phases: Preparation, Detection, Containment, Eradication, Recovery, and Lessons Learned. A practiced response plan significantly reduces the impact of breaches.",
    source: "SANS Institute / NIST SP 800-61",
  },
  {
    id: 13,
    answer: "FORENSICS",
    scrambled: "SCISNEROF",
    hint: "Digital investigation of evidence collected after a security incident",
    explanation: "Per NIST SP 800-86, digital forensics involves the collection, preservation, examination, and analysis of digital evidence following a security incident. Maintaining a proper chain of custody ensures evidence integrity and legal admissibility. Investigators examine logs, memory dumps, and disk images to reconstruct the sequence of events.",
    source: "NIST SP 800-86",
  },
  {
    id: 14,
    answer: "HONEYPOT",
    scrambled: "TOPYNOH",
    hint: "A decoy system deliberately set up to lure and observe attackers",
    explanation: "Per SANS Institute, a honeypot simulates one or more network services on designated ports so that attackers assume they are exploiting vulnerable services. It logs attacker activity and provides early warning of attacks and valuable threat intelligence without putting production systems at risk.",
    source: "SANS Institute",
  },
  {
    id: 15,
    answer: "KEYLOGGER",
    scrambled: "REGGOLYEK",
    hint: "Software or hardware that secretly records every keystroke you type",
    explanation: "Per NIST SP 800-83, a keylogger is monitoring software or hardware that records keystrokes and transmits them to an attacker. Hardware keyloggers plug between the keyboard and computer; software keyloggers run as invisible background processes. Both can expose passwords, messages, and sensitive financial data.",
    source: "NIST SP 800-83",
  },
  {
    id: 16,
    answer: "INJECTION",
    scrambled: "NOITCEJNI",
    hint: "Inserting malicious code into an input field or database query",
    explanation: "Per SANS Institute, SQL injection is a type of input validation attack where malicious SQL code is inserted into application queries to manipulate the underlying database. It is ranked among the OWASP Top 10 most critical web application security risks. Parameterized queries and strict input validation are the primary defenses.",
    source: "SANS Institute / OWASP",
  },
  {
    id: 17,
    answer: "TUNNELING",
    scrambled: "GNILENNUT",
    hint: "Wrapping one network protocol's data packets inside another protocol",
    explanation: "Per SANS Institute, tunneling creates a communication channel by encapsulating one protocol's data packets inside another protocol. VPNs use tunneling to encrypt traffic securely across the internet. Attackers abuse tunneling to hide command-and-control traffic inside legitimate protocols such as DNS or HTTPS to bypass detection.",
    source: "SANS Institute",
  },
  {
    id: 18,
    answer: "BIOMETRIC",
    scrambled: "CIRTEMOIB",
    hint: "Authentication that uses physical traits like fingerprints or facial scans",
    explanation: "Per SANS Institute, biometrics use physical characteristics of users to determine access. Per NIST SP 800-63B, biometrics should be used as part of multi-factor authentication rather than as a standalone credential, since biometric data — unlike passwords — cannot be changed if it is ever compromised.",
    source: "SANS Institute / NIST SP 800-63B",
  },
  {
    id: 19,
    answer: "PLAINTEXT",
    scrambled: "TXETNIALP",
    hint: "Data that is fully readable and has not been encrypted",
    explanation: "Per SANS Institute, plaintext is ordinary readable text before being encrypted into ciphertext or after being decrypted. Storing passwords or sensitive data in plaintext is a critical security error — a database breach immediately exposes all credentials without any additional effort by the attacker. Encryption at rest prevents this.",
    source: "SANS Institute",
  },
  {
    id: 20,
    answer: "ENCRYPTION",
    scrambled: "NOITPYRCNE",
    hint: "Converting readable data into a scrambled format that only a key can unlock",
    explanation: "Per SANS Institute, encryption is the cryptographic transformation of data (plaintext) into a form (ciphertext) that conceals its original meaning. Only the holder of the correct key can decrypt it. HTTPS uses encryption to protect data in transit; encrypted storage protects sensitive data at rest from unauthorized access.",
    source: "SANS Institute",
  },
  {
    id: 21,
    answer: "PROTOCOL",
    scrambled: "LOCOTORP",
    hint: "A formal set of rules governing how data is exchanged between devices",
    explanation: "Per SANS Institute, a protocol is a formal specification for communication — the rules that endpoints use when exchanging data. HTTPS secures web traffic; SSH secures remote access; TLS encrypts data in transit. Attackers exploit weak or misconfigured protocol implementations to intercept or manipulate communications between systems.",
    source: "SANS Institute",
  },
  {
    id: 22,
    answer: "ENDPOINT",
    scrambled: "TNIOPDNE",
    hint: "Any device — laptop, phone, or server — that connects to a network",
    explanation: "Per CISA, an endpoint is any device connecting to an organization's network — laptops, smartphones, servers, and IoT devices. Endpoints are common attack entry points. Endpoint Detection and Response (EDR) tools monitor endpoint activity, detect threats, and automate containment responses faster than humans alone.",
    source: "CISA",
  },
  {
    id: 23,
    answer: "DEFENDER",
    scrambled: "REDNEFED",
    hint: "A person or system that protects assets from cyberattacks",
    explanation: "Per MITRE ATT&CK framework, defenders are the individuals and teams — security analysts, SOC operators, incident responders — responsible for detecting, preventing, and responding to cyber threats. Understanding attacker techniques through frameworks like MITRE ATT&CK helps defenders prioritize detection rules and system hardening efforts.",
    source: "MITRE ATT&CK",
  },
  {
    id: 24,
    answer: "INTRUSION",
    scrambled: "NOISURTNI",
    hint: "Unauthorized entry into a computer system or network",
    explanation: "Per NIST SP 800-94, an intrusion is an unauthorized act of entering a computer system or network. Intrusion Detection Systems (IDS) monitor for signs of intrusion; Intrusion Prevention Systems (IPS) actively block them. Early detection and rapid response minimize the damage an attacker can cause after gaining initial access.",
    source: "NIST SP 800-94",
  },
  {
    id: 25,
    answer: "BLACKLIST",
    scrambled: "TSILKCALB",
    hint: "A list of known malicious IPs, domains, or programs that are denied access",
    explanation: "Per CISA guidance, a blocklist (formerly blacklist) contains IP addresses, domains, email senders, or programs explicitly denied access to a network or system. Threat intelligence feeds continuously update blocklists with newly discovered malicious indicators. Blocklisting is reactive — it cannot catch novel or zero-day threats not yet on the list.",
    source: "CISA",
  },
  {
    id: 26,
    answer: "PRIVILEGE",
    scrambled: "ELIGERPIV",
    hint: "Special access rights or permissions granted to a user or process",
    explanation: "Per NIST SP 800-53, privilege refers to authorization assigned to users or processes to perform specific actions — installing software, changing configurations, or reading sensitive data. Excessive privileges violate the principle of least privilege and dramatically expand the blast radius of a compromised account or process.",
    source: "NIST SP 800-53",
  },
  {
    id: 27,
    answer: "BACKDOOR",
    scrambled: "ROODKCAB",
    hint: "A hidden method for an attacker to access a system bypassing normal authentication",
    explanation: "Per NIST SP 800-83, a backdoor is a covert mechanism that bypasses normal security authentication to give an attacker persistent access. Trojans and rootkits commonly install backdoors. Even after the original vulnerability is patched, backdoors may remain unless explicitly discovered and removed through full incident response.",
    source: "NIST SP 800-83",
  },
  {
    id: 28,
    answer: "INTEGRITY",
    scrambled: "YTIRGETNI",
    hint: "The property that data has not been altered or tampered with without authorization",
    explanation: "Per SANS Institute, integrity is one of the three CIA triad properties, ensuring information has not been changed accidentally or deliberately. Checksums, cryptographic hashes, and digital signatures verify data integrity. File integrity monitoring (FIM) tools detect unauthorized changes to critical system files and configurations.",
    source: "SANS Institute / NIST FIPS 199",
  },
  {
    id: 29,
    answer: "WHITELIST",
    scrambled: "TSILETHIW",
    hint: "A list of explicitly trusted and approved entities allowed to access a system",
    explanation: "Per CISA guidance, an allowlist (formerly whitelist) contains entities explicitly permitted to access a system — applications, IP addresses, or users. Unlike blocklists, allowlists deny everything by default and only permit approved items, providing stronger security. Application allowlisting is highly effective against malware not yet on any blocklist.",
    source: "CISA",
  },
  {
    id: 30,
    answer: "SECURITY",
    scrambled: "YTIRUCES",
    hint: "The practice of protecting systems and data from unauthorized access or harm",
    explanation: "Per NIST FIPS 199, information security encompasses protection of information and systems from unauthorized access, use, disclosure, disruption, modification, or destruction. The three foundational properties are confidentiality, integrity, and availability — the CIA triad. Security is a continuous process requiring ongoing monitoring and improvement, not a one-time configuration.",
    source: "NIST FIPS 199",
  },
  {
    id: 31,
    answer: "SIGNATURE",
    scrambled: "ERUTANGIS",
    hint: "A unique pattern used to identify malware or verify the authenticity of data",
    explanation: "Per SANS Institute, a signature is a distinct pattern in network traffic or a file that identifies a specific attack or exploit. Antivirus tools compare files against signature databases to detect known malware. Digital signatures use asymmetric cryptography to verify sender identity and confirm that data has not been tampered with in transit.",
    source: "SANS Institute",
  },
  {
    id: 32,
    answer: "MALICIOUS",
    scrambled: "SUOICILAM",
    hint: "Designed or intended to cause damage or unauthorized harm to systems",
    explanation: "Per SANS Institute, malicious code is software that appears useful but actually performs unauthorized harmful actions — gaining unauthorized access, stealing data, or disrupting services. Malicious intent distinguishes security attacks from accidental errors. Behavioral analysis tools detect malicious patterns even when code looks superficially legitimate.",
    source: "SANS Institute",
  },
  {
    id: 33,
    answer: "QUARANTINE",
    scrambled: "ENITNARAUQ",
    hint: "Isolating a suspicious file or device to prevent it from spreading harm",
    explanation: "Per NIST SP 800-83, quarantine moves a suspicious or detected malicious file to an isolated location where it cannot execute or spread, allowing safe analysis. It is also used for compromised network devices — isolating them from the rest of the network during incident response. Items may be restored if confirmed as false positives.",
    source: "NIST SP 800-83",
  },
  {
    id: 34,
    answer: "NETWORK",
    scrambled: "KROWTEN",
    hint: "A group of interconnected devices that communicate and share resources",
    explanation: "Per SANS Institute, a computer network is a collection of hosts connected through sub-networks that exchange data. Every connected device is a potential entry point for attackers. Network segmentation divides the network into security zones so that a compromise in one zone cannot easily spread to higher-value areas.",
    source: "SANS Institute",
  },
  {
    id: 35,
    answer: "OBFUSCATE",
    scrambled: "FOCATEBUS",
    hint: "Making code or data deliberately hard to read in order to evade analysis",
    explanation: "Per MITRE ATT&CK, obfuscation is a defense evasion technique where attackers make malicious code or commands intentionally difficult to analyze — using Base64 encoding, XOR encryption, or junk code insertion. This helps malware evade signature-based antivirus tools. Behavioral analysis and deobfuscation tools help analysts examine obfuscated samples.",
    source: "MITRE ATT&CK / SANS Institute",
  },
  {
    id: 36,
    answer: "ESCALATE",
    scrambled: "TELECASA",
    hint: "Gaining higher permissions or access than originally granted after initial entry",
    explanation: "Per MITRE ATT&CK, privilege escalation describes techniques attackers use to gain higher-level permissions — from regular user to administrator, or from a workstation to a domain controller. Exploiting software vulnerabilities, misconfigurations, and stored credentials are common escalation vectors. Least privilege and timely patching limit escalation opportunities.",
    source: "MITRE ATT&CK",
  },
  {
    id: 37,
    answer: "DECRYPT",
    scrambled: "TPYRCED",
    hint: "Reversing encryption to convert ciphertext back into readable plaintext",
    explanation: "Per SANS Institute, decryption converts ciphertext back into readable plaintext using the correct cryptographic key. Only authorized parties with the key should be able to decrypt protected data. If an attacker obtains the decryption key, all data protected by that key is immediately exposed — making key management as important as the encryption algorithm itself.",
    source: "SANS Institute",
  },
  {
    id: 38,
    answer: "MONITOR",
    scrambled: "ROTINOM",
    hint: "Continuously watching systems and networks for signs of threats or anomalies",
    explanation: "Per NIST SP 800-137, continuous monitoring involves ongoing collection of security metrics to detect threats in real time. SIEM, EDR, and IDS tools watch for indicators of compromise across logs, network traffic, and endpoint behavior. Without monitoring, breaches go undetected for an average of over 200 days — enabling far greater damage.",
    source: "NIST SP 800-137",
  },
  {
    id: 39,
    answer: "PRIVACY",
    scrambled: "YCAVIRP",
    hint: "The right to control how personal information is collected and used",
    explanation: "Per NIST Privacy Framework, privacy is the right of individuals to control how their personal data is collected, used, and shared. Regulations like GDPR and CCPA establish legal requirements for data privacy. Security and privacy work together — breaches exposing personal data are both security failures and privacy violations with significant legal consequences.",
    source: "NIST Privacy Framework",
  },
  {
    id: 40,
    answer: "SESSION",
    scrambled: "NSSIOES",
    hint: "An authenticated period of interaction between a user and a system",
    explanation: "Per OWASP, a session tracks a user's authenticated interaction with a web application via a session token stored in a cookie. Session-based attacks — hijacking, fixation, and replay — target these tokens to take over authenticated sessions. Secure session management uses HTTPS, short timeouts, and HttpOnly and Secure cookie flags.",
    source: "OWASP",
  },
  {
    id: 41,
    answer: "SCANNER",
    scrambled: "RECNANS",
    hint: "A tool that automatically probes systems to discover vulnerabilities or open ports",
    explanation: "Per SANS Institute, vulnerability scanners systematically test systems for known weaknesses — open ports, outdated software, and missing patches. Defenders run authorized scans to find issues before attackers do. Nmap scans ports; Nessus and OpenVAS check for CVE-listed vulnerabilities. Attackers use scanners during reconnaissance to map the attack surface.",
    source: "SANS Institute",
  },
  {
    id: 42,
    answer: "CAPTURE",
    scrambled: "ERUTPAC",
    hint: "Recording network traffic or credentials for analysis or theft",
    explanation: "Per SANS Institute, packet capture records network traffic for security analysis using tools like Wireshark or tcpdump. Defenders use captures to investigate incidents; attackers capture traffic to steal credentials on unencrypted networks. Credential capture tools like Mimikatz extract passwords directly from Windows memory. TLS encryption makes captured traffic unreadable.",
    source: "SANS Institute",
  },
  {
    id: 43,
    answer: "EVASION",
    scrambled: "NOIVASE",
    hint: "Techniques attackers use to avoid detection by security tools",
    explanation: "Per MITRE ATT&CK, defense evasion covers techniques adversaries use to avoid detection — disabling security software, obfuscating code, using legitimate tools maliciously (living off the land), and deleting logs. Behavioral detection and anomaly-based tools are more effective against evasion than signature-based tools that rely on known patterns.",
    source: "MITRE ATT&CK",
  },
  {
    id: 44,
    answer: "STEALTH",
    scrambled: "HTLAETS",
    hint: "Operating covertly for extended periods without triggering security alerts",
    explanation: "Per MITRE ATT&CK, stealthy attacks are designed to operate quietly for extended periods — maintaining persistence, exfiltrating data slowly, and avoiding alerts. Advanced persistent threats (APTs) prioritize stealth for long-term access. Threat hunting — proactively searching for threats not caught by automated tools — is the primary defense against stealthy adversaries.",
    source: "MITRE ATT&CK",
  },
  {
    id: 45,
    answer: "COMMAND",
    scrambled: "DNAMMOC",
    hint: "Instructions sent from an attacker to malware via a C2 server",
    explanation: "Per MITRE ATT&CK, Command and Control (C2) refers to how adversaries communicate with and direct compromised systems. Malware beacons to attacker-controlled C2 servers to receive commands and send back stolen data. Defenders detect C2 traffic by monitoring for unusual outbound connections, periodic beacon patterns, or DNS queries to newly registered domains.",
    source: "MITRE ATT&CK",
  },
  {
    id: 46,
    answer: "CONTROL",
    scrambled: "LORTNOC",
    hint: "A security measure implemented to reduce risk or enforce security policy",
    explanation: "Per NIST SP 800-53, security controls are safeguards — technical (firewalls, encryption), operational (training, incident response), or management (policies, risk assessments) — designed to protect the CIA triad. Controls are selected based on risk assessments and compliance requirements. The effectiveness of controls must be continuously monitored and validated.",
    source: "NIST SP 800-53",
  },
  {
    id: 47,
    answer: "DEFENSE",
    scrambled: "ESENFED",
    hint: "The set of security measures used to protect systems and data from attacks",
    explanation: "Per SANS Institute, cybersecurity defense encompasses the policies, processes, and technologies used to prevent, detect, and respond to threats. Effective defense combines preventive controls (firewalls, MFA), detective controls (SIEM, IDS), and responsive capabilities (incident response plans). Defense in depth ensures no single point of failure can compromise an entire system.",
    source: "SANS Institute",
  },
  {
    id: 48,
    answer: "PROTECT",
    scrambled: "TCETORP",
    hint: "Implementing security measures to guard systems and data from unauthorized access",
    explanation: "Per NIST Cybersecurity Framework, the Protect function covers safeguards that limit the impact of security events — access controls, data encryption, maintenance, and awareness training. Protecting systems requires understanding what assets exist, what threats they face, and which controls are most effective given the organization's risk tolerance and available resources.",
    source: "NIST Cybersecurity Framework",
  },
  {
    id: 49,
    answer: "ISOLATE",
    scrambled: "ETALOSI",
    hint: "Separating a compromised system from the network to contain a threat",
    explanation: "Per NIST SP 800-61, isolating a compromised device is a critical containment step in incident response — disconnecting it to prevent lateral movement or further exfiltration. EDR tools can automatically isolate endpoints on detecting suspicious behavior. Isolation must balance security (stopping the attacker) against availability (allowing critical operations to continue).",
    source: "NIST SP 800-61",
  },
  {
    id: 50,
    answer: "RESPOND",
    scrambled: "DNOPSER",
    hint: "Taking action to contain, eradicate, and recover from a security incident",
    explanation: "Per NIST SP 800-61, incident response is a structured approach covering detection, containment, eradication, and recovery from security breaches. A practiced Incident Response Plan (IRP) defines roles and procedures so teams act quickly under pressure. Regular tabletop exercises ensure responders know their roles before a real incident occurs.",
    source: "NIST SP 800-61",
  },
  {
    id: 51,
    answer: "ANALYZE",
    scrambled: "EZYLANA",
    hint: "Examining data, logs, or malware to understand what happened during an attack",
    explanation: "Per NIST SP 800-86, security analysis examines artifacts — logs, memory dumps, network captures, and malware samples — to reconstruct attack timelines and identify indicators of compromise. Malware analysis uses static (without executing) and dynamic (in a sandbox) techniques to understand attacker capabilities, persistence mechanisms, and targets.",
    source: "NIST SP 800-86",
  },
  {
    id: 52,
    answer: "EXPLOIT",
    scrambled: "TIOLPXE",
    hint: "Code or a technique that takes advantage of a software vulnerability",
    explanation: "Per NIST CSRC, an exploit leverages a security vulnerability to gain unauthorized access, escalate privileges, or execute malicious code. Exploits are often packaged into exploit kits for wide distribution. Zero-day exploits target unpatched vulnerabilities and are especially dangerous. Patching removes the vulnerabilities that exploits depend on.",
    source: "NIST CSRC",
  },
  {
    id: 53,
    answer: "CONSENT",
    scrambled: "TNESNOC",
    hint: "Authorization from a user for how their personal data may be collected and used",
    explanation: "Per GDPR, consent is a lawful basis for processing personal data — individuals must actively agree, not simply fail to opt out. Consent must be freely given, specific, informed, and revocable. In security testing, written consent and rules of engagement are required before any penetration testing begins to ensure legal authorization.",
    source: "GDPR / NIST Privacy Framework",
  },
  {
    id: 54,
    answer: "WIRELESS",
    scrambled: "SSELREIW",
    hint: "A network connection made over radio waves rather than physical cables",
    explanation: "Per CISA, wireless networks introduce unique security risks — traffic can be intercepted without physical access, and rogue access points can mimic legitimate networks. Per NIST SP 800-153, securing wireless networks requires WPA3 encryption, strong passphrases, network segmentation, and monitoring for unauthorized devices.",
    source: "CISA / NIST SP 800-153",
  },
  {
    id: 55,
    answer: "FIRMWARE",
    scrambled: "ERAWMRIF",
    hint: "Low-level software embedded in hardware that controls its basic functions",
    explanation: "Per NIST SP 800-193, firmware is software embedded in hardware — routers, IoT devices, servers — controlling fundamental device operation. Firmware vulnerabilities persist even after OS reinstallation and are difficult to patch at scale. Attackers target firmware to establish extremely persistent backdoors that survive system wipes and drive replacements.",
    source: "NIST SP 800-193",
  },
  {
    id: 56,
    answer: "REDIRECT",
    scrambled: "TCERIDER",
    hint: "Sending users to a different URL — abused in phishing and open redirect attacks",
    explanation: "Per OWASP, open redirects occur when an application accepts unvalidated user input to redirect users to external URLs. Attackers exploit open redirects to craft convincing phishing URLs on trusted domains — the link starts with a real domain but redirects to a malicious site. URL validation and allowlisting permitted redirect destinations prevents this attack.",
    source: "OWASP",
  },
  {
    id: 57,
    answer: "CHECKSUM",
    scrambled: "MUSKCEHC",
    hint: "A value calculated from data to verify it has not been corrupted or altered",
    explanation: "Per NIST FIPS 180-4, checksums and cryptographic hash functions verify data integrity by producing a fixed-length value from input data. Any modification — even a single bit — changes the checksum completely. Software downloads should always be verified against published checksums to confirm files have not been tampered with during distribution.",
    source: "NIST FIPS 180-4",
  },
  {
    id: 58,
    answer: "OVERFLOW",
    scrambled: "WFLREVOO",
    hint: "Writing more data to a memory buffer than it can hold — a classic vulnerability",
    explanation: "Per SANS Institute, a buffer overflow occurs when a program writes more data to a memory buffer than allocated, overwriting adjacent memory. Stack-based overflows can redirect execution to attacker-controlled shellcode. Stack canaries, ASLR (Address Space Layout Randomization), and DEP (Data Execution Prevention) are modern mitigations that make overflow exploitation much harder.",
    source: "SANS Institute",
  },
  {
    id: 59,
    answer: "LOCKDOWN",
    scrambled: "NWODKCOL",
    hint: "Restricting all access to a system or facility during a security emergency",
    explanation: "Per NIST SP 800-61, a security lockdown restricts or cuts off access to systems, networks, or facilities to prevent further damage during an active incident. Lockdowns balance security (stopping the attacker) against availability (allowing critical operations to continue). Pre-planned lockdown procedures reduce decision-making time during high-pressure incidents.",
    source: "NIST SP 800-61",
  },
  {
    id: 60,
    answer: "BASELINE",
    scrambled: "ENILEASB",
    hint: "A documented record of normal system state used to detect unauthorized changes",
    explanation: "Per NIST SP 800-128, a security baseline documents the approved, secure configuration of a system — installed software, running services, open ports, and security settings. Deviations from the baseline indicate unauthorized changes or compromise. File integrity monitoring (FIM) tools continuously compare system state against the baseline to detect tampering.",
    source: "NIST SP 800-128",
  },
  {
    id: 61,
    answer: "CALLBACK",
    scrambled: "KCBALACL",
    hint: "When malware contacts an attacker's C2 server after infecting a system",
    explanation: "Per MITRE ATT&CK, a callback is how malware initiates outbound communication to an attacker's command-and-control (C2) server after infection to receive instructions. Callbacks often use ports 80 and 443 with encrypted traffic to blend in with normal web traffic. Monitoring outbound connections for unusual destinations and beacon patterns helps detect callbacks.",
    source: "MITRE ATT&CK",
  },
  {
    id: 62,
    answer: "WHITEHAT",
    scrambled: "TATEHIHW",
    hint: "An ethical hacker with written authorization to test systems for vulnerabilities",
    explanation: "Per SANS Institute, white-hat hackers are security professionals who use hacking techniques with explicit written authorization to discover vulnerabilities before malicious actors do. They follow strict rules of engagement and report all findings. Certifications like OSCP and CEH, and bug bounty programs, formalize white-hat security research.",
    source: "SANS Institute",
  },
  {
    id: 63,
    answer: "BLACKHAT",
    scrambled: "TAHKCALB",
    hint: "A malicious hacker who exploits systems without authorization for criminal gain",
    explanation: "Per NIST CSRC, black-hat hackers carry out unauthorized intrusions for criminal purposes — stealing data, deploying ransomware, committing fraud, or selling access to other criminals. They operate in violation of computer crime laws. The term contrasts with white-hat (ethical) hackers who are authorized to test security, and gray-hat hackers who occupy a legally ambiguous space.",
    source: "NIST CSRC",
  },
  {
    id: 64,
    answer: "RESPONSE",
    scrambled: "ESNOPSER",
    hint: "Actions taken to contain and recover from a detected security incident",
    explanation: "Per NIST SP 800-61, incident response is a structured approach to handling breaches — detecting, containing, eradicating threats, and restoring operations. An Incident Response Plan (IRP) pre-defines roles, communication procedures, and containment steps so teams act quickly under pressure rather than improvising. Mean Time to Respond (MTTR) measures how fast an organization recovers.",
    source: "NIST SP 800-61",
  },
  {
    id: 65,
    answer: "DISCLOSE",
    scrambled: "ESOLCSID",
    hint: "Revealing a discovered vulnerability to the vendor or public after notification",
    explanation: "Per CISA, responsible vulnerability disclosure involves notifying the affected vendor about a security flaw and giving them time to patch before publicizing details. Coordinated disclosure balances the public's right to know against the risk of providing attackers a roadmap before defenses are in place. Bug bounty programs incentivize researchers to disclose responsibly.",
    source: "CISA",
  },
  {
    id: 66,
    answer: "OVERRIDE",
    scrambled: "EDIRREVO",
    hint: "Bypassing a security control to change system behavior or gain unauthorized access",
    explanation: "Per NIST SP 800-53, security control overrides — bypassing access controls, disabling logging, or circumventing authentication — must be tightly controlled and audited. Attackers seek to override controls to maintain access and avoid detection. Privileged Access Management (PAM) solutions monitor and record all privileged actions that could override normal security controls.",
    source: "NIST SP 800-53",
  },
  {
    id: 67,
    answer: "DOWNTIME",
    scrambled: "EMITNOWD",
    hint: "The period when a system is unavailable — targeted by DDoS and ransomware attacks",
    explanation: "Per NIST FIPS 199, availability — ensuring authorized users have reliable access — is one of the CIA triad properties. Ransomware, DDoS attacks, and destructive malware cause downtime. Disaster recovery plans, high-availability architectures, and offline backups minimize downtime after an attack. Recovery Time Objectives (RTOs) define the maximum acceptable downtime for each system.",
    source: "NIST FIPS 199",
  },
  {
    id: 68,
    answer: "SCANNING",
    scrambled: "GNINNACS",
    hint: "Automated probing of systems to discover open ports, services, or vulnerabilities",
    explanation: "Per SANS Institute, scanning is a core technique used by both attackers mapping targets and defenders auditing their own systems. Port scanners like Nmap identify open services; vulnerability scanners like Nessus check for known CVE vulnerabilities. Unauthorized scanning is illegal in many jurisdictions; authorized scanning is an essential security practice.",
    source: "SANS Institute",
  },
  {
    id: 69,
    answer: "CLASSIFY",
    scrambled: "YFISSALC",
    hint: "Assigning a sensitivity label to data to determine how it must be protected",
    explanation: "Per NIST SP 800-60, data classification assigns sensitivity labels — public, internal, confidential, restricted — based on the harm its exposure would cause. Classification drives protection decisions: highly classified data requires stronger access controls, encryption, and audit logging. Misclassifying sensitive data as public is a common cause of accidental exposure.",
    source: "NIST SP 800-60",
  },
  {
    id: 70,
    answer: "CLEARTEXT",
    scrambled: "TXETREALC",
    hint: "Data transmitted or stored in readable form without any encryption",
    explanation: "Per SANS Institute, cleartext data is transmitted or stored without encryption — readable by anyone who intercepts it. Protocols like HTTP, FTP, and Telnet transmit in cleartext. All sensitive communications should use encrypted alternatives: HTTPS instead of HTTP, SFTP instead of FTP, SSH instead of Telnet. Cleartext passwords in logs or databases are a critical security flaw.",
    source: "SANS Institute",
  },
  {
    id: 71,
    answer: "ANTIVIRUS",
    scrambled: "SURIVITNA",
    hint: "Software that detects, prevents, and removes malicious programs from endpoints",
    explanation: "Per NIST SP 800-83, antivirus software detects and removes malware by comparing files against signature databases and using heuristic analysis for unknown threats. Regular definition updates are critical as new threats emerge daily. Modern endpoint protection extends beyond antivirus to include behavioral detection, EDR capabilities, and cloud-based threat intelligence sharing.",
    source: "NIST SP 800-83",
  },
  {
    id: 72,
    answer: "SENSITIVE",
    scrambled: "EVITISNES",
    hint: "Data requiring special protection because its exposure could cause significant harm",
    explanation: "Per NIST SP 800-122, sensitive personally identifiable information (PII) includes data enabling identity theft or financial fraud — Social Security numbers, financial records, medical data. Sensitive data requires stronger access controls, encryption at rest and in transit, and stricter audit logging than general business data. Minimizing collection of sensitive data reduces breach impact.",
    source: "NIST SP 800-122",
  },
  {
    id: 73,
    answer: "INTERCEPT",
    scrambled: "TPECRETNI",
    hint: "Capturing communications between two parties to read or modify them",
    explanation: "Per SANS Institute, traffic interception captures communications in a man-in-the-middle (MitM) attack to read, record, or modify data in transit. ARP poisoning, DNS spoofing, and SSL stripping are common techniques. TLS encryption, certificate pinning, and HSTS headers prevent most interception attacks on HTTPS connections by ensuring encrypted end-to-end channels.",
    source: "SANS Institute",
  },
  {
    id: 74,
    answer: "PENETRATE",
    scrambled: "ETARTENEP",
    hint: "Successfully breaking through security controls to gain unauthorized access",
    explanation: "Per SANS Institute, penetration is the act of gaining unauthorized logical access to sensitive data by circumventing system protections. Authorized penetration tests simulate real attacks to find vulnerabilities before malicious actors do. Scope agreements define which systems can be tested and what techniques are permitted — essential legal protection for testers.",
    source: "SANS Institute",
  },
  {
    id: 75,
    answer: "TIMESTAMP",
    scrambled: "PMATSTIME",
    hint: "A recorded date and time attached to a log entry for forensic tracking",
    explanation: "Per NIST SP 800-92, timestamps in logs record exactly when events occurred, enabling forensic reconstruction of attack timelines. Accurate timestamps synchronized via NTP across all systems are essential for correlating events from multiple log sources. Attackers sometimes modify or delete timestamps to obscure their activity — making tamper-evident logging critical.",
    source: "NIST SP 800-92",
  },
  {
    id: 76,
    answer: "BLACKMAIL",
    scrambled: "LIAMKCALB",
    hint: "Threatening to expose sensitive data unless a ransom or payment is made",
    explanation: "Per CISA, cyber blackmail involves threatening to expose sensitive data, publish private content, or disrupt systems unless payment is made. Double extortion ransomware both encrypts files and threatens to publish stolen data. Reporting cyber extortion to law enforcement is recommended over paying — payment encourages further attacks and does not guarantee data deletion.",
    source: "CISA",
  },
  {
    id: 77,
    answer: "COMPLIANT",
    scrambled: "TNAILPMOC",
    hint: "Meeting the requirements of a security regulation, framework, or policy",
    explanation: "Per NIST Cybersecurity Framework, compliance means satisfying applicable laws, regulations, and standards — PCI DSS for payment cards, HIPAA for healthcare, GDPR for EU personal data. Compliance provides a minimum security baseline but should not be mistaken for comprehensive security. Organizations that are compliant but not secure remain vulnerable to attackers.",
    source: "NIST Cybersecurity Framework",
  },
  {
    id: 78,
    answer: "DETECTION",
    scrambled: "NOITCETED",
    hint: "The process of identifying that a security threat or breach has occurred",
    explanation: "Per NIST SP 800-61, detection identifies indicators of compromise — suspicious log entries, anomalous traffic, or security tool alerts. Mean Time to Detect (MTTD) measures how quickly a breach is discovered. Organizations with mature SIEM and EDR programs detect breaches in days; those without can take months. Faster detection dramatically reduces breach damage.",
    source: "NIST SP 800-61",
  },
  {
    id: 79,
    answer: "ENCRYPTED",
    scrambled: "DETPRYCEN",
    hint: "Data transformed by a cryptographic algorithm so it is unreadable without a key",
    explanation: "Per NIST SP 800-111, encrypted data has been cryptographically transformed, rendering it unreadable to anyone without the decryption key. Encrypting data at rest protects stored files; TLS encrypts data in transit. Ransomware ironically uses the same technique defenders use — encrypting victims' files to deny access until a ransom is paid.",
    source: "NIST SP 800-111",
  },
  {
    id: 80,
    answer: "AUTHORIZE",
    scrambled: "EZIROTHUA",
    hint: "Granting a verified user permission to access a resource or perform an action",
    explanation: "Per NIST SP 800-53, authorization determines what an authenticated user is permitted to do. Authentication proves identity ('who are you?'); authorization enforces access rights ('what are you allowed to do?'). Broken authorization — where applications only check authentication but not what the user is allowed to access — is consistently among OWASP's top vulnerabilities.",
    source: "NIST SP 800-53",
  },
  {
    id: 81,
    answer: "DEEPFAKE",
    scrambled: "KEFPAEED",
    hint: "AI-generated synthetic media that convincingly impersonates a real person",
    explanation: "Per CISA, deepfakes are AI-generated or manipulated video, audio, or images that realistically portray someone saying or doing things they never did. Attackers use deepfakes for social engineering — impersonating executives in video calls to authorize fraudulent transfers, or creating fake voice recordings for vishing attacks. Out-of-band verification of unusual requests is the primary defense.",
    source: "CISA",
  },
  {
    id: 82,
    answer: "COMPLIANCE",
    scrambled: "ECNAILPMOC",
    hint: "Adhering to laws, regulations, and security standards applicable to an organization",
    explanation: "Per NIST Cybersecurity Framework, compliance involves satisfying applicable regulations — PCI DSS, HIPAA, GDPR, SOC 2 — through documented policies, technical controls, and regular audits. Compliance reduces legal liability and establishes minimum security baselines. However, compliance is a floor, not a ceiling — organizations should exceed minimum requirements.",
    source: "NIST Cybersecurity Framework",
  },
  {
    id: 83,
    answer: "MITIGATION",
    scrambled: "NOITAGITIM",
    hint: "Actions taken to reduce the severity or likelihood of a security risk",
    explanation: "Per NIST SP 800-30, risk mitigation implements controls that reduce threat likelihood or limit impact. Strategies include patching vulnerabilities, deploying MFA, segmenting networks, and training users. Residual risk remains after mitigation and must be accepted, transferred (via cyber insurance), or further reduced through additional controls.",
    source: "NIST SP 800-30",
  },
  {
    id: 84,
    answer: "PASSPHRASE",
    scrambled: "ESARPHSSAP",
    hint: "A long password made of multiple words — stronger than a short complex password",
    explanation: "Per NIST SP 800-63B, passphrases — sequences of multiple random words — are significantly more secure than short complex passwords because length matters more than complexity against brute force. NIST recommends long passphrases over complexity rules that lead to predictable patterns. A passphrase like 'correct-horse-battery-staple' is both memorable and highly resistant to cracking.",
    source: "NIST SP 800-63B",
  },
  {
    id: 85,
    answer: "CREDENTIAL",
    scrambled: "LAITNEDERC",
    hint: "A username and password pair used to authenticate and access a system",
    explanation: "Per NIST SP 800-63B, a credential binds an identity to an authenticator — typically a username/password pair. Credential theft is the primary initial access vector in most data breaches. Credential stuffing automates testing stolen credentials from breached sites against other services. Unique passwords and MFA per account are the most effective defenses.",
    source: "NIST SP 800-63B",
  },
  {
    id: 86,
    answer: "MASQUERADE",
    scrambled: "EDAREUQSAM",
    hint: "Pretending to be a legitimate user or service to gain unauthorized access",
    explanation: "Per NIST SP 800-63B, a masquerade attack occurs when an entity gains access by posing as an authorized user or trusted service. Email spoofing, fake login pages, and IT support impersonation are masquerade techniques. Strong authentication — MFA and certificate-based auth — prevents masquerade attacks even when passwords are stolen.",
    source: "NIST SP 800-63B",
  },
  {
    id: 87,
    answer: "PREVENTION",
    scrambled: "NOITNEVERP",
    hint: "Security measures that stop attacks from succeeding before they cause harm",
    explanation: "Per NIST Cybersecurity Framework, prevention implements controls that stop attacks before they succeed — firewalls, input validation, MFA, and software patching. While perfect prevention is impossible, raising the cost and difficulty of attacks forces adversaries toward easier targets. Prevention must be paired with detection and response since no preventive control is 100% effective.",
    source: "NIST Cybersecurity Framework",
  },
  {
    id: 88,
    answer: "ASSESSMENT",
    scrambled: "TNEMSSESSA",
    hint: "A formal evaluation of an organization's security posture to identify gaps",
    explanation: "Per NIST SP 800-30, a security risk assessment identifies threats, vulnerabilities, and existing controls to determine residual risk. Assessments include vulnerability scans, penetration tests, security audits, and control reviews. Regular assessments are required by most compliance frameworks and essential for prioritizing security investments where they have the greatest impact.",
    source: "NIST SP 800-30",
  },
  {
    id: 89,
    answer: "CYBERSPACE",
    scrambled: "ECAPSREBYC",
    hint: "The global digital environment of interconnected computer systems and networks",
    explanation: "Per NIST SP 800-30, cyberspace is the interdependent network of information technology infrastructures — the internet, telecommunications, and embedded processors. Attacks in cyberspace can cause real-world consequences — disrupting power grids, financial systems, and healthcare. National cybersecurity strategies address threats to critical cyberspace infrastructure at a societal level.",
    source: "NIST SP 800-30",
  },
  {
    id: 90,
    answer: "EXFILTRATE",
    scrambled: "ETARTLIFXE",
    hint: "Secretly stealing and transferring data out of a compromised network",
    explanation: "Per MITRE ATT&CK, exfiltration is the stage where an attacker transfers stolen data to attacker-controlled infrastructure. Methods include HTTPS transfers, DNS tunneling, and cloud storage uploads to blend in with legitimate traffic. Data Loss Prevention (DLP) tools, egress filtering, and anomaly-based network monitoring detect and block unauthorized data transfers.",
    source: "MITRE ATT&CK",
  },
];

const POOLS: Record<string, Question[]> = {
  easy:         EASY_POOL,
  intermediate: INTERMEDIATE_POOL,
  advanced:     ADVANCED_POOL,
};

const SESSION_KEY       = "hexora:jl:startTime";
const SESSION_ORDER_KEY = "hexora:jl:order";
const SESSION_INDEX_KEY = "hexora:jl:index";
const SESSION_END_KEY   = "hexora:jl:endTime";   // absolute ms timestamp when time runs out
const SESSION_PAUSE_KEY = "hexora:jl:pauseStart"; // ms timestamp when feedback began
const SESSION_PTS_KEY   = "hexora:jl:pts";
const SESSION_CORRECT_KEY = "hexora:jl:correct";
const SESSION_WRONG_KEY   = "hexora:jl:wrong";

type Phase = "ready" | "playing" | "feedback" | "done";

export default function JumbledLettersPage() {
  const router = useRouter();
  const { refreshProfile } = useUser();
  const [phase, setPhase] = useState<Phase>("ready");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [timeLeft, setTimeLeft] = useState<number>(DIFFICULTY_CONFIG.intermediate.duration);
  const [pts, setPts] = useState(0);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState("");
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [currentScramble, setCurrentScramble] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // On mount: gate check + resume if refreshed mid-game
  useEffect(() => {
    const alreadyPlaying   = sessionStorage.getItem(SESSION_KEY);
    const storedDifficulty = sessionStorage.getItem(DIFFICULTY_KEY) as Difficulty | null;
    const paid             = sessionStorage.getItem(HW_PAID_KEY);

    // Must have an active session OR have paid for this difficulty
    if (!alreadyPlaying && !(storedDifficulty && paid)) {
      router.replace("/home/games/hexo-words/difficulty");
      return;
    }

    const resolvedDifficulty: Difficulty =
      storedDifficulty && storedDifficulty in DIFFICULTY_CONFIG
        ? storedDifficulty
        : "intermediate";
    setDifficulty(resolvedDifficulty);

    if (alreadyPlaying) {
      let endTime = parseInt(sessionStorage.getItem(SESSION_END_KEY) ?? "0", 10);

      // If the user navigated away while in feedback, the pause was never closed.
      // Extend endTime by the elapsed pause duration so they don't lose that time.
      const pauseStart = parseInt(sessionStorage.getItem(SESSION_PAUSE_KEY) ?? "0", 10);
      if (pauseStart) {
        endTime += Date.now() - pauseStart;
        sessionStorage.setItem(SESSION_END_KEY, endTime.toString());
        sessionStorage.removeItem(SESSION_PAUSE_KEY);
      }

      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        setPts(parseInt(sessionStorage.getItem(SESSION_PTS_KEY) ?? "0", 10));
        setCorrectCount(parseInt(sessionStorage.getItem(SESSION_CORRECT_KEY) ?? "0", 10));
        setWrongCount(parseInt(sessionStorage.getItem(SESSION_WRONG_KEY) ?? "0", 10));
        clearSession();
        setPhase("done");
      } else {
        const storedOrder = sessionStorage.getItem(SESSION_ORDER_KEY);
        const storedIndex = sessionStorage.getItem(SESSION_INDEX_KEY);
        const orderedIds: number[] = storedOrder ? JSON.parse(storedOrder) : [];
        const restored =
          orderedIds.length > 0
            ? orderedIds.map((id) => (POOLS[resolvedDifficulty] ?? ADVANCED_POOL).find((q) => q.id === id)!).filter(Boolean)
            : shuffleArray(POOLS[resolvedDifficulty] ?? ADVANCED_POOL);
        setQuestions(restored);
        setScrambledWords(restored.map((q) => scrambleWord(q.answer)));
        setQIndex(storedIndex ? parseInt(storedIndex, 10) : 0);
        setPts(parseInt(sessionStorage.getItem(SESSION_PTS_KEY) ?? "0", 10));
        setCorrectCount(parseInt(sessionStorage.getItem(SESSION_CORRECT_KEY) ?? "0", 10));
        setWrongCount(parseInt(sessionStorage.getItem(SESSION_WRONG_KEY) ?? "0", 10));
        setTimeLeft(remaining);
        setPhase("playing");
      }
    }
    // If difficulty set but not started, stay on ready screen — startGame() will consume it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_ORDER_KEY);
    sessionStorage.removeItem(SESSION_INDEX_KEY);
    sessionStorage.removeItem(SESSION_END_KEY);
    sessionStorage.removeItem(SESSION_PAUSE_KEY);
    sessionStorage.removeItem(SESSION_PTS_KEY);
    sessionStorage.removeItem(SESSION_CORRECT_KEY);
    sessionStorage.removeItem(SESSION_WRONG_KEY);
    sessionStorage.removeItem(DIFFICULTY_KEY);
    sessionStorage.removeItem(HW_PAID_KEY);
  }

  // Submit result and clear session when game ends
  useEffect(() => {
    if (phase === "done") {
      const config = DIFFICULTY_CONFIG[difficulty];
      supabase.rpc("submit_game_result", {
        p_game_id: "hexo-words",
        p_score: pts,
        p_correct_answers: correctCount,
        p_total_questions: correctCount + wrongCount,
        p_duration_seconds: config.duration,
      }).then(() => refreshProfile());
      clearSession();
    }
  }, [phase]);

  // Re-scramble whenever the question index or question list changes
  useEffect(() => {
    const q = questions[qIndex];
    if (q) setCurrentScramble(scrambleWord(q.answer));
  }, [qIndex, questions]);

  // Countdown timer — derived from absolute endTime; paused only during feedback
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      const endTime = parseInt(sessionStorage.getItem(SESSION_END_KEY) ?? "0", 10);
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setPhase("done");
      }
    }, 500); // 500 ms for responsive display
    return () => clearInterval(id);
  }, [phase]);

  // Auto-focus input when returning to playing phase
  useEffect(() => {
    if (phase === "playing") {
      inputRef.current?.focus();
    }
  }, [phase, qIndex]);

  function startGame() {
    const config = DIFFICULTY_CONFIG[difficulty];
    const pool = POOLS[difficulty] ?? ADVANCED_POOL;
    const shuffled = shuffleArray(pool);
    const endTime = Date.now() + config.duration * 1000;
    sessionStorage.removeItem(HW_PAID_KEY);
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(shuffled.map((q) => q.id)));
    sessionStorage.setItem(SESSION_INDEX_KEY, "0");
    sessionStorage.setItem(SESSION_END_KEY, endTime.toString());
    sessionStorage.setItem(SESSION_PTS_KEY, "0");
    sessionStorage.setItem(SESSION_CORRECT_KEY, "0");
    sessionStorage.setItem(SESSION_WRONG_KEY, "0");
    setQuestions(shuffled);
    setScrambledWords(shuffled.map((q) => scrambleWord(q.answer)));
    setQIndex(0);
    setInput("");
    setTimeLeft(config.duration);
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

    const isCorrect = trimmed === questions[qIndex].answer.trim().toUpperCase();

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
      setWrongAnswer(questions[qIndex].answer);
      setWrongCount(newWrong);
      sessionStorage.setItem(SESSION_WRONG_KEY, newWrong.toString());
      setFeedback("wrong");
    }

    // Record when the explanation pause started so we can restore time if user navigates away
    sessionStorage.setItem(SESSION_PAUSE_KEY, Date.now().toString());
    setInput("");
    setPhase("feedback");
  }

  function handleNext() {
    // Restore the time lost during the explanation pause
    const pauseStart = parseInt(sessionStorage.getItem(SESSION_PAUSE_KEY) ?? "0", 10);
    if (pauseStart) {
      const endTime = parseInt(sessionStorage.getItem(SESSION_END_KEY) ?? "0", 10);
      sessionStorage.setItem(SESSION_END_KEY, (endTime + (Date.now() - pauseStart)).toString());
      sessionStorage.removeItem(SESSION_PAUSE_KEY);
    }

    const next = (qIndex + 1) % questions.length;
    sessionStorage.setItem(SESSION_INDEX_KEY, next.toString());
    setQIndex(next);
    setFeedback(null);
    setWrongAnswer("");
    setPhase("playing");
  }

  function handleSkip() {
    if (!questions.length || phase !== "playing") return;
    const next = (qIndex + 1) % questions.length;
    sessionStorage.setItem(SESSION_INDEX_KEY, next.toString());
    setQIndex(next);
    setInput("");
    // Stay in playing — no feedback, no time lost
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
    const config = DIFFICULTY_CONFIG[difficulty];
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const difficultyColor =
      difficulty === "easy" ? "text-emerald-400" :
      difficulty === "advanced" ? "text-orange-400" :
      "text-blue-400";

    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600">
              <Shuffle className="h-9 w-9 text-white" />
            </div>
          </div>

          <h1 className="mb-1 text-3xl font-bold text-white">HexoWords</h1>
          <p className={cn("mb-2 text-sm font-semibold", difficultyColor)}>{difficultyLabel}</p>
          <p className="mb-8 text-white/45">
            Unscramble cybersecurity terms before the clock hits zero. The more
            you get right, the more you earn!
          </p>

          <div className="mb-8 grid grid-cols-3 gap-4 rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{config.duration}s</p>
              <p className="mt-0.5 text-xs text-white/40">Timer</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-300">+{config.pts} pts</p>
              <p className="mt-0.5 text-xs text-white/40">Per correct</p>
            </div>
            <div className="text-center">
              <p className={cn("text-xl font-bold", config.showHint ? "text-emerald-400" : "text-red-400")}>
                {config.showHint ? "Yes" : "No"}
              </p>
              <p className="mt-0.5 text-xs text-white/40">Hints</p>
            </div>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-blue-600 py-6 text-base font-semibold text-white hover:bg-blue-500"
          >
            Start Game
          </Button>

          <button
            onClick={() => router.push("/home/games/hexo-words/difficulty")}
            className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/65"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change difficulty
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
              <span className="font-semibold text-amber-400">+{DIFFICULTY_CONFIG[difficulty].pts} pts</span>.
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
          {(currentScramble || scrambledWords[qIndex] || "").split("").map((letter, i) => (
            <div
              key={i}
              className="flex h-14 w-12 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-xl font-bold text-white"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Hint — hidden on advanced */}
        {DIFFICULTY_CONFIG[difficulty].showHint && (
          <p className="mb-6 text-center text-sm leading-relaxed text-white/45">
            {currentQ?.hint}
          </p>
        )}

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
          <Button
            type="button"
            onClick={handleSkip}
            className="border border-white/10 bg-transparent text-white/45 hover:bg-white/5 hover:text-white/70"
          >
            Skip
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
