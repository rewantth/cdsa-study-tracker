/* ---------- content: Stage 0 (basics) ---------- */
/* sec strings are "Title | one-line focus". Titles and counts match HTB Academy's public syllabus. */
var STAGE0 = [
 {id:'net', name:'Introduction to Networking', diff:'Fundamental', tier:'Core', slug:'introduction-to-networking',
  why:'Every alert, log line and packet capture in the path assumes you already know ports, protocols and how a connection is built. If this is shaky, Network Traffic Analysis and the IDS module will feel twice as hard.',
  learn:['How the OSI and TCP/IP models map onto real traffic','IPv4 addressing and subnetting by hand','What DNS, DHCP, HTTP, SMB, RDP and Kerberos do and which ports they use','TCP vs UDP, and what a normal handshake looks like'],
  practice:['Subnet ten random networks on paper until it is quick','Run Wireshark on your own machine, load one website, and find the DNS query, the TCP handshake and the HTTP request','Write a one-page port cheat sheet (53 DNS, 88 Kerberos, 445 SMB, 3389 RDP, 5985/5986 WinRM, 389/636 LDAP)'],
  can:['Explain what happens between typing a URL and the page loading','Work out the range, mask and broadcast of a /26','Tell a SYN scan from a normal connection in a capture'],
  sec:['Networking Overview | What the module covers and how it is laid out.','Network Types | LAN, WAN, WLAN, VPN: where each one sits.','Networking Topologies | Star, mesh, bus. Know what a switch vs a router does.','Proxies | Forward vs reverse proxies; why logs show the proxy IP.','Networking Models | Why layered models exist.','The OSI Model | Learn all seven layers and one protocol for each.','The TCP/IP Model | The four-layer version you will actually use.','Network Layer | Routing, hops, TTL.','IPv4 Addresses | Classes, private ranges, CIDR notation.','Subnetting | Do the exercises by hand until fast.','MAC Addresses | Layer 2 identity; what ARP resolves.','IPv6 Addresses | Format, shortening rules, link-local.','Networking Key Terminology | Vocabulary you will see in every later module.','Common Protocols | HTTP, FTP, SMB, DNS, SMTP and friends, with ports.','Wireless Networks | WPA basics and why Wi-Fi attacks leave traces.','Virtual Private Networks | Tunnels, and what a VPN hides from your logs.','Vendor Specific Information | Cisco-style device terms.','Key Exchange Mechanisms | Diffie-Hellman idea; no maths needed.','Authentication Protocols | Kerberos, NTLM, RADIUS at overview level.','TCP/UDP Connections | Handshake, flags, teardown. Needed for traffic analysis.','Cryptography | Hashing vs encryption vs signing.']},

 {id:'winf', name:'Windows Fundamentals', diff:'Fundamental', tier:'Core', slug:'windows-fundamentals',
  why:'The exam and most of the path are Windows telemetry. You cannot spot a rogue service, a strange registry key or a bad process tree without knowing what normal looks like.',
  learn:['How the file system, NTFS permissions and shares work','Registry hives and the keys attackers use for persistence','Services, processes and sessions, and which ones are normal','WMI, MMC and the built-in security features'],
  practice:['In a Windows VM, open Task Manager and Services and write down what is normal on a clean install','Browse the Run and RunOnce keys and learn what a legitimate entry looks like','Open Event Viewer and find one logon event (4624) yourself'],
  can:['Describe the parent and child you expect for explorer.exe, svchost.exe and services.exe','Name three registry locations used for persistence','Explain the difference between NTFS and share permissions'],
  sec:['Introduction to Windows | Versions and why the OS matters to defenders.','Operating System Structure | System folders: what lives in System32.','File System | NTFS features, alternate data streams.','NTFS vs. Share Permissions | Effective access when both apply.','Windows Registry | Hives, Run keys, persistence spots.','Windows Services & Processes | Normal parents; services.exe and svchost.exe.','Service Permissions | Weak service permissions as an attack path.','Windows Sessions | Interactive, service and network logons.','Interacting with the Windows Operating System | GUI, CMD, PowerShell, remote access.','Windows Management Instrumentation (WMI) | Used by admins and attackers alike.','Microsoft Management Console (MMC) | Snap-ins you will meet again in AD.','Windows Subsystem for Linux (WSL) | A blind spot for some tooling.','Desktop Experience vs. Server Core | What a server install looks like.','Windows Security | Defender, UAC, Credential Guard at overview level.','Skills Assessment - Windows Fundamentals | Do it without looking back at the notes.']},

 {id:'wcl', name:'Introduction to Windows Command Line', diff:'Easy', tier:'Core', slug:'introduction-to-windows-command-line',
  why:'You will pull evidence with PowerShell (Get-WinEvent, Get-Process, services, registry) and read attacker one-liners all the time. Reading a command line fluently is half of triage.',
  learn:['CMD and PowerShell navigation, files, services and scheduled tasks','Cmdlets, modules, pipelines and filtering','Querying the registry and the event log from the command line','Basic PowerShell scripting'],
  practice:['Use Get-WinEvent with -FilterHashtable to pull all 4625 events from the last day','List running processes with their parent process ID, then explain two of them','Write a three-line script that exports services set to auto-start'],
  can:['Filter an event log by ID and time range from PowerShell','Explain what a base64 -EncodedCommand argument is','List scheduled tasks and services without the GUI'],
  sec:['Introduction | Why the command line matters in IR.','Command Prompt Basics | Syntax, flags, redirection.','Getting Help | help, /?, Get-Help. Use them constantly.','System Navigation | cd, dir, pushd.','Working with Directories and Files - CMD | Create, copy, move, hide.','Gathering System Information | systeminfo, ver, hostname, whoami.','Finding Files and Directories | where, dir /s, findstr.','Environment Variables | %PATH% and why order matters.','Managing Services | sc and net start.','Working With Scheduled Tasks | schtasks: a favourite persistence spot.','CMD Vs. PowerShell | Objects vs text.','All About Cmdlets and Modules | Verb-Noun and Get-Command.','User and Group Management | Local users, groups, who is admin.','Working with Files and Directories - PowerShell | Get-ChildItem and friends.','Finding & Filtering Content | Select-String, Where-Object.','Working with Services | Get-Service, Set-Service.','Working with the Registry | Reading and writing keys.','Working with the Windows Event Log | Get-WinEvent. Direct exam skill.','Networking Management from The CLI | netstat, Get-NetTCPConnection.','Interacting with The Web | Invoke-WebRequest: how downloaders work.','PowerShell Scripting and Automation | Loops, functions, simple scripts.','Skills Assessment | Time yourself.','Beyond This Module | Where to go next.']},

 {id:'ad', name:'Introduction to Active Directory', diff:'Fundamental', tier:'Core', slug:'introduction-to-active-directory',
  why:'Windows Attacks & Defense and Detecting Windows Attacks with Splunk are all Active Directory. Most real intrusions end up in a domain, and so does the exam.',
  learn:['Domains, forests, OUs, objects, users, computers and groups','How Kerberos, NTLM, LDAP and DNS fit together','Privileges, rights and Group Policy','Why a domain controller is the prize'],
  practice:['Draw a small forest with two domains and mark where Domain Admins live','Write down the Kerberos steps (AS-REQ, TGT, TGS) in your own words','Find out which GPO would disable logging and why that matters'],
  can:['Explain TGT vs service ticket in two sentences','Say why NTLM leaves different traces than Kerberos','Name five default privileged groups'],
  sec:['Why Active Directory? | Where AD fits in a company.','Active Directory Research Over the Years | Why attacks keep working.','Active Directory Structure | Forest, domain, tree, OU.','Active Directory Terminology | Learn the glossary; it is reused everywhere.','Active Directory Objects | Users, computers, contacts, GPOs.','Active Directory Functionality | FSMO roles, replication, trusts.','Kerberos, DNS, LDAP, MSRPC | The core protocols. Take your time.','NTLM Authentication | Challenge-response; pass-the-hash relies on it.','User and Machine Accounts | Local vs domain; service accounts.','Active Directory Groups | Built-in privileged groups.','Active Directory Rights and Privileges | SeDebug, SeBackup and friends.','Security in Active Directory | Hardening ideas you will later detect against.','Examining Group Policy | How settings reach machines.','AD Administration: Guided Lab Part I | Do the lab, do not skip it.','AD Administration: Guided Lab Part II | Same.','Wrapping It Up | Recap.']},

 {id:'web', name:'Web Requests', diff:'Fundamental', tier:'Skim', slug:'web-requests',
  why:'Short module. HTTP methods, headers and status codes show up in proxy logs, web server logs and Intermediate Network Traffic Analysis.',
  learn:['HTTP and HTTPS basics','Requests, responses, headers, methods and status codes','GET, POST and a simple CRUD API'],
  practice:['Use curl -v on a site and read every header','Find one 301, one 403 and one 500 response and explain each'],
  can:['Read a raw HTTP request','Explain what a User-Agent and Referer are'],
  sec:['HyperText Transfer Protocol (HTTP)','Hypertext Transfer Protocol Secure (HTTPS)','HTTP Requests and Responses','HTTP Headers','HTTP Methods and Codes','GET','POST','CRUD API']},

 {id:'nmap', name:'Network Enumeration with Nmap', diff:'Easy', tier:'Skim', slug:'network-enumeration-with-nmap',
  why:'You will be on the receiving end of scans. Knowing what a SYN scan or a script scan looks like in traffic and logs is the useful part; the evasion labs are optional.',
  learn:['Host discovery and port scan types','Service and version detection','The scripting engine and how scan speed changes the noise'],
  practice:['Scan your own VM with -sS and then -sT while capturing in Wireshark and compare','Note which packets reveal the scan type'],
  can:['Spot a SYN scan in a capture','Explain what -sV adds'],
  sec:['Enumeration','Introduction to Nmap','Host Discovery','Host and Port Scanning','Saving the Results','Service Enumeration','Nmap Scripting Engine','Performance','Firewall and IDS/IPS Evasion','Firewall and IDS/IPS Evasion - Easy Lab','Firewall and IDS/IPS Evasion - Medium Lab','Firewall and IDS/IPS Evasion - Hard Lab']},

 {id:'ptp', name:'Penetration Testing Process', diff:'Fundamental', tier:'Skim', slug:'penetration-testing-process',
  why:'Gives you the attacker side of the story: the stages you will be recognising in logs. Read it for the vocabulary.',
  learn:['The stages of a penetration test','Pre-engagement, exploitation, post-exploitation and lateral movement','Laws, scope and reporting'],
  practice:['Map each stage to the Cyber Kill Chain and to a MITRE ATT&CK tactic'],
  can:['Say what an attacker is doing at each stage and what you would see'],
  sec:['Introduction to the Penetration Tester Path','Academy Modules Layout','Academy Exercises & Questions','Penetration Testing Overview','Laws and Regulations','Penetration Testing Process','Pre-Engagement','Information Gathering','Vulnerability Assessment','Exploitation','Post-Exploitation','Lateral Movement','Proof-of-Concept','Post-Engagement','Practice']},

 {id:'lin', name:'Linux Fundamentals', diff:'Fundamental', tier:'Later', slug:'linux-fundamentals',
  why:'Lower priority for a Windows-heavy exam, but you will meet Linux in YARA, Zeek, Suricata and web logs. Do it if you have time or Linux commands slow you down.',
  learn:['File system layout, permissions and users','Processes, services, cron and logs under /var/log','Everyday shell tools: grep, awk, find, redirection'],
  practice:['Read /var/log/auth.log (or journalctl) and find a failed SSH login','Use grep and cut to count the top source IPs in a log'],
  can:['Read a permission string like -rwsr-xr-x','Find which user ran a cron job'],
  sec:['Linux Structure','Linux Distributions','Introduction to Shell','Prompt Description','Getting Help','System Information','Navigation','Working with Files and Directories','Editing Files','Find Files and Directories','File Descriptors and Redirections','Filter Contents','Regular Expressions','Permission Management','User Management','Package Management','Service and Process Management','Task Scheduling','Network Services','Working with Web Services','Backup and Restore','File System Management','Containerization','Network Configuration','Remote Desktop Protocols in Linux','Linux Security','Firewall Setup','System Logs and Monitoring','Solaris','Shortcuts']},

 {id:'bash', name:'Introduction to Bash Scripting', diff:'Easy', tier:'Later', slug:'introduction-to-bash-scripting',
  why:'Nice to have for log wrangling. Skip it if you are short on time; PowerShell matters more for this exam.',
  learn:['Variables, conditions, loops and functions','Reading and writing small scripts'],
  practice:['Write a script that counts failed logins per IP from a log file'],
  can:['Read a ten-line Bash script and say what it does'],
  sec:['Bourne Again Shell','Conditional Execution','Arguments, Variables, and Arrays','Comparison Operators','Arithmetic','Input and Output Control','Flow Control - Loops','Flow Control - Branches','Functions','Debugging']},

 {id:'asm', name:'Intro to Assembly Language', diff:'Medium', tier:'Later', slug:'intro-to-assembly-language',
  why:'Only worth it right before Introduction to Malware Analysis, and only if that module loses you. You do not need shellcoding to pass CDSA.',
  learn:['CPU architecture, registers and the stack','Reading x86-64 instructions and using GDB'],
  practice:['Open a tiny binary in GDB and step through the first ten instructions'],
  can:['Recognise mov, push, pop, call and jmp','Explain what a syscall is'],
  sec:['Assembly Language','Computer Architecture','CPU Architecture','Instruction Set Architectures','Registers, Addresses, and Data Types','Assembly File Structure','Assembling & Disassembling','GNU Debugger (GDB)','Debugging with GDB','Module Project','Data Movement','Arithmetic Instructions','Loops','Unconditional Branching','Conditional Branching','Using the Stack','Syscalls','Procedures','Functions','Libc Functions','Shellcodes','Shellcoding Techniques','Shellcoding Tools','Skills Assessment']}
];

